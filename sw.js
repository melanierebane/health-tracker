const CACHE_NAME = 'health-tracker-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Push notifications — daily reminder
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '🌿 Health Check-In Time';
  const options = {
    body: data.body || "Don't forget your daily checklist — water, supplements, and movement.",
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'daily-reminder',
    renotify: true,
    actions: [
      { action: 'open', title: 'Open Tracker' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: { url: '/index.html' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'open' || !e.action) {
    e.waitUntil(clients.openWindow('/index.html'));
  }
});
