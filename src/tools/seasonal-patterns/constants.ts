/**
 * Constants for Seasonal Pattern Analysis
 *
 * Centralized magic numbers and thresholds used throughout the seasonal pattern system.
 * Using named constants improves code maintainability and makes values self-documenting.
 */

/**
 * US Market Trading Hours (EST/EDT)
 * All times in hours (24-hour format with decimals for minutes)
 */
export const MARKET_HOURS = {
  /** Pre-market trading starts at 4:00 AM EST */
  PRE_MARKET_START: 4,
  /** Regular market opens at 9:30 AM EST */
  MARKET_OPEN: 9.5,
  /** Regular market closes at 4:00 PM EST */
  MARKET_CLOSE: 16,
  /** After-hours trading ends at 8:00 PM EST */
  AFTER_HOURS_END: 20,
} as const;

/**
 * Economic Announcement Times (EST/EDT)
 * Common release times for economic indicators
 */
export const ANNOUNCEMENT_TIMES = {
  /** Federal Reserve rate decision announcements: 2:00 PM EST */
  FED_DECISION: 14,
  /** European Central Bank rate decisions: 7:45 AM EST */
  ECB_DECISION: 7.75,
  /** Consumer Price Index (CPI) releases: 8:30 AM EST */
  CPI_RELEASE: 8.5,
  /** Non-Farm Payrolls (NFP) releases: 8:30 AM EST */
  NFP_RELEASE: 8.5,
  /** Retail Sales releases: 8:30 AM EST */
  RETAIL_SALES_RELEASE: 8.5,
  /** ISM Manufacturing PMI releases: 10:00 AM EST */
  ISM_RELEASE: 10,
  /** Initial Jobless Claims releases: 8:30 AM EST */
  JOBLESS_CLAIMS_RELEASE: 8.5,
} as const;

/**
 * Volatility Thresholds
 * Used to classify market volatility levels
 * Values are in decimal form (e.g., 0.02 = 2%)
 */
export const VOLATILITY_THRESHOLDS = {
  /** High volatility threshold: 2% or more */
  HIGH: 0.02,
  /** Medium volatility threshold: 1% to 2% */
  MEDIUM: 0.01,
  /** Low volatility threshold: 0.5% to 1% */
  LOW: 0.005,
  /** Intraday spike threshold for hourly analysis: 1% */
  INTRADAY_SPIKE: 0.01,
} as const;

/**
 * Time Constants
 * Millisecond conversions for date calculations
 */
export const TIME_CONSTANTS = {
  /** Milliseconds in one day (24 hours) */
  MS_PER_DAY: 1000 * 60 * 60 * 24,
  /** Milliseconds in one hour */
  MS_PER_HOUR: 1000 * 60 * 60,
  /** Milliseconds in one minute */
  MS_PER_MINUTE: 1000 * 60,
  /** Milliseconds in one second */
  MS_PER_SECOND: 1000,
} as const;

/**
 * Event Window Sizes
 * Number of days to analyze before/after major events
 */
export const EVENT_WINDOWS = {
  /** Standard event window: T-5 to T+5 (10 trading days) */
  STANDARD: 5,
  /** Extended event window for high-impact events: T-10 to T+10 */
  EXTENDED: 10,
  /** Short event window for routine announcements: T-2 to T+2 */
  SHORT: 2,
} as const;

/**
 * Calendar Constants
 * Date-related constants for calendar calculations
 */
export const CALENDAR_CONSTANTS = {
  /** Maximum days in a month (safety check for loops) */
  MAX_DAYS_IN_MONTH: 31,
  /** Months in a year */
  MONTHS_PER_YEAR: 12,
  /** Days in a week */
  DAYS_PER_WEEK: 7,
  /** Sunday (0-indexed day of week) */
  SUNDAY: 0,
  /** Monday (0-indexed day of week) */
  MONDAY: 1,
  /** Friday (0-indexed day of week) */
  FRIDAY: 5,
  /** Saturday (0-indexed day of week) */
  SATURDAY: 6,
} as const;

/**
 * UTC Hour Offsets
 * UTC hour equivalents for major announcement times
 * Accounts for Daylight Saving Time (DST) variations
 */
export const UTC_HOURS = {
  /** 8:30 AM EST in UTC (winter: 13:30, summer: 12:30) */
  ANNOUNCEMENT_830AM_WINTER: 13.5,
  ANNOUNCEMENT_830AM_SUMMER: 12.5,
  /** 10:00 AM EST in UTC (winter: 15:00, summer: 14:00) */
  ANNOUNCEMENT_10AM_WINTER: 15,
  ANNOUNCEMENT_10AM_SUMMER: 14,
  /** 2:00 PM EST in UTC (winter: 19:00, summer: 18:00) */
  ANNOUNCEMENT_2PM_WINTER: 19,
  ANNOUNCEMENT_2PM_SUMMER: 18,
} as const;

/**
 * Data Quality Thresholds
 * Minimum data requirements for reliable analysis
 */
export const DATA_QUALITY = {
  /** Minimum candles required for volatility calculation */
  MIN_CANDLES_FOR_VOLATILITY: 2,
  /** Minimum historical years for seasonal analysis */
  MIN_YEARS_FOR_ANALYSIS: 1,
  /** Ideal historical years for robust patterns */
  IDEAL_YEARS_FOR_ANALYSIS: 5,
} as const;
