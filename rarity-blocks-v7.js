(() => {
  const RARITY_KEY = 'brainrot_rarities_v6';
  const ORDER_KEY = 'brainrot_block_order_v7';
  const DEFAULT_IDS = ['common','rare','epic','mythic','legendary','ultra_legendary','secret'];
  const VERSIONS = ['normal','diamond','gold','divine','rainbow'];
  const VL = {normal:'Normal',diamond:'Diamant',gold:'Or',divine:'Divin',rainbow:'Arc-en-ciel'};

  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function loadR(){try{return JSON.parse(localStorage.getItem(RARITY_KEY))||[]}catch{return[]}}
  function saveR(list){localStorage.setItem(RARITY_KEY,JSON.stringify(list))}
  function loadO(){try{return JSON.parse(localStorage.getItem(ORDER_KEY))||{}}catch{return{}}}
  function saveO(o){localStorage.setItem(ORDER_KEY,JSON.stringify(o))}
  function rarity(id){return loadR().find(r=>r.id===id)||{id,name:id,icon:'✨',color:'#65d8ff'};}
  function owned(b){return VERSIONS.reduce((n,v)=>n+((b.versions?.[v]?.image||b.versions?.[v]?.count>0)?1:0),0)}
  function data(v){return v||{image:'',count:0}}
  function isCustom(id){return !DEFAULT_IDS.includes(id)}

  function css(){
    const s=document.createElement('style');
    s.textContent=`
      .rarity-line{grid-template-columns:1fr 50px 42px 42px 42px!important}.rarity-delete{background:#6a2235!important;color:#ffd6df!important}.empty-rarity-box{border:2px dashed var(--section-color);border-radius:24px;padding:18px;margin-top:14px;background:rgba(3,8,23,.38);display:grid;gap:10px}.empty-rarity-box strong{font-size:22px}.empty-rarity-box button,.rarity-custom-btn{border:1px solid var(--section-color);background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.04));color:#fff;border-radius:18px;padding:12px 14px;font-weight:900}.rarity-custom-btn{margin-top:10px;width:100%}.block-panel{position:fixed;inset:auto 10px 12px 10px;z-index:9999;max-height:78vh;overflow:auto;background:#071026f7;border:1px solid #ffffff26;border-radius:28px;padding:18px;box-shadow:0 -20px 60px #000a}.block-panel.hidden{display:none}.block-panel h3{margin:0 0 6px;font-size:28px}.block-panel p{color:#c8d3ee;margin:0 0 14px}.block-row{display:grid;grid-template-columns:1fr 48px 48px 48px;gap:8px;align-items:center;margin:9px 0;padding:10px;border-radius:18px;background:#121d3a;border:1px solid #ffffff1f}.block-row strong{font-size:16px}.block-row button,.block-actions button{border:0;border-radius:14px;background:#263a66;color:#fff;font-weight:900;padding:12px}.block-row .danger,.block-actions .danger{background:#612235;color:#ffd4de}.block-actions{display:grid;gap:10px;margin-top:14px}.block-actions button{font-size:16px}.block-close{position:absolute;right:14px;top:14px;width:44px;height:44px;border-radius:50%;border:0;background:#ffffff16;color:#fff;font-weight:900;font-size:20px}.section-header{cursor:pointer}.section-header:after{content:'Touchez le titre pour personnaliser';display:block;color:#cbd7f0;font-size:12px;margin-top:6px;opacity:.75}`;
    document.head.appendChild(s);
  }

  function slot(b,v,i){const d=data(b.versions?.[v]);const ok=d.image||d.count>0;return `<button class="slot-btn ${ok?'filled':''}" type="button" data-action="slot" data-id="${b.id}" data-version="${v}">${d.count>1?`<span class="slot-count">x${d.count}</span>`:''}<div class="slot-thumb">${ok&&d.image?`<img src="${d.image}" alt="${esc(b.name)}">`:`<div class="slot-placeholder"><strong>＋</strong><span>Image</span></div>`}</div><div class="version-caption">${VL[v]}<small>Case ${i+1}</small></div></button>`}
  function card(b,r){return `<article class="brainrot-card" data-id="${b.id}" style="--rarity-color:${r.color};--section-color:${r.color}"><div class="card-head"><div><div class="card-topline"><span class="rarity-badge" style="border-color:${r.color};color:#fff">${r.icon} ${esc(r.name)}</span><span class="source-badge">${b.source==='base'?'Base':'Perso'}</span><span class="section-meta">${owned(b)} / 5 versions</span></div><h3>${esc(b.name)}</h3><p class="card-sub">Ajoute une image depuis la galerie ou prends une photo.</p><div class="card-actions"><button class="mini-btn" type="button" data-action="edit" data-id="${b.id}">Modifier</button><button class="mini-btn danger" type="button" data-action="delete-brainrot" data-id="${b.id}">Supprimer</button></div></div><button class="favorite-btn ${b.favorite?'active':''}" type="button" data-action="favorite" data-id="${b.id}">${b.favorite?'★':'☆'}</button></div><div class="versions-grid">${VERSIONS.map((v,i)=>slot(b,v,i)).join('')}</div></article>`}
  function section(r,items){const total=items.length*5, own=items.reduce((s,b)=>s+owned(b),0), pct=total?Math.round(own/total*100):0;return `<section class="rarity-section rarity-added" data-rarity-section="${r.id}" style="--section-color:${r.color};border-color:${r.color}"><div class="section-header" data-open-blocks="${r.id}"><div><h3>${r.icon} ${esc(r.name)}</h3><div class="section-meta">${items.length} brainrot${items.length>1?'s':''}</div></div><div class="section-progress"><div class="section-meta">${own} / ${total||5} versions</div><div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${r.color}"></div></div></div></div>${items.length?items.map(b=>card(b,r)).join(''):`<div class="empty-rarity-box"><strong>Aucun bloc dans ${esc(r.name)}</strong><span>Ajoute un premier bloc pour cette rareté.</span><button type="button" data-add-block="${r.id}">+ Ajouter un bloc</button></div>`}<button class="rarity-custom-btn" type="button" data-open-blocks="${r.id}">Personnaliser ${esc(r.name)}</button></section>`}

  function currentItems(){return (window.getFilteredBrainrots?window.getFilteredBrainrots():[])}
  function orderItems(id,items){const order=loadO()[id]||[];return [...items].sort((a,b)=>{const ia=order.indexOf(a.id),ib=order.indexOf(b.id);return (ia<0?9999:ia)-(ib<0?9999:ib)})}

  function addMissingSections(){
    const wrap=document.getElementById('collectionWrap'); if(!wrap) return;
    const all=currentItems();
    loadR().forEach(r=>{
      const exists=[...wrap.querySelectorAll('.rarity-section')].some(sec=>(sec.dataset.raritySection===r.id)||((sec.querySelector('h3')?.textContent||'').toLowerCase().includes(r.name.toLowerCase())));
      const items=orderItems(r.id,all.filter(b=>b.rarity===r.id));
      if(!exists && (items.length || isCustom(r.id))) wrap.insertAdjacentHTML('beforeend',section(r,items));
    });
    wire();
  }

  function wire(){
    document.querySelectorAll('[data-add-block]').forEach(b=>b.onclick=()=>openAdd(b.dataset.addBlock));
    document.querySelectorAll('[data-open-blocks]').forEach(b=>b.onclick=(e)=>{e.stopPropagation();openPanel(b.dataset.openBlocks)});
    recolorExisting();
  }

  function recolorExisting(){
    loadR().forEach(r=>document.querySelectorAll('.rarity-section').forEach(sec=>{const title=(sec.querySelector('h3')?.textContent||'').toLowerCase(); if(title.includes(r.name.toLowerCase())){sec.style.setProperty('--section-color',r.color);sec.style.borderColor=r.color;if(!sec.querySelector('[data-open-blocks]')){const h=sec.querySelector('.section-header'); if(h){h.dataset.openBlocks=r.id; h.addEventListener('click',()=>openPanel(r.id));}}}}));
  }

  function openAdd(rid){
    const modal=document.getElementById('brainrotModal'); const select=document.getElementById('brainrotRarityInput'); const input=document.getElementById('brainrotNameInput');
    if(select) select.value=rid; if(input){input.value=''; input.placeholder='Nom du nouveau bloc';}
    modal?.classList.remove('hidden'); setTimeout(()=>input?.focus(),80);
  }

  function makeBlock(rid){
    const r=rarity(rid); const name=prompt('Nom du nouveau bloc dans '+r.name); if(!name)return;
    if(window.addBrainrot){window.addBrainrot(name.trim(),rid); window.persistState&&window.persistState(); window.renderAll&&window.renderAll(); setTimeout(refresh,150);} else openAdd(rid);
  }

  function deleteRarity(id){
    const r=rarity(id); if(!confirm('Supprimer la rareté '+r.name+' ? Les brainrots déjà créés ne seront pas supprimés.'))return;
    save(loadR().filter(x=>x.id!==id));
    document.querySelector(`[data-r="${id}"]`)?.remove();
    refresh();
  }

  function moveBlock(rid,bid,dir){const o=loadO();const ids=[...document.querySelectorAll(`[data-rarity-section="${rid}"] .brainrot-card, .rarity-section .brainrot-card`)].map(x=>x.dataset.id);let arr=o[rid]||ids;const i=arr.indexOf(bid),j=i+dir;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];o[rid]=arr;saveO(o);window.renderAll&&window.renderAll();setTimeout(()=>{refresh();openPanel(rid)},180)}
  function deleteBlock(bid){document.querySelector(`.brainrot-card[data-id="${bid}"] [data-action="delete-brainrot"]`)?.click();setTimeout(refresh,250)}

  function openPanel(rid){
    let p=document.getElementById('blockPanel'); if(!p){p=document.createElement('div');p.id='blockPanel';p.className='block-panel';document.body.appendChild(p)}
    const r=rarity(rid); const items=orderItems(rid,currentItems().filter(b=>b.rarity===rid));
    p.classList.remove('hidden');
    p.innerHTML=`<button class="block-close" type="button">×</button><h3>${r.icon} ${esc(r.name)}</h3><p>Ajoute, supprime ou déplace les blocs de cette rareté.</p>${items.length?items.map(b=>`<div class="block-row"><strong>${esc(b.name)}</strong><button data-up-block="${b.id}">↑</button><button data-down-block="${b.id}">↓</button><button class="danger" data-del-block="${b.id}">×</button></div>`).join(''):'<div class="empty-rarity-box"><strong>Aucun bloc</strong><span>Ajoute un premier bloc.</span></div>'}<div class="block-actions"><button type="button" data-new-block="${rid}">+ Ajouter un bloc</button><button type="button" data-new-empty="${rid}">+ Ajouter un bloc vide</button><button class="danger" type="button" data-del-rarity="${rid}">Supprimer cette rareté</button></div>`;
    p.querySelector('.block-close').onclick=()=>p.classList.add('hidden');
    p.querySelector('[data-new-block]').onclick=()=>makeBlock(rid);
    p.querySelector('[data-new-empty]').onclick=()=>makeBlock(rid);
    p.querySelector('[data-del-rarity]').onclick=()=>{deleteRarity(rid);p.classList.add('hidden')};
    p.querySelectorAll('[data-up-block]').forEach(b=>b.onclick=()=>moveBlock(rid,b.dataset.upBlock,-1));
    p.querySelectorAll('[data-down-block]').forEach(b=>b.onclick=()=>moveBlock(rid,b.dataset.downBlock,1));
    p.querySelectorAll('[data-del-block]').forEach(b=>b.onclick=()=>deleteBlock(b.dataset.delBlock));
  }

  function patchRarityPanel(){
    const panel=document.getElementById('rarityPanel'); if(!panel||panel.dataset.deleteReady)return; panel.dataset.deleteReady='1';
    const addDelete=()=>{panel.querySelectorAll('.rarity-line').forEach(line=>{if(line.querySelector('.rarity-delete'))return; const id=line.querySelector('[data-name]')?.dataset.name; const btn=document.createElement('button');btn.type='button';btn.className='rarity-delete';btn.textContent='×';btn.onclick=()=>deleteRarity(id);line.appendChild(btn);});};
    addDelete(); new MutationObserver(addDelete).observe(panel,{childList:true,subtree:true});
  }

  function refresh(){addMissingSections();patchRarityPanel();}
  function boot(){css();setInterval(refresh,700);setTimeout(refresh,900);}
  document.addEventListener('DOMContentLoaded',boot);
})();
