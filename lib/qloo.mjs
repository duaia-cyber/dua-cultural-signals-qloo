const DEFAULT_BASE = 'https://hackathon.api.qloo.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OUTPUTS = Object.freeze({ artists: 'urn:entity:artist', films: 'urn:entity:movie' });

export class PublicError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function validateName(input) {
  if (typeof input !== 'string') throw new PublicError(400, 'Enter the name of an artist.');
  const name = input.trim();
  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f]/.test(name)) {
    throw new PublicError(400, 'Use an artist name between 2 and 100 characters.');
  }
  return name;
}

function entitiesFrom(payload) {
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.results?.entities)) return payload.results.entities;
  throw new PublicError(502, 'Qloo returned an unexpected response. Please try again later.');
}

function cleanEntity(item) {
  const id = item?.entity_id ?? item?.id;
  if (typeof id !== 'string' || !UUID.test(id) || typeof item?.name !== 'string') return null;
  return {
    id,
    name: item.name.slice(0, 200),
    disambiguation: typeof item.disambiguation === 'string' ? item.disambiguation.slice(0, 220) : '',
    subtype: typeof item.subtype === 'string' ? item.subtype : '',
    tags: Array.isArray(item.tags) ? item.tags.map(x => x?.name).filter(x => typeof x === 'string').slice(0, 3) : [],
  };
}

export function createQloo({ apiKey, base = DEFAULT_BASE, fetchImpl = fetch }) {
  async function get(path, params) {
    if (!apiKey) throw new PublicError(503, 'Qloo access is not configured yet.');
    const parsed = new URL(base);
    if (parsed.origin !== DEFAULT_BASE) throw new PublicError(500, 'Qloo environment is not configured correctly.');
    const url = new URL(path, parsed);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { 'X-Api-Key': apiKey, accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
    } catch { throw new PublicError(502, 'The Qloo service could not be reached.'); }
    if (!response.ok) {
      if (response.status === 429) throw new PublicError(429, 'The Qloo request limit was reached. Try again later.');
      throw new PublicError(502, 'Qloo could not complete this request. Try again later.');
    }
    let data;
    try { data = await response.json(); } catch { throw new PublicError(502, 'Qloo returned an unreadable response.'); }
    return entitiesFrom(data).map(cleanEntity).filter(Boolean);
  }

  async function search(name) {
    const query = validateName(name);
    return (await get('/search', { query, types: OUTPUTS.artists, take: '5' })).slice(0, 5);
  }

  async function insights(id, type) {
    if (!UUID.test(id)) throw new PublicError(400, 'Choose a valid reference artist.');
    if (!Object.hasOwn(OUTPUTS, type)) throw new PublicError(400, 'Choose a valid discovery route.');
    return (await get('/v2/insights', {
      'filter.type': OUTPUTS[type],
      'signal.interests.entities': id,
    })).filter(item => item.id.toLowerCase() !== id.toLowerCase()).slice(0, 6);
  }

  return { search, insights };
}

export function buildBrief(reference, goal, artists, films) {
  const tasks = {
    showcase: 'Use these works as research references for a live programme. Results may include deceased artists; they are not a list of available performers. Identify living performers separately and verify fees, availability and consent.',
    campaign: 'Use these cultural references to sketch a creative campaign; independently clear rights before use.',
    collaboration: 'Explore potential creative connections; assess fit and make contact only with appropriate consent.',
  };
  if (!Object.hasOwn(tasks, goal)) throw new PublicError(400, 'Choose a valid brief goal.');
  return {
    reference,
    goal,
    actions: [tasks[goal], 'Check cultural context and representation with people from the community.', 'Treat this as a starting point, not an endorsement or a booking.'],
    artists,
    films,
    source: 'Qloo cultural affinity results, using the selected reference as a signal.',
  };
}
