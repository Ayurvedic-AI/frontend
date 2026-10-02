/* Web Push service worker (feature 069).
 *
 * Exists ONLY for browser push — no caching/offline logic, so the Vite build
 * pipeline is untouched (public/ files are copied verbatim and this file is
 * served unbundled from the origin root, giving it root scope).
 */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Notification', body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || 'SVAP';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      tag: payload.tag || undefined,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: payload.url || '/notifications' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
