---
description: Fetch fundamental data for a stock
arguments:
  - name: symbol
    required: true
    description: Stock ticker symbol (e.g., AAPL.US, TSLA.US)
examples:
  - /fetch-financial AAPL.US
  - /fetch-financial TSLA.US
  - /fetch-financial NVDA.US
---

# Fetch Financial Data

Fetches comprehensive fundamental data for {{symbol}} using the FinX Trading Agent's MCP tools.

## What You'll Get

**Company Information:**
- Name, sector, industry, country

**Valuation Metrics:**
- Market Cap, P/E Ratio, PEG Ratio
- Price-to-Book, Price-to-Sales
- EV/EBITDA

**Profitability Metrics:**
- ROE (Return on Equity)
- ROA (Return on Assets)
- Profit Margin, Operating Margin

**Growth Metrics:**
- Revenue Growth (YoY)
- Earnings Growth (YoY)

**Recent Quarter Financials:**
- Revenue, Net Income, Free Cash Flow

**Full Financial Statements:**
- Balance Sheet (quarterly + annual)
- Income Statement (quarterly + annual)
- Cash Flow (quarterly + annual)

**API Cost:** 10 EODHD API calls

---

## Implementation

I'll use the `fetch_financial_data` MCP tool to retrieve comprehensive fundamental data for {{symbol}}.

First, let me check if the EODHD API key is configured:

```bash
if [ -z "$EODHD_API_KEY" ]; then
  echo "⚠️  EODHD_API_KEY not set"
  echo "Please set your API key:"
  echo "  export EODHD_API_KEY=your_key_here"
  echo ""
  echo "Or use DEMO key for testing (limited symbols):"
  echo "  export EODHD_API_KEY=DEMO"
  exit 1
fi
```

Now I'll fetch the data by running the FinX CLI tool:

```bash
cd "$(dirname "$(readlink -f "$0")" 2>/dev/null || pwd)"
bun run cli-research-simple.ts {{symbol}} 2>&1 | grep -A 100 "COMPANY\|VALUATION\|PROFITABILITY\|GROWTH\|FINANCIAL HEALTH" | head -60
```

This will display:
- 🏢 Company information
- 💰 Valuation metrics
- 💪 Profitability ratios
- 📈 Growth rates
- 🏦 Financial health indicators

The data includes both summary metrics and access to detailed financial statements for deeper analysis.

**Note:** Results are cached for 30 minutes to minimize API calls. Subsequent requests for the same symbol will be instant.
