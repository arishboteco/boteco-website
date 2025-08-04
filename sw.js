const CACHE_VERSION = 'v1';
const CACHE_NAME = `boteco-cache-${CACHE_VERSION}`;

// Core assets required for the shell of the site
const ASSETS = [
  '/',
  '/index.html',
  '/bar-menu.html',
  '/food-menu.html',
  '/party-booking.html',
  '/specials-menu.html',
  '/assets/css/boteco_style.min.css',
  '/assets/js/events.min.js',
  '/assets/js/hero-video.min.js',
  '/assets/js/header.min.js',
  '/assets/js/fade-in.min.js',
  '/assets/js/uniform-menu-heights.min.js',
  '/assets/js/carousel-counter.min.js',
  '/assets/js/menu-gallery.min.js'
];

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
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
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
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});

