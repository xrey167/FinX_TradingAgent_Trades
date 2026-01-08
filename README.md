# FinX Trading Agent - AI Investment Research System

An autonomous AI-powered investment research system built with Claude Agent SDK and EODHD financial data API. This system provides comprehensive stock analysis using multi-agent reasoning inspired by top investors like Warren Buffett, Charlie Munger, Cathie Wood, and Michael Burry.

## Overview

FinX Trading Agent combines real-time financial data, AI reasoning, and multiple investment philosophies to provide actionable investment recommendations. The system uses a research orchestrator that coordinates planning, action, validation, and synthesis agents to deliver comprehensive analysis.

## Key Features

- **Multi-Agent Research System**: Autonomous loop with Planning → Action → Validation → Answer flow
- **Investment Expert Personas**: Buffett (value), Munger (quality), Wood (innovation), Burry (contrarian)
- **Comprehensive Data Analysis**: Fundamentals, sentiment, valuation, technical indicators
- **Three Research Modes**:
  - **Simple CLI**: Quick data lookup without AI (instant, free)
  - **CLI with AI**: Real Claude analysis via subprocess ($0 cost)
  - **Agent SDK**: Production mode via Anthropic API (~$0.50 per analysis)
- **EODHD API Integration**: 150k+ tickers, real-time data, news sentiment
- **Claude Code CLI Wrapper**: Get real AI responses without API costs

## Architecture

```
Research Orchestrator
    ↓
Planning Agent
    ↓
Action Agent (executes research tasks)
    ↓
Validation Agent (checks completeness)
    ↓
Answer Agent (synthesizes final recommendation)
    ↓
Output: BUY/HOLD/SELL/AVOID with confidence score
```

### Research Agents

1. **Planning Agent**: Decomposes investment questions into research tasks
2. **Action Agent**: Executes data fetching and analysis tasks
3. **Validation Agent**: Checks research completeness and quality
4. **Answer Agent**: Synthesizes findings into actionable recommendations

### Specialist Agents

- **Warren Buffett**: Value investing (ROE >15%, margin of safety, moats)
- **Charlie Munger**: Quality businesses (mental models, pricing power)
- **Cathie Wood**: Innovation investing (TAM >$1T, disruptive growth)
- **Michael Burry**: Contrarian deep value (P/B <0.8, macro awareness)

### Data Tools (MCP)

- `fetch_financial_data`: Fundamentals, valuation, financial statements
- `fetch_sentiment_data`: News articles, sentiment scores, market perception
- `fetch_market_data`: Price data, technical indicators

## Prerequisites

