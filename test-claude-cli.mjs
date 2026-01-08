/**
 * Simple test to verify Claude CLI --print mode works with stdin
 */
import { spawn } from 'child_process';

console.log('🧪 Testing Claude CLI with --print mode and stdin...\n');

const claude = spawn('claude', [
  '--print',
  '--model', 'sonnet',
  '--output-format', 'text',
  '--dangerously-skip-permissions'
]);

let output = '';
let errorOutput = '';

claude.stdout.on('data', (data) => {
  output += data.toString();
  console.log(`📥 Received ${data.length} bytes`);
});

claude.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.warn(`⚠️ stderr: ${data.toString().substring(0, 100)}`);
});

claude.on('close', (code) => {
  console.log(`\n✅ Claude CLI exited with code: ${code}`);
  console.log(`\n📊 Output (${output.length} chars):`);
  console.log(output || '(no output)');

  if (errorOutput) {
    console.log(`\n❌ Error output:`);
    console.log(errorOutput);
  }

  process.exit(code || 0);
});

claude.on('error', (error) => {
  console.error('❌ Failed to spawn:', error);
  process.exit(1);
});

// Send a simple prompt
const prompt = 'What is 2+2? Answer in one sentence.';
console.log(`📤 Sending prompt: "${prompt}"\n`);

setTimeout(() => {
  claude.stdin.write(prompt);
  claude.stdin.end();
  console.log('✅ Prompt sent, waiting for response...\n');
}, 100);

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️ Timeout after 30 seconds - killing process');
  claude.kill();
  process.exit(1);
}, 30000);
