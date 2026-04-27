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
      :root {
        --neon-bg: #050816;
        --neon-card: rgba(10, 16, 38, .86);
        --neon-line: rgba(255,255,255,.14);
        --neon-cyan: #22e7ff;
        --neon-blue: #2678ff;
        --neon-purple: #a855ff;
        --neon-pink: #ff2f92;
        --neon-gold: #ffbf24;
        --neon-green: #6cff2b;
        --neon-orange: #ff7a18;
        --neon-red: #ff3d3d;
      }

      body {
        background:
          radial-gradient(circle at 15% 10%, rgba(168,85,255,.28), transparent 28%),
          radial-gradient(circle at 82% 12%, rgba(34,231,255,.20), transparent 25%),
          radial-gradient(circle at 50% 105%, rgba(255,47,146,.16), transparent 28%),
          #050816 !important;
      }

      .auth-card,
      .hero,
      .panel,
      .brainrot-card,
      .rarity-section,
      .summary-card,
      .modal-sheet,
      .bottom-nav {
        background: linear-gradient(145deg, rgba(16, 24, 58, .92), rgba(5, 8, 22, .96)) !important;
        border: 1px solid rgba(255,255,255,.13) !important;
      }

      .hero {
        border-radius: 34px !important;
        box-shadow: 0 18px 45px rgba(0,0,0,.42), inset 0 0 0 1px rgba(255,255,255,.04) !important;
      }

      .hero-text h1,
      .auth-brand h1 {
        background: linear-gradient(135deg, #fff 10%, #a855ff 45%, #22e7ff 80%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent !important;
        text-shadow: none !important;
      }

      .hero-pill:nth-child(1), .chip:nth-child(1) { border-color: rgba(168,85,255,.55) !important; color: #ead7ff !important; }
      .hero-pill:nth-child(2), .chip:nth-child(2) { border-color: rgba(34,231,255,.55) !important; color: #d8fbff !important; }
      .hero-pill:nth-child(3), .chip:nth-child(3) { border-color: rgba(255,191,36,.55) !important; color: #fff0c2 !important; }

      .summary-card:nth-child(1) { background: linear-gradient(145deg, rgba(122,60,255,.28), rgba(8,12,34,.94)) !important; border-color: rgba(168,85,255,.55) !important; }
      .summary-card:nth-child(2) { background: linear-gradient(145deg, rgba(34,231,255,.22), rgba(8,12,34,.94)) !important; border-color: rgba(34,231,255,.48) !important; }
      .summary-card:nth-child(3) { background: linear-gradient(145deg, rgba(255,191,36,.24), rgba(8,12,34,.94)) !important; border-color: rgba(255,191,36,.50) !important; }
      .summary-card:nth-child(4) { background: linear-gradient(145deg, rgba(108,255,43,.20), rgba(8,12,34,.94)) !important; border-color: rgba(108,255,43,.46) !important; }

      .primary-btn,
      .install-button,
      .fab {
        background: linear-gradient(135deg, #8b5cf6, #ff2f92) !important;
        color: white !important;
        box-shadow: 0 12px 28px rgba(255,47,146,.28) !important;
      }

      .ghost-btn:nth-child(1), .soft-btn:nth-child(1), .auth-tab:nth-child(1) {
        background: linear-gradient(135deg, rgba(168,85,255,.28), rgba(38,120,255,.18)) !important;
        border-color: rgba(168,85,255,.55) !important;
      }
      .ghost-btn:nth-child(2), .soft-btn:nth-child(2), .auth-tab:nth-child(2) {
        background: linear-gradient(135deg, rgba(34,231,255,.24), rgba(10,16,38,.88)) !important;
        border-color: rgba(34,231,255,.55) !important;
      }
      .soft-btn:nth-child(3) {
        background: linear-gradient(135deg, rgba(255,191,36,.24), rgba(10,16,38,.88)) !important;
        border-color: rgba(255,191,36,.55) !important;
      }

      .nav-btn:nth-child(1) { color: #a855ff !important; }
      .nav-btn:nth-child(2) { color: #22e7ff !important; }
      .nav-btn:nth-child(3) { color: #6cff2b !important; }
      .nav-btn:nth-child(4) { color: #ff7a18 !important; }
      .nav-btn.active {
        background: rgba(255,255,255,.08) !important;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.10) !important;
      }

      .versions-grid .slot-btn:nth-child(8n+1), .custom-slots-grid .slot-btn:nth-child(8n+1) {
        --case-color: #22e7ff;
        background: linear-gradient(145deg, rgba(34,231,255,.18), rgba(5,8,22,.94)) !important;
        border-color: rgba(34,231,255,.75) !important;
      }
      .versions-grid .slot-btn:nth-child(8n+2), .custom-slots-grid .slot-btn:nth-child(8n+2) {
        --case-color: #ffbf24;
        background: linear-gradient(145deg, rgba(255,191,36,.22), rgba(5,8,22,.94)) !important;
        border-color: rgba(255,191,36,.78) !important;
      }
      .versions-grid .slot-btn:nth-child(8n+3), .custom-slots-grid .slot-btn:nth-child(8n+3) {
        --case-color: #6cff2b;
        background: linear-gradient(145deg, rgba(108,255,43,.18), rgba(5,8,22,.94)) !important;
        border-color: rgba(108,255,43,.74) !important;
      }
      .versions-grid .slot-btn:nth-child(8n+4), .custom-slots-grid .slot-btn:nth-child(8n+4) {
        --case-color: #ff2f92;
        background: linear-gradient(145deg, rgba(255,47,146,.20), rgba(5,8,22,.94)) !important;
        border-color: rgba(255,47,146,.76) !important;
      }
      .versions-grid .slot-btn:nth-child(8n+5), .custom-slots-grid .slot-btn:nth-child(8n+5) {
        --case-color: #ff7a18;
        background: linear-gradient(145deg, rgba(255,122,24,.20), rgba(5,8,22,.94)) !important;
        border-color: rgba(255,122,24,.76) !important;
      }
      .versions-grid .slot-btn:nth-child(8n+6), .custom-slots-grid .slot-btn:nth-child(8n+6) {
        --case-color: #c026ff;
        background: linear-gradient(145deg, rgba(192,38,255,.22), rgba(5,8,22,.94)) !important;
        border-color: rgba(192,38,255,.76) !important;
      }
      .versions-grid .slot-btn:nth-child(8n+7), .custom-slots-grid .slot-btn:nth-child(8n+7) {
        --case-color: #2678ff;
        background: linear-gradient(145deg, rgba(38,120,255,.22), rgba(5,8,22,.94)) !important;
        border-color: rgba(38,120,255,.76) !important;
      }
      .versions-grid .slot-btn:nth-child(8n+8), .custom-slots-grid .slot-btn:nth-child(8n+8) {
        --case-color: #ff3d3d;
        background: linear-gradient(145deg, rgba(255,61,61,.20), rgba(5,8,22,.94)) !important;
        border-color: rgba(255,61,61,.76) !important;
      }

      .slot-btn {
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.04), 0 12px 28px rgba(0,0,0,.25) !important;
      }
      .slot-btn .slot-thumb,
      .slot-btn .slot-placeholder {
        border-color: color-mix(in srgb, var(--case-color, #22e7ff) 70%, transparent) !important;
        background: rgba(255,255,255,.04) !important;
      }
      .slot-placeholder strong,
      .version-caption {
        color: var(--case-color, #22e7ff) !important;
      }
      .slot-count {
        background: var(--case-color, #22e7ff) !important;
        color: #071026 !important;
      }

      .mini-btn[data-lite-cases] {
        background: linear-gradient(135deg, #ff2f92, #8b5cf6) !important;
        color: #fff !important;
        border-color: rgba(255,47,146,.55) !important;
      }

      .cases-lite-backdrop {
        position: fixed;
        inset: 0;
        z-index: 500000;
        display: none;
        align-items: flex-end;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(8px);
      }
      .cases-lite-backdrop.open { display: flex; }
      .cases-lite-sheet {
        width: 100%;
        max-height: 88dvh;
        overflow-y: auto;
        padding: 18px 14px calc(18px + env(safe-area-inset-bottom, 0px));
        border-radius: 30px 30px 0 0;
        background:
          radial-gradient(circle at 20% 0%, rgba(34,231,255,.16), transparent 28%),
          radial-gradient(circle at 80% 0%, rgba(255,47,146,.16), transparent 28%),
          #071026;
        border-top: 1px solid rgba(255,255,255,.18);
        box-shadow: 0 -18px 50px rgba(0,0,0,.55);
      }
      .cases-lite-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .cases-lite-title {
        margin: 0;
        color: #fff;
        font-size: 24px;
        font-weight: 950;
        line-height: 1.1;
      }
      .cases-lite-subtitle {
        margin: 6px 0 0;
        color: #cbd6f6;
        font-size: 14px;
      }
      .cases-lite-close {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.14);
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
        min-height: 64px;
        border-radius: 20px;
        padding: 13px 15px;
        font-size: 16px;
        font-weight: 950;
        text-align: left;
        touch-action: manipulation;
      }
      .cases-lite-btn { border: 1px solid rgba(255,255,255,.12); color: white; }
      .cases-lite-btn[data-case-action="add"] { background: linear-gradient(135deg, #00d4a6, #22e7ff); color: #031018; }
      .cases-lite-btn[data-case-action="gallery"] { background: linear-gradient(135deg, #15c8d8, #2678ff); }
      .cases-lite-btn[data-case-action="camera"] { background: linear-gradient(135deg, #ffbf24, #ff7a18); color: #180c02; }
      .cases-lite-btn[data-case-action="plus"] { background: linear-gradient(135deg, #8b5cf6, #c026ff); }
      .cases-lite-btn[data-case-action="minus"] { background: linear-gradient(135deg, #6cff2b, #21a80f); color: #061706; }
      .cases-lite-btn[data-case-action="rename"] { background: linear-gradient(135deg, #2678ff, #1d4ed8); }
      .cases-lite-btn[data-case-action="clear"] { background: linear-gradient(135deg, #ff7a18, #db5a00); }
      .cases-lite-btn[data-case-action="delete"] { background: linear-gradient(135deg, #ff3d3d, #b91c1c); }
      .cases-lite-btn[data-case-action="back"],
      .cases-lite-btn.secondary { background: rgba(255,255,255,.09); color: #fff; border: 1px solid rgba(255,255,255,.14); }
      .cases-lite-item:nth-child(6n+1) { background: linear-gradient(135deg, rgba(34,231,255,.24), rgba(10,16,38,.92)); border: 1px solid rgba(34,231,255,.55); color: #fff; }
      .cases-lite-item:nth-child(6n+2) { background: linear-gradient(135deg, rgba(255,191,36,.24), rgba(10,16,38,.92)); border: 1px solid rgba(255,191,36,.55); color: #fff; }
      .cases-lite-item:nth-child(6n+3) { background: linear-gradient(135deg, rgba(108,255,43,.20), rgba(10,16,38,.92)); border: 1px solid rgba(108,255,43,.55); color: #fff; }
      .cases-lite-item:nth-child(6n+4) { background: linear-gradient(135deg, rgba(255,47,146,.24), rgba(10,16,38,.92)); border: 1px solid rgba(255,47,146,.55); color: #fff; }
      .cases-lite-item:nth-child(6n+5) { background: linear-gradient(135deg, rgba(192,38,255,.24), rgba(10,16,38,.92)); border: 1px solid rgba(192,38,255,.55); color: #fff; }
      .cases-lite-item:nth-child(6n+6) { background: linear-gradient(135deg, rgba(255,122,24,.24), rgba(10,16,38,.92)); border: 1px solid rgba(255,122,24,.55); color: #fff; }
      .cases-lite-item span {
        display: block;
        margin-top: 5px;
        color: #dce6ff;
        font-size: 12px;
        font-weight: 700;
      }
      .cases-lite-empty {
        margin: 0 0 14px;
        padding: 14px;
        border-radius: 18px;
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
            <h3 class="cases-lite-title" id="casesLiteTitle">Gestion des cases</h3>
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
          <button class="cases-lite-btn" type="button" data-case-action="gallery">▧ Galerie</button>
          <button class="cases-lite-btn" type="button" data-case-action="camera">● Caméra</button>
          <button class="cases-lite-btn secondary" type="button" data-case-action="plus">+1 Quantité</button>
          <button class="cases-lite-btn secondary" type="button" data-case-action="minus">−1 Quantité</button>
          <button class="cases-lite-btn secondary" type="button" data-case-action="rename">✎ Renommer</button>
          <button class="cases-lite-btn danger" type="button" data-case-action="clear">Vider</button>
          <button class="cases-lite-btn danger" type="button" data-case-action="delete">Supprimer</button>
          <button class="cases-lite-btn secondary" type="button" data-case-action="back">Retour</button>
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
