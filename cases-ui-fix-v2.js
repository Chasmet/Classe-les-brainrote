(() => {
  const KEY = 'brainrot_cases_manager_v2';
  const BASE = [
    { id: 'normal', label: 'Normal', type: 'base' },
    { id: 'diamond', label: 'Diamant', type: 'base' },
    { id: 'gold', label: 'Or', type: 'base' },
    { id: 'divine', label: 'Divin', type: 'base' },
    { id: 'rainbow', label: 'Arc-en-ciel', type: 'base' }
  ];
  let activeBlock = null;
  let activeCase = null;
  let dragged = null;

  const esc = (v) => String(v || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  const uid = () => 'case_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
  }
  function saveAll(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
  function getConfig(blockId) {
    const all = loadAll();
    if (!all[blockId]) all[blockId] = { cases: BASE.map(x => ({ ...x })), data: {} };
    BASE.forEach(base => {
      if (!all[blockId].cases.some(x => x.id === base.id)) all[blockId].cases.push({ ...base });
    });
    saveAll(all);
    return all[blockId];
  }
  function setConfig(blockId, config) {
    const all = loadAll();
    all[blockId] = config;
    saveAll(all);
  }
  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return alert(msg);
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), 2200);
  }

  function css() {
    if (document.getElementById('casesUiFixV2Css')) return;
    const s = document.createElement('style');
    s.id = 'casesUiFixV2Css';
    s.textContent = `
      .case-manager-btn { display:none !important; }
      .case-add-btn,.case-move-btn{border:1px solid rgba(101,216,255,.55);background:linear-gradient(135deg,rgba(101,216,255,.22),rgba(182,113,255,.18));color:#fff;border-radius:16px;padding:10px 14px;font-weight:900;margin:6px 6px 0 0;}
      .case-add-btn{background:linear-gradient(135deg,#35d7ff55,#8c6dff44)!important;}
      .cases-panel-v2{position:fixed;left:10px;right:10px;bottom:12px;z-index:10080;max-height:84vh;overflow:auto;background:#071026fa;border:1px solid rgba(255,255,255,.22);border-radius:28px;padding:18px;box-shadow:0 -22px 70px rgba(0,0,0,.72);}
      .cases-panel-v2.hidden{display:none;}
      .cases-panel-v2 h3{margin:0 52px 6px 0;font-size:28px;line-height:1.05;}
      .cases-panel-v2 p{margin:0 0 14px;color:#cbd6f2;font-weight:600;}
      .cases-close-v2{position:absolute;right:14px;top:14px;width:46px;height:46px;border-radius:50%;border:0;background:#ffffff18;color:#fff;font-size:22px;font-weight:900;}
      .cases-row-v2{display:grid;grid-template-columns:36px 1fr 48px 48px;gap:8px;align-items:center;margin:9px 0;padding:10px;border-radius:18px;background:#101b38;border:1px solid rgba(255,255,255,.14);touch-action:none;}
      .cases-row-v2.dragging{opacity:.45;transform:scale(.98);}
      .cases-handle-v2{font-size:22px;text-align:center;cursor:grab;}
      .cases-row-v2 input{min-width:0;border:1px solid rgba(255,255,255,.16);background:#081229;color:#fff;border-radius:14px;padding:12px;font-weight:900;}
      .cases-row-v2 button,.cases-actions-v2 button,.case-edit-v2 button{border:0;border-radius:14px;background:#263a66;color:#fff;font-weight:900;padding:12px;}
      .cases-sub-v2{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
      .cases-row-v2 .danger,.cases-actions-v2 .danger,.case-edit-v2 .danger{background:#6c243c;color:#ffd6df;}
      .cases-actions-v2{display:grid;gap:10px;margin-top:14px;}
      .custom-case-card-v2{border:2px solid rgba(101,216,255,.55);background:#081126;color:#fff;border-radius:22px;padding:10px;min-height:190px;font-weight:900;}
      .custom-case-card-v2 img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:18px;}
      .custom-case-card-v2 .slot-placeholder{height:130px;border-radius:18px;background:#17213c;display:flex;align-items:center;justify-content:center;flex-direction:column;}
      .case-edit-v2{position:fixed;left:12px;right:12px;bottom:14px;z-index:10100;background:#071026;border:1px solid rgba(255,255,255,.22);border-radius:26px;padding:18px;box-shadow:0 -22px 70px rgba(0,0,0,.75);}
      .case-edit-v2.hidden{display:none;}
      .case-edit-v2 h3{margin:0 52px 12px 0;font-size:26px;}
      .case-preview-v2{min-height:190px;display:grid;place-items:center;background:#111c3a;border-radius:20px;margin:12px 0;overflow:hidden;color:#fff;font-weight:900;}
      .case-preview-v2 img{width:100%;border-radius:20px;}
      .case-edit-actions-v2{display:grid;gap:10px;}
    `;
    document.head.appendChild(s);
  }

  function ensureInputs() {
    if (document.getElementById('caseGalleryV2')) return;
    const g = document.createElement('input');
    g.id = 'caseGalleryV2';
    g.type = 'file';
    g.accept = 'image/*';
    g.style.display = 'none';
    g.onchange = onImage;
    document.body.appendChild(g);
    const c = document.createElement('input');
    c.id = 'caseCameraV2';
    c.type = 'file';
    c.accept = 'image/*';
    c.capture = 'environment';
    c.style.display = 'none';
    c.onchange = onImage;
    document.body.appendChild(c);
  }

  function readFile(file) {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });
  }

  async function onImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeBlock || !activeCase) return;
    const img = await readFile(file);
    const cfg = getConfig(activeBlock);
    cfg.data[activeCase] = cfg.data[activeCase] || {};
    cfg.data[activeCase].image = img;
    cfg.data[activeCase].count = Math.max(1, cfg.data[activeCase].count || 1);
    setConfig(activeBlock, cfg);
    applyCard(activeBlock);
    openCaseEditor(activeBlock, activeCase);
  }

  function card(blockId) { return document.querySelector(`.brainrot-card[data-id="${blockId}"]`); }
  function baseBtn(cardEl, id) { return cardEl.querySelector(`[data-action="slot"][data-version="${id}"]`); }

  function customHtml(blockId, item, index, data) {
    const ok = data?.image || data?.count > 0;
    return `
      <button class="custom-case-card-v2" type="button" data-open-custom-case-v2="${blockId}|${item.id}">
        ${data?.count > 1 ? `<span class="slot-count">x${data.count}</span>` : ''}
        ${ok && data.image ? `<img src="${data.image}" alt="${esc(item.label)}">` : `<div class="slot-placeholder"><strong>＋</strong><span>Image</span></div>`}
        <div class="version-caption">${esc(item.label)}<small>Case ${index + 1}</small></div>
      </button>
    `;
  }

  function applyCard(blockId) {
    const c = card(blockId);
    if (!c) return;
    const grid = c.querySelector('.versions-grid');
    if (!grid) return;
    const cfg = getConfig(blockId);
    const baseButtons = {};
    BASE.forEach(b => {
      const btn = baseBtn(c, b.id);
      if (btn) baseButtons[b.id] = btn;
    });
    grid.querySelectorAll('.custom-case-card-v2').forEach(x => x.remove());
    cfg.cases.forEach((item, index) => {
      if (item.type === 'base') {
        const btn = baseButtons[item.id];
        if (btn) {
          const caption = btn.querySelector('.version-caption');
          if (caption) caption.innerHTML = `${esc(item.label)}<small>Case ${index + 1}</small>`;
          grid.appendChild(btn);
        }
      } else {
        grid.insertAdjacentHTML('beforeend', customHtml(blockId, item, index, cfg.data[item.id] || {}));
      }
    });
    grid.querySelectorAll('[data-open-custom-case-v2]').forEach(btn => {
      btn.onclick = () => {
        const [b, cs] = btn.dataset.openCustomCaseV2.split('|');
        openCaseEditor(b, cs);
      };
    });
  }

  function addButtons() {
    document.querySelectorAll('.brainrot-card').forEach(c => {
      const blockId = c.dataset.id;
      const actions = c.querySelector('.card-actions');
      if (!blockId || !actions || actions.querySelector('.case-add-btn')) return;
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'case-add-btn';
      add.textContent = '+ Ajouter une case';
      add.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        addCase(blockId);
      };
      const move = document.createElement('button');
      move.type = 'button';
      move.className = 'case-move-btn';
      move.textContent = 'Déplacer cases';
      move.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        openPanel(blockId);
      };
      actions.appendChild(add);
      actions.appendChild(move);
    });
  }

  function addCase(blockId) {
    const label = prompt('Nom de la nouvelle case :');
    if (!label || !label.trim()) return;
    const cfg = getConfig(blockId);
    const id = uid();
    cfg.cases.push({ id, label: label.trim(), type: 'custom' });
    cfg.data[id] = { image: '', count: 0 };
    setConfig(blockId, cfg);
    applyCard(blockId);
    toast('Case ajoutée.');
  }

  function openPanel(blockId) {
    activeBlock = blockId;
    const c = card(blockId);
    const title = c?.querySelector('h3')?.textContent || 'Bloc';
    const cfg = getConfig(blockId);
    let p = document.getElementById('casesPanelV2');
    if (!p) {
      p = document.createElement('div');
      p.id = 'casesPanelV2';
      p.className = 'cases-panel-v2';
      document.body.appendChild(p);
    }
    p.classList.remove('hidden');
    p.innerHTML = `
      <button class="cases-close-v2" type="button">×</button>
      <h3>Déplacer cases</h3>
      <p>${esc(title)} - reste appuyé pour glisser, ou utilise ↑ ↓.</p>
      ${cfg.cases.map(item => `
        <div class="cases-row-v2" draggable="true" data-case-v2="${item.id}">
          <div class="cases-handle-v2">☰</div>
          <input value="${esc(item.label)}" data-case-name-v2="${item.id}">
          <button type="button" data-up-case-v2="${item.id}">↑</button>
          <button type="button" data-down-case-v2="${item.id}">↓</button>
          <div class="cases-sub-v2">
            <button type="button" data-open-case-v2="${item.id}">Image</button>
            <button type="button" data-copy-case-v2="${item.id}">Copier</button>
            ${item.type === 'custom' ? `<button class="danger" type="button" data-del-case-v2="${item.id}">Suppr.</button>` : '<button type="button" disabled>Base</button>'}
          </div>
        </div>
      `).join('')}
      <div class="cases-actions-v2">
        <button type="button" id="addCaseInsideV2">+ Ajouter une case</button>
        <button type="button" id="resetCasesV2">Remettre par défaut</button>
      </div>
    `;
    p.querySelector('.cases-close-v2').onclick = () => p.classList.add('hidden');
    p.querySelector('#addCaseInsideV2').onclick = () => { addCase(blockId); openPanel(blockId); };
    p.querySelector('#resetCasesV2').onclick = () => reset(blockId);
    p.querySelectorAll('[data-case-name-v2]').forEach(input => input.onchange = () => rename(blockId, input.dataset.caseNameV2, input.value));
    p.querySelectorAll('[data-up-case-v2]').forEach(btn => btn.onclick = () => move(blockId, btn.dataset.upCaseV2, -1));
    p.querySelectorAll('[data-down-case-v2]').forEach(btn => btn.onclick = () => move(blockId, btn.dataset.downCaseV2, 1));
    p.querySelectorAll('[data-del-case-v2]').forEach(btn => btn.onclick = () => del(blockId, btn.dataset.delCaseV2));
    p.querySelectorAll('[data-copy-case-v2]').forEach(btn => btn.onclick = () => copy(blockId, btn.dataset.copyCaseV2));
    p.querySelectorAll('[data-open-case-v2]').forEach(btn => btn.onclick = () => openCaseEditor(blockId, btn.dataset.openCaseV2));
    p.querySelectorAll('.cases-row-v2').forEach(row => {
      row.ondragstart = () => { dragged = row.dataset.caseV2; row.classList.add('dragging'); };
      row.ondragend = () => row.classList.remove('dragging');
      row.ondragover = (e) => e.preventDefault();
      row.ondrop = () => drop(blockId, dragged, row.dataset.caseV2);
      row.onpointerdown = () => { row._press = setTimeout(() => toast('Glisse la ligne ou utilise ↑ ↓.'), 450); };
      row.onpointerup = () => clearTimeout(row._press);
      row.onpointercancel = () => clearTimeout(row._press);
    });
  }

  function rename(blockId, id, label) {
    const cfg = getConfig(blockId);
    const item = cfg.cases.find(x => x.id === id);
    if (item) item.label = label.trim() || item.label;
    setConfig(blockId, cfg);
    applyCard(blockId);
    openPanel(blockId);
  }
  function move(blockId, id, delta) {
    const cfg = getConfig(blockId);
    const i = cfg.cases.findIndex(x => x.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= cfg.cases.length) return;
    [cfg.cases[i], cfg.cases[j]] = [cfg.cases[j], cfg.cases[i]];
    setConfig(blockId, cfg);
    applyCard(blockId);
    openPanel(blockId);
  }
  function drop(blockId, fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    const cfg = getConfig(blockId);
    const from = cfg.cases.findIndex(x => x.id === fromId);
    const to = cfg.cases.findIndex(x => x.id === toId);
    if (from < 0 || to < 0) return;
    const [item] = cfg.cases.splice(from, 1);
    cfg.cases.splice(to, 0, item);
    setConfig(blockId, cfg);
    applyCard(blockId);
    openPanel(blockId);
  }
  function copy(blockId, id) {
    const cfg = getConfig(blockId);
    const item = cfg.cases.find(x => x.id === id);
    if (!item) return;
    const newId = uid();
    cfg.cases.push({ id: newId, label: item.label + ' copie', type: 'custom' });
    cfg.data[newId] = { image: '', count: 0 };
    setConfig(blockId, cfg);
    applyCard(blockId);
    openPanel(blockId);
  }
  function del(blockId, id) {
    const cfg = getConfig(blockId);
    const item = cfg.cases.find(x => x.id === id);
    if (!item || item.type !== 'custom') return toast('Les cases de base ne se suppriment pas.');
    if (!confirm('Supprimer cette case ?')) return;
    cfg.cases = cfg.cases.filter(x => x.id !== id);
    delete cfg.data[id];
    setConfig(blockId, cfg);
    applyCard(blockId);
    openPanel(blockId);
  }
  function reset(blockId) {
    if (!confirm('Remettre les cases de ce bloc par défaut ?')) return;
    const all = loadAll();
    delete all[blockId];
    saveAll(all);
    applyCard(blockId);
    openPanel(blockId);
  }

  function openCaseEditor(blockId, id) {
    activeBlock = blockId;
    activeCase = id;
    const cfg = getConfig(blockId);
    const item = cfg.cases.find(x => x.id === id);
    const data = cfg.data[id] || {};
    let p = document.getElementById('caseEditV2');
    if (!p) {
      p = document.createElement('div');
      p.id = 'caseEditV2';
      p.className = 'case-edit-v2';
      document.body.appendChild(p);
    }
    p.classList.remove('hidden');
    p.innerHTML = `
      <button class="cases-close-v2" type="button">×</button>
      <h3>${esc(item?.label || 'Case')}</h3>
      <div class="case-preview-v2">${data.image ? `<img src="${data.image}" alt="${esc(item?.label)}">` : '<strong>＋ Image</strong>'}</div>
      <div class="case-edit-actions-v2">
        <button type="button" id="galleryCaseV2">Galerie</button>
        <button type="button" id="cameraCaseV2">Caméra</button>
        <button type="button" id="plusCaseV2">Quantité +</button>
        <button type="button" id="minusCaseV2">Quantité -</button>
        <button class="danger" type="button" id="clearCaseV2">Vider la case</button>
      </div>
    `;
    p.querySelector('.cases-close-v2').onclick = () => p.classList.add('hidden');
    p.querySelector('#galleryCaseV2').onclick = () => document.getElementById('caseGalleryV2').click();
    p.querySelector('#cameraCaseV2').onclick = () => document.getElementById('caseCameraV2').click();
    p.querySelector('#plusCaseV2').onclick = () => count(1);
    p.querySelector('#minusCaseV2').onclick = () => count(-1);
    p.querySelector('#clearCaseV2').onclick = () => clearCase();
  }

  function count(delta) {
    const cfg = getConfig(activeBlock);
    cfg.data[activeCase] = cfg.data[activeCase] || {};
    cfg.data[activeCase].count = Math.max(0, (cfg.data[activeCase].count || 0) + delta);
    setConfig(activeBlock, cfg);
    applyCard(activeBlock);
    openCaseEditor(activeBlock, activeCase);
  }
  function clearCase() {
    const cfg = getConfig(activeBlock);
    cfg.data[activeCase] = { image: '', count: 0 };
    setConfig(activeBlock, cfg);
    applyCard(activeBlock);
    openCaseEditor(activeBlock, activeCase);
  }

  function refresh() {
    addButtons();
    document.querySelectorAll('.brainrot-card').forEach(c => applyCard(c.dataset.id));
  }
  function boot() {
    css();
    ensureInputs();
    setInterval(refresh, 600);
    setTimeout(refresh, 800);
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
