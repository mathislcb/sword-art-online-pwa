/* ═══════════════════════════════════════════════════════
   SERVICE-WORKER.JS — Cache PWA offline
═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'sao-aincrad-v1';

const ASSETS = [
  './index.html',
  './style.css',
  './creator.css',
  './game.js',
  './player.js',
  './enemy.js',
  './inventory.js',
  './save.js',
  './character.js',
  './manifest.json',
];

// Installation : mise en cache des assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Mise en cache des assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation : supprime les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch : cache-first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Met en cache les nouvelles ressources
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Fallback si hors ligne et pas en cache
      return caches.match('./src/index.html');
    })
  );
});