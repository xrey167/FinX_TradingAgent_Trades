/**
 * LLM-Based Tool Selector
 *
 * Dynamically selects the minimum set of tools needed for a given task
 * using Claude Haiku for fast, cost-effective selection.
 *
 * Inspired by: Dexter's just-in-time tool selection pattern
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema?: any;
}

export interface ToolSelectionContext {
  task: string;
  availableTools: ToolDefinition[];
  previousResults?: Record<string, any>;
}

export interface ToolSelection {
  toolNames: string[];
  reasoning: string;
}

export class LLMToolSelector {
  private client: Anthropic;
  private model: string;

  constructor(options?: {
    apiKey?: string;
    model?: string;
  }) {
    const apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set. Required for LLM tool selection.');
    }

    this.client = new Anthropic({ apiKey });
    // Use Haiku for fast, cheap tool selection
    this.model = options?.model || 'claude-3-5-haiku-20241022';
  }

  /**
   * Use LLM to dynamically select tools for a given task
   */
  async selectTools(context: ToolSelectionContext): Promise<ToolSelection> {
    const toolDescriptions = context.availableTools
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    const previousResultsInfo = context.previousResults
      ? `\n\nPrevious results available: ${Object.keys(context.previousResults).join(', ')}`
      : '';

    const prompt = `You are a tool selection expert for a financial research system. Given a task, select the MINIMUM set of tools needed to complete it.

AVAILABLE TOOLS:
${toolDescriptions}

TASK: ${context.task}${previousResultsInfo}

SELECTION GUIDELINES:
1. Select ONLY the tools you actually need - avoid unnecessary API calls
2. Consider tool dependencies (e.g., analyze_regime requires fetch_market_data first)
3. If previous results exist, don't re-fetch the same data
4. For simple tasks, use 1 tool; for complex analysis, combine multiple tools
5. fetch_financial_data costs 10 API calls, fetch_sentiment_data costs 5, others cost 1-5

Return ONLY valid JSON in this exact format:
{
  "toolNames": ["tool1", "tool2"],
  "reasoning": "Brief explanation of why these tools were selected"
}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        temperature: 0.3, // Low temperature for consistent, focused selection
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text from response
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in LLM response');
      }

      // Parse JSON from response
      const text = textContent.text.trim();

      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                       text.match(/(\{[\s\S]*\})/);

      if (!jsonMatch || !jsonMatch[1]) {
        throw new Error(`Could not extract JSON from response: ${text}`);
      }

      const selection = JSON.parse(jsonMatch[1]) as ToolSelection;

      // Validate response structure
      if (!Array.isArray(selection.toolNames) || typeof selection.reasoning !== 'string') {
        throw new Error('Invalid tool selection format: missing toolNames or reasoning');
      }

      // Validate tool names exist in available tools
      const availableToolNames = new Set(context.availableTools.map(t => t.name));
      const invalidTools = selection.toolNames.filter(name => !availableToolNames.has(name));

      if (invalidTools.length > 0) {
        throw new Error(`Selected tools not available: ${invalidTools.join(', ')}`);
      }

      return selection;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Tool selection failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Select tools and return both selection and available tool definitions
   */
  async selectToolsWithDefinitions(
    context: ToolSelectionContext
  ): Promise<{
    selection: ToolSelection;
    selectedTools: ToolDefinition[];
  }> {
    const selection = await this.selectTools(context);

    const selectedTools = context.availableTools.filter(t =>
      selection.toolNames.includes(t.name)
    );

    return {
      selection,
      selectedTools,
    };
  }

  /**
   * Batch select tools for multiple tasks
   */
  async selectToolsForMultipleTasks(
    tasks: string[],
    availableTools: ToolDefinition[]
  ): Promise<Map<string, ToolSelection>> {
    const results = new Map<string, ToolSelection>();

    for (const task of tasks) {
      const selection = await this.selectTools({
        task,
        availableTools,
      });
      results.set(task, selection);
    }

    return results;
  }
}

/**
 * Singleton instance for convenience
 */
let selectorInstance: LLMToolSelector | null = null;

export function getToolSelector(options?: {
  apiKey?: string;
  model?: string;
}): LLMToolSelector {
  if (!selectorInstance) {
    selectorInstance = new LLMToolSelector(options);
  }
  return selectorInstance;
}

export function resetToolSelector(): void {
  selectorInstance = null;
}
