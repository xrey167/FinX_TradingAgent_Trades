# FinX Trading Agent - Claude Code Skills

This directory contains user-facing Claude Code skills that provide direct CLI access to the FinX Trading Agent's data fetching and analysis capabilities.

## Available Skills

### 1. `/fetch-financial <symbol>`
Fetch comprehensive fundamental data for a stock.

**Usage:**
```bash
/fetch-financial AAPL.US
/fetch-financial TSLA.US
/fetch-financial NVDA.US
```

**What you get:**
- Company information (sector, industry)
- Valuation metrics (P/E, P/B, PEG, EV/EBITDA)
- Profitability metrics (ROE, ROA, margins)
- Growth metrics (revenue, earnings growth)
- Recent quarter financials

**API Cost:** 10 EODHD API calls

---

### 2. `/fetch-sentiment <symbol> [limit]`
Fetch recent news articles and sentiment analysis for a stock.

**Usage:**
```bash
/fetch-sentiment AAPL.US
/fetch-sentiment TSLA.US 20
/fetch-sentiment NVDA.US 15
```

**What you get:**
- Sentiment score (-100 to +100)
- Distribution (positive/negative/neutral %)
- Recent headlines with sentiment tags
- Article links and publication dates

**API Cost:** 5 EODHD API calls

---

### 3. `/fetch-market <symbol> <timeframe> [bars]`
Fetch historical OHLCV price data for market analysis.

**Usage:**
```bash
/fetch-market US_INDICES DAILY
/fetch-market EURUSD H1 50
/fetch-market VIX WEEKLY 200
```

**Supported Symbols:**
- `US_INDICES` - S&P 500 (SPY ETF)
- `VIX` - Volatility Index
- `GOLD` - Gold (GLD ETF)
- `EURUSD` - EUR/USD forex
- `DAX` - German stock index
- `USDJPY` - USD/JPY forex

**Timeframes:**
- `H1` - Hourly (1-hour candles)
- `DAILY` - Daily candles
- `WEEKLY` - Weekly candles

**What you get:**
- Recent price action (last 5 candles)
- Price range (high/low)
- Volume data
- OHLCV data for specified bars

**API Cost:**
- H1: 5 EODHD API calls
- DAILY/WEEKLY: 1 EODHD API call

---

### 4. `/analyze-regime <symbol> <timeframe> [bars]`
Analyze market regime using technical indicators.

**Usage:**
```bash
/analyze-regime US_INDICES DAILY
/analyze-regime EURUSD H1
/analyze-regime VIX WEEKLY 200
```

**What you get:**
- Regime classification (STRONG_MOMENTUM_UP, MEAN_REVERSION_DOWN, etc.)
- Confidence level (0-100%)
- Direction (up/down/neutral)
- Technical indicators:
  - RSI (14)
  - Moving Averages (20-day, 50-day)
  - Bollinger Bands
  - ATR (volatility)
- Trading implications and recommended strategy

**API Cost:** Same as fetch-market (data fetching) + local computation

---

### 5. `/research <query>`
Run comprehensive autonomous investment research using the full research orchestrator.

**Usage:**
```bash
/research "Should I invest in NVDA?"
/research "Analyze TSLA fundamentals and sentiment"
/research "Is AAPL undervalued?"
/research "Compare MSFT and GOOGL for value investing"
```

**What you get:**
- **Comprehensive Analysis:**
  - Fundamentals (financial health, valuation, profitability)
  - Sentiment (news analysis, market sentiment)
  - Technical (market regime, indicators)
  - Expert perspectives (Buffett, Munger, Wood, Burry)
  - Risk assessment and position sizing
- **Final Recommendation:** BUY/HOLD/SELL/AVOID with confidence level
- **Research Metrics:** Cost, duration, number of turns

**API Cost:**
- EODHD: ~16-20 calls (depends on query complexity)
- Claude API: ~$0.10-0.20 per research query

---

## Prerequisites

### Environment Variables

**For data fetching skills (1-4):**
```bash
export EODHD_API_KEY=your_key_here
```

Or use DEMO key for testing (limited symbols):
```bash
export EODHD_API_KEY=DEMO
```

**For research skill (5):**
```bash
export EODHD_API_KEY=your_key_here
export ANTHROPIC_API_KEY=your_claude_api_key
```

### Dependencies

All skills use the FinX Trading Agent's infrastructure:
- MCP tools (fetch_financial_data, fetch_sentiment_data, fetch_market_data, analyze_regime)
- EODHD client with caching and retry logic
- Research orchestrator system (for /research skill)

---

## Caching

