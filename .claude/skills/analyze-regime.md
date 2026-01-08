---
description: Analyze market regime for technical analysis
arguments:
  - name: symbol
    required: true
    description: Market symbol (US_INDICES, VIX, GOLD, EURUSD, DAX, USDJPY)
  - name: timeframe
    required: true
    description: Timeframe (H1, DAILY, WEEKLY)
  - name: bars
    required: false
    default: "100"
    description: Number of bars to analyze (default: 100)
examples:
  - /analyze-regime US_INDICES DAILY
  - /analyze-regime EURUSD H1
  - /analyze-regime VIX WEEKLY 200
---

# Analyze Market Regime

Analyzes the current market regime for {{symbol}} on {{timeframe}} timeframe using technical indicators.

## What You'll Get

**Regime Classification:**
- **STRONG_MOMENTUM_UP:** Strong uptrend with momentum
- **STRONG_MOMENTUM_DOWN:** Strong downtrend with momentum
- **WEAK_MOMENTUM_UP:** Weak uptrend, consolidating
- **WEAK_MOMENTUM_DOWN:** Weak downtrend, consolidating
- **MEAN_REVERSION_UP:** Oversold, expect bounce
- **MEAN_REVERSION_DOWN:** Overbought, expect pullback
- **CHOPPY:** No clear trend, high volatility
- **CALM:** Low volatility, range-bound

**Technical Indicators:**
- **RSI (14):** Overbought/Oversold indicator (0-100)
- **Moving Averages:** 20-day SMA, 50-day SMA, price vs MA
- **Bollinger Bands:** Width and price position
- **ATR:** Average True Range (volatility measure)
- **Volume:** Recent volume trends

**Trading Implications:**
- Recommended strategy for current regime
- Entry/exit considerations
- Risk management guidance

**Confidence Level:** 0-100% based on indicator alignment

---

## Implementation

I'll use the `fetch_market_data` and `analyze_regime` MCP tools to perform the analysis.

