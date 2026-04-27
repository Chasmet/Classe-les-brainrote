const CACHE_NAME = 'brainrot-vault-v17-neon-design';

const ASSETS = [
  './',
  './index.html',
  './style.css',
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;

  if (!isLocal) return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request, { cache: 'no-store' });
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone()).catch(() => null);
      return fresh;
    } catch (e) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return caches.match('./index.html');
    }
  })());
});
