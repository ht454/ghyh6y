// Service Worker version - update this to trigger an update
const CACHE_VERSION = '1.0.0';

// Cache names
const CACHE_NAMES = {
  STATIC: `static-cache-v${CACHE_VERSION}`,
  DYNAMIC: `dynamic-cache-v${CACHE_VERSION}`,
  IMAGES: `images-cache-v${CACHE_VERSION}`,
  API: `api-cache-v${CACHE_VERSION}`,
  FONTS: `fonts-cache-v${CACHE_VERSION}`
};

// Resources to cache immediately (static assets)
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342280479-zic6p2xl66c.png',
  'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342288274-8l6yo8xvfa.png',
  'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342291641-sx68isk91vr.png',
  'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342294382-615ne80gbda.png',
  'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1754342296631-9vufh3iyran.png',
  '/alfont_com_Rubik-Black (1).ttf'
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/categories',
  '/api/questions'
];

// Maximum age for cached resources (in milliseconds)
const MAX_CACHE_AGE = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000, // 24 hours
  IMAGES: 3 * 24 * 60 * 60 * 1000, // 3 days
  API: 60 * 60 * 1000, // 1 hour
  FONTS: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Maximum number of items in dynamic cache
const MAX_DYNAMIC_CACHE_ITEMS = 100;

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC)
      .then(cache => {
        console.log('[Service Worker] Precaching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Successfully installed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete any old version of our caches
            if (
              cacheName.startsWith('static-cache-v') && cacheName !== CACHE_NAMES.STATIC ||
              cacheName.startsWith('dynamic-cache-v') && cacheName !== CACHE_NAMES.DYNAMIC ||
              cacheName.startsWith('images-cache-v') && cacheName !== CACHE_NAMES.IMAGES ||
              cacheName.startsWith('api-cache-v') && cacheName !== CACHE_NAMES.API ||
              cacheName.startsWith('fonts-cache-v') && cacheName !== CACHE_NAMES.FONTS
            ) {
              console.log('[Service Worker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Successfully activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip Supabase authentication requests
  if (url.pathname.includes('/auth/') || url.pathname.includes('/storage/')) {
    return;
  }
  
  // Handle API requests
  if (isApiRequest(event.request)) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle image requests
  if (isImageRequest(event.request)) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // Handle font requests
  if (isFontRequest(event.request)) {
    event.respondWith(handleFontRequest(event.request));
    return;
  }
  
  // Handle static assets
  if (isStaticAsset(event.request)) {
    event.respondWith(handleStaticRequest(event.request));
    return;
  }
  
  // Handle all other requests
  event.respondWith(handleDynamicRequest(event.request));
});

// Message event - handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Sherlook';
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Sync event - handle background sync
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event);
  
  if (event.tag === 'sync-pending-operations') {
    event.waitUntil(syncPendingOperations());
  }
});

// Helper functions

// Check if request is for an API endpoint
function isApiRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_URLS.some(endpoint => url.pathname.includes(endpoint));
}

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpe?g|png|gif|svg|webp)$/i.test(request.url);
}

// Check if request is for a font
function isFontRequest(request) {
  return request.destination === 'font' || 
         /\.(woff2?|ttf|otf|eot)$/i.test(request.url);
}

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_CACHE_URLS.includes(url.pathname) || 
         url.pathname === '/' || 
         url.pathname.endsWith('.html') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js');
}

// Handle API requests
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAMES.API);
  
  // Try to get a fresh response
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone the response and cache it
      const clonedResponse = response.clone();
      cache.put(request, clonedResponse);
      
      // Clean up old API cache entries
      cleanupCache(CACHE_NAMES.API, MAX_CACHE_AGE.API);
      
      return response;
    }
  } catch (error) {
    console.log('[Service Worker] Network error fetching API, falling back to cache');
  }
  
  // If network request failed, try to get from cache
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached response, return a custom offline response
  return createOfflineResponse('API data is not available offline');
}

// Handle image requests
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAMES.IMAGES);
  
  // Try to get from cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, try to fetch
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone the response and cache it
      cache.put(request, response.clone());
      
      // Clean up old image cache entries
      cleanupCache(CACHE_NAMES.IMAGES, MAX_CACHE_AGE.IMAGES, MAX_DYNAMIC_CACHE_ITEMS);
      
      return response;
    }
  } catch (error) {
    console.log('[Service Worker] Network error fetching image');
  }
  
  // If fetch failed, return a placeholder image
  return createPlaceholderImage();
}

