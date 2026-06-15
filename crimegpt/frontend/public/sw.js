/* CrimeGPT offline-first service worker (P8).
 *
 * App-shell strategy for low-network police stations:
 *  - Static assets (the built JS/CSS/HTML shell): cache-first, so the UI loads
 *    instantly and works with no connection.
 *  - API calls (the backend on :8000): network-first with a cache fallback, so
 *    previously fetched cases/diary/analysis remain viewable offline.
 *
 * Non-GET requests (POST/PATCH document generation, uploads) always go to the
 * network — they are never served from cache.
 */
const CACHE = 'crimegpt-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never cache mutations

  const isApi = request.url.includes(':8000');

  if (isApi) {
    // network-first: keep data fresh, fall back to last cached copy offline
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // cache-first for the app shell / static assets
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
      )
    );
  }
});
