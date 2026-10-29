import { findExactArtist, communitySearchUrl, createOutline, describeExploration, createBriefText } from './workflow.mjs';

const $ = selector => document.querySelector(selector);
const state = { selected: null, second: null, brief: null, mode: 'single', shortlist: new Map() };
let operation = 0;
const searchStatus = $('#search-status');
const matches = $('#matches');
const selection = $('#selection');
const results = $('#results');

async function request(path, params) {
  const url = new URL(path, location.origin);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  let data;
  try { data = await response.json(); } catch { throw new Error('The service returned an unreadable response.'); }
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

function invalidateBrief() {
  state.brief = null;
  state.shortlist.clear();
  results.hidden = true;
}

function renderMatches(container, data, onSelect, selectedId = '') {
  container.replaceChildren();
  for (const match of data) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'match'; button.setAttribute('aria-pressed', String(match.id.toLowerCase() === selectedId.toLowerCase()));
    const details = document.createElement('span');
    const name = document.createElement('strong'); name.textContent = match.name; details.append(name);
    if (match.disambiguation && match.disambiguation.toLowerCase() !== match.name.toLowerCase()) {
      const small = document.createElement('small'); small.textContent = match.disambiguation; details.append(small);
    }
    const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
    button.append(details, arrow);
    button.addEventListener('click', () => {
      operation++; invalidateBrief();
      for (const sibling of container.querySelectorAll('button')) sibling.setAttribute('aria-pressed', String(sibling === button));
      onSelect(match);
    });
    container.append(button);
  }
}

function choosePrimary(match) {
  state.selected = match; state.second = null;
  $('#matches2').replaceChildren(); $('#search-status2').textContent = '';
  selection.hidden = false; searchStatus.textContent = 'First reference selected.';
}

function chooseSecond(match) {
  if (!state.selected || match.id.toLowerCase() === state.selected.id.toLowerCase()) {
    state.second = null; $('#matches2').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', 'false'));
    $('#search-status2').textContent = 'Choose a different artist for the second reference.'; return;
  }
  state.second = match; $('#search-status2').textContent = 'Second reference selected.';
}

$('#search-form').addEventListener('submit', async event => {
  event.preventDefault();
  const requestId = ++operation;
  state.selected = null; state.second = null; invalidateBrief();
  matches.replaceChildren(); $('#matches2').replaceChildren(); $('#search-status2').textContent = '';
  selection.hidden = true; searchStatus.textContent = 'Searching Qloo…'; $('#search-button').disabled = true;
  try {
    const data = await request('/api/search', { name: $('#artist').value });
    if (requestId !== operation) return;
    if (!data.matches?.length) { searchStatus.textContent = 'No matches found. Try another spelling or reference.'; return; }
    searchStatus.textContent = 'Choose the correct match:';
    renderMatches(matches, data.matches, choosePrimary);
  } catch (error) { if (requestId === operation) searchStatus.textContent = error.message; }
  finally { $('#search-button').disabled = false; }
});

$('#artist').addEventListener('input', () => {
  operation++; state.selected = null; state.second = null; invalidateBrief();
  matches.replaceChildren(); selection.hidden = true; searchStatus.textContent = $('#artist').value ? 'Search to verify this reference.' : '';
});

$('#bridge-toggle').addEventListener('change', event => {
  operation++; invalidateBrief();
  $('#bridge-box').hidden = !event.target.checked;
  $('#search-status2').textContent = '';
});

async function searchSecond() {
  const field = $('#artist2');
  if (!field.reportValidity()) return;
  const requestId = ++operation;
  state.second = null; invalidateBrief(); $('#matches2').replaceChildren();
  $('#search-status2').textContent = 'Searching Qloo…'; $('#search2').disabled = true;
  try {
    const data = await request('/api/search', { name: field.value });
    if (requestId !== operation) return;
    if (!data.matches?.length) { $('#search-status2').textContent = 'No matches found. Try another spelling or reference.'; return; }
    $('#search-status2').textContent = 'Choose the correct second match:';
    renderMatches($('#matches2'), data.matches, chooseSecond);
  } catch (error) { if (requestId === operation) $('#search-status2').textContent = error.message; }
  finally { $('#search2').disabled = false; }
}
$('#search2').addEventListener('click', searchSecond);
$('#artist2').addEventListener('input', () => {
  operation++; state.second = null; invalidateBrief();
  $('#matches2').replaceChildren(); $('#search-status2').textContent = $('#artist2').value ? 'Search to verify this reference.' : '';
});
$('#artist2').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); searchSecond(); } });
$('#goal').addEventListener('change', () => {
  if (!state.brief) return;
  operation++; invalidateBrief(); searchStatus.textContent = 'Build the brief again to apply the new goal.';
});

