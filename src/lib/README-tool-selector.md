# LLM-Based Tool Selector

Dynamic tool selection using Claude Haiku for intelligent, cost-effective tool routing.

## Overview

The `LLMToolSelector` class uses Claude Haiku to analyze research tasks and automatically select the minimum set of tools needed to complete them. This reduces unnecessary API calls and optimizes costs.

## Features

- **Intelligent Selection**: Analyzes task requirements and selects appropriate tools
- **Cost-Aware**: Considers API costs when making selections (e.g., fetch_financial_data = 10 calls)
- **Dependency-Aware**: Understands tool dependencies (e.g., analyze_regime requires fetch_market_data)
- **Context-Aware**: Avoids re-fetching data if previous results are available
- **Fast & Cheap**: Uses Claude Haiku (claude-3-5-haiku-20241022) for quick decisions

## Usage

### Basic Example

```typescript
import { LLMToolSelector } from './lib/tool-selector';

const selector = new LLMToolSelector();

const selection = await selector.selectTools({
  task: "What is Apple's P/E ratio?",
  availableTools: [
    { name: 'fetch_financial_data', description: 'Fetch fundamental data' },
    { name: 'fetch_sentiment_data', description: 'Fetch news and sentiment' },
    // ... more tools
  ],
});

console.log(selection.toolNames);  // ['fetch_financial_data']
console.log(selection.reasoning);  // 'P/E ratio is in fundamental data...'
```

### With Previous Results

```typescript
const selection = await selector.selectTools({
  task: "Analyze NVDA sentiment and fundamentals",
  availableTools: tools,
  previousResults: {
    fetch_financial_data: { /* cached data */ }
  },
});

// Will only select fetch_sentiment_data since fundamentals already fetched
```

### Batch Selection

```typescript
const tasks = [
  "Get Apple fundamentals",
  "Analyze Tesla sentiment",
  "Is SPY in momentum?",
];

const selections = await selector.selectToolsForMultipleTasks(
  tasks,
  availableTools
);

for (const [task, selection] of selections) {
  console.log(`${task}: ${selection.toolNames.join(', ')}`);
}
```

### Using Singleton

```typescript
import { getToolSelector } from './lib/tool-selector';

// Get shared instance
const selector = getToolSelector();

// Use it
const selection = await selector.selectTools({ ... });
```

## Configuration

### Custom API Key

```typescript
const selector = new LLMToolSelector({
  apiKey: 'your-anthropic-api-key',
});
```

### Custom Model

```typescript
const selector = new LLMToolSelector({
  model: 'claude-3-5-sonnet-20241022', // Use Sonnet for complex selection
});
```

## Selection Examples

### Simple Query
**Task**: "What is Apple's P/E ratio?"
**Selected**: `['fetch_financial_data']`
**Reasoning**: P/E ratio is in fundamental data

### Sentiment Analysis
**Task**: "Analyze Tesla sentiment"
**Selected**: `['fetch_sentiment_data']`
**Reasoning**: News sentiment directly available

### Technical Analysis
**Task**: "Is S&P 500 in momentum regime?"
**Selected**: `['fetch_market_data', 'analyze_regime']`
**Reasoning**: Need price data first, then regime analysis

### Comprehensive Analysis
**Task**: "Full NVIDIA analysis"
**Selected**: `['fetch_financial_data', 'fetch_sentiment_data', 'fetch_market_data', 'analyze_regime']`
**Reasoning**: Comprehensive analysis requires all data sources

## Integration with Action Agent

The Action Agent can use the tool selector for dynamic tool selection:

```typescript
import { getToolSelector } from '../lib/tool-selector.ts';

// In Action Agent handler
const selector = getToolSelector();

const selection = await selector.selectTools({
  task: planningAgent.currentTask,
  availableTools: getAllRegisteredTools(),
  previousResults: getCompletedTaskResults(),
});

// Execute only selected tools
for (const toolName of selection.toolNames) {
  await executeTool(toolName, params);
}
```

## API Costs

Tool selection itself:
- **Model**: Claude Haiku
- **Cost**: ~$0.001 per selection (very cheap)
- **Latency**: ~200-500ms

Compared to calling all tools unnecessarily:
- fetch_financial_data: 10 API calls
- fetch_sentiment_data: 5 API calls
- Potential savings: 50-90% reduction in API calls

## Error Handling

```typescript
try {
  const selection = await selector.selectTools(context);
  // Use selection.toolNames
} catch (error) {
  if (error.message.includes('ANTHROPIC_API_KEY not set')) {
    // Handle missing API key
  } else if (error.message.includes('Selected tools not available')) {
    // Handle invalid tool selection
  } else {
    // Handle other errors
  }
}
```

## Testing

Run the test suite:

```bash
# Set API key
export ANTHROPIC_API_KEY=your_key_here

# Run tests
bun test-tool-selector.ts
```

Expected output:
```
🧪 Testing LLM-Based Tool Selector
======================================================================

📋 Test: Simple Fundamental Query
   Task: "What is Apple's P/E ratio?"
----------------------------------------------------------------------
✅ Selected Tools: [fetch_financial_data]
   Reasoning: P/E ratio is a fundamental metric...

📋 Test: Sentiment Analysis
   Task: "Analyze Tesla sentiment from recent news"
----------------------------------------------------------------------
✅ Selected Tools: [fetch_sentiment_data]
   Reasoning: Sentiment analysis requires news data...

✅ Tool Selector Tests Complete
```

## Design Rationale

### Why Use an LLM for Tool Selection?

1. **Natural Language Understanding**: Understands task intent better than rule-based systems
2. **Flexible**: Adapts to new tools and tasks without code changes
3. **Context-Aware**: Considers previous results and task dependencies
4. **Cost-Effective**: Haiku is cheap enough that selection cost is negligible

### Why Claude Haiku?

- **Fast**: ~200ms response time vs ~2s for Sonnet
- **Cheap**: ~1/10th the cost of Sonnet
- **Good Enough**: Tool selection is relatively simple reasoning
- **Consistent**: Low temperature (0.3) ensures reliable selections

## Troubleshooting

### "ANTHROPIC_API_KEY not set"

Set the environment variable:
```bash
export ANTHROPIC_API_KEY=your_key_here
```

Or pass it directly:
```typescript
const selector = new LLMToolSelector({ apiKey: 'your_key' });
```

### "Could not extract JSON from response"

The LLM didn't return valid JSON. This is rare with low temperature (0.3). If it happens:
1. Check your prompt isn't too complex
2. Verify tool descriptions are clear
3. Consider using Sonnet instead of Haiku for complex selections

### "Selected tools not available"

The LLM selected a tool that doesn't exist. This indicates:
1. Tool descriptions might be confusing
2. Tool names aren't clearly defined
3. Available tools list might be incomplete

## Future Enhancements

Potential improvements:

1. **Caching**: Cache tool selections for identical tasks
2. **Learning**: Track which selections work best and adjust prompts
3. **Parallel Selection**: Select tools for all tasks in plan at once
4. **Cost Optimization**: Consider tool costs more explicitly in selection
5. **Confidence Scores**: Return confidence level with each selection

## Related Files

- `src/lib/tool-selector.ts` - Implementation
- `test-tool-selector.ts` - Test suite
- `src/agents/research/action-agent.ts` - Uses tool selector
- `src/lib/tool-cache.ts` - Caches tool results to avoid re-fetching
