/**
 * Agent Wrapper - Unified Interface for AI Agents
 *
 * This wrapper allows the research system to run in two modes:
 * 1. CLI Mode: Uses Claude Code CLI subprocess (real AI, no API costs)
 * 2. Real Mode: Uses Anthropic API (real AI, costs money)
 *
 * Inspired by: dexter and ai-hedge-fund architecture patterns
 */

import type { EODHDClient } from './eodhd-client.ts';

import { CLIAgentRunner } from './cli-agent-runner.ts';

/**
 * Agent execution context - data available to agents
 */
export interface AgentContext {
  symbol?: string;
  fundamentals?: any;
  sentiment?: any;
  marketData?: any;
  regime?: any;
  question?: string;
  plan?: string;
  executionResults?: any;
  validationReport?: any;
  allResearchData?: any;
}

/**
 * Agent response format
 */
export interface AgentResponse {
  content: string;
  metadata?: {
    confidence?: number;
    decision?: 'APPROVED' | 'NEEDS_MORE_WORK' | 'INSUFFICIENT';
    additionalTasks?: string[];
    recommendation?: 'BUY' | 'HOLD' | 'SELL' | 'AVOID';
    error?: boolean;
  };
}

/**
 * Agent Runner Interface
 * All agent implementations must follow this interface
 */
export interface AgentRunner {
  /**
   * Run a planning agent
   */
  runPlanningAgent(context: AgentContext): Promise<AgentResponse>;

  /**
   * Run an action agent
   */
  runActionAgent(context: AgentContext): Promise<AgentResponse>;

  /**
   * Run a validation agent
   */
  runValidationAgent(context: AgentContext): Promise<AgentResponse>;

  /**
   * Run an answer agent
   */
  runAnswerAgent(context: AgentContext): Promise<AgentResponse>;

  /**
   * Run a specialist agent (Buffett, Munger, Wood, Burry, analysts)
   */
  runSpecialistAgent(
    agentName: string,
    context: AgentContext
  ): Promise<AgentResponse>;
}

/**
 * Research Mode
 */
export type ResearchMode = 'cli' | 'real';

/**
 * Agent Runner Factory
 * Creates the appropriate runner based on mode
 */
export function createAgentRunner(
  mode: ResearchMode,
  options?: {
    eodhClient?: EODHDClient;
    anthropicApiKey?: string;
    verbose?: boolean;
  }
): AgentRunner {
  if (mode === 'cli') {
    // CLI agent runner - uses Claude Code CLI (real AI, no direct Anthropic API)
    return new CLIAgentRunner({ verbose: options?.verbose });
  } else {
    // Real agent runner - uses Anthropic API directly
    // Not implemented yet - use Agent SDK mode (test-research-system.ts) instead
    throw new Error('Real agent runner not implemented yet - use Agent SDK mode (bun research:ai)');
  }
}
