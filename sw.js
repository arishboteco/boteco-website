const CACHE_VERSION = 'v3';
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
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
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

  // Cache-first for same-origin static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
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
        });
      })
    );
  }
});