```typescript
import { getEODHDClient } from './src/lib/eodhd-client-singleton.ts';
import { globalToolCache } from './src/lib/tool-cache.ts';
import { createCacheKey } from './src/tools/helpers.ts';

const symbol = "{{symbol}}";
const timeframe = "{{timeframe}}";
const bars = {{bars}};

// Symbol mapping
const symbolMap: Record<string, string> = {
  US_INDICES: 'SPY.US',
  VIX: '^VIX.INDX',
  GOLD: 'GLD.US',
  EURUSD: 'EURUSD.FOREX',
  DAX: 'DAX.INDX',
  USDJPY: 'USDJPY.FOREX',
};

const eoSymbol = symbolMap[symbol] || symbol;

console.log(`🔍 Analyzing ${timeframe} regime for ${symbol}...`);
console.log('');

// Step 1: Fetch market data
const client = getEODHDClient();
const cacheKey = createCacheKey('fetch_market_data', { symbol, timeframe, bars });

const marketData = await globalToolCache.getOrFetch(
  cacheKey,
  5 * 60 * 1000,
  async () => {
    if (timeframe === 'H1') {
      const rawData = await client.getIntradayData(eoSymbol, '1h');
      return rawData.slice(-bars);
    } else {
      const rawData = await client.getEODData(eoSymbol);
      const filtered = timeframe === 'WEEKLY'
        ? rawData.filter((_, i) => i % 5 === 0)
        : rawData;
      return filtered.slice(-bars);
    }
  }
);

// Step 2: Analyze regime
const regimeCacheKey = createCacheKey('analyze_regime', { symbol, timeframe });
const regimeAnalysis = await globalToolCache.getOrFetch(
  regimeCacheKey,
  5 * 60 * 1000,
  async () => {
    // Import regime analyzer
    const { analyzeRegime } = await import('./src/lib/regime-analyzer.ts');
    return analyzeRegime(marketData);
  }
);

// Step 3: Display results
console.log('📊 MARKET REGIME ANALYSIS');
console.log('='.repeat(80));
console.log('');

console.log(`🎯 Regime: ${regimeAnalysis.regime}`);
console.log(`📈 Confidence: ${(regimeAnalysis.confidence * 100).toFixed(1)}%`);
console.log(`↗️  Direction: ${regimeAnalysis.direction}`);
console.log('');

console.log('📉 TECHNICAL INDICATORS:');
console.log('-'.repeat(80));
console.log(`  RSI (14): ${regimeAnalysis.indicators.rsi.toFixed(2)}`);
console.log(`    ${regimeAnalysis.indicators.rsi > 70 ? '⚠️  Overbought' : regimeAnalysis.indicators.rsi < 30 ? '⚠️  Oversold' : '✓ Neutral'}`);
console.log('');

console.log(`  Moving Averages:`);
console.log(`    20-day SMA: ${regimeAnalysis.indicators.sma20.toFixed(2)}`);
console.log(`    50-day SMA: ${regimeAnalysis.indicators.sma50.toFixed(2)}`);
console.log(`    Price vs 20-MA: ${((regimeAnalysis.currentPrice - regimeAnalysis.indicators.sma20) / regimeAnalysis.indicators.sma20 * 100).toFixed(2)}%`);
console.log('');

console.log(`  Bollinger Bands:`);
console.log(`    Upper: ${regimeAnalysis.indicators.bbUpper.toFixed(2)}`);
console.log(`    Middle: ${regimeAnalysis.indicators.bbMiddle.toFixed(2)}`);
console.log(`    Lower: ${regimeAnalysis.indicators.bbLower.toFixed(2)}`);
console.log(`    Width: ${regimeAnalysis.indicators.bbWidth.toFixed(4)}`);
console.log(`    Position: ${regimeAnalysis.indicators.bbPosition}`);
console.log('');

console.log(`  ATR (14): ${regimeAnalysis.indicators.atr.toFixed(4)}`);
console.log(`    Volatility: ${regimeAnalysis.indicators.atr > regimeAnalysis.indicators.sma20 * 0.02 ? 'High' : 'Low'}`);
console.log('');

console.log('💡 TRADING IMPLICATIONS:');
console.log('-'.repeat(80));
console.log(regimeAnalysis.reasoning);
console.log('');

console.log('📋 RECOMMENDED STRATEGY:');
const strategy = getStrategyForRegime(regimeAnalysis.regime);
console.log(strategy);
console.log('');

console.log('✅ Analysis complete');
console.log(`📍 Latest Price: ${regimeAnalysis.currentPrice.toFixed(2)}`);
console.log(`📊 Data Points: ${marketData.length} bars`);

function getStrategyForRegime(regime: string): string {
  const strategies: Record<string, string> = {
    STRONG_MOMENTUM_UP: `
  🟢 TREND FOLLOWING STRATEGY
  - Consider long positions on pullbacks to moving averages
  - Use trailing stops to protect profits
  - Avoid shorting against strong momentum
  - Look for continuation patterns (flags, pennants)`,

    STRONG_MOMENTUM_DOWN: `
  🔴 DEFENSIVE/SHORT STRATEGY
  - Consider short positions on rallies to resistance
  - Avoid catching falling knives
  - Use tight stops if going long
  - Wait for reversal confirmation`,

    WEAK_MOMENTUM_UP: `
  🟡 CAUTIOUS LONG STRATEGY
  - Take partial profits if in longs
  - Watch for breakdown signals
  - Consider reducing position size
  - Be ready to switch to mean reversion`,

    WEAK_MOMENTUM_DOWN: `
  🟡 CAUTIOUS SHORT/NEUTRAL STRATEGY
  - Cover shorts on support tests
  - Watch for reversal patterns
  - Avoid aggressive new shorts
  - Consider range-trading approaches`,

    MEAN_REVERSION_UP: `
  🔵 OVERSOLD BOUNCE STRATEGY
  - Look for long entries near support/lower BB
  - Target resistance or middle BB
  - Use tight stops below recent lows
  - Take profits quickly (not a trend)`,

    MEAN_REVERSION_DOWN: `
  🟣 OVERBOUGHT FADE STRATEGY
  - Look for short entries near resistance/upper BB
  - Target support or middle BB
  - Use tight stops above recent highs
  - Take profits quickly (not a trend)`,

    CHOPPY: `
  ⚠️  AVOID/RANGE STRATEGY
  - Avoid directional trades
  - If trading, use very tight stops
  - Consider staying flat until clarity emerges
  - Watch for breakout from range`,

    CALM: `
  😴 RANGE-BOUND STRATEGY
  - Trade support to resistance
  - Sell resistance, buy support
  - Use options strategies (iron condors)
  - Wait for volatility expansion before trend trades`,
  };

  return strategies[regime] || '  ⚠️  Unknown regime - exercise caution';
}
```

**Note:** Market regime analysis is cached for 5 minutes. Regime classifications are based on:
- **Momentum indicators:** RSI, Moving Average relationships
- **Volatility:** Bollinger Band width, ATR
- **Price action:** Position relative to MAs and BBs

**Regime Detection Logic:**
```typescript
// Strong Momentum Up: RSI > 60, Price > SMA20 > SMA50, BB upper half
// Mean Reversion Up: RSI < 30, Price near lower BB
// Choppy: High BB width, conflicting indicators
// Calm: Low BB width, low ATR
```

**Use Cases:**
- Determine appropriate trading strategy
- Risk assessment before entering trades
- Position sizing based on regime
- Identify regime transitions
- Align strategy with market conditions
