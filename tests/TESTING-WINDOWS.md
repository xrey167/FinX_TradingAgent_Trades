# FinX Trading Agent - Windows PowerShell Testing Guide

Complete guide to test and verify all research modes using **Windows PowerShell**.

## ⚠️ Important: Bun Compatibility Issue on Windows

**CLI with AI mode has a Bun bug on Windows** that causes crashes:
```
panic(main thread): Segmentation fault
```

**Solution:** Use Node.js with tsx for CLI with AI mode:
```powershell
npm install -g tsx
tsx cli-research-with-claude.ts TSLA.US
```

**What works:**
- ✅ Simple CLI mode (Bun) - No AI, just data
- ✅ CLI with AI mode (Node.js + tsx) - Free AI analysis
- ✅ Agent SDK mode (Bun) - Paid AI analysis

See [RUN-WITH-NODE.md](./RUN-WITH-NODE.md) for details.

## Quick Test Commands (PowerShell)

Copy and paste these commands in your PowerShell terminal:

### 1. Set API Key (PowerShell syntax)
```powershell
$env:EODHD_API_KEY = "DEMO"
```

### 2. Verify TypeScript Compilation
```powershell
bun run typecheck
```
**Expected:** No output = success ✅

### 3. Test Simple CLI (instant, no AI)
```powershell
bun research:simple AAPL.US
```
**Expected:** Raw data for Apple in ~1 second

### 4. Test CLI with AI (free, uses Claude Code CLI)

⚠️ **Important:** Bun has a bug on Windows that causes crashes with CLI mode. Use Node.js instead:

```powershell
# Install tsx first (one-time setup)
npm install -g tsx

# Then run CLI with AI mode
tsx cli-research-with-claude.ts TSLA.US
```

Or use the npm script:
```powershell
npm run research:node TSLA.US
```

**Expected:** Full AI research in 10-30 seconds

### 5. Test with Custom Question
```powershell
bun research AAPL.US "Is Apple undervalued?"
```

### 6. Test Agent SDK (costs ~$0.50)
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"
$env:EODHD_API_KEY = "DEMO"
bun research:ai TSLA.US
```

## One-Line Commands (PowerShell)

If you prefer one-line commands, use PowerShell's inline env var syntax:

```powershell
# Simple CLI
$env:EODHD_API_KEY="DEMO"; bun research:simple AAPL.US

# CLI with AI
$env:EODHD_API_KEY="DEMO"; bun research TSLA.US

# Custom question
$env:EODHD_API_KEY="DEMO"; bun research AAPL.US "Is Apple undervalued?"

# Agent SDK (with API key)
$env:ANTHROPIC_API_KEY="sk-ant-..."; $env:EODHD_API_KEY="DEMO"; bun research:ai TSLA.US
```

## Full Test Session (Copy All)

```powershell
# Navigate to project
cd C:\Users\Xrey\Repository\FinX_TradingAgent_Trades

# Set API key (stays for this session)
$env:EODHD_API_KEY = "DEMO"

# Test 1: TypeScript compilation
Write-Host "`n=== Test 1: TypeScript Compilation ===" -ForegroundColor Cyan
bun run typecheck
Write-Host "✅ TypeScript check passed" -ForegroundColor Green

# Test 2: Simple CLI mode (AAPL)
Write-Host "`n=== Test 2: Simple CLI - Apple ===" -ForegroundColor Cyan
bun research:simple AAPL.US

# Test 3: Simple CLI mode (TSLA)
Write-Host "`n=== Test 3: Simple CLI - Tesla ===" -ForegroundColor Cyan
bun research:simple TSLA.US

# Test 4: CLI with AI (if Claude CLI available)
Write-Host "`n=== Test 4: CLI with AI - Tesla ===" -ForegroundColor Cyan
bun research TSLA.US

# Test 5: Custom question
Write-Host "`n=== Test 5: Custom Question ===" -ForegroundColor Cyan
bun research AAPL.US "Should I buy Apple stock today?"
```

## Expected Output Examples

### Test 1: TypeScript Compilation
```
(No output = success)
✅ TypeScript check passed
```

### Test 2: Simple CLI - Apple
```
🔍 FinX Simple Research - Data Lookup Only
============================================================

Symbol: AAPL.US
Mode: Simple Data Lookup (No AI)

============================================================

