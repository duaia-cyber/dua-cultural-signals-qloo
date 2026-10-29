const $ = selector => document.querySelector(selector);
const state = { selected: null, brief: null, shortlist: new Map() };
let operation = 0;
const searchForm = $('#search-form');
const searchStatus = $('#search-status');
const matches = $('#matches');
const selection = $('#selection');
const results = $('#results');

async function request(path, params) {
  const url = new URL(path, location.origin);
  for (const [key,value] of Object.entries(params)) url.searchParams.set(key,value);
  const response = await fetch(url, { headers: { accept:'application/json' }, cache:'no-store' });
  let data;
  try { data=await response.json(); } catch { throw new Error('The service returned an unreadable response.'); }
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

searchForm.addEventListener('submit', async event => {
  event.preventDefault();
  const requestId=++operation;
  state.selected=null; state.brief=null; state.shortlist.clear(); matches.replaceChildren(); selection.hidden=true; results.hidden=true;
  searchStatus.textContent='Searching Qloo…'; $('#search-button').disabled=true;
  try {
    const data=await request('/api/search',{name:$('#artist').value});
    if(requestId!==operation)return;
    if (!data.matches?.length) { searchStatus.textContent='No matches found. Try another spelling or reference.'; return; }
    searchStatus.textContent='Choose the correct match:';
    for (const match of data.matches) {
      const button=document.createElement('button'); button.type='button'; button.className='match'; button.setAttribute('aria-pressed','false');
      const details=document.createElement('span'); const name=document.createElement('strong'); name.textContent=match.name; details.append(name);
      if (match.disambiguation) { const small=document.createElement('small'); small.textContent=match.disambiguation; details.append(small); }
      const arrow=document.createElement('span'); arrow.setAttribute('aria-hidden','true'); arrow.textContent='↗'; button.append(details,arrow);
      button.addEventListener('click',()=>{ operation++; state.selected=match; for(const sibling of matches.querySelectorAll('button')) sibling.setAttribute('aria-pressed',String(sibling===button)); selection.hidden=false; results.hidden=true; });
      matches.append(button);
    }
  } catch(error) { if(requestId===operation)searchStatus.textContent=error.message; }
  finally { $('#search-button').disabled=false; }
});

function renderItems(container, items, label) {
  container.replaceChildren();
  if (!items.length) { const p=document.createElement('p'); p.className='empty'; p.textContent='No '+label+' returned for this reference.'; container.append(p); return; }
  items.forEach((item,index)=>{
    const row=document.createElement('article'); row.className='entry';
    const number=document.createElement('span'); number.className='entry-number'; number.textContent=String(index+1).padStart(2,'0');
    const content=document.createElement('div'); const title=document.createElement('h3'); title.textContent=item.name; content.append(title);
    const detail=[item.disambiguation,...(item.tags || [])].filter(Boolean).join(' · ');
    if(detail){const p=document.createElement('p');p.textContent=detail;content.append(p);}
    const add=document.createElement('button');add.type='button';add.className='add-reference';add.textContent='+';add.setAttribute('aria-label','Add '+item.name+' to brief');add.setAttribute('aria-pressed','false');
    add.addEventListener('click',()=>{if(state.shortlist.has(item.id)){state.shortlist.delete(item.id);}else{state.shortlist.set(item.id,{...item,category:label});}updateShortlist();});
    add.dataset.entity=item.id;add.dataset.name=item.name;row.append(number,content,add);container.append(row);
  });
}

$('#build').addEventListener('click',async()=>{
  if (!state.selected) return;
  const requestId=++operation;
  const button=$('#build');button.disabled=true;searchStatus.textContent='Exploring Qloo cultural signals…';
  try{
    const data=await request('/api/brief',{id:state.selected.id,name:state.selected.name,goal:$('#goal').value});
    if(requestId!==operation)return;
    state.brief=data;state.shortlist.clear();updateShortlist();$('#reference-name').textContent=data.reference;$('#result-source').textContent=data.source;
    renderItems($('#artists'),data.artists,'artists');renderItems($('#films'),data.films,'films');
    const list=$('#actions');list.replaceChildren();for(const action of data.actions){const li=document.createElement('li');li.textContent=action;list.append(li);}
    searchStatus.textContent='';results.hidden=false;results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }catch(error){if(requestId===operation)searchStatus.textContent=error.message;}
  finally{button.disabled=false;}
});


function updateShortlist(){
 const list=$('#shortlist');list.replaceChildren();
 for(const item of state.shortlist.values()){const li=document.createElement('li');const label=document.createElement('span');label.textContent=item.name+' · '+item.category;const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+item.name+' from brief');remove.addEventListener('click',()=>{state.shortlist.delete(item.id);updateShortlist();});li.append(label,remove);list.append(li);}
 $('#shortlist-count').textContent=state.shortlist.size?state.shortlist.size+(state.shortlist.size===1?' reference selected for your brief.':' references selected for your brief.'):'No references selected yet. Use + beside any result.';
 for(const button of document.querySelectorAll('[data-entity]')){const selected=state.shortlist.has(button.dataset.entity);button.setAttribute('aria-pressed',String(selected));button.textContent=selected?'✓':'+';button.setAttribute('aria-label',(selected?'Remove ':'Add ')+button.dataset.name+(selected?' from brief':' to brief'));}
 $('#copy-status').textContent='';
}
function briefText(){
 const b=state.brief;if(!b)return '';
 const selected=[...state.shortlist.values()];
 return ['# DUA Cultural Signals', '', 'Reference: '+b.reference, 'Goal: '+b.goal, '', '## Curated references', ...(selected.length?selected.map(x=>'- '+x.name+' ('+x.category+')'):['No shortlist selected. The full research results follow.']), '', '## Qloo music references', ...b.artists.map(x=>'- '+x.name), '', '## Qloo film references', ...b.films.map(x=>'- '+x.name), '', '## Human review checklist', ...b.actions.map(x=>'- '+x), '', '## Source and limits', b.source, 'These are cultural research references, not confirmed collaborations, available performers, audience demand or rights clearances.', 'Tool: https://dua-cultural-signals-qloo.vercel.app'].join('\n');
}
$('#copy').addEventListener('click',async()=>{
 if(!state.brief)return;
 try{await navigator.clipboard.writeText(briefText());$('#copy-status').textContent='Brief copied. Ready to review with your team.';}
 catch{$('#copy-status').textContent='Clipboard unavailable. Use Download .md instead.';}
});
$('#download').addEventListener('click',()=>{
 if(!state.brief)return;const url=URL.createObjectURL(new Blob([briefText()],{type:'text/markdown;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='DUA-cultural-brief.md';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#copy-status').textContent='Markdown download started.';
});
