const APP_VERSION = '3.3.0';
const DB_NAME = 'brainrot-vault-db';
const STORE_NAME = 'state';
const STATE_KEY = 'main';
const SECRET_TARGET = 67;

const APP_CONFIG = {
  COMMON_CLOSE_PASSWORD: 'Brainrot2026',
  REVOLUT_LINK_6M: 'https://checkout.revolut.com/pay/669d32f3-77f9-41d1-8e6b-a5aa384d2760',
  PAID_ACCESS_CODE: 'BRAINROT6MOIS',
  IMAGE_MAX_SIZE: 1800,
  IMAGE_QUALITY: 0.92
};

const CLOSE_USERS = [
  { username: 'Cheikh', role: 'admin', displayName: 'Cheikh' },
  { username: 'Yvane', role: 'close', displayName: 'Yvane' },
  { username: 'Nelvyn', role: 'close', displayName: 'Nelvyn' },
  { username: 'Warrel', role: 'close', displayName: 'Warrel' },
  { username: 'famille1', role: 'close', displayName: 'famille1' }
];

const VERSION_ORDER = ['normal', 'diamond', 'gold', 'divine', 'rainbow'];
const RARITY_ORDER = ['common', 'rare', 'epic', 'mythic', 'legendary', 'ultra_legendary', 'secret'];

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
  legendary: 'Légendaire',
  ultra_legendary: 'Ultra légendaire',
  secret: 'Secret'
};

const DEFAULT_BRAINROTS = [
  { name: 'Pandaccini Bananini', rarity: 'common', source: 'base' },
  { name: 'Noobolino Pixelini', rarity: 'common', source: 'base' },
  { name: 'Chonkster Bricko', rarity: 'common', source: 'base' },

  { name: 'Dodo Splashini', rarity: 'rare', source: 'base' },
  { name: 'Turbo Cactusino', rarity: 'rare', source: 'base' },
  { name: 'Rexy Blockamore', rarity: 'rare', source: 'base' },

  { name: 'Volcano Tralala', rarity: 'epic', source: 'base' },
  { name: 'Shadow Nyanzito', rarity: 'epic', source: 'base' },
  { name: 'Laser Crocobongo', rarity: 'epic', source: 'base' },

  { name: 'Nebula Pompador', rarity: 'mythic', source: 'base' },
  { name: 'Omega Frittatini', rarity: 'mythic', source: 'base' },
  { name: 'Quantum Donutor', rarity: 'mythic', source: 'base' },

  { name: 'Aurora Gigasnack', rarity: 'legendary', source: 'base' },
  { name: 'Divino Raptorini', rarity: 'legendary', source: 'base' },
  { name: 'Rainbow Gargantua', rarity: 'legendary', source: 'base' },

  { name: 'Celestino Vaultaro', rarity: 'ultra_legendary', source: 'base' },
  { name: 'Blazino Gigapop', rarity: 'ultra_legendary', source: 'base' },

  { name: 'Los 67', rarity: 'secret', source: 'base' },
  { name: 'La Supreme Combinasion', rarity: 'secret', source: 'base' },
  { name: 'Grillini Spyderini', rarity: 'secret', source: 'base' }
];

let db = null;
let state = null;
let currentSort = 'rarity';
let currentSlot = null;
let currentEditId = null;
let deferredInstallPrompt = null;

let filters = {
  search: '',
  rarity: 'all',
  status: 'all',
  missingOnly: false
};

let session = null;

const ui = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  mapUI();
  bindStaticEvents();
  populateSelects();
  loadSession();
  await initDB();
  await loadState();
  registerServiceWorker();
  renderAuth();
  renderAll();
}

