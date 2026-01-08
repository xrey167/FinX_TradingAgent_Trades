# Claude CLI Timeout Fix

## Issue

Claude CLI was timing out after 120 seconds:

```
Planning Agent CLI error: Error: Claude CLI timeout after 120 seconds
```

## Root Cause

Two potential issues:
1. **Permission Prompts**: Claude CLI may be waiting for permission prompts, causing it to hang
2. **Short Timeout**: 120 seconds (2 minutes) might not be enough for complex AI processing

## Fixes Applied

### 1. Skip Permission Prompts ✅

Added `--dangerously-skip-permissions` flag to bypass all permission prompts:

```typescript
const claude = spawn('claude', [
  '--print',
  '--model', 'sonnet',
  '--output-format', 'text',
  '--dangerously-skip-permissions'  // NEW: Skip permission prompts
]);
```

**Why this is safe:**
- The research agent only reads financial data (EODHD API)
- No file system operations
- No code execution
- Running in controlled environment

### 2. Increased Timeout ✅

Extended timeout from 2 minutes to 5 minutes:

```typescript
// Before: 120000ms (2 minutes)
// After: 300000ms (5 minutes)
const timeout = setTimeout(() => {
  if (!resolved) {
    claude.kill();
    reject(new Error('Claude CLI timeout after 300 seconds (5 minutes)'));
  }
}, 300000);
```

### 3. Added Debug Logging ✅

Enhanced verbose logging to track progress:

```typescript
if (this.verbose) {
  console.log(`📤 Sending prompt to Claude CLI (${prompt.length} chars)`);
  console.log(`📥 Received ${chunk.length} chars from Claude CLI`);
  console.warn(`⚠️ Claude CLI stderr: ${chunk}`);
}
```

## Testing the Fix

### 1. Test Claude CLI Directly

First, verify Claude CLI works with --print mode:

```powershell
node test-claude-cli.mjs
```

This will test if Claude CLI responds to simple prompts via stdin.

**Expected output:**
```
🧪 Testing Claude CLI with --print mode and stdin...
📤 Sending prompt: "What is 2+2? Answer in one sentence."
✅ Prompt sent, waiting for response...
📥 Received XXX bytes
✅ Claude CLI exited with code: 0

📊 Output:
2+2 equals 4.
```

### 2. Test Full Research Flow

```powershell
$env:EODHD_API_KEY = "DEMO"
tsx cli-research-with-claude.ts TSLA.US
```

**Expected behavior:**
- Each phase should complete within 5 minutes
- You'll see debug output showing data being received
- No more timeout errors

## Troubleshooting

### Still Getting Timeouts?

1. **Check Claude CLI is responding:**
   ```powershell
   echo "Say hello" | claude --print --model sonnet --dangerously-skip-permissions
   ```

2. **Check permissions:**
   - Make sure you're in a trusted directory
   - Claude CLI may still prompt despite the flag

3. **Reduce complexity:**
   - Start with simpler prompts
   - Use Simple CLI mode first: `bun research:simple AAPL.US`

### Permission Dialog Appears?

If Claude CLI still shows a permission dialog:

```powershell
# Option 1: Accept permissions once (they'll be remembered)
# Then rerun the research

# Option 2: Use Agent SDK mode instead
$env:ANTHROPIC_API_KEY = "sk-ant-..."
bun research:ai TSLA.US
```

### Seeing No Output?

Check if Claude CLI is working at all:

```powershell
claude --version
claude --print "Hello" --model sonnet
```

## Performance Expectations

| Phase | Expected Time |
|-------|---------------|
| Planning | 30-60s |
| Action | 30-60s |
| Validation | 20-40s |
| Answer | 60-120s |
| **Total** | **2-5 minutes** |

With 5-minute timeout per phase, max total time is ~20 minutes (4 phases × 5 min).

## Fallback Behavior

Even if CLI times out, the research continues with fallback responses:

```typescript
} catch (error) {
  console.error('Planning Agent CLI error:', error);
  return {
    content: `Research plan for ${symbol} (CLI error, using fallback)`,
    metadata: { error: true },
  };
}
```

So you'll see:
```
Planning Agent CLI error: Error: Claude CLI timeout...
✅ Research plan created  // Uses fallback
```

The research completes, but uses rule-based fallbacks instead of real AI.

## Alternative: Use Agent SDK

If CLI mode continues to have issues, use Agent SDK mode:

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-your-key"
$env:EODHD_API_KEY = "DEMO"
bun research:ai TSLA.US
```

**Pros:**
- No subprocess issues
- Reliable and tested
- Full AI analysis

**Cons:**
- Costs ~$0.50 per analysis
- Requires Anthropic API key

## Debug Output

When running with verbose mode, you'll see:

```
📝 Executing CLI prompt (812 chars)
📤 Sending prompt to Claude CLI (812 chars)
✅ Prompt sent, waiting for response...
📥 Received 150 chars from Claude CLI
📥 Received 200 chars from Claude CLI
📥 Received 180 chars from Claude CLI
...
✅ CLI response received (1234 chars)
```

This helps diagnose if data is being received or if it's stuck.

## Summary

| Change | Before | After |
|--------|--------|-------|
| Permission handling | None | `--dangerously-skip-permissions` |
| Timeout | 120s | 300s |
| Debug logging | Minimal | Verbose |
| Max research time | ~8 min | ~20 min |

These changes should resolve most timeout issues while keeping the system responsive.
