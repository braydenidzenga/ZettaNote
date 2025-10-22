// Service Worker for ZettaNote
const CACHE_NAME = 'zettanote-v1';
const API_CACHE_NAME = 'zettanote-api-v1';

// Install event - cache static assets
self.addEventListener('install', () => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(syncPendingChanges());
  }
});

// Fetch event - handle API requests and caching
self.addEventListener('fetch', (event) => {
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Handle API requests with caching and offline support
async function handleApiRequest(request) {
  // For GET requests, try cache first, then network
  if (request.method === 'GET') {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Return cached response and update in background
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
        })
        .catch(() => {
          // Ignore fetch errors in background update
        });
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch {
      // If offline and no cache, return offline response
      return new Response(
        JSON.stringify({ error: 'Offline', message: 'You are currently offline' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // For other requests (POST, PUT, DELETE), try network first
  try {
    const response = await fetch(request);
    return response;
  } catch {
    // If offline, queue for later sync
    if (request.method !== 'GET') {
      await queueRequestForSync(request);
    }

    return new Response(JSON.stringify({ error: 'Offline', message: 'Request queued for sync' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Queue requests for background sync
async function queueRequestForSync(request) {
  const db = await openIndexedDB();

  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now(),
  };

  const transaction = db.transaction(['syncQueue'], 'readwrite');
  const store = transaction.objectStore('syncQueue');
  await store.add(requestData);
}

// Sync pending changes when back online
async function syncPendingChanges() {
  const db = await openIndexedDB();
  const transaction = db.transaction(['syncQueue'], 'readonly');
  const store = transaction.objectStore('syncQueue');
  const requests = await store.getAll();

  for (const requestData of requests) {
    try {
      const request = new Request(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body,
      });

      const response = await fetch(request);

      if (response.ok) {
        // Remove from queue
        const deleteTransaction = db.transaction(['syncQueue'], 'readwrite');
        const deleteStore = deleteTransaction.objectStore('syncQueue');
        await deleteStore.delete(requestData.id);
      }
    } catch (error) {
      console.error('Failed to sync request:', error);
    }
  }
}

// Open IndexedDB for service worker
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ZettaNoteCache', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Push notification support (optional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(self.clients.openWindow('/'));
});
