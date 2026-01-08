/**
 * CLI Research with Real Claude AI
 *
 * This script uses Claude Code CLI to get REAL AI responses
 * without directly calling Anthropic API.
 *
 * Architecture:
 * - Outside: Same as Agent SDK (Planning → Action → Validation → Answer)
 * - Inside: Uses Claude Code CLI subprocess instead of Anthropic API
 * - Benefit: Real AI analysis using current Claude session
 *
 * Usage:
 *   EODHD_API_KEY=DEMO bun cli-research-with-claude.ts TSLA.US
 *   EODHD_API_KEY=DEMO bun cli-research-with-claude.ts AAPL.US "Is Apple undervalued?"
 *
 * Note: Requires 'claude' CLI to be available in PATH
 */

import { createAgentRunner } from './src/lib/agent-wrapper.ts';
import { ResearchOrchestrator } from './src/lib/research-orchestrator-wrapper.ts';
import { EODHDClient } from './src/lib/eodhd-client.ts';

async function main() {
  // Parse command line arguments
  const symbol = process.argv[2];
  const question =
    process.argv[3] ||
    `Should I invest in ${symbol}? Provide comprehensive analysis including fundamentals, valuation, sentiment, expert perspectives, and risk assessment.`;

  if (!symbol) {
    console.error('❌ Usage: bun cli-research-with-claude.ts <SYMBOL> [QUESTION]');
    console.error('');
    console.error('Examples:');
    console.error('  EODHD_API_KEY=DEMO bun cli-research-with-claude.ts TSLA.US');
    console.error('  EODHD_API_KEY=DEMO bun cli-research-with-claude.ts AAPL.US "Is Apple undervalued?"');
    console.error('');
    console.error('With DEMO API key, you can use:');
    console.error('  - AAPL.US (Apple)');
    console.error('  - TSLA.US (Tesla)');
    console.error('  - EURUSD.FOREX (Euro/USD)');
    console.error('');
    console.error('Requirements:');
    console.error('  - EODHD_API_KEY environment variable');
    console.error('  - Claude Code CLI available in PATH');
    process.exit(1);
  }

  const apiKey = process.env.EODHD_API_KEY || 'DEMO';

  console.log('🚀 FinX CLI Research with Real Claude AI');
  console.log('='.repeat(60));
  console.log('');
  console.log('📊 Configuration:');
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Question: ${question}`);
  console.log(`   API Key: ${apiKey === 'DEMO' ? 'DEMO (limited)' : 'Custom'}`);
  console.log(`   Mode: CLI (Real Claude AI via subprocess)`);
  console.log('');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Create EODHD client
    const eodhClient = new EODHDClient({ apiToken: apiKey });

    // Create CLI agent runner (uses Claude Code CLI for real AI)
    console.log('🤖 Initializing Claude AI via CLI...');
    const agentRunner = createAgentRunner('cli', {
      eodhClient,
      verbose: true,
    });

    // Create research orchestrator
    const orchestrator = new ResearchOrchestrator(agentRunner, eodhClient, true);

    console.log('✅ Claude AI Agent Runner initialized');
    console.log('   - Planning Agent: Claude AI (via CLI)');
    console.log('   - Action Agent: Claude AI (via CLI)');
    console.log('   - Validation Agent: Claude AI (via CLI)');
    console.log('   - Answer Agent: Claude AI (via CLI)');
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('⚠️  Note: This will execute Claude Code CLI subprocesses');
    console.log('   Each agent call will spawn a separate Claude instance');
    console.log('   This may take longer than mock mode but gives real AI responses');
    console.log('');
    console.log('='.repeat(60));
    console.log('');

    // Run research
    const startTime = Date.now();
    const result = await orchestrator.research({
      question,
      symbol,
      maxIterations: 3,
    });
    const duration = (Date.now() - startTime) / 1000;

    // Display results
    console.log('='.repeat(60));
    console.log('✅ RESEARCH COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log(result.answer);
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 RESEARCH METADATA');
    console.log('='.repeat(60));
    console.log(`   Iterations: ${result.metadata.iterations}`);
    console.log(`   Validation: ${result.metadata.validationDecision}`);
    console.log(`   Recommendation: ${result.metadata.recommendation || 'N/A'}`);
    console.log(`   Confidence: ${((result.metadata.confidence || 0) * 100).toFixed(0)}%`);
    console.log(`   Duration: ${duration.toFixed(2)}s`);
    console.log(`   Mode: CLI (Real Claude AI)`);
    console.log(`   Cost: Uses current Claude session (no additional API charges)`);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 This analysis uses REAL Claude AI through CLI subprocesses.');
    console.log('   Same research flow as Agent SDK but using Claude Code CLI.');
    console.log('');
    console.log('   Comparison:');
    console.log('   - Mock Mode: Rules-based, instant, no AI');
    console.log('   - CLI Mode: Real Claude AI via subprocess (THIS)');
    console.log('   - Agent SDK: Real Claude AI via Anthropic API (costs $)');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error during research:', error);
    console.error('');
    console.error('Common issues:');
    console.error('  - EODHD_API_KEY not set (use "DEMO" for testing)');
    console.error('  - Invalid symbol format (use TICKER.EXCHANGE, e.g., TSLA.US)');
    console.error('  - Claude CLI not available in PATH');
    console.error('  - Permission issues with subprocess execution');
    console.error('');
    console.error('To check if Claude CLI is available:');
    console.error('  Run: claude --version');
    process.exit(1);
  }
}

main();
