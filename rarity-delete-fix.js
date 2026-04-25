(() => {
  const RARITY_KEY = 'brainrot_rarities_v6';
  const ORDER_KEY = 'brainrot_block_order_v7';

  function loadRarities() {
    try {
      const list = JSON.parse(localStorage.getItem(RARITY_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveRarities(list) {
    localStorage.setItem(RARITY_KEY, JSON.stringify(list));
  }

  function loadOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDER_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function saveOrders(data) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(data));
  }

  function toast(message) {
    const el = document.getElementById('toast');
    if (!el) return alert(message);
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  function deleteRarity(id) {
    if (!id) return;

    const list = loadRarities();
    const target = list.find(item => item.id === id);
    if (!target) {
      toast('Rareté introuvable.');
      return;
    }

    const ok = confirm(`Supprimer la rareté "${target.name}" ?`);
    if (!ok) return;

    saveRarities(list.filter(item => item.id !== id));

    const orders = loadOrders();
    delete orders[id];
    saveOrders(orders);

    document.querySelectorAll(`[data-r="${id}"], [data-row-rarity="${id}"], [data-rarity-section="${id}"]`).forEach(el => el.remove());
    document.querySelectorAll(`[data-name="${id}"], [data-name-rarity="${id}"]`).forEach(input => input.closest('.rarity-line, .rarity-row')?.remove());

    const panel = document.getElementById('blockPanel');
    if (panel) panel.classList.add('hidden');

    toast('Rareté supprimée.');
    setTimeout(() => window.location.reload(), 350);
  }

  function patchDeleteButtons() {
    const panel = document.getElementById('rarityPanel');
    if (!panel) return;

    panel.querySelectorAll('.rarity-line').forEach(line => {
      if (line.querySelector('.rarity-delete-real')) return;
      const input = line.querySelector('[data-name], [data-name-rarity]');
      const id = input?.dataset.name || input?.dataset.nameRarity;
      if (!id) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '×';
      btn.className = 'rarity-delete rarity-delete-real';
      btn.dataset.deleteRarityReal = id;
      line.appendChild(btn);
    });
  }

  function addStyle() {
    const style = document.createElement('style');
    style.textContent = `
      .rarity-line { grid-template-columns: 1fr 50px 42px 42px 42px !important; }
      .rarity-delete,
      .rarity-delete-real {
        background: #8b2440 !important;
        color: #ffd6df !important;
        border: 0 !important;
        border-radius: 12px !important;
        font-weight: 900 !important;
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-delete-rarity-real], .rarity-delete, [data-del-rarity]');
    if (!btn) return;

    const id = btn.dataset.deleteRarityReal || btn.dataset.delRarity || btn.closest('.rarity-line, .rarity-row')?.querySelector('[data-name], [data-name-rarity]')?.dataset.name || btn.closest('.rarity-line, .rarity-row')?.querySelector('[data-name], [data-name-rarity]')?.dataset.nameRarity;
    if (!id) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    deleteRarity(id);
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    addStyle();
    setInterval(patchDeleteButtons, 500);
    setTimeout(patchDeleteButtons, 900);
  });
})();
