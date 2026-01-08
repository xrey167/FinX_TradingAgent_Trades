/**
 * Market Data Fetching Tool (MCP)
 *
 * This tool fetches real historical OHLCV data from EODHD API
 * for a given market and timeframe.
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { getEODHDClient } from '../lib/eodhd-client-singleton.ts';
import { globalToolCache } from '../lib/tool-cache.ts';
import type { EODData, IntradayData } from '../lib/eodhd-client.ts';
import type { OHLCVCandle, MarketSymbol, Timeframe } from '../types.ts';
import { formatToolResult, formatToolError, requireEnvVar, createCacheKey } from './helpers.ts';

/**
 * Input schema for market data fetching
 */
const marketDataInputSchema = z.object({
  market: z.string().describe('Market symbol (e.g., US_INDICES, VIX, GOLD, EURUSD, DAX, USDJPY)'),
  timeframe: z.string().describe('Timeframe (H1, DAILY, WEEKLY)'),
  bars: z.number().int().positive().describe('Number of historical bars to fetch'),
});

/**
 * Map internal market symbols to EODHD symbols
 */
const MARKET_TO_EODHD_SYMBOL: Record<MarketSymbol, string> = {
  US_INDICES: 'SPY.US', // S&P 500 ETF
  VIX: '^VIX.INDX',
  GOLD: 'GLD.US', // Gold ETF
  EURUSD: 'EURUSD.FOREX',
  DAX: 'DAX.INDX',
  USDJPY: 'USDJPY.FOREX',
};

/**
 * Market data fetching tool definition
 */
export const fetchMarketDataTool = tool(
  'fetch_market_data',
  'Fetches real historical OHLCV (Open, High, Low, Close, Volume) data from EODHD API for a specific market and timeframe. Returns an array of candlestick data.',
  marketDataInputSchema.shape,
  async (args) => {
    try {
      requireEnvVar('EODHD_API_KEY');
      const { market, timeframe, bars } = args;
      const symbol = MARKET_TO_EODHD_SYMBOL[market as MarketSymbol];

      if (!symbol) {
        throw new Error(`Unknown market symbol: ${market}`);
      }

      const cacheKey = createCacheKey('fetch_market_data', { market, timeframe, bars });

      // Try cache first (5 minute TTL for market data)
      const result = await globalToolCache.getOrFetch(
        cacheKey,
        5 * 60 * 1000, // 5 minutes
        async () => {
          const client = getEODHDClient();
          let data: OHLCVCandle[];

          if (timeframe === 'H1') {
            // Use intraday data for H1
            const rawData: IntradayData[] = await client.getIntradayData(symbol, '1h');
            data = rawData.slice(-bars).map((candle) => ({
              timestamp: new Date(candle.datetime).getTime(),
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
            }));
          } else {
            // Use EOD data for DAILY and WEEKLY
            const rawData: EODData[] = await client.getEODData(symbol);

            // For weekly, aggregate daily data (take every 5th bar as approximation)
            let filteredData = rawData;
            if (timeframe === 'WEEKLY') {
              filteredData = rawData.filter((_, index) => index % 5 === 0);
            }

            data = filteredData.slice(-bars).map((candle) => ({
              timestamp: new Date(candle.date).getTime(),
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
            }));
          }

          return {
            market,
            timeframe,
            symbol,
            bars: data.length,
            data,
          };
        }
      );

      return formatToolResult(result, {
        sourceUrl:
          timeframe === 'H1'
            ? `https://eodhd.com/api/intraday/${symbol}?interval=1h`
            : `https://eodhd.com/api/eod/${symbol}`,
        timestamp: new Date().toISOString(),
        apiCost: timeframe === 'H1' ? 5 : 1,
      });
    } catch (error) {
      return formatToolError(error, 'Error fetching market data');
    }
  }
);
