# The CLI Wrapper Pattern - Real Claude AI via Subprocess

## What You Asked For

You wanted a wrapper that:
- **From outside:** Looks exactly like Agent SDK  
- **From inside:** Uses Claude Code CLI subprocess
- **Benefit:** Real AI without Anthropic API costs!

## Implementation Complete!

```typescript
// Looks like Agent SDK from outside:
const agentRunner = createAgentRunner('cli');
const result = await orchestrator.research({ question, symbol });

// Uses Claude CLI inside:
class CLIAgentRunner {
  async runAnswerAgent(context) {
    // Safe subprocess execution
    const { stdout } = await execFileAsync('claude', [
      '--model', 'sonnet',
      '--file', 'prompt.txt'
    ]);
    return { content: stdout };  // Real Claude!
  }
}
```

Created files:
- src/lib/cli-agent-runner.ts - The wrapper implementation  
- cli-research-with-claude.ts - Usage script

Test it:
```bash
EODHD_API_KEY=DEMO bun cli-research-with-claude.ts TSLA.US
```

This gives you REAL Claude AI analysis using the current CLI session!
