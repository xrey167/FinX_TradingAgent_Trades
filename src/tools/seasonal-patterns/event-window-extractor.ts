/**
 * Event Window Extractor - Issue #16
 * Analyzes price patterns in windows around events (T-N to T+N pattern detection)
 *
 * Provides configurable event window analysis for detecting:
 * - Pre-event drift: Days/hours before events
 * - Event-day behavior: Volatility and direction on event day
 * - Post-event continuation: Patterns after events
 *
 * Supports multiple event types: FOMC, CPI, NFP, Options Expiry, etc.
 * Configurable window sizes: T-5 to T+5 (default), or custom windows
 */

import type { PeriodExtractor, PeriodType, SeasonalTimeframe } from './types.ts';
import { EventCalendar, type CalendarEvent } from './event-calendar.ts';

export interface EventWindowConfig {
  /**
   * Event type to analyze
   * - 'fomc': Federal Reserve meetings
   * - 'cpi': Consumer Price Index releases
   * - 'nfp': Non-Farm Payroll releases
   * - 'options-expiry': Monthly options expiration (3rd Friday)
   * - 'earnings-season': Quarterly earnings seasons
   * - 'triple-witching': Triple witching days (Mar/Jun/Sep/Dec)
   * - 'gdp-release': GDP release days
   * - 'election': Election event windows
   * - 'dividend-ex-date': Dividend ex-date windows (requires symbol)
   * - 'index-rebalancing': Index rebalancing windows
   * - 'economic': Generic economic indicator releases
   * - 'political': Political events
   * - 'custom': Custom events
   */
  eventType: CalendarEvent['type'];

  /**
   * Window size in days (T-N to T+N)
   * Default: 5 (T-5 to T+5, 11-day window)
   * Common windows:
   * - 5: Standard window for most events
   * - 3: Shorter window for less impactful events
   * - 10: Extended window for major events (elections, etc.)
   */
  windowSize?: number;

  /**
   * Timeframe for analysis
   * - 'daily': Daily candles (default)
   * - 'hourly': Hourly candles (for intraday patterns)
   * - '5min': 5-minute candles (for high-frequency patterns)
   */
  timeframe?: SeasonalTimeframe;

  /**
   * Symbol for symbol-specific events (e.g., dividend ex-dates)
   * Optional for most event types
   */
  symbol?: string;

  /**
   * Label prefix for generated period labels
   * Default: Derived from eventType (e.g., "FOMC", "CPI", "NFP")
   */
  labelPrefix?: string;

  /**
   * Skip weekends when counting days
   * Default: true (count trading days only)
   * Set to false for calendar days
   */
  skipWeekends?: boolean;

  /**
   * Skip market holidays when counting days
   * Default: true (count trading days only)
   * Set to false for calendar days
   */
  skipHolidays?: boolean;
}

/**
 * Event Window Extractor
 * Implements T-N to T+N pattern detection around market events
 *
 * Example Usage:
 * ```typescript
 * // Analyze FOMC meeting windows (T-5 to T+5)
 * const extractor = new EventWindowExtractor(eventCalendar, {
 *   eventType: 'fomc',
 *   windowSize: 5,
 * });
 *
 * // Check if a date falls within an event window
 * const label = extractor.extract(timestamp);
 * // Returns: "FOMC-T-5", "FOMC-T-1", "FOMC-T+0", "FOMC-T+3", etc.
 * ```
 *
 * Pattern Detection:
 * - Pre-event drift: T-2 to T-1 (positioning before announcement)
 * - Event day: T+0 (high volatility, direction uncertain)
 * - Post-event: T+1 to T+3 (continuation or reversal patterns)
 */