function mapUI() {
  ui.authScreen = document.getElementById('authScreen');
  ui.appScreen = document.getElementById('appScreen');
  ui.authTabs = Array.from(document.querySelectorAll('.auth-tab'));
  ui.authClosePane = document.getElementById('authClosePane');
  ui.authPaidPane = document.getElementById('authPaidPane');

  ui.closeLoginForm = document.getElementById('closeLoginForm');
  ui.closeUsername = document.getElementById('closeUsername');
  ui.closePassword = document.getElementById('closePassword');

  ui.payRevolutBtn = document.getElementById('payRevolutBtn');
  ui.paidCodeForm = document.getElementById('paidCodeForm');
  ui.paidAccessCode = document.getElementById('paidAccessCode');

  ui.installBtn = document.getElementById('installBtn');
  ui.toast = document.getElementById('toast');

  ui.sessionLabel = document.getElementById('sessionLabel');
  ui.accountModeText = document.getElementById('accountModeText');
  ui.accountUserText = document.getElementById('accountUserText');
  ui.accountAccessText = document.getElementById('accountAccessText');

  ui.summaryCompletion = document.getElementById('summaryCompletion');
  ui.summaryOwned = document.getElementById('summaryOwned');
  ui.summaryBrainrots = document.getElementById('summaryBrainrots');
  ui.summaryMissing = document.getElementById('summaryMissing');
  ui.summarySecrets = document.getElementById('summarySecrets');

  ui.searchInput = document.getElementById('searchInput');
  ui.rarityChips = document.getElementById('rarityChips');
  ui.statusChips = document.getElementById('statusChips');
  ui.collectionWrap = document.getElementById('collectionWrap');
  ui.statsRarityGrid = document.getElementById('statsRarityGrid');
  ui.statsVersionGrid = document.getElementById('statsVersionGrid');
  ui.recentList = document.getElementById('recentList');

  ui.galleryInput = document.getElementById('galleryInput');
  ui.cameraInput = document.getElementById('cameraInput');

  ui.brainrotModal = document.getElementById('brainrotModal');
  ui.bulkModal = document.getElementById('bulkModal');
  ui.editModal = document.getElementById('editModal');
  ui.slotModal = document.getElementById('slotModal');

  ui.brainrotForm = document.getElementById('brainrotForm');
  ui.brainrotNameInput = document.getElementById('brainrotNameInput');
  ui.brainrotRarityInput = document.getElementById('brainrotRarityInput');

  ui.bulkForm = document.getElementById('bulkForm');
  ui.bulkNamesInput = document.getElementById('bulkNamesInput');
  ui.bulkRarityInput = document.getElementById('bulkRarityInput');

  ui.editForm = document.getElementById('editForm');
  ui.editBrainrotNameInput = document.getElementById('editBrainrotNameInput');
  ui.editBrainrotRarityInput = document.getElementById('editBrainrotRarityInput');

  ui.slotModalTitle = document.getElementById('slotModalTitle');
  ui.slotModalKicker = document.getElementById('slotModalKicker');
  ui.slotPreview = document.getElementById('slotPreview');
  ui.slotCountValue = document.getElementById('slotCountValue');
  ui.slotDateValue = document.getElementById('slotDateValue');
  ui.countMinusBtn = document.getElementById('countMinusBtn');
  ui.countPlusBtn = document.getElementById('countPlusBtn');
  ui.slotGalleryBtn = document.getElementById('slotGalleryBtn');
  ui.slotCameraBtn = document.getElementById('slotCameraBtn');
  ui.slotDeleteBtn = document.getElementById('slotDeleteBtn');
}

