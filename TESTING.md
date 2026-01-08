# FinX Trading Agent - Testing Guide

Complete guide to test and verify all research modes in a new CLI session.

## Prerequisites Check

Open a new terminal and run these commands to verify your setup:

```bash
# 1. Check Bun is installed
bun --version
# Expected: v1.x.x or higher

# 2. Check if you're in the project directory
pwd
# Expected: .../FinX_TradingAgent_Trades

# 3. Verify dependencies are installed
ls node_modules/@anthropic-ai/claude-agent-sdk
# Expected: Should show package files

# 4. Check TypeScript compilation
bun run typecheck
# Expected: No errors (silent success)

# 5. Check if Claude CLI is available (for CLI with AI mode)
claude --version
# Expected: Version number (optional - only needed for CLI mode)
```

## Test Mode 1: Simple CLI (No AI)

**What it does:** Quick data lookup without AI reasoning - instant, always free.

**Test command:**

```bash
EODHD_API_KEY=DEMO bun run cli-research-simple.ts AAPL.US
```

**Expected output:**

```
🔍 FinX Simple Research - Data Lookup Only
============================================================

Symbol: AAPL.US
Mode: Simple Data Lookup (No AI)

============================================================

📊 FUNDAMENTAL DATA
============================================================

Company: Apple Inc.
Sector: Technology
Industry: Consumer Electronics
Market Cap: $2.8T

Valuation Metrics:
  P/E Ratio: 28.5
  P/B Ratio: 45.2
  PEG Ratio: 2.1

Profitability:
  ROE: 147.8%
  ROA: 22.3%
  Net Margin: 26.3%

Financial Health:
  Debt/Equity: 1.8
  Current Ratio: 1.1

============================================================

📰 SENTIMENT DATA
============================================================

Sentiment Score: 72.5/100
Total Articles: 150

Breakdown:
  Positive: 90 (60%)
  Neutral: 45 (30%)
  Negative: 15 (10%)

Recent Headlines:
- Apple announces new product line...
- iPhone sales exceed expectations...
- Services revenue grows 15%...

============================================================

✅ Data retrieval complete
💡 Run with CLI mode for AI-powered analysis
```

**Test with different symbols:**

```bash
# Tesla
EODHD_API_KEY=DEMO bun run cli-research-simple.ts TSLA.US

# EUR/USD Forex
EODHD_API_KEY=DEMO bun run cli-research-simple.ts EURUSD.FOREX
```

## Test Mode 2: CLI with AI (Recommended)

**What it does:** Real Claude AI analysis via subprocess - $0 cost using your current Claude session.

**Prerequisites:**
- Claude Code CLI must be installed and in PATH
- Run `claude --version` to verify

**Test command:**

```bash
EODHD_API_KEY=DEMO bun research TSLA.US
```

Or with a custom question:

```bash
EODHD_API_KEY=DEMO bun research AAPL.US "Is Apple undervalued compared to its peers?"
```

**Expected output:**

```
🚀 FinX CLI Research with Real Claude AI
============================================================

📊 Configuration:
   Symbol: TSLA.US
   Question: Should I invest in TSLA.US?
   API Key: DEMO (limited)
   Mode: CLI (Real Claude AI via subprocess)

============================================================

🤖 Initializing Claude AI via CLI...
✅ Claude AI Agent Runner initialized
   - Planning Agent: Claude AI (via CLI)
   - Action Agent: Claude AI (via CLI)
   - Validation Agent: Claude AI (via CLI)
   - Answer Agent: Claude AI (via CLI)

============================================================

📋 Phase 1: Research Planning
Creating systematic research plan for TSLA.US...

✅ Planning Agent Response:
Research Plan for TSLA.US:

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

✅ Fundamentals fetched for TSLA.US
✅ Sentiment fetched for TSLA.US

⚙️  Phase 2: Executing research tasks...
✅ Research tasks executed

============================================================

✔️  Phase 3: Validating research quality...
✅ Validation complete: APPROVED

============================================================

💡 Phase 4: Synthesizing final answer...
✅ Final answer generated

============================================================

✅ RESEARCH COMPLETE
============================================================

**Investment Recommendation: [BUY/HOLD/SELL/AVOID]**

**Confidence Level: [High/Medium/Low] (X%)**

**Key Findings:**

1. **Business Quality**
   - [AI analysis here]

2. **Valuation**
   - [AI analysis here]

3. **Sentiment**
   - [AI analysis here]

4. **Expert Perspectives**
   - Buffett: [analysis]
   - Wood: [analysis]
   - Burry: [analysis]

**Risk Assessment:**
- [Risks identified by AI]

**Position Sizing Recommendation:**
- [AI recommendation]

============================================================
📊 RESEARCH METADATA
============================================================
   Iterations: 1
   Validation: APPROVED
   Recommendation: BUY/HOLD/SELL/AVOID
   Confidence: X%
   Duration: XX.Xs
   Mode: CLI (Real Claude AI)
   Cost: $0 (uses current Claude session)

============================================================
```

