# ESM Import Fix for Node.js Compatibility

## Issue

When running with Node.js (tsx), the code failed with:

```
ReferenceError: require is not defined
    at createAgentRunner (agent-wrapper.ts:96:32)
```

## Root Cause

The project uses ES Modules (`"type": "module"` in package.json), but the code was using CommonJS `require()` statements.

In ESM mode:
- ❌ `require()` - Not available (CommonJS only)
- ✅ `import` - Correct ESM syntax

## Fixes Applied

### 1. agent-wrapper.ts ✅

**Before:**
```typescript
export function createAgentRunner(...): AgentRunner {
  if (mode === 'cli') {
    const { CLIAgentRunner } = require('./cli-agent-runner.ts');  // ❌ CommonJS
    return new CLIAgentRunner({ verbose: options?.verbose });
  }
}
```

**After:**
```typescript
import { CLIAgentRunner } from './cli-agent-runner.ts';  // ✅ ESM

export function createAgentRunner(...): AgentRunner {
  if (mode === 'cli') {
    return new CLIAgentRunner({ verbose: options?.verbose });
  }
}
```

### 2. cli-agent-runner.ts ✅

**Before:**
```typescript
private async executeCLI(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');  // ❌ CommonJS
    // ...
  });
}
```

**After:**
```typescript
import { spawn } from 'child_process';  // ✅ ESM

private async executeCLI(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Now 'spawn' is imported at top level
    // ...
  });
}
```

## Why This Matters

| Runtime | Module System | require() | import |
|---------|--------------|-----------|--------|
| Bun | Both ESM & CJS | ✅ Works | ✅ Works |
| Node.js (ESM) | ESM only | ❌ Error | ✅ Works |

Since we use `"type": "module"` in package.json, Node.js runs in strict ESM mode where `require()` is not available.

## Benefits

1. ✅ Works with Node.js (tsx)
2. ✅ Still works with Bun
3. ✅ TypeScript compilation passes
4. ✅ Modern ESM standard
5. ✅ Better for tree-shaking and optimization

## Testing

```powershell
# Now works!
$env:EODHD_API_KEY = "DEMO"
tsx cli-research-with-claude.ts TSLA.US
```

## Files Modified

1. `src/lib/agent-wrapper.ts` - Static import of CLIAgentRunner
2. `src/lib/cli-agent-runner.ts` - Static import of spawn

Both changes maintain full compatibility with Bun and add Node.js support.

## TypeScript Compatibility

All changes are type-safe:
```bash
bunx tsc --noEmit  # ✅ Passes
```

## Compatibility Matrix

| Feature | Bun | Node.js (tsx) |
|---------|-----|---------------|
| Simple CLI | ✅ | ✅ |
| CLI with AI | ❌ (spawn bug) | ✅ (works now!) |
| Agent SDK | ✅ | ✅ |
| Type checking | ✅ | ✅ |

Now CLI with AI mode works perfectly with Node.js while maintaining Bun compatibility for other modes!
