import { createQloo, buildBrief, PublicError } from './qloo.mjs';

const limits = new Map();
function allow(ip, now = Date.now()) {
  const key = ip || 'local';
  const item = limits.get(key);
  if (!item || now - item.start > 600000) { limits.set(key, { start: now, count: 1 }); return true; }
  item.count++;
  return item.count <= 25;
}

export function createHandler(options = {}) {
  const client = options.client || createQloo({ apiKey: process.env.QLOO_API_KEY, base: process.env.QLOO_API_BASE || 'https://hackathon.api.qloo.com' });
  return async function handle(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      if (req.method !== 'GET') throw new PublicError(405, 'Method not supported.');
      if (!allow(req.socket?.remoteAddress)) throw new PublicError(429, 'Too many requests. Please try later.');
      const url = new URL(req.url, 'http://localhost');
      let result;
      if (url.pathname === '/api/search') {
        result = { matches: await client.search(url.searchParams.get('name')) };
      } else if (url.pathname === '/api/brief') {
        const id = url.searchParams.get('id') || '';
        const name = url.searchParams.get('name') || '';
        const goal = url.searchParams.get('goal') || '';
        if (name.length < 2 || name.length > 200 || /[\u0000-\u001f]/.test(name)) throw new PublicError(400, 'Choose a valid reference artist.');
        if (!['showcase','campaign','collaboration'].includes(goal)) throw new PublicError(400, 'Choose a valid brief goal.');
        const matches = await client.search(name);
        const reference = matches.find(item => item.id.toLowerCase() === id.toLowerCase());
        if (!reference) throw new PublicError(400, 'This reference could not be verified. Please search and select it again.');
        const [artists, films] = await Promise.all([client.insights(id, 'artists'), client.insights(id, 'films')]);
        result = buildBrief(reference.name, goal, artists, films);
      } else throw new PublicError(404, 'Not found.');
      res.statusCode = 200; res.end(JSON.stringify(result));
    } catch (error) {
      res.statusCode = error instanceof PublicError ? error.status : 500;
      res.end(JSON.stringify({ error: error instanceof PublicError ? error.message : 'The request could not be completed.' }));
    }
  };
}
