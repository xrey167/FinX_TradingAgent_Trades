/**
 * Event Calendar for Seasonal Pattern Analysis
 * Tracks market-moving events: FOMC meetings, options expiry, earnings seasons
 */

import type { MarketSector } from './sector-definitions.ts';

export interface CalendarEvent {
  date: Date;
  name: string;
  type: 'fomc' | 'options-expiry' | 'earnings-season' | 'economic' | 'political' | 'custom' | 'triple-witching' | 'gdp-release' | 'election' | 'dividend-ex-date' | 'index-rebalancing';
  impact: 'high' | 'medium' | 'low';
  description?: string;
  ticker?: string; // For ticker-specific events (e.g., earnings, dividends)
  sectors?: MarketSector[]; // Affected market sectors (Issue #18)
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
  private cpiDates: Date[] = [];
  private optionsExpiryEnabled: boolean = true;
  private earningsSeasonsEnabled: boolean = true;
  private earningsMonths: number[] = [1, 4, 7, 10]; // Jan, Apr, Jul, Oct
  private dividendCache: Map<string, { exDates: Date[]; timestamp: number }> = new Map();
  private eodhd: any; // EODHD client instance (optional)

  // Performance optimization: Event indexes for O(1) lookups
  private eventsByYearMonth: Map<string, CalendarEvent[]> = new Map();
  private eventsByType: Map<CalendarEvent['type'], CalendarEvent[]> = new Map();
  private eventsByDate: Map<string, CalendarEvent[]> = new Map();
  private weekCache: Map<string, { weekStart: Date; weekEnd: Date }> = new Map();

  /**
   * US Market Holidays (NYSE/NASDAQ closures)
   * 2024-2035 calendar
   * Source: NYSE Holiday Schedule
   */
  private static US_MARKET_HOLIDAYS = [
    // 2024
    '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29',
    '2024-05-27', '2024-06-19', '2024-07-04', '2024-09-02',
    '2024-11-28', '2024-12-25',
    // 2025
    '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18',
    '2025-05-26', '2025-06-19', '2025-07-04', '2025-09-01',
    '2025-11-27', '2025-12-25',
    // 2026
    '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03',
    '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07',
    '2026-11-26', '2026-12-25',
    // 2027
    '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26',
    '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06',
    '2027-11-25', '2027-12-24',
    // 2028
    '2028-01-17', '2028-02-21', '2028-04-14', '2028-05-29',
    '2028-06-19', '2028-07-04', '2028-09-04', '2028-11-23',
    '2028-12-25',
    // 2029
    '2029-01-01', '2029-01-15', '2029-02-19', '2029-03-30',
    '2029-05-28', '2029-06-19', '2029-07-04', '2029-09-03',
    '2029-11-22', '2029-12-25',
    // 2030
    '2030-01-01', '2030-01-21', '2030-02-18', '2030-04-19',
    '2030-05-27', '2030-06-19', '2030-07-04', '2030-09-02',
    '2030-11-28', '2030-12-25',
    // 2031
    '2031-01-01', '2031-01-20', '2031-02-17', '2031-04-11',
    '2031-05-26', '2031-06-19', '2031-07-04', '2031-09-01',
    '2031-11-27', '2031-12-25',
    // 2032
    '2032-01-01', '2032-01-19', '2032-02-16', '2032-03-26',
    '2032-05-31', '2032-06-18', '2032-07-05', '2032-09-06',
    '2032-11-25', '2032-12-24',
    // 2033
    '2033-01-17', '2033-02-21', '2033-04-15', '2033-05-30',
    '2033-06-20', '2033-07-04', '2033-09-05', '2033-11-24',
    '2033-12-26',
    // 2034
    '2034-01-02', '2034-01-16', '2034-02-20', '2034-04-07',
    '2034-05-29', '2034-06-19', '2034-07-04', '2034-09-04',
    '2034-11-23', '2034-12-25',
    // 2035
    '2035-01-01', '2035-01-15', '2035-02-19', '2035-03-23',
    '2035-05-28', '2035-06-19', '2035-07-04', '2035-09-03',
    '2035-11-22', '2035-12-25',
  ];

