import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createMcpHandler } from '../lib/mcp.mjs';

const request = (id, method, params = {}) => ({ jsonrpc: '2.0', id, method, params });
const initialized = { jsonrpc: '2.0', method: 'notifications/initialized' };
const idA = '310B7767-EF7D-49E9-ACC3-965FF6B77489';
const idB = '1827EC82-C113-42A9-B242-D6B80A27A4B9';

async function ready(handler) {
  await handler(request(1, 'initialize', { protocolVersion: '2025-06-18' }));
  await handler(initialized);
}

test('MCP negotiates initialization and exposes two read-only tools', async () => {
  const handle = createMcpHandler({ fetchImpl: () => { throw new Error('network must not run'); } });
  assert.equal((await handle(request(0, 'tools/list'))).error.code, -32002);
  const init = await handle(request(1, 'initialize'));
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.deepEqual(init.result.capabilities.tools, {});
  assert.equal(await handle(initialized), null);
  const listed = await handle(request(2, 'tools/list'));
  assert.deepEqual(listed.result.tools.map(tool => tool.name), ['search_artist', 'compare_cultural_references']);
  assert.ok(listed.result.tools.every(tool => tool.annotations.readOnlyHint));
});

test('MCP calls only the fixed demo with properly encoded public search and comparison', async () => {
  const seen = [];
  const handle = createMcpHandler({ fetchImpl: async url => {
    seen.push(url);
    return { ok: true, json: async () => ({ source: 'fixture' }) };
  } });
  await ready(handle);
  const search = await handle(request(3, 'tools/call', { name: 'search_artist', arguments: { name: 'Cesária Évora' } }));
  assert.equal(JSON.parse(search.result.content[0].text).source, 'fixture');
  assert.equal(seen[0].origin, 'https://dua-cultural-signals-qloo.vercel.app');
  assert.equal(seen[0].pathname, '/api/search');
  assert.equal(seen[0].searchParams.get('name'), 'Cesária Évora');
  await handle(request(4, 'tools/call', { name: 'compare_cultural_references', arguments: { idA, nameA: 'Cesária Évora', idB, nameB: 'Ibrahim Ferrer', goal: 'showcase' } }));
  assert.equal(seen[1].pathname, '/api/bridge');
  assert.equal(seen[1].searchParams.get('idB'), idB);
  assert.equal(seen[1].searchParams.get('goal'), 'showcase');
});

test('MCP rejects invalid or extra inputs and reports failures without inventing results', async () => {
  let count = 0;
  const handle = createMcpHandler({ fetchImpl: async () => { count++; return { ok: false, json: async () => ({ error: 'Provider unavailable.' }) }; } });
  await ready(handle);
  const invalid = await handle(request(3, 'tools/call', { name: 'compare_cultural_references', arguments: { idA, nameA: 'Artist', idB: idA, nameB: 'Artist', goal: 'showcase' } }));
  assert.equal(invalid.error.code, -32602);
  const extra = await handle(request(4, 'tools/call', { name: 'search_artist', arguments: { name: 'Artist', note: 'private' } }));
  assert.equal(extra.error.code, -32602);
  assert.equal(count, 0);
  const unavailable = await handle(request(5, 'tools/call', { name: 'search_artist', arguments: { name: 'Artist' } }));
  assert.equal(unavailable.result.isError, true);
  assert.equal(unavailable.result.content[0].text, 'Provider unavailable.');
});

test('MCP stdio emits newline-delimited JSON-RPC without non-protocol output', async () => {
  const child = spawn(process.execPath, ['mcp-server.mjs'], { cwd: new URL('..', import.meta.url), stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => { output += chunk; });
  child.stdin.end([request(1, 'initialize'), initialized, request(2, 'tools/list')].map(item => JSON.stringify(item)).join('\n') + '\n');
  const code = await new Promise(resolve => child.on('close', resolve));
  assert.equal(code, 0);
  const messages = output.trim().split('\n').map(JSON.parse);
  assert.equal(messages.length, 2);
  assert.equal(messages[0].result.protocolVersion, '2025-06-18');
  assert.equal(messages[1].result.tools.length, 2);
});
