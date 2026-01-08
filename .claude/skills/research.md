---
description: Run comprehensive investment research using autonomous research system
arguments:
  - name: query
    required: true
    description: Investment question or stock symbol to research
examples:
  - /research "Should I invest in NVDA?"
  - /research "Analyze TSLA fundamentals and sentiment"
  - /research "Is AAPL undervalued?"
  - /research "Compare MSFT and GOOGL for value investing"
---

# Autonomous Investment Research

Triggers the **full research orchestrator workflow** to answer complex investment questions using AI-powered analysis.

## What You'll Get

**Comprehensive Analysis:**
- **Fundamentals:** Financial health, valuation metrics, profitability
- **Sentiment:** News analysis, market sentiment scores
- **Technical:** Market regime, price action, indicators
- **Expert Perspectives:** Analysis from multiple investment philosophies
  - Warren Buffett (value investing)
  - Charlie Munger (quality companies, patience)
  - Cathie Wood (growth/innovation focus)
  - Michael Burry (contrarian/deep value)
- **Risk Assessment:** Position sizing, risk factors, scenarios
- **Final Recommendation:** BUY/HOLD/SELL/AVOID with confidence level

**Research Process:**
1. **Planning Agent:** Creates research plan based on your question
2. **Action Agent:** Executes data collection (fundamentals, sentiment, technical)
3. **Validation Agent:** Ensures data quality and completeness
4. **Answer Agent:** Synthesizes findings into actionable recommendation

**Output Format:**
- Executive Summary
- Detailed Analysis by Category
- Expert Panel Opinions
- Risk Analysis
- Final Verdict with Confidence Score

---

## Implementation

This skill invokes the autonomous research system defined in `test-research-system.ts`.

```bash
# Check if EODHD_API_KEY is configured
if [ -z "$EODHD_API_KEY" ]; then
  echo "⚠️  EODHD_API_KEY not set"
  echo "Please configure your API key:"
  echo "  export EODHD_API_KEY=your_key_here"
  echo ""
  echo "Or use DEMO key for testing (limited symbols):"
  echo "  export EODHD_API_KEY=DEMO"
  exit 1
fi

# Check if ANTHROPIC_API_KEY is configured
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠️  ANTHROPIC_API_KEY not set"
  echo "Research system requires Claude API access."
  echo "Set your API key:"
  echo "  export ANTHROPIC_API_KEY=your_key_here"
  exit 1
fi
```

Now run the autonomous research system with your query:

```typescript
import { query, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { fetchMarketDataTool } from './src/tools/market-data.ts';
import { analyzeRegimeTool } from './src/tools/regime-analyzer.ts';
import { fetchFinancialDataTool } from './src/tools/fundamental/financial-data.ts';
import { fetchSentimentDataTool } from './src/tools/sentiment/sentiment-data.ts';
import { researchOrchestratorAgent } from './src/agents/research/research-orchestrator.ts';
import { planningAgent } from './src/agents/research/planning-agent.ts';
import { actionAgent } from './src/agents/research/action-agent.ts';
import { validationAgent } from './src/agents/research/validation-agent.ts';
import { answerAgent } from './src/agents/research/answer-agent.ts';
import { valuationAnalystAgent } from './src/agents/analysts/valuation-analyst.ts';
import { fundamentalsAnalystAgent } from './src/agents/analysts/fundamentals-analyst.ts';
import { sentimentAnalystAgent } from './src/agents/analysts/sentiment-analyst.ts';
import { riskManagerAgent } from './src/agents/analysts/risk-manager.ts';
import { warrenBuffettAgent } from './src/agents/personas/warren-buffett.ts';
import { charlieMungerAgent } from './src/agents/personas/charlie-munger.ts';
import { cathieWoodAgent } from './src/agents/personas/cathie-wood.ts';
import { michaelBurryAgent } from './src/agents/personas/michael-burry.ts';
import { MCP_SERVER_NAME } from './src/config.ts';

const investmentQuery = `{{query}}`;

console.log('🔬 Starting Autonomous Investment Research');
console.log('='.repeat(80));
console.log('');
console.log('📋 Research Question:');
console.log(`   ${investmentQuery}`);
console.log('');
console.log('🤖 Activating Research Orchestrator...');
console.log('');

// Create MCP server with all tools
const mcpServer = createSdkMcpServer({
  name: MCP_SERVER_NAME,
  version: '1.0.0',
  tools: [
    analyzeRegimeTool,
    ...(process.env.EODHD_API_KEY
      ? [fetchMarketDataTool, fetchFinancialDataTool, fetchSentimentDataTool]
      : []),
  ],
});

// Run autonomous research
for await (const message of query({
  prompt: investmentQuery,

  options: {
    allowedTools: ['Task'],

    mcpServers: {
      [MCP_SERVER_NAME]: mcpServer,
    },

    agents: {
      // Main orchestrator
      'research-orchestrator': researchOrchestratorAgent,

      // Research workflow agents
      'planning-agent': planningAgent,
      'action-agent': {
        ...actionAgent,
        tools: [
          'fetch_financial_data',
          'fetch_sentiment_data',
          'fetch_market_data',
          'analyze_regime',
        ],
      },
      'validation-agent': validationAgent,
      'answer-agent': answerAgent,

      // Specialist analysts
      'valuation-analyst': valuationAnalystAgent,
      'fundamentals-analyst': fundamentalsAnalystAgent,
      'sentiment-analyst': sentimentAnalystAgent,
      'risk-manager': riskManagerAgent,

      // Expert personas
      'warren-buffett': warrenBuffettAgent,
      'charlie-munger': charlieMungerAgent,
      'cathie-wood': cathieWoodAgent,
      'michael-burry': michaelBurryAgent,
    },

    model: 'sonnet',
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,

    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: `