- [Bun](https://bun.com) runtime (v1.0+)
- EODHD API key (get free at [eodhd.com](https://eodhd.com) or use 'DEMO')
- Anthropic API key (optional - only for Agent SDK mode)
- Claude Code CLI (optional - for free AI mode)

## Installation

```bash
# Navigate to project
cd FinX_TradingAgent_Trades

# Install dependencies
bun install

# Set up API keys
cp .env.example .env
```

Edit `.env`:
```env
EODHD_API_KEY=your_eodhd_key_or_DEMO
ANTHROPIC_API_KEY=your_key_here  # Optional, for Agent SDK mode only
```

## Usage

### Mode 1: Simple CLI (No AI)

Quick data lookup without AI reasoning - instant, always free.

```bash
bun research:simple AAPL.US
```

Returns raw fundamentals and sentiment data.

### Mode 2: CLI with AI (Recommended)

Real Claude AI analysis via Claude Code CLI subprocess - **$0 cost** using your current Claude session.

```bash
# Basic analysis
EODHD_API_KEY=DEMO bun research TSLA.US

# Custom question
EODHD_API_KEY=DEMO bun research AAPL.US "Is Apple undervalued?"
```

**How it works:**
- Uses same research flow as Agent SDK (Planning → Action → Validation → Answer)
- Calls Claude Code CLI via subprocess instead of Anthropic API
- Real AI reasoning without API charges
- Uses current Claude session

**Requirements:**
- Claude Code CLI must be installed and in PATH
- Run `claude --version` to verify

### Mode 3: Agent SDK (Production)

Full Anthropic API integration - costs ~$0.50 per analysis.

```bash
ANTHROPIC_API_KEY=sk-... EODHD_API_KEY=DEMO bun research:ai TSLA.US
```

**When to use:**
- Production deployments
- Automated trading systems
- When Claude Code CLI is not available

## Example Output

```
🚀 FinX CLI Research with Real Claude AI
============================================================

📊 Configuration:
   Symbol: AAPL.US
   Question: Should I invest in AAPL.US?
   Mode: CLI (Real Claude AI via subprocess)

============================================================

📋 Phase 1: Research Planning
Creating systematic research plan for AAPL.US...

✅ Planning Agent Response:
Research Plan for AAPL.US:

1. Data Gathering:
   - Fetch fundamentals (P/E, ROE, margins, debt/equity)
   - Fetch sentiment data (news, analyst ratings)
   - Fetch market data (price trends, technical indicators)

2. Quantitative Analysis:
   - Valuation metrics analysis
   - Financial health assessment
   - Profitability analysis

3. Expert Perspectives:
   - Warren Buffett: Quality business analysis
   - Cathie Wood: Innovation potential
   - Michael Burry: Value assessment

4. Synthesis & Recommendation

============================================================

🔍 Phase 2: Research Execution
Fetching data and executing analysis...

✅ Fundamentals fetched for AAPL.US
   Company: Apple Inc.
   Sector: Technology
   Market Cap: $2.8T
   P/E: 28.5
   ROE: 147.8%
   Profit Margin: 26.3%

✅ Sentiment fetched for AAPL.US
   Sentiment Score: 72.5/100
   Articles: 150 (Positive: 90, Neutral: 45, Negative: 15)

============================================================

✅ RESEARCH COMPLETE
============================================================

**Investment Recommendation: BUY**

**Confidence Level: High (85%)**

**Key Findings:**

1. **Business Quality (Excellent)**
   - ROE of 147.8% far exceeds Buffett's 15% threshold
   - Net margin of 26.3% shows exceptional profitability
   - Durable competitive moat in ecosystem lock-in

2. **Valuation (Fair)**
   - P/E of 28.5x is reasonable for quality
   - P/B of 45.2x reflects strong intangible value
   - Trading near historical averages

3. **Sentiment (Positive)**
   - 72.5/100 sentiment score indicates market confidence
   - 60% positive news coverage
   - Strong institutional support

4. **Expert Perspectives:**
   - **Buffett**: Quality business with pricing power, strong moat
   - **Munger**: Excellent capital allocation, competent management
   - **Wood**: Services revenue growing 15%+, innovation in AR/VR
   - **Burry**: Not deep value, but quality justifies premium

**Risk Assessment:**
- Regulatory headwinds (antitrust)
- China exposure (~20% of revenue)
- Valuation not cheap
- Services growth slowing

**Position Sizing Recommendation:**
- Core holding: 5-8% of portfolio
- Dollar-cost average over 3-6 months
- Consider adding on 10%+ pullbacks

**Implementation Guidance:**
1. Start with 50% of intended position
2. Add on weakness below $170
3. Use limit orders to improve entry
4. Hold for 3-5 year minimum

============================================================
📊 RESEARCH METADATA
============================================================
   Iterations: 1
   Validation: APPROVED
   Recommendation: BUY
   Confidence: 85%
   Duration: 12.3s
   Mode: CLI (Real Claude AI)
   Cost: $0 (uses current Claude session)

============================================================
```

## Project Structure

```
FinX_TradingAgent_Trades/
├── src/
│   ├── index.ts                              # Agent SDK mode entry point
│   ├── lib/
│   │   ├── eodhd-client.ts                   # EODHD API client
│   │   ├── agent-wrapper.ts                  # Unified agent interface
│   │   ├── cli-agent-runner.ts               # CLI subprocess wrapper
│   │   └── research-orchestrator-wrapper.ts  # Research flow coordinator
│   ├── agents/
│   │   ├── personas/                         # Investor persona agents
│   │   │   ├── warren-buffett.ts
│   │   │   ├── charlie-munger.ts
│   │   │   ├── cathie-wood.ts
│   │   │   └── michael-burry.ts
│   │   ├── analysts/                         # Analytical agents
│   │   │   ├── valuation-analyst.ts
│   │   │   ├── fundamentals-analyst.ts
│   │   │   ├── sentiment-analyst.ts
│   │   │   └── risk-analyst.ts
│   │   └── research/                         # Research system agents
│   │       ├── planning-agent.ts
│   │       ├── action-agent.ts
│   │       ├── validation-agent.ts
│   │       ├── answer-agent.ts
│   │       └── orchestrator-agent.ts
│   └── tools/
│       ├── fundamental/
│       │   └── financial-data.ts             # MCP tool for fundamentals
│       └── sentiment/
│           └── sentiment-data.ts             # MCP tool for sentiment
├── cli-research-with-claude.ts               # CLI mode with AI
├── cli-research-simple.ts                    # Simple data lookup
├── test-research-system.ts                   # Agent SDK mode
├── package.json
├── tsconfig.json
└── README.md
```

## Research Modes Comparison

| Feature | Simple CLI | CLI with AI | Agent SDK |
|---------|-----------|-------------|-----------|
| **Cost** | $0 | $0 | ~$0.50 |
| **Speed** | Instant | 10-30s | 10-30s |
| **AI Reasoning** | ❌ | ✅ | ✅ |
| **Data Quality** | ✅ | ✅ | ✅ |
| **Research Flow** | ❌ | ✅ | ✅ |
| **Expert Personas** | ❌ | ✅ | ✅ |
| **Recommendations** | ❌ | ✅ | ✅ |
| **Best For** | Quick data | Development | Production |
| **Requires** | EODHD key | EODHD + Claude CLI | EODHD + Anthropic API |

## Configuration

### EODHD API Limits

- **Rate Limits**: 1000 requests/minute, 100,000 requests/day
- **Demo Key**: Limited to specific tickers (AAPL.US, TSLA.US, EURUSD.FOREX)
- **Coverage**: 150k+ tickers across stocks, ETFs, forex, crypto
- **Data**: Fundamentals, news, sentiment, real-time prices

### Customization

Edit files in `src/agents/` to customize:
- Investment criteria (ROE thresholds, P/E ranges)
- Risk tolerance
- Position sizing rules
- Specialist agent prompts

## How It Works

### CLI Wrapper Pattern

The CLI agent runner (`src/lib/cli-agent-runner.ts`) provides an Agent SDK-like interface while using Claude Code CLI subprocess calls:

```typescript
// Outside: Looks like Agent SDK
const runner = createAgentRunner('cli', { verbose: true });
const response = await runner.runPlanningAgent(context);

// Inside: Uses Claude Code CLI subprocess
execFileAsync('claude', [
  '--model', 'sonnet',
  '--file', promptFile
]);
```

Benefits:
- Real AI responses without Anthropic API costs
- Same research flow as production Agent SDK mode
- Uses current Claude Code session
- Safe subprocess execution (no shell injection)

### Research Orchestrator Flow

1. **Planning**: Decomposes user question into research tasks
2. **Action**: Fetches data (fundamentals, sentiment) and executes analysis
3. **Validation**: Checks if research is complete and sufficient
4. **Answer**: Synthesizes findings into actionable recommendation

The orchestrator supports up to 3 iterations for refinement.

## Technical Stack

- **Runtime**: Bun (fast TypeScript/JavaScript runtime)
- **AI Framework**: Claude Agent SDK v0.1.76
- **Data Provider**: EODHD API (150k+ tickers)
- **AI Model**: Claude Sonnet 4.5
- **Schema Validation**: Zod
- **Type Safety**: TypeScript with strict mode

## Development

```bash
# Type checking
bun run typecheck

# Run in dev mode (Agent SDK)
bun dev

# Test CLI mode
EODHD_API_KEY=DEMO bun research TSLA.US
```

## Troubleshooting

### "Claude CLI not found"

Install Claude Code CLI and ensure it's in PATH:
```bash
claude --version
```

### "EODHD API error"

Check API key is set:
```bash
echo $EODHD_API_KEY
```

Use 'DEMO' for testing with limited tickers.

### "Rate limit exceeded"

EODHD limits: 1000/min, 100k/day. Wait or upgrade plan.

## Future Enhancements

- Portfolio optimization and risk analysis
- Backtesting framework
- Real-time alerts for regime changes
- Integration with trading APIs (Interactive Brokers, Alpaca)
- Web dashboard for research history
- ML models for pattern recognition
- Multi-asset class support (bonds, commodities, crypto)

## Credits

- **Claude Agent SDK**: [Anthropic](https://docs.claude.com/en/api/agent-sdk/overview)
- **Financial Data**: [EODHD](https://eodhd.com)
- **Architecture Inspiration**: [ai-hedge-fund](https://github.com/virattt/ai-hedge-fund), [dexter](https://github.com/virattt/dexter)

## License

Private project for personal/educational use.
