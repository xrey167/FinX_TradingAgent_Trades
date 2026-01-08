---
description: Fetch news and sentiment for a stock
arguments:
  - name: symbol
    required: true
    description: Stock ticker symbol (e.g., AAPL.US, TSLA.US)
  - name: limit
    required: false
    default: "10"
    description: Number of articles to fetch (default: 10)
examples:
  - /fetch-sentiment AAPL.US
  - /fetch-sentiment TSLA.US 20
  - /fetch-sentiment NVDA.US 15
---

# Fetch Sentiment Data

Fetches recent news articles and sentiment analysis for {{symbol}} using the FinX Trading Agent's MCP tools.

## What You'll Get

**Sentiment Summary:**
- Overall sentiment score (-100 to +100)
- Positive/Negative/Neutral distribution (%)
- Total number of articles analyzed

**Recent Headlines:**
- Top 5 most recent articles
- Sentiment classification per article
- Publication dates and sources

**All Articles:**
- Complete list of {{limit}} articles
- Titles, links, dates, sentiment tags

**API Cost:** 5 EODHD API calls

---

## Implementation

I'll use the `fetch_sentiment_data` MCP tool to retrieve news and sentiment for {{symbol}}.

Let me check the configuration and fetch the data:

```bash
if [ -z "$EODHD_API_KEY" ]; then
  echo "⚠️  EODHD_API_KEY not set"
  echo "Please set: export EODHD_API_KEY=your_key_here"
  exit 1
fi

# Fetch sentiment using the simple CLI
cd "$(dirname "$(readlink -f "$0")" 2>/dev/null || pwd)"
bun run cli-research-simple.ts {{symbol}} 2>&1 | grep -A 20 "SENTIMENT"
```

This will display:
- 📰 Sentiment score (0-100 scale)
- Distribution breakdown (positive/neutral/negative)
- Recent headlines with sentiment tags

**Sentiment Score Guide:**
- **80-100:** Very Positive - Strong bullish sentiment
- **60-79:** Positive - Generally favorable news
- **40-59:** Neutral - Balanced or mixed sentiment
- **20-39:** Negative - Concerning news flow
- **0-19:** Very Negative - Strong bearish sentiment

**Note:** Sentiment data is cached for 10 minutes (news changes more frequently than fundamentals). The sentiment score is calculated as:
```
Score = 50 + ((positive - negative) / total) * 50
```

**Use Cases:**
- Quick sentiment check before trading decisions
- Monitor news flow around earnings/events
- Identify sentiment shifts over time
- Combine with fundamental analysis for complete picture
