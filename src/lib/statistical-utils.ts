/**
 * Statistical Utility Functions
 *
 * Provides reusable statistical calculations for market data analysis.
 */

/**
 * Calculate volatility using log returns method
 *
 * @param data - Array of OHLC candle data
 * @returns Volatility as a decimal (e.g., 0.02 = 2%)
 *
 * @example
 * ```typescript
 * const volatility = calculateVolatility(candleData);
 * console.log(`Volatility: ${(volatility * 100).toFixed(2)}%`);
 * ```
 */
export function calculateVolatility(
  data: Array<{ high: number; low: number; close: number }>
): number {
  if (data.length < 2) return 0;

  // Calculate log returns
  const returns = data.slice(1).map((d, i) => {
    const prevCandle = data[i];
    if (!prevCandle) return 0;
    return Math.log(d.close / prevCandle.close);
  });

  // Calculate mean of returns
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Calculate variance
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

  // Return standard deviation (square root of variance)
  return Math.sqrt(variance);
}
