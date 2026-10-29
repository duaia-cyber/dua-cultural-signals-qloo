import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHandler } from './lib/handler.mjs';

const handler = createHandler();
const files = new Map([
  ['/', ['public/index.html','text/html; charset=utf-8']],
  ['/style.css', ['public/style.css','text/css; charset=utf-8']],
  ['/app.js', ['public/app.js','text/javascript; charset=utf-8']],
  ['/openapi.json', ['public/openapi.json','application/json; charset=utf-8']],
]);
const server = http.createServer(async (req,res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path.startsWith('/api/')) return handler(req,res);
  const item = files.get(path);
  if (!item || req.method !== 'GET') { res.statusCode=404; return res.end('Not found'); }
  try {
    const content=await readFile(new URL(item[0],import.meta.url));
    res.writeHead(200, {'Content-Type':item[1],'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
    res.end(content);
  } catch { res.statusCode=500; res.end('Unavailable'); }
});
server.listen(Number(process.env.PORT || 3850),'127.0.0.1',()=>console.log('Local prototype: http://127.0.0.1:'+(process.env.PORT || 3850)));
