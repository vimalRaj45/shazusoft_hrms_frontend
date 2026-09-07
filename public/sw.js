const CACHE_NAME = 'shazusoft-hrms-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// Install Event: Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
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
  self.clients.claim();
});

// ─── Push Notification Events ────────────────────────────────────────────────

// Push Event: Triggered when the server sends a push message
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'ShazuSoft HRMS', body: event.data ? event.data.text() : 'You have a new notification.' };
  }

  const title = data.title || 'ShazuSoft HRMS';
  const options = {
    body: data.body || 'You have a new update.',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || `shazu-push-${Date.now()}`,
    data: { url: data.url || '/', ...(data.data || {}) },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false
  };

  // Only show OS desktop/mobile push notification when the user is NOT actively using the software.
  // If an HRMS window/tab is open and currently visible or focused, suppress the OS push notification
  // since the user already receives in-app toasts, chimes, and real-time SSE updates.
  const handlePush = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    const isInsideSoftware = clientList.some((client) => {
      const isAppWindow = client.url.includes(self.location.origin);
      return isAppWindow && (client.visibilityState === 'visible' || client.focused);
    });

    if (isInsideSoftware) {
      // User is actively inside the software: suppress OS push popup!
      // Forward the event to the open window client(s) for in-app handling if desired
      clientList.forEach((client) => {
        if (client.url.includes(self.location.origin) && 'postMessage' in client) {
          client.postMessage({
            type: 'PUSH_RECEIVED_IN_APP',
            data: { title, ...options }
          });
        }
      });
      return null;
    }

    // User is NOT inside the software (tab hidden, minimized, or closed) -> Show OS Push Notification
    return self.registration.showNotification(title, options);
  });

  event.waitUntil(handlePush);
});

// NotificationClick Event: Handle user clicking on a notification (Deep link to specific section/tab)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  let targetTab = notifData.tab || '';
  let targetUrl = notifData.url || '/';

  // Extract ?tab= query parameter if not directly provided in data
  if (!targetTab && targetUrl) {
    try {
      const urlObj = new URL(targetUrl, self.location.origin);
      targetTab = urlObj.searchParams.get('tab') || '';
    } catch (e) {}
  }

  // Ensure targetUrl contains ?tab= if targetTab is present
  if (targetTab && !targetUrl.includes('tab=')) {
    targetUrl = `/?tab=${encodeURIComponent(targetTab)}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it and instantly switch tab via postMessage
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (targetTab && 'postMessage' in client) {
            client.postMessage({
              type: 'NAVIGATE_TAB',
              tab: targetTab,
              url: targetUrl
            });
          }
          if ('navigate' in client && (!targetTab || !client.url.includes(`tab=${targetTab}`))) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open a new tab with the target section URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Fetch Event: Network-first for dynamic assets, Stale-while-revalidate for static assets ─
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Do NOT intercept:
  // - non-GET requests
  // - unsupported schemes (chrome-extension, etc.)
  // - /api/ routes
  // - Vite dev tooling routes (@vite, node_modules, HMR ping, dev query tokens)
  if (
    !request.url.startsWith('http') ||
    request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('node_modules') ||
    url.pathname.includes('.vite') ||
    url.pathname.includes('__vite') ||
    url.search.includes('t=')
  ) {
    return; // Pass through to browser network layer directly
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If navigation request fails offline, fallback to cached index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html').then((indexRes) => {
              return indexRes || new Response('Network offline', { status: 503, statusText: 'Offline' });
            });
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
