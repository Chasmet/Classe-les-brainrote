(() => {
  const KEY = 'brainrot_cases_lite_v1';
  const DEFAULT_NEW_CASE_NAME = 'Case';

  let activeBrainrotId = null;
  let activeCaseId = null;

  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function saveAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function uid() {
    return 'case_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return alert(message);
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add('hidden'), 1800);
  }

  function getCases(brainrotId) {
    const all = loadAll();
    return all[brainrotId] || [];
  }

  function setCases(brainrotId, cases) {
    const all = loadAll();
    all[brainrotId] = cases;
    saveAll(all);
  }

  function getBrainrotTitle(brainrotId) {
    return document.querySelector(`.brainrot-card[data-id="${brainrotId}"] h3`)?.textContent || 'Brainrot';
  }

  function addStyle() {
    if (document.getElementById('casesLiteCss')) return;
    const style = document.createElement('style');
    style.id = 'casesLiteCss';
    style.textContent = `
      .cases-lite-backdrop {
        position: fixed;
        inset: 0;
        z-index: 500000;
        display: none;
        align-items: flex-end;
        background: rgba(0,0,0,.62);
      }
      .cases-lite-backdrop.open { display: flex; }
      .cases-lite-sheet {
        width: 100%;
        max-height: 88dvh;
        overflow-y: auto;
        padding: 16px 14px calc(18px + env(safe-area-inset-bottom, 0px));
        border-radius: 28px 28px 0 0;
        background: #071026;
        border-top: 1px solid rgba(255,255,255,.14);
        box-shadow: 0 -18px 50px rgba(0,0,0,.5);
      }
      .cases-lite-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }
      .cases-lite-title {
        margin: 0;
        color: #fff;
        font-size: 22px;
        font-weight: 900;
        line-height: 1.15;
      }
      .cases-lite-subtitle {
        margin: 5px 0 0;
        color: #cbd6f6;
        font-size: 14px;
      }
      .cases-lite-close {
        width: 44px;
        height: 44px;
        border-radius: 15px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.08);
        color: #fff;
        font-size: 22px;
        font-weight: 900;
        touch-action: manipulation;
      }
      .cases-lite-grid,
      .cases-lite-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }
      .cases-lite-list { margin-bottom: 14px; }
      .cases-lite-btn,
      .cases-lite-item {
        min-height: 56px;
        border-radius: 18px;
        padding: 12px 14px;
        font-size: 16px;
        font-weight: 900;
        text-align: left;
        touch-action: manipulation;
      }
      .cases-lite-btn {
        border: 0;
        color: #071026;
        background: linear-gradient(135deg, #63d7ff, #b57cff);
      }
      .cases-lite-btn.secondary,
      .cases-lite-item {
        color: #fff;
        background: rgba(255,255,255,.09);
        border: 1px solid rgba(255,255,255,.14);
      }
      .cases-lite-btn.danger {
        color: #ffd7df;
        background: rgba(255,80,120,.12);
        border: 1px solid rgba(255,120,150,.25);
      }
      .cases-lite-item span {
        display: block;
        margin-top: 4px;
        color: #cbd6f6;
        font-size: 12px;
        font-weight: 700;
      }
      .cases-lite-empty {
        margin: 0 0 14px;
        padding: 12px;
        border-radius: 16px;
        background: rgba(255,255,255,.06);
        color: #cbd6f6;
        font-weight: 800;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSheet() {
    addStyle();
    let sheet = document.getElementById('casesLiteSheet');
    if (sheet) return sheet;

    sheet = document.createElement('div');
    sheet.id = 'casesLiteSheet';
    sheet.className = 'cases-lite-backdrop';
    sheet.innerHTML = `
      <div class="cases-lite-sheet">
        <div class="cases-lite-head">
          <div>
            <h3 class="cases-lite-title" id="casesLiteTitle">Cases</h3>
            <p class="cases-lite-subtitle" id="casesLiteSubtitle">Choisis une action</p>
          </div>
          <button class="cases-lite-close" type="button" data-cases-close>×</button>
        </div>
        <div id="casesLiteContent"></div>
      </div>
    `;
    document.body.appendChild(sheet);

    sheet.addEventListener('click', (event) => {
      if (event.target === sheet || event.target.closest('[data-cases-close]')) closeSheet();
    });

    return sheet;
  }

  function closeSheet() {
    const sheet = document.getElementById('casesLiteSheet');
    if (sheet) sheet.classList.remove('open');
    activeBrainrotId = null;
    activeCaseId = null;
  }

  function openSheet(title, subtitle, html) {
    const sheet = ensureSheet();
    document.getElementById('casesLiteTitle').textContent = title;
    document.getElementById('casesLiteSubtitle').textContent = subtitle;
    document.getElementById('casesLiteContent').innerHTML = html;
    sheet.classList.add('open');
  }

  function addCasesButton(card) {
    const brainrotId = card.dataset.id;
    const actions = card.querySelector('.card-actions');
    if (!brainrotId || !actions || actions.querySelector('[data-lite-cases]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mini-btn';
    button.dataset.liteCases = brainrotId;
    button.textContent = 'Cases';
    actions.appendChild(button);
  }

  function caseSlotHtml(brainrotId, item, index) {
    const count = Number(item.count || 0);
    const hasImage = Boolean(item.image);
    const filled = hasImage || count > 0;

    return `
      <button class="slot-btn ${filled ? 'filled' : ''}" type="button" data-lite-case-open="${brainrotId}|${item.id}">
        ${count > 1 ? `<span class="slot-count">x${count}</span>` : ''}
        <div class="slot-thumb">
          ${hasImage
            ? `<img src="${item.image}" alt="${escapeHtml(item.name)}">`
            : `<div class="slot-placeholder"><strong>＋</strong><span>Image</span></div>`
          }
        </div>
        <div class="version-caption">
          ${escapeHtml(item.name)}
          <small>Case perso ${index + 1}</small>
        </div>
      </button>
    `;
  }

  function renderCases(card) {
    const brainrotId = card.dataset.id;
    const grid = card.querySelector('.versions-grid');
    if (!brainrotId || !grid) return;

    grid.querySelectorAll('[data-lite-case-open]').forEach((el) => el.remove());
    getCases(brainrotId).forEach((item, index) => {
      grid.insertAdjacentHTML('beforeend', caseSlotHtml(brainrotId, item, index));
    });
  }

  function applyCases() {
    document.querySelectorAll('.brainrot-card').forEach((card) => {
      addCasesButton(card);
      renderCases(card);
    });
  }

  function openCasesMenu(brainrotId) {
    activeBrainrotId = brainrotId;
    activeCaseId = null;
    const cases = getCases(brainrotId);
    const title = getBrainrotTitle(brainrotId);

    const listHtml = cases.length
      ? `<div class="cases-lite-list">${cases.map((item, index) => `
          <button class="cases-lite-item" type="button" data-case-select="${item.id}">
            ${escapeHtml(item.name)}
            <span>Case ${index + 1} - quantité ${Number(item.count || 0)}</span>
          </button>
        `).join('')}</div>`
      : `<p class="cases-lite-empty">Aucune case personnalisée.</p>`;

    openSheet(
      `Cases pour ${title}`,
      'Ajoute une case ou sélectionne une case existante.',
      `
        ${listHtml}
        <div class="cases-lite-grid">
          <button class="cases-lite-btn" type="button" data-case-action="add">+ Ajouter une case</button>
          <button class="cases-lite-btn secondary" type="button" data-cases-close>Fermer</button>
        </div>
      `
    );
  }

  function openCaseActions(brainrotId, caseId) {
    activeBrainrotId = brainrotId;
    activeCaseId = caseId;
    const item = getCases(brainrotId).find((entry) => entry.id === caseId);
    if (!item) return;

    openSheet(
      item.name,
      `Quantité : ${Number(item.count || 0)}`,
      `
        <div class="cases-lite-grid">
          <button class="cases-lite-btn" type="button" data-case-action="gallery">Choisir depuis la galerie</button>
          <button class="cases-lite-btn" type="button" data-case-action="camera">Prendre une photo</button>
          <button class="cases-lite-btn secondary" type="button" data-case-action="plus">Quantité +1</button>
          <button class="cases-lite-btn secondary" type="button" data-case-action="minus">Quantité -1</button>
          <button class="cases-lite-btn secondary" type="button" data-case-action="rename">Renommer la case</button>
          <button class="cases-lite-btn danger" type="button" data-case-action="clear">Vider la case</button>
          <button class="cases-lite-btn danger" type="button" data-case-action="delete">Supprimer la case</button>
          <button class="cases-lite-btn secondary" type="button" data-case-action="back">Retour aux cases</button>
        </div>
      `
    );
  }

  function addCase(brainrotId) {
    const name = prompt('Nom de la nouvelle case :', DEFAULT_NEW_CASE_NAME);
    if (!name || !name.trim()) return;

    const cases = getCases(brainrotId);
    const item = {
      id: uid(),
      name: name.trim(),
      image: '',
      count: 0,
      createdAt: Date.now()
    };
    cases.push(item);
    setCases(brainrotId, cases);
    applyCases();
    showToast('Case ajoutée.');
    openCaseActions(brainrotId, item.id);
  }

  function renameCase(brainrotId, caseId) {
    const cases = getCases(brainrotId);
    const item = cases.find((entry) => entry.id === caseId);
    if (!item) return;

    const name = prompt('Nouveau nom :', item.name);
    if (!name || !name.trim()) return;

    item.name = name.trim();
    setCases(brainrotId, cases);
    applyCases();
    showToast('Case renommée.');
    openCaseActions(brainrotId, caseId);
  }

  function deleteCase(brainrotId, caseId) {
    const cases = getCases(brainrotId);
    const index = cases.findIndex((entry) => entry.id === caseId);
    if (index < 0) return;

    if (!confirm(`Supprimer la case "${cases[index].name}" ?`)) return;
    cases.splice(index, 1);
    setCases(brainrotId, cases);
    applyCases();
    showToast('Case supprimée.');
    openCasesMenu(brainrotId);
  }

  function ensureInput(camera) {
    const id = camera ? 'casesLiteCameraInput' : 'casesLiteGalleryInput';
    let input = document.getElementById(id);
    if (input) return input;

    input = document.createElement('input');
    input.id = id;
    input.type = 'file';
    input.accept = 'image/*';
    input.className = 'hidden-file-input';
    if (camera) input.setAttribute('capture', 'environment');
    document.body.appendChild(input);
    return input;
  }

  function readFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  function chooseImage(brainrotId, caseId, camera) {
    const input = ensureInput(camera);
    input.onchange = async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;

      const image = await readFile(file);
      const cases = getCases(brainrotId);
      const item = cases.find((entry) => entry.id === caseId);
      if (!item) return;

      item.image = image;
      item.count = Math.max(1, Number(item.count || 0));
      setCases(brainrotId, cases);
      applyCases();
      showToast('Image ajoutée.');
      openCaseActions(brainrotId, caseId);
    };
    input.click();
  }

  function changeCount(brainrotId, caseId, delta) {
    const cases = getCases(brainrotId);
    const item = cases.find((entry) => entry.id === caseId);
    if (!item) return;

    item.count = Math.max(0, Number(item.count || 0) + delta);
    setCases(brainrotId, cases);
    applyCases();
    openCaseActions(brainrotId, caseId);
  }

  function clearCase(brainrotId, caseId) {
    const cases = getCases(brainrotId);
    const item = cases.find((entry) => entry.id === caseId);
    if (!item) return;

    item.image = '';
    item.count = 0;
    setCases(brainrotId, cases);
    applyCases();
    showToast('Case vidée.');
    openCaseActions(brainrotId, caseId);
  }

  function handleAction(action) {
    if (!activeBrainrotId) return;

    if (action === 'add') return addCase(activeBrainrotId);
    if (action === 'back') return openCasesMenu(activeBrainrotId);
    if (!activeCaseId) return;

    if (action === 'gallery') chooseImage(activeBrainrotId, activeCaseId, false);
    if (action === 'camera') chooseImage(activeBrainrotId, activeCaseId, true);
    if (action === 'plus') changeCount(activeBrainrotId, activeCaseId, 1);
    if (action === 'minus') changeCount(activeBrainrotId, activeCaseId, -1);
    if (action === 'rename') renameCase(activeBrainrotId, activeCaseId);
    if (action === 'clear') clearCase(activeBrainrotId, activeCaseId);
    if (action === 'delete') deleteCase(activeBrainrotId, activeCaseId);
  }

  function patchRenderCollection() {
    if (typeof renderCollection !== 'function' || window.__casesLitePatched) return;
    window.__casesLitePatched = true;

    const originalRenderCollection = renderCollection;
    renderCollection = function patchedRenderCollection() {
      originalRenderCollection();
      applyCases();
    };
  }

  function boot() {
    patchRenderCollection();
    applyCases();
    ensureSheet();

    document.addEventListener('click', (event) => {
      const menuBtn = event.target.closest('[data-lite-cases]');
      if (menuBtn) {
        event.preventDefault();
        event.stopPropagation();
        openCasesMenu(menuBtn.dataset.liteCases);
        return;
      }

      const slotBtn = event.target.closest('[data-lite-case-open]');
      if (slotBtn) {
        event.preventDefault();
        event.stopPropagation();
        const [brainrotId, caseId] = slotBtn.dataset.liteCaseOpen.split('|');
        openCaseActions(brainrotId, caseId);
        return;
      }

      const selectBtn = event.target.closest('[data-case-select]');
      if (selectBtn) {
        event.preventDefault();
        openCaseActions(activeBrainrotId, selectBtn.dataset.caseSelect);
        return;
      }

      const actionBtn = event.target.closest('[data-case-action]');
      if (actionBtn) {
        event.preventDefault();
        handleAction(actionBtn.dataset.caseAction);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 350));
})();
