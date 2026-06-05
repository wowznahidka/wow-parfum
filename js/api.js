/* ============================================================
   WOW.ZNAHIDKA — API & CACHING LAYER
   Fetch, normalize, cache — never breaks GAS endpoints.
   ============================================================ */

// ── CACHE ────────────────────────────────────────── */
function _loadFromCache() {
  try {
    const raw = localStorage.getItem(CFG.CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CFG.CACHE_TTL_MS) return null;
    // Migrate old gender strings if needed
    data.forEach(p => {
      if (p.gender === 'male')   p.gender = 'Чоловік';
      if (p.gender === 'female') p.gender = 'Жінка';
    });
    return data;
  } catch(e) { return null; }
}

function _saveToCache(products) {
  try {
    localStorage.setItem(CFG.CACHE_KEY, JSON.stringify({ ts: Date.now(), data: products }));
  } catch(e) {}
}

// ── SUPPLIER DETECTION ───────────────────────────── */
function detectSupplier(raw) {
  const s = String(raw || '');
  if (/\d{2}\s*\(\s*[єЄeE]\s*\)/.test(s)) return 2; // Babylon raw format
  if (/\d{2}\s*\(\s*\d+\s*\)/.test(s))     return 1; // General Stores
  return 0;
}

// ── NORMALIZE ────────────────────────────────────── */
function normalizeProduct(p) {
  // Sizes
  const sizesRaw = p['Розміри'] || p['розміри'] || p.sizes || p.Sizes || '';
  let sizes = [];
  const sizeQty = {};   // { 40: 2, 41: 1, ... }  — кількість по розміру

  if (Array.isArray(sizesRaw)) {
    const hasOne = sizesRaw.some(s => String(s).trim().toUpperCase() === 'ONE SIZE');
    if (hasOne) {
      sizes = ['ONE SIZE'];
    } else {
      sizesRaw.forEach(s => {
        const str = String(s).trim();
        if (!str) return;
        const n = Number(str);
        if (!isNaN(n) && n >= 30 && n <= 55) {
          sizes.push(n); sizeQty[n] = sizeQty[n] || 1;
        } else {
          // рядкові розміри: "100 мл", "XS", "S", "M" тощо
          sizes.push(str); sizeQty[str] = sizeQty[str] || 1;
        }
      });
    }
  } else {
    const str = String(sizesRaw).trim();
    if (!str || str.toUpperCase() === 'ONE SIZE') {
      sizes = str ? ['ONE SIZE'] : [];
    } else {
      // ── Спроба 1: формат з к-вом ─────────────────────────
      // Babylon:       "36(є) 37(0) 42(є)"  — є = є в наяв., 0 = нема
      // General Stores:"40(2) 41(3) 42(0)"  — число = к-сть пар
      // Також:         "40-2, 41-3" / "40:2 41:1"
      const pairs = [...str.matchAll(/\b(\d{2})\b\s*[\s\-:(]\s*([єЄeE]|\d+)\s*\)?/g)];
      if (pairs.length) {
        pairs.forEach(m => {
          const sz  = Number(m[1]);
          const raw = m[2].toLowerCase();
          if (sz < 30 || sz > 55) return;
          const qty = (raw === 'є' || raw === 'e') ? 1 : Number(raw);
          if (qty > 0) { sizes.push(sz); sizeQty[sz] = qty; }
        });
        sizes = [...new Set(sizes)].sort((a, b) => a - b);
      }

      // ── Спроба 2: просто список розмірів (без к-сті) ─────
      // "40,41,42" / "40 41 42" / "40;41;42" / "40/41/42"
      if (!sizes.length) {
        sizes = [...new Set(
          [...str.matchAll(/\b(\d{2})\b/g)]
            .map(m => Number(m[1]))
            .filter(n => n >= 30 && n <= 55)
        )].sort((a, b) => a - b);
        sizes.forEach(s => { sizeQty[s] = sizeQty[s] || 1; });
      }
    }
  }

  // Price
  const price    = Number(p['Ціна']       || p['ціна']       || p.price    || 0);
  let oldPrice   = Number(p['Стара ціна'] || p['стара ціна'] || p.oldPrice || p.old_price || 0);
  if (oldPrice > 0 && oldPrice <= price) oldPrice = 0;

  return {
    id:       String(p['ID'] || p['id'] || p['Артикул'] || Math.random().toString(36).slice(2)),
    name:     String(p['Назва']  || p['назва']  || p['Модель'] || p.name || p.model || ''),
    brand:    String(p['Бренд']  || p['бренд']  || p.brand  || p.Brand  || '') || (() => {
      const nm = String(p['Назва'] || p.name || '');
      const compound = ['Louis Vuitton','Tom Ford','Hugo Boss','Calvin Klein',
        'Carolina Herrera','Marc Jacobs','Narciso Rodriguez','Issey Miyake',
        'Antonio Banderas','Jean Paul Gaultier','Dolce Gabbana','Viktor Rolf'];
      for (const c of compound) { if (nm.toLowerCase().startsWith(c.toLowerCase())) return c; }
      return nm.split(' ')[0] || 'Parfum';
    })(),
    price,
    oldPrice,
    image:       String(p['Фото']   || p['фото']   || p.image  || p.img   || p.photo || ''),
    description: String(p['Опис']   || p['опис']   || p.description || ''),
    sizes,
    sizeQty,  // { 40: 2, 41: 1, 42: 3 } — кількість по кожному розміру
    isNew:    Boolean(p['Нове']  || p['нове']   || p.is_new || p.isNew),
    gender:   String(p['Стать']  || p['стать']  || p.gender || p.Gender || ''),
    supplier: Number(p['Постачальник'] || p.supplier || detectSupplier(sizesRaw)),
    tgLink:   String(p['TG'] || p['tg_link'] || ''),
  };
}

