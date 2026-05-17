const CACHE = 'ps-2026-v2';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.add('./index.html')));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  // Always network-first for navigation (HTML pages)
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).then(r => {
        const c = r.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, c));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for everything else
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
