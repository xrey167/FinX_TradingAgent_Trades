/**
 * FinX Trading Agent - Market Regime Analysis (Agent Mode)
 *
 * Main application entry point for AI-powered analysis
 * Requires Claude API key
 *
 * Usage:
 *   bun start          - Run with Claude Agent SDK (requires ANTHROPIC_API_KEY)
 *   bun cli            - Run CLI mode without API key
 */

import { query, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { fetchMarketDataTool } from './tools/market-data.ts';
import { analyzeRegimeTool } from './tools/regime-analyzer.ts';
import { fetchFinancialDataTool } from './tools/fundamental/financial-data.ts';
import { fetchSentimentDataTool } from './tools/sentiment/sentiment-data.ts';
import { marketAnalystAgent } from './agents/market-analyst.ts';
import { warrenBuffettAgent } from './agents/personas/warren-buffett.ts';
import { charlieMungerAgent } from './agents/personas/charlie-munger.ts';
import { cathieWoodAgent } from './agents/personas/cathie-wood.ts';
import { michaelBurryAgent } from './agents/personas/michael-burry.ts';
import { valuationAnalystAgent } from './agents/analysts/valuation-analyst.ts';
import { fundamentalsAnalystAgent } from './agents/analysts/fundamentals-analyst.ts';
import { sentimentAnalystAgent } from './agents/analysts/sentiment-analyst.ts';
import { riskManagerAgent } from './agents/analysts/risk-manager.ts';
import { planningAgent } from './agents/research/planning-agent.ts';
import { actionAgent } from './agents/research/action-agent.ts';
import { validationAgent } from './agents/research/validation-agent.ts';
import { answerAgent } from './agents/research/answer-agent.ts';
import { researchOrchestratorAgent } from './agents/research/research-orchestrator.ts';
import { MCP_SERVER_NAME, MARKETS, TIMEFRAMES } from './config.ts';

/**
 * Main application function
 */
async function main() {
  console.log('🚀 FinX Trading Agent - Market Regime Analysis (Agent Mode)');
  console.log('=' .repeat(60));
  console.log('');

  // Create MCP server with custom tools
  // Only register data tools if EODHD_API_KEY is configured
  const mcpServer = createSdkMcpServer({
    name: MCP_SERVER_NAME,
    version: '1.0.0',
    tools: [
      // Always available (no API key needed)
      analyzeRegimeTool,

      // Conditional: only if EODHD_API_KEY is set
      ...(process.env.EODHD_API_KEY
        ? [fetchMarketDataTool, fetchFinancialDataTool, fetchSentimentDataTool]
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

  console.log('✅ MCP Server initialized with custom tools:');
  if (process.env.EODHD_API_KEY) {
    console.log('   - fetch_market_data: Fetches OHLCV data from EODHD API');
    console.log('   - fetch_financial_data: Fetches fundamental data (10 API calls)');
    console.log('   - fetch_sentiment_data: Fetches news & sentiment (5 API calls)');
  }
  console.log('   - analyze_regime: Analyzes market regime from OHLCV data');
  console.log('');

  console.log('📊 Markets to analyze:', MARKETS.join(', '));
  console.log('⏰ Timeframes:', TIMEFRAMES.join(', '));
  console.log('');
  console.log('🤖 Starting analysis with market-analyst subagent...');
  console.log('=' .repeat(60));
  console.log('');

  try {
    // Run the query with our custom configuration
    for await (const message of query({
      prompt: `Analyze current market regimes across all configured markets (${MARKETS.join(', ')}) on ${TIMEFRAMES.join(', ')} timeframes.

For each market-timeframe combination:
1. Fetch historical data using fetch_market_data tool
2. Analyze the regime using analyze_regime tool
3. Document the regime classification and confidence level

After analyzing all combinations, provide a comprehensive market overview with key insights and trading implications.

Use the market-analyst agent to perform this analysis systematically.`,

      options: {
        // Tools configuration
        allowedTools: ['Task'],  // Main agent can use Task tool to invoke subagent

        // MCP Server configuration
        mcpServers: {
          [MCP_SERVER_NAME]: mcpServer,
        },

        // Subagent configuration
        agents: {
          'market-analyst': marketAnalystAgent,
          // Investor Personas
          'warren-buffett': warrenBuffettAgent,
          'charlie-munger': charlieMungerAgent,
          'cathie-wood': cathieWoodAgent,
          'michael-burry': michaelBurryAgent,
          // Analytical Agents
          'valuation-analyst': valuationAnalystAgent,
          'fundamentals-analyst': fundamentalsAnalystAgent,
          'sentiment-analyst': sentimentAnalystAgent,
          'risk-manager': riskManagerAgent,
          // Research Agents (Autonomous Research System)
          'planning-agent': planningAgent,
          // Action Agent gets ALL tools for dynamic selection
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
          'research-orchestrator': researchOrchestratorAgent,
        },

        // Model configuration
        model: 'sonnet',

        // Permission mode (bypass for autonomous operation)
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,

        // System prompt
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: '\n\nYou are a trading agent specialized in market regime analysis. Use the market-analyst subagent to perform comprehensive market analysis across multiple markets and timeframes.',
        },

        // Max turns
        maxTurns: 50,
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
        console.log('=' .repeat(60));
        console.log('✅ Analysis Complete');
        console.log('=' .repeat(60));
        console.log('');

        if (message.subtype === 'success') {
          console.log('📈 Final Result:');
          console.log(message.result);
          console.log('');
          console.log(`💰 Cost: $${message.total_cost_usd.toFixed(4)}`);
          console.log(`⏱️  Duration: ${(message.duration_ms / 1000).toFixed(2)}s`);
          console.log(`🔄 Turns: ${message.num_turns}`);
        } else {
          console.log('❌ Analysis failed:');
          console.log(message.subtype);
          if ('errors' in message) {
            message.errors.forEach((error: string) => console.error(error));
          }
        }
      } else if (message.type === 'system' && message.subtype === 'init') {
        console.log('📋 Session initialized');
        console.log(`   Session ID: ${message.session_id}`);
        console.log(`   Model: ${message.model}`);
        console.log('');
      }
    }
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});