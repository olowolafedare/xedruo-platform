self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { message: event.data?.text?.() || '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Xedruo', {
    body: data.message || 'You have a new notification.',
    icon: '/xedruo-logo.svg',
    badge: '/xedruo-logo.svg',
    data: { url: data.url || '/notifications' },
    tag: data.tag || 'xedruo-notification',
    renotify: true,
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/notifications';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => 'focus' in client);
    if (existing) { existing.navigate(new URL(url, self.location.origin).href); return existing.focus(); }
    return clients.openWindow(new URL(url, self.location.origin).href);
  }));
});
