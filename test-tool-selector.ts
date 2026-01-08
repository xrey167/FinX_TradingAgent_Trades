/**
 * Test LLM-Based Tool Selector
 *
 * Demonstrates dynamic tool selection for different research tasks
 *
 * Usage:
 *   ANTHROPIC_API_KEY=your_key bun test-tool-selector.ts
 */

import { LLMToolSelector, type ToolDefinition } from './src/lib/tool-selector.ts';

// Define our available tools
const availableTools: ToolDefinition[] = [
  {
    name: 'fetch_financial_data',
    description: 'Fetch fundamental data (financials, valuation, profitability). Costs 10 API calls.',
  },
  {
    name: 'fetch_sentiment_data',
    description: 'Fetch news articles and sentiment scores. Costs 5 API calls.',
  },
  {
    name: 'fetch_market_data',
    description: 'Fetch historical OHLCV price data. Costs 1-5 API calls.',
  },
  {
    name: 'analyze_regime',
    description: 'Analyze market regime from price data (requires fetch_market_data first). Costs 0 API calls.',
  },
];

async function testToolSelection() {
  console.log('🧪 Testing LLM-Based Tool Selector\n');
  console.log('='.repeat(70));

  const selector = new LLMToolSelector();

  // Test cases
  const testCases = [
    {
      name: 'Simple Fundamental Query',
      task: 'What is Apple\'s P/E ratio?',
    },
    {
      name: 'Sentiment Analysis',
      task: 'Analyze Tesla sentiment from recent news',
    },
    {
      name: 'Technical Analysis',
      task: 'Is the S&P 500 in a momentum regime?',
    },
    {
      name: 'Comprehensive Analysis',
      task: 'Full analysis of NVIDIA - fundamentals, sentiment, and market regime',
    },
    {
      name: 'Valuation Question',
      task: 'Is Microsoft undervalued based on its financials?',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Task: "${testCase.task}"`);
    console.log('-'.repeat(70));

    try {
      const selection = await selector.selectTools({
        task: testCase.task,
        availableTools,
      });

      console.log(`✅ Selected Tools: [${selection.toolNames.join(', ')}]`);
      console.log(`   Reasoning: ${selection.reasoning}`);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Tool Selector Tests Complete\n');
}

// Run tests
if (require.main === module || import.meta.url === `file://${process.argv[1]}`) {
  testToolSelection().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
