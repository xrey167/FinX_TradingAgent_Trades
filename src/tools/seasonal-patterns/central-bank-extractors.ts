/**
 * Central Bank Decision Day Extractors
 * Issues #8 and #9 Implementation
 *
 * Federal Reserve (Fed): 8 decisions/year, 2:00 PM EST announcement, 2:30 PM press conference
 * European Central Bank (ECB): 7:45 AM EST impact (8:45 AM CET/CEST)
 * Bank of England (BoE): 7:00 AM EST (12:00 PM GMT/BST)
 * Bank of Japan (BoJ): ~9:00 PM EST previous day (10:00-11:00 AM JST)
 *
 * Key Features:
 * - Precise decision DAY detection (not just weeks)
 * - Intraday hourly analysis for 2:00 PM Fed spike
 * - Timezone-aware conversions (CET, GMT, JST to EST)
 * - Dot plot detection for quarterly FOMC meetings
 * - EUR/USD correlation for ECB decisions
 */

import type { PeriodExtractor, PeriodType } from './types.ts';
import { EventCalendar } from './event-calendar.ts';

/**
 * Validate date strings and convert to Date objects
 * Shared utility for all extractors
 *
 * @param dates - Array of date strings in ISO format (YYYY-MM-DD)
 * @param context - Context string for error messages
 * @returns Array of validated Date objects
 * @throws Error if any date string is malformed or invalid
 */
function validateDates(dates: string[], context: string): Date[] {
  return dates.map((dateStr, index) => {
    if (!dateStr || typeof dateStr !== 'string') {
      throw new Error(
        `Invalid date in ${context} at index ${index}: Expected string, got ${typeof dateStr}`
      );
    }

    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      throw new Error(
        `Invalid date in ${context} at index ${index}: "${dateStr}" cannot be parsed as a valid date`
      );
    }

    const isoDate = date.toISOString().split('T')[0];
    if (isoDate !== dateStr) {
      throw new Error(
        `Invalid date in ${context} at index ${index}: "${dateStr}" does not match expected format YYYY-MM-DD (parsed as ${isoDate})`
      );
    }

    return date;
  });
}
import { TimezoneUtil } from './timezone-utils.ts';

/**
 * Fed Rate Decision Day Extractor
 * Detects exact FOMC decision days and 2:00 PM EST announcement hour
 *
 * Schedule: 8 meetings per year
 * Announcement: 2:00 PM EST sharp
 * Press Conference: 2:30 PM EST (if scheduled)
 * Dot Plot: Quarterly (March, June, September, December)
 *
 * Market Impact:
 * - Extreme volatility spike at 2:00 PM EST
 * - Volume surge 5-10× normal at announcement
 * - Directional moves often 1-2% in minutes
 * - Continued volatility through press conference
 */
