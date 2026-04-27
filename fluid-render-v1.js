(() => {
  const LIMIT_KEY = 'brainrot_fluid_limits_v1';
  const DEFAULT_LIMIT = 2;
  const STEP = 3;
  let limits = loadLimits();

  function loadLimits() {
    try {
      return JSON.parse(sessionStorage.getItem(LIMIT_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function saveLimits() {
    sessionStorage.setItem(LIMIT_KEY, JSON.stringify(limits));
  }

  function injectStyle() {
    if (document.getElementById('fluidRenderCss')) return;
    const style = document.createElement('style');
    style.id = 'fluidRenderCss';
    style.textContent = `
      .fluid-note {
        margin: 10px 0 12px;
        padding: 10px 12px;
        border-radius: 16px;
        background: rgba(101,216,255,.10);
        color: #d9f3ff;
        font-size: 13px;
        font-weight: 800;
        text-align: center;
      }
      .fluid-load-btn {
        width: 100%;
        min-height: 54px;
        margin-top: 10px;
        border: 0;
        border-radius: 18px;
        background: #253866;
        color: #fff;
        font-weight: 900;
        font-size: 16px;
        touch-action: manipulation;
      }
      .fluid-count {
        display: block;
        margin-top: 6px;
        color: #cbd6f6;
        font-size: 12px;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  function ready() {
    return typeof renderCollection === 'function'
      && typeof getFilteredBrainrots === 'function'
      && typeof renderBrainrotCard === 'function'
      && typeof ui !== 'undefined'
      && ui.collectionWrap;
  }

  function patchRenderCollection() {
    if (!ready()) return false;
    if (window.__brainrotFluidRenderPatched) return true;
    window.__brainrotFluidRenderPatched = true;

    renderCollection = function renderCollectionFluid() {
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

      const note = `
        <div class="fluid-note">
          Mode fluide actif : l’app charge les cartes petit à petit pour éviter le scroll lourd.
        </div>
      `;

      ui.collectionWrap.innerHTML = note + RARITY_ORDER.map((rarity) => {
        const items = groups[rarity];
        if (!items.length) return '';

        const currentLimit = Number(limits[rarity] || DEFAULT_LIMIT);
        const visibleItems = items.slice(0, currentLimit);
        const hiddenCount = Math.max(0, items.length - visibleItems.length);
        const total = items.length * VERSION_ORDER.length;
        const owned = items.reduce((sum, brainrot) => sum + getBrainrotOwnedCount(brainrot), 0);
        const progress = total ? Math.round((owned / total) * 100) : 0;
        const extraMeta = rarity === 'secret' ? ` - objectif ${SECRET_TARGET}` : '';

        return `
          <section class="rarity-section rarity-section-${rarityToClass(rarity)}" data-fluid-rarity="${rarity}">
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
            ${visibleItems.map(renderBrainrotCard).join('')}
            ${hiddenCount > 0 ? `
              <button class="fluid-load-btn" type="button" data-fluid-more="${rarity}">
                Afficher ${Math.min(STEP, hiddenCount)} de plus
                <span class="fluid-count">${visibleItems.length} / ${items.length} affichés</span>
              </button>
            ` : ''}
          </section>
        `;
      }).join('');
    };

    document.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-fluid-more]');
      if (!btn) return;
      const rarity = btn.dataset.fluidMore;
      limits[rarity] = Number(limits[rarity] || DEFAULT_LIMIT) + STEP;
      saveLimits();
      renderCollection();
    });

    renderCollection();
    return true;
  }

  function boot() {
    injectStyle();
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (patchRenderCollection() || attempts > 40) clearInterval(timer);
    }, 120);
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 250));
})();
