(() => {
  const HIDE_CLASS = 'hidden';
  let lastTap = 0;

  function addStyle() {
    if (document.getElementById('uiCleanerCssV2')) return;
    const style = document.createElement('style');
    style.id = 'uiCleanerCssV2';
    style.textContent = `
      html, body {
        background: #071026 !important;
        overflow-x: hidden !important;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      button, .chip, .nav-btn, .slot-btn, .brainrot-card, .rarity-section {
        touch-action: manipulation;
      }

      button:active, .chip:active, .nav-btn:active {
        transform: scale(.98);
        filter: brightness(1.08);
      }

      .view:not(.active) {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
      }

      .view.active {
        display: block !important;
        visibility: visible !important;
        pointer-events: auto !important;
        opacity: 1 !important;
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

      .modal-sheet {
        background: #0b1430 !important;
      }

      #collectionWrap,
      .collection-wrap,
      .versions-grid {
        contain: layout paint;
      }
    `;
    document.head.appendChild(style);
  }

  function closeFloatingPanels() {
    document.querySelectorAll('.modal-backdrop, .block-panel, .cases-panel-v2, .case-edit-v2, .custom-slot-panel, .case-panel, .case-edit-panel').forEach((el) => {
      el.classList.add(HIDE_CLASS);
      el.classList.remove('active', 'open');
      el.setAttribute('aria-hidden', 'true');
    });
  }

  function showOnlyView(viewName) {
    const target = document.getElementById(`view-${viewName}`) || document.getElementById(`${viewName}View`);
    if (!target) return;

    document.querySelectorAll('.view').forEach((view) => {
      const active = view === target;
      view.classList.toggle('active', active);
      view.style.display = active ? 'block' : 'none';
      view.style.visibility = active ? 'visible' : 'hidden';
      view.style.pointerEvents = active ? 'auto' : 'none';
    });

    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
  }

  function softReflow() {
    requestAnimationFrame(() => {
      const wrap = document.getElementById('collectionWrap');
      if (!wrap) return;
      wrap.style.transform = 'translateZ(0)';
      void wrap.offsetHeight;
      wrap.style.transform = '';
    });
  }

  function patchNavigation() {
    document.addEventListener('click', (event) => {
      const nav = event.target.closest('[data-view]');
      if (!nav) return;
      const view = nav.dataset.view;
      closeFloatingPanels();
      if (view && view !== 'logout') showOnlyView(view);
      softReflow();
    }, true);
  }

  function patchCloseButtons() {
    document.addEventListener('click', (event) => {
      const close = event.target.closest('[data-close-modal], .block-close, .case-close, .case-close-v2, .cases-close-v2');
      if (!close) return;
      const panel = close.closest('.modal-backdrop, .block-panel, .cases-panel-v2, .case-edit-v2, .custom-slot-panel, .case-panel, .case-edit-panel');
      if (panel) {
        panel.classList.add(HIDE_CLASS);
        panel.classList.remove('active', 'open');
        panel.setAttribute('aria-hidden', 'true');
      }
      softReflow();
    }, true);
  }

  function removeDoubleTapZoomLag() {
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTap < 280) event.preventDefault();
      lastTap = now;
    }, { passive: false });
  }

  function boot() {
    addStyle();
    patchNavigation();
    patchCloseButtons();
    removeDoubleTapZoomLag();
    softReflow();
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 250));
})();
