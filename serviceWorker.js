// sw.js - The "Proxy Engine"
// Versioning helps us update the app later
const CACHE_NAME = 'article-reader-v1';

// 1. Assets to Cache (The App Shell)
// These are the files required to make the UI work offline.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/framework7-bundle.min.css',
  '/js/framework7-bundle.min.js',
  '/js/app.js',
  '/Database/db.js',
  '/manifest.json',
  '/icons/icon-192.png'
];

// 2. The INSTALL Event
// This happens the first time the user visits the site.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing and caching app shell');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We "pre-cache" everything in the list above
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // "skipWaiting" forces the new service worker to take over immediately
      return self.skipWaiting();
    })
  );
});

// 3. The ACTIVATE Event
// This is where we clean up old versions of the cache.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating and cleaning old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 4. The FETCH Event
// This intercepts every single request the app makes.
self.addEventListener('fetch', (event) => {
  // We only intercept GET requests (standard for loading files)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Strategy: "Cache First, falling back to Network"
      // If the file is in our 'v1' cache, return it instantly.
      // If not, try to get it from the internet.
      return cachedResponse || fetch(event.request);
    })
  );
});