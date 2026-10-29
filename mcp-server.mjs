import readline from 'node:readline';
import { createMcpHandler } from './lib/mcp.mjs';

const handle = createMcpHandler();
const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  let message;
  try { message = JSON.parse(line); }
  catch {
    process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error.' } })}\n`);
    continue;
  }
  const response = await handle(message);
  if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
}
