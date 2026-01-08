# CLI Mode - Use Node.js Instead of Bun

## Issue

When running CLI mode with Bun on Windows, you may encounter:

```
panic(main thread): Segmentation fault at address 0xFFFFFFFFFFFFFFFF
oh no: Bun has crashed. This indicates a bug in Bun, not your code.
```

This is a **Bun runtime bug** in `child_process.spawn` on Windows, not an issue with our code.

## Solution: Use Node.js

The CLI mode uses `spawn()` to call Claude CLI, which triggers a Bun segfault on Windows. Use Node.js instead:

### Install Node.js

1. Download from [nodejs.org](https://nodejs.org)
2. Install Node.js v18+ (includes npm)
3. Verify: `node --version`

### Run CLI Mode with Node.js

```powershell
# Instead of: bun research TSLA.US
# Use:
$env:EODHD_API_KEY = "DEMO"
node --loader tsx cli-research-with-claude.ts TSLA.US
```

Or install tsx globally:

```powershell
npm install -g tsx

# Then run:
$env:EODHD_API_KEY = "DEMO"
tsx cli-research-with-claude.ts TSLA.US
```

## Updated Commands

### Simple CLI (No AI) - Works with Bun ✅
```powershell
# This works fine with Bun (no spawn needed)
$env:EODHD_API_KEY = "DEMO"
bun research:simple AAPL.US
```

### CLI with AI - Use Node.js ⚠️
```powershell
# ❌ Don't use Bun (crashes)
bun research TSLA.US

# ✅ Use Node.js with tsx
$env:EODHD_API_KEY = "DEMO"
tsx cli-research-with-claude.ts TSLA.US
```

### Agent SDK Mode - Works with Bun ✅
```powershell
# This works fine with Bun (uses Anthropic SDK, no spawn)
$env:ANTHROPIC_API_KEY = "sk-ant-..."
$env:EODHD_API_KEY = "DEMO"
bun research:ai TSLA.US
```

## Why This Happens

1. **CLI Mode** spawns Claude CLI subprocess using `child_process.spawn()`
2. **Bun's spawn** has a bug on Windows that causes segmentation fault
3. **Node.js spawn** works correctly

## Alternative: Use Agent SDK Mode

If you can't install Node.js, use Agent SDK mode instead (requires Anthropic API key):

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"
$env:EODHD_API_KEY = "DEMO"
bun research:ai TSLA.US
```

Cost: ~$0.50 per analysis

## Quick Reference

| Mode | Command | Runtime | Status |
|------|---------|---------|--------|
| Simple CLI | `bun research:simple` | Bun | ✅ Works |
| CLI with AI | `tsx cli-research-with-claude.ts` | Node.js | ✅ Works |
| CLI with AI | `bun research` | Bun | ❌ Crashes |
| Agent SDK | `bun research:ai` | Bun | ✅ Works |

## Setup tsx (TypeScript Execution)

```powershell
# Install tsx globally
npm install -g tsx

# Verify installation
tsx --version

# Now you can run TypeScript files directly
tsx cli-research-with-claude.ts TSLA.US
```

## Create PowerShell Alias (Optional)

Add to your PowerShell profile:

```powershell
# Open profile
notepad $PROFILE

# Add this function
function finx-research {
    param($symbol, $question)
    if ($question) {
        tsx cli-research-with-claude.ts $symbol $question
    } else {
        tsx cli-research-with-claude.ts $symbol
    }
}

# Save and reload
. $PROFILE

# Now use:
finx-research TSLA.US
```

## Why Not Fix in Code?

This is a **Bun runtime bug**, not a code issue. The crash happens inside Bun's native code when calling Windows APIs. We can't fix it in JavaScript/TypeScript.

The Bun team is working on it. Track progress:
- [Bun GitHub Issues](https://github.com/oven-sh/bun/issues)

## Recommended Setup

For best experience on Windows:

1. **Simple data lookup**: Use Bun
   ```powershell
   bun research:simple AAPL.US
   ```

2. **AI analysis (free)**: Use Node.js + tsx
   ```powershell
   tsx cli-research-with-claude.ts TSLA.US
   ```

3. **AI analysis (paid)**: Use Bun with Agent SDK
   ```powershell
   bun research:ai TSLA.US
   ```

## TypeScript Compilation

You can still use Bun for type checking:

```powershell
bun run typecheck
```

This doesn't spawn processes, so it works fine.