  /**
   * Set for O(1) holiday lookups
   */
  private static readonly holidaySet = new Set(EventCalendar.US_MARKET_HOLIDAYS);

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

  /**
   * US Election dates (2024-2032)
   * First Tuesday after first Monday in November
   * Source: Federal Election Commission
   */
  private static ELECTION_DATES = [
    { date: '2024-11-05', type: 'Presidential' as const },
    { date: '2026-11-03', type: 'Midterm' as const },
    { date: '2028-11-07', type: 'Presidential' as const },
    { date: '2030-11-05', type: 'Midterm' as const },
    { date: '2032-11-02', type: 'Presidential' as const },
  ];

  /**
   * CPI (Consumer Price Index) release dates (2024-2026)
   * Released 2nd/3rd week of each month at 8:30 AM EST
   * Source: Bureau of Labor Statistics
   * 12 releases per year - major market mover for inflation expectations
   */
  private static DEFAULT_CPI_DATES = [
    // 2024
    '2024-01-11', '2024-02-13', '2024-03-12', '2024-04-10',
    '2024-05-15', '2024-06-12', '2024-07-11', '2024-08-14',
    '2024-09-11', '2024-10-10', '2024-11-13', '2024-12-11',
    // 2025
    '2025-01-15', '2025-02-12', '2025-03-12', '2025-04-10',
    '2025-05-13', '2025-06-11', '2025-07-10', '2025-08-13',
    '2025-09-10', '2025-10-14', '2025-11-12', '2025-12-10',
    // 2026
    '2026-01-14', '2026-02-11', '2026-03-11', '2026-04-14',
    '2026-05-12', '2026-06-10', '2026-07-14', '2026-08-12',
    '2026-09-15', '2026-10-14', '2026-11-12', '2026-12-10',
  ];

  /**
   * Index rebalancing dates
   * S&P 500: Quarterly (3rd Friday of Mar, Jun, Sep, Dec)
   * Russell 2000: June reconstitution (last Friday of June)
   */
  private static getIndexRebalancingDates(year: number): Array<{
    date: Date;
    index: 'S&P 500' | 'Russell 2000';
    type: 'quarterly' | 'annual-reconstitution';
  }> {
    const dates: Array<{
      date: Date;
      index: 'S&P 500' | 'Russell 2000';
      type: 'quarterly' | 'annual-reconstitution';
    }> = [];

    // S&P 500 quarterly rebalancing (3rd Friday of Mar, Jun, Sep, Dec)
    for (const month of [2, 5, 8, 11]) {
      const thirdFriday = this.calculateThirdFriday(year, month);
      dates.push({
        date: thirdFriday,
        index: 'S&P 500',
        type: 'quarterly',
      });
    }

    // Russell 2000 annual reconstitution (last Friday of June)
    const lastFridayJune = this.calculateLastFridayOfMonth(year, 5);
    dates.push({
      date: lastFridayJune,
      index: 'Russell 2000',
      type: 'annual-reconstitution',
    });

    return dates;
  }

  /**
   * Calculate 3rd Friday of month
   */
  private static calculateThirdFriday(year: number, month: number): Date {
    const date = new Date(year, month, 1);
    let fridayCount = 0;
    while (date.getMonth() === month) {
      if (date.getDay() === 5) {
        fridayCount++;
        if (fridayCount === 3) {
          return new Date(date);
        }
      }
      date.setDate(date.getDate() + 1);
    }
    return new Date(year, month + 1, 0);
  }

  /**
   * Calculate last Friday of month
   */
  private static calculateLastFridayOfMonth(year: number, month: number): Date {
    // Start from the last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Move backwards to find Friday
    while (lastDay.getDay() !== 5) {
      lastDay.setDate(lastDay.getDate() - 1);
    }

    return lastDay;
  }

