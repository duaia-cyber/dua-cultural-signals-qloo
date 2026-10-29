import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQloo, PublicError, buildBrief } from '../lib/qloo.mjs';

const SAMPLE_ID='01234567-89ab-cdef-0123-456789abcdef';
const NEIGHBOUR_ID='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

test('missing key fails closed before network access', async()=>{
  let calls=0;
  const c=createQloo({apiKey:'',fetchImpl:async()=>{calls++;}});
  await assert.rejects(()=>c.search('Example Artist'),e=>e instanceof PublicError && e.status===503);
  assert.equal(calls,0);
});

test('search encodes the name and keeps the key in a request header',async()=>{
  let seen;
  const c=createQloo({apiKey:'local-test-key',fetchImpl:async(url,options)=>{
    seen={url,options};return {ok:true,json:async()=>({results:[{name:'Example Artist',entity_id:SAMPLE_ID,disambiguation:'Fixture',secret:'ignored'}]})};
  }});
  const result=await c.search('Example & Artist');
  assert.equal(seen.url.origin,'https://hackathon.api.qloo.com');
  assert.equal(seen.url.searchParams.get('query'),'Example & Artist');
  assert.equal(seen.url.searchParams.get('types'),'urn:entity:artist');
  assert.equal(seen.options.headers['X-Api-Key'],'local-test-key');
  assert.equal(seen.url.href.includes('local-test-key'),false);
  assert.deepEqual(result,[{id:SAMPLE_ID,name:'Example Artist',disambiguation:'Fixture',subtype:'',tags:[]}]);
});

test('insights use the selected signal and reject untrusted entity IDs and routes',async()=>{
  let seen;
  const c=createQloo({apiKey:'local-test-key',fetchImpl:async(url)=>{
    seen=url;return {ok:true,json:async()=>({results:{entities:[{entity_id:SAMPLE_ID,name:'Reference'},{entity_id:NEIGHBOUR_ID,name:'Related fixture'}]}})};
  }});
  const result=await c.insights(SAMPLE_ID,'films');
  assert.equal(seen.searchParams.get('filter.type'),'urn:entity:movie');
  assert.equal(seen.searchParams.get('signal.interests.entities'),SAMPLE_ID);
  assert.deepEqual(result.map(x=>x.name),['Related fixture']);
  await assert.rejects(()=>c.insights('../escape','films'),e=>e.status===400);
  await assert.rejects(()=>c.insights(SAMPLE_ID,'toString'),e=>e.status===400);
});

test('provider errors are bounded and do not leak a key',async()=>{
  const c=createQloo({apiKey:'secret-not-to-leak',fetchImpl:async()=>({ok:false,status:401})});
  await assert.rejects(()=>c.search('Artist'),e=>e.status===502 && !e.message.includes('secret'));
  const bad=createQloo({apiKey:'x',base:'https://example.com',fetchImpl:async()=>{throw Error('must not call')}});
  await assert.rejects(()=>bad.search('Artist'),e=>e.status===500);
});

test('brief remains a human-reviewed suggestion rather than a booking',()=>{
  const brief=buildBrief('Fixture','showcase',[],[]);
  assert.match(brief.actions.join(' '),/consent|human|booking/i);
  assert.throws(()=>buildBrief('Fixture','__proto__',[],[]),e=>e.status===400);
});

test('editorial exclusions omit known historical names without claiming life-status verification', async () => {
  const qloo = createQloo({ apiKey: 'fixture', fetchImpl: async () => new Response(JSON.stringify({results:[
    {entity_id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', name:'Cesária Évora'},
    {entity_id:'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee', name:'Lura'}
  ]}),{status:200}) });
  assert.deepEqual((await qloo.search('Lura')).map(x=>x.name), ['Lura']);
});