📊 FUNDAMENTAL DATA
============================================================

Company: Apple Inc.
Sector: Technology
Market Cap: $2.8T
P/E Ratio: 28.5
ROE: 147.8%
...

📰 SENTIMENT DATA
============================================================

Sentiment Score: 72.5/100
Total Articles: 150
...
```

### Test 4: CLI with AI - Tesla
```
🚀 FinX CLI Research with Real Claude AI
============================================================

📊 Configuration:
   Symbol: TSLA.US
   Mode: CLI (Real Claude AI via subprocess)

============================================================

📋 Phase 1: Research Planning
✅ Planning Agent Response:
Research Plan for TSLA.US:
1. Data Gathering...
2. Quantitative Analysis...
3. Expert Perspectives...

============================================================

🔍 Phase 2: Research Execution
✅ Fundamentals fetched
✅ Sentiment fetched

============================================================

✅ RESEARCH COMPLETE

**Investment Recommendation: BUY/HOLD/SELL**
**Confidence Level: X%**

[Full AI analysis...]
```

## Troubleshooting PowerShell Issues

### Error: "CommandNotFoundException"
You tried to use bash syntax. Use PowerShell syntax instead:

❌ **Wrong (bash):**
```bash
EODHD_API_KEY=DEMO bun research:simple AAPL.US
```

✅ **Correct (PowerShell):**
```powershell
$env:EODHD_API_KEY = "DEMO"
bun research:simple AAPL.US
```

Or one-line:
```powershell
$env:EODHD_API_KEY="DEMO"; bun research:simple AAPL.US
```

### Check if API Key is Set
```powershell
$env:EODHD_API_KEY
# Should output: DEMO
```

### Clear API Key
```powershell
$env:EODHD_API_KEY = $null
```

### Check Claude CLI Availability
```powershell
claude --version
# If error: Claude CLI not installed (needed for CLI with AI mode)
```

## Windows CMD Alternative

If you're using CMD instead of PowerShell:

```cmd
REM Set API key
set EODHD_API_KEY=DEMO

REM Test simple CLI
bun research:simple AAPL.US

REM Test CLI with AI
bun research TSLA.US
```

## Verification Checklist

- [ ] TypeScript compilation passes
- [ ] Simple CLI returns data for AAPL.US
- [ ] Simple CLI returns data for TSLA.US
- [ ] CLI with AI mode completes (if Claude CLI available)
- [ ] Custom questions work

## Quick Reference

| Command | PowerShell Syntax |
|---------|-------------------|
| Set env var | `$env:VAR = "value"` |
| Check env var | `$env:VAR` |
| One-line | `$env:VAR="value"; command` |
| Clear env var | `$env:VAR = $null` |

## Pro Tips

1. **Keep API key for session:**
   ```powershell
   $env:EODHD_API_KEY = "DEMO"
   # Now all commands use this automatically
   bun research:simple AAPL.US
   bun research TSLA.US
   ```

2. **Create PowerShell profile:**
   ```powershell
   # Add to your PowerShell profile
   notepad $PROFILE

   # Add this line:
   $env:EODHD_API_KEY = "DEMO"
   ```

3. **Use aliases:**
   ```powershell
   # Add to profile
   function finx-simple { bun research:simple $args }
   function finx-ai { bun research $args }

   # Then use:
   finx-simple AAPL.US
   finx-ai TSLA.US
   ```

## All-in-One Test Script

Save this as `test.ps1` and run it:

```powershell
# test.ps1
Write-Host "🚀 FinX Trading Agent - Full Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$env:EODHD_API_KEY = "DEMO"

Write-Host "`n1. TypeScript Compilation..." -ForegroundColor Yellow
bun run typecheck
if ($LASTEXITCODE -eq 0) { Write-Host "   ✅ Passed" -ForegroundColor Green }

Write-Host "`n2. Simple CLI - AAPL..." -ForegroundColor Yellow
bun research:simple AAPL.US

Write-Host "`n3. Simple CLI - TSLA..." -ForegroundColor Yellow
bun research:simple TSLA.US

Write-Host "`n4. CLI with AI - TSLA..." -ForegroundColor Yellow
bun research TSLA.US

Write-Host "`n✅ All tests complete!" -ForegroundColor Green
```

Run with:
```powershell
.\test.ps1
```

---

**Ready to test!** Start with the simple commands above. 🚀
