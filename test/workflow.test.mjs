import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findExactArtist, communitySearchUrl, createOutline } from '../public/workflow.mjs';

test('example requires one exact, unambiguous identity and never guesses another artist', () => {
  const one = { id: 'abc', name: 'Cesária Évora' };
  assert.equal(findExactArtist([one, { id: 'def', name: 'Other' }], 'Cesária Évora'), one);
  assert.equal(findExactArtist([one], 'Cesaria Evora'), null);
  assert.equal(findExactArtist([one, { ...one, id: 'different' }], 'Cesária Évora'), null);
  assert.equal(findExactArtist([], 'Cesária Évora'), null);
});

test('community handoff sends only the selected name as a URL-encoded search query', () => {
  const url = new URL(communitySearchUrl('A & B / Artista'));
  assert.equal(url.origin, 'https://dua.2lados.pt');
  assert.equal(url.pathname, '/feed');
  assert.equal(url.searchParams.get('tab'), 'discover');
  assert.equal(url.searchParams.get('q'), 'A & B / Artista');
  assert.deepEqual([...url.searchParams.keys()], ['tab', 'q']);
});

test('outline describes only user-selected references and prompts when none are selected', () => {
  const brief = { references: ['Artist A', 'Artist B'], goal: 'showcase' };
  const empty = createOutline(brief, 'bridge', []);
  assert.match(empty.join(' '), /select a common reference/i);
  const outline = createOutline(brief, 'bridge', [{ name: 'Chosen shared', scope: 'common' }, { name: 'Chosen A', scope: 'onlyA' }]);
  assert.match(outline.join(' '), /Chosen shared/);
  assert.match(outline.join(' '), /Artist A — Chosen A/);
  assert.doesNotMatch(outline.join(' '), /Chosen B/);
});
