const APP_VERSION = '1.0.0';
const DB_NAME = 'brainrot-vault-db';
const STORE_NAME = 'state';
const STATE_KEY = 'main';
const VERSION_ORDER = ['normal', 'diamond', 'gold', 'divine', 'rainbow'];
const RARITY_ORDER = ['common', 'rare', 'epic', 'mythic', 'legendary'];

const VERSION_LABELS = {
  normal: 'Normal',
  diamond: 'Diamant',
  gold: 'Or',
  divine: 'Divin',
  rainbow: 'Arc-en-ciel'
};

const RARITY_LABELS = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  mythic: 'Mythique',
  legendary: 'Légendaire'
};

const DEFAULT_BRAINROTS = [
  { name: 'Pandaccini Bananini', rarity: 'common' },
  { name: 'Noobolino Pixelini', rarity: 'common' },
  { name: 'Chonkster Bricko', rarity: 'common' },
  { name: 'Dodo Splashini', rarity: 'rare' },
  { name: 'Turbo Cactusino', rarity: 'rare' },
  { name: 'Rexy Blockamore', rarity: 'rare' },
  { name: 'Volcano Tralala', rarity: 'epic' },
  { name: 'Shadow Nyanzito', rarity: 'epic' },
  { name: 'Laser Crocobongo', rarity: 'epic' },
  { name: 'Nebula Pompador', rarity: 'mythic' },
  { name: 'Omega Frittatini', rarity: 'mythic' },
  { name: 'Quantum Donutor', rarity: 'mythic' },
  { name: 'Aurora Gigasnack', rarity: 'legendary' },
  { name: 'Divino Raptorini', rarity: 'legendary' },
  { name: 'Rainbow Gargantua', rarity: 'legendary' }
];

let state = null;
let db = null;
let deferredInstallPrompt = null;
let currentSlot = null;
let currentSort = 'rarity';
let filters = {
  search: '',
  rarity: 'all',
  status: 'all',
  missingOnly: false
};

const ui = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  mapUI();
  setupStaticControls();
  populateSelects();
  await initDB();
  await loadState();
  registerServiceWorker();
  renderAll();
}

function mapUI() {
  ui.collectionWrap = document.getElementById('collectionWrap');
  ui.statsRarityGrid = document.getElementById('statsRarityGrid');
  ui.statsVersionGrid = document.getElementById('statsVersionGrid');
  ui.recentList = document.getElementById('recentList');
  ui.summaryCompletion = document.getElementById('summaryCompletion');
  ui.summaryOwned = document.getElementById('summaryOwned');
  ui.summaryBrainrots = document.getElementById('summaryBrainrots');
  ui.summaryMissing = document.getElementById('summaryMissing');
  ui.summaryFavorites = document.getElementById('summaryFavorites');
  ui.searchInput = document.getElementById('searchInput');
  ui.rarityChips = document.getElementById('rarityChips');
  ui.statusChips = document.getElementById('statusChips');
  ui.installBtn = document.getElementById('installBtn');
  ui.toast = document.getElementById('toast');
  ui.cameraInput = document.getElementById('cameraInput');
  ui.brainrotModal = document.getElementById('brainrotModal');
  ui.slotModal = document.getElementById('slotModal');
  ui.brainrotForm = document.getElementById('brainrotForm');
  ui.brainrotNameInput = document.getElementById('brainrotNameInput');
  ui.brainrotRarityInput = document.getElementById('brainrotRarityInput');
  ui.slotModalTitle = document.getElementById('slotModalTitle');
  ui.slotModalKicker = document.getElementById('slotModalKicker');
  ui.slotPreview = document.getElementById('slotPreview');
  ui.slotCountValue = document.getElementById('slotCountValue');
  ui.slotDateValue = document.getElementById('slotDateValue');
  ui.countMinusBtn = document.getElementById('countMinusBtn');
  ui.countPlusBtn = document.getElementById('countPlusBtn');
  ui.slotCaptureBtn = document.getElementById('slotCaptureBtn');
  ui.slotDeleteBtn = document.getElementById('slotDeleteBtn');
}

