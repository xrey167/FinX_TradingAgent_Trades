/**
 * CLI Agent Runner - Real Claude AI via Claude Code CLI
 *
 * This runner wraps Claude Code CLI to provide Agent SDK-like interface
 * WITHOUT using Anthropic API directly.
 *
 * Architecture:
 * - Outside: Looks like Agent SDK (same AgentRunner interface)
 * - Inside: Uses Claude Code CLI subprocess calls
 * - Benefit: Real AI responses without Anthropic API costs
 *
 * How it works:
 * 1. Takes agent request (planning, action, validation, answer)
 * 2. Formats it as a prompt for Claude
 * 3. Executes via Claude Code CLI subprocess with --print mode
 * 4. Returns response in AgentResponse format
 */

import type { AgentRunner, AgentContext, AgentResponse } from './agent-wrapper.ts';
import { spawn } from 'child_process';

/**
 * CLI Agent Runner - Uses Claude Code CLI for real AI responses
 */
export class CLIAgentRunner implements AgentRunner {
  private verbose: boolean;

  constructor(options?: { verbose?: boolean }) {
    this.verbose = options?.verbose || false;
  }

  /**
   * Execute a prompt via Claude Code CLI (using spawn with stdin)
   */
  private async executeCLI(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {

      if (this.verbose) {
        console.log(`📝 Executing CLI prompt (${prompt.length} chars)`);
      }

      // Spawn Claude CLI in print mode
      const claude = spawn('claude', [
        '--print',  // Non-interactive mode
        '--model', 'sonnet',
        '--output-format', 'text',  // Plain text output
        '--dangerously-skip-permissions'  // Skip permission prompts (safe in this context)
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';
      let resolved = false;

      // Timeout handler (5 minutes for AI processing)
      const timeout = setTimeout(() => {
        if (!resolved) {
          claude.kill();
          reject(new Error('Claude CLI timeout after 300 seconds (5 minutes)'));
        }
      }, 300000);

      claude.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        output += chunk;
        if (this.verbose) {
          console.log(`📥 Received ${chunk.length} chars from Claude CLI`);
        }
      });

      claude.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        errorOutput += chunk;
        if (this.verbose) {
          console.warn(`⚠️ Claude CLI stderr: ${chunk.substring(0, 200)}`);
        }
      });

      claude.on('close', (code: number | null, signal: string | null) => {
        clearTimeout(timeout);
        resolved = true;

        // Check if we got output regardless of exit code
        if (output.trim().length > 0) {
          if (this.verbose) {
            console.log(`✅ CLI response received (${output.length} chars)`);
          }
          resolve(output.trim());
          return;
        }

        // No output - this is an error
        if (signal) {
          reject(new Error(`Claude CLI killed by signal ${signal}: ${errorOutput}`));
        } else if (code === null) {
          reject(new Error(`Claude CLI exited abnormally: ${errorOutput || 'No error output'}`));
        } else if (code !== 0) {
          reject(new Error(`Claude CLI exited with code ${code}: ${errorOutput}`));
        } else {
          reject(new Error('Claude CLI returned no output'));
        }
      });

      claude.on('error', (error: Error) => {
        clearTimeout(timeout);
        resolved = true;
        reject(new Error(`Failed to spawn Claude CLI: ${error.message}`));
      });