function bindStaticEvents() {
  renderFilterChips();

  ui.authTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.authTab));
  });

  ui.closeLoginForm.addEventListener('submit', handleCloseLogin);
  ui.payRevolutBtn.addEventListener('click', openRevolutPayment);
  ui.paidCodeForm.addEventListener('submit', handlePaidCode);

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const viewName = btn.dataset.view;
      if (viewName === 'logout') {
        logout();
        return;
      }
      switchView(viewName);
    });
  });

  document.getElementById('openAddModalFab').addEventListener('click', openBrainrotModal);
  document.getElementById('openAddModalTop').addEventListener('click', openBrainrotModal);
  document.getElementById('openBulkModalTop').addEventListener('click', openBulkModal);

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

  ui.searchInput.addEventListener('input', (event) => {
    filters.search = event.target.value.trim().toLowerCase();
    renderCollection();
  });

  ui.brainrotForm.addEventListener('submit', handleAddBrainrot);
  ui.bulkForm.addEventListener('submit', handleBulkAdd);
  ui.editForm.addEventListener('submit', handleEditBrainrot);

  ui.collectionWrap.addEventListener('click', handleCollectionClick);

  ui.galleryInput.addEventListener('change', handleGalleryInput);
  ui.cameraInput.addEventListener('change', handleCameraInput);

  ui.slotGalleryBtn.addEventListener('click', () => ui.galleryInput.click());
  ui.slotCameraBtn.addEventListener('click', () => ui.cameraInput.click());
  ui.slotDeleteBtn.addEventListener('click', deleteCurrentSlotImage);
  ui.countPlusBtn.addEventListener('click', () => updateCurrentSlotCount(1));
  ui.countMinusBtn.addEventListener('click', () => updateCurrentSlotCount(-1));

  document.getElementById('exportBtn').addEventListener('click', exportState);
  document.getElementById('importInput').addEventListener('change', importState);
  document.getElementById('seedBtn').addEventListener('click', resetToSeed);
  document.getElementById('wipePhotosBtn').addEventListener('click', wipePhotos);
  document.getElementById('wipeAllBtn').addEventListener('click', wipeAll);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) backdrop.classList.add('hidden');
    });
  });

  highlightSortButtons();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    ui.installBtn.classList.remove('hidden');
  });

  ui.installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    ui.installBtn.classList.add('hidden');
  });
}

function switchAuthTab(tabName) {
  ui.authTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.authTab === tabName);
  });

  ui.authClosePane.classList.toggle('active', tabName === 'close');
  ui.authPaidPane.classList.toggle('active', tabName === 'paid');
}

function populateSelects() {
  const options = RARITY_ORDER.map((rarity) => `
    <option value="${rarity}">${RARITY_LABELS[rarity]}</option>
  `).join('');

  ui.brainrotRarityInput.innerHTML = options;
  ui.bulkRarityInput.innerHTML = options;
  ui.editBrainrotRarityInput.innerHTML = options;
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

function loadSession() {
  try {
    session = JSON.parse(localStorage.getItem('brainrot_vault_session') || 'null');
  } catch {
    session = null;
  }
}

function saveSession() {
  localStorage.setItem('brainrot_vault_session', JSON.stringify(session));
}

function clearSession() {
  session = null;
  localStorage.removeItem('brainrot_vault_session');
}

function renderAuth() {
  const logged = Boolean(session);

  ui.authScreen.classList.toggle('hidden', logged);
  ui.appScreen.classList.toggle('hidden', !logged);

  if (logged) {
    const modeText = session.mode === 'close' ? 'Accès proche gratuit' : 'Accès payant actif';
    ui.sessionLabel.textContent = `Connecté : ${session.displayName} - ${modeText}`;
    ui.accountModeText.textContent = modeText;
    ui.accountUserText.textContent = session.displayName;
    ui.accountAccessText.textContent = session.mode === 'close' ? 'Compte proche' : 'Compte public payant';
    switchView('collection');
  }
}

function handleCloseLogin(event) {
  event.preventDefault();

  const username = ui.closeUsername.value.trim();
  const password = ui.closePassword.value;

  const user = CLOSE_USERS.find((item) => item.username === username);

  if (!user || password !== APP_CONFIG.COMMON_CLOSE_PASSWORD) {
    showToast('Identifiant ou mot de passe incorrect.');
    return;
  }

  session = {
    mode: 'close',
    username: user.username,
    displayName: user.displayName,
    role: user.role
  };

  saveSession();
  ui.closePassword.value = '';
  renderAuth();
  renderAll();
  showToast(`Bienvenue ${user.displayName}.`);
}

function openRevolutPayment() {
  window.open(APP_CONFIG.REVOLUT_LINK_6M, '_blank');
}

function handlePaidCode(event) {
  event.preventDefault();
  const code = ui.paidAccessCode.value.trim();

  if (!code || code !== APP_CONFIG.PAID_ACCESS_CODE) {
    showToast('Code d’activation invalide.');
    return;
  }

  session = {
    mode: 'paid',
    username: 'client',
    displayName: 'Client Premium',
    role: 'paid'
  };

  saveSession();
  ui.paidAccessCode.value = '';
  renderAuth();
  renderAll();
  showToast('Accès premium activé.');
}

function logout() {
  clearSession();
  document.querySelectorAll('.modal-backdrop').forEach((modal) => modal.classList.add('hidden'));
  renderAuth();
  showToast('Déconnecté.');
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
    brainrots: DEFAULT_BRAINROTS.map((item) => createBrainrot(item.name, item.rarity, item.source))
  };
}

