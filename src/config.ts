/**
 * Configuration for FinX Trading Agent - Market Regime Analysis
 */

import type { MarketSymbol, Timeframe, RegimeDetectionConfig } from './types.ts';

/**
 * List of markets to analyze
 */
export const MARKETS: MarketSymbol[] = [
  'US_INDICES',
  'VIX',
  'GOLD',
  'EURUSD',
  'DAX',
  'USDJPY',
];

/**
 * List of timeframes to analyze
 */
export const TIMEFRAMES: Timeframe[] = [
  'H1',
  'DAILY',
  'WEEKLY',
];

/**
 * Number of historical bars to fetch for analysis
 */
export const HISTORICAL_BARS = {
  H1: 100,      // 100 hours (~4 days)
  DAILY: 100,   // 100 days (~3-4 months)
  WEEKLY: 52,   // 52 weeks (~1 year)
};

/**
 * Regime detection configuration
 */
export const REGIME_CONFIG: RegimeDetectionConfig = {
  // Trend detection
  trendSlopeThreshold: 0.001,      // Minimum slope to consider a trend
  strongTrendThreshold: 0.005,     // Threshold for strong trend

  // Momentum thresholds (RSI-based)
  rsiOverbought: 70,               // RSI above 70 = overbought
  rsiOversold: 30,                 // RSI below 30 = oversold
  momentumThreshold: 60,           // RSI for momentum regime

  // Mean reversion thresholds
  bbWidthThreshold: 0.02,          // Bollinger Band width for range
  rangeConfinementThreshold: 0.8,  // How confined to range (0-1)

  // Volatility thresholds (ATR-based)
  highVolatilityThreshold: 2.0,    // High volatility multiplier
  lowVolatilityThreshold: 0.5,     // Low volatility multiplier
};

/**
 * Claude model configuration
 */
export const MODEL_CONFIG = {
  defaultModel: 'claude-sonnet-4-5-20241022',
  maxTurns: 50,
  allowedTools: ['Task', 'fetch_market_data', 'analyze_regime'],
};

/**
 * MCP Server name for our custom tools
 */
export const MCP_SERVER_NAME = 'market-regime-analyzer';

/**
 * Market display names for user-friendly output
 */
export const MARKET_DISPLAY_NAMES: Record<MarketSymbol, string> = {
  US_INDICES: 'US Stock Indices (S&P 500, NASDAQ, DOW)',
  VIX: 'VIX (Volatility Index)',
  GOLD: 'Gold (XAU/USD)',
  EURUSD: 'EUR/USD',
  DAX: 'DAX (German Stock Index)',
  USDJPY: 'USD/JPY',
};

/**
 * Timeframe display names
 */
export const TIMEFRAME_DISPLAY_NAMES: Record<Timeframe, string> = {
  H1: '1 Hour',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
};

/**
 * EODHD API Configuration
 */
export const EODHD_CONFIG = {
  BASE_URL: 'https://eodhd.com/api',
  RATE_LIMITS: {
    PER_MINUTE: 1000,
    PER_DAY: 100000,
  },
  CACHE_TTL: {
    EOD: 5 * 60 * 1000, // 5 minutes
    INTRADAY: 1 * 60 * 1000, // 1 minute
    FUNDAMENTALS: 30 * 60 * 1000, // 30 minutes
    NEWS: 2 * 60 * 1000, // 2 minutes
  },
  API_CALL_COSTS: {
    EOD: 1,
    INTRADAY: 5,
    FUNDAMENTALS: 10,
    NEWS: 5,
    SENTIMENT: 5,
    REALTIME: 1,
  },
};