export class FedRateDecisionExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'hourly' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract Fed rate decision period
   * Returns:
   * - 'Fed-Decision-Day-2PM': The exact 2:00 PM EST hour on decision day
   * - 'Fed-Decision-Day-PreMarket': Pre-market on decision day (anticipation phase)
   * - 'Fed-Decision-Day-PostAnnouncement': 3:00-4:00 PM (reaction phase)
   * - 'Fed-Decision-Day': Other hours on decision day
   * - 'Fed-Decision-Week': Week containing decision
   * - null: Not a Fed decision period
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const decisionDate = this.getFOMCDecisionDate(date);

    if (!decisionDate) return null;

    // Check if this is the exact decision day
    const dateStr = date.toISOString().split('T')[0];
    const decisionStr = decisionDate.toISOString().split('T')[0];

    if (dateStr === decisionStr) {
      // This is the decision day - check hour
      const hour = TimezoneUtil.getESTHour(date);

      if (hour === 14) {
        // 2:00 PM EST - THE announcement hour
        return 'Fed-Decision-Day-2PM';
      } else if (hour >= 9 && hour < 14) {
        // Pre-market and morning (anticipation)
        return 'Fed-Decision-Day-PreMarket';
      } else if (hour >= 14 && hour < 16) {
        // 2:00-4:00 PM EST (announcement + press conference)
        return 'Fed-Decision-Day-PostAnnouncement';
      } else {
        // Other hours on decision day
        return 'Fed-Decision-Day';
      }
    }

    // Check if in the same week
    const weekStart = TimezoneUtil.getWeekStart(date);
    const weekEnd = TimezoneUtil.getWeekEnd(date);

    if (decisionDate >= weekStart && decisionDate <= weekEnd) {
      return 'Fed-Decision-Week';
    }

    return null;
  }

  /**
   * Check if a FOMC meeting has a dot plot release
   * Dot plots are published quarterly: March, June, September, December
   */
  hasDotPlot(date: Date): boolean {
    const month = date.getMonth(); // 0-11
    // Dot plot months: March (2), June (5), September (8), December (11)
    return [2, 5, 8, 11].includes(month);
  }

  /**
   * Analyze 2:00 PM announcement spike
   * Returns insights about the decision day volatility pattern
   */
  analyze2PMSpike(
    decisionDate: Date,
    hourlyData: Array<{ date: Date; open: number; high: number; low: number; close: number; volume: number }>
  ): {
    is2PMHour: boolean;
    priceMove: number;
    volumeSpike: number;
    volatility: number;
    hasDotPlot: boolean;
    insights: string[];
  } {
    const insights: string[] = [];

    // Find the 2 PM EST hour data
    const twoPMData = hourlyData.find(d => {
      const dateStr = d.date.toISOString().split('T')[0];
      const decisionStr = decisionDate.toISOString().split('T')[0];
      const hour = TimezoneUtil.getESTHour(d.date);
      return dateStr === decisionStr && hour === 14;
    });

    if (!twoPMData) {
      return {
        is2PMHour: false,
        priceMove: 0,
        volumeSpike: 0,
        volatility: 0,
        hasDotPlot: this.hasDotPlot(decisionDate),
        insights: ['No 2:00 PM EST data available for analysis'],
      };
    }

    // Calculate price move (% change from open to close of 2 PM hour)
    const priceMove = ((twoPMData.close - twoPMData.open) / twoPMData.open) * 100;

    // Calculate intrabar volatility
    const volatility = ((twoPMData.high - twoPMData.low) / twoPMData.open) * 100;

    // Calculate volume spike vs normal hours
    const normalHours = hourlyData.filter(d => {
      const daysDiff = Math.floor((d.date.getTime() - decisionDate.getTime()) / (1000 * 60 * 60 * 24));
      const hour = TimezoneUtil.getESTHour(d.date);
      return daysDiff >= -5 && daysDiff < 0 && hour === 14; // Same hour previous 5 days
    });

    const avgNormalVolume = normalHours.length > 0
      ? normalHours.reduce((sum, d) => sum + d.volume, 0) / normalHours.length
      : twoPMData.volume;

    const volumeSpike = twoPMData.volume / avgNormalVolume;

    // Generate insights
    const hasDotPlot = this.hasDotPlot(decisionDate);

    if (hasDotPlot) {
      insights.push('📊 Dot Plot Release: Expect increased volatility and extended press conference');
    }

    if (Math.abs(priceMove) > 0.5) {
      insights.push(`💥 Significant price move: ${priceMove > 0 ? '+' : ''}${priceMove.toFixed(2)}% in 2:00 PM hour`);
    }

    if (volatility > 1.0) {
      insights.push(`📈 High intraday volatility: ${volatility.toFixed(2)}% range`);
    }

    if (volumeSpike > 5.0) {
      insights.push(`🔥 Extreme volume spike: ${volumeSpike.toFixed(1)}× normal 2 PM volume`);
    }

    if (volumeSpike > 3.0 && volumeSpike <= 5.0) {
      insights.push(`📊 Strong volume spike: ${volumeSpike.toFixed(1)}× normal 2 PM volume`);
    }

    insights.push('⏰ Fed announcement: 2:00 PM EST sharp, press conference 2:30 PM EST');

    return {
      is2PMHour: true,
      priceMove,
      volumeSpike,
      volatility,
      hasDotPlot,
      insights,
    };
  }

  /**
   * Get the nearest FOMC decision date for a given date
   */
  private getFOMCDecisionDate(date: Date): Date | null {
    // Use EventCalendar to check if this date is in a FOMC week
    if (!this.calendar.isFOMCWeek(date)) {
      return null;
    }

    // Get the exact FOMC date from calendar's internal FOMC dates
    const weekStart = TimezoneUtil.getWeekStart(date);
    const weekEnd = TimezoneUtil.getWeekEnd(date);

    // Access calendar's FOMC dates (through its events)
    const fomcEvents = this.calendar.getEventsForDate(date).filter(e => e.type === 'fomc');

    if (fomcEvents.length > 0 && fomcEvents[0]) {
      return fomcEvents[0].date;
    }

    return null;
  }

}

