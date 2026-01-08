/**
 * Event-Based Pattern Extractors
 * Detects patterns around market events (FOMC, options expiry, earnings)
 */

import type { PeriodExtractor, PeriodType } from './types.ts';
import { EventCalendar } from './event-calendar.ts';

/**
 * FOMC Week Extractor
 * Identifies weeks containing Federal Reserve meetings
 *
 * NOTE: For precise decision DAY detection with 2:00 PM EST hourly analysis,
 * use FedRateDecisionExtractor from central-bank-extractors.ts
 *
 * This extractor provides week-level granularity only.
 * For intraday patterns (2:00 PM announcement spike, dot plot releases),
 * use hourly timeframe with FedRateDecisionExtractor.
 */
export class FOMCWeekExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    return this.calendar.isFOMCWeek(date) ? 'FOMC-Week' : null;
  }

  /**
   * Check if FOMC meeting has dot plot release
   * Dot plots published quarterly: March, June, September, December
   */
  hasDotPlot(date: Date): boolean {
    const month = date.getMonth(); // 0-11
    return [2, 5, 8, 11].includes(month) && this.calendar.isFOMCWeek(date);
  }
}

/**
 * Options Expiry Week Extractor
 * Identifies weeks containing monthly options expiration (3rd Friday)
 */
export class OptionsExpiryWeekExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    return this.calendar.isOptionsExpiryWeek(date) ? 'Options-Expiry-Week' : null;
  }
}

/**
 * Earnings Season Extractor
 * Identifies earnings season months (typically Jan, Apr, Jul, Oct)
 */
export class EarningsSeasonExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    return this.calendar.isEarningsSeason(date) ? 'Earnings-Season' : null;
  }
}

/**
 * Generic Event Extractor
 * Extracts any event from calendar for given date
 */
export class GenericEventExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const events = this.calendar.getEventsForDate(date);

    if (events.length === 0) return null;

    // Return the highest impact event
    const highImpact = events.find(e => e.impact === 'high');
    if (highImpact) return highImpact.name;

    const mediumImpact = events.find(e => e.impact === 'medium');
    if (mediumImpact) return mediumImpact.name;

    return events[0]?.name || null;
  }
}

/**
 * Triple Witching Extractor
 * Identifies Triple Witching weeks (3rd Friday of Mar, Jun, Sep, Dec)
 * Triple Witching = Simultaneous expiration of stock options, stock index futures, and stock index options
 *
 * Market Impact:
 * - Extreme volume spikes (2-3× normal trading volume)
 * - High volatility throughout the week
 * - Price swings particularly on Friday
 * - Increased liquidity and potential for rapid moves
 */
