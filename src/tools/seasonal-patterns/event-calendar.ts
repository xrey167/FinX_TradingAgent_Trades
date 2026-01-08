/**
 * Event Calendar for Seasonal Pattern Analysis
 * Tracks market-moving events: FOMC meetings, options expiry, earnings seasons
 */

export interface CalendarEvent {
  date: Date;
  name: string;
  type: 'fomc' | 'options-expiry' | 'earnings-season' | 'economic' | 'political' | 'custom';
  impact: 'high' | 'medium' | 'low';
  description?: string;
  ticker?: string; // For ticker-specific events (e.g., earnings)
}

export interface EventCalendarConfig {
  fomcMeetings?: string[]; // ISO dates
  customEvents?: Array<{
    date: string;
    name: string;
    type: string;
    impact: 'high' | 'medium' | 'low';
    description?: string;
    ticker?: string;
  }>;
  optionsExpiry?: {
    enabled: boolean;
    type: 'monthly_third_friday';
  };
  earningsSeasons?: {
    enabled: boolean;
    months: number[]; // 1-based months (1=Jan, 4=Apr, 7=Jul, 10=Oct)
  };
}

export class EventCalendar {
  private events: CalendarEvent[] = [];
  private fomcDates: Date[] = [];
  private optionsExpiryEnabled: boolean = true;
  private earningsSeasonsEnabled: boolean = true;
  private earningsMonths: number[] = [1, 4, 7, 10]; // Jan, Apr, Jul, Oct

  /**
   * Default FOMC meeting dates (2024-2026)
   * Source: federalreserve.gov
   */
  private static DEFAULT_FOMC_DATES = [
    // 2024
    '2024-01-31', '2024-03-20', '2024-05-01', '2024-06-12',
    '2024-07-31', '2024-09-18', '2024-11-07', '2024-12-18',
    // 2025
    '2025-01-29', '2025-03-19', '2025-05-07', '2025-06-18',
    '2025-07-30', '2025-09-17', '2025-11-05', '2025-12-17',
    // 2026
    '2026-01-28', '2026-03-18', '2026-04-29', '2026-06-17',
    '2026-07-29', '2026-09-23', '2026-11-04', '2026-12-16',
  ];

  constructor(config?: EventCalendarConfig) {
    // Initialize FOMC dates
    const fomcDates = config?.fomcMeetings || EventCalendar.DEFAULT_FOMC_DATES;
    this.fomcDates = fomcDates.map(dateStr => new Date(dateStr));
    this.events.push(
      ...this.fomcDates.map(date => ({
        date,
        name: 'FOMC Meeting',
        type: 'fomc' as const,
        impact: 'high' as const,
        description: 'Federal Reserve interest rate decision',
      }))
    );

    // Options expiry configuration
    if (config?.optionsExpiry) {
      this.optionsExpiryEnabled = config.optionsExpiry.enabled;
    }

    // Earnings seasons configuration
    if (config?.earningsSeasons) {
      this.earningsSeasonsEnabled = config.earningsSeasons.enabled;
      this.earningsMonths = config.earningsSeasons.months;
    }

    // Add custom events
    if (config?.customEvents) {
      this.events.push(
        ...config.customEvents.map(evt => ({
          date: new Date(evt.date),
          name: evt.name,
          type: evt.type as CalendarEvent['type'],
          impact: evt.impact,
          description: evt.description,
          ticker: evt.ticker,
        }))
      );
    }
  }

  /**
   * Check if a date falls within an event week
   */
  isEventWeek(date: Date, eventType: CalendarEvent['type']): boolean {
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    const matchingEvents = this.events.filter(
      evt => evt.type === eventType && evt.date >= weekStart && evt.date <= weekEnd
    );

    return matchingEvents.length > 0;
  }

  /**
   * Check if date is an options expiry week (3rd Friday)
   */
  isOptionsExpiryWeek(date: Date): boolean {
    if (!this.optionsExpiryEnabled) return false;

    const expiryDate = this.getMonthlyOptionsExpiry(date.getFullYear(), date.getMonth());
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    return expiryDate >= weekStart && expiryDate <= weekEnd;
  }

  /**
   * Check if date is in earnings season
   */
  isEarningsSeason(date: Date): boolean {
    if (!this.earningsSeasonsEnabled) return false;

    const month = date.getMonth() + 1; // Convert to 1-based
    return this.earningsMonths.includes(month);
  }

  /**
   * Check if date is FOMC week
   */
  isFOMCWeek(date: Date): boolean {
    return this.isEventWeek(date, 'fomc');
  }

  /**
   * Get all events for a given date
   */
  getEventsForDate(date: Date): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // Check week-based events
    if (this.isFOMCWeek(date)) {
      events.push({
        date,
        name: 'FOMC Week',
        type: 'fomc',
        impact: 'high',
        description: 'Week containing Federal Reserve meeting',
      });
    }

    if (this.isOptionsExpiryWeek(date)) {
      events.push({
        date,
        name: 'Options Expiry Week',
        type: 'options-expiry',
        impact: 'medium',
        description: 'Week containing monthly options expiration (3rd Friday)',
      });
    }

    if (this.isEarningsSeason(date)) {
      events.push({
        date,
        name: 'Earnings Season',
        type: 'earnings-season',
        impact: 'medium',
        description: 'Quarterly earnings reporting period',
      });
    }

    // Add exact date events
    const dateStr = date.toISOString().split('T')[0];
    const exactEvents = this.events.filter(evt => {
      const evtDateStr = evt.date.toISOString().split('T')[0];
      return evtDateStr === dateStr;
    });

    events.push(...exactEvents);

    return events;
  }

  /**
   * Calculate 3rd Friday of month (monthly options expiry)
   */
  private getMonthlyOptionsExpiry(year: number, month: number): Date {
    const date = new Date(year, month, 1);

    // Find all Fridays in the month
    let fridayCount = 0;
    while (date.getMonth() === month) {
      if (date.getDay() === 5) {
        // Friday
        fridayCount++;
        if (fridayCount === 3) {
          return new Date(date);
        }
      }
      date.setDate(date.getDate() + 1);
    }

    // Fallback: return last day of month if 3rd Friday not found
    return new Date(year, month + 1, 0);
  }

  /**
   * Get start of week (Monday)
   */
  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Sunday = -6, others = 1 - day
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of week (Sunday)
   */
  private getWeekEnd(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Load calendar config from file
   */
  static fromFile(filePath: string): EventCalendar {
    try {
      const fs = require('fs');
      const configData = fs.readFileSync(filePath, 'utf-8');
      const config = JSON.parse(configData) as EventCalendarConfig;
      return new EventCalendar(config);
    } catch (error) {
      console.warn(`Failed to load event calendar from ${filePath}, using defaults`);
      return new EventCalendar();
    }
  }
}
