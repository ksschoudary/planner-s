// Planner S service worker — network-first, no stale HTML
const CACHE = 'ps-v21-labels';

self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately, don't wait
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k)))) // nuke ALL caches
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Always network-first for the app shell (HTML + sw)
  if (e.request.mode === 'navigate' || url.includes('index.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request)) // offline fallback only
    );
    return;
  }
  // Other assets: cache-first (fonts etc.)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
