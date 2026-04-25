(() => {
  const PASSWORD = 'Brainrot2026';
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
    const session = {
      mode: 'close',
      username: user.username,
      displayName: user.displayName,
      role: user.role
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    const authScreen = document.getElementById('authScreen');
    const appScreen = document.getElementById('appScreen');
    const sessionLabel = document.getElementById('sessionLabel');
    const accountModeText = document.getElementById('accountModeText');
    const accountUserText = document.getElementById('accountUserText');
    const accountAccessText = document.getElementById('accountAccessText');

    if (authScreen) authScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.remove('hidden');
    if (sessionLabel) sessionLabel.textContent = `Connecté : ${user.displayName} - ${user.role === 'admin' ? 'Admin' : 'Accès proche gratuit'}`;
    if (accountModeText) accountModeText.textContent = user.role === 'admin' ? 'Admin' : 'Accès proche gratuit';
    if (accountUserText) accountUserText.textContent = user.displayName;
    if (accountAccessText) accountAccessText.textContent = user.role === 'admin' ? 'Compte admin' : 'Compte proche';

    showToast(`Bienvenue ${user.displayName}.`);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const closeUsername = document.getElementById('closeUsername');
    const form = document.getElementById('closeLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (closeUsername) {
      const cheikhOption = Array.from(closeUsername.options).find(option => option.value === 'Cheikh');
      if (cheikhOption) cheikhOption.textContent = 'Admi';
    }

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const username = document.getElementById('closeUsername')?.value;
        const password = document.getElementById('closePassword')?.value || '';
        const user = USERS[username];

        if (!user || password.trim() !== PASSWORD) {
          showToast('Mot de passe incorrect.');
          return;
        }

        openApp(user);
      }, true);
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.reload();
      });
    }
  });
})();
