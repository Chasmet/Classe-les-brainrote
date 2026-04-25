(() => {
  const CASES_KEY = 'brainrot_cases_manager_v1';
  const DEFAULT_CASES = [
    { id: 'normal', label: 'Normal', type: 'base' },
    { id: 'diamond', label: 'Diamant', type: 'base' },
    { id: 'gold', label: 'Or', type: 'base' },
    { id: 'divine', label: 'Divin', type: 'base' },
    { id: 'rainbow', label: 'Arc-en-ciel', type: 'base' }
  ];
  let activeBlockId = null;
  let activeCaseId = null;
  let draggedCaseId = null;

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }

  function uid(prefix = 'case') {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(CASES_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function saveAll(data) {
    localStorage.setItem(CASES_KEY, JSON.stringify(data));
  }

  function getConfig(blockId) {
    const all = loadAll();
    if (!all[blockId]) {
      all[blockId] = { cases: DEFAULT_CASES.map(x => ({ ...x })), data: {} };
      saveAll(all);
    }
    DEFAULT_CASES.forEach((base) => {
      if (!all[blockId].cases.some(item => item.id === base.id)) {
        all[blockId].cases.push({ ...base });
      }
    });
    return all[blockId];
  }

  function setConfig(blockId, config) {
    const all = loadAll();
    all[blockId] = config;
    saveAll(all);
  }

  function toast(message) {
    const el = document.getElementById('toast');
    if (!el) return alert(message);
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  function addStyle() {
    if (document.getElementById('casesManagerCss')) return;
    const style = document.createElement('style');
    style.id = 'casesManagerCss';
    style.textContent = `
      .case-manager-btn {
        border: 1px solid rgba(101,216,255,.55);
        background: linear-gradient(135deg, rgba(101,216,255,.2), rgba(182,113,255,.18));
        color: #fff;
        border-radius: 16px;
        padding: 10px 14px;
        font-weight: 900;
        margin-left: 8px;
      }
      .case-panel {
        position: fixed;
        left: 10px;
        right: 10px;
        bottom: 12px;
        z-index: 10050;
        max-height: 84vh;
        overflow: auto;
        background: rgba(7, 16, 38, .98);
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 28px;
        padding: 18px;
        box-shadow: 0 -20px 60px rgba(0,0,0,.65);
      }
      .case-panel.hidden { display: none; }
      .case-panel h3 { margin: 0 54px 6px 0; font-size: 28px; }
      .case-panel p { margin: 0 0 14px; color: #c8d3ee; }
      .case-close {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 0;
        background: rgba(255,255,255,.12);
        color: #fff;
        font-size: 22px;
        font-weight: 900;
      }
      .case-manager-row {
        display: grid;
        grid-template-columns: 34px 1fr 46px 46px;
        gap: 8px;
        align-items: center;
        margin: 9px 0;
        padding: 10px;
        border-radius: 18px;
        background: #111c3a;
        border: 1px solid rgba(255,255,255,.14);
        touch-action: none;
      }
      .case-manager-row.dragging { opacity: .45; transform: scale(.98); }
      .case-handle { font-size: 22px; text-align: center; cursor: grab; }
      .case-manager-row input {
        min-width: 0;
        border: 1px solid rgba(255,255,255,.16);
        background: #09122a;
        color: #fff;
        border-radius: 14px;
        padding: 12px;
        font-weight: 900;
      }
      .case-manager-row button,
      .case-actions button,
      .case-edit-panel button {
        border: 0;
        border-radius: 14px;
        background: #263a66;
        color: #fff;
        font-weight: 900;
        padding: 12px;
      }
      .case-manager-row .danger,
      .case-actions .danger,
      .case-edit-panel .danger { background: #68243a; color: #ffd6df; }
      .case-manager-subactions {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .case-actions { display: grid; gap: 10px; margin-top: 14px; }
      .case-edit-panel {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 14px;
        z-index: 10070;
        background: #071026;
        border: 1px solid rgba(255,255,255,.2);
        border-radius: 26px;
        padding: 18px;
        box-shadow: 0 -20px 60px rgba(0,0,0,.7);
      }
      .case-edit-panel.hidden { display: none; }
      .case-preview-box {
        min-height: 190px;
        display: grid;
        place-items: center;
        background: #111c3a;
        border-radius: 20px;
        margin: 12px 0;
        overflow: hidden;
      }
      .case-preview-box img { width: 100%; border-radius: 20px; }
      .case-custom-slot {
        border: 2px solid rgba(101,216,255,.55);
        background: #081126;
        color: #fff;
        border-radius: 22px;
        padding: 10px;
        min-height: 190px;
        font-weight: 900;
      }
      .case-custom-slot img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; border-radius: 18px; }
      .case-custom-slot .slot-placeholder { height: 130px; border-radius: 18px; background: #17213c; display: flex; align-items: center; justify-content: center; flex-direction: column; }
    `;
    document.head.appendChild(style);
  }

  function getCard(blockId) {
    return document.querySelector(`.brainrot-card[data-id="${blockId}"]`);
  }

  function baseButton(card, id) {
    return card.querySelector(`[data-action="slot"][data-version="${id}"]`);
  }

  function customButtonHtml(blockId, item, index, data) {
    const image = data?.image || '';
    const count = data?.count || 0;
    const ok = image || count > 0;
    return `
      <button class="case-custom-slot" type="button" data-custom-case-open="${blockId}|${item.id}">
        ${count > 1 ? `<span class="slot-count">x${count}</span>` : ''}
        ${ok && image ? `<img src="${image}" alt="${esc(item.label)}">` : `<div class="slot-placeholder"><strong>＋</strong><span>Image</span></div>`}
        <div class="version-caption">${esc(item.label)}<small>Case perso ${index + 1}</small></div>
      </button>
    `;
  }

  function applyCasesToCard(blockId) {
    const card = getCard(blockId);
    if (!card) return;
    const grid = card.querySelector('.versions-grid');
    if (!grid) return;

    const config = getConfig(blockId);
    const baseMap = {};
    DEFAULT_CASES.forEach(item => {
      const btn = baseButton(card, item.id);
      if (btn) baseMap[item.id] = btn;
    });

    grid.querySelectorAll('.case-custom-slot').forEach(el => el.remove());

    config.cases.forEach((item, index) => {
      if (item.type === 'base') {
        const btn = baseMap[item.id];
        if (btn) {
          const title = btn.querySelector('.version-caption');
          if (title) title.innerHTML = `${esc(item.label)}<small>Case ${index + 1}</small>`;
          grid.appendChild(btn);
        }
      } else {
        grid.insertAdjacentHTML('beforeend', customButtonHtml(blockId, item, index, config.data[item.id] || {}));
      }
    });

    wireCustomSlotButtons();
  }

  function addCaseButtons() {
    document.querySelectorAll('.brainrot-card').forEach(card => {
      const blockId = card.dataset.id;
      const actions = card.querySelector('.card-actions');
      if (!blockId || !actions || actions.querySelector('.case-manager-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'case-manager-btn';
      btn.textContent = 'Cases';
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openCasePanel(blockId);
      });
      actions.appendChild(btn);
    });
  }

  function applyAll() {
    addCaseButtons();
    document.querySelectorAll('.brainrot-card').forEach(card => applyCasesToCard(card.dataset.id));
  }

  function openCasePanel(blockId) {
    activeBlockId = blockId;
    const card = getCard(blockId);
    const title = card?.querySelector('h3')?.textContent || 'Bloc';
    const config = getConfig(blockId);

    let panel = document.getElementById('casePanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'casePanel';
      panel.className = 'case-panel';
      document.body.appendChild(panel);
    }

    panel.classList.remove('hidden');
    panel.innerHTML = `
      <button class="case-close" type="button">×</button>
      <h3>Cases - ${esc(title)}</h3>
      <p>Déplace les cases avec ↑ ↓, renomme-les, ajoute des cases personnalisées, ou supprime les cases ajoutées.</p>
      ${config.cases.map((item, index) => `
        <div class="case-manager-row" draggable="true" data-case-id="${item.id}">
          <div class="case-handle">☰</div>
          <input value="${esc(item.label)}" data-case-name="${item.id}" aria-label="Nom de case">
          <button type="button" data-case-up="${item.id}">↑</button>
          <button type="button" data-case-down="${item.id}">↓</button>
          <div class="case-manager-subactions">
            <button type="button" data-case-open="${item.id}">Image</button>
            <button type="button" data-case-duplicate="${item.id}">Copier</button>
            ${item.type === 'custom' ? `<button class="danger" type="button" data-case-delete="${item.id}">Suppr.</button>` : `<button type="button" disabled>Base</button>`}
          </div>
        </div>
      `).join('')}
      <div class="case-actions">
        <button type="button" id="addCustomCaseBtn">+ Ajouter une case personnalisée</button>
        <button type="button" id="resetCasesBtn">Remettre les cases par défaut</button>
      </div>
    `;

    panel.querySelector('.case-close').onclick = () => panel.classList.add('hidden');
    panel.querySelector('#addCustomCaseBtn').onclick = () => addCustomCase(blockId);
    panel.querySelector('#resetCasesBtn').onclick = () => resetCases(blockId);

    panel.querySelectorAll('[data-case-name]').forEach(input => input.onchange = () => renameCase(blockId, input.dataset.caseName, input.value));
    panel.querySelectorAll('[data-case-up]').forEach(btn => btn.onclick = () => moveCase(blockId, btn.dataset.caseUp, -1));
    panel.querySelectorAll('[data-case-down]').forEach(btn => btn.onclick = () => moveCase(blockId, btn.dataset.caseDown, 1));
    panel.querySelectorAll('[data-case-delete]').forEach(btn => btn.onclick = () => deleteCase(blockId, btn.dataset.caseDelete));
    panel.querySelectorAll('[data-case-duplicate]').forEach(btn => btn.onclick = () => duplicateCase(blockId, btn.dataset.caseDuplicate));
    panel.querySelectorAll('[data-case-open]').forEach(btn => btn.onclick = () => openCaseImagePanel(blockId, btn.dataset.caseOpen));

    panel.querySelectorAll('.case-manager-row').forEach(row => {
      row.ondragstart = () => {
        draggedCaseId = row.dataset.caseId;
        row.classList.add('dragging');
      };
      row.ondragend = () => row.classList.remove('dragging');
      row.ondragover = (event) => event.preventDefault();
      row.ondrop = () => dropCase(blockId, draggedCaseId, row.dataset.caseId);
      row.onpointerdown = () => {
        clearTimeout(row._press);
        row._press = setTimeout(() => toast('Tu peux déplacer avec ↑ ↓ ou glisser la ligne.'), 450);
      };
      row.onpointerup = () => clearTimeout(row._press);
      row.onpointercancel = () => clearTimeout(row._press);
    });
  }

  function saveAndRefresh(blockId, config) {
    setConfig(blockId, config);
    applyCasesToCard(blockId);
    openCasePanel(blockId);
  }

  function addCustomCase(blockId) {
    const label = prompt('Nom de la nouvelle case :');
    if (!label || !label.trim()) return;
    const config = getConfig(blockId);
    const id = uid('custom');
    config.cases.push({ id, label: label.trim(), type: 'custom' });
    config.data[id] = { image: '', count: 0 };
    saveAndRefresh(blockId, config);
  }

  function renameCase(blockId, caseId, label) {
    const config = getConfig(blockId);
    const item = config.cases.find(x => x.id === caseId);
    if (item) item.label = label.trim() || item.label;
    saveAndRefresh(blockId, config);
  }

  function moveCase(blockId, caseId, delta) {
    const config = getConfig(blockId);
    const index = config.cases.findIndex(x => x.id === caseId);
    const next = index + delta;
    if (index < 0 || next < 0 || next >= config.cases.length) return;
    [config.cases[index], config.cases[next]] = [config.cases[next], config.cases[index]];
    saveAndRefresh(blockId, config);
  }

  function dropCase(blockId, fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    const config = getConfig(blockId);
    const from = config.cases.findIndex(x => x.id === fromId);
    const to = config.cases.findIndex(x => x.id === toId);
    if (from < 0 || to < 0) return;
    const [item] = config.cases.splice(from, 1);
    config.cases.splice(to, 0, item);
    saveAndRefresh(blockId, config);
  }

  function duplicateCase(blockId, caseId) {
    const config = getConfig(blockId);
    const item = config.cases.find(x => x.id === caseId);
    if (!item) return;
    const newId = uid('custom');
    config.cases.push({ id: newId, label: item.label + ' copie', type: 'custom' });
    config.data[newId] = { ...(config.data[caseId] || {}), image: '', count: 0 };
    saveAndRefresh(blockId, config);
  }

  function deleteCase(blockId, caseId) {
    const config = getConfig(blockId);
    const item = config.cases.find(x => x.id === caseId);
    if (!item || item.type !== 'custom') return toast('Les 5 cases de base ne se suppriment pas. Tu peux seulement les déplacer ou renommer.');
    if (!confirm('Supprimer cette case personnalisée ?')) return;
    config.cases = config.cases.filter(x => x.id !== caseId);
    delete config.data[caseId];
    saveAndRefresh(blockId, config);
  }

  function resetCases(blockId) {
    if (!confirm('Remettre les cases de ce bloc par défaut ?')) return;
    const all = loadAll();
    delete all[blockId];
    saveAll(all);
    applyCasesToCard(blockId);
    openCasePanel(blockId);
  }

  function openCaseImagePanel(blockId, caseId) {
    activeBlockId = blockId;
    activeCaseId = caseId;
    const config = getConfig(blockId);
    const item = config.cases.find(x => x.id === caseId);
    const data = config.data[caseId] || {};

    let panel = document.getElementById('caseEditPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'caseEditPanel';
      panel.className = 'case-edit-panel';
      document.body.appendChild(panel);
    }
    panel.classList.remove('hidden');
    panel.innerHTML = `
      <button class="case-close" type="button">×</button>
      <h3>${esc(item?.label || 'Case')}</h3>
      <div class="case-preview-box">${data.image ? `<img src="${data.image}" alt="${esc(item?.label || 'Case')}">` : '<strong>＋ Image</strong>'}</div>
      <div class="case-actions">
        <button id="caseGalleryBtn" type="button">Galerie</button>
        <button id="caseCameraBtn" type="button">Caméra</button>
        <button id="casePlusBtn" type="button">Quantité +</button>
        <button id="caseMinusBtn" type="button">Quantité -</button>
        <button class="danger" id="caseClearBtn" type="button">Vider la case</button>
      </div>
    `;
    panel.querySelector('.case-close').onclick = () => panel.classList.add('hidden');
    panel.querySelector('#caseGalleryBtn').onclick = () => document.getElementById('caseGalleryInput').click();
    panel.querySelector('#caseCameraBtn').onclick = () => document.getElementById('caseCameraInput').click();
    panel.querySelector('#casePlusBtn').onclick = () => changeCaseCount(1);
    panel.querySelector('#caseMinusBtn').onclick = () => changeCaseCount(-1);
    panel.querySelector('#caseClearBtn').onclick = () => clearCaseData();
  }

  function ensureInputs() {
    if (document.getElementById('caseGalleryInput')) return;
    const gallery = document.createElement('input');
    gallery.id = 'caseGalleryInput';
    gallery.type = 'file';
    gallery.accept = 'image/*';
    gallery.style.display = 'none';
    document.body.appendChild(gallery);
    gallery.onchange = handleCaseImage;

    const camera = document.createElement('input');
    camera.id = 'caseCameraInput';
    camera.type = 'file';
    camera.accept = 'image/*';
    camera.capture = 'environment';
    camera.style.display = 'none';
    document.body.appendChild(camera);
    camera.onchange = handleCaseImage;
  }

  function readFile(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  async function handleCaseImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeBlockId || !activeCaseId) return;
    const image = await readFile(file);
    const config = getConfig(activeBlockId);
    config.data[activeCaseId] = config.data[activeCaseId] || {};
    config.data[activeCaseId].image = image;
    config.data[activeCaseId].count = Math.max(1, config.data[activeCaseId].count || 1);
    setConfig(activeBlockId, config);
    applyCasesToCard(activeBlockId);
    openCaseImagePanel(activeBlockId, activeCaseId);
  }

  function changeCaseCount(delta) {
    if (!activeBlockId || !activeCaseId) return;
    const config = getConfig(activeBlockId);
    config.data[activeCaseId] = config.data[activeCaseId] || {};
    config.data[activeCaseId].count = Math.max(0, (config.data[activeCaseId].count || 0) + delta);
    setConfig(activeBlockId, config);
    applyCasesToCard(activeBlockId);
    openCaseImagePanel(activeBlockId, activeCaseId);
  }

  function clearCaseData() {
    if (!activeBlockId || !activeCaseId) return;
    const config = getConfig(activeBlockId);
    config.data[activeCaseId] = { image: '', count: 0 };
    setConfig(activeBlockId, config);
    applyCasesToCard(activeBlockId);
    openCaseImagePanel(activeBlockId, activeCaseId);
  }

  function boot() {
    addStyle();
    ensureInputs();
    setInterval(applyAll, 700);
    setTimeout(applyAll, 900);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
