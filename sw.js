/**
 * Service Worker for offline caching
 * Implements cache-first for shell, stale-while-revalidate for data
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `five-minute-football-${CACHE_VERSION}`;

// Shell assets (cache-first)
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/app.js',
  '/assets/state.js',
  '/assets/render.js'
];

// Install: cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, update in background for stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Cache-first for shell assets
  if (SHELL_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith('/assets/'))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
    return;
  }

  // Stale-while-revalidate for data files
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then(cache => {
          return cache.match(event.request)
            .then(cachedResponse => {
              const fetchPromise = fetch(event.request)
                .then(response => {
                  if (response.ok) {
                    cache.put(event.request, response.clone());
                  }
                  return response;
                })
                .catch(() => cachedResponse); // Return stale if fetch fails
              
              return cachedResponse || fetchPromise;
            });
        })
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

