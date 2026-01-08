# MCP Tools for Agent Tool Use

Complete reference for all MCP (Model Context Protocol) tools available to agents.

## Overview

FinX Trading Agent implements **4 MCP tools** that AI agents can invoke to fetch and analyze financial data. These tools integrate with the EODHD API to provide real-time market data.

---

## 🛠️ Tool 1: `fetch_financial_data`

**Location:** `src/tools/fundamental/financial-data.ts`

### Description
Fetches comprehensive fundamental data for stocks including company information, valuation metrics, financial statements, earnings, and ESG scores.

### Input Schema
```typescript
{
  symbol: string  // Stock ticker symbol (e.g., "AAPL.US", "TSLA.US")
}
```

### Output Structure
```typescript
{
  symbol: string
  company: string
  sector: string
  industry: string

  valuation: {
    marketCap: number
    peRatio: number
    pegRatio: number
    priceToBook: number
    priceToSales: number
    evToEbitda: number
  }

  profitability: {
    profitMargin: number
    operatingMargin: number
    roe: number  // Return on Equity
    roa: number  // Return on Assets
  }

  growth: {
    revenueGrowthYOY: number
    earningsGrowthYOY: number
  }

  recentQuarter: string
  revenue: number
  netIncome: number
  freeCashFlow: number

  fullData: {
    // Complete EODHD fundamental data object
    General: {...}
    Highlights: {...}
    Valuation: {...}
    Financials: {
      Balance_Sheet: { quarterly: {...}, yearly: {...} }
      Cash_Flow: { quarterly: {...}, yearly: {...} }
      Income_Statement: { quarterly: {...}, yearly: {...} }
    }
    ESGScores: {...}
  }
}
```

### Example Usage
```typescript
// In an agent prompt or tool call
const result = await fetchFinancialDataTool({ symbol: "AAPL.US" });
```

### Cost
- **10 EODHD API calls** per request

### What Agents Can Learn
- Company basics (sector, industry)
- Valuation ratios (P/E, P/B, PEG, EV/EBITDA)
- Profitability metrics (ROE, ROA, margins)
- Growth rates (revenue, earnings)
- Financial statements (balance sheet, income, cash flow)
- ESG ratings

### Error Handling
Returns `isError: true` if:
- EODHD_API_KEY not configured
- Invalid symbol format
- API request fails
- Symbol not found

---

## 🛠️ Tool 2: `fetch_sentiment_data`

**Location:** `src/tools/sentiment/sentiment-data.ts`

### Description
Fetches recent news articles and sentiment analysis for stocks. Provides aggregated sentiment scores and article summaries.

### Input Schema
```typescript
{
  symbol: string    // Stock ticker symbol (e.g., "TSLA.US")
  limit?: number    // Number of articles to fetch (default: 10)
}
```

### Output Structure
```typescript
{
  symbol: string
  newsCount: number

  sentiment: {
    positive: number        // Count of positive articles
    negative: number        // Count of negative articles
    neutral: number         // Count of neutral articles
    positivePercent: string // Percentage (e.g., "60.0")
    negativePercent: string // Percentage (e.g., "10.0")
    neutralPercent: string  // Percentage (e.g., "30.0")
    overallScore: string    // Score from -100 to +100
  }

  recentArticles: [
    {
      date: string
      title: string
      sentiment: "Positive" | "Negative" | "Neutral"
      link: string
    },
    // ... top 5 articles
  ]

  allArticles: [
    // Full list of all fetched articles
  ]
}
```

### Example Usage
```typescript
// Fetch 10 recent articles (default)
const result = await fetchSentimentDataTool({
  symbol: "TSLA.US"
});

// Fetch 20 articles
const result = await fetchSentimentDataTool({
  symbol: "TSLA.US",
  limit: 20
});
```

### Cost
- **5 EODHD API calls** per request

### What Agents Can Learn
- Overall market sentiment (-100 to +100 scale)
- Sentiment distribution (positive/negative/neutral %)
- Recent news headlines
- Trending topics and themes
- Sentiment shifts over time

### Sentiment Scoring
- **+100**: All positive news
- **0**: Balanced (equal positive/negative)
- **-100**: All negative news

Formula: `((positive - negative) / total) * 100`

### Error Handling
Returns `isError: true` if:
- EODHD_API_KEY not configured
- Invalid symbol format
- API request fails
- No news available for symbol

---

## 🛠️ Tool 3: `fetch_market_data`

**Location:** `src/tools/market-data.ts`

### Description
Fetches historical OHLCV (Open, High, Low, Close, Volume) price data for technical analysis.

### Input Schema
```typescript
{
  symbol: string      // Ticker symbol (e.g., "EURUSD.FOREX")
  timeframe: string   // "H1" | "DAILY" | "WEEKLY"
  bars?: number       // Number of bars to fetch (optional)
}
```

