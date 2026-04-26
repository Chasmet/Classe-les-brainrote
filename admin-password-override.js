(() => {
  const NEW_PASSWORD = 'chk123@';
  const SESSION_KEY = 'brainrot_vault_session';

  const USERS = {
    Cheikh: { username: 'Cheikh', displayName: 'Admi', role: 'admin' },
    Yvane: { username: 'Yvane', displayName: 'Yvane', role: 'close' },
    Nelvyn: { username: 'Nelvyn', displayName: 'Nelvyn', role: 'close' },
    Warrel: { username: 'Warrel', displayName: 'Warrel', role: 'close' },
    famille1: { username: 'famille1', displayName: 'famille1', role: 'close' }
  };

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return alert(message);
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add('hidden'), 2500);
  }

  function openApp(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      mode: 'close',
      username: user.username,
      displayName: user.displayName,
      role: user.role
    }));

    document.getElementById('authScreen')?.classList.add('hidden');
    document.getElementById('appScreen')?.classList.remove('hidden');

    const label = user.role === 'admin' ? 'Admin' : 'Accès proche gratuit';
    const sessionLabel = document.getElementById('sessionLabel');
    const accountModeText = document.getElementById('accountModeText');
    const accountUserText = document.getElementById('accountUserText');
    const accountAccessText = document.getElementById('accountAccessText');

    if (sessionLabel) sessionLabel.textContent = `Connecté : ${user.displayName} - ${label}`;
    if (accountModeText) accountModeText.textContent = label;
    if (accountUserText) accountUserText.textContent = user.displayName;
    if (accountAccessText) accountAccessText.textContent = user.role === 'admin' ? 'Compte admin' : 'Compte proche';

    showToast(`Bienvenue ${user.displayName}.`);
  }

  function patchLogin() {
    const form = document.getElementById('closeLoginForm');
    const select = document.getElementById('closeUsername');
    if (!form || form.dataset.passwordOverrideReady === '1') return;

    form.dataset.passwordOverrideReady = '1';

    if (select) {
      Array.from(select.options).forEach(option => {
        if (option.value === 'Cheikh') option.textContent = 'Admi';
      });
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const username = document.getElementById('closeUsername')?.value;
      const password = document.getElementById('closePassword')?.value || '';
      const user = USERS[username];

      if (!user || password.trim() !== NEW_PASSWORD) {
        showToast('Mot de passe incorrect.');
        return;
      }

      openApp(user);
    }, true);
  }

  document.addEventListener('DOMContentLoaded', () => {
    patchLogin();
    setTimeout(patchLogin, 500);
    setTimeout(patchLogin, 1500);
  });
})();
