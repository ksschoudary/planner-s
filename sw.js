// Planner S — service worker
// SECURITY: this origin (github.io user page) is SHARED with every other
// project on the same account. All cache operations are therefore scoped to
// a project-specific prefix, and reads never touch the global cache store.

const PREFIX = 'planner-s.';           // namespace — nothing outside this is ever touched
const CACHE  = PREFIX + 'v39';         // bump on every deploy
const SCOPE  = new URL(self.registration.scope);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith(PREFIX) && k !== CACHE)  // ONLY our own old versions
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Only ever handle same-origin GETs inside our own scope.
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== SCOPE.origin) return;                 // ignore cross-origin
  if (!url.pathname.startsWith(SCOPE.pathname)) return;    // ignore outside scope

  const isShell = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if (isShell) {
    // Network-first for the app shell so deploys land immediately.
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(r => {
          if (r && r.status === 200 && r.type === 'basic') {   // never cache opaque
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return r;
        })
        .catch(() => caches.open(CACHE).then(c => c.match(req)))  // OUR cache only
    );
    return;
  }

  // Other same-origin assets: cache-first, still scoped to our cache.
  e.respondWith(
    caches.open(CACHE).then(c =>
      c.match(req).then(hit =>
        hit || fetch(req).then(r => {
          if (r && r.status === 200 && r.type === 'basic') c.put(req, r.clone());
          return r;
        })
      )
    )
  );
});