### Output Structure
```typescript
{
  symbol: string
  timeframe: string
  bars: number
  data: [
    {
      date: string        // ISO date string
      open: number
      high: number
      low: number
      close: number
      volume: number
      adjusted_close: number
    },
    // ... historical data points
  ]
}
```

### Example Usage
```typescript
// Fetch daily data
const result = await fetchMarketDataTool({
  symbol: "AAPL.US",
  timeframe: "DAILY"
});

// Fetch hourly data
const result = await fetchMarketDataTool({
  symbol: "EURUSD.FOREX",
  timeframe: "H1",
  bars: 100
});
```

### Cost
- **1 EODHD API call** per request (EOD data)
- **5 EODHD API calls** per request (intraday H1 data)

### Supported Timeframes
- **H1**: Hourly (1-hour candles)
- **DAILY**: Daily candles
- **WEEKLY**: Weekly candles

### What Agents Can Learn
- Price trends and patterns
- Volume analysis
- Support/resistance levels
- Historical volatility
- Data for technical indicators

### Error Handling
Returns `isError: true` if:
- EODHD_API_KEY not configured
- Invalid symbol or timeframe
- API request fails
- Insufficient historical data

---

## 🛠️ Tool 4: `analyze_regime`

**Location:** `src/tools/regime-analyzer.ts`

### Description
Analyzes market regime from OHLCV data by calculating technical indicators and classifying the market state.

### Input Schema
```typescript
{
  symbol: string      // Ticker symbol
  timeframe: string   // "H1" | "DAILY" | "WEEKLY"
}
```

### Output Structure
```typescript
{
  symbol: string
  timeframe: string
  regime: "MOMENTUM" | "TREND" | "MEAN_REVERSION" | "DOWNTREND" | "SIDEWAYS"
  confidence: number  // 0-100
  direction: "up" | "down" | "neutral"

  indicators: {
    rsi: number              // Relative Strength Index (0-100)
    sma20: number            // 20-period Simple Moving Average
    sma50: number            // 50-period Simple Moving Average
    ema20: number            // 20-period Exponential Moving Average
    slope: number            // Price slope (% change)
    bollingerBands: {
      upper: number
      middle: number
      lower: number
      width: number
    }
    atr: number              // Average True Range
    volatility: number       // ATR as % of price
  }

  signals: {
    trendStrength: "strong" | "moderate" | "weak"
    momentumBias: "bullish" | "neutral" | "bearish"
    volatilityState: "high" | "normal" | "low"
  }

  reasoning: string  // Explanation of regime classification
}
```

### Regime Types

| Regime | Characteristics | Trading Approach |
|--------|----------------|------------------|
| **MOMENTUM** | RSI > 60, strong directional movement | Trend following, momentum strategies |
| **TREND** | Sustained slope, clear direction | Trend following, breakouts |
| **MEAN_REVERSION** | Tight Bollinger Bands, balanced RSI | Range trading, mean reversion |
| **DOWNTREND** | Negative slope, RSI < 50 | Short bias, wait for reversal |
| **SIDEWAYS** | Low volatility, no clear direction | Range trading, avoid |

### Technical Indicators Calculated

1. **RSI (Relative Strength Index)**
   - Measures momentum
   - 0-100 scale
   - >70 = overbought, <30 = oversold

2. **Moving Averages**
   - SMA 20, SMA 50: Trend direction
   - EMA 20: Responsive trend
   - Cross-overs signal trend changes

3. **Bollinger Bands**
   - Volatility bands
   - Width indicates volatility
   - Price near bands = potential reversal

4. **ATR (Average True Range)**
   - Absolute volatility measure
   - Higher ATR = higher volatility

5. **Price Slope**
   - Linear regression slope
   - Positive = uptrend, Negative = downtrend

### Example Usage
```typescript
// Analyze daily regime
const result = await analyzeRegimeTool({
  symbol: "SPY.US",
  timeframe: "DAILY"
});

// Analyze hourly regime
const result = await analyzeRegimeTool({
  symbol: "EURUSD.FOREX",
  timeframe: "H1"
});
```

### Cost
- **0 EODHD API calls** (processes data locally)
- Note: Requires prior `fetch_market_data` call for data

### What Agents Can Learn
- Current market state/regime
- Trend strength and direction
- Momentum conditions
- Volatility levels
- Technical trading signals
- Regime-appropriate strategies

### Confidence Scoring
- **90-100%**: Very strong signals, clear regime
- **70-89%**: Strong signals, reliable regime
- **50-69%**: Moderate signals, regime likely
- **30-49%**: Weak signals, regime uncertain
- **0-29%**: Very weak signals, no clear regime

### Error Handling
Returns `isError: true` if:
- EODHD_API_KEY not configured
- No market data available (must fetch first)
- Insufficient data for calculations
- Invalid symbol or timeframe

---

## 📊 Tool Registration

All 4 tools are registered in the MCP server:

```typescript
// In test-research-system.ts or src/index.ts
const mcpServer = createSdkMcpServer({
  name: MCP_SERVER_NAME,
  version: '1.0.0',
  tools: [
    fetchMarketDataTool,      // Tool 3
    analyzeRegimeTool,        // Tool 4
    fetchFinancialDataTool,   // Tool 1
    fetchSentimentDataTool,   // Tool 2
  ],
});
```

---

## 🎯 Tool Usage by Agent Type

### Investment Persona Agents
**Warren Buffett, Charlie Munger, Michael Burry:**
- `fetch_financial_data` ✅ (fundamentals, valuation)
- `fetch_market_data` ✅ (price history)

**Cathie Wood:**
- `fetch_financial_data` ✅ (growth metrics)
- `fetch_sentiment_data` ✅ (innovation signals)

### Analytical Agents
**Valuation Analyst:**
- `fetch_financial_data` ✅ (valuation metrics)

**Fundamentals Analyst:**
- `fetch_financial_data` ✅ (financial statements)

**Sentiment Analyst:**
- `fetch_sentiment_data` ✅ (news and sentiment)

**Risk Manager:**
- `fetch_financial_data` ✅ (debt, liquidity)
- `fetch_market_data` ✅ (volatility)

### Research System Agents
**All research agents have access to all tools:**
- Planning Agent: Plans which tools to use
- Action Agent: Executes tool calls
- Validation Agent: Validates tool results
- Answer Agent: Synthesizes all tool outputs

---

## 💰 API Cost Summary

| Tool | EODHD API Calls | When to Use |
|------|----------------|-------------|
| `fetch_financial_data` | 10 | Need fundamentals, valuation, financials |
| `fetch_sentiment_data` | 5 | Need news, market perception |
| `fetch_market_data` (EOD) | 1 | Need daily/weekly price data |
| `fetch_market_data` (H1) | 5 | Need hourly price data |
| `analyze_regime` | 0 | After fetching market data |

**Total for full stock analysis:** 15-16 API calls
- Fundamentals: 10 calls
- Sentiment: 5 calls
- Market data: 1 call (daily)

**EODHD Rate Limits:**
- 1,000 calls per minute
- 100,000 calls per day

---

## 🔧 Configuration

All tools require `EODHD_API_KEY` environment variable:

```bash
# .env file
EODHD_API_KEY=your_key_here

# Or use DEMO for testing
EODHD_API_KEY=DEMO
```

**DEMO Key Limitations:**
- Limited to specific symbols: AAPL.US, TSLA.US, EURUSD.FOREX
- Reduced data availability
- Same rate limits as real keys

---

## 🎨 Tool Response Format

All tools follow MCP protocol:

```typescript
// Success
{
  content: [
    {
      type: 'text',
      text: JSON.stringify(data, null, 2)
    }
  ]
}

// Error
{
  content: [
    {
      type: 'text',
      text: 'Error message here'
    }
  ],
  isError: true
}
```

---

## 🚀 Best Practices

### 1. Tool Call Sequencing
```typescript
// ✅ Good: Fetch market data, then analyze regime
await fetchMarketDataTool({ symbol, timeframe });
await analyzeRegimeTool({ symbol, timeframe });

// ❌ Bad: Analyze regime without fetching data first
await analyzeRegimeTool({ symbol, timeframe }); // Will fail
```

### 2. Minimize API Calls
```typescript
// ✅ Good: Fetch fundamentals once, use for multiple analyses
const data = await fetchFinancialDataTool({ symbol });
// Use data.fullData for detailed analysis

// ❌ Bad: Fetch multiple times for same symbol
await fetchFinancialDataTool({ symbol }); // 10 calls
await fetchFinancialDataTool({ symbol }); // Another 10 calls
```

### 3. Error Handling
```typescript
const result = await fetchFinancialDataTool({ symbol });

if (result.isError) {
  // Handle error gracefully
  console.error('Failed to fetch data:', result.content[0].text);
  return;
}

const data = JSON.parse(result.content[0].text);
// Process data
```

---

## 📚 Data Sources

All tools use **EODHD Financial APIs**:
- Coverage: 150k+ tickers worldwide
- Asset classes: Stocks, ETFs, Forex, Crypto, Indices
- Data quality: Professional-grade financial data
- Update frequency: Real-time to end-of-day

**Supported Exchanges:**
- US: NYSE, NASDAQ, AMEX
- International: LSE, TSE, ASX, etc.
- Forex: Major and minor pairs
- Crypto: Bitcoin, Ethereum, etc.

---

## 🔍 Symbol Format

**Stocks & ETFs:** `TICKER.EXCHANGE`
- Apple: `AAPL.US`
- Tesla: `TSLA.US`
- Microsoft: `MSFT.US`

**Forex:** `PAIR.FOREX`
- EUR/USD: `EURUSD.FOREX`
- GBP/USD: `GBPUSD.FOREX`

**Crypto:** `PAIR.CC`
- Bitcoin: `BTC-USD.CC`
- Ethereum: `ETH-USD.CC`

---

This is the complete MCP tool reference for FinX Trading Agent! 🛠️
