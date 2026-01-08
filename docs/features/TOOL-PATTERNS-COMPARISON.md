# Tool & Skill Implementation Patterns - Comparison

Comparison of tool/function call implementations across three projects: **FinX Trading Agent**, **Dexter**, and **AI Hedge Fund**.

---

## 📊 High-Level Comparison

| Aspect | FinX Trading Agent | Dexter | AI Hedge Fund |
|--------|-------------------|---------|---------------|
| **Language** | TypeScript | TypeScript | Python |
| **Framework** | Claude Agent SDK v0.1.76 | LangChain.js | LangGraph + Anthropic |
| **Protocol** | MCP (Model Context Protocol) | LangChain Tools | Python Functions |
| **Tool Count** | 4 MCP tools | 12+ financial tools | 6+ API functions |
| **Agent Count** | 13 agents (4 personas + 4 analysts + 5 research) | 4 agents (Planning, Action, Validation, Answer) | 21 agents (12 personas + 4 analysts + 5 system) |
| **Orchestration** | Research Orchestrator (iterative loop) | Multi-phase orchestrator (Understanding → Plan → Execute → Reflect) | LangGraph state machine |

---

## 🛠️ Tool Definition Patterns

### FinX Trading Agent (MCP Pattern)

**Location**: `src/tools/`

**Structure**:
```typescript
import { createSdkMcpServer } from '@anthropic/agent-sdk';

export const fetchFinancialDataTool = {
  name: 'fetch_financial_data',
  description: 'Fetches comprehensive fundamental data...',
  input_schema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock ticker symbol' }
    },
    required: ['symbol']
  },
  handler: async ({ symbol }) => {
    // Implementation
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      isError: false
    };
  }
};

// Registration
const mcpServer = createSdkMcpServer({
  name: 'FinX Trading Agent',
  version: '1.0.0',
  tools: [
    fetchMarketDataTool,
    analyzeRegimeTool,
    fetchFinancialDataTool,
    fetchSentimentDataTool,
  ],
});
```

**Key Features**:
- ✅ MCP protocol compliance
- ✅ Strongly typed input schemas
- ✅ Consistent response format (MCP content blocks)
- ✅ Error handling with `isError` flag
- ✅ Tools registered in MCP server

---

### Dexter (LangChain DynamicStructuredTool Pattern)

**Location**: `src/tools/finance/`

**Structure**:
```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const getIncomeStatements = new DynamicStructuredTool({
  name: 'get_income_statements',
  description: 'Fetches a company\'s income statements...',
  schema: z.object({
    ticker: z.string(),
    period: z.enum(['annual', 'quarterly', 'ttm']),
    limit: z.number().default(10),
    report_period_gte: z.string().optional()
  }),
  func: async ({ ticker, period, limit, ...filters }) => {
    const params = createParams({ ticker, period, limit, ...filters });
    const response = await callApi('/v1/financials/income_statements', params);
    return formatToolResult(response.data.income_statements, response.sourceUrl);
  }
});

// Registration
export const TOOLS: StructuredToolInterface[] = [
  getIncomeStatements,
  getBalanceSheets,
  getCashFlowStatements,
  // ... other tools
  ...(process.env.TAVILY_API_KEY ? [tavilySearch] : []),
];
```

**Key Features**:
- ✅ Zod schema validation
- ✅ LangChain `StructuredToolInterface` compliance
- ✅ Conditional tool registration (based on env vars)
- ✅ Centralized TOOLS array export
- ✅ Helper functions: `createParams()`, `callApi()`, `formatToolResult()`
- ✅ Source URL tracking

---

### AI Hedge Fund (Python Functions Pattern)

**Location**: `src/tools/api.py`

**Structure**:
```python
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# Data model
class FinancialMetric(BaseModel):
    date: datetime
    market_cap: Optional[float]
    pe_ratio: Optional[float]
    # ... other fields

# Tool function
def get_financial_metrics(
    ticker: str,
    start_date: datetime,
    end_date: datetime,
    limit: int = 100,
    api_key: str = None
) -> List[FinancialMetric]:
    """
    Retrieves financial metrics for analysis.

    Args:
        ticker: Stock symbol
        start_date: Start date for data
        end_date: End date for data
        limit: Maximum records
        api_key: API key from state

    Returns:
        List of FinancialMetric objects
    """
    try:
        response = _make_api_request(
            endpoint=f"/api/v1/metrics",
            params={"ticker": ticker, "start": start_date, "end": end_date},
            api_key=api_key
        )
        return [FinancialMetric(**item) for item in response.get('data', [])]
    except Exception as e:
        logger.error(f"Error fetching metrics: {e}")
        return []  # Never raise, always return empty list

# Centralized request handler with retry logic
def _make_api_request(endpoint: str, params: dict, api_key: str, max_retries: int = 3):
    """Makes API request with rate limit handling and retries."""
    for attempt in range(max_retries):
        response = requests.get(endpoint, params=params, headers={"Authorization": api_key})
        if response.status_code == 429:  # Rate limited
            wait_time = 60 + (attempt * 30)  # Linear backoff: 60s, 90s, 120s
            time.sleep(wait_time)
            continue
        response.raise_for_status()
        return response.json()
    raise Exception("Max retries exceeded")
```

