/**
 * Seasonal Patterns Module
 * Multi-timeframe seasonal analysis with pattern extractors and event calendar
 */

// Export types
export type {
  SeasonalTimeframe,
  PeriodType,
  SeasonalPattern,
  PeriodExtractor,
  TimeframeDataFetcher,
  CandleData,
  SeasonalAnalysisInput,
  SeasonalAnalysisResult,
} from './types.ts';

// Export data fetchers
export {
  DailyDataFetcher,
  HourlyDataFetcher,
  FiveMinuteDataFetcher,
  getDataFetcher,
} from './data-fetcher.ts';

// Export extractors
export {
  HourOfDayExtractor,
  MarketSessionExtractor,
  MonthOfYearExtractor,
  QuarterExtractor,
  DayOfWeekExtractor,
  WeekPositionExtractor,
  DayOfMonthExtractor,
  WeekOfMonthExtractor,
  WeekOfYearExtractor,
  getExtractor,
  getCompatibleExtractors,
} from './extractors.ts';

// Export event calendar and event extractors
export {
  EventCalendar,
} from './event-calendar.ts';

export type {
  CalendarEvent,
  EventCalendarConfig,
} from './event-calendar.ts';

export {
  FOMCWeekExtractor,
  OptionsExpiryWeekExtractor,
  EarningsSeasonExtractor,
  GenericEventExtractor,
  TripleWitchingExtractor,
  GDPExtractor,
  ElectionExtractor,
  DividendExDateExtractor,
  IndexRebalancingExtractor,
} from './event-extractors.ts';

// Export CPI and NFP extractors (Issues #4 and #5)
export {
  CPIExtractor,
  NFPExtractor,
} from './cpi-nfp-extractors.ts';

// Export central bank decision extractors (Issues #8 and #9)
export {
  FedRateDecisionExtractor,
  ECBDecisionExtractor,
  BoEDecisionExtractor,
  BoJDecisionExtractor,
} from './central-bank-extractors.ts';
