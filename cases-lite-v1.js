(() => {
  const KEY = 'brainrot_cases_lite_v1';
  const DEFAULT_NEW_CASE_NAME = 'Casque';

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

    const cases = getCases(brainrotId);
    cases.forEach((item, index) => {
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
    const cases = getCases(brainrotId);
    const card = document.querySelector(`.brainrot-card[data-id="${brainrotId}"]`);
    const title = card?.querySelector('h3')?.textContent || 'Brainrot';

    const list = cases.length
      ? cases.map((item, index) => `${index + 1}. ${item.name}`).join('\n')
      : 'Aucune case personnalisée.';

    const choice = prompt(
      `Cases pour ${title}\n\n${list}\n\nÉcris :\n1 = ajouter une case\n2 = renommer une case\n3 = supprimer une case`,
      '1'
    );

    if (choice === '1') addCase(brainrotId);
    if (choice === '2') renameCase(brainrotId);
    if (choice === '3') deleteCase(brainrotId);
  }

  function addCase(brainrotId) {
    const name = prompt('Nom de la nouvelle case :', DEFAULT_NEW_CASE_NAME);
    if (!name || !name.trim()) return;

    const cases = getCases(brainrotId);
    cases.push({
      id: uid(),
      name: name.trim(),
      image: '',
      count: 0,
      createdAt: Date.now()
    });
    setCases(brainrotId, cases);
    applyCases();
    showToast('Case ajoutée.');
  }

  function renameCase(brainrotId) {
    const cases = getCases(brainrotId);
    if (!cases.length) return showToast('Aucune case à renommer.');

    const indexText = prompt('Numéro de la case à renommer :', '1');
    const index = Number(indexText) - 1;
    if (!cases[index]) return showToast('Case introuvable.');

    const name = prompt('Nouveau nom :', cases[index].name);
    if (!name || !name.trim()) return;

    cases[index].name = name.trim();
    setCases(brainrotId, cases);
    applyCases();
    showToast('Case renommée.');
  }

  function deleteCase(brainrotId) {
    const cases = getCases(brainrotId);
    if (!cases.length) return showToast('Aucune case à supprimer.');

    const indexText = prompt('Numéro de la case à supprimer :', '1');
    const index = Number(indexText) - 1;
    if (!cases[index]) return showToast('Case introuvable.');

    if (!confirm(`Supprimer la case "${cases[index].name}" ?`)) return;
    cases.splice(index, 1);
    setCases(brainrotId, cases);
    applyCases();
    showToast('Case supprimée.');
  }

  function openCase(brainrotId, caseId) {
    const cases = getCases(brainrotId);
    const item = cases.find((entry) => entry.id === caseId);
    if (!item) return;

    const choice = prompt(
      `${item.name}\n\nÉcris :\n1 = choisir image galerie\n2 = prendre photo\n3 = quantité +1\n4 = quantité -1\n5 = vider la case`,
      '1'
    );

    if (choice === '1') chooseImage(brainrotId, caseId, false);
    if (choice === '2') chooseImage(brainrotId, caseId, true);
    if (choice === '3') changeCount(brainrotId, caseId, 1);
    if (choice === '4') changeCount(brainrotId, caseId, -1);
    if (choice === '5') clearCase(brainrotId, caseId);
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
    };
    input.click();
  }

  function readFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  function changeCount(brainrotId, caseId, delta) {
    const cases = getCases(brainrotId);
    const item = cases.find((entry) => entry.id === caseId);
    if (!item) return;

    item.count = Math.max(0, Number(item.count || 0) + delta);
    setCases(brainrotId, cases);
    applyCases();
    showToast('Quantité modifiée.');
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
        openCase(brainrotId, caseId);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 350));
})();
