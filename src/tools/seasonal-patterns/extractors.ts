/**
 * Period Extractors for Seasonal Pattern Analysis
 * Extracts temporal periods from timestamps for pattern grouping
 */

import type { PeriodExtractor, PeriodType } from './types.ts';

/**
 * Hour of Day Extractor
 * Extracts hour (0-23) from timestamp
 * Requires: hourly timeframe data
 */
export class HourOfDayExtractor implements PeriodExtractor {
  type: PeriodType = 'hour-of-day';
  requiredTimeframe = 'hourly' as const;

  extract(timestamp: number): string {
    const date = new Date(timestamp);
    const hour = date.getUTCHours();
    return `Hour-${hour.toString().padStart(2, '0')}`; // "Hour-00" to "Hour-23"
  }
}

/**
 * Market Session Extractor
 * Groups hours into trading sessions (Pre-Market, Open, Lunch, Power Hour, After Hours)
 * Requires: hourly timeframe data
 * Note: Uses US market hours (EST)
 */
export class MarketSessionExtractor implements PeriodExtractor {
  type: PeriodType = 'market-session';
  requiredTimeframe = 'hourly' as const;

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);

    // Convert to EST/EDT (UTC-5 or UTC-4 depending on DST)
    // For simplicity, we'll work with UTC and adjust
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const totalMinutes = hour * 60 + minute;

    // US Market hours in EST:
    // Pre-market: 4:00am - 9:30am EST = 9:00 - 14:30 UTC (EST = UTC-5)
    // Market Open: 9:30am - 11:00am EST = 14:30 - 16:00 UTC
    // Mid-Day: 11:00am - 12:00pm EST = 16:00 - 17:00 UTC
    // Lunch Hour: 12:00pm - 1:00pm EST = 17:00 - 18:00 UTC
    // Afternoon: 1:00pm - 3:00pm EST = 18:00 - 20:00 UTC
    // Power Hour: 3:00pm - 4:00pm EST = 20:00 - 21:00 UTC
    // After Hours: 4:00pm - 8:00pm EST = 21:00 - 1:00 UTC (next day)

    // Note: This is a simplified version assuming EST (UTC-5)
    // A production version should handle DST properly

    // Pre-Market (4:00am - 9:30am EST)
    if (totalMinutes >= 540 && totalMinutes < 870) {
      // 9:00 - 14:30 UTC
      return 'Pre-Market';
    }

    // Market Open (9:30am - 11:00am EST)
    if (totalMinutes >= 870 && totalMinutes < 960) {
      // 14:30 - 16:00 UTC
      return 'Market-Open';
    }

    // Mid-Day (11:00am - 12:00pm EST)
    if (totalMinutes >= 960 && totalMinutes < 1020) {
      // 16:00 - 17:00 UTC
      return 'Mid-Day';
    }

    // Lunch Hour (12:00pm - 1:00pm EST)
    if (totalMinutes >= 1020 && totalMinutes < 1080) {
      // 17:00 - 18:00 UTC
      return 'Lunch-Hour';
    }

    // Afternoon (1:00pm - 3:00pm EST)
    if (totalMinutes >= 1080 && totalMinutes < 1200) {
      // 18:00 - 20:00 UTC
      return 'Afternoon';
    }

    // Power Hour (3:00pm - 4:00pm EST)
    if (totalMinutes >= 1200 && totalMinutes < 1260) {
      // 20:00 - 21:00 UTC
      return 'Power-Hour';
    }

    // After Hours (4:00pm - 8:00pm EST)
    if (totalMinutes >= 1260 || totalMinutes < 60) {
      // 21:00 - 1:00 UTC (wraps to next day)
      return 'After-Hours';
    }

    // Outside trading hours
    return null;
  }
}

/**
 * Month of Year Extractor
 * Extracts month name from timestamp
 * Requires: daily timeframe data (but works with any)
 */
export class MonthOfYearExtractor implements PeriodExtractor {
  type: PeriodType = 'month-of-year';
  requiredTimeframe = 'daily' as const;

  private monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  extract(timestamp: number): string {
    const date = new Date(timestamp);
    const month = date.getUTCMonth();
    return this.monthNames[month] || 'Unknown';
  }
}

/**
 * Quarter Extractor
 * Extracts quarter (Q1, Q2, Q3, Q4) from timestamp
 * Requires: daily timeframe data
 */
export class QuarterExtractor implements PeriodExtractor {
  type: PeriodType = 'quarter';
  requiredTimeframe = 'daily' as const;

  extract(timestamp: number): string {
    const date = new Date(timestamp);
    const month = date.getUTCMonth();

    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
  }
}

