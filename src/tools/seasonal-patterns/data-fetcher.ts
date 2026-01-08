/**
 * Multi-Timeframe Data Fetchers for Seasonal Analysis
 * Abstracts data fetching from EODHD API for different timeframes
 */

import { getEODHDClient } from '../../lib/eodhd-client-singleton.ts';
import type { EODData, IntradayData } from '../../lib/eodhd-client.ts';
import type { CandleData, SeasonalTimeframe, TimeframeDataFetcher } from './types.ts';

/**
 * Daily Data Fetcher - Uses EOD (End of Day) data
 * Cost: 1 API call
 */
export class DailyDataFetcher implements TimeframeDataFetcher {
  async fetch(symbol: string, years: number): Promise<CandleData[]> {
    const client = getEODHDClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);

    const from = startDate.toISOString().split('T')[0];
    const to = endDate.toISOString().split('T')[0];

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

  getCostEstimate(): number {
    return 1; // 1 API call for EOD data
  }

  getTimeframe(): SeasonalTimeframe {
    return 'daily';
  }
}

/**
 * Hourly Data Fetcher - Uses Intraday data (1h interval)
 * Cost: 5 API calls
 * Limitation: EODHD intraday data typically limited to 1-2 years
 */
export class HourlyDataFetcher implements TimeframeDataFetcher {
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

  getCostEstimate(): number {
    return 5; // 5 API calls for intraday data
  }

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