function setupStaticControls() {
  renderFilterChips();

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('openAddModalFab').addEventListener('click', openBrainrotModal);
  document.getElementById('openAddModalTop').addEventListener('click', openBrainrotModal);

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        backdrop.classList.add('hidden');
      }
    });
  });

  ui.searchInput.addEventListener('input', (event) => {
    filters.search = event.target.value.trim().toLowerCase();
    renderCollection();
  });

  document.getElementById('sortNameBtn').addEventListener('click', () => {
    currentSort = 'name';
    highlightSortButtons();
    renderCollection();
  });

  document.getElementById('sortRarityBtn').addEventListener('click', () => {
    currentSort = 'rarity';
    highlightSortButtons();
    renderCollection();
  });

  document.getElementById('showMissingBtn').addEventListener('click', () => {
    filters.missingOnly = !filters.missingOnly;
    document.getElementById('showMissingBtn').classList.toggle('active-soft', filters.missingOnly);
    renderCollection();
  });

  highlightSortButtons();

  ui.brainrotForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = ui.brainrotNameInput.value.trim();
    const rarity = ui.brainrotRarityInput.value;
    if (!name) {
      showToast('Le nom du brainrot est obligatoire.');
      return;
    }
    addBrainrot(name, rarity);
    await persistState();
    closeModal('brainrotModal');
    ui.brainrotForm.reset();
    renderAll();
    showToast('Brainrot ajouté.');
  });

  ui.cameraInput.addEventListener('change', handleCameraInput);
  ui.slotCaptureBtn.addEventListener('click', () => ui.cameraInput.click());
  ui.slotDeleteBtn.addEventListener('click', deleteCurrentSlotImage);
  ui.countPlusBtn.addEventListener('click', () => updateCurrentSlotCount(1));
  ui.countMinusBtn.addEventListener('click', () => updateCurrentSlotCount(-1));

  document.getElementById('exportBtn').addEventListener('click', exportState);
  document.getElementById('importInput').addEventListener('change', importState);
  document.getElementById('seedBtn').addEventListener('click', resetToSeed);
  document.getElementById('wipePhotosBtn').addEventListener('click', wipePhotos);
  document.getElementById('wipeAllBtn').addEventListener('click', wipeAll);

  ui.collectionWrap.addEventListener('click', handleCollectionClick);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    ui.installBtn.classList.remove('hidden');
  });

  ui.installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      showToast('Installation lancée.');
    }
    deferredInstallPrompt = null;
    ui.installBtn.classList.add('hidden');
  });
}

function populateSelects() {
  ui.brainrotRarityInput.innerHTML = RARITY_ORDER.map((rarity) => `
    <option value="${rarity}">${RARITY_LABELS[rarity]}</option>
  `).join('');
}

function renderFilterChips() {
  const rarityOptions = [{ key: 'all', label: 'Toutes' }, ...RARITY_ORDER.map((rarity) => ({ key: rarity, label: RARITY_LABELS[rarity] }))];
  ui.rarityChips.innerHTML = rarityOptions.map((item) => `
    <button class="chip ${filters.rarity === item.key ? 'active' : ''}" data-chip-group="rarity" data-value="${item.key}" type="button">${item.label}</button>
  `).join('');

  const statusOptions = [
    { key: 'all', label: 'Tous' },
    { key: 'owned', label: 'Obtenus' },
    { key: 'missing', label: 'Manquants' },
    { key: 'favorites', label: 'Favoris' }
  ];
  ui.statusChips.innerHTML = statusOptions.map((item) => `
    <button class="chip ${filters.status === item.key ? 'active' : ''}" data-chip-group="status" data-value="${item.key}" type="button">${item.label}</button>
  `).join('');

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      filters[chip.dataset.chipGroup] = chip.dataset.value;
      renderFilterChips();
      renderCollection();
    });
  });
}

function highlightSortButtons() {
  document.getElementById('sortNameBtn').classList.toggle('active-soft', currentSort === 'name');
  document.getElementById('sortRarityBtn').classList.toggle('active-soft', currentSort === 'rarity');
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
}

