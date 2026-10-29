const DEMO_ORIGIN = 'https://dua-cultural-signals-qloo.vercel.app';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const goals = ['showcase', 'campaign', 'collaboration'];

const nameProperty = {
  type: 'string', minLength: 2, maxLength: 100,
  description: 'Public artist name. Do not provide private or sensitive information.',
};
const idProperty = { type: 'string', pattern: UUID.source, description: 'Qloo artist ID selected from search results.' };

const tools = [
  {
    name: 'search_artist',
    description: 'Find candidate Qloo artist identities. Confirm the correct identity before comparing. Use public artist names only.',
    inputSchema: { type: 'object', properties: { name: nameProperty }, required: ['name'], additionalProperties: false },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'compare_cultural_references',
    description: 'Compare two previously selected Qloo artists. Results are limited research samples, not evidence of relationships, rights, audiences or booking availability.',
    inputSchema: {
      type: 'object', properties: { idA: idProperty, nameA: nameProperty, idB: idProperty, nameB: nameProperty, goal: { type: 'string', enum: goals } },
      required: ['idA', 'nameA', 'idB', 'nameB', 'goal'], additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
];

function validName(value) {
  return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 100 && !/[\u0000-\u001f]/.test(value);
}

function fail(id, code, message) { return { jsonrpc: '2.0', id, error: { code, message } }; }
function succeed(id, result) { return { jsonrpc: '2.0', id, result }; }
function toolResult(text, isError = false) { return { content: [{ type: 'text', text }], ...(isError ? { isError: true } : {}) }; }

export function createMcpHandler({ fetchImpl = fetch } = {}) {
  let initStarted = false;
  let initialized = false;
  return async function handle(message) {
    if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') return fail(message?.id ?? null, -32600, 'Invalid request.');
    if (!Object.hasOwn(message, 'id')) {
      if (message.method === 'notifications/initialized' && initStarted) initialized = true;
      return null;
    }
    const { id, method, params = {} } = message;
    if (method === 'initialize') {
      initStarted = true;
      initialized = false;
      return succeed(id, {
        protocolVersion: '2025-06-18', capabilities: { tools: {} },
        serverInfo: { name: 'dua-cultural-signals', version: '0.1.0' },
        instructions: 'Public cultural research only. Verify identities and review results with a person; Qloo signals do not prove rights, relationships or availability.',
      });
    }
    if (method === 'ping') return succeed(id, {});
    if (!initialized) return fail(id, -32002, 'Initialize the session first.');
    if (method === 'tools/list') return succeed(id, { tools });
    if (method !== 'tools/call') return fail(id, -32601, 'Method not found.');
    const args = params.arguments;
    if (!args || typeof args !== 'object' || Array.isArray(args)) return fail(id, -32602, 'Tool arguments are required.');
    let path;
    let keys;
    if (params.name === 'search_artist') {
      keys = ['name'];
      if (!validName(args.name)) return fail(id, -32602, 'Provide a valid public artist name.');
      path = '/api/search';
    } else if (params.name === 'compare_cultural_references') {
      keys = ['idA', 'nameA', 'idB', 'nameB', 'goal'];
      if (!validName(args.nameA) || !validName(args.nameB) || !UUID.test(args.idA ?? '') || !UUID.test(args.idB ?? '') || args.idA.toLowerCase() === args.idB.toLowerCase() || !goals.includes(args.goal)) {
        return fail(id, -32602, 'Choose two different verified artists and a valid goal.');
      }
      path = '/api/bridge';
    } else return fail(id, -32602, 'Unknown tool.');
    if (Object.keys(args).some(key => !keys.includes(key))) return fail(id, -32602, 'Unexpected tool argument.');
    const url = new URL(path, DEMO_ORIGIN);
    for (const key of keys) url.searchParams.set(key, args[key].trim());
    try {
      const response = await fetchImpl(url, { headers: { accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) return succeed(id, toolResult(typeof data?.error === 'string' ? data.error : 'Cultural research is temporarily unavailable.', true));
      return succeed(id, toolResult(JSON.stringify(data)));
    } catch {
      return succeed(id, toolResult('Cultural research is temporarily unavailable. Please try again.', true));
    }
  };
}
