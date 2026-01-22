// Service Worker for XpenseLab PWA
const CACHE_NAME = 'xpenselab-v3';
const CACHE_MAX_SIZE = 50 * 1024 * 1024; // 50MB cache limit
const urlsToCache = [
  '/',
  '/dashboard',
  '/expenses',
  '/income',
  '/budget',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Service Worker install failed:', error);
        // Don't fail silently - let the error propagate
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      // Clean up caches that exceed size limit
      return cleanupOldCaches();
    })
    .then(() => self.clients.claim())
    .catch((error) => {
      console.error('Service Worker activate failed:', error);
    })
  );
});

// Cleanup function to remove old caches if storage is getting full
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const cacheSizes = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        let size = 0;
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            size += blob.size;
          }
        }
        return { name, size };
      })
    );

    // Sort by size and remove largest if over limit
    cacheSizes.sort((a, b) => b.size - a.size);
    const totalSize = cacheSizes.reduce((sum, c) => sum + c.size, 0);
    
    if (totalSize > CACHE_MAX_SIZE) {
      // Remove largest caches until under limit
      for (const cache of cacheSizes) {
        if (totalSize <= CACHE_MAX_SIZE) break;
        if (cache.name !== CACHE_NAME) {
          await caches.delete(cache.name);
          console.log('Deleted cache due to size limit:', cache.name);
        }
      }
    }
  } catch (error) {
    console.warn('Cache cleanup failed:', error);
  }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip unsupported schemes (chrome-extension, chrome, etc.)
  const url = new URL(event.request.url);
  if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:' || url.protocol === 'moz-extension:') {
    return; // Let the browser handle these requests
  }

  // Always fetch manifest.json fresh (never cache)
  if (url.pathname === '/manifest.json') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Only cache same-origin requests
  if (url.origin !== self.location.origin) {
    return; // Don't cache cross-origin requests
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // For HTML pages, use stale-while-revalidate: serve from cache immediately, update in background
        if (event.request.headers.get('accept')?.includes('text/html')) {
          // Serve from cache immediately if available
          const cachedResponse = response;
          
          // Fetch fresh version in background and update cache
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    try {
                      cache.put(event.request, responseToCache);
                    } catch (error) {
                      console.warn('Failed to cache:', event.request.url, error);
                    }
                  });
              }
              return networkResponse;
            })
            .catch(() => null); // Ignore network errors in background update
          
          // Return cached version immediately, or fetch if no cache
          return cachedResponse || fetchPromise;
        }
        
        // For other resources, use cache-first strategy
        return response || fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache if the request URL is valid
              try {
                cache.put(event.request, responseToCache);
              } catch (error) {
                console.warn('Failed to cache:', event.request.url, error);
              }
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline page if available
        return caches.match('/');
      })
  );
});
