/**
 * Test Script: Autonomous Research System
 *
 * This script demonstrates how to use the autonomous research system
 * to answer complex investment questions using the research orchestrator.
 *
 * Research Flow:
 * 1. User asks an investment question
 * 2. Research Orchestrator coordinates:
 *    - Planning Agent: Creates research plan
 *    - Action Agent: Executes tasks
 *    - Validation Agent: Checks quality
 *    - Answer Agent: Synthesizes findings
 *
 * Usage:
 *   bun test-research-system.ts
 */

import { query, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { fetchMarketDataTool } from './src/tools/market-data.ts';
import { analyzeRegimeTool } from './src/tools/regime-analyzer.ts';
import { analyzeSeasonalTool } from './src/tools/seasonal-analyzer.ts';
import { fetchFinancialDataTool } from './src/tools/fundamental/financial-data.ts';
import { fetchSentimentDataTool } from './src/tools/sentiment/sentiment-data.ts';
import { marketAnalystAgent } from './src/agents/market-analyst.ts';
import { warrenBuffettAgent } from './src/agents/personas/warren-buffett.ts';
import { charlieMungerAgent } from './src/agents/personas/charlie-munger.ts';
import { cathieWoodAgent } from './src/agents/personas/cathie-wood.ts';
import { michaelBurryAgent } from './src/agents/personas/michael-burry.ts';
import { valuationAnalystAgent } from './src/agents/analysts/valuation-analyst.ts';
import { fundamentalsAnalystAgent } from './src/agents/analysts/fundamentals-analyst.ts';
import { sentimentAnalystAgent } from './src/agents/analysts/sentiment-analyst.ts';
import { riskManagerAgent } from './src/agents/analysts/risk-manager.ts';
import { planningAgent } from './src/agents/research/planning-agent.ts';
import { actionAgent } from './src/agents/research/action-agent.ts';
import { validationAgent } from './src/agents/research/validation-agent.ts';
import { answerAgent } from './src/agents/research/answer-agent.ts';
import { researchOrchestratorAgent } from './src/agents/research/research-orchestrator.ts';
import { MCP_SERVER_NAME } from './src/config.ts';

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Testing Autonomous Research System');
  console.log('='.repeat(60));
  console.log('');

  // Create MCP server with all tools
  // Only register data tools if EODHD_API_KEY is configured
  const mcpServer = createSdkMcpServer({
    name: MCP_SERVER_NAME,
    version: '1.0.0',
    tools: [
      // Always available (no API key needed)
      analyzeRegimeTool,

      // Conditional: only if EODHD_API_KEY is set
      ...(process.env.EODHD_API_KEY
        ? [fetchMarketDataTool, fetchFinancialDataTool, fetchSentimentDataTool, analyzeSeasonalTool]
        : []),
    ],
  });

  // Add logging
  if (!process.env.EODHD_API_KEY) {
    console.warn('⚠️  EODHD_API_KEY not set - data fetching tools unavailable');
    console.warn('   Only analyze_regime tool will be available');
    console.warn('   Set EODHD_API_KEY in .env to enable all tools');
    console.warn('');
  }

  console.log('✅ MCP Server initialized');
  console.log('');

  // Example investment question to test
  const investmentQuestion = `Should I invest in Tesla (TSLA.US)?

I'm looking for a comprehensive analysis including:
- Business fundamentals and financial health
- Valuation analysis (is it overvalued or undervalued?)
- Market sentiment and news
- Expert perspectives from different investment philosophies
- Risk assessment and position sizing recommendation

Please provide a clear BUY/HOLD/SELL recommendation with confidence level.`;

  console.log('📋 Investment Question:');
  console.log(investmentQuestion);
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  console.log('🤖 Starting autonomous research...');
  console.log('');

  try {
    // Run the query with research orchestrator
    for await (const message of query({
      prompt: investmentQuestion,

      options: {
        // Main agent can use Task tool to invoke research orchestrator
        allowedTools: ['Task'],

        // MCP Server configuration
        mcpServers: {
          [MCP_SERVER_NAME]: mcpServer,
        },

        // All available agents
        agents: {
          // Main orchestrator
          'research-orchestrator': researchOrchestratorAgent,

          // Research agents (used by orchestrator)
          'planning-agent': planningAgent,
          // Action Agent gets ALL tools for dynamic selection
          'action-agent': {
            ...actionAgent,
            tools: [
              'fetch_financial_data',
              'fetch_sentiment_data',
              'fetch_market_data',
              'analyze_regime',
              'analyze_seasonal',
            ],
          },
          'validation-agent': validationAgent,
          'answer-agent': answerAgent,

          // Specialist agents (used by action agent)
          'market-analyst': marketAnalystAgent,
          'warren-buffett': warrenBuffettAgent,
          'charlie-munger': charlieMungerAgent,
          'cathie-wood': cathieWoodAgent,
          'michael-burry': michaelBurryAgent,
          'valuation-analyst': valuationAnalystAgent,
          'fundamentals-analyst': fundamentalsAnalystAgent,
          'sentiment-analyst': sentimentAnalystAgent,
          'risk-manager': riskManagerAgent,
        },

        // Model configuration
        model: 'sonnet',

        // Permission mode (bypass for autonomous operation)
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,

        // System prompt - direct the main agent to use research orchestrator
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: `

You are a trading agent with access to an autonomous research system.

IMPORTANT: When the user asks an investment question, you MUST invoke the research-orchestrator agent to handle the research process.

The research orchestrator will:
1. Plan the research (planning-agent)
2. Execute tasks (action-agent)
3. Validate quality (validation-agent)
4. Synthesize answer (answer-agent)

Do NOT attempt to answer investment questions directly. Always use the research-orchestrator agent.

Example:
User: "Should I invest in TSLA?"
You: *Invoke research-orchestrator agent with the question*
`,
        },

        // Max turns (research can be iterative)
        maxTurns: 100,
      },
    })) {
      // Handle different message types
      if (message.type === 'assistant') {
        // Print assistant messages
        for (const content of message.message.content) {
          if (content.type === 'text') {
            console.log(content.text);
          }
        }
      } else if (message.type === 'result') {
        // Print final result
        console.log('');
        console.log('='.repeat(60));
        console.log('✅ Research Complete');
        console.log('='.repeat(60));
        console.log('');

        if (message.subtype === 'success') {
          console.log('📊 Final Research Answer:');
          console.log('');
          console.log(message.result);
          console.log('');
          console.log('='.repeat(60));
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
        console.log('📋 Research Session initialized');
        console.log(`   Session ID: ${message.session_id}`);
        console.log(`   Model: ${message.model}`);
        console.log('');
      }
    }
  } catch (error) {
    console.error('❌ Error during research:', error);
    process.exit(1);
  }
}

// Run the test
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
