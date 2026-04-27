const CACHE_NAME = 'brainrot-vault-v19-selected-image';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './touch-fix-v1.css',
  './image-design-v1.css',
  './script.js',
  './cases-lite-v1.js',
  './manifest.json',
  './logo.png',
  './hero.png',
  './fond.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (key !== CACHE_NAME) return caches.delete(key);
      return Promise.resolve();
    }));
    await self.clients.claim();
  })());
});

async function withImageDesign(response) {
  const text = await response.text();
  if (text.includes('image-design-v1.css')) {
    return new Response(text, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  const injected = text.replace('</head>', '  <link rel="stylesheet" href="image-design-v1.css">\n</head>');
  return new Response(injected, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;

  if (!isLocal) return;

  const isHtml = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');

  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request, { cache: 'no-store' });
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone()).catch(() => null);
      if (isHtml) return withImageDesign(fresh);
      return fresh;
    } catch (e) {
      const cached = await caches.match(event.request);
      if (cached) {
        if (isHtml) return withImageDesign(cached.clone());
        return cached;
      }
      const fallback = await caches.match('./index.html');
      if (fallback) return withImageDesign(fallback.clone());
      return new Response('Application indisponible hors ligne.', { status: 503 });
    }
  })());
});
