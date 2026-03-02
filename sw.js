const CACHE_NAME = 'cyberhub-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Install the service worker and cache the main files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[CyberHub] Cache Opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate and clean up old caches to keep the app fast
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch interceptor to make it work perfectly
self.addEventListener('fetch', event => {
  // Ignore Google Apps Script API calls so we always get fresh live data
  if (event.request.url.includes('script.google.com')) {
      return; 
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if found, otherwise fetch from internet
        return response || fetch(event.request);
      })
  );
});