/**
 * ECB Decision Day Extractor
 * European Central Bank interest rate decisions
 *
 * Schedule: 8 meetings per year (6 with decision + press conference, 2 with press conference only)
 * Announcement: 8:15 AM CET/CEST (2:15 AM EST/1:15 AM EDT) - decision published
 * Press Conference: 8:45 AM CET/CEST (2:45 AM EST/1:45 AM EDT)
 * US Market Impact: 7:45 AM EST (when European markets react) - affects EUR/USD heavily
 *
 * Note: ECB decisions happen during European trading hours but before US market open
 */
export class ECBDecisionExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'hourly' as const;

  /**
   * ECB decision dates (2024-2026)
   * Source: ecb.europa.eu
   */
  private static ECB_DECISIONS = [
    // 2024
    '2024-01-25', '2024-03-07', '2024-04-11', '2024-06-06',
    '2024-07-18', '2024-09-12', '2024-10-17', '2024-12-12',
    // 2025
    '2025-01-30', '2025-03-06', '2025-04-17', '2025-06-05',
    '2025-07-24', '2025-09-11', '2025-10-30', '2025-12-18',
    // 2026
    '2026-01-22', '2026-03-05', '2026-04-23', '2026-06-04',
    '2026-07-23', '2026-09-10', '2026-10-29', '2026-12-17',
  ];

  /**
   * Validated ECB decision dates (cached)
   */
  private static validatedDates: Date[] | null = null;

  constructor() {
    // Validate dates on first construction to fail fast
    if (!ECBDecisionExtractor.validatedDates) {
      ECBDecisionExtractor.validatedDates = validateDates(
        ECBDecisionExtractor.ECB_DECISIONS,
        'ECB decision dates'
      );
    }
  }

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const decisionDate = this.getECBDecisionDate(date);

    if (!decisionDate) return null;

    // Check if this is the exact decision day
    const dateStr = date.toISOString().split('T')[0];
    const decisionStr = decisionDate.toISOString().split('T')[0];

    if (dateStr === decisionStr) {
      const estHour = TimezoneUtil.getESTHour(date);

      // 7:45-9:00 AM EST: US market reacts to ECB decision
      if (estHour >= 7 && estHour < 10) {
        return 'ECB-Decision-Day-USOpen';
      }

      return 'ECB-Decision-Day';
    }

    // Check if in the same week
    const weekStart = TimezoneUtil.getWeekStart(date);
    const weekEnd = TimezoneUtil.getWeekEnd(date);

    if (decisionDate >= weekStart && decisionDate <= weekEnd) {
      return 'ECB-Decision-Week';
    }

    return null;
  }

  /**
   * Analyze EUR/USD impact from ECB decision
   */
  analyzeEURUSDImpact(
    decisionDate: Date,
    eurUsdData: Array<{ date: Date; open: number; high: number; low: number; close: number; volume: number }>
  ): {
    isDecisionDay: boolean;
    eurUsdMove: number;
    volatility: number;
    insights: string[];
  } {
    const insights: string[] = [];

    // Find decision day data
    const decisionDayData = eurUsdData.filter(d => {
      const dateStr = d.date.toISOString().split('T')[0];
      const decisionStr = decisionDate.toISOString().split('T')[0];
      return dateStr === decisionStr;
    });

    if (decisionDayData.length === 0) {
      return {
        isDecisionDay: false,
        eurUsdMove: 0,
        volatility: 0,
        insights: ['No EUR/USD data available for ECB decision day'],
      };
    }

    // Calculate intraday move
    const firstCandle = decisionDayData[0];
    const lastCandle = decisionDayData[decisionDayData.length - 1];

    if (!firstCandle || !lastCandle) {
      return {
        isDecisionDay: false,
        eurUsdMove: 0,
        volatility: 0,
        insights: ['Insufficient EUR/USD data for analysis'],
      };
    }

    const dayOpen = firstCandle.open;
    const dayClose = lastCandle.close;
    const dayHigh = Math.max(...decisionDayData.map(d => d.high));
    const dayLow = Math.min(...decisionDayData.map(d => d.low));

    const eurUsdMove = ((dayClose - dayOpen) / dayOpen) * 100;
    const volatility = ((dayHigh - dayLow) / dayOpen) * 100;

    insights.push('🇪🇺 ECB decision: 8:15 AM CET announcement, 8:45 AM CET press conference');
    insights.push('🇺🇸 US market impact: 7:45-9:00 AM EST (pre-market and open)');

    if (Math.abs(eurUsdMove) > 0.5) {
      insights.push(`💱 EUR/USD significant move: ${eurUsdMove > 0 ? '+' : ''}${eurUsdMove.toFixed(2)}%`);
    }

    if (volatility > 1.0) {
      insights.push(`📊 High EUR/USD volatility: ${volatility.toFixed(2)}% intraday range`);
    }

    return {
      isDecisionDay: true,
      eurUsdMove,
      volatility,
      insights,
    };
  }

  private getECBDecisionDate(date: Date): Date | null {
    const dateStr = date.toISOString().split('T')[0];

    for (const decision of ECBDecisionExtractor.ECB_DECISIONS) {
      const decisionDate = new Date(decision);
      const weekStart = TimezoneUtil.getWeekStart(date);
      const weekEnd = TimezoneUtil.getWeekEnd(date);

      if (decisionDate >= weekStart && decisionDate <= weekEnd) {
        return decisionDate;
      }
    }

    return null;
  }

}

