---
description: Fetch historical market price data
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
    description: Number of bars to fetch (default: 100)
examples:
  - /fetch-market US_INDICES DAILY
  - /fetch-market EURUSD H1 50
  - /fetch-market VIX WEEKLY 200
---

# Fetch Market Data

Fetches historical OHLCV (Open, High, Low, Close, Volume) price data for {{symbol}} on {{timeframe}} timeframe.

## What You'll Get

**Price Data:**
- Historical OHLCV candles
- Adjusted close prices
- Volume data
- Timestamps for each bar

**Market Coverage:**
- **US_INDICES:** S&P 500 (SPY ETF)
- **VIX:** Volatility Index
- **GOLD:** Gold (GLD ETF)
- **EURUSD:** EUR/USD forex pair
- **DAX:** German stock index
- **USDJPY:** USD/JPY forex pair

**Timeframes:**
- **H1:** Hourly (1-hour candles) - Last 100 hours by default
- **DAILY:** Daily candles - Historical daily data
- **WEEKLY:** Weekly candles - Long-term trends

**API Cost:**
- H1 (hourly): 5 API calls
- DAILY/WEEKLY: 1 API call

---

## Implementation

I'll use the `fetch_market_data` MCP tool to retrieve {{bars}} bars of {{timeframe}} data for {{symbol}}.

```bash
if [ -z "$EODHD_API_KEY" ]; then
  echo "⚠️  EODHD_API_KEY not set"
  echo "Please set: export EODHD_API_KEY=your_key_here"
  exit 1
fi
```

Since the simple CLI doesn't have direct market data access, I'll need to use the full TypeScript implementation to fetch this data.

Let me create a quick script to fetch and display the market data:

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

console.log(`📊 Fetching ${timeframe} data for ${symbol} (${bars} bars)...`);
console.log('');

const client = getEODHDClient();
const cacheKey = createCacheKey('fetch_market_data', { symbol, timeframe, bars });

const data = await globalToolCache.getOrFetch(
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

// Display recent price action (last 5 candles)
console.log('📈 RECENT PRICE ACTION (Last 5 bars):');
console.log('-'.repeat(80));
const recent = data.slice(-5);
recent.forEach((candle, i) => {
  const date = timeframe === 'H1' ? candle.datetime : candle.date;
  const change = ((candle.close - candle.open) / candle.open * 100).toFixed(2);
  const direction = change >= 0 ? '🟢' : '🔴';
  console.log(`${direction} ${date}: O: ${candle.open} H: ${candle.high} L: ${candle.low} C: ${candle.close} (${change}%)`);
});

console.log('');
console.log(`✅ Retrieved ${data.length} bars of ${timeframe} data`);
console.log(`📍 Latest Close: ${data[data.length - 1].close}`);
console.log(`📊 Price Range: ${Math.min(...data.map(d => d.low))} - ${Math.max(...data.map(d => d.high))}`);
```

**Note:** Market data is cached for 5 minutes to balance freshness with API efficiency.

**Use Cases:**
- Technical analysis preparation
- Historical price research
- Input for regime analysis
- Backtesting strategies
- Volume analysis
