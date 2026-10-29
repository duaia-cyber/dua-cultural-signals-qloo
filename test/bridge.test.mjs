import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBridge } from '../lib/bridge.mjs';
import { createHandler } from '../lib/handler.mjs';

const A = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Artist A' };
const B = { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Artist B' };
const shared = { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Shared work' };
const uniqueA = { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Only in A sample' };
const uniqueB = { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'Only in B sample' };

function call(handler, params) {
  return new Promise((resolve, reject) => {
    const res = { statusCode: 200, setHeader() {}, end(body) { resolve({ status: this.statusCode, body: JSON.parse(body) }); } };
    Promise.resolve(handler({ method: 'GET', url: '/api/bridge?' + new URLSearchParams(params), socket: { remoteAddress: Math.random().toString() } }, res)).catch(reject);
  });
}
const params = { nameA: A.name, idA: A.id, nameB: B.name, idB: B.id, goal: 'showcase' };

test('bridge compares canonical IDs, explains direct signals and preserves unique results', () => {
  const result = buildBridge(A, B, 'showcase', [B, shared, uniqueA], [{ ...shared, id: shared.id.toUpperCase() }, uniqueB], [], []);
  assert.deepEqual(result.artists.common.map(item => item.name), ['Shared work']);
  assert.deepEqual(result.artists.onlyA.map(item => item.name), ['Only in A sample']);
  assert.deepEqual(result.artists.onlyB.map(item => item.name), ['Only in B sample']);
  assert.deepEqual(result.artists.direct, [{ from: 'Artist A', to: 'Artist B', rank: 1 }]);
  assert.equal(result.artists.sampleA, 3);
  assert.equal(result.films.common.length, 0);
});

test('empty lists and equal names with different IDs do not create fake shared entities', () => {
  const result = buildBridge(A, B, 'campaign', [uniqueA], [{ ...uniqueB, name: uniqueA.name }], [], []);
  assert.equal(result.artists.common.length, 0);
  assert.equal(result.artists.onlyA.length, 1);
  assert.equal(result.artists.onlyB.length, 1);
  assert.equal(result.films.common.length, 0);
});

test('bridge endpoint verifies both identities and queries each source and domain once', async () => {
  const calls = [];
  const client = {
    search: async name => name === A.name ? [A] : name === B.name ? [B] : [],
    insights: async (id, domain) => { calls.push([id, domain]); return domain === 'artists' ? [shared] : []; },
  };
  const response = await call(createHandler({ client }), params);
  assert.equal(response.status, 200);
  assert.equal(response.body.artists.common[0].name, 'Shared work');
  assert.equal(calls.length, 4);
  assert.deepEqual(new Set(calls.map(([id, domain]) => id + domain)), new Set([A.id+'artists', B.id+'artists', A.id+'films', B.id+'films']));
});

test('bridge rejects duplicate or unverified reference without fetching insights', async () => {
  let insights = 0;
  const client = { search: async () => [A], insights: async () => { insights++; return []; } };
  const handler = createHandler({ client });
  assert.equal((await call(handler, { ...params, idB: A.id.toUpperCase() })).status, 400);
  assert.equal((await call(handler, params)).status, 400);
  assert.equal(insights, 0);
});

test('provider failures do not produce a partially fabricated bridge', async () => {
  const client = { search: async name => name === A.name ? [A] : [B], insights: async (_, domain) => { if (domain === 'films') throw new Error('unavailable'); return [shared]; } };
  const response = await call(createHandler({ client }), params);
  assert.equal(response.status, 500);
  assert.equal(response.body.artists, undefined);
});