/**
 * Bank of England Decision Day Extractor
 * BoE Monetary Policy Committee (MPC) interest rate decisions
 *
 * Schedule: 8 meetings per year (roughly every 6 weeks)
 * Announcement: 12:00 PM GMT/BST (7:00 AM EST/EDT)
 * Minutes: Published simultaneously with decision
 * US Market Impact: Low to medium (affects GBP/USD, limited US equity impact)
 */
export class BoEDecisionExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'hourly' as const;

  /**
   * Bank of England MPC decision dates (2024-2026)
   * Source: bankofengland.co.uk
   */
  private static BOE_DECISIONS = [
    // 2024
    '2024-02-01', '2024-03-21', '2024-05-09', '2024-06-20',
    '2024-08-01', '2024-09-19', '2024-11-07', '2024-12-19',
    // 2025
    '2025-02-06', '2025-03-20', '2025-05-08', '2025-06-19',
    '2025-08-07', '2025-09-18', '2025-11-06', '2025-12-18',
    // 2026
    '2026-02-05', '2026-03-19', '2026-05-07', '2026-06-18',
    '2026-08-06', '2026-09-24', '2026-11-05', '2026-12-17',
  ];

  /**
   * Validated BoE decision dates (cached)
   */
  private static validatedDates: Date[] | null = null;

  constructor() {
    // Validate dates on first construction to fail fast
    if (!BoEDecisionExtractor.validatedDates) {
      BoEDecisionExtractor.validatedDates = validateDates(
        BoEDecisionExtractor.BOE_DECISIONS,
        'BoE decision dates'
      );
    }
  }

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const decisionDate = this.getBoEDecisionDate(date);

    if (!decisionDate) return null;

    const dateStr = date.toISOString().split('T')[0];
    const decisionStr = decisionDate.toISOString().split('T')[0];

    if (dateStr === decisionStr) {
      const estHour = TimezoneUtil.getESTHour(date);

      // 7:00-9:00 AM EST: BoE announcement impact window
      if (estHour >= 7 && estHour < 10) {
        return 'BoE-Decision-Day-USOpen';
      }

      return 'BoE-Decision-Day';
    }

    const weekStart = TimezoneUtil.getWeekStart(date);
    const weekEnd = TimezoneUtil.getWeekEnd(date);

    if (decisionDate >= weekStart && decisionDate <= weekEnd) {
      return 'BoE-Decision-Week';
    }

    return null;
  }

  private getBoEDecisionDate(date: Date): Date | null {
    const dateStr = date.toISOString().split('T')[0];

    for (const decision of BoEDecisionExtractor.BOE_DECISIONS) {
      const decisionDate = new Date(decision);
      const weekStart = TimezoneUtil.getWeekStart(date);
      const weekEnd = TimezoneUtil.getWeekEnd(date);

      if (decisionDate >= weekStart && decisionDate <= weekEnd) {
        return decisionDate;
      }
    }

    return null;
  }

}

