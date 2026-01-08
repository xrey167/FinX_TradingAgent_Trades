/**
 * Type definitions for FinX Trading Agent - Market Regime Analysis
 */

/**
 * Supported market symbols
 */
export type MarketSymbol =
  | 'US_INDICES'  // S&P 500, NASDAQ, DOW
  | 'VIX'         // Volatility Index
  | 'GOLD'        // Gold spot price
  | 'EURUSD'      // Euro / US Dollar
  | 'DAX'         // German stock index
  | 'USDJPY';     // US Dollar / Japanese Yen

/**
 * Supported timeframes for analysis
 */
export type Timeframe =
  | 'H1'      // 1 hour
  | 'DAILY'   // 1 day
  | 'WEEKLY'; // 1 week

/**
 * Market regime classifications
 */
export type MarketRegime =
  | 'MOMENTUM'        // Strong directional movement with momentum
  | 'TREND'           // Sustained directional movement
  | 'MEAN_REVERSION'  // Price oscillating around mean, good for range trading
  | 'DOWNTREND'       // Sustained downward movement
  | 'SIDEWAYS';       // Range-bound, no clear direction

/**
 * OHLCV (Open, High, Low, Close, Volume) candlestick data
 */
export interface OHLCVCandle {
  timestamp: number;      // Unix timestamp
  open: number;          // Opening price
  high: number;          // Highest price
  low: number;           // Lowest price
  close: number;         // Closing price
  volume: number;        // Trading volume
}

/**
 * Technical indicators used for regime detection
 */
export interface TechnicalIndicators {
  // Moving averages
  sma20?: number;        // Simple Moving Average (20 periods)
  sma50?: number;        // Simple Moving Average (50 periods)
  ema20?: number;        // Exponential Moving Average (20 periods)

  // Momentum indicators
  rsi?: number;          // Relative Strength Index (0-100)
  macd?: {               // Moving Average Convergence Divergence
    value: number;
    signal: number;
    histogram: number;
  };

  // Volatility indicators
  atr?: number;          // Average True Range
  bollingerBands?: {     // Bollinger Bands
    upper: number;
    middle: number;
    lower: number;
  };

  // Trend indicators
  adx?: number;          // Average Directional Index (0-100)
  slope?: number;        // Price slope/trend strength
}

/**
 * Regime analysis result for a specific market and timeframe
 */
export interface RegimeAnalysis {
  market: MarketSymbol;
  timeframe: Timeframe;
  regime: MarketRegime;
  confidence: number;              // 0-100, confidence in the regime classification
  indicators: TechnicalIndicators; // Technical indicators used in the analysis
  reasoning: string;               // Explanation of why this regime was chosen
  lastUpdated: number;             // Unix timestamp of last analysis
}

/**
 * Comprehensive market overview across all markets and timeframes
 */
export interface MarketOverview {
  timestamp: number;
  analyses: RegimeAnalysis[];
  summary: string;  // High-level summary of market conditions
}

/**
 * Configuration for regime detection algorithms
 */
export interface RegimeDetectionConfig {
  // Trend detection thresholds
  trendSlopeThreshold: number;      // Minimum slope to consider a trend
  strongTrendThreshold: number;     // Threshold for strong trend vs weak trend

  // Momentum thresholds
  rsiOverbought: number;            // RSI level for overbought (typically 70)
  rsiOversold: number;              // RSI level for oversold (typically 30)
  momentumThreshold: number;        // Minimum momentum for momentum regime

  // Mean reversion thresholds
  bbWidthThreshold: number;         // Bollinger Band width for range detection
  rangeConfinementThreshold: number; // How tightly confined to range

  // Volatility thresholds
  highVolatilityThreshold: number;  // ATR threshold for high volatility
  lowVolatilityThreshold: number;   // ATR threshold for low volatility
}

/**
 * Market data fetch request
 */
export interface MarketDataRequest {
  market: MarketSymbol;
  timeframe: Timeframe;
  bars: number;  // Number of historical bars to fetch
}

/**
 * Market data fetch response
 */
export interface MarketDataResponse {
  market: MarketSymbol;
  timeframe: Timeframe;
  data: OHLCVCandle[];
}

/**
 * Regime analysis request
 */
export interface RegimeAnalysisRequest {
  market: MarketSymbol;
  timeframe: Timeframe;
  ohlcv: OHLCVCandle[];
}

/**
 * Regime analysis response from the analyzer tool
 */
export interface RegimeAnalysisResponse {
  regime: MarketRegime;
  confidence: number;
  indicators: TechnicalIndicators;
  reasoning: string;
}
