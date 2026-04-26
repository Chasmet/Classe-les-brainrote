(() => {
  const PREMIUM_KEY = 'brainrot_v4_premium_access';
  const REVOLUT_LINK = 'https://checkout.revolut.com/pay/669d32f3-77f9-41d1-8e6b-a5aa384d2760';
  const PREMIUM_CODES = ['CHK-6MOIS-2026', 'BRAINROT-PREMIUM', 'VIP-CHK'];
  const SIX_MONTHS = 1000 * 60 * 60 * 24 * 183;
  let touchStartX = 0;
  let touchStartY = 0;
  let dragGhost = null;

  function toast(message) {
    const el = document.getElementById('toast');
    if (!el) return alert(message);
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  function getPremium() {
    try {
      const data = JSON.parse(localStorage.getItem(PREMIUM_KEY) || 'null');
      if (!data) return null;
      if (data.expiresAt && data.expiresAt < Date.now()) return null;
      return data;
    } catch {
      return null;
    }
  }

  function isPremium() {
    const sessionRaw = localStorage.getItem('brainrot_vault_session');
    if (sessionRaw && sessionRaw.includes('admin')) return true;
    return !!getPremium();
  }

  function activatePremium(code) {
    const clean = String(code || '').trim().toUpperCase();
    if (!PREMIUM_CODES.includes(clean)) {
      toast('Code premium incorrect.');
      return false;
    }

    const access = {
      active: true,
      code: clean,
      createdAt: Date.now(),
      expiresAt: Date.now() + SIX_MONTHS
    };
    localStorage.setItem(PREMIUM_KEY, JSON.stringify(access));
    toast('Premium activé pour 6 mois.');
    updatePremiumUI();
    return true;
  }

  function formatDate(ts) {
    if (!ts) return 'Illimité';
    return new Date(ts).toLocaleDateString('fr-FR');
  }

  function addStyle() {
    if (document.getElementById('v4PremiumCss')) return;
    const style = document.createElement('style');
    style.id = 'v4PremiumCss';
    style.textContent = `
      .v4-premium-card {
        margin: 14px 0;
        padding: 16px;
        border-radius: 26px;
        background: linear-gradient(145deg, rgba(255,211,77,.2), rgba(101,216,255,.14), rgba(169,108,255,.16));
        border: 1px solid rgba(255,255,255,.16);
        box-shadow: 0 18px 40px rgba(0,0,0,.32);
      }
      .v4-premium-card h3 {
        margin: 0 0 6px;
        font-size: 28px;
        line-height: 1;
      }
      .v4-premium-card p {
        margin: 0 0 12px;
        color: #d7e2ff;
        line-height: 1.35;
      }
      .v4-premium-grid {
        display: grid;
        gap: 10px;
      }
      .v4-premium-grid button,
      .v4-premium-grid input {
        min-height: 54px;
        border-radius: 18px;
        font-size: 17px;
        font-weight: 900;
      }
      .v4-premium-grid input {
        border: 1px solid rgba(255,255,255,.18);
        background: #071026;
        color: #fff;
        padding: 0 14px;
      }
      .v4-premium-grid button {
        border: 0;
        background: linear-gradient(135deg, #ffd34d, #ff7a3d);
        color: #16110b;
      }
      .v4-premium-grid button.secondary {
        background: #263a66;
        color: #fff;
      }
      .v4-premium-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(40,242,163,.16);
        color: #9fffe0;
        font-weight: 900;
        font-size: 13px;
      }
      .v4-locked {
        position: relative;
        opacity: .55;
      }
      .v4-locked::after {
        content: 'Premium';
        position: absolute;
        top: 8px;
        right: 8px;
        background: #ffd34d;
        color: #17110b;
        font-size: 11px;
        font-weight: 900;
        border-radius: 999px;
        padding: 5px 8px;
      }
      .v4-dragging {
        opacity: .5 !important;
        transform: scale(.96) !important;
      }
      .v4-drop-target {
        outline: 3px solid #65d8ff !important;
        outline-offset: 4px !important;
      }
      .v4-swipe-hint {
        margin: 8px 0 0;
        padding: 10px 12px;
        border-radius: 16px;
        background: rgba(101,216,255,.11);
        color: #d9f3ff;
        font-size: 13px;
        font-weight: 800;
        text-align: center;
      }
      .v4-toast-mini {
        position: fixed;
        left: 50%;
        bottom: calc(112px + env(safe-area-inset-bottom, 0px));
        transform: translateX(-50%);
        z-index: 120000;
        background: #071026;
        border: 1px solid rgba(255,255,255,.18);
        color: #fff;
        border-radius: 999px;
        padding: 12px 18px;
        font-weight: 900;
        box-shadow: 0 12px 30px rgba(0,0,0,.42);
        display: none;
      }
      .v4-toast-mini.show { display: block; }
    `;
    document.head.appendChild(style);
  }

  function injectPremiumPanel() {
    const settingsView = document.getElementById('view-settings');
    if (!settingsView || document.getElementById('v4PremiumPanel')) return;

    const card = document.createElement('section');
    card.id = 'v4PremiumPanel';
    card.className = 'v4-premium-card';
    card.innerHTML = `
      <h3>Premium V4</h3>
      <p>Accès vendable : paiement Revolut Pro + code d’activation 6 mois.</p>
      <div id="v4PremiumStatus" class="v4-premium-status">Statut : gratuit</div>
      <div class="v4-premium-grid" style="margin-top:12px">
        <button type="button" id="v4PayBtn">Payer avec Revolut Pro</button>
        <input id="v4PremiumCode" type="text" placeholder="Code premium">
        <button type="button" class="secondary" id="v4ActivateBtn">Activer le code</button>
      </div>
    `;
    settingsView.insertBefore(card, settingsView.firstChild);

    document.getElementById('v4PayBtn').onclick = () => window.open(REVOLUT_LINK, '_blank');
    document.getElementById('v4ActivateBtn').onclick = () => {
      const code = document.getElementById('v4PremiumCode').value;
      if (activatePremium(code)) document.getElementById('v4PremiumCode').value = '';
    };

    updatePremiumUI();
  }

  function updatePremiumUI() {
    const status = document.getElementById('v4PremiumStatus');
    const access = getPremium();
    if (!status) return;
    if (isPremium()) {
      status.textContent = access ? `Premium actif jusqu’au ${formatDate(access.expiresAt)}` : 'Premium actif - Admin';
      status.style.background = 'rgba(40,242,163,.16)';
      status.style.color = '#9fffe0';
    } else {
      status.textContent = 'Statut : gratuit';
      status.style.background = 'rgba(255,211,77,.14)';
      status.style.color = '#ffe49b';
    }
  }

  function gatePremiumActions() {
    document.addEventListener('click', (event) => {
      const premiumButton = event.target.closest('#openBulkModalTop, #exportBtn, .case-add-btn, [data-new-block], [data-new-empty], #addCustomCaseBtn, #addCaseInsideV2');
      if (!premiumButton) return;
      if (isPremium()) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      toast('Fonction premium. Va dans Réglages pour activer.');
      showOnlySettings();
    }, true);
  }

  function showOnlySettings() {
    document.querySelectorAll('.view').forEach(view => {
      const active = view.id === 'view-settings';
      view.classList.toggle('active', active);
      view.style.display = active ? 'block' : 'none';
    });
    document.querySelectorAll('[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === 'settings'));
    setTimeout(injectPremiumPanel, 80);
  }

  function addSwipeBetweenRarities() {
    const wrap = document.getElementById('collectionWrap');
    const chips = document.getElementById('rarityChips');
    if (!wrap || !chips || wrap.dataset.v4SwipeReady) return;
    wrap.dataset.v4SwipeReady = '1';

    const hint = document.createElement('div');
    hint.className = 'v4-swipe-hint';
    hint.textContent = 'Glisse gauche/droite pour changer de rareté';
    const controls = document.querySelector('.controls-panel');
    if (controls && !controls.querySelector('.v4-swipe-hint')) controls.appendChild(hint);

    wrap.addEventListener('touchstart', (event) => {
      const t = event.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    }, { passive: true });

    wrap.addEventListener('touchend', (event) => {
      const t = event.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      moveRarity(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function moveRarity(direction) {
    const chips = [...document.querySelectorAll('#rarityChips [data-r]')];
    if (!chips.length) return;
    let index = chips.findIndex(chip => chip.classList.contains('active'));
    if (index < 0) index = 0;
    const next = Math.max(0, Math.min(chips.length - 1, index + direction));
    if (next === index) return;
    chips[next].click();
    miniToast(chips[next].textContent.trim());
  }

  function miniToast(text) {
    let el = document.getElementById('v4ToastMini');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v4ToastMini';
      el.className = 'v4-toast-mini';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 800);
  }

  function realTouchDragForCaseRows() {
    document.addEventListener('pointerdown', (event) => {
      const row = event.target.closest('.cases-row-v2, .case-manager-row, .block-row');
      if (!row) return;
      if (event.target.matches('input, button')) return;
      row.dataset.startY = String(event.clientY);
      row.dataset.dragReady = '1';
    });

    document.addEventListener('pointermove', (event) => {
      const row = document.querySelector('[data-drag-ready="1"]');
      if (!row) return;
      const startY = Number(row.dataset.startY || event.clientY);
      const dy = event.clientY - startY;
      if (Math.abs(dy) < 18) return;
      row.classList.add('v4-dragging');
      row.style.transform = `translateY(${dy}px) scale(.98)`;

      const siblings = [...row.parentElement.children].filter(el => el !== row && (el.classList.contains('cases-row-v2') || el.classList.contains('case-manager-row') || el.classList.contains('block-row')));
      siblings.forEach(el => el.classList.remove('v4-drop-target'));
      const target = siblings.find(el => {
        const rect = el.getBoundingClientRect();
        return event.clientY > rect.top && event.clientY < rect.bottom;
      });
      if (target) target.classList.add('v4-drop-target');
    }, { passive: true });

    document.addEventListener('pointerup', () => {
      const row = document.querySelector('[data-drag-ready="1"]');
      if (!row) return;
      const target = document.querySelector('.v4-drop-target');
      row.classList.remove('v4-dragging');
      row.style.transform = '';
      row.removeAttribute('data-drag-ready');
      row.removeAttribute('data-start-y');

      if (target && row.parentElement === target.parentElement) {
        const parent = row.parentElement;
        const rowIndex = [...parent.children].indexOf(row);
        const targetIndex = [...parent.children].indexOf(target);
        if (rowIndex < targetIndex) parent.insertBefore(row, target.nextSibling);
        else parent.insertBefore(row, target);
        miniToast('Ordre modifié');
      }
      document.querySelectorAll('.v4-drop-target').forEach(el => el.classList.remove('v4-drop-target'));
    });
  }

  function markLockedButtons() {
    if (isPremium()) return;
    document.querySelectorAll('#openBulkModalTop, #exportBtn, .case-add-btn').forEach(btn => btn.classList.add('v4-locked'));
  }

  function boot() {
    addStyle();
    injectPremiumPanel();
    gatePremiumActions();
    realTouchDragForCaseRows();
    setInterval(() => {
      injectPremiumPanel();
      addSwipeBetweenRarities();
      markLockedButtons();
      updatePremiumUI();
    }, 1000);
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 600));
})();