/**
 * Bank of Japan Decision Day Extractor
 * BoJ Monetary Policy Meeting decisions
 *
 * Schedule: 8 meetings per year
 * Announcement: 11:00-12:00 PM JST (typically ~10:30 AM JST)
 * US Time: ~9:00 PM EST previous day (overnight for US markets)
 * Governor Press Conference: ~3:30 PM JST (~2:30 AM EST)
 * US Market Impact: Medium (affects USD/JPY, Asian equity futures)
 */
export class BoJDecisionExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'hourly' as const;

  /**
   * Bank of Japan MPM decision dates (2024-2026)
   * Source: boj.or.jp
   */
  private static BOJ_DECISIONS = [
    // 2024
    '2024-01-23', '2024-03-19', '2024-04-26', '2024-06-14',
    '2024-07-31', '2024-09-20', '2024-10-31', '2024-12-19',
    // 2025
    '2025-01-24', '2025-03-19', '2025-04-25', '2025-06-13',
    '2025-07-31', '2025-09-19', '2025-10-31', '2025-12-19',
    // 2026
    '2026-01-23', '2026-03-18', '2026-04-30', '2026-06-19',
    '2026-07-31', '2026-09-18', '2026-10-30', '2026-12-18',
  ];

  /**
   * Validated BoJ decision dates (cached)
   */
  private static validatedDates: Date[] | null = null;

  constructor() {
    // Validate dates on first construction to fail fast
    if (!BoJDecisionExtractor.validatedDates) {
      BoJDecisionExtractor.validatedDates = validateDates(
        BoJDecisionExtractor.BOJ_DECISIONS,
        'BoJ decision dates'
      );
    }
  }

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const decisionDate = this.getBoJDecisionDate(date);

    if (!decisionDate) return null;

    // BoJ decisions are announced at ~10:30 AM JST
    // In US time (EST), this is ~8:30 PM EST the PREVIOUS day (JST is 14 hours ahead of EST)
    // So we need to check both the decision date and the previous day in US time

    const dateStr = date.toISOString().split('T')[0];
    const decisionStr = decisionDate.toISOString().split('T')[0];

    // Check previous day in US (when announcement actually happens in US time)
    const nextDayInUS = new Date(date);
    nextDayInUS.setDate(nextDayInUS.getDate() + 1);
    const nextDayInUSStr = nextDayInUS.toISOString().split('T')[0];

    if (dateStr === decisionStr || nextDayInUSStr === decisionStr) {
      const estHour = TimezoneUtil.getESTHour(date);

      // 8:00-11:00 PM EST (previous day): BoJ decision announcement window
      if (dateStr === decisionStr && estHour >= 20 && estHour <= 23) {
        return 'BoJ-Decision-Overnight';
      }

      // 1:00-4:00 AM EST: Governor press conference
      if (nextDayInUSStr === decisionStr && estHour >= 1 && estHour <= 4) {
        return 'BoJ-Decision-PressConference';
      }

      return 'BoJ-Decision-Day';
    }

    const weekStart = TimezoneUtil.getWeekStart(date);
    const weekEnd = TimezoneUtil.getWeekEnd(date);

    if (decisionDate >= weekStart && decisionDate <= weekEnd) {
      return 'BoJ-Decision-Week';
    }

    return null;
  }

  private getBoJDecisionDate(date: Date): Date | null {
    const dateStr = date.toISOString().split('T')[0];

    for (const decision of BoJDecisionExtractor.BOJ_DECISIONS) {
      const decisionDate = new Date(decision);
      const weekStart = TimezoneUtil.getWeekStart(date);
      const weekEnd = TimezoneUtil.getWeekEnd(date);

      if (decisionDate >= weekStart && decisionDate <= weekEnd) {
        return decisionDate;
      }
    }

    return null;
  }

}
