const CACHE_NAME = 'swipe-list-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/script.js',
  '/styles.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clear old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  console.log('[Service Worker] Fetching', event.request.url);
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then(response => {
          // Don't cache if not valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Cache successfully fetched resources for future use
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        })
        .catch(error => {
          // If offline and resource not cached, show offline page or fallback
          console.log('[Service Worker] Fetch failed; returning offline fallback', error);
          // For API requests or IndexedDB, additional handling could be added here
        });
    })
  );
});