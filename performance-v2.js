(() => {
  const PERF_KEY = 'brainrot_perf_v2';
  const ORIGINAL_READ = FileReader.prototype.readAsDataURL;
  const ORIGINAL_SRC_SET = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')?.set;
  const ORIGINAL_SRC_GET = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')?.get;

  const settings = loadSettings();

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(PERF_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function saveSettings(data) {
    localStorage.setItem(PERF_KEY, JSON.stringify(data));
  }

  function isLowDevice() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    return memory <= 4 || cores <= 4;
  }

  function toast(message) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = message;
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), 2200);
  }

  function addStyle() {
    if (document.getElementById('performanceV2Css')) return;
    const style = document.createElement('style');
    style.id = 'performanceV2Css';
    style.textContent = `
      html.perf-low *,
      html.perf-low *::before,
      html.perf-low *::after {
        animation: none !important;
        transition-duration: .01ms !important;
        backdrop-filter: none !important;
        filter: none !important;
      }

      html.perf-low .brainrot-card,
      html.perf-low .rarity-section,
      html.perf-low .panel,
      html.perf-low .bottom-nav,
      html.perf-low .summary-card {
        box-shadow: none !important;
      }

      img[data-lazy-src] {
        opacity: 0;
        transition: opacity .18s ease;
      }

      img.lazy-ready {
        opacity: 1;
      }

      .perf-toolbar {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: calc(98px + env(safe-area-inset-bottom, 0px));
        z-index: 9000;
        display: none;
        gap: 8px;
        padding: 10px;
        border-radius: 20px;
        background: rgba(7,16,38,.96);
        border: 1px solid rgba(255,255,255,.14);
      }

      .perf-toolbar.show { display: grid; grid-template-columns: 1fr 1fr; }
      .perf-toolbar button {
        min-height: 46px;
        border: 0;
        border-radius: 15px;
        background: #253866;
        color: #fff;
        font-weight: 900;
      }

      .image-lightbox-v2 {
        position: fixed;
        inset: 0;
        z-index: 200000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(2,6,18,.94);
      }

      .image-lightbox-v2.open { display: flex; }
      .image-lightbox-v2 img {
        max-width: 100%;
        max-height: 86vh;
        object-fit: contain;
        border-radius: 20px;
      }

      .image-lightbox-v2 button {
        position: fixed;
        top: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,.14);
        color: #fff;
        font-size: 24px;
        font-weight: 900;
      }
    `;
    document.head.appendChild(style);
  }

  function applyMode() {
    const autoLow = isLowDevice();
    const forced = settings.lowMode;
    const low = typeof forced === 'boolean' ? forced : autoLow;
    document.documentElement.classList.toggle('perf-low', low);
    return low;
  }

  async function compressImageFile(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) return null;

    const low = applyMode();
    const maxSize = low ? 760 : 1100;
    const quality = low ? 0.64 : 0.72;

    const rawDataUrl = await fileToDataUrl(file);
    const img = await loadImage(rawDataUrl);

    const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * ratio));
    const height = Math.max(1, Math.round(img.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = low ? 'medium' : 'high';
    ctx.drawImage(img, 0, 0, width, height);

    let output = '';
    try {
      output = canvas.toDataURL('image/webp', quality);
      if (!output.startsWith('data:image/webp')) throw new Error('webp unsupported');
    } catch {
      output = canvas.toDataURL('image/jpeg', quality);
    }

    return output;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      ORIGINAL_READ.call(reader, file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function patchFileReaderCompression() {
    if (FileReader.prototype.readAsDataURL._brainrotPerfPatched) return;

    FileReader.prototype.readAsDataURL = function patchedReadAsDataURL(file) {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        return ORIGINAL_READ.call(this, file);
      }

      const reader = this;

      compressImageFile(file)
        .then((compressed) => {
          if (!compressed) return ORIGINAL_READ.call(reader, file);

          Object.defineProperty(reader, 'result', {
            configurable: true,
            get: () => compressed
          });

          const event = new ProgressEvent('load');
          if (typeof reader.onload === 'function') reader.onload(event);
          reader.dispatchEvent(event);
          const endEvent = new ProgressEvent('loadend');
          if (typeof reader.onloadend === 'function') reader.onloadend(endEvent);
          reader.dispatchEvent(endEvent);

          if (file.size > 800000) toast('Image compressée automatiquement.');
        })
        .catch(() => ORIGINAL_READ.call(reader, file));
    };

    FileReader.prototype.readAsDataURL._brainrotPerfPatched = true;
  }

  function lazyLoadImages() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const src = img.dataset.lazySrc;
        if (src) {
          img.src = src;
          img.removeAttribute('data-lazy-src');
          img.onload = () => img.classList.add('lazy-ready');
        }
        observer.unobserve(img);
      });
    }, { rootMargin: '250px' });

    function scan() {
      document.querySelectorAll('.slot-thumb img, .custom-case-card-v2 img, .custom-slot-btn img').forEach((img) => {
        if (img.dataset.lazySrc || img.classList.contains('lazy-ready')) return;
        const src = img.getAttribute('src');
        if (!src || !src.startsWith('data:image')) return;
        img.dataset.lazySrc = src;
        img.removeAttribute('src');
        observer.observe(img);
      });
    }

    setInterval(scan, 1200);
    setTimeout(scan, 800);
  }

  function addImageLightbox() {
    if (document.getElementById('imageLightboxV2')) return;
    const box = document.createElement('div');
    box.id = 'imageLightboxV2';
    box.className = 'image-lightbox-v2';
    box.innerHTML = '<button type="button">×</button><img alt="Image">';
    document.body.appendChild(box);
    box.querySelector('button').onclick = () => box.classList.remove('open');

    document.addEventListener('click', (event) => {
      const img = event.target.closest('.slot-thumb img, .custom-case-card-v2 img, .custom-slot-btn img');
      if (!img) return;
      const src = img.currentSrc || img.src || img.dataset.lazySrc;
      if (!src) return;
      box.querySelector('img').src = src;
      box.classList.add('open');
    });
  }

  function addPerfToolbar() {
    if (document.getElementById('perfToolbar')) return;
    const toolbar = document.createElement('div');
    toolbar.id = 'perfToolbar';
    toolbar.className = 'perf-toolbar';
    toolbar.innerHTML = `
      <button type="button" id="perfLowBtn">Mode rapide</button>
      <button type="button" id="perfAutoBtn">Mode auto</button>
    `;
    document.body.appendChild(toolbar);

    document.addEventListener('longpress-settings', () => toolbar.classList.toggle('show'));

    document.getElementById('perfLowBtn').onclick = () => {
      settings.lowMode = true;
      saveSettings(settings);
      applyMode();
      toast('Mode rapide activé.');
    };
    document.getElementById('perfAutoBtn').onclick = () => {
      delete settings.lowMode;
      saveSettings(settings);
      applyMode();
      toast('Mode auto activé.');
    };

    let pressTimer = null;
    document.addEventListener('pointerdown', (event) => {
      const settingsBtn = event.target.closest('[data-view="settings"]');
      if (!settingsBtn) return;
      pressTimer = setTimeout(() => {
        document.dispatchEvent(new Event('longpress-settings'));
      }, 900);
    });
    document.addEventListener('pointerup', () => clearTimeout(pressTimer));
    document.addEventListener('pointercancel', () => clearTimeout(pressTimer));
  }

  function boot() {
    addStyle();
    applyMode();
    patchFileReaderCompression();
    lazyLoadImages();
    addImageLightbox();
    addPerfToolbar();
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 200));
})();