You are a trading agent with access to an autonomous research system.

When the user asks an investment question, invoke the research-orchestrator agent.

The orchestrator will:
1. Plan the research (planning-agent)
2. Execute data collection (action-agent)
3. Validate results (validation-agent)
4. Synthesize final answer (answer-agent)

Do NOT attempt to answer investment questions directly. Always use the orchestrator.
`,
    },

    maxTurns: 100,
  },
})) {
  if (message.type === 'assistant') {
    for (const content of message.message.content) {
      if (content.type === 'text') {
        console.log(content.text);
      }
    }
  } else if (message.type === 'result') {
    console.log('');
    console.log('='.repeat(80));
    console.log('✅ Research Complete');
    console.log('='.repeat(80));
    console.log('');

    if (message.subtype === 'success') {
      console.log('📊 FINAL RESEARCH REPORT:');
      console.log('');
      console.log(message.result);
      console.log('');
      console.log('='.repeat(80));
      console.log('📈 Research Metrics:');
      console.log(`   💰 Cost: $${message.total_cost_usd.toFixed(4)}`);
      console.log(`   ⏱️  Duration: ${(message.duration_ms / 1000).toFixed(2)}s`);
      console.log(`   🔄 Turns: ${message.num_turns}`);
    } else {
      console.log('❌ Research failed:');
      console.log(message.subtype);
      if ('errors' in message) {
        message.errors.forEach((error: string) => console.error(error));
      }
    }
  } else if (message.type === 'system' && message.subtype === 'init') {
    console.log('📋 Research Session Initialized');
    console.log(`   Session ID: ${message.session_id}`);
    console.log(`   Model: ${message.model}`);
    console.log('');
  }
}
```

**Alternative: Direct CLI Execution**

You can also run the research system directly:

```bash
cd "$(dirname "$(readlink -f "$0")" 2>/dev/null || pwd)"

# Option 1: Using the test script
bun run test-research-system.ts

# Option 2: Using the main agent mode
bun start
```

Then modify the test script to use your query instead of the hardcoded one.

---

## Research Workflow Explained

### 1. Planning Phase
The **Planning Agent** analyzes your question and creates a structured research plan:
- Identifies required data (fundamentals, sentiment, technical)
- Determines which expert perspectives are relevant
- Creates task list for Action Agent

### 2. Execution Phase
The **Action Agent** executes the plan:
- Fetches financial data (P/E, ROE, margins, growth rates)
- Fetches sentiment data (news articles, sentiment scores)
- Fetches market data and analyzes regime
- Invokes specialist agents (valuation, fundamentals, sentiment, risk)
- Invokes expert persona agents (Buffett, Munger, Wood, Burry)

### 3. Validation Phase
The **Validation Agent** checks:
- Data completeness (did we get all required data?)
- Data quality (is the data reliable?)
- Analysis quality (are conclusions supported by evidence?)
- Identifies gaps that need additional research

### 4. Synthesis Phase
The **Answer Agent** creates final recommendation:
- Synthesizes all findings into coherent narrative
- Weighs different perspectives
- Provides clear BUY/HOLD/SELL/AVOID recommendation
- Includes confidence level and key risks

---

## Example Research Questions

**Simple Questions:**
```bash
/research "What is AAPL's P/E ratio?"
/research "Is TSLA overvalued?"
/research "What's the sentiment on NVDA?"
```

