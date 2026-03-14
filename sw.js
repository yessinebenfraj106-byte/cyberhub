/**
 * CYBERHUB - PWA SERVICE WORKER
 * Strategy: Network-First with Cache Fallback for static assets.
 * Skips API calls to ensure real-time Google Sheets sync.
 */

const CACHE_NAME = 'cyberhub-core-v1.0';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 1. INSTALLATION: Cache the core files immediately
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching core assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// 2. ACTIVATION: Clean up old caches if the version name changes
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control of all clients immediately
});

// 3. FETCH: Network-First strategy
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // CRITICAL: DO NOT cache Google Apps Script API calls or external domains!
    // We only want to cache our local HTML and images.
    if (!requestUrl.origin.includes(self.location.origin)) {
        return; // Let the browser handle external requests normally
    }

    // Network-First Strategy for local assets
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If the network request is successful, clone the response and update the cache
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If the network fails (offline), return the cached version
                console.log('[Service Worker] Network failed, falling back to cache:', event.request.url);
                return caches.match(event.request);
            })
    );
});
