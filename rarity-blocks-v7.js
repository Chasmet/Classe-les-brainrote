(() => {
  const DB_NAME = 'brainrot-vault-db';
  const STORE_NAME = 'state';
  const STATE_KEY = 'main';
  const RARITY_KEY = 'brainrot_rarities_v6';
  const ORDER_KEY = 'brainrot_block_order_v8';
  const DEFAULT_IDS = ['common','rare','epic','mythic','legendary','ultra_legendary','secret'];
  const VERSIONS = ['normal','diamond','gold','divine','rainbow'];
  const VL = {normal:'Normal',diamond:'Diamant',gold:'Or',divine:'Divin',rainbow:'Arc-en-ciel'};
  let currentCustomSlot = null;

  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function uid(prefix='id'){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
  function toast(msg){const t=document.getElementById('toast'); if(!t) return alert(msg); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.add('hidden'),2200)}
  function loadR(){try{return JSON.parse(localStorage.getItem(RARITY_KEY))||[]}catch{return[]}}
  function saveR(list){localStorage.setItem(RARITY_KEY,JSON.stringify(list))}
  function loadO(){try{return JSON.parse(localStorage.getItem(ORDER_KEY))||{}}catch{return{}}}
  function saveO(o){localStorage.setItem(ORDER_KEY,JSON.stringify(o))}
  function rarity(id){return loadR().find(r=>r.id===id)||{id,name:id,icon:'✨',color:'#65d8ff'};}
  function owned(b){return VERSIONS.reduce((n,v)=>n+((b.versions?.[v]?.image||b.versions?.[v]?.count>0)?1:0),0) + (b.customSlots||[]).filter(s=>s.image||s.count>0).length}
  function data(v){return v||{image:'',count:0}}
  function isCustomRarity(id){return !DEFAULT_IDS.includes(id)}

  function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result);});}
  async function getState(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,'readonly');const rq=tx.objectStore(STORE_NAME).get(STATE_KEY);rq.onerror=()=>reject(rq.error);rq.onsuccess=()=>resolve(rq.result);});}
  async function putState(state){const db=await openDB();return new Promise((resolve,reject)=>{state.updatedAt=Date.now();const tx=db.transaction(STORE_NAME,'readwrite');const rq=tx.objectStore(STORE_NAME).put(state,STATE_KEY);rq.onerror=()=>reject(rq.error);rq.onsuccess=()=>resolve();});}
  async function updateState(fn){const s=await getState(); if(!s||!Array.isArray(s.brainrots)) return null; const res=await fn(s); await putState(s); if(window.renderAll) window.renderAll(); setTimeout(refresh,180); return res;}

  function css(){
    if(document.getElementById('blockManagerCssV8')) return;
    const s=document.createElement('style'); s.id='blockManagerCssV8';
    s.textContent=`
      .rarity-line{grid-template-columns:1fr 50px 42px 42px 42px!important}.rarity-delete{background:#6a2235!important;color:#ffd6df!important}.empty-rarity-box{border:2px dashed var(--section-color);border-radius:24px;padding:18px;margin-top:14px;background:rgba(3,8,23,.38);display:grid;gap:10px}.empty-rarity-box strong{font-size:22px}.empty-rarity-box button,.rarity-custom-btn{border:1px solid var(--section-color);background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.04));color:#fff;border-radius:18px;padding:12px 14px;font-weight:900}.rarity-custom-btn{margin-top:10px;width:100%}.block-panel{position:fixed;inset:auto 10px 12px 10px;z-index:9999;max-height:82vh;overflow:auto;background:#071026f7;border:1px solid #ffffff26;border-radius:28px;padding:18px;box-shadow:0 -20px 60px #000a}.block-panel.hidden{display:none}.block-panel h3{margin:0 0 6px;font-size:28px}.block-panel p{color:#c8d3ee;margin:0 0 14px}.block-row{display:grid;grid-template-columns:1fr 45px 45px;gap:8px;align-items:center;margin:9px 0;padding:10px;border-radius:18px;background:#121d3a;border:1px solid #ffffff1f}.block-row strong{font-size:16px}.block-row small{display:block;color:#b9c5e4;font-weight:700;margin-top:4px}.block-row button,.block-actions button,.block-mini-actions button{border:0;border-radius:14px;background:#263a66;color:#fff;font-weight:900;padding:12px}.block-row .danger,.block-actions .danger,.block-mini-actions .danger{background:#612235;color:#ffd4de}.block-mini-actions{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.block-actions{display:grid;gap:10px;margin-top:14px}.block-actions button{font-size:16px}.block-close{position:absolute;right:14px;top:14px;width:44px;height:44px;border-radius:50%;border:0;background:#ffffff16;color:#fff;font-weight:900;font-size:20px}.section-header{cursor:pointer}.section-header:after{content:'Touchez le titre pour personnaliser';display:block;color:#cbd7f0;font-size:12px;margin-top:6px;opacity:.75}.custom-slots-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}.custom-slot-btn{border:2px solid #65d8ff88;background:#0b1430;color:#fff;border-radius:22px;padding:10px;min-height:190px;font-weight:900}.custom-slot-btn img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:18px}.custom-slot-btn .slot-placeholder{height:130px;border-radius:18px;background:#17213c;display:flex;align-items:center;justify-content:center;flex-direction:column}.custom-slot-panel{position:fixed;inset:auto 12px 14px 12px;z-index:10000;background:#081126;border:1px solid #ffffff28;border-radius:26px;padding:18px;box-shadow:0 -20px 60px #000b}.custom-slot-panel.hidden{display:none}.custom-slot-panel h3{margin:0 48px 14px 0}.custom-slot-panel .slot-preview{min-height:190px}.custom-slot-panel .slot-preview img{max-width:100%;border-radius:20px}.case-row{display:grid;grid-template-columns:1fr 45px 45px;gap:8px;margin:8px 0;padding:10px;background:#101b38;border-radius:16px}.case-row button{border:0;border-radius:12px;background:#263a66;color:#fff;font-weight:900}.case-row .danger{background:#612235;color:#ffd4de}`;
    document.head.appendChild(s);
  }

  function ensureCustomInputs(){
    if(!document.getElementById('customGalleryInput')){
      const g=document.createElement('input'); g.type='file'; g.accept='image/*'; g.id='customGalleryInput'; g.style.display='none'; document.body.appendChild(g); g.addEventListener('change',handleCustomImage);
      const c=document.createElement('input'); c.type='file'; c.accept='image/*'; c.capture='environment'; c.id='customCameraInput'; c.style.display='none'; document.body.appendChild(c); c.addEventListener('change',handleCustomImage);
    }
  }

  function readFile(file){return new Promise((resolve)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file)})}
  async function handleCustomImage(e){
    const file=e.target.files?.[0]; e.target.value=''; if(!file||!currentCustomSlot) return;
    const img=await readFile(file);
    await updateState(s=>{const b=s.brainrots.find(x=>x.id===currentCustomSlot.blockId); if(!b)return; b.customSlots=b.customSlots||[]; const slot=b.customSlots.find(x=>x.id===currentCustomSlot.slotId); if(slot){slot.image=img; slot.count=Math.max(1,slot.count||1); slot.updatedAt=Date.now();}});
    openCustomSlot(currentCustomSlot.blockId,currentCustomSlot.slotId);
  }

  function slot(b,v,i){const d=data(b.versions?.[v]);const ok=d.image||d.count>0;return `<button class="slot-btn ${ok?'filled':''}" type="button" data-action="slot" data-id="${b.id}" data-version="${v}">${d.count>1?`<span class="slot-count">x${d.count}</span>`:''}<div class="slot-thumb">${ok&&d.image?`<img src="${d.image}" alt="${esc(b.name)}">`:`<div class="slot-placeholder"><strong>＋</strong><span>Image</span></div>`}</div><div class="version-caption">${VL[v]}<small>Case ${i+1}</small></div></button>`}
  function customSlotHtml(b,s,i){const ok=s.image||s.count>0;return `<button class="custom-slot-btn" type="button" data-custom-slot="${b.id}|${s.id}">${s.count>1?`<span class="slot-count">x${s.count}</span>`:''}${ok&&s.image?`<img src="${s.image}" alt="${esc(s.label)}">`:`<div class="slot-placeholder"><strong>＋</strong><span>Image</span></div>`}<div class="version-caption">${esc(s.label)}<small>Case perso ${i+1}</small></div></button>`}
  function card(b,r){const custom=b.customSlots||[];return `<article class="brainrot-card" data-id="${b.id}" style="--rarity-color:${r.color};--section-color:${r.color}"><div class="card-head"><div><div class="card-topline"><span class="rarity-badge" style="border-color:${r.color};color:#fff">${r.icon} ${esc(r.name)}</span><span class="source-badge">${b.source==='base'?'Base':'Perso'}</span><span class="section-meta">${owned(b)} / ${5+custom.length} cases</span></div><h3>${esc(b.name)}</h3><p class="card-sub">Ajoute une image depuis la galerie ou prends une photo.</p><div class="card-actions"><button class="mini-btn" type="button" data-action="edit" data-id="${b.id}">Modifier</button><button class="mini-btn danger" type="button" data-action="delete-brainrot" data-id="${b.id}">Supprimer</button></div></div><button class="favorite-btn ${b.favorite?'active':''}" type="button" data-action="favorite" data-id="${b.id}">${b.favorite?'★':'☆'}</button></div><div class="versions-grid">${VERSIONS.map((v,i)=>slot(b,v,i)).join('')}</div>${custom.length?`<div class="custom-slots-grid">${custom.map((s,i)=>customSlotHtml(b,s,i)).join('')}</div>`:''}</article>`}
  function section(r,items){const total=items.reduce((s,b)=>s+5+(b.customSlots?.length||0),0); const own=items.reduce((s,b)=>s+owned(b),0), pct=total?Math.round((own/total)*100):0;return `<section class="rarity-section rarity-added" data-rarity-section="${r.id}" style="--section-color:${r.color};border-color:${r.color}"><div class="section-header" data-open-blocks="${r.id}"><div><h3>${r.icon} ${esc(r.name)}</h3><div class="section-meta">${items.length} bloc${items.length>1?'s':''}</div></div><div class="section-progress"><div class="section-meta">${own} / ${total||5} cases</div><div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${r.color}"></div></div></div></div>${items.length?items.map(b=>card(b,r)).join(''):`<div class="empty-rarity-box"><strong>Aucun bloc dans ${esc(r.name)}</strong><span>Ajoute un premier bloc pour cette rareté.</span><button type="button" data-add-block="${r.id}">+ Ajouter un bloc</button></div>`}<button class="rarity-custom-btn" type="button" data-open-blocks="${r.id}">Personnaliser ${esc(r.name)}</button></section>`}

  function currentItems(){return (window.getFilteredBrainrots?window.getFilteredBrainrots():[])}
  function orderItems(id,items){const order=loadO()[id]||[];return [...items].sort((a,b)=>{const ia=order.indexOf(a.id),ib=order.indexOf(b.id);return (ia<0?9999:ia)-(ib<0?9999:ib) || a.name.localeCompare(b.name,'fr')})}

  function reorderExistingSections(){
    const orders=loadO();
    loadR().forEach(r=>{
      document.querySelectorAll('.rarity-section').forEach(sec=>{
        const title=norm(sec.querySelector('h3')?.textContent||''); if(!title.includes(norm(r.name))) return;
        sec.dataset.raritySection=r.id; sec.style.setProperty('--section-color',r.color); sec.style.borderColor=r.color;
        const order=orders[r.id]||[]; const cards=[...sec.querySelectorAll(':scope > .brainrot-card')]; if(order.length){cards.sort((a,b)=>{const ia=order.indexOf(a.dataset.id),ib=order.indexOf(b.dataset.id);return (ia<0?9999:ia)-(ib<0?9999:ib)}).forEach(c=>sec.appendChild(c));}
        if(!sec.querySelector(':scope > .rarity-custom-btn')) sec.insertAdjacentHTML('beforeend',`<button class="rarity-custom-btn" type="button" data-open-blocks="${r.id}">Personnaliser ${esc(r.name)}</button>`);
      });
    });
  }

  function addMissingSections(){
    const wrap=document.getElementById('collectionWrap'); if(!wrap) return;
    const all=currentItems();
    loadR().forEach(r=>{
      const exists=[...wrap.querySelectorAll('.rarity-section')].some(sec=>(sec.dataset.raritySection===r.id)||norm(sec.querySelector('h3')?.textContent||'').includes(norm(r.name)));
      const items=orderItems(r.id,all.filter(b=>b.rarity===r.id));
      if(!exists && (items.length || isCustomRarity(r.id))) wrap.insertAdjacentHTML('beforeend',section(r,items));
    });
    reorderExistingSections(); wire();
  }

  function wire(){
    document.querySelectorAll('[data-add-block]').forEach(b=>b.onclick=()=>openAdd(b.dataset.addBlock));
    document.querySelectorAll('[data-open-blocks]').forEach(b=>b.onclick=(e)=>{e.stopPropagation();openPanel(b.dataset.openBlocks)});
    document.querySelectorAll('[data-custom-slot]').forEach(b=>b.onclick=()=>{const [blockId,slotId]=b.dataset.customSlot.split('|');openCustomSlot(blockId,slotId)});
  }

  function openAdd(rid){const modal=document.getElementById('brainrotModal'); const select=document.getElementById('brainrotRarityInput'); const input=document.getElementById('brainrotNameInput'); if(select) select.value=rid; if(input){input.value=''; input.placeholder='Nom du nouveau bloc';} modal?.classList.remove('hidden'); setTimeout(()=>input?.focus(),80)}
  async function createBlock(rid,name='Bloc vide'){await updateState(s=>{const versions={};VERSIONS.forEach(v=>versions[v]={image:'',count:0,addedAt:null});const id=uid('brainrot');s.brainrots.unshift({id,name,rarity:rid,source:'custom',favorite:false,createdAt:Date.now(),versions,customSlots:[]});const o=loadO();o[rid]=[id,...(o[rid]||[])];saveO(o);});}
  async function makeBlock(rid){const r=rarity(rid); const name=prompt('Nom du nouveau bloc dans '+r.name); if(!name)return; await createBlock(rid,name.trim()); openPanel(rid)}
  async function makeEmptyBlock(rid){await createBlock(rid,'Bloc vide'); openPanel(rid)}
  async function renameBlock(bid){const name=prompt('Nouveau nom du bloc'); if(!name)return; await updateState(s=>{const b=s.brainrots.find(x=>x.id===bid); if(b)b.name=name.trim();});}
  async function duplicateBlock(bid,rid){await updateState(s=>{const b=s.brainrots.find(x=>x.id===bid); if(!b)return; const copy=JSON.parse(JSON.stringify(b));copy.id=uid('brainrot');copy.name=b.name+' copie';copy.createdAt=Date.now();s.brainrots.unshift(copy);const o=loadO();o[rid]=[copy.id,...(o[rid]||[])];saveO(o);}); openPanel(rid)}
  async function changeBlockRarity(bid,rid){const list=loadR(); const txt=list.map((r,i)=>`${i+1}. ${r.name}`).join('\n'); const n=Number(prompt('Déplacer vers quelle rareté ?\n'+txt)); const target=list[n-1]; if(!target)return; await updateState(s=>{const b=s.brainrots.find(x=>x.id===bid); if(b)b.rarity=target.id;}); const o=loadO(); o[rid]=(o[rid]||[]).filter(x=>x!==bid); o[target.id]=[bid,...(o[target.id]||[])]; saveO(o); openPanel(target.id)}
  async function deleteBlock(bid){if(!confirm('Supprimer ce bloc ?'))return; await updateState(s=>{s.brainrots=s.brainrots.filter(x=>x.id!==bid);}); const o=loadO(); Object.keys(o).forEach(k=>o[k]=o[k].filter(x=>x!==bid)); saveO(o);}
  function moveBlock(rid,bid,dir){const all=currentItems().filter(b=>b.rarity===rid).map(b=>b.id);const o=loadO();let arr=o[rid]?.length?o[rid]:all;arr=[...new Set([...arr,...all])];const i=arr.indexOf(bid),j=i+dir;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];o[rid]=arr;saveO(o); if(window.renderAll) window.renderAll(); setTimeout(()=>{refresh();openPanel(rid)},180)}

  async function addCase(bid){const label=prompt('Nom de la nouvelle case'); if(!label)return; await updateState(s=>{const b=s.brainrots.find(x=>x.id===bid); if(!b)return; b.customSlots=b.customSlots||[]; b.customSlots.push({id:uid('case'),label:label.trim(),image:'',count:0,createdAt:Date.now()});});}
  async function renameCase(bid,sid){const label=prompt('Nouveau nom de la case'); if(!label)return; await updateState(s=>{const b=s.brainrots.find(x=>x.id===bid); const sl=b?.customSlots?.find(x=>x.id===sid); if(sl)sl.label=label.trim();});}
  async function deleteCase(bid,sid){if(!confirm('Supprimer cette case personnalisée ?'))return; await updateState(s=>{const b=s.brainrots.find(x=>x.id===bid); if(b)b.customSlots=(b.customSlots||[]).filter(x=>x.id!==sid);});}

  function openPanel(rid){
    let p=document.getElementById('blockPanel'); if(!p){p=document.createElement('div');p.id='blockPanel';p.className='block-panel';document.body.appendChild(p)}
    const r=rarity(rid); const items=orderItems(rid,currentItems().filter(b=>b.rarity===rid));
    p.classList.remove('hidden');
    p.innerHTML=`<button class="block-close" type="button">×</button><h3>${r.icon} ${esc(r.name)}</h3><p>Ajoute, supprime, renomme, déplace les blocs et ajoute des cases personnalisées.</p>${items.length?items.map(b=>`<div class="block-row"><div><strong>${esc(b.name)}</strong><small>${owned(b)} / ${5+(b.customSlots?.length||0)} cases</small></div><button data-up-block="${b.id}">↑</button><button data-down-block="${b.id}">↓</button><div class="block-mini-actions"><button data-rename-block="${b.id}">Nom</button><button data-cases-block="${b.id}">Cases</button><button data-move-rarity="${b.id}">Rareté</button><button data-dupe-block="${b.id}">Copier</button><button class="danger" data-del-block="${b.id}">Suppr.</button></div></div>`).join(''):'<div class="empty-rarity-box"><strong>Aucun bloc</strong><span>Ajoute un premier bloc.</span></div>'}<div class="block-actions"><button type="button" data-new-block="${rid}">+ Ajouter un bloc nommé</button><button type="button" data-new-empty="${rid}">+ Ajouter un bloc vide</button><button class="danger" type="button" data-del-rarity="${rid}">Supprimer cette rareté</button></div>`;
    p.querySelector('.block-close').onclick=()=>p.classList.add('hidden');
    p.querySelector('[data-new-block]').onclick=()=>makeBlock(rid);
    p.querySelector('[data-new-empty]').onclick=()=>makeEmptyBlock(rid);
    p.querySelector('[data-del-rarity]').onclick=()=>deleteRarity(rid,p);
    p.querySelectorAll('[data-up-block]').forEach(b=>b.onclick=()=>moveBlock(rid,b.dataset.upBlock,-1));
    p.querySelectorAll('[data-down-block]').forEach(b=>b.onclick=()=>moveBlock(rid,b.dataset.downBlock,1));
    p.querySelectorAll('[data-rename-block]').forEach(b=>b.onclick=()=>renameBlock(b.dataset.renameBlock));
    p.querySelectorAll('[data-dupe-block]').forEach(b=>b.onclick=()=>duplicateBlock(b.dataset.dupeBlock,rid));
    p.querySelectorAll('[data-move-rarity]').forEach(b=>b.onclick=()=>changeBlockRarity(b.dataset.moveRarity,rid));
    p.querySelectorAll('[data-del-block]').forEach(b=>b.onclick=()=>deleteBlock(b.dataset.delBlock));
    p.querySelectorAll('[data-cases-block]').forEach(b=>b.onclick=()=>openCasesPanel(b.dataset.casesBlock,rid));
  }

  async function openCasesPanel(bid,rid){
    const s=await getState(); const b=s.brainrots.find(x=>x.id===bid); if(!b)return; b.customSlots=b.customSlots||[];
    let p=document.getElementById('blockPanel'); if(!p)return;
    p.innerHTML=`<button class="block-close" type="button">×</button><h3>Cases - ${esc(b.name)}</h3><p>Ajoute, renomme ou supprime les cases de ce bloc.</p>${b.customSlots.length?b.customSlots.map(sl=>`<div class="case-row"><strong>${esc(sl.label)}</strong><button data-rename-case="${sl.id}">Nom</button><button class="danger" data-del-case="${sl.id}">×</button></div>`).join(''):'<div class="empty-rarity-box"><strong>Aucune case personnalisée</strong><span>Les 5 cases de base restent disponibles.</span></div>'}<div class="block-actions"><button data-add-case="${bid}">+ Ajouter une case</button><button data-back-rarity="${rid}">Retour rareté</button></div>`;
    p.querySelector('.block-close').onclick=()=>p.classList.add('hidden');
    p.querySelector('[data-add-case]').onclick=()=>addCase(bid).then(()=>openCasesPanel(bid,rid));
    p.querySelector('[data-back-rarity]').onclick=()=>openPanel(rid);
    p.querySelectorAll('[data-rename-case]').forEach(x=>x.onclick=()=>renameCase(bid,x.dataset.renameCase).then(()=>openCasesPanel(bid,rid)));
    p.querySelectorAll('[data-del-case]').forEach(x=>x.onclick=()=>deleteCase(bid,x.dataset.delCase).then(()=>openCasesPanel(bid,rid)));
  }

  function openCustomSlot(blockId,slotId){
    currentCustomSlot={blockId,slotId};
    getState().then(s=>{
      const b=s.brainrots.find(x=>x.id===blockId); const sl=b?.customSlots?.find(x=>x.id===slotId); if(!sl)return;
      let p=document.getElementById('customSlotPanel'); if(!p){p=document.createElement('div');p.id='customSlotPanel';p.className='custom-slot-panel';document.body.appendChild(p)}
      p.classList.remove('hidden');
      p.innerHTML=`<button class="block-close" type="button">×</button><h3>${esc(sl.label)}</h3><div class="slot-preview">${sl.image?`<img src="${sl.image}" alt="${esc(sl.label)}">`:'<div class="slot-placeholder"><strong>＋</strong><span>Image</span></div>'}</div><div class="block-actions"><button id="customGalleryBtn">Galerie</button><button id="customCameraBtn">Caméra</button><button id="customPlusBtn">Quantité +</button><button id="customMinusBtn">Quantité -</button><button class="danger" id="customClearBtn">Vider la case</button></div>`;
      p.querySelector('.block-close').onclick=()=>p.classList.add('hidden');
      document.getElementById('customGalleryBtn').onclick=()=>document.getElementById('customGalleryInput').click();
      document.getElementById('customCameraBtn').onclick=()=>document.getElementById('customCameraInput').click();
      document.getElementById('customPlusBtn').onclick=()=>updateCustomCount(blockId,slotId,1);
      document.getElementById('customMinusBtn').onclick=()=>updateCustomCount(blockId,slotId,-1);
      document.getElementById('customClearBtn').onclick=()=>clearCustomSlot(blockId,slotId);
    });
  }

  async function updateCustomCount(bid,sid,d){await updateState(s=>{const b=s.brainrots.find(x=>x.id===bid);const sl=b?.customSlots?.find(x=>x.id===sid);if(sl){sl.count=Math.max(0,(sl.count||0)+d);sl.updatedAt=Date.now();}});openCustomSlot(bid,sid)}
  async function clearCustomSlot(bid,sid){await updateState(s=>{const b=s.brainrots.find(x=>x.id===bid);const sl=b?.customSlots?.find(x=>x.id===sid);if(sl){sl.image='';sl.count=0;}});openCustomSlot(bid,sid)}

  function deleteRarity(id,panel){if(!confirm('Supprimer cette rareté ? Les blocs déjà dedans resteront dans leurs données mais ne seront plus classés ici.'))return; saveR(loadR().filter(x=>x.id!==id)); const o=loadO(); delete o[id]; saveO(o); panel?.classList.add('hidden'); document.querySelectorAll(`[data-r="${id}"],[data-rarity-section="${id}"]`).forEach(x=>x.remove()); toast('Rareté supprimée.'); setTimeout(()=>location.reload(),300)}
  function patchRarityPanel(){const panel=document.getElementById('rarityPanel'); if(!panel) return; panel.querySelectorAll('.rarity-line').forEach(line=>{if(line.querySelector('.rarity-delete'))return; const input=line.querySelector('[data-name]'); const id=input?.dataset.name; if(!id)return; const btn=document.createElement('button'); btn.type='button'; btn.className='rarity-delete'; btn.textContent='×'; btn.onclick=()=>deleteRarity(id); line.appendChild(btn);});}

  function refresh(){addMissingSections();patchRarityPanel();ensureCustomInputs();}
  function boot(){css();ensureCustomInputs();setInterval(refresh,850);setTimeout(refresh,900)}
  document.addEventListener('DOMContentLoaded',boot);
})();
