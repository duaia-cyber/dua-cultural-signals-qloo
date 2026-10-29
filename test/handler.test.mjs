import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../lib/handler.mjs';

const ID='01234567-89ab-cdef-0123-456789abcdef';
function call(handler,url,method='GET'){
  return new Promise((resolve,reject)=>{
    const headers={}; const res={statusCode:200,setHeader:(key,value)=>headers[key]=value,end:body=>resolve({status:res.statusCode,body:JSON.parse(body),headers})};
    Promise.resolve(handler({url,method,socket:{remoteAddress:'test-'+Math.random()}},res)).catch(reject);
  });
}

test('brief verifies reference identity before requesting insights',async()=>{
  const queries=[];
  const client={search:async name=>[{id:ID,name:'Real fixture'}],insights:async(id,type)=>{queries.push({id,type});return []}};
  const h=createHandler({client});
  const response=await call(h,`/api/brief?id=${ID}&name=Real%20fixture&goal=showcase`);
  assert.equal(response.status,200);assert.equal(response.body.reference,'Real fixture');assert.equal(queries.length,2);
  assert.equal(response.headers['Cache-Control'],'no-store');
});

test('unknown reference does not make an insights request',async()=>{
  let insights=0;
  const h=createHandler({client:{search:async()=>[],insights:async()=>{insights++;return[]}}});
  const response=await call(h,`/api/brief?id=${ID}&name=Example&goal=showcase`);
  assert.equal(response.status,400);assert.equal(insights,0);
});

test('methods and unknown routes are rejected',async()=>{
  const h=createHandler({client:{}});
  assert.equal((await call(h,'/api/search','POST')).status,405);
  assert.equal((await call(h,'/api/unknown')).status,404);
});
