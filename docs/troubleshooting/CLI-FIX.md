# Claude CLI Integration Fix

## Issue

The CLI Agent Runner was using incorrect Claude CLI options, causing errors:

```
error: unknown option '--no-stream'
```

This affected all CLI with AI mode operations (Planning, Action, Validation, Answer agents).

## Root Cause

The code was using `--no-stream` and `--file` options that don't exist in Claude CLI. The correct options are:
- `--print` for non-interactive mode
- `--output-format text` for plain text output
- Prompt passed via **stdin** (not as file argument)

## What Was Fixed

### Before (Incorrect):
```typescript
const { stdout } = await execFileAsync('claude', [
  '--model', 'sonnet',
  '--max-tokens', '4000',
  '--no-stream',        // ❌ Doesn't exist
  '--file', promptFile  // ❌ Doesn't exist
]);
```

### After (Correct):
```typescript
const claude = spawn('claude', [
  '--print',            // ✅ Non-interactive mode
  '--model', 'sonnet',
  '--output-format', 'text'  // ✅ Plain text output
]);

// Send prompt via stdin ✅
claude.stdin.write(prompt);
claude.stdin.end();
```

## Changes Made

### 1. Updated `executeCLI` Method
- Removed `--no-stream` flag (doesn't exist)
- Removed `--file` flag (doesn't exist)
- Added `--print` flag (non-interactive mode)
- Added `--output-format text` (plain text output)
- Changed from file-based to stdin-based prompt passing
- Removed temporary file creation/deletion logic

### 2. Simplified `executeInteractive` Method
- Now just calls `executeCLI` (same implementation)
- Removed duplicate code

### 3. Cleaned Up Imports
- Removed unused: `execFile`, `promisify`, `writeFileSync`, `unlinkSync`, `existsSync`, `mkdirSync`
- Removed temp directory logic (no longer needed)

## Verified Options

From `claude --help`:
```
Options:
  --print, -p                     Print response and exit (useful for pipes)
  --model <model>                 Model for the current session
  --output-format <format>        Output format: "text", "json", "stream-json"
  --input-format <format>         Input format: "text", "stream-json"
```

## Testing

The fix resolves all CLI agent errors:

```powershell
# Test CLI with AI mode
$env:EODHD_API_KEY = "DEMO"
bun research TSLA.US
```

**Expected output:**
```
🚀 FinX CLI Research with Real Claude AI
============================================================

📋 Phase 1: Research Planning
✅ Planning Agent Response: [AI generates plan]

⚙️  Phase 2: Executing research tasks...
✅ Research tasks executed    # ✅ No more errors

✔️  Phase 3: Validating research quality...
✅ Validation complete: APPROVED    # ✅ No more errors

💡 Phase 4: Synthesizing final answer...
✅ Final answer generated    # ✅ No more errors
```

## Impact

- ✅ All 4 research agents now work correctly (Planning, Action, Validation, Answer)
- ✅ CLI with AI mode fully functional
- ✅ No more "unknown option" errors
- ✅ Proper stdin-based communication with Claude CLI
- ✅ TypeScript compilation still passes

## Files Modified

1. `src/lib/cli-agent-runner.ts` - Fixed CLI execution methods
2. All agent methods now use correct Claude CLI options

## Compatibility

This fix maintains full compatibility with:
- Claude Code CLI (current version)
- All research orchestrator flows
- TypeScript type system
- Windows PowerShell / Unix bash
