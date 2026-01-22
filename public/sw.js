// Service Worker for XpenseLab PWA
const CACHE_NAME = 'xpenselab-v3';
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
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

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
        // Always try network first for HTML pages to get latest version
        if (response && event.request.headers.get('accept')?.includes('text/html')) {
          return fetch(event.request)
            .then((networkResponse) => {
              // If network response is newer, update cache and return it
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
                return networkResponse;
              }
              // Fallback to cached if network fails
              return response;
            })
            .catch(() => response); // Use cache if network fails
        }
        
        // Return cached version or fetch from network
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
