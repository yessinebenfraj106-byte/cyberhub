/**
 * CYBERHUB - PWA SERVICE WORKER (WITH FIREBASE CLOUD MESSAGING)
 */
const CACHE_NAME = 'cyberhub-core-v1.2';
const STATIC_ASSETS = [ './', './index.html', './manifest.json' ];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil( caches.open(CACHE_NAME).then((cache) => { return cache.addAll(STATIC_ASSETS); }) );
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil( caches.keys().then((cacheNames) => { return Promise.all( cacheNames.map((cache) => { if (cache !== CACHE_NAME) return caches.delete(cache); }) ); }) );
    self.clients.claim();
});

// Fetch Event (Caching)
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    if (!requestUrl.origin.includes(self.location.origin)) return;
    event.respondWith( fetch(event.request).then((networkResponse) => { if (networkResponse && networkResponse.status === 200) { const responseClone = networkResponse.clone(); caches.open(CACHE_NAME).then((cache) => { cache.put(event.request, responseClone); }); } return networkResponse; }).catch(() => { return caches.match(event.request); }) );
});

// 🔥 Firebase Cloud Messaging Background Processor
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Note: Paste the identical config from index.html here later.
try {
  firebase.initializeApp({ apiKey: "YOUR_API_KEY", authDomain: "YOUR_PROJECT.firebaseapp.com", projectId: "YOUR_PROJECT", storageBucket: "YOUR_PROJECT.appspot.com", messagingSenderId: "YOUR_SENDER_ID", appId: "YOUR_APP_ID" });
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
          body: payload.notification.body,
          icon: 'https://i.ibb.co/60V0Z7S/icon-512.png'
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch(e) { console.log("Firebase background worker not configured yet."); }
