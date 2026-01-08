/**
 * Market Regime Analyzer Tool (MCP)
 *
 * This tool analyzes OHLCV data to determine the current market regime.
 * Implements technical analysis algorithms including:
 * - Moving averages (SMA, EMA)
 * - Momentum indicators (RSI, MACD)
 * - Volatility indicators (ATR, Bollinger Bands)
 * - Trend detection (slope, ADX)
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { OHLCVCandle, MarketRegime, TechnicalIndicators } from '../types.ts';
import { REGIME_CONFIG } from '../config.ts';
import { formatToolResult, formatToolError } from './helpers.ts';

/**
 * Input schema for regime analysis
 */
const regimeAnalysisInputSchema = z.object({
  market: z.string().describe('Market symbol'),
  timeframe: z.string().describe('Timeframe'),
  ohlcv: z.array(z.any()).describe('Array of OHLCV candlestick data'),
});

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] ?? 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

/**
 * Calculate Exponential Moving Average
 */
function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] ?? 0;

  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(data.slice(0, period), period);

  for (let i = period; i < data.length; i++) {
    const val = data[i];
    if (val !== undefined) {
      ema = (val - ema) * multiplier + ema;
    }
  }

  return ema;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;

  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const curr = closes[i];
    if (prev !== undefined && curr !== undefined) {
      changes.push(curr - prev);
    }
  }

  const gains = changes.slice(-period).map(c => c > 0 ? c : 0);
  const losses = changes.slice(-period).map(c => c < 0 ? Math.abs(c) : 0);

  const avgGain = gains.reduce((sum, g) => sum + g, 0) / period;
  const avgLoss = losses.reduce((sum, l) => sum + l, 0) / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate ATR (Average True Range)
 */