      // Send prompt via stdin
      try {
        if (this.verbose) {
          console.log(`📤 Sending prompt to Claude CLI (${prompt.length} chars)`);
        }
        claude.stdin.write(prompt);
        claude.stdin.end();
        if (this.verbose) {
          console.log(`✅ Prompt sent, waiting for response...`);
        }
      } catch (error) {
        clearTimeout(timeout);
        resolved = true;
        reject(new Error(`Failed to write prompt: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Alternative: Use stdin/stdout for better interaction
   * Same as executeCLI - keeping for backwards compatibility
   */
  private async executeInteractive(prompt: string): Promise<string> {
    return this.executeCLI(prompt);
  }

  /**
   * Planning Agent - via CLI
   */
  async runPlanningAgent(context: AgentContext): Promise<AgentResponse> {
    const { question, symbol } = context;

    const prompt = `You are a Research Planning Agent specialized in investment analysis.

Your task: Create a systematic research plan for analyzing ${symbol}.

User Question: ${question || `Should I invest in ${symbol}?`}

Create a detailed research plan with these phases:
1. Data Gathering (what data to fetch)
2. Quantitative Analysis (what metrics to analyze)
3. Expert Perspectives (which investment philosophies to apply)
4. Synthesis & Recommendation (how to combine findings)

Format your plan clearly with tasks, tools, and expected outputs.
Be specific about which tools to use (fetch_financial_data, fetch_sentiment_data, etc.)
and which specialist agents to invoke (warren-buffett, cathie-wood, valuation-analyst, etc.).`;

    try {
      const content = await this.executeInteractive(prompt);
      return { content, metadata: {} };
    } catch (error) {
      console.error('Planning Agent CLI error:', error);
      // Fallback to mock if CLI fails
      return {
        content: `Research plan for ${symbol} (CLI error, using fallback)`,
        metadata: { error: true },
      };
    }
  }

  /**
   * Action Agent - via CLI
   */
  async runActionAgent(context: AgentContext): Promise<AgentResponse> {
    const { plan, symbol, fundamentals, sentiment } = context;

    const prompt = `You are an Action Agent executing investment research tasks.

Research Plan:
${plan}

Available Data for ${symbol}:
- Fundamentals: ${fundamentals ? `P/E ${fundamentals.pe_ratio}, ROE ${fundamentals.roe}, Margin ${fundamentals.net_margin}` : 'Not yet fetched'}
- Sentiment: ${sentiment ? `Score ${sentiment.sentiment_score}/100, ${sentiment.total_articles} articles` : 'Not yet fetched'}

Your task: Report on the execution of this research plan.
- Confirm which tasks were completed
- Summarize key findings from the data
- Note any tasks that failed or have missing data
- Prepare results for validation

Format as a clear execution report.`;

    try {
      const content = await this.executeInteractive(prompt);
      return { content, metadata: {} };
    } catch (error) {
      console.error('Action Agent CLI error:', error);
      return {
        content: `Execution report for ${symbol} (CLI error, using fallback)`,
        metadata: { error: true },
      };
    }
  }

  /**
   * Validation Agent - via CLI
   */
  async runValidationAgent(context: AgentContext): Promise<AgentResponse> {
    const { question, plan, executionResults, fundamentals, sentiment } = context;

    const prompt = `You are a Validation Agent checking research quality and completeness.

Research Question: ${question}

Research Plan:
${plan}

Execution Results:
${executionResults}

Data Quality:
- Fundamentals: ${fundamentals && fundamentals.pe_ratio ? 'Available' : 'Missing'}
- Sentiment: ${sentiment ? 'Available' : 'Missing'}

Your task: Validate whether the research is complete and ready for synthesis.

Check:
1. Completeness - Were all critical tasks completed?
2. Quality - Is the data sufficient and reliable?
3. Sufficiency - Can we answer the user's question with this data?

Provide a validation decision:
- APPROVED: Ready for synthesis
- NEEDS_MORE_WORK: Specify what additional tasks are needed
- INSUFFICIENT: Cannot answer with available data

Format as a structured validation report with your decision and rationale.`;

    try {
      const content = await this.executeInteractive(prompt);

      // Parse decision from response
      let decision: 'APPROVED' | 'NEEDS_MORE_WORK' | 'INSUFFICIENT' = 'APPROVED';
      if (content.includes('NEEDS_MORE_WORK')) decision = 'NEEDS_MORE_WORK';
      if (content.includes('INSUFFICIENT')) decision = 'INSUFFICIENT';

      return {
        content,
        metadata: { decision },
      };
    } catch (error) {
      console.error('Validation Agent CLI error:', error);
      return {
        content: `Validation report (CLI error, using fallback)`,
        metadata: { decision: 'APPROVED', error: true },
      };
    }
  }

  /**
   * Answer Agent - via CLI
   */
  async runAnswerAgent(context: AgentContext): Promise<AgentResponse> {
    const { question, symbol, fundamentals, sentiment, validationReport } = context;

    const prompt = `You are an Answer Agent synthesizing investment research into actionable recommendations.

Question: ${question}
Stock: ${symbol}

Research Data:
**Fundamentals:**
- Company: ${fundamentals?.company_name || 'Unknown'}
- Sector: ${fundamentals?.sector || 'Unknown'}
- Market Cap: ${fundamentals?.market_cap ? '$' + (fundamentals.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'}
- P/E Ratio: ${fundamentals?.pe_ratio?.toFixed(2) || 'N/A'}
- P/B Ratio: ${fundamentals?.pb_ratio?.toFixed(2) || 'N/A'}
- ROE: ${fundamentals?.roe ? (fundamentals.roe * 100).toFixed(1) + '%' : 'N/A'}
- Profit Margin: ${fundamentals?.net_margin ? (fundamentals.net_margin * 100).toFixed(1) + '%' : 'N/A'}
- Debt/Equity: ${fundamentals?.debt_equity?.toFixed(2) || 'N/A'}

**Sentiment:**
- Sentiment Score: ${sentiment?.sentiment_score?.toFixed(1) || 'N/A'}/100
- Recent Articles: ${sentiment?.total_articles || 0}
- Positive: ${sentiment?.positive_count || 0} | Neutral: ${sentiment?.neutral_count || 0} | Negative: ${sentiment?.negative_count || 0}

Validation Report:
${validationReport}

Your task: Provide a comprehensive investment recommendation.

Include:
1. Direct Answer (BUY/HOLD/SELL/AVOID with confidence level)
2. Key Findings (business quality, valuation, sentiment, risk)
3. Expert Perspectives (how would Buffett, Wood, Burry view this?)
4. Risk/Reward Assessment
5. Position Sizing Recommendation
6. Implementation Guidance

Format as a professional investment research report.
Be specific, actionable, and back up recommendations with data.`;

    try {
      const content = await this.executeInteractive(prompt);

      // Parse recommendation and confidence
      let recommendation: 'BUY' | 'HOLD' | 'SELL' | 'AVOID' = 'HOLD';
      if (content.includes('BUY') && !content.includes('AVOID')) recommendation = 'BUY';
      if (content.includes('SELL')) recommendation = 'SELL';
      if (content.includes('AVOID')) recommendation = 'AVOID';

      let confidence = 0.5;
      if (content.includes('High confidence') || content.includes('High Confidence')) confidence = 0.8;
      if (content.includes('Low confidence') || content.includes('Low Confidence')) confidence = 0.3;

      return {
        content,
        metadata: { recommendation, confidence },
      };
    } catch (error) {
      console.error('Answer Agent CLI error:', error);
      return {
        content: `Investment analysis for ${symbol} (CLI error, using fallback)`,
        metadata: { recommendation: 'HOLD', confidence: 0.5, error: true },
      };
    }
  }

  /**
   * Specialist Agent - via CLI
   */
  async runSpecialistAgent(agentName: string, context: AgentContext): Promise<AgentResponse> {
    const { symbol, fundamentals, sentiment } = context;

    // Build agent-specific prompts
    let persona = '';
    let focus = '';

    switch (agentName) {
      case 'warren-buffett':
        persona = 'Warren Buffett - Value investor focused on quality businesses, moats, and margin of safety';
        focus = 'Focus on: ROE > 15%, reasonable valuation, durable competitive advantages, management quality';
        break;
      case 'charlie-munger':
        persona = 'Charlie Munger - Quality business analyst using mental models and multidisciplinary thinking';
        focus = 'Focus on: Pricing power, moat durability, quality of management, lollapalooza effects';
        break;
      case 'cathie-wood':
        persona = 'Cathie Wood - Innovation investor focused on disruptive growth and exponential change';
        focus = 'Focus on: Innovation potential, TAM >$1T, 25%+ growth, 5-year horizon, disruption';
        break;
      case 'michael-burry':
        persona = 'Michael Burry - Contrarian deep value investor and macro-aware analyst';
        focus = 'Focus on: P/B < 0.8, balance sheet analysis, macro headwinds, bubble detection';
        break;
      default:
        persona = `${agentName} analyst`;
        focus = 'Provide expert analysis';
    }

    const prompt = `You are ${persona}.

Analyze ${symbol}:

Fundamentals:
- P/E: ${fundamentals?.pe_ratio?.toFixed(2) || 'N/A'}
- P/B: ${fundamentals?.pb_ratio?.toFixed(2) || 'N/A'}
- ROE: ${fundamentals?.roe ? (fundamentals.roe * 100).toFixed(1) + '%' : 'N/A'}
- Profit Margin: ${fundamentals?.net_margin ? (fundamentals.net_margin * 100).toFixed(1) + '%' : 'N/A'}
- Debt/Equity: ${fundamentals?.debt_equity?.toFixed(2) || 'N/A'}

Sentiment: ${sentiment?.sentiment_score?.toFixed(1) || 'N/A'}/100

${focus}

Provide your analysis and verdict (BUY/HOLD/AVOID) with reasoning.
Stay in character and use your investment philosophy.`;

    try {
      const content = await this.executeInteractive(prompt);
      return { content, metadata: {} };
    } catch (error) {
      console.error(`${agentName} CLI error:`, error);
      return {
        content: `${agentName} analysis unavailable (CLI error)`,
        metadata: { error: true },
      };
    }
  }
}
