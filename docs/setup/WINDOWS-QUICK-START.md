# Windows Quick Start Guide

## The Issue You're Experiencing

Bun crashes on Windows when spawning Claude CLI:
```
panic(main thread): Segmentation fault
```

This is a **Bun runtime bug**, not our code. The crash happens in Bun's native Windows process spawning.

## Solution: Use Node.js for CLI Mode

### 1. Install Node.js (One-Time Setup)

```powershell
# Download and install Node.js from:
# https://nodejs.org

# Verify installation
node --version
npm --version
```

### 2. Install tsx (TypeScript Runner)

```powershell
npm install -g tsx
```

### 3. Run CLI with AI Mode

```powershell
# Set API key
$env:EODHD_API_KEY = "DEMO"

# Run with Node.js (works!)
tsx cli-research-with-claude.ts TSLA.US
```

## All Three Modes

### Mode 1: Simple CLI (Bun) ✅
**No AI, just data - Works with Bun**

```powershell
$env:EODHD_API_KEY = "DEMO"
bun research:simple AAPL.US
```

### Mode 2: CLI with AI (Node.js) ✅
**Free AI analysis - Use Node.js**

```powershell
$env:EODHD_API_KEY = "DEMO"
tsx cli-research-with-claude.ts TSLA.US
```

Or with custom question:
```powershell
$env:EODHD_API_KEY = "DEMO"
tsx cli-research-with-claude.ts AAPL.US "Is Apple undervalued?"
```

### Mode 3: Agent SDK (Bun) ✅
**Paid AI analysis - Works with Bun**

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-your-key"
$env:EODHD_API_KEY = "DEMO"
bun research:ai TSLA.US
```

## Why This Happens

| Component | Runtime | Status |
|-----------|---------|--------|
| Simple CLI | Bun | ✅ Works (no subprocess) |
| CLI with AI | Bun | ❌ Crashes (spawn bug) |
| CLI with AI | Node.js | ✅ Works |
| Agent SDK | Bun | ✅ Works (no spawn) |

The CLI with AI mode uses `spawn()` to call Claude CLI. Bun's spawn has a segfault bug on Windows.

## Quick Commands Summary

```powershell
# Setup (one-time)
npm install -g tsx

# Set API key (once per session)
$env:EODHD_API_KEY = "DEMO"

# Option 1: Quick data lookup (no AI)
bun research:simple AAPL.US

# Option 2: AI analysis (free) - RECOMMENDED
tsx cli-research-with-claude.ts TSLA.US

# Option 3: AI analysis (paid ~$0.50)
$env:ANTHROPIC_API_KEY = "sk-ant-..."
bun research:ai TSLA.US
```

## Expected Output (Mode 2)

```
🚀 FinX CLI Research with Real Claude AI
============================================================

📋 Phase 1: Research Planning
✅ Planning Agent Response: [AI creates systematic plan]

🔍 Phase 2: Research Execution
✅ Fundamentals fetched
✅ Sentiment fetched
✅ Research tasks executed

✔️ Phase 3: Validating research quality...
✅ Validation complete: APPROVED

💡 Phase 4: Synthesizing final answer...
✅ Final answer generated

============================================================
✅ RESEARCH COMPLETE
============================================================

**Investment Recommendation: BUY/HOLD/SELL**
**Confidence Level: X%**

[Comprehensive AI analysis with expert perspectives]
```

## Troubleshooting

### "tsx: command not found"

```powershell
# Install tsx
npm install -g tsx

# Verify
tsx --version
```

### "node: command not found"

Download Node.js from https://nodejs.org and install.

### Still getting Bun crash?

Make sure you're using `tsx`, not `bun`:

```powershell
# ❌ Wrong - will crash
bun research TSLA.US

# ✅ Correct - works
tsx cli-research-with-claude.ts TSLA.US
```

## Alternative: Add npm Script

Edit package.json and use:

```powershell
npm run research:node TSLA.US
```

Already configured in package.json as `research:node`.

## Future Fix

This will be fixed when:
1. Bun fixes their Windows spawn bug, OR
2. You use a different runtime (Node.js works)

Track Bun issue: https://github.com/oven-sh/bun/issues

## Recommendation

For Windows users, use:
- **Bun** for: Simple CLI, Agent SDK, type checking
- **Node.js (tsx)** for: CLI with AI mode

Both work great, just use the right tool for each mode!