function renderItems(container, items, category, provenance, emptyText, scope = 'single') {
  container.replaceChildren();
  if (!items.length) {
    const p = document.createElement('p'); p.className = 'empty'; p.textContent = emptyText || 'No ' + category + ' returned in this sample.'; container.append(p); return;
  }
  items.forEach((item, index) => {
    const row = document.createElement('article'); row.className = 'entry';
    const number = document.createElement('span'); number.className = 'entry-number'; number.textContent = String(index + 1).padStart(2, '0');
    const content = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = item.name; content.append(title);
    const details = [item.disambiguation?.toLowerCase() === item.name.toLowerCase() ? '' : item.disambiguation, ...(item.tags || [])].filter(Boolean).join(' · ');
    if (details) { const p = document.createElement('p'); p.textContent = details; content.append(p); }
    const add = document.createElement('button'); add.type = 'button'; add.className = 'add-reference'; add.textContent = '+';
    const key = category + ':' + item.id.toLowerCase();
    add.setAttribute('aria-label', 'Add ' + item.name + ' to brief'); add.setAttribute('aria-pressed', 'false');
    add.addEventListener('click', () => {
      if (state.shortlist.has(key)) state.shortlist.delete(key);
      else state.shortlist.set(key, { ...item, category, provenance, scope });
      updateShortlist();
    });
    add.dataset.entity = key; add.dataset.name = item.name; row.append(number, content, add); container.append(row);
  });
}

function renderBridge(data) {
  const [a, b] = data.references;
  $('#reference-name').textContent = a + ' × ' + b;
  $('#result-source').textContent = data.method;
  const direct = data.artists.direct;
  $('#bridge-direct').textContent = direct.length
    ? direct.map(link => 'Qloo’s returned artist results for ' + link.from + ' include ' + link.to + '.').join(' ')
    : 'Neither artist appeared in the other artist’s returned music sample.';
  const count = data.artists.common.length + data.films.common.length;
  $('#bridge-common-status').textContent = count
    ? count + (count === 1 ? ' entity appears in both returned samples.' : ' entities appear in both returned samples.')
    : 'No shared entities were found in these returned samples. Try another pair to explore further.';
  $('#trace-description').textContent = describeExploration(data);
  $('#source-a-name').textContent = a; $('#source-b-name').textContent = b;
  renderItems($('#common-artists'), data.artists.common, 'artists', 'Returned for both ' + a + ' and ' + b, 'No common artists in the returned samples.', 'common');
  renderItems($('#common-films'), data.films.common, 'films', 'Returned for both ' + a + ' and ' + b, 'No common films in the returned samples.', 'common');
  renderItems($('#only-a-artists'), data.artists.onlyA, 'artists', 'Returned for ' + a, 'No additional artists in this sample.', 'onlyA');
  renderItems($('#only-a-films'), data.films.onlyA, 'films', 'Returned for ' + a, 'No additional films in this sample.', 'onlyA');
  renderItems($('#only-b-artists'), data.artists.onlyB, 'artists', 'Returned for ' + b, 'No additional artists in this sample.', 'onlyB');
  renderItems($('#only-b-films'), data.films.onlyB, 'films', 'Returned for ' + b, 'No additional films in this sample.', 'onlyB');
  $('#single-view').hidden = true; $('#bridge-view').hidden = false;
}


function renderSingle(data) {
  $('#reference-name').textContent = data.reference; $('#result-source').textContent = data.source;
  renderItems($('#artists'), data.artists, 'artists', 'Returned for ' + data.reference);
  renderItems($('#films'), data.films, 'films', 'Returned for ' + data.reference);
  $('#single-view').hidden = false; $('#bridge-view').hidden = true;
}

async function buildResearchBrief() {
  if (!state.selected) return;
  const isBridge = $('#bridge-toggle').checked;
  if (isBridge && !state.second) { $('#search-status2').textContent = 'Search and select a different second artist, or turn off comparison.'; $('#artist2').focus(); return; }
  const requestId = ++operation;
  const button = $('#build'); button.disabled = true; searchStatus.textContent = isBridge ? 'Comparing music and film references with Qloo…' : 'Exploring Qloo cultural signals…';
  try {
    const data = isBridge
      ? await request('/api/bridge', { idA: state.selected.id, nameA: state.selected.name, idB: state.second.id, nameB: state.second.name, goal: $('#goal').value })
      : await request('/api/brief', { id: state.selected.id, name: state.selected.name, goal: $('#goal').value });
    if (requestId !== operation) return;
    state.brief = data; state.mode = isBridge ? 'bridge' : 'single'; state.shortlist.clear();
    if (isBridge) renderBridge(data); else renderSingle(data);
    updateShortlist();
    const list = $('#actions'); list.replaceChildren();
    for (const action of data.actions) { const li = document.createElement('li'); li.textContent = action; list.append(li); }
    searchStatus.textContent = ''; results.hidden = false;
    results.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  } catch (error) { if (requestId === operation) searchStatus.textContent = error.message; }
  finally { button.disabled = false; }
}
$('#build').addEventListener('click', buildResearchBrief);