function createBrainrot(name, rarity, source = 'custom') {
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
    source,
    favorite: false,
    createdAt: Date.now(),
    versions
  };
}

function createId(seed = 'brainrot') {
  return `${seed.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
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
  const cleanName = name.trim();
  if (!cleanName) return { added: false };

  const exists = state.brainrots.some((brainrot) => brainrot.name.toLowerCase() === cleanName.toLowerCase());
  if (exists) return { added: false };

  state.brainrots.unshift(createBrainrot(cleanName, rarity, 'custom'));
  return { added: true };
}

function findBrainrot(id) {
  return state.brainrots.find((brainrot) => brainrot.id === id);
}

function canEditBrainrot() {
  return true;
}

function getVersionOwned(versionData) {
  return Boolean(versionData && (versionData.image || versionData.count > 0));
}

function getBrainrotOwnedCount(brainrot) {
  return VERSION_ORDER.reduce((count, version) => count + (getVersionOwned(brainrot.versions[version]) ? 1 : 0), 0);
}

function rarityToClass(rarity) {
  return rarity.replaceAll('_', '-');
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
  if (!state) return;
  renderSummary();
  renderCollection();
  renderStats();
}

function renderSummary() {
  const totalSlots = state.brainrots.length * VERSION_ORDER.length;
  const ownedSlots = state.brainrots.reduce((total, brainrot) => total + getBrainrotOwnedCount(brainrot), 0);
  const completion = totalSlots ? Math.round((ownedSlots / totalSlots) * 100) : 0;
  const secretCount = state.brainrots.filter((brainrot) => brainrot.rarity === 'secret').length;

  ui.summaryCompletion.textContent = `${completion}%`;
  ui.summaryOwned.textContent = `${ownedSlots} / ${totalSlots} versions`;
  ui.summaryBrainrots.textContent = state.brainrots.length;
  ui.summaryMissing.textContent = totalSlots - ownedSlots;
  ui.summarySecrets.textContent = `${secretCount} / ${SECRET_TARGET}`;
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
  RARITY_ORDER.forEach((rarity) => { groups[rarity] = []; });
  filtered.forEach((brainrot) => groups[brainrot.rarity].push(brainrot));

  ui.collectionWrap.innerHTML = RARITY_ORDER.map((rarity) => {
    const items = groups[rarity];
    if (!items.length) return '';

    const total = items.length * VERSION_ORDER.length;
    const owned = items.reduce((sum, brainrot) => sum + getBrainrotOwnedCount(brainrot), 0);
    const progress = total ? Math.round((owned / total) * 100) : 0;
    const extraMeta = rarity === 'secret' ? ` - objectif ${SECRET_TARGET}` : '';

    return `
      <section class="rarity-section rarity-section-${rarityToClass(rarity)}">
        <div class="section-header">
          <div>
            <h3>${RARITY_LABELS[rarity]}</h3>
            <div class="section-meta">${items.length} brainrot${items.length > 1 ? 's' : ''}${extraMeta}</div>
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
  const editable = canEditBrainrot(brainrot);

  return `
    <article class="brainrot-card brainrot-card-${rarityToClass(brainrot.rarity)}" data-id="${brainrot.id}">
      <div class="card-head">
        <div>
          <div class="card-topline">
            <span class="rarity-badge ${rarityToClass(brainrot.rarity)}">${RARITY_LABELS[brainrot.rarity]}</span>
            <span class="source-badge">${brainrot.source === 'base' ? 'Base' : 'Perso'}</span>
            <span class="section-meta">${getBrainrotOwnedCount(brainrot)} / ${VERSION_ORDER.length} versions</span>
          </div>
          <h3>${escapeHtml(brainrot.name)}</h3>
          <p class="card-sub">Ajoute une image depuis la galerie ou prends une photo.</p>

          ${editable ? `
            <div class="card-actions">
              <button class="mini-btn" type="button" data-action="edit" data-id="${brainrot.id}">Modifier</button>
              <button class="mini-btn danger" type="button" data-action="delete-brainrot" data-id="${brainrot.id}">Supprimer</button>
            </div>
          ` : ''}
        </div>

        <button class="favorite-btn ${brainrot.favorite ? 'active' : ''}" type="button" data-action="favorite" data-id="${brainrot.id}">
          ${brainrot.favorite ? '★' : '☆'}
        </button>
      </div>

      <div class="versions-grid">
        ${VERSION_ORDER.map((version, index) => renderVersionSlot(brainrot, version, index + 1)).join('')}
      </div>
    </article>
  `;
}

