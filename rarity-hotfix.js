(() => {
  const KEY = 'brainrot_rarities_v6';
  const defaults = [
    ['common','Commun','⚪','#9aa5b8'], ['rare','Rare','🔵','#42b8ff'], ['epic','Épique','🟣','#a96cff'], ['mythic','Mythique','💗','#ff5ecb'], ['legendary','Légendaire','🟡','#ffd34d'], ['ultra_legendary','Ultra légendaire','🔥','#ff7a3d'], ['secret','Secret','🟢','#28f2a3']
  ];
  let active = 'all';

  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || defaults.map(toObj); } catch { return defaults.map(toObj); } }
  function save(list){ localStorage.setItem(KEY, JSON.stringify(list)); }
  function toObj(x){ return {id:x[0], name:x[1], icon:x[2], color:x[3]}; }
  function esc(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }

  function css(){
    const s=document.createElement('style');
    s.textContent=`
      .auth-tab[data-auth-tab=close]{font-size:0!important}
      .auth-tab[data-auth-tab=close]:after{content:'Admi';font-size:22px}
      .rarity-tools{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
      .rarity-tools button{border:1px solid #5bd8ff;background:linear-gradient(135deg,#263c68,#442866);color:white;border-radius:22px;padding:14px 18px;font-weight:900}
      .rarity-panel{display:none;margin-top:14px;padding:14px;border-radius:24px;background:#0b1228cc;border:1px solid #ffffff22}
      .rarity-panel.open{display:block}
      .rarity-line{display:grid;grid-template-columns:1fr 50px 42px 42px;gap:7px;margin:8px 0}
      .rarity-line input{min-width:0;border:1px solid #ffffff22;background:#101a35;color:#fff;border-radius:14px;padding:10px;font-weight:800}
      .rarity-line button{border:0;border-radius:12px;background:#26385f;color:white;font-weight:900}
      .chip-row#rarityChips .chip{border-width:2px!important;background:linear-gradient(135deg,var(--c),#1c2445)!important;border-color:var(--c)!important;box-shadow:0 0 18px color-mix(in srgb,var(--c) 35%,transparent)!important}
      .chip-row#rarityChips .chip.active{box-shadow:0 0 0 2px #fff,0 0 26px var(--c)!important}
      .rarity-section{border-color:var(--section-color,#ffffff55)!important;background:linear-gradient(145deg,#131b3a,#0a1025)!important}
      .rarity-section h3{color:var(--section-color,#fff)!important}
      .rarity-section.hidden-by-rarity{display:none!important}
    `;
    document.head.appendChild(s);
  }

  function selectOptions(){
    const html=load().map(r=>`<option value="${r.id}">${r.icon} ${esc(r.name)}</option>`).join('');
    ['brainrotRarityInput','bulkRarityInput','editBrainrotRarityInput'].forEach(id=>{const el=document.getElementById(id); if(el) el.innerHTML=html;});
  }

  function getActiveRarity(){ return load().find(r => r.id === active); }

  function applyFilter(){
    const rarity = getActiveRarity();
    const activeName = rarity ? norm(rarity.name) : 'all';
    document.querySelectorAll('.rarity-section').forEach(section => {
      const title = norm(section.querySelector('.section-header h3, h3')?.textContent || '');
      const match = active === 'all' || title.includes(activeName);
      section.classList.toggle('hidden-by-rarity', !match);
      const current = load().find(r => title.includes(norm(r.name)));
      if (current) section.style.setProperty('--section-color', current.color);
    });
  }

  function repaintSections(){
    document.querySelectorAll('.rarity-section').forEach(section => {
      const title = norm(section.querySelector('.section-header h3, h3')?.textContent || '');
      const rarity = load().find(r => title.includes(norm(r.name)));
      if (rarity) section.style.setProperty('--section-color', rarity.color);
    });
    applyFilter();
  }

  function chips(){
    const box=document.getElementById('rarityChips');
    if(!box) return;
    const list=load();
    box.innerHTML=`<button class="chip ${active==='all'?'active':''}" style="--c:#65d8ff" data-r="all">Toutes</button>`+list.map(r=>`<button class="chip ${active===r.id?'active':''}" style="--c:${r.color}" data-r="${r.id}" draggable="true">${r.icon} ${esc(r.name)}</button>`).join('');
    box.querySelectorAll('[data-r]').forEach(b=>{
      b.onclick=()=>{
        active=b.dataset.r;
        chips();
        if (window.renderCollection) window.renderCollection();
        setTimeout(applyFilter, 60);
        setTimeout(applyFilter, 180);
      };
      b.ondragstart=()=>window.__dragR=b.dataset.r;
      b.ondragover=e=>e.preventDefault();
      b.ondrop=()=>move(window.__dragR,b.dataset.r);
    });
    setTimeout(applyFilter, 50);
  }

  function move(a,b){
    if(!a||!b||a===b||a==='all'||b==='all')return;
    const list=load();
    const i=list.findIndex(x=>x.id===a), j=list.findIndex(x=>x.id===b);
    if(i<0||j<0)return;
    const item=list.splice(i,1)[0];
    list.splice(j,0,item);
    save(list);
    chips();
    panel();
    if (window.renderCollection) window.renderCollection();
    setTimeout(applyFilter, 100);
  }

  function tools(){
    const group=document.querySelector('#rarityChips')?.closest('.control-group');
    if(!group||document.getElementById('rarityPanel'))return;
    group.insertAdjacentHTML('beforeend','<div class="rarity-tools"><button id="addRarity">+ Ajouter rareté</button><button id="editRarity">Modifier / déplacer</button></div><div id="rarityPanel" class="rarity-panel"></div>');
    document.getElementById('addRarity').onclick=()=>{
      const name=prompt('Nom de la nouvelle rareté');
      if(!name)return;
      const list=load();
      list.push({id:'custom_'+Date.now(),name:name.trim(),icon:'✨',color:['#00e5ff','#ff5ecb','#ffd34d','#28f2a3','#ff7a3d'][list.length%5]});
      save(list);
      selectOptions(); chips(); panel();
    };
    document.getElementById('editRarity').onclick=()=>document.getElementById('rarityPanel').classList.toggle('open');
  }

  function panel(){
    const p=document.getElementById('rarityPanel');
    if(!p)return;
    p.innerHTML='<h3>Raretés</h3><p>Modifie le nom, la couleur, ou utilise ↑ ↓ pour changer l’ordre.</p>'+load().map(r=>`<div class="rarity-line"><input data-name="${r.id}" value="${esc(r.name)}"><input data-color="${r.id}" type="color" value="${r.color}"><button data-up="${r.id}">↑</button><button data-down="${r.id}">↓</button></div>`).join('');
    p.querySelectorAll('input').forEach(i=>i.onchange=saveEdits);
    p.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>bump(b.dataset.up,-1));
    p.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>bump(b.dataset.down,1));
  }

  function saveEdits(){
    const list=load().map(r=>({id:r.id,icon:r.icon,name:document.querySelector(`[data-name="${r.id}"]`)?.value||r.name,color:document.querySelector(`[data-color="${r.id}"]`)?.value||r.color}));
    save(list);
    selectOptions(); chips(); repaintSections();
  }

  function bump(id,d){
    const list=load();
    const i=list.findIndex(r=>r.id===id), j=i+d;
    if(j<0||j>=list.length)return;
    [list[i],list[j]]=[list[j],list[i]];
    save(list); chips(); panel(); repaintSections();
  }

  function watchCollection(){
    const target=document.getElementById('collectionWrap');
    if(!target) return;
    const obs=new MutationObserver(()=>setTimeout(repaintSections, 20));
    obs.observe(target,{childList:true,subtree:true});
  }

  function boot(){
    css();
    document.querySelector('[data-auth-tab=close]')&&(document.querySelector('[data-auth-tab=close]').textContent='Admi');
    document.querySelector('#authClosePane h2')&&(document.querySelector('#authClosePane h2').textContent='Accès admin et proches');
    selectOptions(); chips(); tools(); panel(); watchCollection(); repaintSections();
    ['openAddModalTop','openBulkModalTop','openAddModalFab'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(selectOptions,50)));
    document.getElementById('sortRarityBtn')?.addEventListener('click',()=>setTimeout(applyFilter,100));
    document.getElementById('sortNameBtn')?.addEventListener('click',()=>setTimeout(applyFilter,100));
    document.getElementById('showMissingBtn')?.addEventListener('click',()=>setTimeout(applyFilter,100));
    document.getElementById('searchInput')?.addEventListener('input',()=>setTimeout(applyFilter,100));
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,800));
})();
