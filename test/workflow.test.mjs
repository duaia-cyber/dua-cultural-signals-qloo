import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findExactArtist, createOutline, createBriefText, projectSteps, projectContext, researchStages, selectionInsight } from '../public/workflow.mjs';

test('example requires one exact, unambiguous identity and never guesses another artist', () => {
  const one = { id: 'abc', name: 'Cesária Évora' };
  assert.equal(findExactArtist([one, { id: 'def', name: 'Other' }], 'Cesária Évora'), one);
  assert.equal(findExactArtist([one], 'Cesaria Evora'), null);
  assert.equal(findExactArtist([one, { ...one, id: 'different' }], 'Cesária Évora'), null);
  assert.equal(findExactArtist([], 'Cesária Évora'), null);
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

test('bridge export includes the note, curated provenance, trace and working outline', () => {
  const brief = {
    references: ['Artist A', 'Artist B'], goal: 'showcase', method: 'Limited Qloo sample.', actions: ['Review context.'],
    artists: { direct: [{ from: 'Artist A', to: 'Artist B' }], common: [{ name: 'Shared artist' }] },
    films: { common: [] }, exploration: { status: 'not_found', attempts: [{ status: 'not_found', anchor: 'Candidate' }] },
  };
  const selected = [{ name: 'Shared artist', category: 'artists', provenance: 'Returned for both', scope: 'common' }];
  const output = createBriefText(brief, 'bridge', selected, '  My event  ');
  assert.match(output, /## Your project note\nMy event/);
  assert.match(output, /Shared artist \(artists; Returned for both\)/);
  assert.match(output, /The tool checked Candidate/);
  assert.match(output, /## Working outline/);
  assert.match(output, /Human review checklist/);
  assert.match(output, /not confirmed collaborations/);
});

test('single-reference export is honest when the user selected nothing', () => {
  const brief = { reference: 'Artist A', goal: 'campaign', source: 'Qloo sample.', actions: ['Review rights.'], artists: [{ name: 'Reference' }], films: [] };
  const output = createBriefText(brief, 'single', [], '');
  assert.match(output, /No references selected/);
  assert.match(output, /Qloo music references\n- Reference/);
  assert.doesNotMatch(output, /## Your project note/);
  assert.equal(createBriefText(null, 'single', [], ''), '');
});

 test('project plans distinguish real creative jobs without implying bookings', () => {
 const selected = [{name: 'Reference', category: 'artists'}];
 assert.match(projectSteps('showcase', selected).join(' '), /not proposed bookings/);
 assert.match(projectSteps('collaboration', selected).join(' '), /ownership/);
 assert.match(projectSteps('campaign', selected).join(' '), /call to action/);
 assert.match(projectSteps('campaign', []).join(' '), /select at least one/);
 });
 test('local project context omits blank fields and is included in export', () => {
 const note = projectContext('Brief', 'Creators', '', 'Small team');
 assert.equal(note, 'Brief\nAudience: Creators\nPractical limit: Small team');
 const brief = {reference:'Artist', goal:'campaign', source:'Sample', actions:[], artists:[], films:[]};
 assert.ok(createBriefText(brief, 'single', [], note).includes(note));
 });


test('research outcomes distinguish unavailable exploration from an empty sample', () => {
  assert.match(researchStages({ exploration: {status: 'unavailable'} }, 'bridge')[2], /unavailable/);
  assert.match(researchStages({ exploration: {status: 'not_found'} }, 'bridge')[2], /no shared result/);
  assert.equal(researchStages({}, 'bridge')[2], 'Review returned references');
  assert.equal(researchStages({artists:{common:[{}]}}, 'bridge')[2], 'Shared references found');
});
test('creative prompts remain separate from shared evidence and never imply bookings', () => {
  assert.match(selectionInsight('films','common').evidence, /both/);
  assert.match(selectionInsight('artists','onlyA').prompt, /not a booking/);
  assert.match(selectionInsight('films','onlyB').prompt, /Verify/);
});