function renderVersionSlot(brainrot, version, slotNumber) {
  const versionData = brainrot.versions[version];
  const isOwned = getVersionOwned(versionData);

  return `
    <button class="slot-btn ${isOwned ? 'filled' : ''}" type="button" data-action="slot" data-id="${brainrot.id}" data-version="${version}">
      ${versionData.count > 1 ? `<span class="slot-count">x${versionData.count}</span>` : ''}
      <div class="slot-thumb">
        ${isOwned && versionData.image
          ? `<img src="${versionData.image}" alt="${escapeHtml(brainrot.name)} ${VERSION_LABELS[version]}">`
          : `<div class="slot-placeholder"><strong>＋</strong><span>Image</span></div>`
        }
      </div>
      <div class="version-caption">
        ${VERSION_LABELS[version]}
        <small>Case ${slotNumber}</small>
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
          <strong>${RARITY_LABELS[rarity]}</strong>
          <span class="rarity-badge ${rarityToClass(rarity)}">${progress}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${progress}%; background:${getRarityColor(rarity)};"></div>
        </div>
        <div class="section-meta">${owned} / ${total} versions</div>
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
      ${entry.image ? `<img src="${entry.image}" alt="${escapeHtml(entry.name)}">` : ''}
      <div class="recent-info">
        <div class="recent-name">${escapeHtml(entry.name)}</div>
        <div class="recent-meta">${VERSION_LABELS[entry.version]} - ${RARITY_LABELS[entry.rarity]}</div>
        <div class="recent-date">${formatDate(entry.addedAt)}</div>
      </div>
    </article>
  `).join('') : `
    <div class="empty-state">
      <strong>Aucun ajout récent</strong>
      <p>Ajoute une première image pour remplir cette section.</p>
    </div>
  `;
}

