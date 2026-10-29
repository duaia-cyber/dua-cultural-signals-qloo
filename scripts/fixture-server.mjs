// Disposable local fixture server for UI checks only. No real API calls or user data.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHandler } from '../lib/handler.mjs';

const base = new URL('../public/', import.meta.url);
const reference = { id: '01234567-89ab-cdef-0123-456789abcdef', name: 'TEST FIXTURE — First artist', disambiguation: 'Synthetic fixture' };
const second = { id: '12345678-89ab-cdef-0123-456789abcdef', name: 'TEST FIXTURE — Second artist', disambiguation: 'Synthetic fixture' };
const client = {
  async search(name) { return name.toLowerCase().includes('second') ? [second] : [reference]; },
  async insights(id,type) {
    return [
      ...(id === reference.id && type === 'artists' ? [second] : []),
      { id: type === 'artists' ? 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' : 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee', name:`TEST FIXTURE — common ${type}`,disambiguation:'Synthetic fixture',tags:[] },
      { id: id === reference.id ? 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee' : 'dddddddd-bbbb-cccc-dddd-eeeeeeeeeeee', name:`TEST FIXTURE — ${id === reference.id ? 'first' : 'second'} ${type}`,disambiguation:'Synthetic fixture',tags:[] },
    ];
  },
};
const handler=createHandler({client});
const files=new Map([['/',['index.html','text/html; charset=utf-8']],['/style.css',['style.css','text/css; charset=utf-8']],['/app.js',['app.js','text/javascript; charset=utf-8']],['/workflow.mjs',['workflow.mjs','text/javascript; charset=utf-8']],['/openapi.json',['openapi.json','application/json; charset=utf-8']]]);
const port = Number(process.env.PORT || 3851);
http.createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path.startsWith('/api/'))return handler(req,res);
  const item=files.get(path);if(!item){res.statusCode=404;return res.end('Not found');}
  try{res.writeHead(200,{'Content-Type':item[1]});res.end(await readFile(new URL(item[0],base)));}catch{res.statusCode=500;res.end('Unavailable');}
}).listen(port,'127.0.0.1',()=>console.log('Fixture-only UI server: http://127.0.0.1:' + port));
