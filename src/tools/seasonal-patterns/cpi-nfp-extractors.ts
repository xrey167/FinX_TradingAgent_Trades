/**
 * CPI and NFP Event Extractors
 * Add these classes to event-extractors.ts
 */

import type { PeriodExtractor, PeriodType } from './types.ts';
import { EventCalendar } from './event-calendar.ts';

/**
 * CPI (Consumer Price Index) Release Day Extractor
 * Identifies CPI release days and surrounding event windows (T-5 to T+5)
 *
 * CPI Release Schedule:
 * - Timing: 2nd/3rd week of each month at 8:30 AM EST
 * - Frequency: 12 releases per year (one per month)
 * - Impact: HIGH - Major market mover for inflation expectations
 *
 * Market Impact:
 * - 8:30 AM spike: Immediate volatility at release time
 * - Pre-release positioning: T-2 to T-1 typically shows reduced volatility
 * - Post-release: T+0 to T+2 shows highest volatility
 * - Event window: T-5 to T+5 for full pattern analysis
 *
 * Supports both daily and hourly analysis for capturing 8:30 AM market spike
 */
export class CPIExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract CPI release period for a given timestamp
   * Returns:
   * - 'CPI-Release-Day': Actual CPI release day
   * - 'CPI-T-5' through 'CPI-T-1': Days leading up to release
   * - 'CPI-T+1' through 'CPI-T+5': Days following release
   * - null: Not within CPI event window
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);

    // Check if this is a CPI release day
    if (this.calendar.isCPIReleaseDay(date)) {
      return 'CPI-Release-Day';
    }

    // Check if this is within CPI event window (T-5 to T+5)
    const windowPosition = this.calendar.getCPIEventWindow(date);
    if (windowPosition !== null) {
      if (windowPosition === 0) {
        return 'CPI-Release-Day';
      }
      return `CPI-${windowPosition > 0 ? 'T+' : 'T'}${Math.abs(windowPosition)}`;
    }

    return null;
  }
}

/**
 * NFP (Non-Farm Payroll) Release Day Extractor
 * Identifies NFP release days and surrounding event windows (T-5 to T+5)
 *
 * NFP Release Schedule:
 * - Timing: First Friday of each month at 8:30 AM EST
 * - Frequency: 12 releases per year
 * - Impact: HIGH - Most important monthly economic indicator
 *
 * Market Impact:
 * - 8:30 AM spike: Extreme volatility at release (often largest intraday moves)
 * - Pre-release: Markets typically quiet on Thursday (T-1)
 * - Post-release: High volatility continues through T+0 and T+1
 * - Event window: T-5 to T+5 for comprehensive pattern analysis
 *
 * Calculation:
 * - First Friday = First day of month that is a Friday, OR
 * - First Friday after the 1st if the 1st is not a Friday
 *
 * Supports both daily and hourly analysis for capturing 8:30 AM market spike
 */
export class NFPExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract NFP release period for a given timestamp
   * Returns:
   * - 'NFP-Release-Day': Actual NFP release day (first Friday)
   * - 'NFP-T-5' through 'NFP-T-1': Days leading up to release
   * - 'NFP-T+1' through 'NFP-T+5': Days following release
   * - null: Not within NFP event window
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);

    // Check if this is an NFP release day
    if (this.calendar.isNFPReleaseDay(date)) {
      return 'NFP-Release-Day';
    }

    // Check if this is within NFP event window (T-5 to T+5)
    const windowPosition = this.calendar.getNFPEventWindow(date);
    if (windowPosition !== null) {
      if (windowPosition === 0) {
        return 'NFP-Release-Day';
      }
      return `NFP-${windowPosition > 0 ? 'T+' : 'T'}${Math.abs(windowPosition)}`;
    }

    return null;
  }
}