All skills benefit from the 2-tier caching system:

- **Financial data:** 30 minute TTL (fundamentals change slowly)
- **Sentiment data:** 10 minute TTL (news updates more frequently)
- **Market data:** 5 minute TTL (prices change frequently)

Subsequent calls for the same data within the TTL will be instant (no API calls).

---

## Quick Start Examples

### Daily Workflow

**Morning Market Check:**
```bash
/analyze-regime US_INDICES DAILY
/fetch-sentiment SPY.US
```

**Stock Research:**
```bash
/fetch-financial AAPL.US
/fetch-sentiment AAPL.US
/analyze-regime US_INDICES DAILY
```

**Deep Analysis:**
```bash
/research "Should I invest in NVDA for long-term growth?"
```

### Comparative Analysis

```bash
/research "Compare GOOGL and META from a value investing perspective"
/research "Which is better for income: T, VZ, or TMUS?"
```

### Technical Analysis

```bash
/fetch-market EURUSD H1 100
/analyze-regime EURUSD H1
```

---

## Skill Architecture

### Data Flow

```
User invokes skill
    ↓
Skill checks prerequisites (API keys)
    ↓
Skill calls MCP tool
    ↓
MCP tool checks cache
    ↓
    ├─ Cache hit → Return cached data (instant)
    └─ Cache miss → Fetch from EODHD API
            ↓
        Retry logic (4 attempts with backoff)
            ↓
        Cache result
            ↓
        Return to user
```

### Integration Points

- **MCP Tools:** Skills invoke the same tools that agents use
- **Singleton Client:** Shared EODHD client instance across all skills
- **Global Cache:** Cache shared between skills and agents
- **Helper Functions:** Consistent error handling and formatting

---

## Troubleshooting

### "EODHD_API_KEY not configured"
Set your API key:
```bash
export EODHD_API_KEY=your_key_here
```

### "ANTHROPIC_API_KEY not configured" (research skill only)
Set your Claude API key:
```bash
export ANTHROPIC_API_KEY=your_key_here
```

### Rate limit errors
The EODHD API has rate limits:
- 1,000 calls per minute
- 100,000 calls per day

The retry logic will automatically handle rate limits with exponential backoff.

### Symbol not found
- Ensure you use the correct format: `SYMBOL.EXCHANGE` (e.g., `AAPL.US`)
- For market symbols, use the predefined names: `US_INDICES`, `VIX`, `GOLD`, etc.
- Check EODHD API documentation for supported symbols

### Data quality issues
- Some stocks may have incomplete data
- Use DEMO key for testing only (limited symbol coverage)
- Real API key provides access to 150k+ tickers

---

## Skill Development

These skills follow Claude Code skill conventions:

**File Structure:**
```markdown
---
description: Brief description
arguments:
  - name: arg1
    required: true
    description: Argument description
examples:
  - /skill-name example1
  - /skill-name example2
---

# Skill Title

Detailed description...

## Implementation

Code/guidance for executing the skill...
```

**Best Practices:**
- Clear, concise descriptions
- Comprehensive examples
- Detailed output descriptions
- Error handling guidance
- Cost transparency (API calls)

---

## Relationship to MCP Tools

| Skill | MCP Tool | Purpose |
|-------|----------|---------|
| `/fetch-financial` | `fetch_financial_data` | User-facing CLI for fundamentals |
| `/fetch-sentiment` | `fetch_sentiment_data` | User-facing CLI for sentiment |
| `/fetch-market` | `fetch_market_data` | User-facing CLI for price data |
| `/analyze-regime` | `analyze_regime` + `fetch_market_data` | User-facing CLI for technical analysis |
| `/research` | All tools + orchestrator | User-facing CLI for full research |

**Key Difference:**
- **MCP Tools** = For agents to call programmatically
- **Skills** = For users to call directly via CLI

Both use the same underlying infrastructure (EODHD client, caching, retry logic, helpers).

---

## Future Enhancements

Potential additional skills:
- `/backtest <strategy>` - Backtest trading strategies
- `/screen <criteria>` - Screen stocks by criteria
- `/portfolio-review` - Analyze portfolio holdings
- `/compare <symbol1> <symbol2>` - Side-by-side comparison
- `/watchlist <action>` - Manage stock watchlists

---

## Support

For issues or questions:
- Check EODHD API status: https://eodhd.com/api/status
- Review FinX documentation: See project README
- Check Claude Code documentation: https://github.com/anthropics/claude-code

---

**Version:** 1.0.0
**Last Updated:** 2026-01-08
**Total Skills:** 5 (4 data tools + 1 research orchestrator)