**Complex Questions:**
```bash
/research "Should I invest in MSFT for long-term value?"
/research "Compare GOOGL and META from a value investing perspective"
/research "Analyze AMZN fundamentals, sentiment, and technical regime"
/research "What would Warren Buffett think about TSLA's valuation?"
```

**Multi-Stock Questions:**
```bash
/research "Which is better: AAPL or MSFT?"
/research "Compare tech giants: GOOGL, META, AMZN"
/research "Best value play: JPM, BAC, or WFC?"
```

---

## Output Example

```
📊 FINAL RESEARCH REPORT:
=============================================================================

INVESTMENT RECOMMENDATION: NVIDIA (NVDA.US)

🎯 VERDICT: BUY
📊 Confidence: 78%

EXECUTIVE SUMMARY:
NVIDIA shows strong fundamentals with exceptional growth metrics (45% revenue
growth YoY) and robust profitability (ROE: 82%). The company dominates the
AI chip market with significant competitive moats. Current valuation (P/E: 65)
is elevated but justified by growth trajectory and market position.

FUNDAMENTALS ANALYSIS:
✅ Revenue Growth: 45% YoY
✅ Net Margin: 48%
✅ ROE: 82%
⚠️  P/E Ratio: 65 (elevated but growth-adjusted PEG: 1.2 is reasonable)
✅ Strong balance sheet with minimal debt

SENTIMENT ANALYSIS:
📰 Sentiment Score: 78/100 (Positive)
- 68% positive articles
- 25% neutral articles
- 7% negative articles
Key themes: AI dominance, data center growth, supply constraints

TECHNICAL ANALYSIS:
📈 Regime: STRONG_MOMENTUM_UP
↗️  Direction: Up
🎯 Confidence: 85%
Current price above 20-day and 50-day moving averages, RSI at 62 (neutral).

EXPERT PERSPECTIVES:

Warren Buffett (Value Investing):
"At a P/E of 65, this requires exceptional faith in future growth. The business
quality is undeniable - wide moat, pricing power, strong management. However,
the valuation leaves little room for error. I'd wait for a better entry point."
Signal: HOLD

Cathie Wood (Growth/Innovation):
"This is exactly the kind of transformative technology company we seek. The AI
revolution is just beginning, and NVIDIA is the arms dealer. The current
valuation is justified by the multi-year growth runway. Strong buy."
Signal: BUY

RISK ASSESSMENT:
⚠️  Valuation Risk: High - any growth disappointment could lead to multiple
contraction
⚠️  Competition Risk: Medium - AMD and custom chips from hyperscalers
✅ Market Position: Strong - dominant market share and technical leadership

POSITION SIZING RECOMMENDATION:
Suggested allocation: 5-10% of portfolio
Risk-adjusted: Start with 5%, add on pullbacks to 20-day MA

KEY RISKS TO MONITOR:
1. Quarterly revenue growth - watch for deceleration
2. Gross margin trends - indicator of competitive pressure
3. Data center spending - cyclical exposure
4. AI adoption pace - market size assumption

=============================================================================
📈 Research Metrics:
   💰 Cost: $0.1247
   ⏱️  Duration: 23.45s
   🔄 Turns: 42
```

---

## API Costs

**Per Research Query:**
- Financial data: 10 API calls (EODHD)
- Sentiment data: 5 API calls (EODHD)
- Market data: 1-5 API calls (EODHD)
- Claude API: ~$0.10-0.20 depending on complexity

**Total:** ~16-20 EODHD calls + ~$0.15 Claude API per research query

**Caching Benefits:**
- Repeated queries for same stock use cached data
- Fundamentals cached for 30 minutes
- Sentiment cached for 10 minutes
- Market data cached for 5 minutes

---

## Use Cases

**Investment Decisions:**
- Evaluate individual stocks for portfolio inclusion
- Compare multiple stocks for allocation decisions
- Get multi-perspective analysis (value vs growth)

**Portfolio Management:**
- Review existing holdings for hold/sell decisions
- Identify position sizing opportunities
- Monitor risk factors

**Learning:**
- Understand different investment philosophies
- Learn fundamental analysis frameworks
- See how experts evaluate companies

**Research:**
- Deep-dive analysis for specific sectors
- Comparative analysis across competitors
- Thematic research (e.g., "best AI stocks")

---

## Notes

- Research system requires both EODHD_API_KEY and ANTHROPIC_API_KEY
- First run may be slower as data is fetched; subsequent runs use cache
- Research quality depends on data availability (not all stocks have complete data)
- Expert perspectives are AI-generated based on known investment philosophies
- Recommendations are for educational purposes only - not financial advice