  constructor(config?: EventCalendarConfig) {
    // Check for date expiration
    this.checkDateExpiration();

    // Initialize FOMC dates with validation
    const fomcDates = config?.fomcMeetings || EventCalendar.DEFAULT_FOMC_DATES;
    this.fomcDates = EventCalendar.validateDates(fomcDates, 'FOMC meeting dates');
    this.events.push(
      ...this.fomcDates.map(date => ({
        date,
        name: 'FOMC Meeting',
        type: 'fomc' as const,
        impact: 'high' as const,
        description: 'Federal Reserve interest rate decision',
      }))
    );

    // Initialize CPI dates with validation
    this.cpiDates = EventCalendar.validateDates(EventCalendar.DEFAULT_CPI_DATES, 'CPI release dates');
    this.events.push(
      ...this.cpiDates.map(date => ({
        date,
        name: 'CPI Release',
        type: 'economic' as const,
        impact: 'high' as const,
        description: 'Consumer Price Index release at 8:30 AM EST',
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

    // Add election events with validation
    const electionDates = EventCalendar.validateDates(
      EventCalendar.ELECTION_DATES.map(e => e.date),
      'Election dates'
    );
    this.events.push(
      ...electionDates.map((date, index) => ({
        date,
        name: `${EventCalendar.ELECTION_DATES[index]!.type} Election`,
        type: 'election' as const,
        impact: 'high' as const,
        description: `US ${EventCalendar.ELECTION_DATES[index]!.type} election day`,
      }))
    );

    // Add index rebalancing events (2024-2032)
    for (let year = 2024; year <= 2032; year++) {
      const rebalancingDates = EventCalendar.getIndexRebalancingDates(year);
      this.events.push(
        ...rebalancingDates.map(rebalance => ({
          date: rebalance.date,
          name: `${rebalance.index} ${rebalance.type === 'quarterly' ? 'Quarterly Rebalancing' : 'Annual Reconstitution'}`,
          type: 'index-rebalancing' as const,
          impact: (rebalance.type === 'annual-reconstitution' ? 'high' : 'medium') as 'high' | 'medium' | 'low',
          description: `${rebalance.index} ${rebalance.type === 'quarterly' ? 'quarterly rebalancing' : 'annual reconstitution (Russell Reconstitution)'}`,
        }))
      );
    }

    // Add custom events with validation
    if (config?.customEvents) {
      const customDates = EventCalendar.validateDates(
        config.customEvents.map(e => e.date),
        'Custom event dates'
      );
      this.events.push(
        ...customDates.map((date, index) => ({
          date,
          name: config.customEvents![index]!.name,
          type: config.customEvents![index]!.type as CalendarEvent['type'],
          impact: config.customEvents![index]!.impact,
          description: config.customEvents![index]!.description,
          ticker: config.customEvents![index]!.ticker,
        }))
      );
    }

    // Build indexes for O(1) lookups
    this.buildIndexes();
  }

  /**
   * Validate date strings and convert to Date objects
   * Throws descriptive errors for malformed dates
   *
   * @param dates - Array of date strings in ISO format (YYYY-MM-DD)
   * @param context - Context string for error messages (e.g., "FOMC dates", "CPI dates")
   * @returns Array of validated Date objects
   * @throws Error if any date string is malformed or invalid
   */
  private static validateDates(dates: string[], context: string): Date[] {
    return dates.map((dateStr, index) => {
      // Check if date string format is reasonable (basic sanity check)
      if (!dateStr || typeof dateStr !== 'string') {
        throw new Error(
          `Invalid date in ${context} at index ${index}: Expected string, got ${typeof dateStr}`
        );
      }

      // Parse the date
      const date = new Date(dateStr);

      // Check if date is valid (NaN check)
      if (isNaN(date.getTime())) {
        throw new Error(
          `Invalid date in ${context} at index ${index}: "${dateStr}" cannot be parsed as a valid date`
        );
      }

      // Additional validation: Check if the parsed date matches the input string
      // This catches cases like "2024-13-31" which would be parsed as invalid
      const isoDate = date.toISOString().split('T')[0];
      if (isoDate !== dateStr) {
        throw new Error(
          `Invalid date in ${context} at index ${index}: "${dateStr}" does not match expected format YYYY-MM-DD (parsed as ${isoDate})`
        );
      }

      return date;
    });
  }

  /**
   * Check if hardcoded event dates are approaching expiration
   * Logs a warning if any dates expire within 6 months
   */
  private checkDateExpiration(): void {
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

    // Check FOMC dates
    const latestFOMCDate = new Date(
      Math.max(...EventCalendar.DEFAULT_FOMC_DATES.map(dateStr => new Date(dateStr).getTime()))
    );

    // Check CPI dates
    const latestCPIDate = new Date(
      Math.max(...EventCalendar.DEFAULT_CPI_DATES.map(dateStr => new Date(dateStr).getTime()))
    );

    // Find the earliest expiring date
    const latestDate = latestFOMCDate > latestCPIDate ? latestFOMCDate : latestCPIDate;
    const monthsUntilExpiry = (latestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsUntilExpiry < 6) {
      console.warn(
        `⚠️  Event calendar expires in ${Math.floor(monthsUntilExpiry)} months (${latestDate.toISOString().split('T')[0]}). ` +
        `Update dates in event-calendar.ts and central-bank-extractors.ts`
      );
    }
  }

  /**
   * Build indexes for O(1) event lookups
   * Called during initialization to optimize event searches
   */
  private buildIndexes(): void {
    // Clear existing indexes
    this.eventsByYearMonth.clear();
    this.eventsByType.clear();
    this.eventsByDate.clear();

    // Build indexes for all events
    for (const event of this.events) {
      // Index by year-month (YYYY-MM)
      const yearMonth = `${event.date.getFullYear()}-${String(event.date.getMonth() + 1).padStart(2, '0')}`;
      if (!this.eventsByYearMonth.has(yearMonth)) {
        this.eventsByYearMonth.set(yearMonth, []);
      }
      this.eventsByYearMonth.get(yearMonth)!.push(event);

      // Index by type
      if (!this.eventsByType.has(event.type)) {
        this.eventsByType.set(event.type, []);
      }
      this.eventsByType.get(event.type)!.push(event);

      // Index by date (YYYY-MM-DD)
      const dateKey = event.date.toISOString().split('T')[0]!;
      if (!this.eventsByDate.has(dateKey)) {
        this.eventsByDate.set(dateKey, []);
      }
      this.eventsByDate.get(dateKey)!.push(event);
    }
  }

  /**
   * Get cached week boundaries for a date
   * Caches results to avoid repeated calculations
   */
  private getCachedWeekBoundaries(date: Date): { weekStart: Date; weekEnd: Date } {
    const dateKey = date.toISOString().split('T')[0]!;

    if (this.weekCache.has(dateKey)) {
      return this.weekCache.get(dateKey)!;
    }

    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);
    const boundaries = { weekStart, weekEnd };

    this.weekCache.set(dateKey, boundaries);
    return boundaries;
  }

  /**
   * Check if a date falls within an event week
   * Optimized with type-based indexing for O(1) lookup
   */
  isEventWeek(date: Date, eventType: CalendarEvent['type']): boolean {
    const { weekStart, weekEnd } = this.getCachedWeekBoundaries(date);

    // Get events of specified type from index (O(1) instead of O(n))
    const eventsOfType = this.eventsByType.get(eventType) || [];

    // Check if any event of this type falls within the week
    return eventsOfType.some(
      evt => evt.date >= weekStart && evt.date <= weekEnd
    );
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
   * Check if date is Triple Witching week (3rd Friday of Mar, Jun, Sep, Dec)
   */
  isTripleWitchingWeek(date: Date): boolean {
    const month = date.getMonth();

    // Triple Witching only in March (2), June (5), September (8), December (11)
    if (![2, 5, 8, 11].includes(month)) return false;

    const tripleWitchingDate = this.getMonthlyOptionsExpiry(date.getFullYear(), month);
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    return tripleWitchingDate >= weekStart && tripleWitchingDate <= weekEnd;
  }

  /**
   * Check if date is a GDP release week
   */
  isGDPReleaseWeek(date: Date): boolean {
    const releases = this.getGDPReleasesForYear(date.getFullYear());
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    return releases.some(release => release.date >= weekStart && release.date <= weekEnd);
  }

  /**
   * Check if date is in election event window (T-5 to T+10)
   * Extended window due to high impact and market positioning
   */
  isElectionEventWindow(date: Date): boolean {
    const electionDates = EventCalendar.ELECTION_DATES.map(e => new Date(e.date));

    for (const electionDate of electionDates) {
      const daysFromElection = Math.floor((date.getTime() - electionDate.getTime()) / (1000 * 60 * 60 * 24));

      // T-5 to T+10 window
      if (daysFromElection >= -5 && daysFromElection <= 10) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if date is in index rebalancing window (T-5 to T+0)
   * Front-running patterns and volume spikes
   */
  isIndexRebalancingWindow(date: Date): boolean {
    const rebalancingDates = EventCalendar.getIndexRebalancingDates(date.getFullYear());

    for (const rebalance of rebalancingDates) {
      const daysFromRebalance = Math.floor((date.getTime() - rebalance.date.getTime()) / (1000 * 60 * 60 * 24));

      // T-5 to T+0 window (front-running period)
      if (daysFromRebalance >= -5 && daysFromRebalance <= 0) {
        return true;
      }
    }

    return false;
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

    if (this.isTripleWitchingWeek(date)) {
      events.push({
        date,
        name: 'Triple Witching Week',
        type: 'triple-witching',
        impact: 'high',
        description: 'Week containing simultaneous expiration of stock options, index futures, and index options (3rd Friday of Mar/Jun/Sep/Dec)',
      });
    }

    if (this.isGDPReleaseWeek(date)) {
      const releases = this.getGDPReleasesForYear(date.getFullYear());
      const weekStart = this.getWeekStart(date);
      const weekEnd = this.getWeekEnd(date);
      const release = releases.find(r => r.date >= weekStart && r.date <= weekEnd);

      if (release) {
        const impact = release.type === 'Advance' ? 'high' : release.type === 'Second' ? 'medium' : 'low';
        events.push({
          date,
          name: `GDP ${release.type} Estimate`,
          type: 'gdp-release',
          impact: impact as 'high' | 'medium' | 'low',
          description: `${release.type} GDP estimate for ${release.quarter}`,
        });
      }
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

    if (this.isElectionEventWindow(date)) {
      const electionDates = EventCalendar.ELECTION_DATES.map(e => new Date(e.date));
      const nearestElection = electionDates.find(electionDate => {
        const daysFromElection = Math.floor((date.getTime() - electionDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysFromElection >= -5 && daysFromElection <= 10;
      });

      if (nearestElection) {
        const electionInfo = EventCalendar.ELECTION_DATES.find(
          e => new Date(e.date).getTime() === nearestElection.getTime()
        );
        events.push({
          date,
          name: `${electionInfo?.type || 'Election'} Event Window`,
          type: 'election',
          impact: 'high',
          description: `Within T-5 to T+10 window of ${electionInfo?.type || ''} election`,
        });
      }
    }

    if (this.isIndexRebalancingWindow(date)) {
      const rebalancingDates = EventCalendar.getIndexRebalancingDates(date.getFullYear());
      const nearestRebalance = rebalancingDates.find(rebalance => {
        const daysFromRebalance = Math.floor((date.getTime() - rebalance.date.getTime()) / (1000 * 60 * 60 * 24));
        return daysFromRebalance >= -5 && daysFromRebalance <= 0;
      });

      if (nearestRebalance) {
        events.push({
          date,
          name: `${nearestRebalance.index} Rebalancing Window`,
          type: 'index-rebalancing',
          impact: nearestRebalance.type === 'annual-reconstitution' ? 'high' : 'medium',
          description: `T-5 to T+0 front-running period for ${nearestRebalance.index}`,
        });
      }
    }

    // Add exact date events using indexed lookup (O(1) instead of O(n))
    const dateStr = date.toISOString().split('T')[0]!;
    const exactEvents = this.eventsByDate.get(dateStr) || [];

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
   * Generate GDP release dates for a given year
   * Based on typical BEA (Bureau of Economic Analysis) schedule
   * 2024-2026 calendar
   */
  private getGDPReleasesForYear(year: number): Array<{
    date: Date;
    type: 'Advance' | 'Second' | 'Third';
    quarter: string;
  }> {
    return [
      // Q4 previous year releases
      { date: new Date(year, 0, 27), type: 'Advance' as const, quarter: `Q4-${year - 1}` },
      { date: new Date(year, 1, 24), type: 'Second' as const, quarter: `Q4-${year - 1}` },
      { date: new Date(year, 2, 24), type: 'Third' as const, quarter: `Q4-${year - 1}` },

      // Q1 releases
      { date: new Date(year, 3, 27), type: 'Advance' as const, quarter: `Q1-${year}` },
      { date: new Date(year, 4, 25), type: 'Second' as const, quarter: `Q1-${year}` },
      { date: new Date(year, 5, 22), type: 'Third' as const, quarter: `Q1-${year}` },

      // Q2 releases
      { date: new Date(year, 6, 27), type: 'Advance' as const, quarter: `Q2-${year}` },
      { date: new Date(year, 7, 24), type: 'Second' as const, quarter: `Q2-${year}` },
      { date: new Date(year, 8, 21), type: 'Third' as const, quarter: `Q2-${year}` },

      // Q3 releases
      { date: new Date(year, 9, 26), type: 'Advance' as const, quarter: `Q3-${year}` },
      { date: new Date(year, 10, 23), type: 'Second' as const, quarter: `Q3-${year}` },
      { date: new Date(year, 11, 21), type: 'Third' as const, quarter: `Q3-${year}` },
    ];
  }

  /**
   * Set EODHD client for dividend data fetching
   */
  setEODHDClient(client: any): void {
    this.eodhd = client;
  }

  /**
   * Get dividend ex-dates for a specific symbol
   * Uses EODHD API fundamentals endpoint
   */
  async getDividendExDates(symbol: string, yearsBack: number = 5): Promise<Date[]> {
    // Check cache first (TTL: 24 hours)
    const cached = this.dividendCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.exDates;
    }

    if (!this.eodhd) {
      console.warn('EODHD client not set. Cannot fetch dividend ex-dates.');
      return [];
    }

    try {
      const fundamentals = await this.eodhd.getFundamentals(symbol);

      // Extract dividend history from Highlights or OutstandingShares.dividends
      const dividendYield = fundamentals?.Highlights?.DividendYield;
      const dividendShare = fundamentals?.Highlights?.DividendShare;

      if (!dividendYield || dividendYield === 0) {
        console.log(`${symbol} does not pay dividends or data unavailable.`);
        return [];
      }

      // For now, estimate quarterly ex-dates based on typical patterns
      // Most US stocks pay quarterly: around mid-Feb, mid-May, mid-Aug, mid-Nov
      // This is a simplified approach - in production, you'd use historical dividend data
      const exDates: Date[] = [];
      const currentYear = new Date().getFullYear();

      for (let year = currentYear - yearsBack; year <= currentYear; year++) {
        // Typical ex-dividend dates (estimates)
        const typicalMonths = [1, 4, 7, 10]; // Feb, May, Aug, Nov (using 0-indexed)
        for (const month of typicalMonths) {
          // Typically mid-month, e.g., 15th
          exDates.push(new Date(year, month, 15));
        }
      }

      // Cache the results
      this.dividendCache.set(symbol, {
        exDates,
        timestamp: Date.now(),
      });

      return exDates;
    } catch (error) {
      console.error(`Failed to fetch dividend data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get events by type within a date range
   * Uses existing eventsByType index for O(1) lookup
   *
   * @param eventType - Type of events to retrieve
   * @param startDate - Start of date range (inclusive)
   * @param endDate - End of date range (inclusive)
   * @returns Array of events of specified type within date range
   */
  public getEventsByType(
    eventType: CalendarEvent['type'],
    startDate: Date,
    endDate: Date
  ): CalendarEvent[] {
    // Get all events of this type from index (O(1) lookup)
    const eventsOfType = this.eventsByType.get(eventType) || [];

    // Filter by date range (O(M) where M = number of events of this type)
    return eventsOfType.filter(event =>
      event.date >= startDate && event.date <= endDate
    );
  }

  /**
   * Check if date is within T-1 of a dividend ex-date (cum-dividend pattern)
   * Per-symbol basis
   */
  async isDividendExDateWindow(date: Date, symbol: string): Promise<boolean> {
    const exDates = await this.getDividendExDates(symbol);

    for (const exDate of exDates) {
      const daysFromExDate = Math.floor((date.getTime() - exDate.getTime()) / (1000 * 60 * 60 * 24));

      // T-1 (day before ex-date) - cum-dividend pattern
      if (daysFromExDate === -1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if date is a CPI release day
   * CPI releases occur on 2nd/3rd week of month at 8:30 AM EST
   */
  isCPIReleaseDay(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0]!;
    return this.cpiDates.some(cpiDate => {
      const cpiDateStr = cpiDate.toISOString().split('T')[0]!;
      return cpiDateStr === dateStr;
    });
  }

  /**
   * Get CPI event window position (T-5 to T+5)
   * Returns null if not within window, otherwise returns offset in days
   * T-5 = 5 days before CPI release
   * T+5 = 5 days after CPI release
   */
  getCPIEventWindow(date: Date): number | null {
    const dateTime = date.getTime();
    const dayInMs = 1000 * 60 * 60 * 24;

    for (const cpiDate of this.cpiDates) {
      const cpiDateTime = cpiDate.getTime();
      const diffDays = Math.floor((dateTime - cpiDateTime) / dayInMs);

      // Check if within T-5 to T+5 window
      if (diffDays >= -5 && diffDays <= 5) {
        return diffDays;
      }
    }

    return null;
  }

  /**
   * Check if date is an NFP (Non-Farm Payroll) release day
   * NFP releases occur on first Friday of each month at 8:30 AM EST
   */
  isNFPReleaseDay(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth();
    const nfpDate = this.getFirstFridayOfMonth(year, month);

    const dateStr = date.toISOString().split('T')[0]!;
    const nfpDateStr = nfpDate.toISOString().split('T')[0]!;

    return dateStr === nfpDateStr;
  }

  /**
   * Get NFP event window position (T-5 to T+5)
   * Returns null if not within window, otherwise returns offset in days
   */
  getNFPEventWindow(date: Date): number | null {
    const year = date.getFullYear();
    const month = date.getMonth();
    const nfpDate = this.getFirstFridayOfMonth(year, month);

    const dateTime = date.getTime();
    const nfpDateTime = nfpDate.getTime();
    const dayInMs = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((dateTime - nfpDateTime) / dayInMs);

    // Check if within T-5 to T+5 window
    if (diffDays >= -5 && diffDays <= 5) {
      return diffDays;
    }

    return null;
  }

  /**
   * Calculate first Friday of a given month (for NFP releases)
   * First Friday = first day of month that is a Friday, OR first Friday after the 1st
   */
  private getFirstFridayOfMonth(year: number, month: number): Date {
    const date = new Date(year, month, 1);

    // Find first Friday
    while (date.getMonth() === month) {
      if (date.getDay() === 5) {
        // Friday
        return new Date(date);
      }
      date.setDate(date.getDate() + 1);
    }

    // Fallback (should not reach here)
    return new Date(year, month, 1);
  }

  /**
   * Check if a date is a US market holiday (NYSE/NASDAQ closure)
   *
   * @param date - Date to check
   * @returns true if date is a market holiday, false otherwise
   */
  isMarketHoliday(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return EventCalendar.holidaySet.has(dateStr!);
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
