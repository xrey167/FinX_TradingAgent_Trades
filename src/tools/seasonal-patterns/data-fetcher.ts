/**
 * Multi-Timeframe Data Fetchers for Seasonal Analysis
 * Abstracts data fetching from EODHD API for different timeframes
 */

import { getEODHDClient } from '../../lib/eodhd-client-singleton.ts';
import type { EODData, IntradayData } from '../../lib/eodhd-client.ts';
import type { CandleData, SeasonalTimeframe, TimeframeDataFetcher } from './types.ts';
import { TimezoneUtil } from './timezone-utils.ts';

/**
 * Daily Data Fetcher - Uses EOD (End of Day) data
 *
 * Fetches historical daily OHLCV data from EODHD API.
 * This is the most cost-efficient timeframe (1 API call per fetch).
 *
 * Use Cases:
 * - Long-term seasonal pattern analysis
 * - Multi-year trend identification
 * - Day-of-week and month-of-year patterns
 *
 * Cost: 1 API call
 *
 * @example
 * ```typescript
 * const fetcher = new DailyDataFetcher();
 * const data = await fetcher.fetch('AAPL.US', 5); // 5 years of daily data
 * console.log(`Fetched ${data.length} daily candles`);
 * ```
 */
export class DailyDataFetcher implements TimeframeDataFetcher {
  /**
   * Fetch daily OHLCV data for a symbol
   *
   * @param symbol - Stock symbol in EODHD format (e.g., 'AAPL.US', 'MSFT.US')
   * @param years - Number of years of historical data to fetch (1-20 recommended)
   * @returns Array of daily candle data with OHLCV and timestamps
   *
   * @throws {Error} If API request fails or symbol is invalid
   */
  async fetch(symbol: string, years: number): Promise<CandleData[]> {
    const client = getEODHDClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);

    const from = TimezoneUtil.formatISODate(startDate);
    const to = TimezoneUtil.formatISODate(endDate);

    // Fetch EOD data
    const data: EODData[] = await client.getEODData(symbol, from, to);

    // Convert to CandleData format
    return data.map((d) => ({
      date: d.date,
      timestamp: new Date(d.date).getTime(),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
  }

  /**
   * Get estimated API call cost for this fetcher
   *
   * @returns Number of API calls required (always 1 for daily data)
   */
  getCostEstimate(): number {
    return 1; // 1 API call for EOD data
  }

  /**
   * Get the timeframe this fetcher provides
   *
   * @returns The timeframe string ('daily')
   */
  getTimeframe(): SeasonalTimeframe {
    return 'daily';
  }
}

/**
 * Hourly Data Fetcher - Uses Intraday data (1h interval)
 *
 * Fetches historical hourly OHLCV data from EODHD API.
 * Provides intraday granularity for analyzing hour-of-day patterns.
 *
 * Use Cases:
 * - Intraday volatility analysis around announcements
 * - Hour-of-day seasonality patterns
 * - Pre-market and after-hours activity
 * - Economic announcement spike detection (8:30 AM, 2:00 PM EST)
 *
 * Limitations:
 * - EODHD intraday data typically limited to 1-2 years
 * - Higher API cost (5 calls vs 1 for daily data)
 * - Larger data volume to process
 *
 * Cost: 5 API calls
 *
 * @example
 * ```typescript
 * const fetcher = new HourlyDataFetcher();
 * const data = await fetcher.fetch('SPY.US', 1); // 1 year of hourly data
 * console.log(`Fetched ${data.length} hourly candles`);
 * ```
 */
export class HourlyDataFetcher implements TimeframeDataFetcher {
  /**
   * Fetch hourly OHLCV data for a symbol
   *
   * @param symbol - Stock symbol in EODHD format (e.g., 'SPY.US', 'QQQ.US')
   * @param years - Number of years of historical data to fetch (1-2 recommended due to API limitations)
   * @returns Array of hourly candle data with OHLCV and timestamps
   *
   * @throws {Error} If API request fails or symbol is invalid
   *
   * @remarks
   * Automatically caps the request to 2 years due to EODHD intraday limitations.
   * Logs a warning if more than 2 years is requested.
   */
  async fetch(symbol: string, years: number): Promise<CandleData[]> {
    const client = getEODHDClient();

    // Warn if requesting more than 2 years (EODHD limitation)
    if (years > 2) {
      console.warn(
        `⚠️  EODHD intraday data limited to ~2 years. Requested ${years} years but may only get recent data.`
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - Math.min(years, 2)); // Cap at 2 years

    // EODHD intraday endpoint requires Unix timestamps, not ISO date strings
    const from = Math.floor(startDate.getTime() / 1000).toString();
    const to = Math.floor(endDate.getTime() / 1000).toString();

    // Fetch intraday data (1h interval)
    const data: IntradayData[] = await client.getIntradayData(symbol, '1h', from, to);

    // Convert to CandleData format
    return data.map((d) => {
      // IntradayData has 'datetime' instead of 'date'
      const timestamp = new Date(d.datetime).getTime();
      return {
        date: d.datetime,
        timestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      };
    });
  }

  /**
   * Get estimated API call cost for this fetcher
   *
   * @returns Number of API calls required (always 5 for hourly data)
   */
  getCostEstimate(): number {
    return 5; // 5 API calls for intraday data
  }

  /**
   * Get the timeframe this fetcher provides
   *
   * @returns The timeframe string ('hourly')
   */
  getTimeframe(): SeasonalTimeframe {
    return 'hourly';
  }
}

/**
 * 5-Minute Data Fetcher - Uses Intraday data (5m interval)
 * Cost: 5 API calls
 * Limitation: Very limited historical depth
 */
export class FiveMinuteDataFetcher implements TimeframeDataFetcher {
  async fetch(symbol: string, years: number): Promise<CandleData[]> {
    const client = getEODHDClient();

    // 5-minute data has even more limited history
    if (years > 1) {
      console.warn(`⚠️  5-minute data very limited. Requesting only 1 year max.`);
    }

    // Calculate date range (max 1 year)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // Max 1 year

    // EODHD intraday endpoint requires Unix timestamps, not ISO date strings
    const from = Math.floor(startDate.getTime() / 1000).toString();
    const to = Math.floor(endDate.getTime() / 1000).toString();

    // Fetch intraday data (5m interval)
    const data: IntradayData[] = await client.getIntradayData(symbol, '5m', from, to);

    // Convert to CandleData format
    return data.map((d) => {
      const timestamp = new Date(d.datetime).getTime();
      return {
        date: d.datetime,
        timestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      };
    });
  }

  getCostEstimate(): number {
    return 5; // 5 API calls for intraday data
  }

  getTimeframe(): SeasonalTimeframe {
    return '5min';
  }
}

/**
 * Factory function to get appropriate data fetcher for timeframe
 */
export function getDataFetcher(timeframe: SeasonalTimeframe): TimeframeDataFetcher {
  switch (timeframe) {
    case 'daily':
      return new DailyDataFetcher();
    case 'hourly':
      return new HourlyDataFetcher();
    case '5min':
      return new FiveMinuteDataFetcher();
    default:
      throw new Error(`Unknown timeframe: ${timeframe}`);
  }
}