export class EventWindowExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe: SeasonalTimeframe;

  private readonly eventType: CalendarEvent['type'];
  private readonly windowSize: number;
  private readonly labelPrefix: string;
  private readonly skipWeekends: boolean;
  private readonly skipHolidays: boolean;
  private readonly symbol?: string;

  // Cache for event dates to avoid repeated calculations
  private eventDatesCache: Map<string, Date[]> = new Map();

  // US market holidays (simplified - major holidays only)
  private static readonly US_MARKET_HOLIDAYS = [
    // 2024
    '2024-01-01', // New Year's Day
    '2024-01-15', // MLK Day
    '2024-02-19', // Presidents' Day
    '2024-03-29', // Good Friday
    '2024-05-27', // Memorial Day
    '2024-06-19', // Juneteenth
    '2024-07-04', // Independence Day
    '2024-09-02', // Labor Day
    '2024-11-28', // Thanksgiving
    '2024-12-25', // Christmas
    // 2025
    '2025-01-01', // New Year's Day
    '2025-01-20', // MLK Day
    '2025-02-17', // Presidents' Day
    '2025-04-18', // Good Friday
    '2025-05-26', // Memorial Day
    '2025-06-19', // Juneteenth
    '2025-07-04', // Independence Day
    '2025-09-01', // Labor Day
    '2025-11-27', // Thanksgiving
    '2025-12-25', // Christmas
    // 2026
    '2026-01-01', // New Year's Day
    '2026-01-19', // MLK Day
    '2026-02-16', // Presidents' Day
    '2026-04-03', // Good Friday
    '2026-05-25', // Memorial Day
    '2026-06-19', // Juneteenth
    '2026-07-03', // Independence Day (observed)
    '2026-09-07', // Labor Day
    '2026-11-26', // Thanksgiving
    '2026-12-25', // Christmas
  ];

  private static holidaySet: Set<string> = new Set(EventWindowExtractor.US_MARKET_HOLIDAYS);

  constructor(protected calendar: EventCalendar, config: EventWindowConfig) {
    this.eventType = config.eventType;
    this.windowSize = config.windowSize ?? 5;
    this.requiredTimeframe = config.timeframe ?? 'daily';
    this.skipWeekends = config.skipWeekends ?? true;
    this.skipHolidays = config.skipHolidays ?? true;
    this.symbol = config.symbol;

    // Determine label prefix based on event type
    this.labelPrefix = config.labelPrefix ?? this.getDefaultLabelPrefix(config.eventType);
  }

  /**
   * Extract event window position for a given timestamp
   *
   * @param timestamp - Unix timestamp in milliseconds
   * @returns Period label (e.g., "FOMC-T-5", "CPI-T+3") or null if not in window
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);

    // Get event dates for this event type
    const eventDates = this.getEventDates(date.getFullYear());

    // Find nearest event and calculate window position
    for (const eventDate of eventDates) {
      const position = this.calculateWindowPosition(date, eventDate);

      if (position !== null && Math.abs(position) <= this.windowSize) {
        return this.formatLabel(position);
      }
    }

    return null;
  }

  /**
   * Calculate window position relative to event date
   * Returns positive for days after event, negative for days before
   *
   * @param date - Date to check
   * @param eventDate - Event date
   * @returns Position in window (e.g., -5, -1, 0, +3, +5) or null if outside window
   */
  private calculateWindowPosition(date: Date, eventDate: Date): number | null {
    if (this.skipWeekends || this.skipHolidays) {
      return this.calculateTradingDaysOffset(date, eventDate);
    } else {
      return this.calculateCalendarDaysOffset(date, eventDate);
    }
  }

  /**
   * Calculate offset in calendar days
   */
  private calculateCalendarDaysOffset(date: Date, eventDate: Date): number | null {
    const dateTime = this.normalizeDate(date).getTime();
    const eventDateTime = this.normalizeDate(eventDate).getTime();
    const dayInMs = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((dateTime - eventDateTime) / dayInMs);

    // Check if within window
    if (Math.abs(diffDays) <= this.windowSize) {
      return diffDays;
    }

    return null;
  }

  /**
   * Calculate offset in trading days (skipping weekends and holidays)
   */
  private calculateTradingDaysOffset(date: Date, eventDate: Date): number | null {
    const normalizedDate = this.normalizeDate(date);
    const normalizedEventDate = this.normalizeDate(eventDate);

    // Determine direction
    const isAfter = normalizedDate >= normalizedEventDate;
    const startDate = isAfter ? normalizedEventDate : normalizedDate;
    const endDate = isAfter ? normalizedDate : normalizedEventDate;

    // Count trading days between dates
    let tradingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      currentDate.setDate(currentDate.getDate() + 1);

      if (this.isTradingDay(currentDate)) {
        tradingDays++;
      }
    }

    // Apply direction
    const offset = isAfter ? tradingDays : -tradingDays;

    // Check if within window
    if (Math.abs(offset) <= this.windowSize) {
      return offset;
    }

    return null;
  }

  /**
   * Check if a date is a trading day (not weekend or holiday)
   */
  private isTradingDay(date: Date): boolean {
    // Check weekend
    if (this.skipWeekends) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Sunday or Saturday
        return false;
      }
    }

    // Check holidays
    if (this.skipHolidays) {
      const dateStr = date.toISOString().split('T')[0];
      if (EventWindowExtractor.holidaySet.has(dateStr!)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Normalize date to midnight UTC for consistent comparisons
   */
  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Format window position as label
   * Examples: "FOMC-T-5", "FOMC-T+0", "CPI-T+3"
   */
  private formatLabel(position: number): string {
    if (position === 0) {
      return `${this.labelPrefix}-T+0`;
    } else if (position > 0) {
      return `${this.labelPrefix}-T+${position}`;
    } else {
      return `${this.labelPrefix}-T${position}`; // Negative sign included
    }
  }

  /**
   * Get event dates for a given year from the calendar
   */
  private getEventDates(year: number): Date[] {
    const cacheKey = `${this.eventType}-${year}-${this.symbol || ''}`;

    if (this.eventDatesCache.has(cacheKey)) {
      return this.eventDatesCache.get(cacheKey)!;
    }

    const dates: Date[] = [];

    // Get all dates for the year and surrounding years (to catch cross-year windows)
    for (let y = year - 1; y <= year + 1; y++) {
      for (let month = 0; month < 12; month++) {
        for (let day = 1; day <= 31; day++) {
          try {
            const date = new Date(y, month, day);
            if (date.getMonth() !== month) break; // Invalid date (e.g., Feb 31)

            // Check if this date has the event we're looking for
            if (this.isEventDate(date)) {
              dates.push(date);
            }
          } catch {
            break;
          }
        }
      }
    }

    this.eventDatesCache.set(cacheKey, dates);
    return dates;
  }

  /**
   * Check if a date matches the event type
   */
  protected isEventDate(date: Date): boolean {
    switch (this.eventType) {
      case 'fomc':
        return this.calendar.isFOMCWeek(date) && this.isEventExactDate(date, 'fomc');

      case 'options-expiry':
        return this.calendar.isOptionsExpiryWeek(date) && this.isThirdFriday(date);

      case 'earnings-season':
        return this.calendar.isEarningsSeason(date);

      case 'triple-witching':
        return this.calendar.isTripleWitchingWeek(date) && this.isThirdFriday(date);

      case 'gdp-release':
        return this.calendar.isGDPReleaseWeek(date);

      case 'election':
        return this.calendar.isElectionEventWindow(date);

      case 'index-rebalancing':
        return this.calendar.isIndexRebalancingWindow(date);

      case 'economic':
        // For CPI and NFP, use specific methods
        return this.calendar.isCPIReleaseDay(date) || this.calendar.isNFPReleaseDay(date);

      default:
        // For other event types, check if any event exists on this date
        return this.isEventExactDate(date, this.eventType);
    }
  }

  /**
   * Check if a date is an exact event date (not just event week)
   */
  private isEventExactDate(date: Date, eventType: CalendarEvent['type']): boolean {
    const events = this.calendar.getEventsForDate(date);
    return events.some(event => event.type === eventType);
  }

  /**
   * Check if date is third Friday of month
   */
  private isThirdFriday(date: Date): boolean {
    if (date.getDay() !== 5) return false; // Not Friday

    const dayOfMonth = date.getDate();
    return dayOfMonth >= 15 && dayOfMonth <= 21;
  }

  /**
   * Get default label prefix based on event type
   */
  private getDefaultLabelPrefix(eventType: CalendarEvent['type']): string {
    const prefixMap: Record<CalendarEvent['type'], string> = {
      'fomc': 'FOMC',
      'options-expiry': 'OpEx',
      'earnings-season': 'Earnings',
      'economic': 'Econ',
      'political': 'Political',
      'custom': 'Custom',
      'triple-witching': 'TripleWitch',
      'gdp-release': 'GDP',
      'election': 'Election',
      'dividend-ex-date': 'DivEx',
      'index-rebalancing': 'Rebalance',
    };

    return prefixMap[eventType] || 'Event';
  }

  /**
   * Get all window positions for analysis
   * Returns array of positions from T-N to T+N
   */
  getWindowPositions(): number[] {
    const positions: number[] = [];
    for (let i = -this.windowSize; i <= this.windowSize; i++) {
      positions.push(i);
    }
    return positions;
  }

  /**
   * Get all window labels for analysis
   * Returns array of labels like ["FOMC-T-5", ..., "FOMC-T+0", ..., "FOMC-T+5"]
   */
  getWindowLabels(): string[] {
    return this.getWindowPositions().map(pos => this.formatLabel(pos));
  }
}

/**
 * Specialized FOMC Window Extractor
 * Pre-configured for FOMC meeting analysis (T-5 to T+5)
 *
 * Detects common FOMC patterns:
 * - Pre-FOMC drift: T-2 to T-1 (typically positive)
 * - FOMC day: T+0 (high volatility, 2:00 PM announcement)
 * - Post-FOMC: T+1 to T+3 (continuation or reversal)
 */
export class FOMCWindowExtractor extends EventWindowExtractor {
  constructor(calendar: EventCalendar, windowSize: number = 5) {
    super(calendar, {
      eventType: 'fomc',
      windowSize,
      labelPrefix: 'FOMC',
      timeframe: 'daily',
    });
  }
}

/**
 * Specialized CPI Window Extractor
 * Pre-configured for CPI release analysis (T-5 to T+5)
 *
 * Detects common CPI patterns:
 * - Pre-CPI: T-2 to T-1 (reduced volatility, positioning)
 * - CPI day: T+0 (8:30 AM spike, highest volatility)
 * - Post-CPI: T+1 to T+2 (continuation of trend)
 */
export class CPIWindowExtractor extends EventWindowExtractor {
  constructor(calendar: EventCalendar, windowSize: number = 5) {
    super(calendar, {
      eventType: 'economic',
      windowSize,
      labelPrefix: 'CPI',
      timeframe: 'daily',
    });
  }

  /**
   * Override to specifically detect CPI events
   */
  protected override isEventDate(date: Date): boolean {
    return this.calendar.isCPIReleaseDay(date);
  }
}

/**
 * Specialized NFP Window Extractor
 * Pre-configured for NFP (Non-Farm Payroll) analysis (T-5 to T+5)
 *
 * Detects common NFP patterns:
 * - Pre-NFP: T-1 (typically quiet on Thursday before)
 * - NFP day: T+0 (8:30 AM spike, extreme volatility)
 * - Post-NFP: T+1 to T+2 (high volatility continues)
 */
export class NFPWindowExtractor extends EventWindowExtractor {
  constructor(calendar: EventCalendar, windowSize: number = 5) {
    super(calendar, {
      eventType: 'economic',
      windowSize,
      labelPrefix: 'NFP',
      timeframe: 'daily',
    });
  }

  /**
   * Override to specifically detect NFP events
   */
  protected override isEventDate(date: Date): boolean {
    return this.calendar.isNFPReleaseDay(date);
  }
}

/**
 * Specialized Options Expiry Window Extractor
 * Pre-configured for monthly options expiration (T-3 to T+1)
 *
 * Detects common OpEx patterns:
 * - Pre-expiry: T-3 to T-1 (pinning, gamma squeeze)
 * - Expiry day: T+0 (3rd Friday, high volume)
 * - Post-expiry: T+1 (reversal or continuation)
 */
export class OptionsExpiryWindowExtractor extends EventWindowExtractor {
  constructor(calendar: EventCalendar, windowSize: number = 3) {
    super(calendar, {
      eventType: 'options-expiry',
      windowSize,
      labelPrefix: 'OpEx',
      timeframe: 'daily',
    });
  }
}
