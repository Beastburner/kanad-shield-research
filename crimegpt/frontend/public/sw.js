/* CrimeGPT offline-first service worker (P8).
 *
 * App-shell strategy for low-network police stations:
 *  - HTML / navigations: network-first with cache fallback. This is what lets a
 *    new deploy actually reach returning visitors — the previous cache-first
 *    shell served the old index.html (and therefore the old JS/CSS) forever.
 *  - Hashed static assets (/assets/index-<hash>.js etc.): cache-first is safe
 *    BECAUSE Vite content-hashes the filenames — a new build references new
 *    URLs, so a stale cache entry can never shadow new code.
 *  - API calls: network-first with cache fallback, so previously fetched
 *    cases/diary/analysis remain viewable offline. "API" means ANY cross-origin
 *    request (the deployed backend lives on another origin) — the old check for
 *    ":8000" only matched local dev, so in production API responses were being
 *    cached cache-first and went permanently stale.
 *
 * Non-GET requests (POST/PATCH document generation, uploads) always go to the
 * network — they are never served from cache.
 */
const CACHE = 'crimegpt-shell-v2'; // bumped: activate purges the v1 cache

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

const networkFirst = (request) =>
  fetch(request)
    .then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(request, copy));
      return res;
    })
    .catch(() => caches.match(request));

const cacheFirst = (request) =>
  caches.match(request).then(
    (cached) =>
      cached ||
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
  );

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never cache mutations
  if (!request.url.startsWith('http')) return; // ignore extensions etc.

  const sameOrigin = new URL(request.url).origin === self.location.origin;
  const isApi = !sameOrigin || request.url.includes(':8000');
  const isNavigation =
    request.mode === 'navigate' || request.destination === 'document';

  if (isApi || isNavigation) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
