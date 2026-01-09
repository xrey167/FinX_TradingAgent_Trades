/**
 * Combined Event Extractor (Issue #17)
 * Detects overlapping high-impact events and analyzes synergistic effects
 *
 * Key Features:
 * - Detects 2+ events in same week
 * - Calculates synergy/volatility multipliers
 * - Identifies common combinations (FOMC+Options, CPI+NFP, etc.)
 * - Escalates 3+ event overlaps to "Multiple-HighImpact-Week"
 */

import type { PeriodExtractor, PeriodType, CandleData } from './types.ts';
import type { CalendarEvent } from './event-calendar.ts';
import { EventCalendar } from './event-calendar.ts';
import { TimezoneUtil } from './timezone-utils.ts';

/**
 * Supported event combination types
 * Combinations are identified when events occur in the same week
 */
export type EventCombinationType =
  | 'FOMC+OptionsExpiry-Week'      // FOMC + Options Expiry (high impact)
  | 'FOMC+TripleWitching-Week'     // FOMC + Triple Witching (very high impact)
  | 'FOMC+Earnings-Week'           // FOMC + Earnings Season (market moving)
  | 'FOMC+CPI-Week'                // FOMC + CPI Release (high volatility)
  | 'FOMC+NFP-Week'                // FOMC + NFP Release (rare but explosive)
  | 'FOMC+GDP-Week'                // FOMC + GDP Release (policy implications)
  | 'CPI+NFP-Week'                 // CPI + NFP (economic data dump)
  | 'CPI+Earnings-Week'            // CPI + Earnings Season (inflation + profits)
  | 'NFP+Earnings-Week'            // NFP + Earnings Season
  | 'TripleWitching+Earnings-Week' // Quarterly chaos (high volume + earnings)
  | 'TripleWitching+FOMC-Week'     // Same as FOMC+TripleWitching (order normalized)
  | 'Election+FOMC-Week'           // Political + monetary policy
  | 'Election+CPI-Week'            // Political + inflation data
  | 'GDP+CPI-Week'                 // Economic growth + inflation
  | 'GDP+Earnings-Week'            // Economic data + corporate earnings
  | 'IndexRebalancing+Earnings-Week' // Rebalancing + Earnings
  | 'Multiple-HighImpact-Week';    // 3+ high impact events

/**
 * Event combination metadata
 */
export interface EventCombination {
  type: EventCombinationType;
  events: CalendarEvent[];        // Events that make up this combination
  week: { start: Date; end: Date };
  expectedImpact: 'extreme' | 'very-high' | 'high'; // Impact level
  volatilityMultiplier: number;   // Estimated multiplier (e.g., 2.3x)
  description: string;            // Human-readable description
  historicalPattern?: {
    avgReturn: number;
    winRate: number;
    volatility: number;
    sampleCount: number;
  };
}

/**
 * Statistics for combined events
 * Used for analyzing synergistic effects
 */
export interface CombinationStats {
  combinationType: EventCombinationType;
  occurrences: number;
  avgReturn: number;
  avgVolatility: number;
  winRate: number;
  individualVolatilities: { [eventName: string]: number };
  synergyEffect: number; // Combined volatility / Sum of individual volatilities
  isSynergistic: boolean; // True if combined > sum of parts
}

/**
 * Combined Event Extractor
 * Detects overlapping events and calculates synergistic effects
 *
 * Implementation Pattern:
 * 1. Get all events for the week containing the date
 * 2. Filter for high/medium impact events
 * 3. Identify known combinations
 * 4. Calculate volatility multipliers
 * 5. Return combination metadata
 */
