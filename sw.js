const CACHE_NAME = 'brainrot-vault-v21-svg-design';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './touch-fix-v1.css',
  './svg-design-v1.css',
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

async function injectCSS(response) {
  const text = await response.text();
  if (text.includes('svg-design-v1.css')) return new Response(text, { headers: { 'Content-Type': 'text/html' } });
  return new Response(text.replace('</head>', '<link rel="stylesheet" href="svg-design-v1.css">\n</head>'), { headers: { 'Content-Type': 'text/html' } });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isHTML = url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  event.respondWith((async () => {
    try {
      const res = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, res.clone());
      return isHTML ? injectCSS(res) : res;
    } catch {
      const cached = await caches.match(event.request);
      if (cached) return isHTML ? injectCSS(cached.clone()) : cached;
      return caches.match('./index.html');
    }
  })());
});