$('#try-example').addEventListener('click', async () => {
  const requestId = ++operation;
  const button = $('#try-example'); button.disabled = true;
  state.selected = null; state.second = null; invalidateBrief();
  matches.replaceChildren(); $('#matches2').replaceChildren(); selection.hidden = true;
  searchStatus.textContent = 'Finding the two example artists in Qloo…';
  try {
    const [firstData, secondData] = await Promise.all([
      request('/api/search', { name: 'Cesária Évora' }), request('/api/search', { name: 'Ibrahim Ferrer' }),
    ]);
    if (requestId !== operation) return;
    const first = findExactArtist(firstData.matches, 'Cesária Évora');
    const second = findExactArtist(secondData.matches, 'Ibrahim Ferrer');
    if (!first || !second || first.id.toLowerCase() === second.id.toLowerCase()) {
      searchStatus.textContent = 'The example identities could not be verified. Search and select artists manually.'; return;
    }
    state.selected = first; state.second = second;
    $('#artist').value = first.name; $('#artist2').value = second.name;
    $('#bridge-toggle').checked = true; $('#bridge-box').hidden = false; $('#goal').value = 'showcase'; selection.hidden = false;
    renderMatches(matches, firstData.matches, choosePrimary, first.id);
    renderMatches($('#matches2'), secondData.matches, chooseSecond, second.id);
    $('#search-status2').textContent = 'Second reference selected.';
    await buildResearchBrief();
  } catch (error) { if (requestId === operation) searchStatus.textContent = error.message; }
  finally { button.disabled = false; }
});

function updateShortlist() {
  const list = $('#shortlist'); list.replaceChildren();
  for (const [key, item] of state.shortlist) {
    const li = document.createElement('li'); const label = document.createElement('span');
    label.textContent = item.name + ' · ' + item.category + ' · ' + item.provenance;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove ' + item.name + ' from brief');
    remove.addEventListener('click', () => { state.shortlist.delete(key); updateShortlist(); });
    const search = document.createElement('a'); search.href = communitySearchUrl(item.name); search.target = '_blank'; search.rel = 'noopener noreferrer';
    search.textContent = 'Search Community'; search.className = 'community-search';
    search.setAttribute('aria-label', 'Search DUA Community for ' + item.name);
    const controls = document.createElement('div'); controls.className = 'shortlist-controls'; controls.append(search, remove);
    li.append(label, controls); list.append(li);
  }
  $('#shortlist-count').textContent = state.shortlist.size ? state.shortlist.size + (state.shortlist.size === 1 ? ' reference selected for your brief.' : ' references selected for your brief.') : 'No references selected yet. Use + beside any result.';
  for (const button of document.querySelectorAll('[data-entity]')) {
    const selected = state.shortlist.has(button.dataset.entity);
    button.setAttribute('aria-pressed', String(selected)); button.textContent = selected ? '✓' : '+';
    button.setAttribute('aria-label', (selected ? 'Remove ' : 'Add ') + button.dataset.name + (selected ? ' from brief' : ' to brief'));
  }
  $('#copy-status').textContent = '';
  const outline = $('#creative-outline'); outline.replaceChildren();
  for (const line of createOutline(state.brief, state.mode, [...state.shortlist.values()])) { const li = document.createElement('li'); li.textContent = line; outline.append(li); }
}

function briefText() {
  return createBriefText(state.brief, state.mode, [...state.shortlist.values()], $('#project-note').value);
}

$('#copy').addEventListener('click', async () => {
  if (!state.brief) return;
  try { await navigator.clipboard.writeText(briefText()); $('#copy-status').textContent = 'Brief copied. Ready to review with your team.'; }
  catch { $('#copy-status').textContent = 'Clipboard unavailable. Use Download .md instead.'; }
});
$('#download').addEventListener('click', () => {
  if (!state.brief) return;
  const url = URL.createObjectURL(new Blob([briefText()], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'DUA-cultural-brief.md'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); $('#copy-status').textContent = 'Markdown download started.';
});