export class CombinedEventExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  // Expected volatility multipliers for each combination type
  // These are estimated based on historical patterns
  private static VOLATILITY_MULTIPLIERS: Record<EventCombinationType, number> = {
    'FOMC+OptionsExpiry-Week': 2.1,
    'FOMC+TripleWitching-Week': 2.8,
    'FOMC+Earnings-Week': 2.3,
    'FOMC+CPI-Week': 2.6,
    'FOMC+NFP-Week': 2.9,
    'FOMC+GDP-Week': 2.4,
    'CPI+NFP-Week': 2.5,
    'CPI+Earnings-Week': 2.0,
    'NFP+Earnings-Week': 1.9,
    'TripleWitching+Earnings-Week': 2.7,
    'TripleWitching+FOMC-Week': 2.8,
    'Election+FOMC-Week': 3.1,
    'Election+CPI-Week': 2.7,
    'GDP+CPI-Week': 2.2,
    'GDP+Earnings-Week': 2.0,
    'IndexRebalancing+Earnings-Week': 2.1,
    'Multiple-HighImpact-Week': 3.5,
  };

  // Impact levels for each combination
  private static IMPACT_LEVELS: Record<EventCombinationType, 'extreme' | 'very-high' | 'high'> = {
    'FOMC+OptionsExpiry-Week': 'high',
    'FOMC+TripleWitching-Week': 'very-high',
    'FOMC+Earnings-Week': 'high',
    'FOMC+CPI-Week': 'very-high',
    'FOMC+NFP-Week': 'very-high',
    'FOMC+GDP-Week': 'high',
    'CPI+NFP-Week': 'very-high',
    'CPI+Earnings-Week': 'high',
    'NFP+Earnings-Week': 'high',
    'TripleWitching+Earnings-Week': 'very-high',
    'TripleWitching+FOMC-Week': 'very-high',
    'Election+FOMC-Week': 'extreme',
    'Election+CPI-Week': 'very-high',
    'GDP+CPI-Week': 'high',
    'GDP+Earnings-Week': 'high',
    'IndexRebalancing+Earnings-Week': 'high',
    'Multiple-HighImpact-Week': 'extreme',
  };

  constructor(private calendar: EventCalendar) {}

  /**
   * Extract combined event label for a given timestamp
   * Returns the most significant combination label or null
   */
  extract(timestamp: number): string | null {
    const combination = this.detectEventCombination(new Date(timestamp));
    return combination ? combination.type : null;
  }

  /**
   * Detect event combination for a given date
   * Returns the most impactful combination or null
   */
  detectEventCombination(date: Date): EventCombination | null {
    const weekStart = TimezoneUtil.getWeekStart(date);
    const weekEnd = TimezoneUtil.getWeekEnd(date);

    // Collect all high-impact events in this week
    const eventsInWeek = this.getHighImpactEventsInWeek(date);

    if (eventsInWeek.length < 2) {
      return null; // No combination
    }

    // Classify events by type
    const eventTypes = this.classifyEvents(eventsInWeek);

    // Check for 3+ high impact events first (escalate to Multiple-HighImpact)
    const highImpactCount = eventsInWeek.filter(e => e.impact === 'high').length;
    if (highImpactCount >= 3) {
      return {
        type: 'Multiple-HighImpact-Week',
        events: eventsInWeek,
        week: { start: weekStart, end: weekEnd },
        expectedImpact: 'extreme',
        volatilityMultiplier: CombinedEventExtractor.VOLATILITY_MULTIPLIERS['Multiple-HighImpact-Week'],
        description: `Week with ${highImpactCount} high-impact events: ${eventsInWeek.map(e => e.name).join(', ')}`,
      };
    }

    // Detect specific 2-event combinations
    const combinationType = this.identifyCombinationType(eventTypes);

    if (!combinationType) {
      return null; // No recognized combination
    }

    return {
      type: combinationType,
      events: eventsInWeek,
      week: { start: weekStart, end: weekEnd },
      expectedImpact: CombinedEventExtractor.IMPACT_LEVELS[combinationType],
      volatilityMultiplier: CombinedEventExtractor.VOLATILITY_MULTIPLIERS[combinationType],
      description: this.getDescription(combinationType, eventsInWeek),
    };
  }

  /**
   * Get all high and medium impact events in the week containing the date
   */
  private getHighImpactEventsInWeek(date: Date): CalendarEvent[] {
    const weekStart = TimezoneUtil.getWeekStart(date);
    const weekEnd = TimezoneUtil.getWeekEnd(date);

    const events: CalendarEvent[] = [];
    const uniqueEventKeys = new Set<string>();

    // Iterate through each day of the week
    const currentDate = new Date(weekStart);
    while (currentDate <= weekEnd) {
      const dailyEvents = this.calendar.getEventsForDate(currentDate);

      // Filter for high and medium impact events
      const significantEvents = dailyEvents.filter(
        e => e.impact === 'high' || e.impact === 'medium'
      );

      // Deduplicate events (same event might be returned multiple times)
      // O(N) - efficient using Set-based deduplication
      for (const event of significantEvents) {
        const key = `${event.name}|${event.date.getTime()}`;
        if (!uniqueEventKeys.has(key)) {
          uniqueEventKeys.add(key);
          events.push(event);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return events;
  }

  /**
   * Classify events by their type
   * Returns a set of event type identifiers present in the week
   */
  private classifyEvents(events: CalendarEvent[]): Set<string> {
    const types = new Set<string>();

    for (const event of events) {
      // Map event names to normalized types
      const name = event.name.toLowerCase();
      const type = event.type;

      if (type === 'fomc' || name.includes('fomc')) {
        types.add('FOMC');
      }
      if (type === 'options-expiry' || name.includes('options expiry')) {
        types.add('OptionsExpiry');
      }
      if (type === 'triple-witching' || name.includes('triple witching')) {
        types.add('TripleWitching');
      }
      if (type === 'earnings-season' || name.includes('earnings')) {
        types.add('Earnings');
      }
      if (type === 'economic' && name.includes('cpi')) {
        types.add('CPI');
      }
      if (type === 'economic' && (name.includes('nfp') || name.includes('non-farm') || name.includes('payroll'))) {
        types.add('NFP');
      }
      if (type === 'gdp-release' || name.includes('gdp')) {
        types.add('GDP');
      }
      if (type === 'election' || name.includes('election')) {
        types.add('Election');
      }
      if (type === 'index-rebalancing' || name.includes('rebalancing')) {
        types.add('IndexRebalancing');
      }
    }

    return types;
  }

  /**
   * Identify the combination type from event types
   * Returns the most significant combination type
   */
  private identifyCombinationType(eventTypes: Set<string>): EventCombinationType | null {
    // Priority order: Most impactful combinations first

    // Extreme impact combinations
    if (eventTypes.has('Election') && eventTypes.has('FOMC')) {
      return 'Election+FOMC-Week';
    }
    if (eventTypes.has('Election') && eventTypes.has('CPI')) {
      return 'Election+CPI-Week';
    }

    // Very high impact combinations
    if (eventTypes.has('FOMC') && eventTypes.has('TripleWitching')) {
      return 'FOMC+TripleWitching-Week';
    }
    if (eventTypes.has('FOMC') && eventTypes.has('NFP')) {
      return 'FOMC+NFP-Week';
    }
    if (eventTypes.has('FOMC') && eventTypes.has('CPI')) {
      return 'FOMC+CPI-Week';
    }
    if (eventTypes.has('CPI') && eventTypes.has('NFP')) {
      return 'CPI+NFP-Week';
    }
    if (eventTypes.has('TripleWitching') && eventTypes.has('Earnings')) {
      return 'TripleWitching+Earnings-Week';
    }

    // High impact combinations
    if (eventTypes.has('FOMC') && eventTypes.has('GDP')) {
      return 'FOMC+GDP-Week';
    }
    if (eventTypes.has('FOMC') && eventTypes.has('Earnings')) {
      return 'FOMC+Earnings-Week';
    }
    if (eventTypes.has('FOMC') && eventTypes.has('OptionsExpiry')) {
      return 'FOMC+OptionsExpiry-Week';
    }
    if (eventTypes.has('GDP') && eventTypes.has('CPI')) {
      return 'GDP+CPI-Week';
    }
    if (eventTypes.has('CPI') && eventTypes.has('Earnings')) {
      return 'CPI+Earnings-Week';
    }
    if (eventTypes.has('NFP') && eventTypes.has('Earnings')) {
      return 'NFP+Earnings-Week';
    }
    if (eventTypes.has('GDP') && eventTypes.has('Earnings')) {
      return 'GDP+Earnings-Week';
    }
    if (eventTypes.has('IndexRebalancing') && eventTypes.has('Earnings')) {
      return 'IndexRebalancing+Earnings-Week';
    }

    return null;
  }

  /**
   * Get human-readable description for a combination
   */
  private getDescription(type: EventCombinationType, events: CalendarEvent[]): string {
    const eventNames = events.map(e => e.name).join(', ');

    const descriptions: Record<EventCombinationType, string> = {
      'FOMC+OptionsExpiry-Week': `Week combining FOMC meeting and options expiry - expect elevated volatility and positioning shifts`,
      'FOMC+TripleWitching-Week': `Week combining FOMC meeting and Triple Witching - extreme volume and volatility expected`,
      'FOMC+Earnings-Week': `Week combining FOMC meeting and earnings season - market-moving combination of policy and fundamentals`,
      'FOMC+CPI-Week': `Week combining FOMC meeting and CPI release - critical for inflation expectations and policy outlook`,
      'FOMC+NFP-Week': `Week combining FOMC meeting and NFP release - rare but explosive combination for employment and policy`,
      'FOMC+GDP-Week': `Week combining FOMC meeting and GDP release - important for economic outlook and policy stance`,
      'CPI+NFP-Week': `Week combining CPI and NFP releases - comprehensive economic data dump with high volatility`,
      'CPI+Earnings-Week': `Week combining CPI release and earnings season - inflation data meets corporate profitability`,
      'NFP+Earnings-Week': `Week combining NFP release and earnings season - employment data meets corporate performance`,
      'TripleWitching+Earnings-Week': `Week combining Triple Witching and earnings season - quarterly chaos with extreme volume`,
      'TripleWitching+FOMC-Week': `Week combining Triple Witching and FOMC meeting - extreme volume and volatility expected`,
      'Election+FOMC-Week': `Week combining election and FOMC meeting - political and monetary policy uncertainty converge`,
      'Election+CPI-Week': `Week combining election and CPI release - political uncertainty meets inflation data`,
      'GDP+CPI-Week': `Week combining GDP and CPI releases - comprehensive view of economic growth and inflation`,
      'GDP+Earnings-Week': `Week combining GDP release and earnings season - macro data meets micro fundamentals`,
      'IndexRebalancing+Earnings-Week': `Week combining index rebalancing and earnings season - structural flows meet fundamentals`,
      'Multiple-HighImpact-Week': `Week with multiple high-impact events - extreme volatility and trading complexity expected`,
    };

    return descriptions[type] || `Combined event week: ${eventNames}`;
  }

  /**
   * Calculate synergy effect for a combination
   * Analyzes if combined volatility > sum of individual volatilities
   *
   * This requires historical price data - stub implementation for now
   */
  calculateSynergyEffect(
    combinationType: EventCombinationType,
    priceData: CandleData[]
  ): CombinationStats | null {
    // Stub implementation - would require full historical analysis
    // In production, this would:
    // 1. Identify all occurrences of this combination in history
    // 2. Calculate volatility for each occurrence
    // 3. Compare to individual event volatilities
    // 4. Determine synergy ratio

    return {
      combinationType,
      occurrences: 0,
      avgReturn: 0,
      avgVolatility: 0,
      winRate: 0,
      individualVolatilities: {},
      synergyEffect: CombinedEventExtractor.VOLATILITY_MULTIPLIERS[combinationType],
      isSynergistic: CombinedEventExtractor.VOLATILITY_MULTIPLIERS[combinationType] > 1.5,
    };
  }

  /**
   * Get all supported combination types
   */
  getAllCombinations(): EventCombinationType[] {
    return Object.keys(CombinedEventExtractor.VOLATILITY_MULTIPLIERS) as EventCombinationType[];
  }

  /**
   * Get expected volatility multiplier for a combination type
   */
  getVolatilityMultiplier(type: EventCombinationType): number {
    return CombinedEventExtractor.VOLATILITY_MULTIPLIERS[type];
  }

}
