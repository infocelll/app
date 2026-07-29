const CACHE_NAME = 'infocell-v8';
const STATIC_ASSETS = [
  './',
  './dashboard-v6.html',
  './manifest.json',
  './portal-cliente.html',
  './manual-usuario-premium.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for static assets, network-first for API calls
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // API calls: network-first
  if (url.hostname !== location.hostname || url.pathname.includes('/api/')) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Update cache in background
        fetch(e.request).then(r => {
          if (r && r.status === 200) {
            const clone = r.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return r;
      });
    })
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  // Sync trigger from client
  if (e.data && e.data.type === 'SYNC_NOW') {
    self.clients.matchAll().then(clients => {
      clients.forEach(c => c.postMessage({ type: 'SYNC_STATUS', status: 'syncing' }));
    });
  }
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'InfoCell', body: 'Nova notificacao' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || './icon-192.png',
      badge: data.badge || './icon-192.png',
      data: data.url || './',
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) { if (c.url.includes('dashboard') && 'focus' in c) return c.focus(); }
    return clients.openWindow(e.notification.data || './');
  }));
});

// Background sync support
self.addEventListener('sync', e => {
  if (e.tag === 'sync-pending') {
    e.waitUntil(self.clients.matchAll().then(clients => {
      clients.forEach(c => c.postMessage({ type: 'TRIGGER_SYNC' }));
    }));
  }
});