**Key Features**:
- ✅ Pydantic models for type safety
- ✅ Docstrings with clear parameter descriptions
- ✅ Never raises exceptions (returns empty lists)
- ✅ Centralized retry logic with linear backoff
- ✅ Rate limit handling (429 status codes)
- ✅ Global cache instance to reduce API calls
- ✅ Functions designed for LLM tool use

---

## 🤖 Agent Integration Patterns

### FinX Trading Agent - Agent Runner Interface

**Location**: `src/lib/agent-wrapper.ts`, `src/lib/cli-agent-runner.ts`

```typescript
export interface AgentRunner {
  runPlanningAgent(context: string): Promise<AgentResponse>;
  runActionAgent(context: string): Promise<AgentResponse>;
  runValidationAgent(context: string): Promise<AgentResponse>;
  runAnswerAgent(context: string): Promise<AgentResponse>;
  runSpecialistAgent(persona: string, context: string): Promise<AgentResponse>;
}

// CLI Mode - wraps Claude Code CLI
export class CLIAgentRunner implements AgentRunner {
  async runPlanningAgent(context: string): Promise<AgentResponse> {
    const prompt = `You are a Planning Agent. Create a research plan for: ${context}`;
    return this.executeCLI(prompt);
  }

  private executeCLI(prompt: string): Promise<AgentResponse> {
    const claude = spawn('claude', [
      '--print',
      '--model', 'sonnet',
      '--output-format', 'text',
      '--dangerously-skip-permissions'
    ]);

    claude.stdin.write(prompt);
    claude.stdin.end();

    return new Promise((resolve) => {
      let output = '';
      claude.stdout.on('data', (chunk) => output += chunk);
      claude.on('close', () => resolve({ content: output }));
    });
  }
}

// Agent SDK Mode - uses Anthropic API
export class RealAgentRunner implements AgentRunner {
  async runPlanningAgent(context: string): Promise<AgentResponse> {
    const agent = new Agent({
      name: 'Planning Agent',
      instructions: 'Create systematic research plans...',
      model: 'claude-sonnet-4'
    });

    const response = await agent.run(context);
    return { content: response };
  }
}
```

**Usage**:
```typescript
const runner = createAgentRunner('cli', { verbose: true });
const plan = await runner.runPlanningAgent('Should I invest in TSLA?');
```

---

### Dexter - Multi-Phase Orchestrator

**Location**: `src/agent/orchestrator.ts`

```typescript
export class Agent {
  private phases = {
    understanding: UnderstandingPhase,
    planning: PlanningPhase,
    execution: ExecutionPhase,
    reflection: ReflectionPhase,
    answer: AnswerPhase
  };

  async run(query: string): Promise<string> {
    // Phase 1: Understanding (once)
    const understanding = await this.phases.understanding.execute(query);

    // Iterative loop (up to maxIterations)
    let reflection;
    let taskResults = new Map();

    for (let i = 0; i < this.maxIterations; i++) {
      // Phase 2: Planning
      const plan = await this.phases.planning.execute({
        understanding,
        guidanceFromReflection: reflection?.guidance
      });

      // Phase 3: Execution (parallel task execution)
      taskResults = await this.phases.execution.execute(plan.tasks, {
        toolExecutor: this.toolExecutor,
        contextManager: this.contextManager
      });

      // Phase 4: Reflection
      reflection = await this.phases.reflection.execute({
        query,
        taskResults,
        understanding
      });

      if (reflection.isComplete) break;
    }

    // Phase 5: Answer
    return await this.phases.answer.execute({
      query,
      understanding,
      taskResults
    });
  }
}
```

**Tool Selection**:
```typescript
export class ToolExecutor {
  async selectTools(task: Task): Promise<ToolCall[]> {
    const prompt = `