**Note:** This will spawn Claude CLI subprocesses and may take 10-30 seconds.

## Test Mode 3: Agent SDK (Production)

**What it does:** Full Anthropic API integration - costs ~$0.50 per analysis.

**Prerequisites:**
- Anthropic API key set in environment

**Test command:**

```bash
ANTHROPIC_API_KEY=sk-ant-... EODHD_API_KEY=DEMO bun research:ai TSLA.US
```

**Expected output:**

```
🧪 Testing Autonomous Research System
============================================================

✅ MCP Server initialized

📋 Investment Question:
Should I invest in Tesla (TSLA.US)?

I'm looking for a comprehensive analysis including:
- Business fundamentals and financial health
- Valuation analysis (is it overvalued or undervalued?)
- Market sentiment and news
- Expert perspectives from different investment philosophies
- Risk assessment and position sizing recommendation

Please provide a clear BUY/HOLD/SELL recommendation with confidence level.

============================================================

🤖 Starting autonomous research...

📋 Research Session initialized
   Session ID: [uuid]
   Model: claude-sonnet-4-5-20250929

[AI conducts full research...]

============================================================

**FINAL INVESTMENT RECOMMENDATION**

[Comprehensive AI analysis with all findings]

============================================================
```

**Note:** This uses Anthropic API and will cost money (~$0.50 per analysis).

## Verification Checklist

Run through this checklist to verify everything works:

### Basic Tests

- [ ] TypeScript compilation passes (`bun run typecheck`)
- [ ] Simple CLI mode runs without errors
- [ ] Simple CLI mode fetches data for AAPL.US
- [ ] Simple CLI mode fetches data for TSLA.US

### CLI with AI Tests (if Claude CLI available)

- [ ] CLI mode shows initialization message
- [ ] Planning agent responds
- [ ] Action agent executes
- [ ] Validation agent approves
- [ ] Answer agent provides recommendation
- [ ] Full research completes in 10-30 seconds

### Agent SDK Tests (if API key available)

- [ ] MCP server initializes
- [ ] Research session starts
- [ ] Tools are available (fetch_financial_data, fetch_sentiment_data)
- [ ] AI provides comprehensive analysis

### Edge Cases

- [ ] Invalid symbol shows error message
- [ ] Missing API key shows helpful error
- [ ] Claude CLI not found shows clear message (for CLI mode)

## Troubleshooting

### "EODHD API error"

```bash
# Check if API key is set
echo $EODHD_API_KEY

# Use DEMO key for testing
export EODHD_API_KEY=DEMO

# Then retry
bun research:simple AAPL.US
```

### "Claude CLI not found"

```bash
# Check if Claude CLI is installed
which claude

# If not found, you can either:
# 1. Install Claude Code CLI
# 2. Use Agent SDK mode instead (requires Anthropic API key)
```

### "Rate limit exceeded"

EODHD Demo API has limits:
- 1000 requests per minute
- 100,000 requests per day

Wait a moment and retry, or use a paid API key.

### "TypeScript errors"

```bash
# Reinstall dependencies
bun install

# Run type check
bun run typecheck
```

## Quick Start Commands

Copy and paste these for quick testing:

```bash
# Test 1: Simple data lookup (instant, free)
EODHD_API_KEY=DEMO bun research:simple AAPL.US

# Test 2: AI analysis via CLI (10-30s, $0)
EODHD_API_KEY=DEMO bun research TSLA.US

# Test 3: Custom question
EODHD_API_KEY=DEMO bun research AAPL.US "Should I buy Apple stock today?"

# Test 4: Agent SDK mode (requires API key)
ANTHROPIC_API_KEY=sk-ant-... EODHD_API_KEY=DEMO bun research:ai TSLA.US
```

## Expected Performance

| Mode | Speed | Cost | Data Quality | AI Reasoning |
|------|-------|------|--------------|--------------|
| Simple CLI | <1s | $0 | ✅ Real | ❌ No |
| CLI with AI | 10-30s | $0 | ✅ Real | ✅ Yes |
| Agent SDK | 10-30s | ~$0.50 | ✅ Real | ✅ Yes |

## Success Criteria

Your installation is working correctly if:

1. ✅ `bun run typecheck` completes without errors
2. ✅ Simple CLI mode returns real data from EODHD API
3. ✅ CLI with AI mode (if Claude CLI available) completes full research loop
4. ✅ Agent SDK mode (if API key available) provides comprehensive analysis

If all tests pass, your FinX Trading Agent is fully operational!
