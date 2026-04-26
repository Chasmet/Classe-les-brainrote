(() => {
  const OPEN_CLASSES = ['active', 'open'];
  const HIDE_CLASS = 'hidden';
  let renderTimer = null;

  function addStyle() {
    if (document.getElementById('uiCleanerCssV1')) return;
    const style = document.createElement('style');
    style.id = 'uiCleanerCssV1';
    style.textContent = `
      html, body {
        background: #071026 !important;
        overflow-x: hidden !important;
      }

      .app-shell,
      .auth-screen,
      .view,
      .modal-backdrop,
      .modal-sheet,
      .block-panel,
      .cases-panel-v2,
      .case-edit-v2,
      .custom-slot-panel,
      .case-panel,
      .case-edit-panel,
      .bottom-nav,
      .panel,
      .brainrot-card,
      .rarity-section {
        isolation: isolate;
        backface-visibility: hidden;
        transform: translateZ(0);
      }

      .app-shell,
      .auth-screen {
        background: #071026 !important;
        min-height: 100dvh;
      }

      .view {
        background: transparent;
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

      .collection-wrap,
      .versions-grid,
      .stats-grid,
      .version-stats-grid,
      .recent-list,
      #collectionWrap,
      #rarityChips,
      #statusChips {
        contain: layout paint style;
      }

      .ui-reflowing * {
        transition: none !important;
        animation-duration: .001s !important;
      }
    `;
    document.head.appendChild(style);
  }

  function closeAllFloating(except = null) {
    const floatingSelectors = [
      '.modal-backdrop',
      '.block-panel',
      '.cases-panel-v2',
      '.case-edit-v2',
      '.custom-slot-panel',
      '.case-panel',
      '.case-edit-panel'
    ];

    document.querySelectorAll(floatingSelectors.join(',')).forEach((element) => {
      if (except && element === except) return;
      element.classList.add(HIDE_CLASS);
      OPEN_CLASSES.forEach(cls => element.classList.remove(cls));
      element.setAttribute('aria-hidden', 'true');
    });
  }

  function clearNavigationStack(targetViewId = null) {
    document.querySelectorAll('.view').forEach((view) => {
      const isTarget = targetViewId && view.id === targetViewId;
      view.classList.toggle('active', isTarget);
      view.style.display = isTarget ? 'block' : 'none';
      view.style.visibility = isTarget ? 'visible' : 'hidden';
      view.style.pointerEvents = isTarget ? 'auto' : 'none';
      view.setAttribute('aria-hidden', isTarget ? 'false' : 'true');
    });
  }

  function purgeDuplicateFloating() {
    const uniqueIds = ['blockPanel', 'casePanel', 'caseEditPanel', 'casesPanelV2', 'caseEditV2', 'customSlotPanel'];
    uniqueIds.forEach((id) => {
      const nodes = [...document.querySelectorAll(`#${CSS.escape(id)}`)];
      nodes.slice(0, -1).forEach(node => node.remove());
    });
  }

  function invalidateLayout() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      document.documentElement.classList.add('ui-reflowing');

      purgeDuplicateFloating();

      const repaintTargets = [
        '#collectionWrap',
        '.collection-wrap',
        '.versions-grid',
        '#rarityChips',
        '#statusChips',
        '.stats-grid',
        '.version-stats-grid',
        '.recent-list'
      ];

      document.querySelectorAll(repaintTargets.join(',')).forEach((node) => {
        node.style.contain = 'none';
        void node.offsetHeight;
        node.style.contain = 'layout paint style';
      });

      requestAnimationFrame(() => {
        document.documentElement.classList.remove('ui-reflowing');
      });
    }, 40);
  }

  function patchNavigation() {
    document.addEventListener('click', (event) => {
      const nav = event.target.closest('[data-view]');
      if (!nav) return;

      const view = nav.dataset.view;
      if (!view || view === 'logout') {
        closeAllFloating();
        invalidateLayout();
        return;
      }

      const target = document.getElementById(`view-${view}`) || document.getElementById(`${view}View`);
      if (!target) return;

      closeAllFloating();
      clearNavigationStack(target.id);

      document.querySelectorAll('[data-view]').forEach(btn => btn.classList.toggle('active', btn === nav));
      invalidateLayout();
    }, true);
  }

  function patchPopupClose() {
    document.addEventListener('click', (event) => {
      const closeBtn = event.target.closest('[data-close-modal], .block-close, .case-close, .case-close-v2, .cases-close-v2');
      if (!closeBtn) return;

      const floating = closeBtn.closest('.modal-backdrop, .block-panel, .cases-panel-v2, .case-edit-v2, .custom-slot-panel, .case-panel, .case-edit-panel');
      if (floating) {
        floating.classList.add(HIDE_CLASS);
        OPEN_CLASSES.forEach(cls => floating.classList.remove(cls));
        floating.setAttribute('aria-hidden', 'true');
      }

      invalidateLayout();
    }, true);

    document.addEventListener('click', (event) => {
      const backdrop = event.target.closest('.modal-backdrop');
      if (backdrop && event.target === backdrop) {
        backdrop.classList.add(HIDE_CLASS);
        backdrop.setAttribute('aria-hidden', 'true');
        invalidateLayout();
      }
    }, true);
  }

  function observeRenderMutations() {
    const target = document.getElementById('collectionWrap') || document.body;
    const observer = new MutationObserver(() => invalidateLayout());
    observer.observe(target, { childList: true, subtree: true });
  }

  function patchProgrammaticRender() {
    ['renderAll', 'renderCollection', 'renderStats'].forEach((name) => {
      if (typeof window[name] !== 'function' || window[name]._uiCleaned) return;
      const original = window[name];
      const patched = function (...args) {
        const result = original.apply(this, args);
        invalidateLayout();
        return result;
      };
      patched._uiCleaned = true;
      window[name] = patched;
    });
  }

  function boot() {
    addStyle();
    closeAllFloating();
    patchNavigation();
    patchPopupClose();
    observeRenderMutations();
    setInterval(patchProgrammaticRender, 800);
    setInterval(invalidateLayout, 1600);
    invalidateLayout();
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 300));
})();