Available tools:
${this.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Task: ${task.description}

Select appropriate tools to complete this task.
`;

    const response = await this.llm.invoke(prompt);
    return this.parseToolCalls(response);
  }

  async executeTool(toolCall: ToolCall): Promise<string> {
    const tool = this.toolMap.get(toolCall.name);
    const result = await tool.invoke(toolCall.args);

    // Save to context
    await this.contextManager.saveContext(toolCall.name, result);

    return result;
  }
}
```

---

### AI Hedge Fund - LangGraph State Machine

**Location**: `src/agents/warren_buffett.py`, `src/graph/state.py`

```python
from langgraph.graph import StateGraph
from typing import TypedDict, List

# State definition
class AgentState(TypedDict):
    ticker: str
    data: dict
    analyst_signals: dict
    portfolio_signals: dict
    api_key: str

# Agent function
def warren_buffett_agent(state: AgentState, agent_id: str = "warren_buffett_agent"):
    """
    Analyzes stocks using Warren Buffett's value investing principles.
    """
    ticker = state["ticker"]
    api_key = get_api_key_from_state(state)

    # Step 1: Fetch data using tools
    financial_metrics = get_financial_metrics(ticker, api_key=api_key)
    line_items = search_line_items(ticker, ["capex", "depreciation"], api_key=api_key)
    market_cap = get_market_cap(ticker, api_key=api_key)

    # Step 2: Analyze fundamentals
    fundamentals_score = analyze_fundamentals(financial_metrics)
    moat_score = analyze_moat(financial_metrics)
    book_value_growth = analyze_book_value_growth(financial_metrics)

    # Step 3: Calculate intrinsic value
    owner_earnings = calculate_owner_earnings(financial_metrics, line_items)
    intrinsic_value = calculate_intrinsic_value(owner_earnings, market_cap)

    # Step 4: Compile facts
    facts = {
        "fundamentals": fundamentals_score,
        "moat": moat_score,
        "book_value_growth": book_value_growth,
        "intrinsic_value": intrinsic_value,
        "current_price": market_cap / shares_outstanding
    }

    # Step 5: Get LLM evaluation
    template = ChatPromptTemplate.from_messages([
        ("system", "You are Warren Buffett. Evaluate this investment..."),
        ("human", f"Ticker: {ticker}\nFacts:\n{facts}")
    ])

    signal = call_llm(template, facts, WarrenBuffettSignal)

    # Step 6: Update state
    state["data"]["analyst_signals"][agent_id] = {
        "signal": signal.signal,
        "confidence": signal.confidence,
        "reasoning": signal.reasoning
    }

    return HumanMessage(content=json.dumps(state["data"]["analyst_signals"][agent_id]))

# Graph orchestration
def create_graph():
    workflow = StateGraph(AgentState)

    # Add nodes (agents)
    workflow.add_node("warren_buffett", warren_buffett_agent)
    workflow.add_node("cathie_wood", cathie_wood_agent)
    workflow.add_node("fundamentals", fundamentals_agent)
    workflow.add_node("portfolio_manager", portfolio_manager_agent)

    # Define edges (workflow)
    workflow.add_edge("warren_buffett", "fundamentals")
    workflow.add_edge("cathie_wood", "fundamentals")
    workflow.add_edge("fundamentals", "portfolio_manager")

    return workflow.compile()
```

**Tool Usage Pattern**:
```python
# Tools are just Python functions
from src.tools.api import get_financial_metrics, get_market_cap

# Agents call them directly
def agent_function(state: AgentState):
    api_key = state["api_key"]

    # Direct function calls
    metrics = get_financial_metrics(
        ticker=state["ticker"],
        start_date=datetime(2020, 1, 1),
        end_date=datetime.now(),
        api_key=api_key
    )

    # Process results
    for metric in metrics:
        # metric is a Pydantic model with typed fields
        pe_ratio = metric.pe_ratio
        roe = metric.roe
```

---

## 🔄 Orchestration Patterns

### FinX Trading Agent - Research Orchestrator

**Workflow**: Planning → Action → Validation → Answer (with iteration)

```typescript
export async function runResearch(question: string) {
  const runner = createAgentRunner('cli');
  let iteration = 0;
  const maxIterations = 3;

  while (iteration < maxIterations) {
    // Phase 1: Planning
    const plan = await runner.runPlanningAgent(question);

    // Phase 2: Fetch data (EODHD API)
    const fundamentalData = await client.getFundamentals(symbol);
    const sentimentData = await client.getNews(symbol);

    // Phase 3: Action (execute plan)
    const actionResult = await runner.runActionAgent(
      `Plan: ${plan}\nData: ${JSON.stringify({ fundamentalData, sentimentData })}`
    );

    // Phase 4: Validation
    const validation = await runner.runValidationAgent(actionResult);

    if (validation.decision === 'APPROVED') {
      // Phase 5: Answer
      const answer = await runner.runAnswerAgent(actionResult);
      return answer;
    } else if (validation.decision === 'NEEDS_MORE_WORK') {
      iteration++;
      question = validation.additionalTasks;
    } else {
      throw new Error('Insufficient data');
    }
  }
}
```

---

### Dexter - Multi-Phase with Just-In-Time Tool Selection

**Workflow**: Understanding → [Plan → Execute → Reflect]* → Answer

```typescript
// Understanding phase (once)
const understanding = await understandQuery(query);

// Iterative refinement loop
for (let i = 0; i < maxIterations; i++) {
  // Planning phase - creates task list
  const plan = await createPlan(understanding, previousReflection);

  // Execution phase - selects and runs tools
  const taskResults = await Promise.all(
    plan.tasks.map(async task => {
      // Just-in-time tool selection
      const toolCalls = await selectToolsForTask(task);

      // Execute tools in parallel
      const results = await Promise.all(
        toolCalls.map(tc => executeTool(tc))
      );

      return { task, results };
    })
  );

  // Reflection phase - evaluates completeness
  const reflection = await reflect(query, taskResults);

  if (reflection.isComplete) break;
}

// Answer phase
const answer = await synthesizeAnswer(understanding, taskResults);
```

---

### AI Hedge Fund - LangGraph State Machine

**Workflow**: Parallel agent execution → Portfolio manager decision

```python
# Define state transitions
workflow = StateGraph(AgentState)

# Add all analyst agents (run in parallel)
analyst_agents = [
    "warren_buffett",
    "cathie_wood",
    "michael_burry",
    "fundamentals",
    "technicals",
    "sentiment"
]

for agent in analyst_agents:
    workflow.add_node(agent, agent_functions[agent])

# Add portfolio manager (final decision)
workflow.add_node("portfolio_manager", portfolio_manager_agent)
workflow.add_node("risk_manager", risk_manager_agent)

# Define edges (all analysts feed into portfolio manager)
for agent in analyst_agents:
    workflow.add_edge(agent, "portfolio_manager")

workflow.add_edge("portfolio_manager", "risk_manager")

# Compile and run
graph = workflow.compile()
result = graph.invoke({
    "ticker": "AAPL",
    "api_key": os.getenv("FINANCIAL_API_KEY")
})
```

---

## 🎯 Key Differences

### Tool Registration

| Project | Method | Location | Pattern |
|---------|--------|----------|---------|
| **FinX** | MCP Server registration | `src/index.ts` | `createSdkMcpServer({ tools: [...] })` |
| **Dexter** | Array export | `src/tools/index.ts` | `export const TOOLS = [...]` |
| **AI Hedge Fund** | Direct imports | Agent files | `from src.tools.api import get_metrics` |

### Tool Definition

| Project | Schema Validation | Return Type | Error Handling |
|---------|------------------|-------------|----------------|
| **FinX** | TypeScript types | MCP content blocks | `isError: true` flag |
| **Dexter** | Zod schemas | Formatted strings | Try/catch with formatting |
| **AI Hedge Fund** | Pydantic models | Typed objects | Returns empty lists |

### Agent Execution

| Project | Orchestration | Tool Selection | Iteration Support |
|---------|--------------|----------------|------------------|
| **FinX** | Research Orchestrator | Pre-defined per agent | Yes (max 3) |
| **Dexter** | Multi-phase orchestrator | LLM-based JIT selection | Yes (configurable) |
| **AI Hedge Fund** | LangGraph state machine | Direct function calls | No (single pass) |

---

## 💡 Best Practices Across All Three

### 1. **Consistent Return Formats**
All three enforce structured returns:
- FinX: MCP protocol with `{ content: [...], isError: boolean }`
- Dexter: `formatToolResult()` helper function
- AI Hedge Fund: Pydantic models

### 2. **Error Handling**
All three handle errors gracefully:
- FinX: Returns error flag, doesn't throw
- Dexter: Try/catch with fallback results
- AI Hedge Fund: Returns empty lists, never raises

### 3. **Type Safety**
All three use type systems:
- FinX: TypeScript interfaces
- Dexter: Zod validation
- AI Hedge Fund: Pydantic models

### 4. **Modular Organization**
All three separate tools into domains:
- FinX: `tools/fundamental/`, `tools/sentiment/`, `tools/market-data.ts`
- Dexter: `tools/finance/`, `tools/search/`
- AI Hedge Fund: `tools/api.py` (centralized)

### 5. **Caching & Rate Limiting**
All three implement efficiency measures:
- FinX: EODHD client has built-in caching
- Dexter: Context manager saves tool results
- AI Hedge Fund: Global cache + linear backoff retry

---

## 🚀 Recommendations for FinX

### 1. **Add Conditional Tool Registration (like Dexter)**
```typescript
export const TOOLS = [
  fetchMarketDataTool,
  analyzeRegimeTool,
  fetchFinancialDataTool,
  fetchSentimentDataTool,
  // Conditional tools
  ...(process.env.ALPHA_VANTAGE_KEY ? [alphaVantageTool] : []),
  ...(process.env.TAVILY_API_KEY ? [webSearchTool] : []),
];
```

### 2. **Add Helper Functions (like Dexter)**
```typescript
// src/tools/helpers.ts
export function createToolParams(params: Record<string, any>) {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}

export function formatToolResult(data: unknown, sourceUrl?: string) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    ...(sourceUrl && { metadata: { sourceUrl } })
  };
}
```

### 3. **Add Retry Logic (like AI Hedge Fund)**
```typescript
// src/lib/eodhd-client.ts
async function makeRequest(url: string, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        const waitTime = 60 + (attempt * 30); // 60s, 90s, 120s
        await sleep(waitTime * 1000);
        continue;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

### 4. **Add Tool Result Caching (like Dexter)**
```typescript
// src/lib/context-manager.ts
export class ContextManager {
  private cache = new Map<string, any>();

  async getOrFetch(key: string, fetcher: () => Promise<any>): Promise<any> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const result = await fetcher();
    this.cache.set(key, result);
    return result;
  }

  saveToFile(toolName: string, result: any) {
    const contextDir = '.finx/context';
    fs.writeFileSync(
      `${contextDir}/${toolName}-${Date.now()}.json`,
      JSON.stringify(result, null, 2)
    );
  }
}
```

### 5. **Add Source URL Tracking (like Dexter)**
```typescript
export const fetchFinancialDataTool = {
  name: 'fetch_financial_data',
  description: '...',
  input_schema: { /* ... */ },
  handler: async ({ symbol }) => {
    const url = `https://eodhd.com/api/fundamentals/${symbol}?api_token=${apiKey}`;
    const data = await fetchData(url);

    return {
      content: [
        { type: 'text', text: JSON.stringify(data, null, 2) }
      ],
      metadata: {
        sourceUrls: [url],
        timestamp: new Date().toISOString()
      }
    };
  }
};
```

### 6. **Add LLM-Based Tool Selection (like Dexter)**
```typescript
// Currently, FinX pre-assigns tools to agents
// Consider dynamic selection:

