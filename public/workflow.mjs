// Browser-side helpers: no private data is sent anywhere by these functions.
export function findExactArtist(items, name) {
  const normalize = value => String(value).normalize('NFC').trim().toLocaleLowerCase('en');
  const unique = new Map();
  for (const item of items || []) {
    if (typeof item?.id === 'string' && typeof item?.name === 'string' && normalize(item.name) === normalize(name)) unique.set(item.id.toLowerCase(), item);
  }
  return unique.size === 1 ? [...unique.values()][0] : null;
}

export function communitySearchUrl(name) {
  const url = new URL('https://dua.2lados.pt/feed');
  url.searchParams.set('tab', 'discover');
  url.searchParams.set('q', String(name).trim().slice(0, 120));
  return url.toString();
}

export function createOutline(brief, mode, selected) {
  if (!brief) return [];
  const goal = { showcase: 'live showcase', collaboration: 'creative collaboration', campaign: 'cultural campaign' }[brief.goal] || 'creative project';
  const names = scope => selected.filter(item => item.scope === scope).map(item => item.name).join(', ');
  if (mode !== 'bridge') return [
    'Starting point for a ' + goal + ': ' + brief.reference + '.',
    selected.length ? 'Selected research references: ' + selected.map(item => item.name).join(', ') + '.' : 'Select a music or film reference to develop your idea.',
    'Discuss context with people, and independently verify rights and practical arrangements.',
  ];
  const [a, b] = brief.references;
  const common = names('common'); const first = names('onlyA'); const second = names('onlyB');
  return [
    'Starting point for a ' + goal + ': ' + a + ' × ' + b + '.',
    common ? 'Shared research references selected: ' + common + '.' : 'Shared thread: select a common reference if available, or develop the connection through further research.',
    (first || second) ? 'Additional perspectives: ' + [first ? a + ' — ' + first : '', second ? b + ' — ' + second : ''].filter(Boolean).join('; ') + '.' : 'Select source-specific references to develop each perspective.',
    'Discuss context with people, and independently verify rights and practical arrangements.',
  ];
}

export function describeExploration(data) {
  const extra = data.exploration;
  const [a, b] = data.references;
  if (!extra || extra.status === 'not_needed') return 'The tool checked music and film results for each artist and found shared entities. No additional search was needed.';
  if (extra.status === 'no_candidate') return 'The initial samples had no shared entities and returned no additional first-reference artist to explore.';
  const attempts = extra.attempts || [extra];
  const checked = attempts.filter(item => item.status !== 'unavailable').map(item => item.anchor).join(', ');
  if (extra.status === 'unavailable') return 'The initial samples had no shared entities. ' + (checked ? 'The tool checked ' + checked + '. ' : '') + 'An additional lookup for ' + extra.anchor + ', returned for ' + a + ', could not be completed. The initial comparison remains available.';
  if (extra.status === 'not_found') return 'The initial samples had no shared entities. The tool checked ' + checked + ', returned for ' + a + ', but found no shared artist with ' + b + ' in those limited samples.';
  return 'The initial samples had no shared entities. ' + (attempts.length > 1 ? 'After checking ' + attempts[0].anchor + ', the tool explored ' : 'The tool explored ') + extra.anchor + ', returned for ' + a + '. Qloo’s returned artist samples for ' + extra.anchor + ' and ' + b + ' both include ' + extra.matches.map(x => x.name).join(', ') + '. This is a research path, not evidence of a personal relationship.';
}


export function createBriefText(b, mode, selected, note) {
  if (!b) return '';
  note = String(note || '').trim();
  const lines = ['# DUA Cultural Signals', '', 'Reference: ' + (mode === 'bridge' ? b.references.join(' × ') : b.reference), 'Goal: ' + b.goal, ...(note ? ['', '## Your project note', note] : []), '', '## Curated references', ...(selected.length ? selected.map(x => '- ' + x.name + ' (' + x.category + '; ' + x.provenance + ')') : ['No references selected.']), ''];
  if (mode === 'bridge') {
    lines.push('## Direct connections within returned artist samples', ...(b.artists.direct.length ? b.artists.direct.map(x => '- Qloo’s results for ' + x.from + ' include ' + x.to + '.') : ['No direct reference appeared in the returned samples.']), '', '## Shared references', ...(['artists', 'films'].flatMap(category => b[category].common.map(item => '- ' + item.name + ' (' + category + '; returned for both references)'))));
    if (!b.artists.common.length && !b.films.common.length) lines.push('No shared entities in these returned samples.');
    lines.push('', '## Research method and limits', b.method, 'Source-specific items appear only in the returned sample for that source. Absence does not mean no relationship exists.');
    lines.push('', '## Additional research step', describeExploration(b));
  } else {
    lines.push('## Qloo music references', ...b.artists.map(x => '- ' + x.name), '', '## Qloo film references', ...b.films.map(x => '- ' + x.name), '', '## Research method and limits', b.source);
  }
  lines.push('', '## Working outline', ...createOutline(b, mode, selected).map(x => '- ' + x), '', '## Human review checklist', ...b.actions.map(x => '- ' + x), '', 'These are cultural research references, not confirmed collaborations, available performers, audience demand or rights clearances.', 'Tool: https://dua-cultural-signals-qloo.vercel.app');
  return lines.join('\n');
}
