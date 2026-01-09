import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Precache static assets (injected by workbox-build)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navigation requests: NetworkFirst with offline fallback
// Caches SSR-rendered HTML pages for offline access
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'pages-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
    })
  )
);

// API requests: NetworkFirst with timeout
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/bff/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60,
      }),
    ],
  })
);

// Static assets: CacheFirst for performance
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Images: CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Push notification event listener
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) {
    return;
  }

  try {
    const payload = event.data.json();
    const { title, body, icon, badge, data } = payload;

    const options: NotificationOptions = {
      body: body || 'Time for your habit!',
      icon: icon || '/logo192.png',
      badge: badge || '/logo192.png',
      data: data || {},
      vibrate: [200, 100, 200],
      tag: data?.habitId || 'habit-reminder',
      requireInteraction: false,
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Habit Reminder', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none found
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
