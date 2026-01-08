/**
 * Event-Based Pattern Extractors
 * Detects patterns around market events (FOMC, options expiry, earnings)
 */

import type { PeriodExtractor, PeriodType } from './types.ts';
import { EventCalendar } from './event-calendar.ts';

/**
 * FOMC Week Extractor
 * Identifies weeks containing Federal Reserve meetings
 */
export class FOMCWeekExtractor implements PeriodExtractor {
  type: PeriodType = 'custom-event';
  requiredTimeframe = 'daily' as const;

  constructor(private calendar: EventCalendar) {}

  extract(timestamp: number): string | null {
    const date = new Date(timestamp);
    return this.calendar.isFOMCWeek(date) ? 'FOMC-Week' : null;
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