/**
 * Day of Week Extractor
 * Extracts day name from timestamp
 * Requires: daily timeframe data
 */
export class DayOfWeekExtractor implements PeriodExtractor {
  type: PeriodType = 'day-of-week';
  requiredTimeframe = 'daily' as const;

  private dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  extract(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getUTCDay();
    return this.dayNames[day] || 'Unknown';
  }
}

/**
 * Week Position Extractor
 * Extracts week positioning (First-Monday, Last-Friday, etc.)
 * Requires: daily timeframe data
 */
export class WeekPositionExtractor implements PeriodExtractor {
  type: PeriodType = 'week-position';
  requiredTimeframe = 'daily' as const;

  private dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  extract(timestamp: number): string {
    const date = new Date(timestamp);
    const dayOfWeek = this.dayNames[date.getUTCDay()];
    const dayOfMonth = date.getUTCDate();

    // Determine week of month (1-5)
    const weekOfMonth = Math.ceil(dayOfMonth / 7);

    // First week (days 1-7)
    if (weekOfMonth === 1) {
      return `First-${dayOfWeek}`;
    }

    // Last week (check if this is the last occurrence of this day in the month)
    const daysInMonth = new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, 0).getUTCDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    if (daysRemaining < 7) {
      return `Last-${dayOfWeek}`;
    }

    // Middle weeks
    return `Week${weekOfMonth}-${dayOfWeek}`;
  }
}

/**
 * Day of Month Extractor
 * Extracts day of month (1-31) from timestamp
 * Requires: daily timeframe data
 */
export class DayOfMonthExtractor implements PeriodExtractor {
  type: PeriodType = 'day-of-month';
  requiredTimeframe = 'daily' as const;

  extract(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getUTCDate();
    return `Day-${day.toString().padStart(2, '0')}`; // "Day-01" to "Day-31"
  }
}

/**
 * Week of Month Extractor
 * Extracts week of month (Week-1 to Week-5) from timestamp
 * Requires: daily timeframe data
 */
export class WeekOfMonthExtractor implements PeriodExtractor {
  type: PeriodType = 'week-of-month';
  requiredTimeframe = 'daily' as const;

  extract(timestamp: number): string {
    const date = new Date(timestamp);
    const dayOfMonth = date.getUTCDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);
    return `Week-${weekOfMonth}`;
  }
}

/**
 * Week of Year Extractor
 * Extracts week of year (Week-1 to Week-53) from timestamp
 * Requires: daily timeframe data
 */
export class WeekOfYearExtractor implements PeriodExtractor {
  type: PeriodType = 'week-of-year';
  requiredTimeframe = 'daily' as const;

  extract(timestamp: number): string {
    const date = new Date(timestamp);

    // Calculate week of year using ISO 8601 standard
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    const dayOfYear = Math.ceil((date.getTime() - onejan.getTime()) / millisecsInDay);
    const weekOfYear = Math.ceil(dayOfYear / 7);

    return `Week-${weekOfYear.toString().padStart(2, '0')}`; // "Week-01" to "Week-53"
  }
}

/**
 * Factory function to get extractor by period type
 */
export function getExtractor(periodType: PeriodType): PeriodExtractor {
  switch (periodType) {
    case 'hour-of-day':
      return new HourOfDayExtractor();
    case 'market-session':
      return new MarketSessionExtractor();
    case 'month-of-year':
      return new MonthOfYearExtractor();
    case 'quarter':
      return new QuarterExtractor();
    case 'day-of-week':
      return new DayOfWeekExtractor();
    case 'week-position':
      return new WeekPositionExtractor();
    case 'day-of-month':
      return new DayOfMonthExtractor();
    case 'week-of-month':
      return new WeekOfMonthExtractor();
    case 'week-of-year':
      return new WeekOfYearExtractor();
    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

/**
 * Get all extractors compatible with a given timeframe
 */
export function getCompatibleExtractors(timeframe: 'daily' | 'hourly' | '5min'): PeriodExtractor[] {
  const allExtractors: PeriodExtractor[] = [
    new MonthOfYearExtractor(),
    new QuarterExtractor(),
    new DayOfWeekExtractor(),
    new WeekPositionExtractor(),
    new DayOfMonthExtractor(),
    new WeekOfMonthExtractor(),
    new WeekOfYearExtractor(),
  ];

  if (timeframe === 'hourly' || timeframe === '5min') {
    allExtractors.push(new HourOfDayExtractor(), new MarketSessionExtractor());
  }

  return allExtractors.filter((e) => e.requiredTimeframe === timeframe || timeframe === 'hourly' || timeframe === '5min');
}
