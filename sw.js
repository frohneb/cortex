const CACHE_NAME = 'tango-app-v1.0.10';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/main.css',
    './js/core/engine.js',
    './js/core/solver.js',
    './js/core/generator.js',
    './js/data/levels.js',
    './js/data/tutorial.js',
    './js/data/i18n.js',
    './js/ui/audio.js',
    './js/ui/animations.js',
    './js/ui/app.js',
    './js/bundle.js',
    './assets/favicon.svg',
    './assets/icons/icon-192.svg',
    './assets/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // Offline Fallback
                return caches.match('./index.html');
            });
        })
    );
});
