/**
 * Timezone Utility Functions
 *
 * Shared utilities for timezone conversions and date calculations
 * used by central bank extractors.
 *
 * Issue #22: Extracted from duplicated code in 4 central bank extractors
 */

import { EventCalendar } from './event-calendar.ts';

/**
 * TimezoneUtil class provides static methods for timezone conversions
 * and date calculations needed for central bank decision tracking
 */
export class TimezoneUtil {
  /**
   * Singleton EventCalendar instance for holiday checking
   * Lazily initialized on first use
   */
  private static calendarInstance: EventCalendar | null = null;

  /**
   * Get hour in EST/EDT timezone
   * Handles Daylight Saving Time conversion
   *
   * @param date - The date to convert
   * @returns The hour in EST/EDT (0-23)
   */
  static getESTHour(date: Date): number {
    // Check if in DST
    const isDST = this.isDST(date);

    // EST = UTC-5, EDT = UTC-4
    const utcOffset = isDST ? 4 : 5;

    const utcHour = date.getUTCHours();
    let estHour = utcHour - utcOffset;

    // Handle negative hours (previous day)
    if (estHour < 0) estHour += 24;
    // Handle overflow (next day)
    if (estHour >= 24) estHour -= 24;

    return estHour;
  }

  /**
   * Check if date is in Daylight Saving Time for US Eastern Time
   *
   * DST Rules:
   * - Starts: 2nd Sunday in March at 2:00 AM
   * - Ends: 1st Sunday in November at 2:00 AM
   *
   * @param date - The date to check
   * @returns true if in DST, false if in standard time
   */
  static isDST(date: Date): boolean {
    const year = date.getFullYear();

    // DST starts: 2nd Sunday in March at 2:00 AM
    const marchFirst = new Date(Date.UTC(year, 2, 1));
    const marchDayOfWeek = marchFirst.getUTCDay();
    const dstStart = new Date(Date.UTC(year, 2, 8 + ((7 - marchDayOfWeek) % 7)));
    dstStart.setUTCHours(7, 0, 0, 0); // 2:00 AM EST = 7:00 UTC

    // DST ends: 1st Sunday in November at 2:00 AM
    const novFirst = new Date(Date.UTC(year, 10, 1));
    const novDayOfWeek = novFirst.getUTCDay();
    const dstEnd = new Date(Date.UTC(year, 10, 1 + ((7 - novDayOfWeek) % 7)));
    dstEnd.setUTCHours(6, 0, 0, 0); // 2:00 AM EDT = 6:00 UTC

    return date >= dstStart && date < dstEnd;
  }

  /**
   * Get the start of the week (Monday at 00:00:00)
   *
   * @param date - The date to get the week start for
   * @returns Date object representing Monday at 00:00:00
   */
  static getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get the end of the week (Sunday at 23:59:59.999)
   *
   * @param date - The date to get the week end for
   * @returns Date object representing Sunday at 23:59:59.999
   */
  static getWeekEnd(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Check if a date is a US market holiday (NYSE/NASDAQ closure)
   *
   * Uses EventCalendar.isMarketHoliday() as the single source of truth
   * for all US market holiday detection across the codebase.
   *
   * US Market Holidays (10 per year):
   * 1. New Year's Day (January 1, observed if weekend)
   * 2. Martin Luther King Jr. Day (3rd Monday in January)
   * 3. Presidents Day (3rd Monday in February)
   * 4. Good Friday (Friday before Easter Sunday)
   * 5. Memorial Day (Last Monday in May)
   * 6. Juneteenth (June 19, observed if weekend)
   * 7. Independence Day (July 4, observed if weekend)
   * 8. Labor Day (1st Monday in September)
   * 9. Thanksgiving Day (4th Thursday in November)
   * 10. Christmas Day (December 25, observed if weekend)
   *
   * Weekend Observation Rules:
   * - If holiday falls on Saturday, observed on Friday
   * - If holiday falls on Sunday, observed on Monday
   *
   * Source: NYSE Holiday Schedule (2024-2035)
   *
   * @param date - The date to check
   * @returns true if date is a US market holiday, false otherwise
   *
   * @example
   * ```typescript
   * // Check if Christmas 2024 is a holiday
   * const christmas = new Date('2024-12-25');
   * console.log(TimezoneUtil.isUSMarketHoliday(christmas)); // true
   *
   * // Check if a regular trading day
   * const regularDay = new Date('2024-06-15');
   * console.log(TimezoneUtil.isUSMarketHoliday(regularDay)); // false
   * ```
   */
  static isUSMarketHoliday(date: Date): boolean {
    // Facade pattern: Delegate to EventCalendar.isMarketHoliday()
    // EventCalendar maintains the definitive holiday calendar
    // Use singleton pattern to avoid creating new instance on every call
    if (!TimezoneUtil.calendarInstance) {
      TimezoneUtil.calendarInstance = new EventCalendar();
    }
    return TimezoneUtil.calendarInstance.isMarketHoliday(date);
  }

  /**
   * Format Date as ISO date string (YYYY-MM-DD)
   *
   * @param date - The date to format
   * @returns ISO date string in YYYY-MM-DD format
   *
   * @example
   * ```typescript
   * const date = new Date('2024-12-25');
   * console.log(TimezoneUtil.formatISODate(date)); // "2024-12-25"
   * ```
   */
  static formatISODate(date: Date): string {
    return date.toISOString().split('T')[0]!;
  }
}