// ── FETCH ─────────────────────────────────────────── */
async function fetchCatalog() {
  // Already loaded from server — return immediately
  if (S.catalog.all && S.catalog.loadedFromServer) return getCatalog();

  // Serve from cache first (instant paint), then refresh in background
  const cached = _loadFromCache();
  if (cached && cached.length) {
    S.catalog.all = cached;
    S.catalog.loadedFromServer = true;
    S.lastFetchTime = new Date();
    updateTimestamp();
    setTimeout(bgRefreshCatalog, 200);
    return getCatalog();
  }

  // Cold start — block until first fetch
  return bgRefreshCatalog();
}

async function bgRefreshCatalog() {
  try {
    const res  = await fetch(CFG.GAS_URL);
    const json = await res.json();
    const raw  = json.products || json.data || (Array.isArray(json) ? json : []);
    const normalized = raw.map(normalizeProduct);
    if (normalized.length >= CFG.MIN_PRODUCTS) {
      S.catalog.all = normalized;
      S.catalog.loadedFromServer = true;
      _saveToCache(normalized);
      if (json.promo) S.promoCodes = json.promo;
      if (json.dailyDeals && Array.isArray(json.dailyDeals) && json.dailyDeals.length) {
        S.catalog.dailyDeals = json.dailyDeals;
      }
    }
    S.lastFetchTime = new Date();
    updateTimestamp();
    // Refresh UI if already mounted
    if (S.activeTab === 'home')    renderHome();
    if (S.activeTab === 'catalog') renderCatalog();
    return getCatalog();
  } catch(e) {
    console.warn('[WOW] fetch failed', e);
    if (!S.catalog.all || !S.catalog.all.length) {
      S.catalog.all = [];
    }
    S.lastFetchTime = new Date();
    updateTimestamp();
    return getCatalog();
  }
}

// ── POST ─────────────────────────────────────────── */
/*
  Повертає:
    true  — GAS підтвердив (res.ok, відповідь прочитана)
    null  — запит відправлено, але відповідь непрозора (no-cors fallback)
    false — мережа недоступна або тайм-аут
*/
async function postData(payload) {
  const body = JSON.stringify(payload);

  // Спроба 1: text/plain не тригерить CORS preflight — GAS отримає і ми прочитаємо відповідь
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 7000);
    const res  = await fetch(CFG.GAS_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      signal:  ctrl.signal,
    });
    clearTimeout(tid);
    return res.ok ? true : false;
  } catch(e) {
    if (e.name === 'AbortError') {
      console.warn('[WOW] POST timeout');
      return false;
    }
    // Мережева або CORS помилка → fallback: no-cors (fire-and-forget)
    // Запит фізично досягне GAS, але відповідь прочитати неможливо
    try {
      fetch(CFG.GAS_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        mode:    'no-cors',
      });
    } catch(_) {}
    return null; // надіслано, але непідтверджено
  }
}