export class TripleWitchingExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract Triple Witching period for a given timestamp
   * Returns:
   * - 'Triple-Witching-Week': Week containing 3rd Friday of Mar/Jun/Sep/Dec
   * - 'Triple-Witching-Day': The actual 3rd Friday
   * - null: Not a triple witching period
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const month = date.getMonth(); // 0-11

    // Triple Witching only occurs in March (2), June (5), September (8), December (11)
    if (![2, 5, 8, 11].includes(month)) return null;

    const tripleWitchingDate = this.getTripleWitchingDate(date.getFullYear(), month);

    // Check if this is the exact day
    const dateStr = date.toISOString().split('T')[0];
    const witchingDateStr = tripleWitchingDate.toISOString().split('T')[0];

    if (dateStr === witchingDateStr) {
      return 'Triple-Witching-Day';
    }

    // Check if in the same week
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    if (tripleWitchingDate >= weekStart && tripleWitchingDate <= weekEnd) {
      return 'Triple-Witching-Week';
    }

    return null;
  }

  /**
   * Detect volume spike characteristic of Triple Witching
   * Returns true if volume is 2-3× normal
   */
  detectVolumeSpike(currentVolume: number, avgVolume: number): boolean {
    const volumeRatio = currentVolume / avgVolume;
    return volumeRatio >= 2.0 && volumeRatio <= 3.5;
  }

  /**
   * Analyze event window around Triple Witching
   * Returns insights about price action and volume patterns
   */
  analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; volume: number; close: number; high: number; low: number }>
  ): {
    isTripleWitching: boolean;
    daysUntilEvent: number;
    avgVolumeSpike: number;
    volatilityIncrease: number;
    insights: string[];
  } {
    const tripleWitchingDate = this.getTripleWitchingDate(date.getFullYear(), date.getMonth());
    const daysUntil = Math.floor((tripleWitchingDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    const insights: string[] = [];
    let avgVolumeSpike = 0;
    let volatilityIncrease = 0;

    // Find data points in the event window (week before and week of)
    const eventWindowData = priceData.filter(d => {
      const daysDiff = Math.floor((d.date.getTime() - tripleWitchingDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= -7 && daysDiff <= 0;
    });

    if (eventWindowData.length > 0) {
      // Calculate average volume
      const normalVolume = priceData
        .filter(d => {
          const daysDiff = Math.floor((d.date.getTime() - tripleWitchingDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff < -14 && daysDiff >= -30;
        })
        .reduce((sum, d) => sum + d.volume, 0) / 16;

      const eventVolume = eventWindowData.reduce((sum, d) => sum + d.volume, 0) / eventWindowData.length;
      avgVolumeSpike = eventVolume / normalVolume;

      // Calculate volatility
      const normalVolatility = this.calculateVolatility(
        priceData.filter(d => {
          const daysDiff = Math.floor((d.date.getTime() - tripleWitchingDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff < -14 && daysDiff >= -30;
        })
      );
      const eventVolatility = this.calculateVolatility(eventWindowData);
      volatilityIncrease = (eventVolatility - normalVolatility) / normalVolatility;

      if (avgVolumeSpike > 2.0) {
        insights.push(`Extreme volume spike detected: ${avgVolumeSpike.toFixed(2)}× normal`);
      }
      if (volatilityIncrease > 0.3) {
        insights.push(`High volatility increase: +${(volatilityIncrease * 100).toFixed(1)}%`);
      }
      if (daysUntil <= 2 && daysUntil >= 0) {
        insights.push('Triple Witching imminent: Expect increased volatility and volume');
      }
    }

    return {
      isTripleWitching: daysUntil >= -7 && daysUntil <= 0,
      daysUntilEvent: daysUntil,
      avgVolumeSpike,
      volatilityIncrease,
      insights,
    };
  }

  /**
   * Get the 3rd Friday of a given month
   */
  private getTripleWitchingDate(year: number, month: number): Date {
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

    // Fallback (should not reach here)
    return new Date(year, month + 1, 0);
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  private calculateVolatility(data: Array<{ high: number; low: number; close: number }>): number {
    if (data.length < 2) return 0;

    const returns = data.slice(1).map((d, i) =>
      Math.log(d.close / data[i].close)
    );

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance);
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private getWeekEnd(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}

/**
 * GDP Release Extractor
 * Identifies GDP release periods (Advance, Second, Third estimates)
 *
 * GDP Release Schedule:
 * - Advance Estimate: ~30 days after quarter end (highest market impact)
 * - Second Estimate: ~60 days after quarter end (moderate impact)
 * - Third Estimate: ~90 days after quarter end (lowest impact)
 *
 * Market Impact:
 * - Advance: High volatility, significant price moves
 * - Second: Medium volatility, modest adjustments
 * - Third: Low volatility, minimal impact unless major revision
 */
export class GDPExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract GDP release period for a given timestamp
   * Returns:
   * - 'GDP-Advance-Week': Week containing advance estimate
   * - 'GDP-Second-Week': Week containing second estimate
   * - 'GDP-Third-Week': Week containing third estimate
   * - 'GDP-Release-Day': Actual release day
   * - null: Not a GDP release period
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const gdpRelease = this.getGDPReleaseInfo(date);

    if (!gdpRelease) return null;

    // Check if this is the exact release day
    const dateStr = date.toISOString().split('T')[0];
    const releaseStr = gdpRelease.date.toISOString().split('T')[0];

    if (dateStr === releaseStr) {
      return `GDP-${gdpRelease.type}-Day`;
    }

    // Check if in the same week
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    if (gdpRelease.date >= weekStart && gdpRelease.date <= weekEnd) {
      return `GDP-${gdpRelease.type}-Week`;
    }

    return null;
  }

  /**
   * Analyze event window around GDP release
   * Returns insights about price action and expected volatility
   */
  analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; close: number; high: number; low: number; volume: number }>
  ): {
    isGDPWeek: boolean;
    releaseType: 'Advance' | 'Second' | 'Third' | null;
    daysUntilRelease: number;
    expectedImpact: 'high' | 'medium' | 'low';
    insights: string[];
  } {
    const gdpRelease = this.getGDPReleaseInfo(date);

    if (!gdpRelease) {
      return {
        isGDPWeek: false,
        releaseType: null,
        daysUntilRelease: -1,
        expectedImpact: 'low',
        insights: [],
      };
    }

    const daysUntil = Math.floor((gdpRelease.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const insights: string[] = [];

    // Determine expected impact
    let expectedImpact: 'high' | 'medium' | 'low' = 'low';
    if (gdpRelease.type === 'Advance') {
      expectedImpact = 'high';
      insights.push('Advance GDP estimate: Expect high volatility and significant price moves');
    } else if (gdpRelease.type === 'Second') {
      expectedImpact = 'medium';
      insights.push('Second GDP estimate: Moderate market impact expected');
    } else {
      expectedImpact = 'low';
      insights.push('Third GDP estimate: Minimal market impact unless major revision');
    }

    // Add timing insights
    if (daysUntil === 0) {
      insights.push('GDP release today: Watch for immediate market reaction');
    } else if (daysUntil === 1) {
      insights.push('GDP release tomorrow: Markets may position ahead of announcement');
    } else if (daysUntil >= -1 && daysUntil <= 2) {
      insights.push(`GDP release in ${daysUntil} days: Event window active`);
    }

    // Calculate pre-release volatility pattern
    const preReleaseData = priceData.filter(d => {
      const daysDiff = Math.floor((d.date.getTime() - gdpRelease.date.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= -5 && daysDiff < 0;
    });

    if (preReleaseData.length > 0) {
      const volatility = this.calculateVolatility(preReleaseData);
      if (volatility > 0.02) {
        insights.push('Elevated pre-release volatility detected');
      }
    }

    return {
      isGDPWeek: daysUntil >= -2 && daysUntil <= 2,
      releaseType: gdpRelease.type,
      daysUntilRelease: daysUntil,
      expectedImpact,
      insights,
    };
  }

  /**
   * Get GDP release information for a given date
   * Returns the nearest GDP release (Advance, Second, or Third) if within event window
   */
  private getGDPReleaseInfo(date: Date): {
    date: Date;
    type: 'Advance' | 'Second' | 'Third';
    quarter: string;
  } | null {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Calculate which quarter's data would be released around this date
    // GDP releases happen roughly 30, 60, and 90 days after quarter end

    // Q4 (Oct-Dec) releases: Late Jan, Late Feb, Late Mar
    // Q1 (Jan-Mar) releases: Late Apr, Late May, Late Jun
    // Q2 (Apr-Jun) releases: Late Jul, Late Aug, Late Sep
    // Q3 (Jul-Sep) releases: Late Oct, Late Nov, Late Dec

    const releases = this.getGDPReleasesForYear(year);

    // Find the nearest release within ±7 days
    for (const release of releases) {
      const daysDiff = Math.abs((date.getTime() - release.date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        return release;
      }
    }

    return null;
  }

  /**
   * Generate GDP release dates for a given year
   * Based on typical BEA (Bureau of Economic Analysis) schedule
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
   * Calculate volatility (standard deviation of returns)
   */
  private calculateVolatility(data: Array<{ high: number; low: number; close: number }>): number {
    if (data.length < 2) return 0;

    const returns = data.slice(1).map((d, i) =>
      Math.log(d.close / data[i].close)
    );

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance);
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private getWeekEnd(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}
/**
 * Election Extractor
 * Identifies US election periods (Presidential and Midterm elections)
 *
 * Election Schedule:
 * - Presidential: Every 4 years (2024, 2028, 2032...)
 * - Midterm: Every 2 years between presidential elections (2026, 2030...)
 * - Always on first Tuesday after first Monday in November
 *
 * Market Impact:
 * - High volatility and uncertainty T-30 to T+0
 * - Post-election rally or sell-off T+0 to T+10
 * - Extended event window (T-5 to T+10) due to high impact
 * - Presidential elections have higher impact than midterms
 */
export class ElectionExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract election period for a given timestamp
   * Returns:
   * - 'Presidential-Election-Window': T-5 to T+10 of presidential election
   * - 'Midterm-Election-Window': T-5 to T+10 of midterm election
   * - 'Election-Day': Actual election day
   * - null: Not in election window
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const electionInfo = this.getElectionInfo(date);

    if (!electionInfo) return null;

    // Check if this is the exact election day
    const dateStr = date.toISOString().split('T')[0];
    const electionStr = electionInfo.date.toISOString().split('T')[0];

    if (dateStr === electionStr) {
      return `${electionInfo.type}-Election-Day`;
    }

    // Check if within event window
    const daysFromElection = Math.floor(
      (date.getTime() - electionInfo.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Extended window: T-5 to T+10
    if (daysFromElection >= -5 && daysFromElection <= 10) {
      return `${electionInfo.type}-Election-Window`;
    }

    return null;
  }

  /**
   * Analyze event window around election
   * Returns insights about market positioning and expected volatility
   */
  analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; close: number; high: number; low: number; volume: number }>
  ): {
    isElectionWindow: boolean;
    electionType: 'Presidential' | 'Midterm' | null;
    daysUntilElection: number;
    expectedImpact: 'high' | 'medium' | 'low';
    phase: 'pre-election' | 'election-day' | 'post-election' | null;
    insights: string[];
  } {
    const electionInfo = this.getElectionInfo(date);

    if (!electionInfo) {
      return {
        isElectionWindow: false,
        electionType: null,
        daysUntilElection: -1,
        expectedImpact: 'low',
        phase: null,
        insights: [],
      };
    }

    const daysUntil = Math.floor(
      (electionInfo.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    const insights: string[] = [];

    // Determine phase
    let phase: 'pre-election' | 'election-day' | 'post-election' | null = null;
    if (daysUntil > 0) {
      phase = 'pre-election';
      insights.push(`${daysUntil} days until ${electionInfo.type} election`);
      insights.push('Elevated uncertainty and volatility expected');
    } else if (daysUntil === 0) {
      phase = 'election-day';
      insights.push('Election day: Watch for immediate market reaction');
    } else if (daysUntil < 0 && daysUntil >= -10) {
      phase = 'post-election';
      insights.push(`${Math.abs(daysUntil)} days after ${electionInfo.type} election`);
      insights.push('Post-election positioning and policy expectations driving market');
    }

    // Determine expected impact
    const expectedImpact = electionInfo.type === 'Presidential' ? 'high' : 'medium';

    if (electionInfo.type === 'Presidential') {
      insights.push('Presidential election: Higher market impact due to policy uncertainty');
    } else {
      insights.push('Midterm election: Moderate market impact, focus on Congressional control');
    }

    // Historical patterns
    if (phase === 'pre-election' && daysUntil <= 30) {
      insights.push('Historical pattern: Increased volatility in month before election');
    }
    if (phase === 'post-election' && daysUntil >= -5) {
      insights.push('Historical pattern: Post-election rally common if outcome is decisive');
    }

    return {
      isElectionWindow: daysUntil >= -10 && daysUntil <= 5,
      electionType: electionInfo.type,
      daysUntilElection: daysUntil,
      expectedImpact,
      phase,
      insights,
    };
  }

  /**
   * Get election information for a given date
   * Returns the nearest election if within extended event window (T-5 to T+10)
   */
  private getElectionInfo(date: Date): {
    date: Date;
    type: 'Presidential' | 'Midterm';
  } | null {
    // Election dates (2024-2032)
    const electionDates = [
      { date: new Date('2024-11-05'), type: 'Presidential' as const },
      { date: new Date('2026-11-03'), type: 'Midterm' as const },
      { date: new Date('2028-11-07'), type: 'Presidential' as const },
      { date: new Date('2030-11-05'), type: 'Midterm' as const },
      { date: new Date('2032-11-02'), type: 'Presidential' as const },
    ];

    // Find the nearest election within event window (T-5 to T+10)
    for (const election of electionDates) {
      const daysDiff = Math.floor(
        (date.getTime() - election.date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= -5 && daysDiff <= 10) {
        return election;
      }
    }

    return null;
  }
}

/**
 * Dividend Ex-Date Extractor
 * Identifies dividend ex-date windows (T-1 cum-dividend pattern)
 *
 * Dividend Ex-Date Mechanics:
 * - Ex-Date (T): First day stock trades without dividend rights
 * - Cum-Dividend (T-1): Last day to buy and receive dividend
 * - Pattern: Buying pressure on T-1, selling pressure on T
 *
 * Market Impact:
 * - Per-symbol basis (requires fundamentals API)
 * - Quarterly for most US stocks
 * - Price typically drops by dividend amount on ex-date
 * - T-1 buying pressure for dividend capture
 */
export class DividendExDateExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;
  private symbol: string;

  constructor(private calendar: EventCalendar, symbol: string) {
    this.symbol = symbol;
  }

  /**
   * Extract dividend ex-date period for a given timestamp
   * Returns:
   * - 'Dividend-Cum-Date': T-1 (last day to buy for dividend)
   * - 'Dividend-Ex-Date': T (first day without dividend rights)
   * - null: Not a dividend date
   *
   * Note: This extractor is async-aware but extract() must be synchronous
   * Use analyzeEventWindow() for full async analysis
   */
  extract(timestamp: number): string | null {
    // Since extract() must be synchronous, we return null here
    // Use analyzeEventWindow() for actual dividend detection
    // This is a limitation of the PeriodExtractor interface
    return null;
  }

  /**
   * Analyze dividend event window (async version)
   * Returns insights about dividend capture patterns
   */
  async analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; close: number; high: number; low: number; volume: number }>
  ): Promise<{
    isDividendWindow: boolean;
    daysUntilExDate: number;
    phase: 'cum-dividend' | 'ex-dividend' | 'post-ex' | null;
    estimatedDividend: number | null;
    insights: string[];
  }> {
    const exDates = await this.calendar.getDividendExDates(this.symbol);

    if (exDates.length === 0) {
      return {
        isDividendWindow: false,
        daysUntilExDate: -1,
        phase: null,
        estimatedDividend: null,
        insights: [`${this.symbol} does not pay dividends or data unavailable`],
      };
    }

    // Find nearest ex-date
    let nearestExDate: Date | null = null;
    let minDiff = Infinity;

    for (const exDate of exDates) {
      const daysDiff = Math.abs(
        (date.getTime() - exDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff < minDiff) {
        minDiff = daysDiff;
        nearestExDate = exDate;
      }
    }

    if (!nearestExDate || minDiff > 5) {
      return {
        isDividendWindow: false,
        daysUntilExDate: -1,
        phase: null,
        estimatedDividend: null,
        insights: [],
      };
    }

    const daysUntil = Math.floor(
      (nearestExDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    const insights: string[] = [];

    // Determine phase
    let phase: 'cum-dividend' | 'ex-dividend' | 'post-ex' | null = null;
    if (daysUntil === 1) {
      phase = 'cum-dividend';
      insights.push('Cum-dividend day (T-1): Last day to buy for dividend');
      insights.push('Expect increased buying pressure for dividend capture');
    } else if (daysUntil === 0) {
      phase = 'ex-dividend';
      insights.push('Ex-dividend day (T): Stock trades without dividend rights');
      insights.push('Price typically drops by dividend amount at open');
    } else if (daysUntil < 0 && daysUntil >= -2) {
      phase = 'post-ex';
      insights.push('Post ex-dividend: Price adjustment completed');
    }

    // Estimate dividend from price drop (if ex-date is in historical data)
    let estimatedDividend: number | null = null;
    const exDateData = priceData.find(
      d => d.date.toISOString().split('T')[0] === nearestExDate!.toISOString().split('T')[0]
    );
    const prevDateData = priceData.find(d => {
      const prevDate = new Date(nearestExDate!);
      prevDate.setDate(prevDate.getDate() - 1);
      return d.date.toISOString().split('T')[0] === prevDate.toISOString().split('T')[0];
    });

    if (exDateData && prevDateData) {
      estimatedDividend = prevDateData.close - exDateData.close;
      if (estimatedDividend > 0) {
        insights.push(`Estimated dividend: $${estimatedDividend.toFixed(2)}`);
      }
    }

    return {
      isDividendWindow: Math.abs(daysUntil) <= 2,
      daysUntilExDate: daysUntil,
      phase,
      estimatedDividend,
      insights,
    };
  }
}

/**
 * Index Rebalancing Extractor
 * Identifies index rebalancing periods for S&P 500 and Russell 2000
 *
 * Rebalancing Schedule:
 * - S&P 500: Quarterly rebalancing (3rd Friday of Mar, Jun, Sep, Dec)
 * - Russell 2000: Annual reconstitution (last Friday of June)
 *
 * Market Impact:
 * - Volume spikes (2-5× normal) on rebalancing day
 * - Front-running patterns T-5 to T+0
 * - Stocks added to index see buying pressure
 * - Stocks removed see selling pressure
 * - Russell reconstitution has highest impact (10-20% of June volume)
 */
export class IndexRebalancingExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract index rebalancing period for a given timestamp
   * Returns:
   * - 'SP500-Rebalancing-Window': T-5 to T+0 of S&P 500 quarterly rebalancing
   * - 'Russell-Reconstitution-Window': T-5 to T+0 of Russell 2000 annual reconstitution
   * - 'Rebalancing-Day': Actual rebalancing day
   * - null: Not in rebalancing window
   */
  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    const rebalancingInfo = this.getRebalancingInfo(date);

    if (!rebalancingInfo) return null;

    // Check if this is the exact rebalancing day
    const dateStr = date.toISOString().split('T')[0];
    const rebalancingStr = rebalancingInfo.date.toISOString().split('T')[0];

    if (dateStr === rebalancingStr) {
      return `${rebalancingInfo.index === 'S&P 500' ? 'SP500' : 'Russell'}-Rebalancing-Day`;
    }

    // Check if within front-running window (T-5 to T+0)
    const daysFromRebalancing = Math.floor(
      (date.getTime() - rebalancingInfo.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysFromRebalancing >= -5 && daysFromRebalancing <= 0) {
      if (rebalancingInfo.type === 'annual-reconstitution') {
        return 'Russell-Reconstitution-Window';
      }
      return 'SP500-Rebalancing-Window';
    }

    return null;
  }

  /**
   * Analyze rebalancing event window
   * Returns insights about volume patterns and front-running
   */
  analyzeEventWindow(
    date: Date,
    priceData: Array<{ date: Date; close: number; high: number; low: number; volume: number }>
  ): {
    isRebalancingWindow: boolean;
    indexName: 'S&P 500' | 'Russell 2000' | null;
    rebalancingType: 'quarterly' | 'annual-reconstitution' | null;
    daysUntilRebalancing: number;
    phase: 'front-running' | 'rebalancing-day' | 'post-rebalancing' | null;
    expectedVolumeSpike: number;
    insights: string[];
  } {
    const rebalancingInfo = this.getRebalancingInfo(date);

    if (!rebalancingInfo) {
      return {
        isRebalancingWindow: false,
        indexName: null,
        rebalancingType: null,
        daysUntilRebalancing: -1,
        phase: null,
        expectedVolumeSpike: 0,
        insights: [],
      };
    }

    const daysUntil = Math.floor(
      (rebalancingInfo.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    const insights: string[] = [];

    // Determine phase
    let phase: 'front-running' | 'rebalancing-day' | 'post-rebalancing' | null = null;
    if (daysUntil > 0 && daysUntil <= 5) {
      phase = 'front-running';
      insights.push(`T-${daysUntil}: Front-running period before ${rebalancingInfo.index} rebalancing`);
      insights.push('Index funds positioning ahead of rebalancing');
    } else if (daysUntil === 0) {
      phase = 'rebalancing-day';
      insights.push(`${rebalancingInfo.index} rebalancing day`);
      insights.push('Expect extreme volume spike at market close');
    } else if (daysUntil < 0 && daysUntil >= -2) {
      phase = 'post-rebalancing';
      insights.push('Post-rebalancing: Volume normalizing');
    }

    // Expected volume spike
    let expectedVolumeSpike = 1.0;
    if (rebalancingInfo.type === 'annual-reconstitution') {
      expectedVolumeSpike = 4.0; // Russell reconstitution: 3-5× normal volume
      insights.push('Russell reconstitution: Highest volume event of the quarter');
      insights.push('Expected volume spike: 3-5× normal trading volume');
    } else {
      expectedVolumeSpike = 2.5; // S&P quarterly: 2-3× normal volume
      insights.push('S&P 500 quarterly rebalancing');
      insights.push('Expected volume spike: 2-3× normal trading volume');
    }

    // Front-running insights
    if (phase === 'front-running') {
      insights.push('Front-running strategy: Long stocks likely to be added, short stocks likely to be removed');
    }

    return {
      isRebalancingWindow: daysUntil >= -2 && daysUntil <= 5,
      indexName: rebalancingInfo.index,
      rebalancingType: rebalancingInfo.type,
      daysUntilRebalancing: daysUntil,
      phase,
      expectedVolumeSpike,
      insights,
    };
  }

  /**
   * Get rebalancing information for a given date
   * Returns the nearest rebalancing if within event window (T-5 to T+2)
   */
  private getRebalancingInfo(date: Date): {
    date: Date;
    index: 'S&P 500' | 'Russell 2000';
    type: 'quarterly' | 'annual-reconstitution';
  } | null {
    const year = date.getFullYear();
    const month = date.getMonth();

    // S&P 500 quarterly rebalancing (3rd Friday of Mar, Jun, Sep, Dec)
    const sp500Months = [2, 5, 8, 11]; // Mar, Jun, Sep, Dec (0-indexed)
    if (sp500Months.includes(month)) {
      const thirdFriday = this.calculateThirdFriday(year, month);
      const daysDiff = Math.floor(
        (date.getTime() - thirdFriday.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= -5 && daysDiff <= 2) {
        return {
          date: thirdFriday,
          index: 'S&P 500',
          type: 'quarterly',
        };
      }
    }

    // Russell 2000 annual reconstitution (last Friday of June)
    if (month === 5) {
      // June (0-indexed)
      const lastFridayJune = this.calculateLastFridayOfMonth(year, 5);
      const daysDiff = Math.floor(
        (date.getTime() - lastFridayJune.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= -5 && daysDiff <= 2) {
        return {
          date: lastFridayJune,
          index: 'Russell 2000',
          type: 'annual-reconstitution',
        };
      }
    }

    return null;
  }

  /**
   * Calculate 3rd Friday of month
   */
  private calculateThirdFriday(year: number, month: number): Date {
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
  private calculateLastFridayOfMonth(year: number, month: number): Date {
    const lastDay = new Date(year, month + 1, 0);

    while (lastDay.getDay() !== 5) {
      lastDay.setDate(lastDay.getDate() - 1);
    }

    return lastDay;
  }
}