function calculateATR(candles: OHLCVCandle[], period: number = 14): number {
  if (candles.length < period + 1) return 0;

  const trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    if (curr && prev) {
      const tr = Math.max(
        curr.high - curr.low,
        Math.abs(curr.high - prev.close),
        Math.abs(curr.low - prev.close)
      );
      trueRanges.push(tr);
    }
  }

  return calculateSMA(trueRanges, period);
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2) {
  const sma = calculateSMA(closes, period);
  const slice = closes.slice(-period);

  const squaredDiffs = slice.map(val => Math.pow(val - sma, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    upper: sma + (standardDeviation * stdDev),
    middle: sma,
    lower: sma - (standardDeviation * stdDev),
  };
}

/**
 * Calculate price slope (trend strength)
 */
function calculateSlope(closes: number[], period: number = 20): number {
  if (closes.length < period) return 0;

  const recentCloses = closes.slice(-period);
  const firstPrice = recentCloses[0] ?? 0;
  const lastPrice = recentCloses[recentCloses.length - 1] ?? 0;

  if (firstPrice === 0) return 0;

  return (lastPrice - firstPrice) / firstPrice / period;
}

/**
 * Calculate technical indicators from OHLCV data
 */
function calculateIndicators(candles: OHLCVCandle[]): TechnicalIndicators {
  const closes = candles.map(c => c.close);

  return {
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    ema20: calculateEMA(closes, 20),
    rsi: calculateRSI(closes, 14),
    atr: calculateATR(candles, 14),
    bollingerBands: calculateBollingerBands(closes, 20, 2),
    slope: calculateSlope(closes, 20),
  };
}

/**
 * Determine market regime based on technical indicators
 */
function determineRegime(indicators: TechnicalIndicators): {
  regime: MarketRegime;
  confidence: number;
  reasoning: string;
} {
  const { rsi, slope, atr, bollingerBands, sma20, ema20 } = indicators;

  // Default values
  const safeRSI = rsi ?? 50;
  const safeSlope = slope ?? 0;
  const currentPrice = sma20 ?? ema20 ?? 100;
  const bbUpper = bollingerBands?.upper ?? currentPrice * 1.02;
  const bbLower = bollingerBands?.lower ?? currentPrice * 0.98;
  const bbWidth = (bbUpper - bbLower) / currentPrice;

  // Regime detection logic
  let regime: MarketRegime;
  let confidence: number;
  let reasoning: string;

  // 1. Check for MOMENTUM (strong RSI + moderate slope)
  if (safeRSI > REGIME_CONFIG.momentumThreshold && Math.abs(safeSlope) > REGIME_CONFIG.trendSlopeThreshold) {
    regime = 'MOMENTUM';
    confidence = Math.min(95, 60 + (safeRSI - REGIME_CONFIG.momentumThreshold) * 1.5);
    reasoning = `Strong momentum detected with RSI at ${safeRSI.toFixed(1)} and positive price slope of ${(safeSlope * 100).toFixed(2)}%.`;
  }
  // 2. Check for DOWNTREND (negative slope + RSI below 50)
  else if (safeSlope < -REGIME_CONFIG.trendSlopeThreshold && safeRSI < 50) {
    regime = 'DOWNTREND';
    confidence = Math.min(90, 60 + Math.abs(safeSlope) * 1000);
    reasoning = `Downtrend identified with negative slope of ${(safeSlope * 100).toFixed(2)}% and RSI at ${safeRSI.toFixed(1)}.`;
  }
  // 3. Check for TREND (sustained slope, RSI neutral)
  else if (Math.abs(safeSlope) > REGIME_CONFIG.trendSlopeThreshold) {
    regime = 'TREND';
    confidence = Math.min(85, 60 + Math.abs(safeSlope) * 800);
    const direction = safeSlope > 0 ? 'upward' : 'downward';
    reasoning = `Trending ${direction} with slope of ${(safeSlope * 100).toFixed(2)}% and RSI at ${safeRSI.toFixed(1)}.`;
  }
  // 4. Check for MEAN_REVERSION (tight Bollinger Bands + neutral RSI)
  else if (bbWidth < REGIME_CONFIG.bbWidthThreshold && Math.abs(safeRSI - 50) < 20) {
    regime = 'MEAN_REVERSION';
    confidence = Math.min(80, 65 - bbWidth * 500);
    reasoning = `Mean reversion regime detected with tight Bollinger Bands (width ${(bbWidth * 100).toFixed(2)}%) and balanced RSI at ${safeRSI.toFixed(1)}.`;
  }
  // 5. Default to SIDEWAYS (range-bound, no clear direction)
  else {
    regime = 'SIDEWAYS';
    confidence = 60;
    reasoning = `Sideways/range-bound market with RSI at ${safeRSI.toFixed(1)}, slope of ${(safeSlope * 100).toFixed(2)}%, and moderate Bollinger Band width.`;
  }

  return { regime, confidence, reasoning };
}

/**
 * Regime analyzer tool definition
 */
export const analyzeRegimeTool = tool(
  'analyze_regime',
  'Analyzes OHLCV market data to determine the current market regime (MOMENTUM, TREND, MEAN_REVERSION, DOWNTREND, or SIDEWAYS). Uses technical indicators including moving averages, RSI, ATR, and Bollinger Bands.',
  regimeAnalysisInputSchema.shape,
  async (args) => {
    try {
      const { market, timeframe, ohlcv } = args;

      // Parse OHLCV data
      const candles: OHLCVCandle[] = Array.isArray(ohlcv) ? ohlcv : [];

      if (candles.length < 20) {
        throw new Error('Insufficient data for regime analysis. Need at least 20 bars.');
      }

      // Calculate technical indicators
      const indicators = calculateIndicators(candles);

      // Determine regime
      const { regime, confidence, reasoning } = determineRegime(indicators);

      const result = {
        market,
        timeframe,
        regime,
        confidence,
        indicators,
        reasoning,
        lastUpdated: Date.now(),
      };

      return formatToolResult(result, {
        sourceUrl: 'local-computation', // No external API
        timestamp: new Date().toISOString(),
        apiCost: 0,
      });
    } catch (error) {
      return formatToolError(error, 'Error analyzing regime');
    }
  }
);
