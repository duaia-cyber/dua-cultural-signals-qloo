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