async function initDB() {
  db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function loadState() {
  const savedState = await dbGet(STATE_KEY);
  if (savedState) {
    state = savedState;
  } else {
    state = createSeedState();
    await persistState();
  }
}

function createSeedState() {
  return {
    version: APP_VERSION,
    updatedAt: Date.now(),
    brainrots: DEFAULT_BRAINROTS.map((item) => createBrainrot(item.name, item.rarity))
  };
}

function createBrainrot(name, rarity) {
  const versions = {};
  VERSION_ORDER.forEach((version) => {
    versions[version] = {
      image: '',
      count: 0,
      addedAt: null
    };
  });

  return {
    id: createId(name),
    name,
    rarity,
    favorite: false,
    createdAt: Date.now(),
    versions
  };
}

function createId(seed = 'brainrot') {
  return `${seed.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
}

function dbGet(key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

function dbSet(key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function persistState() {
  state.updatedAt = Date.now();
  await dbSet(STATE_KEY, state);
}

function addBrainrot(name, rarity) {
  state.brainrots.unshift(createBrainrot(name, rarity));
}

function getVersionOwned(versionData) {
  return Boolean(versionData && (versionData.image || versionData.count > 0));
}

function getBrainrotOwnedCount(brainrot) {
  return VERSION_ORDER.reduce((count, version) => count + (getVersionOwned(brainrot.versions[version]) ? 1 : 0), 0);
}

function getFilteredBrainrots() {
  let list = [...state.brainrots];

  if (filters.search) {
    list = list.filter((brainrot) => brainrot.name.toLowerCase().includes(filters.search));
  }

  if (filters.rarity !== 'all') {
    list = list.filter((brainrot) => brainrot.rarity === filters.rarity);
  }

  if (filters.status === 'owned') {
    list = list.filter((brainrot) => getBrainrotOwnedCount(brainrot) > 0);
  } else if (filters.status === 'missing') {
    list = list.filter((brainrot) => getBrainrotOwnedCount(brainrot) < VERSION_ORDER.length);
  } else if (filters.status === 'favorites') {
    list = list.filter((brainrot) => brainrot.favorite);
  }

  if (filters.missingOnly) {
    list = list.filter((brainrot) => VERSION_ORDER.some((version) => !getVersionOwned(brainrot.versions[version])));
  }

  if (currentSort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  } else {
    list.sort((a, b) => {
      const rarityDiff = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      if (rarityDiff !== 0) return rarityDiff;
      return a.name.localeCompare(b.name, 'fr');
    });
  }

  return list;
}

function renderAll() {
  renderSummary();
  renderCollection();
  renderStats();
}

function renderSummary() {
  const totalSlots = state.brainrots.length * VERSION_ORDER.length;
  const ownedSlots = state.brainrots.reduce((total, brainrot) => total + getBrainrotOwnedCount(brainrot), 0);
  const completion = totalSlots ? Math.round((ownedSlots / totalSlots) * 100) : 0;
  const favorites = state.brainrots.filter((brainrot) => brainrot.favorite).length;

  ui.summaryCompletion.textContent = `${completion}%`;
  ui.summaryOwned.textContent = `${ownedSlots} / ${totalSlots} versions`;
  ui.summaryBrainrots.textContent = state.brainrots.length;
  ui.summaryMissing.textContent = totalSlots - ownedSlots;
  ui.summaryFavorites.textContent = favorites;
}

function renderCollection() {
  const filtered = getFilteredBrainrots();
  if (!filtered.length) {
    ui.collectionWrap.innerHTML = `
      <div class="empty-state">
        <strong>Aucun brainrot trouvé</strong>
        <p>Change les filtres ou ajoute un nouveau brainrot.</p>
      </div>
    `;
    return;
  }

  const groups = {};
  RARITY_ORDER.forEach((rarity) => {
    groups[rarity] = [];
  });
  filtered.forEach((brainrot) => groups[brainrot.rarity].push(brainrot));

  ui.collectionWrap.innerHTML = RARITY_ORDER.map((rarity) => {
    const items = groups[rarity];
    if (!items.length) return '';
    const total = items.length * VERSION_ORDER.length;
    const owned = items.reduce((sum, brainrot) => sum + getBrainrotOwnedCount(brainrot), 0);
    const progress = total ? Math.round((owned / total) * 100) : 0;

    return `
      <section class="rarity-section">
        <div class="section-header">
          <div>
            <h3>${RARITY_LABELS[rarity]}</h3>
            <div class="section-meta">${items.length} brainrot${items.length > 1 ? 's' : ''}</div>
          </div>
          <div class="section-progress">
            <div class="section-meta">${owned} / ${total} versions</div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${progress}%; background:${getRarityColor(rarity)};"></div>
            </div>
          </div>
        </div>

        ${items.map(renderBrainrotCard).join('')}
      </section>
    `;
  }).join('');
}

function renderBrainrotCard(brainrot) {
  return `
    <article class="brainrot-card" data-id="${brainrot.id}">
      <div class="card-head">
        <div>
          <div class="card-topline">
            <span class="rarity-badge ${brainrot.rarity}">${RARITY_LABELS[brainrot.rarity]}</span>
            <span class="section-meta">${getBrainrotOwnedCount(brainrot)} / ${VERSION_ORDER.length} versions</span>
          </div>
          <h3>${escapeHtml(brainrot.name)}</h3>
          <p class="card-sub">Prends toi-même la photo pour remplir la bonne case.</p>
        </div>
        <button class="favorite-btn ${brainrot.favorite ? 'active' : ''}" type="button" data-action="favorite" data-id="${brainrot.id}" aria-label="Ajouter aux favoris">${brainrot.favorite ? '★' : '☆'}</button>
      </div>

      <div class="versions-grid">
        ${VERSION_ORDER.map((version) => renderVersionSlot(brainrot, version)).join('')}
      </div>
    </article>
  `;
}

function renderVersionSlot(brainrot, version) {
  const versionData = brainrot.versions[version];
  const isOwned = getVersionOwned(versionData);

  return `
    <button class="slot-btn ${version} ${isOwned ? 'filled' : ''}" type="button" data-action="slot" data-id="${brainrot.id}" data-version="${version}">
      ${versionData.count > 1 ? `<span class="slot-count">x${versionData.count}</span>` : ''}
      <div class="slot-thumb">
        ${isOwned && versionData.image
          ? `<img src="${versionData.image}" alt="${escapeHtml(brainrot.name)} ${VERSION_LABELS[version]}">`
          : `<div class="slot-placeholder"><strong>＋</strong><span>Photo</span></div>`
        }
      </div>
      <div class="version-caption">
        ${VERSION_LABELS[version]}
        <small>${escapeHtml(brainrot.name)}</small>
      </div>
    </button>
  `;
}

function renderStats() {
  ui.statsRarityGrid.innerHTML = RARITY_ORDER.map((rarity) => {
    const items = state.brainrots.filter((brainrot) => brainrot.rarity === rarity);
    const total = items.length * VERSION_ORDER.length;
    const owned = items.reduce((sum, brainrot) => sum + getBrainrotOwnedCount(brainrot), 0);
    const progress = total ? Math.round((owned / total) * 100) : 0;

    return `
      <article class="stat-card">
        <div class="stat-title-row">
          <strong class="stat-name">${RARITY_LABELS[rarity]}</strong>
          <span class="rarity-badge ${rarity}">${progress}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${progress}%; background:${getRarityColor(rarity)};"></div>
        </div>
        <div class="stat-meta">${owned} / ${total} versions - ${items.length} brainrot${items.length > 1 ? 's' : ''}</div>
      </article>
    `;
  }).join('');

  ui.statsVersionGrid.innerHTML = VERSION_ORDER.map((version) => {
    const owned = state.brainrots.reduce((sum, brainrot) => sum + (getVersionOwned(brainrot.versions[version]) ? 1 : 0), 0);
    const total = state.brainrots.length;
    const progress = total ? Math.round((owned / total) * 100) : 0;
    return `
      <article class="version-stat">
        <div class="version-stat-top">
          <strong>${VERSION_LABELS[version]}</strong>
          <span>${progress}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${progress}%; background:${getVersionColor(version)};"></div>
        </div>
        <span>${owned} / ${total}</span>
      </article>
    `;
  }).join('');

  const recent = getRecentEntries();
  ui.recentList.innerHTML = recent.length ? recent.map((entry) => `
    <article class="recent-card">
      ${entry.image ? `<img src="${entry.image}" alt="${escapeHtml(entry.name)}">` : `<div class="slot-preview-empty"><strong>＋</strong><span>Photo</span></div>`}
      <div class="recent-info">
        <div class="recent-name">${escapeHtml(entry.name)}</div>
        <div class="recent-meta">${VERSION_LABELS[entry.version]} - ${RARITY_LABELS[entry.rarity]}</div>
        <div class="recent-date">${formatDate(entry.addedAt)}</div>
      </div>
    </article>
  `).join('') : `
    <div class="empty-state">
      <strong>Aucun ajout récent</strong>
      <p>Ajoute une première photo pour remplir cette section.</p>
    </div>
  `;
}

function getRecentEntries() {
  return state.brainrots.flatMap((brainrot) => (
    VERSION_ORDER
      .filter((version) => brainrot.versions[version].addedAt)
      .map((version) => ({
        name: brainrot.name,
        rarity: brainrot.rarity,
        version,
        image: brainrot.versions[version].image,
        addedAt: brainrot.versions[version].addedAt
      }))
  )).sort((a, b) => b.addedAt - a.addedAt).slice(0, 8);
}

function handleCollectionClick(event) {
  const favoriteBtn = event.target.closest('[data-action="favorite"]');
  if (favoriteBtn) {
    toggleFavorite(favoriteBtn.dataset.id);
    return;
  }

  const slotBtn = event.target.closest('[data-action="slot"]');
  if (slotBtn) {
    openSlotModal(slotBtn.dataset.id, slotBtn.dataset.version);
  }
}

async function toggleFavorite(brainrotId) {
  const brainrot = findBrainrot(brainrotId);
  if (!brainrot) return;
  brainrot.favorite = !brainrot.favorite;
  await persistState();
  renderAll();
}

function openBrainrotModal() {
  ui.brainrotForm.reset();
  ui.brainrotModal.classList.remove('hidden');
  ui.brainrotNameInput.focus();
}

function openSlotModal(brainrotId, version) {
  const brainrot = findBrainrot(brainrotId);
  if (!brainrot) return;
  currentSlot = { brainrotId, version };

  const versionData = brainrot.versions[version];
  ui.slotModalTitle.textContent = brainrot.name;
  ui.slotModalKicker.textContent = VERSION_LABELS[version];
  ui.slotCountValue.textContent = versionData.count || 0;
  ui.slotDateValue.textContent = versionData.addedAt ? formatDate(versionData.addedAt) : 'Aucune photo';

  if (versionData.image) {
    ui.slotPreview.innerHTML = `<img src="${versionData.image}" alt="${escapeHtml(brainrot.name)} ${VERSION_LABELS[version]}">`;
  } else {
    ui.slotPreview.innerHTML = `
      <div class="slot-preview-empty">
        <strong>＋</strong>
        <span>Ajoute une photo pour cette case ${VERSION_LABELS[version].toLowerCase()}.</span>
      </div>
    `;
  }

  ui.slotDeleteBtn.disabled = !getVersionOwned(versionData);
  ui.slotDeleteBtn.style.opacity = getVersionOwned(versionData) ? '1' : '0.5';
  ui.slotModal.classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

async function handleCameraInput(event) {
  const file = event.target.files?.[0];
  if (!file || !currentSlot) return;
  try {
    const compressed = await compressImage(file, 1080, 0.82);
    const brainrot = findBrainrot(currentSlot.brainrotId);
    if (!brainrot) return;

    brainrot.versions[currentSlot.version].image = compressed;
    brainrot.versions[currentSlot.version].count = Math.max(brainrot.versions[currentSlot.version].count || 0, 1);
    brainrot.versions[currentSlot.version].addedAt = Date.now();

    await persistState();
    renderAll();
    openSlotModal(currentSlot.brainrotId, currentSlot.version);
    showToast('Photo ajoutée dans la case.');
  } catch (error) {
    console.error(error);
    showToast('Impossible de traiter cette photo.');
  } finally {
    event.target.value = '';
  }
}

async function deleteCurrentSlotImage() {
  if (!currentSlot) return;
  const brainrot = findBrainrot(currentSlot.brainrotId);
  if (!brainrot) return;
  const versionData = brainrot.versions[currentSlot.version];
  versionData.image = '';
  versionData.count = 0;
  versionData.addedAt = null;
  await persistState();
  renderAll();
  openSlotModal(currentSlot.brainrotId, currentSlot.version);
  showToast('Case vidée.');
}

async function updateCurrentSlotCount(delta) {
  if (!currentSlot) return;
  const brainrot = findBrainrot(currentSlot.brainrotId);
  if (!brainrot) return;
  const versionData = brainrot.versions[currentSlot.version];
  let next = (versionData.count || 0) + delta;
  if (delta > 0 && !versionData.image) {
    showToast('Ajoute une photo avant de compter des doublons.');
    return;
  }
  next = Math.max(0, next);
  versionData.count = next;
  if (next === 0) {
    versionData.image = '';
    versionData.addedAt = null;
  }
  await persistState();
  renderAll();
  openSlotModal(currentSlot.brainrotId, currentSlot.version);
}

async function exportState() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = `brainrot-vault-${new Date().toISOString().slice(0, 10)}.json`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Export terminé.');
}

async function importState(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!imported || !Array.isArray(imported.brainrots)) {
      throw new Error('Format invalide');
    }
    state = imported;
    await persistState();
    renderAll();
    showToast('Sauvegarde importée.');
  } catch (error) {
    console.error(error);
    showToast('Import impossible. Vérifie le fichier JSON.');
  } finally {
    event.target.value = '';
  }
}

async function resetToSeed() {
  if (!confirm('Recharger la base démo des brainrots ?')) return;
  state = createSeedState();
  await persistState();
  renderAll();
  showToast('Base démo rechargée.');
}

async function wipePhotos() {
  if (!confirm('Supprimer toutes les photos mais garder les brainrots ?')) return;
  state.brainrots.forEach((brainrot) => {
    VERSION_ORDER.forEach((version) => {
      brainrot.versions[version].image = '';
      brainrot.versions[version].count = 0;
      brainrot.versions[version].addedAt = null;
    });
  });
  await persistState();
  renderAll();
  showToast('Toutes les photos ont été supprimées.');
}

async function wipeAll() {
  if (!confirm('Tout effacer ? Cette action est irréversible.')) return;
  state = createSeedState();
  await persistState();
  renderAll();
  showToast('Application réinitialisée.');
}

function findBrainrot(id) {
  return state.brainrots.find((brainrot) => brainrot.id === id);
}

function getRarityColor(rarity) {
  return ({
    common: '#96a1b8',
    rare: '#42a5ff',
    epic: '#a06cff',
    mythic: '#ff5cc9',
    legendary: '#ffce47'
  })[rarity] || '#67c8ff';
}

function getVersionColor(version) {
  return ({
    normal: '#7d89ac',
    diamond: '#5ad6ff',
    gold: '#ffcf52',
    divine: '#f4f6ff',
    rainbow: '#a45cff'
  })[version] || '#67c8ff';
}

function formatDate(timestamp) {
  if (!timestamp) return 'Aucune date';
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.remove('hidden');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => ui.toast.classList.add('hidden'), 2200);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function compressImage(file, maxSize = 1080, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        let { width, height } = image;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service Worker non installé :', error);
    });
  }
}
