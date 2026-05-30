const C = 'wow-parfum-v7';
const SHELL = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function _networkFirst(e, timeout) {
  return new Promise(resolve => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; caches.match(e.request).then(resolve); }
    }, timeout);
    fetch(e.request).then(res => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(C).then(c => c.put(e.request, clone));
        }
        resolve(res);
      }
    }).catch(() => {
      clearTimeout(timer);
      if (!settled) { settled = true; caches.match(e.request).then(resolve); }
    });
  });
}

function _staleWhileRevalidate(e) {
  return caches.open(C).then(cache =>
    cache.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);
      return cached || fresh;
    })
  );
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (e.request.mode === 'navigate' || url.includes('script.google.com')) {
    e.respondWith(_networkFirst(e, 2500));
    return;
  }
  if (/\.(css|js|png|jpg|jpeg|webp|svg|ico|woff2?)(\?|$)/.test(url)) {
    e.respondWith(_staleWhileRevalidate(e));
    return;
  }
  e.respondWith(_networkFirst(e, 2500));
});

/* ── PUSH NOTIFICATIONS ─────────────────────────────────────── */

self.addEventListener('push', e => {
  let data = { title: 'WOW.PARFUM', body: 'Нові аромати вже в каталозі 🌸', icon: '/icon-192.png', badge: '/icon-192.png', tag: 'wow-parfum', url: '/' };
  try {
    if (e.data) {
      const d = e.data.json();
      data = { ...data, ...d };
    }
  } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon  || '/icon-192.png',
      badge:   data.badge || '/icon-192.png',
      tag:     data.tag   || 'wow-parfum',
      data:  { url: data.url || '/' },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open',    title: '🌸 Переглянути' },
        { action: 'dismiss', title: 'Закрити' },
      ],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