// ── GOOGLE ANALYTICS 4 INJECT ────────────────────── */
function _injectGA() {
  if (!CFG.GA_ID) return;
  const s = document.createElement('script');
  s.src = `https://www.googletagmanager.com/gtag/js?id=${CFG.GA_ID}`;
  s.async = true;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', CFG.GA_ID, { send_page_view: true });
}

// ── META PIXEL INJECT ────────────────────────────── */
function _injectPixel() {
  if (!CFG.FB_PIXEL_ID) return;
  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
    t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s);
  }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', CFG.FB_PIXEL_ID);
  fbq('track', 'PageView');
}

// ── TIKTOK PIXEL INJECT ──────────────────────────── */
function _injectTTPixel() {
  if (!CFG.TT_PIXEL_ID) return;
  !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._r=ttq._r||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(CFG.TT_PIXEL_ID);ttq.page();}(window,document,'ttq');
}

// ── DEMO DATA (cold-start fallback) ──────────────── */
function getDemoProducts(gender) {
  const gLabel = gender === 'female' ? 'Жінка' : 'Чоловік';
  const brands = gender === 'female'
    ? ['Dior','Chanel','Jo Malone','Byredo','YSL']
    : ['Dior','Tom Ford','Versace','Paco Rabanne','Hugo Boss'];
  const models = {
    Dior:          ['Sauvage EDP','Miss Dior EDP','J\'adore EDP','Homme Intense'],
    Chanel:        ['Chance Eau Tendre','Coco Mademoiselle','N°5 EDP','Bleu de Chanel'],
    'Jo Malone':   ['Peony & Blush Suede','Wood Sage & Sea Salt','Lime Basil & Mandarin','Velvet Rose & Oud'],
    Byredo:        ['Gypsy Water','Mojave Ghost','Bal d\'Afrique','Blanche'],
    YSL:           ['Black Opium EDP','Mon Paris EDP','Libre EDP','Y EDP'],
    'Tom Ford':    ['Black Orchid','Oud Wood','Tobacco Vanille','Lost Cherry'],
    Versace:       ['Eros EDP','Dylan Blue','Bright Crystal','Eros Pour Femme'],
    'Paco Rabanne':['1 Million','Olympéa','Lady Million','Invictus'],
    'Hugo Boss':   ['Boss Bottled','The Scent','Hugo Man','Boss Nuit'],
  };
  const volBase = [30, 50, 75, 100];
  const prods = [];
  let idNum = 1;
  brands.forEach(brand => {
    (models[brand] || []).forEach(model => {
      const avail = volBase.filter(() => Math.random() > .3).slice(0, Math.floor(Math.random()*3)+1);
      if (!avail.length) avail.push(50);
      prods.push({
        id:       `demo_${idNum++}`,
        brand,    name: model,
        price:    Math.round((Math.random()*800+350)/50)*50,
        oldPrice: Math.random() > .5 ? Math.round((Math.random()*1000+600)/50)*50 : 0,
        image:    '',
        sizes:    avail,
        sizeQty:  Object.fromEntries(avail.map(v => [v, 1])),
        isNew:    Math.random() > .7,
        gender:   gLabel,
      });
    });
  });
  return prods;
}

// ── SHARE / DEEP LINK ─────────────────────────────── */
function shareProduct(p, e) {
  if (e) e.stopPropagation();
  const url = `${location.origin}${location.pathname}?product=${p.id}`;
  if (navigator.share) {
    navigator.share({ title: `${p.brand} ${p.name}`, text: `${p.price}₴`, url }).catch(() => {});
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => toast('🔗 Посилання скопійовано!'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    toast('🔗 Посилання скопійовано!');
  }
}

function checkDeepLink() {
  const params    = new URLSearchParams(location.search);
  const productId = params.get('product');
  if (!productId) return;
  function tryOpen() {
    const p = (S.catalog.all || []).find(x => x.id === productId);
    if (!p) return;
    openProductDetail(p); // ViewContent fires inside openProductDetail
  }
  if (S.catalog.all && S.catalog.all.length) { tryOpen(); return; }
  const poll = setInterval(() => {
    if (S.catalog.all && S.catalog.all.length) { clearInterval(poll); tryOpen(); }
  }, 500);
  setTimeout(() => clearInterval(poll), 15000);
}
