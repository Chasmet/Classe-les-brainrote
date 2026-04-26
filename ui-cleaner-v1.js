(() => {
  const HIDE_CLASS = 'hidden';
  let lastTap = 0;
  let reflowTimer = null;

  function addStyle() {
    if (document.getElementById('uiCleanerCssV3')) return;
    const style = document.createElement('style');
    style.id = 'uiCleanerCssV3';
    style.textContent = `
      html, body {
        background: #071026 !important;
        overflow-x: hidden !important;
        -webkit-tap-highlight-color: transparent !important;
        touch-action: manipulation !important;
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: -1;
        background: #071026;
      }

      .app-shell,
      .auth-screen,
      .views,
      .view,
      .panel,
      .controls-panel,
      .rarity-section,
      .brainrot-card,
      .bottom-nav,
      .modal-sheet,
      .block-panel,
      .cases-panel-v2,
      .case-edit-v2,
      .custom-slot-panel,
      .case-panel,
      .case-edit-panel {
        isolation: isolate !important;
        backface-visibility: hidden !important;
        transform: translateZ(0);
      }

      .app-shell,
      .auth-screen,
      .views {
        background: #071026 !important;
      }

      .view {
        background: #071026 !important;
        min-height: 100dvh;
      }

      .view:not(.active) {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        position: absolute !important;
        inset: 0 !important;
        z-index: -1 !important;
      }

      .view.active {
        display: block !important;
        visibility: visible !important;
        pointer-events: auto !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 1 !important;
      }

      .modal-backdrop,
      .block-panel,
      .cases-panel-v2,
      .case-edit-v2,
      .custom-slot-panel,
      .case-panel,
      .case-edit-panel {
        background: #071026 !important;
        z-index: 100000 !important;
      }

      .modal-backdrop {
        background: rgba(2, 6, 18, .94) !important;
      }

      .modal-sheet,
      .block-panel,
      .cases-panel-v2,
      .case-edit-v2,
      .custom-slot-panel,
      .case-panel,
      .case-edit-panel {
        background: #0b1430 !important;
      }

      .modal-backdrop.hidden,
      .block-panel.hidden,
      .cases-panel-v2.hidden,
      .case-edit-v2.hidden,
      .custom-slot-panel.hidden,
      .case-panel.hidden,
      .case-edit-panel.hidden {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
      }

      #collectionWrap,
      .collection-wrap,
      .versions-grid,
      .custom-slots-grid,
      #rarityChips,
      #statusChips,
      .stats-grid,
      .version-stats-grid,
      .recent-list {
        contain: layout paint style !important;
      }

      .ui-redraw-force {
        transform: translateZ(0) scale(1) !important;
      }

      button, .chip, .nav-btn, .slot-btn, .brainrot-card, .rarity-section {
        touch-action: manipulation !important;
      }

      button:active, .chip:active, .nav-btn:active {
        transform: scale(.98) translateZ(0) !important;
        filter: brightness(1.08);
      }
    `;
    document.head.appendChild(style);
  }

  function hideElement(el) {
    if (!el) return;
    el.classList.add(HIDE_CLASS);
    el.classList.remove('active', 'open', 'show');
    el.setAttribute('aria-hidden', 'true');
    el.style.pointerEvents = 'none';
  }

  function closeFloatingPanels(except = null) {
    document.querySelectorAll('.modal-backdrop, .block-panel, .cases-panel-v2, .case-edit-v2, .custom-slot-panel, .case-panel, .case-edit-panel').forEach((el) => {
      if (except && el === except) return;
      hideElement(el);
    });
  }

  function removeDuplicateLayers() {
    ['blockPanel', 'casesPanelV2', 'caseEditV2', 'customSlotPanel', 'casePanel', 'caseEditPanel', 'imageLightboxV2'].forEach((id) => {
      const items = Array.from(document.querySelectorAll(`#${CSS.escape(id)}`));
      items.slice(0, -1).forEach((node) => node.remove());
    });
  }

  function showOnlyView(viewName) {
    const target = document.getElementById(`view-${viewName}`) || document.getElementById(`${viewName}View`);
    if (!target) return;

    closeFloatingPanels();
    removeDuplicateLayers();

    document.querySelectorAll('.view').forEach((view) => {
      const active = view === target;
      view.classList.toggle('active', active);
      view.style.display = active ? 'block' : 'none';
      view.style.visibility = active ? 'visible' : 'hidden';
      view.style.pointerEvents = active ? 'auto' : 'none';
      view.style.opacity = active ? '1' : '0';
      view.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    forceParentInvalidate(target);
  }

  function forceParentInvalidate(target) {
    clearTimeout(reflowTimer);
    reflowTimer = setTimeout(() => {
      const nodes = [
        target,
        document.getElementById('appScreen'),
        document.getElementById('collectionWrap'),
        ...document.querySelectorAll('.collection-wrap, .versions-grid, .custom-slots-grid, .rarity-section, .brainrot-card')
      ].filter(Boolean);

      nodes.forEach((node) => {
        node.classList.add('ui-redraw-force');
        node.style.willChange = 'transform';
        void node.offsetHeight;
      });

      requestAnimationFrame(() => {
        nodes.forEach((node) => {
          node.style.willChange = '';
          node.classList.remove('ui-redraw-force');
        });
      });
    }, 25);
  }

  function patchNavigation() {
    document.addEventListener('click', (event) => {
      const nav = event.target.closest('[data-view]');
      if (!nav) return;
      const view = nav.dataset.view;
      if (view && view !== 'logout') showOnlyView(view);
      else {
        closeFloatingPanels();
        forceParentInvalidate(document.body);
      }
    }, true);
  }

  function patchCloseButtons() {
    document.addEventListener('click', (event) => {
      const close = event.target.closest('[data-close-modal], .block-close, .case-close, .case-close-v2, .cases-close-v2');
      if (!close) return;
      const panel = close.closest('.modal-backdrop, .block-panel, .cases-panel-v2, .case-edit-v2, .custom-slot-panel, .case-panel, .case-edit-panel');
      hideElement(panel);
      forceParentInvalidate(document.body);
    }, true);

    document.addEventListener('click', (event) => {
      const backdrop = event.target.closest('.modal-backdrop');
      if (backdrop && event.target === backdrop) {
        hideElement(backdrop);
        forceParentInvalidate(document.body);
      }
    }, true);
  }

  function patchListActions() {
    document.addEventListener('click', (event) => {
      if (!event.target.closest('button, .chip, .slot-btn, .custom-case-card-v2, .custom-slot-btn')) return;
      forceParentInvalidate(document.getElementById('collectionWrap') || document.body);
    }, true);

    document.addEventListener('change', () => {
      forceParentInvalidate(document.getElementById('collectionWrap') || document.body);
    }, true);
  }

  function observeCollection() {
    const wrap = document.getElementById('collectionWrap');
    if (!wrap || wrap.dataset.redrawObserver === '1') return;
    wrap.dataset.redrawObserver = '1';
    const observer = new MutationObserver(() => forceParentInvalidate(wrap));
    observer.observe(wrap, { childList: true, subtree: true });
  }

  function removeDoubleTapZoomLag() {
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTap < 280) event.preventDefault();
      lastTap = now;
    }, { passive: false });
  }

  function loadScriptOnce(src, id) {
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
  }

  function boot() {
    addStyle();
    patchNavigation();
    patchCloseButtons();
    patchListActions();
    removeDoubleTapZoomLag();
    observeCollection();
    closeFloatingPanels();
    forceParentInvalidate(document.body);
    loadScriptOnce('access-v2.js?v=2', 'accessV2Script');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 250));
  } else {
    setTimeout(boot, 250);
  }
})();