async function selectToolsForTask(task: string, availableTools: Tool[]) {
  const toolDescriptions = availableTools
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');

  const prompt = `
Available tools:
${toolDescriptions}

Task: ${task}

Which tools are needed? Return JSON array of tool names.
`;

  const response = await llm.invoke(prompt);
  const toolNames = JSON.parse(response);

  return availableTools.filter(t => toolNames.includes(t.name));
}
```

---

## 📚 Summary

### FinX Strengths
- ✅ MCP protocol compliance (future-proof)
- ✅ Multiple execution modes (CLI, Real)
- ✅ Strong TypeScript typing
- ✅ Clean separation of concerns

### Dexter Strengths
- ✅ LangChain ecosystem integration
- ✅ Just-in-time tool selection (flexible)
- ✅ Context manager (persistent results)
- ✅ Conditional tool registration

### AI Hedge Fund Strengths
- ✅ Simple Python functions (easy to understand)
- ✅ Pydantic models (strong typing)
- ✅ Robust retry logic
- ✅ LangGraph state machine (clear workflow)

### Recommended FinX Improvements
1. Add conditional tool registration
2. Implement helper functions for common patterns
3. Add retry logic with linear backoff
4. Implement tool result caching
5. Add source URL tracking
6. Consider LLM-based tool selection for flexibility

---

**Next Steps**: Would you like me to implement any of these recommendations in your FinX Trading Agent?
