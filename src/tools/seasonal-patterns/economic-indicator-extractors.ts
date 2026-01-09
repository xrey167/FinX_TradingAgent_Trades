/**
 * Additional Economic Event Extractors
 * Retail Sales, ISM, Jobless Claims, and other medium-impact events
 */

import type { PeriodExtractor, PeriodType } from './types.ts';
import { EventCalendar } from './event-calendar.ts';
import { TimezoneUtil } from './timezone-utils.ts';
import { calculateVolatility } from '../../lib/statistical-utils.ts';

/**
 * Retail Sales Extractor
 * Identifies US Retail Sales report releases (mid-month, typically 13th-17th)
 *
 * Release Schedule:
 * - Monthly frequency (12× per year)
 * - Release time: 8:30 AM EST
 * - Released mid-month (typically around 13th-17th)
 * - Source: US Census Bureau
 *
 * Market Impact:
 * - High impact: Consumer spending = 70% of GDP
 * - Immediate volatility spike at 8:30 AM EST
 * - Affects USD, equities, and bond markets
 * - Strong months (Nov-Dec holiday shopping) have higher impact
 */
export class RetailSalesExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract Retail Sales period for a given timestamp
   * Returns:
   * - 'Retail-Sales-Week': Week containing retail sales release
   * - 'Retail-Sales-Day': Actual release day
   * - null: Not a retail sales period
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const retailSalesDate = this.getRetailSalesDate(date.getFullYear(), date.getMonth());

    if (!retailSalesDate) return null;

    // Check if this is the exact day
    const dateStr = TimezoneUtil.formatISODate(date);
    const salesDateStr = TimezoneUtil.formatISODate(retailSalesDate);

    if (dateStr === salesDateStr) {
      return 'Retail-Sales-Day';
    }

    // Check if in the same week
    const weekStart = TimezoneUtil.getWeekStart(date);
    const weekEnd = TimezoneUtil.getWeekEnd(date);

    if (retailSalesDate >= weekStart && retailSalesDate <= weekEnd) {
      return 'Retail-Sales-Week';
    }

    return null;
  }

  /**
   * Analyze event window around Retail Sales release
   * Returns insights about expected market reaction
   */
  analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; close: number; high: number; low: number; volume: number; timestamp?: number }>
  ): {
    isRetailSalesWeek: boolean;
    daysUntilRelease: number;
    expectedImpact: 'high' | 'medium' | 'low';
    hourlyVolatility?: number;
    insights: string[];
  } {
    const retailSalesDate = this.getRetailSalesDate(date.getFullYear(), date.getMonth());

    if (!retailSalesDate) {
      return {
        isRetailSalesWeek: false,
        daysUntilRelease: -1,
        expectedImpact: 'low',
        insights: [],
      };
    }

    const daysUntil = Math.floor((retailSalesDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const insights: string[] = [];

    // Determine expected impact based on month
    const month = date.getMonth();
    let expectedImpact: 'high' | 'medium' | 'low' = 'medium';

    // Holiday shopping months (Nov-Dec) have higher impact
    if (month === 0 || month === 11) {
      // Jan (Dec data) or Dec (Nov data)
      expectedImpact = 'high';
      insights.push('Holiday retail sales data: Higher market impact expected');
    }

    // Add timing insights
    if (daysUntil === 0) {
      insights.push('Retail Sales release today at 8:30 AM EST: Expect immediate volatility spike');
      insights.push('Consumer spending indicator (70% of GDP): Watch USD, equities, bonds');
    } else if (daysUntil === 1) {
      insights.push('Retail Sales release tomorrow: Markets may position ahead of data');
    } else if (daysUntil >= -1 && daysUntil <= 2) {
      insights.push(`Retail Sales release in ${daysUntil} days: Event window active`);
    }

    // Analyze hourly data if available (8:30 AM EST spike detection)
    let hourlyVolatility: number | undefined;
    const hourlyData = priceData.filter(d => d.timestamp !== undefined);
    if (hourlyData.length > 0) {
      const releaseHourData = hourlyData.filter(d => {
        if (!d.timestamp) return false;
        const hour = new Date(d.timestamp).getUTCHours();
        // 8:30 AM EST = 13:30 UTC (winter) or 12:30 UTC (summer)
        return hour >= 12 && hour <= 14;
      });

      if (releaseHourData.length > 0) {
        hourlyVolatility = calculateVolatility(releaseHourData);
        if (hourlyVolatility > 0.01) {
          insights.push(`High intraday volatility detected: ${(hourlyVolatility * 100).toFixed(2)}%`);
        }
      }
    }

    return {
      isRetailSalesWeek: daysUntil >= -2 && daysUntil <= 2,
      daysUntilRelease: daysUntil,
      expectedImpact,
      hourlyVolatility,
      insights,
    };
  }

  /**
   * Get Retail Sales release date for a given month
   * Typically 13th-17th of each month (adjusted for weekends)
   */
  private getRetailSalesDate(year: number, month: number): Date | null {
    // Use hardcoded dates for 2024-2026 for accuracy
    const releaseDates = this.getRetailSalesReleasesForYear(year);
    const targetDate = releaseDates.find(d => d.getMonth() === month);
    return targetDate || null;
  }

  /**
   * Get all Retail Sales release dates for a given year
   * Source: US Census Bureau schedule
   */
  private getRetailSalesReleasesForYear(year: number): Date[] {
    // Typical mid-month releases (13th-17th, adjusted for weekends)
    const estimates: { [key: number]: number[] } = {
      2024: [17, 15, 14, 15, 16, 18, 16, 15, 18, 17, 15, 17], // Jan-Dec
      2025: [16, 14, 14, 16, 15, 16, 16, 14, 16, 16, 14, 16],
      2026: [15, 17, 16, 15, 15, 16, 15, 14, 16, 16, 13, 16],
    };

    const days = estimates[year] ?? [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15]; // Default to 15th
    return days.map((day, month) => new Date(year, month, day));
  }
}

/**
 * ISM Manufacturing PMI Extractor
 * Identifies ISM Manufacturing Index releases (first business day of month)
 *
 * Release Schedule:
 * - Monthly frequency (12× per year)
 * - Release time: 10:00 AM EST
 * - First business day of each month
 * - Source: Institute for Supply Management
 *
 * Market Impact:
 * - High impact: Leading economic indicator
 * - PMI > 50 = expansion, < 50 = contraction
 * - Immediate market reaction at 10:00 AM EST
 * - Affects manufacturing stocks, USD, commodities
 */
export class ISMExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract ISM period for a given timestamp
   * Returns:
   * - 'ISM-Week': Week containing ISM release
   * - 'ISM-Day': Actual release day
   * - null: Not an ISM period
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const ismDate = this.getISMDate(date.getFullYear(), date.getMonth());

    if (!ismDate) return null;

    // Check if this is the exact day
    const dateStr = TimezoneUtil.formatISODate(date);
    const ismDateStr = TimezoneUtil.formatISODate(ismDate);

    if (dateStr === ismDateStr) {
      return 'ISM-Day';
    }

    // Check if in the same week
    const weekStart = TimezoneUtil.getWeekStart(date);
    const weekEnd = TimezoneUtil.getWeekEnd(date);

    if (ismDate >= weekStart && ismDate <= weekEnd) {
      return 'ISM-Week';
    }

    return null;
  }

  /**
   * Analyze event window around ISM release
   * Returns insights about expected market reaction
   */
  analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; close: number; high: number; low: number; volume: number; timestamp?: number }>
  ): {
    isISMWeek: boolean;
    daysUntilRelease: number;
    expectedImpact: 'high' | 'medium' | 'low';
    hourlyVolatility?: number;
    insights: string[];
  } {
    const ismDate = this.getISMDate(date.getFullYear(), date.getMonth());

    if (!ismDate) {
      return {
        isISMWeek: false,
        daysUntilRelease: -1,
        expectedImpact: 'low',
        insights: [],
      };
    }

    const daysUntil = Math.floor((ismDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const insights: string[] = [];
    const expectedImpact: 'high' | 'medium' | 'low' = 'high';

    // Add timing insights
    if (daysUntil === 0) {
      insights.push('ISM Manufacturing PMI release today at 10:00 AM EST: Expect immediate volatility');
      insights.push('Leading economic indicator: PMI > 50 = expansion, < 50 = contraction');
      insights.push('Watch manufacturing stocks, USD, and commodities for reaction');
    } else if (daysUntil === 1) {
      insights.push('ISM release tomorrow: First business day of month indicator');
    } else if (daysUntil >= -1 && daysUntil <= 2) {
      insights.push(`ISM release in ${daysUntil} days: Event window active`);
    }

    // Analyze hourly data if available (10:00 AM EST spike detection)
    let hourlyVolatility: number | undefined;
    const hourlyData = priceData.filter(d => d.timestamp !== undefined);
    if (hourlyData.length > 0) {
      const releaseHourData = hourlyData.filter(d => {
        if (!d.timestamp) return false;
        const hour = new Date(d.timestamp).getUTCHours();
        // 10:00 AM EST = 15:00 UTC (winter) or 14:00 UTC (summer)
        return hour >= 14 && hour <= 16;
      });

      if (releaseHourData.length > 0) {
        hourlyVolatility = calculateVolatility(releaseHourData);
        if (hourlyVolatility > 0.01) {
          insights.push(`High intraday volatility detected: ${(hourlyVolatility * 100).toFixed(2)}%`);
        }
      }
    }

    return {
      isISMWeek: daysUntil >= -2 && daysUntil <= 2,
      daysUntilRelease: daysUntil,
      expectedImpact,
      hourlyVolatility,
      insights,
    };
  }

  /**
   * Get ISM release date for a given month
   * First business day of the month
   */
  private getISMDate(year: number, month: number): Date | null {
    const releaseDates = this.getISMReleasesForYear(year);
    const targetDate = releaseDates.find(d => d.getMonth() === month);
    return targetDate || null;
  }

  /**
   * Calculate first business day of each month for a given year
   */
  private getISMReleasesForYear(year: number): Date[] {
    const dates: Date[] = [];

    for (let month = 0; month < 12; month++) {
      let day = 1;
      let date = new Date(Date.UTC(year, month, day));

      // Move to first business day (Monday-Friday, excluding holidays)
      while (true) {
        const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
        const isHoliday = this.calendar.isMarketHoliday(date);

        if (!isWeekend && !isHoliday) {
          break; // Found first business day
        }

        day++;
        date = new Date(Date.UTC(year, month, day));

        // Safety: prevent infinite loop if month has no valid days
        if (day > 31) {
          throw new Error(`Could not find business day in ${year}-${month + 1}`);
        }
      }

      dates.push(date);
    }

    return dates;
  }
}

/**
 * Jobless Claims Extractor
 * Identifies Weekly Initial Jobless Claims releases (every Thursday)
 *
 * Release Schedule:
 * - Weekly frequency (52× per year)
 * - Release time: 8:30 AM EST
 * - Every Thursday (adjusted for holidays)
 * - Source: US Department of Labor
 *
 * Market Impact:
 * - Medium-high impact: Labor market indicator
 * - Rising claims = weakening economy
 * - Falling claims = strengthening economy
 * - Immediate reaction at 8:30 AM EST
 * - Affects USD, equities, and bonds
 */
export class JoblessClaimsExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract Jobless Claims period for a given timestamp
   * Returns:
   * - 'Jobless-Claims-Day': Release day (Thursday)
   * - null: Not a jobless claims day
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);

    // Jobless claims are released every Thursday
    if (date.getDay() !== 4) return null;

    // Check if this Thursday is a major holiday
    if (TimezoneUtil.isUSMarketHoliday(date)) return null;

    return 'Jobless-Claims-Day';
  }

  /**
   * Analyze event window around Jobless Claims release
   * Returns insights about expected market reaction
   */
  analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; close: number; high: number; low: number; volume: number; timestamp?: number }>
  ): {
    isJoblessClaimsDay: boolean;
    daysUntilRelease: number;
    expectedImpact: 'high' | 'medium' | 'low';
    hourlyVolatility?: number;
    insights: string[];
  } {
    const insights: string[] = [];
    const isThursday = date.getDay() === 4;
    const isHoliday = TimezoneUtil.isUSMarketHoliday(date);

    if (!isThursday || isHoliday) {
      // Find next Thursday
      let nextThursday = new Date(date);
      while (nextThursday.getDay() !== 4 || TimezoneUtil.isUSMarketHoliday(nextThursday)) {
        nextThursday.setDate(nextThursday.getDate() + 1);
      }

      const daysUntil = Math.floor((nextThursday.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      return {
        isJoblessClaimsDay: false,
        daysUntilRelease: daysUntil,
        expectedImpact: 'medium',
        insights: daysUntil <= 2 ? [`Jobless Claims release in ${daysUntil} days (next Thursday)`] : [],
      };
    }

    // This is a Jobless Claims day
    const expectedImpact: 'high' | 'medium' | 'low' = 'medium';

    insights.push('Weekly Jobless Claims release today at 8:30 AM EST: Expect immediate reaction');
    insights.push('Labor market indicator: Watch for trends (rising = weakening, falling = strengthening)');
    insights.push('Affects USD, equities, and bond markets');

    // Analyze hourly data if available (8:30 AM EST spike detection)
    let hourlyVolatility: number | undefined;
    const hourlyData = priceData.filter(d => d.timestamp !== undefined);
    if (hourlyData.length > 0) {
      const releaseHourData = hourlyData.filter(d => {
        if (!d.timestamp) return false;
        const hour = new Date(d.timestamp).getUTCHours();
        // 8:30 AM EST = 13:30 UTC (winter) or 12:30 UTC (summer)
        return hour >= 12 && hour <= 14;
      });

      if (releaseHourData.length > 0) {
        hourlyVolatility = calculateVolatility(releaseHourData);
        if (hourlyVolatility > 0.01) {
          insights.push(`High intraday volatility detected: ${(hourlyVolatility * 100).toFixed(2)}%`);
        }
      }
    }

    return {
      isJoblessClaimsDay: true,
      daysUntilRelease: 0,
      expectedImpact,
      hourlyVolatility,
      insights,
    };
  }
}