function getRecentEntries() {
  return state.brainrots.flatMap((brainrot) =>
    VERSION_ORDER
      .filter((version) => brainrot.versions[version].addedAt)
      .map((version) => ({
        name: brainrot.name,
        rarity: brainrot.rarity,
        version,
        image: brainrot.versions[version].image,
        addedAt: brainrot.versions[version].addedAt
      }))
  ).sort((a, b) => b.addedAt - a.addedAt).slice(0, 8);
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
    return;
  }

  const editBtn = event.target.closest('[data-action="edit"]');
  if (editBtn) {
    openEditModal(editBtn.dataset.id);
    return;
  }

  const deleteBtn = event.target.closest('[data-action="delete-brainrot"]');
  if (deleteBtn) {
    deleteBrainrot(deleteBtn.dataset.id);
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

async function handleAddBrainrot(event) {
  event.preventDefault();

  const name = ui.brainrotNameInput.value.trim();
  const rarity = ui.brainrotRarityInput.value;

  if (!name) {
    showToast('Le nom du brainrot est obligatoire.');
    return;
  }

  const result = addBrainrot(name, rarity);
  if (!result.added) {
    showToast('Ce brainrot existe déjà.');
    return;
  }

  await persistState();
  closeModal('brainrotModal');
  ui.brainrotForm.reset();
  renderAll();
  showToast('Brainrot ajouté.');
}

function openBulkModal() {
  ui.bulkForm.reset();
  ui.bulkModal.classList.remove('hidden');
  ui.bulkNamesInput.focus();
}

async function handleBulkAdd(event) {
  event.preventDefault();

  const rarity = ui.bulkRarityInput.value;
  const raw = ui.bulkNamesInput.value.trim();

  if (!raw) {
    showToast('Ajoute au moins un nom.');
    return;
  }

  const names = raw
    .split(/\n|;/)
    .map((name) => name.trim())
    .filter(Boolean);

  let added = 0;
  let skipped = 0;

  names.forEach((name) => {
    const result = addBrainrot(name, rarity);
    if (result.added) added += 1;
    else skipped += 1;
  });

  await persistState();
  closeModal('bulkModal');
  ui.bulkForm.reset();
  renderAll();
  showToast(`${added} ajoutés${skipped ? `, ${skipped} ignorés` : ''}.`);
}

function openEditModal(brainrotId) {
  const brainrot = findBrainrot(brainrotId);
  if (!brainrot) return;

  currentEditId = brainrotId;
  ui.editBrainrotNameInput.value = brainrot.name;
  ui.editBrainrotRarityInput.value = brainrot.rarity;
  ui.editModal.classList.remove('hidden');
}

async function handleEditBrainrot(event) {
  event.preventDefault();
  const brainrot = findBrainrot(currentEditId);
  if (!brainrot) return;

  const newName = ui.editBrainrotNameInput.value.trim();
  const newRarity = ui.editBrainrotRarityInput.value;

  if (!newName) {
    showToast('Nom obligatoire.');
    return;
  }

  const exists = state.brainrots.some((item) => item.id !== brainrot.id && item.name.toLowerCase() === newName.toLowerCase());
  if (exists) {
    showToast('Un brainrot avec ce nom existe déjà.');
    return;
  }

  brainrot.name = newName;
  brainrot.rarity = newRarity;
  if (!brainrot.source) brainrot.source = 'custom';

  await persistState();
  closeModal('editModal');
  renderAll();
  showToast('Brainrot modifié.');
}

async function deleteBrainrot(brainrotId) {
  const brainrot = findBrainrot(brainrotId);
  if (!brainrot) return;

  const ok = confirm(`Supprimer "${brainrot.name}" ?`);
  if (!ok) return;

  state.brainrots = state.brainrots.filter((item) => item.id !== brainrotId);
  await persistState();
  renderAll();
  showToast('Brainrot supprimé.');
}

function openSlotModal(brainrotId, version) {
  const brainrot = findBrainrot(brainrotId);
  if (!brainrot) return;

  currentSlot = { brainrotId, version };

  const versionData = brainrot.versions[version];
  ui.slotModalTitle.textContent = brainrot.name;
  ui.slotModalKicker.textContent = VERSION_LABELS[version];
  ui.slotCountValue.textContent = versionData.count || 0;
  ui.slotDateValue.textContent = versionData.addedAt ? formatDate(versionData.addedAt) : 'Aucune image';

  if (versionData.image) {
    ui.slotPreview.innerHTML = `<img src="${versionData.image}" alt="${escapeHtml(brainrot.name)} ${VERSION_LABELS[version]}">`;
  } else {
    ui.slotPreview.innerHTML = `
      <div class="slot-preview-empty">
        <strong>＋</strong>
        <span>Choisis une image ou prends une photo pour cette case ${VERSION_LABELS[version].toLowerCase()}.</span>
      </div>
    `;
  }

  ui.slotDeleteBtn.disabled = !getVersionOwned(versionData);
  ui.slotDeleteBtn.style.opacity = getVersionOwned(versionData) ? '1' : '0.5';
  ui.slotModal.classList.remove('hidden');
}

async function handleGalleryInput(event) {
  const file = event.target.files?.[0];
  if (!file || !currentSlot) return;
  await applyImageToCurrentSlot(file);
  event.target.value = '';
}

async function handleCameraInput(event) {
  const file = event.target.files?.[0];
  if (!file || !currentSlot) return;
  await applyImageToCurrentSlot(file);
  event.target.value = '';
}

async function applyImageToCurrentSlot(file) {
  try {
    const compressed = await compressImage(file, APP_CONFIG.IMAGE_MAX_SIZE, APP_CONFIG.IMAGE_QUALITY);
    const brainrot = findBrainrot(currentSlot.brainrotId);
    if (!brainrot) return;

    brainrot.versions[currentSlot.version].image = compressed;
    brainrot.versions[currentSlot.version].count = Math.max(brainrot.versions[currentSlot.version].count || 0, 1);
    brainrot.versions[currentSlot.version].addedAt = Date.now();

    await persistState();
    renderAll();
    openSlotModal(currentSlot.brainrotId, currentSlot.version);
    showToast('Image ajoutée dans la case.');
  } catch {
    showToast('Impossible de traiter cette image.');
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
    showToast('Ajoute d’abord une image.');
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
  } catch {
    showToast('Import impossible. Vérifie le fichier JSON.');
  } finally {
    event.target.value = '';
  }
}

async function resetToSeed() {
  if (!confirm('Recharger la base de départ ?')) return;
  state = createSeedState();
  await persistState();
  renderAll();
  showToast('Base rechargée.');
}

async function wipePhotos() {
  if (!confirm('Supprimer toutes les images mais garder les brainrots ?')) return;

  state.brainrots.forEach((brainrot) => {
    VERSION_ORDER.forEach((version) => {
      brainrot.versions[version].image = '';
      brainrot.versions[version].count = 0;
      brainrot.versions[version].addedAt = null;
    });
  });

  await persistState();
  renderAll();
  showToast('Toutes les images ont été supprimées.');
}

async function wipeAll() {
  if (!confirm('Tout effacer ?')) return;
  state = createSeedState();
  await persistState();
  renderAll();
  showToast('Application réinitialisée.');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function getRarityColor(rarity) {
  return ({
    common: '#c7cedf',
    rare: '#5ec0ff',
    epic: '#b57cff',
    mythic: '#ff69cf',
    legendary: '#ffd85e',
    ultra_legendary: '#ff9c45',
    secret: '#36f3b1'
  })[rarity] || '#67c8ff';
}

function getVersionColor(version) {
  return ({
    normal: '#9ba6cb',
    diamond: '#63d7ff',
    gold: '#ffd85e',
    divine: '#ffffff',
    rainbow: '#c17bff'
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
  showToast.timeout = setTimeout(() => {
    ui.toast.classList.add('hidden');
  }, 2200);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function compressImage(file, maxSize = 1800, quality = 0.92) {
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
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
