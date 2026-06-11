/* ============================================================
   WOW.PARFUM — Service Worker  (wow-v19)
   Strategy: pre-cache shell → network-first nav → stale-while-revalidate assets
   ============================================================ */

const V = 'wow-parfum-v7';

// Critical shell — install fails if these are missing (intentional)
const SHELL = [
  './',
  './index.html',
  './offline.html',
  './css/base.css',
  './css/layout.css',
  './css/cards.css',
  './css/animations.css',
  './css/niche.css',
  './manifest.json',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
];

// Best-effort warm cache — individual failures are silently ignored
const WARM = [
  './css/mobile.css',
  './shared/css/premium.css',
  './js/config.js',
  './js/state.js',
  './js/lang.js',
  './js/api.js',
  './js/products.js',
  './js/ui.js',
  './js/match.js',
  './js/filters.js',
  './js/cart.js',
  './js/modal.js',
  './js/deals.js',
  './js/app.js',
  './shared/js/referral.js',
  './shared/js/motion.js',
];

// ── INSTALL ──────────────────────────────────────────── //
self.addEventListener('install', async e => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(V);
      await cache.addAll(SHELL);
      await Promise.allSettled(WARM.map(url => cache.add(url).catch(() => null)));
    })()
  );
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────── //
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── STRATEGIES ───────────────────────────────────────── //
function networkFirst(req, timeoutMs) {
  return new Promise(resolve => {
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      caches.match(req)
        .then(r => resolve(r || offlineFallback(req)))
        .catch(() => resolve(offlineFallback(req)));
    }, timeoutMs);

    fetch(req.clone())
      .then(res => {
        clearTimeout(timer);
        if (done) return;
        done = true;
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(V).then(c => c.put(req, clone)).catch(() => null);
        }
        resolve(res);
      })
      .catch(() => {
        clearTimeout(timer);
        if (done) return;
        done = true;
        caches.match(req)
          .then(r => resolve(r || offlineFallback(req)))
          .catch(() => resolve(offlineFallback(req)));
      });
  });
}

async function staleWhileRevalidate(req) {
  const cache  = await caches.open(V);
  const cached = await cache.match(req);

  const fetchPromise = fetch(req.clone())
    .then(res => { if (res && res.ok) cache.put(req, res.clone()).catch(() => null); return res; })
    .catch(() => null);

  if (cached) {
    fetchPromise.catch(() => null);
    return cached;
  }
  const fresh = await fetchPromise;
  return fresh || new Response('', { status: 503, statusText: 'Offline' });
}

async function offlineFallback(req) {
  if (req.mode === 'navigate') {
    const r = await caches.match('./offline.html');
    return r || new Response('<h1>Офлайн</h1>', { headers: { 'Content-Type': 'text/html' } });
  }
  return new Response('', { status: 503, statusText: 'Offline' });
}

// ── FETCH ────────────────────────────────────────────── //
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // Navigation & GAS API → network-first (3s timeout)
  if (e.request.mode === 'navigate' || url.includes('script.google.com')) {
    e.respondWith(networkFirst(e.request, 3000));
    return;
  }

  // Static assets → stale-while-revalidate
  if (/\.(css|js|png|jpg|jpeg|webp|svg|ico|woff2?)(\?|$)/.test(url)) {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

  // Everything else → network-first
  e.respondWith(networkFirst(e.request, 2500));
});

// ── MESSAGES ─────────────────────────────────────────── //
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION') {
    e.source?.postMessage({ type: 'VERSION', version: V });
  }
});
