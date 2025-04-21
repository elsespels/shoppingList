const CACHE_NAME = 'swipe-list-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/script.js',
  '/styles.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/screenshots/screen1.jpg'
];

// Utility function to clean expired data and keep the app lightweight
async function cleanUpStorage() {
  try {
    // Perform storage cleanup if the Storage Manager API is available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const {usage, quota} = await navigator.storage.estimate();
      const percentUsed = Math.round(usage / quota * 100);
      
      console.log(`Storage usage: ${percentUsed}% (${Math.round(usage / 1024 / 1024)}MB of ${Math.round(quota / 1024 / 1024)}MB)`);
      
      // If we're using more than 80% of storage, try to clean old data
      if (percentUsed > 80) {
        console.log('Storage usage is high, cleaning up...');
        // In a real app, you could implement logic to clean up older or unused data
      }
    }
  } catch (error) {
    console.error('Error during storage cleanup:', error);
  }
}

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
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
    .then(() => {
      // Run storage cleanup when the service worker activates
      return cleanUpStorage();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension') ||
      event.request.url.includes('extension') ||
      event.request.url.includes('chrome')) {
    return;
  }

  // Only log main resource fetches to reduce console spam
  if (event.request.destination === 'document' || 
      event.request.destination === 'script' || 
      event.request.destination === 'style') {
    console.log('[Service Worker] Fetching', event.request.url);
  }

  // Special handling for IndexedDB-related resources
  if (event.request.url.includes('indexeddb') || 
      event.request.url.includes('idb')) {
    // For IndexedDB requests, don't use cache - always get fresh data
    return;
  }

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
          
          // Don't cache user-specific data
          if (event.request.url.includes('indexeddb') || 
              event.request.url.includes('idb') ||
              event.request.url.includes('user') ||
              event.request.url.includes('data')) {
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
          // Return an empty response rather than failing
          return new Response('', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
    })
  );
});

// Handle messages from the main thread, useful for triggering data syncs
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_DATA') {
    console.log('[Service Worker] Received sync request');
    // Could implement sync logic here
  }
});