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
} from './event-extractors.ts';
