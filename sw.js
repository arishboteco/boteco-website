const CACHE_VERSION = 'v4';
const CACHE_NAME = `boteco-cache-${CACHE_VERSION}`;

// Import build-generated asset manifest
importScripts('/precache-manifest.js');

// Core assets required for the shell of the site
const ASSETS = self.__ASSETS_MANIFEST || [];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Remove old cache versions
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));

      // Clean up entries not in the current asset manifest
      const cache = await caches.open(CACHE_NAME);
      const cachedRequests = await cache.keys();
      const assetSet = new Set(
        ASSETS.map(asset => new URL(asset, self.location.origin).href)
      );
      await Promise.all(
        cachedRequests.map(request => {
          if (!assetSet.has(request.url)) {
            return cache.delete(request);
          }
        })
      );
    })()
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const { request } = event;
  const url = new URL(request.url);

  // Network-first strategy for navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const headers = new Headers(response.headers);
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            headers.set('Expires', futureDate.toUTCString());
            const modifiedResponse = new Response(response.clone().body, {
              status: response.status,
              statusText: response.statusText,
              headers
            });
            caches.open(CACHE_NAME).then(cache => cache.put(request, modifiedResponse.clone()));
            return modifiedResponse;
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Stale-while-revalidate for same-origin static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchAndCache = fetch(request)
          .then(response => {
            if (response.status === 200) {
              const headers = new Headers(response.headers);
              const futureDate = new Date();
              futureDate.setFullYear(futureDate.getFullYear() + 1);
              headers.set('Expires', futureDate.toUTCString());
              const modifiedResponse = new Response(response.clone().body, {
                status: response.status,
                statusText: response.statusText,
                headers
              });
              caches.open(CACHE_NAME).then(cache => cache.put(request, modifiedResponse.clone()));
              return modifiedResponse;
            }
            return response;
          })
          .catch(() => cached);

        if (cached) {
          event.waitUntil(fetchAndCache);
          return cached;
        }
        return fetchAndCache;
      })
    );
  }
});

