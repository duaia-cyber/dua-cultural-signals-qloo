const $ = selector => document.querySelector(selector);
const state = { selected: null, brief: null };
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
  state.selected=null; state.brief=null; matches.replaceChildren(); selection.hidden=true; results.hidden=true;
  searchStatus.textContent='Searching Qloo…'; $('#search-button').disabled=true;
  try {
    const data=await request('/api/search',{name:$('#artist').value});
    if (!data.matches?.length) { searchStatus.textContent='No matches found. Try another spelling or reference.'; return; }
    searchStatus.textContent='Choose the correct match:';
    for (const match of data.matches) {
      const button=document.createElement('button'); button.type='button'; button.className='match'; button.setAttribute('aria-pressed','false');
      const details=document.createElement('span'); const name=document.createElement('strong'); name.textContent=match.name; details.append(name);
      if (match.disambiguation) { const small=document.createElement('small'); small.textContent=match.disambiguation; details.append(small); }
      const arrow=document.createElement('span'); arrow.setAttribute('aria-hidden','true'); arrow.textContent='↗'; button.append(details,arrow);
      button.addEventListener('click',()=>{ state.selected=match; for(const sibling of matches.querySelectorAll('button')) sibling.setAttribute('aria-pressed',String(sibling===button)); selection.hidden=false; results.hidden=true; });
      matches.append(button);
    }
  } catch(error) { searchStatus.textContent=error.message; }
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
    const type=document.createElement('span');type.className='entry-type';type.textContent=label.toUpperCase();row.append(number,content,type);container.append(row);
  });
}

$('#build').addEventListener('click',async()=>{
  if (!state.selected) return;
  const button=$('#build');button.disabled=true;searchStatus.textContent='Exploring Qloo cultural signals…';
  try{
    const data=await request('/api/brief',{id:state.selected.id,name:state.selected.name,goal:$('#goal').value});
    state.brief=data;$('#reference-name').textContent=data.reference;$('#result-source').textContent=data.source;
    renderItems($('#artists'),data.artists,'artists');renderItems($('#films'),data.films,'films');
    const list=$('#actions');list.replaceChildren();for(const action of data.actions){const li=document.createElement('li');li.textContent=action;list.append(li);}
    searchStatus.textContent='';results.hidden=false;results.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){searchStatus.textContent=error.message;}
  finally{button.disabled=false;}
});

$('#copy').addEventListener('click',async()=>{
  if(!state.brief)return;const b=state.brief;
  const text=['DUA CULTURAL SIGNALS',`Reference: ${b.reference}`,`Goal: ${b.goal}`,'',`Artist signals: ${b.artists.map(x=>x.name).join(', ') || 'None returned'}`,`Film signals: ${b.films.map(x=>x.name).join(', ') || 'None returned'}`,'',...b.actions,'',b.source].join('\n');
  try { await navigator.clipboard.writeText(text); $('#copy-status').textContent='Brief copied.'; }
  catch { $('#copy-status').textContent='Copy is unavailable in this browser.'; }
});