// Handle font requests
async function handleFontRequest(request) {
  const cache = await caches.open(CACHE_NAMES.FONTS);
  
  // Try to get from cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, try to fetch
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone the response and cache it
      cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    console.log('[Service Worker] Network error fetching font');
  }
  
  // If fetch failed, we don't have a good fallback for fonts
  return new Response('Font not available', { status: 404, headers: { 'Content-Type': 'text/plain' } });
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAMES.STATIC);
  
  // Try to get from cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Return cached response immediately
    return cachedResponse;
  }
  
  // If not in cache, try to fetch
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone the response and cache it
      cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    console.log('[Service Worker] Network error fetching static asset');
  }
  
  // If fetch failed and it's the main page, return the offline page
  if (request.mode === 'navigate') {
    return createOfflinePage();
  }
  
  // For other static assets, return a simple error response
  return new Response('Resource not available offline', { 
    status: 404, 
    headers: { 'Content-Type': 'text/plain' } 
  });
}

// Handle dynamic requests
async function handleDynamicRequest(request) {
  const cache = await caches.open(CACHE_NAMES.DYNAMIC);
  
  // Try to fetch first
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Only cache successful responses
      cache.put(request, response.clone());
      
      // Clean up old dynamic cache entries
      cleanupCache(CACHE_NAMES.DYNAMIC, MAX_CACHE_AGE.DYNAMIC, MAX_DYNAMIC_CACHE_ITEMS);
      
      return response;
    }
  } catch (error) {
    console.log('[Service Worker] Network error, falling back to cache');
  }
  
  // If network request failed, try to get from cache
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached response and it's a navigation request, return the offline page
  if (request.mode === 'navigate') {
    return createOfflinePage();
  }
  
  // For other requests, return a simple error response
  return createOfflineResponse('This content is not available offline');
}

// Create a placeholder image
function createPlaceholderImage() {
  // Simple SVG placeholder
  const svgPlaceholder = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#f0f0f0"/>
      <text x="100" y="100" font-family="Arial" font-size="14" text-anchor="middle" fill="#888">Image Unavailable</text>
    </svg>
  `;
  
  return new Response(svgPlaceholder, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store'
    }
  });
}

// Create an offline page response
function createOfflinePage() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>أنت غير متصل بالإنترنت - شير لوك</title>
        <style>
          body {
            font-family: 'Rubik-Black', 'Cairo', sans-serif;
            background: linear-gradient(135deg, #FF914D 0%, #FF3131 100%);
            color: white;
            height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
          }
          .offline-container {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.9;
          }
          button {
            background: white;
            color: #FF3131;
            border: none;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
          }
          button:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          }
          .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="icon">📶</div>
          <h1>أنت غير متصل بالإنترنت</h1>
          <p>يبدو أنك فقدت الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.</p>
          <button onclick="window.location.reload()">إعادة المحاولة</button>
        </div>
      </body>
    </html>
  `;
  
  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// Create a generic offline response
function createOfflineResponse(message) {
  return new Response(JSON.stringify({
    error: 'offline',
    message: message
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Clean up old cache entries
async function cleanupCache(cacheName, maxAge, maxItems = null) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  const now = Date.now();
  const expiredRequests = [];
  
  // Find expired items
  for (const request of requests) {
    const response = await cache.match(request);
    
    if (response) {
      const dateHeader = response.headers.get('date');
      
      if (dateHeader) {
        const cacheTime = new Date(dateHeader).getTime();
        if (now - cacheTime > maxAge) {
          expiredRequests.push(request);
        }
      } else {
        // If no date header, assume it's old
        expiredRequests.push(request);
      }
    }
  }
  
  // Delete expired items
  for (const request of expiredRequests) {
    await cache.delete(request);
  }
  
  // If we have a max items limit and we're still over it, delete oldest items
  if (maxItems && requests.length - expiredRequests.length > maxItems) {
    const remainingRequests = requests.filter(req => !expiredRequests.includes(req));
    
    // Sort by date (oldest first)
    const sortedRequests = await Promise.all(remainingRequests.map(async request => {
      const response = await cache.match(request);
      const dateHeader = response ? response.headers.get('date') : null;
      const date = dateHeader ? new Date(dateHeader).getTime() : 0;
      return { request, date };
    }));
    
    sortedRequests.sort((a, b) => a.date - b.date);
    
    // Delete oldest items to get down to max size
    const itemsToDelete = sortedRequests.slice(0, sortedRequests.length - maxItems);
    for (const { request } of itemsToDelete) {
      await cache.delete(request);
    }
  }
}

// Sync pending operations
async function syncPendingOperations() {
  // This would be implemented to sync data from IndexedDB or other storage
  // For now, just log that we would sync
  console.log('[Service Worker] Would sync pending operations here');
  return Promise.resolve();
}