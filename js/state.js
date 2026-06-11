/* ============================================================
   WOW.ZNAHIDKA — GLOBAL STATE
   Single source of truth. All mutable state lives here.
   ============================================================ */

const S = {
  // ── Persistent (localStorage-backed) ──
  gender:   localStorage.getItem('wow_gender') || 'mixed',
  favs:     _safeParse('wow_favs',   []),
  cart:     _safeParse('wow_cart',   []),
  recent:   _safeParse('wow_recent', []),
  reviews:  [...STATIC_REVIEWS],

  // ── Catalog ──
  catalog: {
    all:            null,   // full product array (both genders)
    loadedFromServer: false,
  },
  promoCodes:    {},
  lastFetchTime: null,

  // ── UI ──
  activeTab:    'home',
  lang:         localStorage.getItem('wow_lang') === 'en' ? 'en' : 'ua',

  // ── Catalog / filters ──
  sizeFilters:  [],
  priceFilter:  'all',
  priceMin:     0,
  priceMax:     6000,
  searchQ:      '',
  catView:      'brands',  // 'brands' | 'products'
  catBrand:     null,
  catScrollTop: 0,
  quickFilter:  'all',     // 'all' | 'discount' | 'new' | 'free'
  sortMode:     'popular', // 'popular' | 'new' | 'price_asc' | 'price_desc' | 'discount'

  // ── Match engine ──
  matchPool: [],
  matchIdx:  0,

  // ── Sheets ──
  spProduct:      null,
  spSelectedSize: null,
  pdProduct:      null,

  // ── Checkout ──
  starRating:    0,
  delivType:     'dept',
  promoDiscount: 0,
  promoFixed:    0,
  promoCode:     '',

  // ── UTM attribution ──
  utm: _loadUtm(),
};

function _loadUtm() {
  try {
    const raw = localStorage.getItem('wow_utm');
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > 7 * 24 * 60 * 60 * 1000) { localStorage.removeItem('wow_utm'); return null; }
    return data;
  } catch(e) { return null; }
}
function _saveUtm(utm) {
  try { localStorage.setItem('wow_utm', JSON.stringify({ ts: Date.now(), data: utm })); } catch(e) {}
}

// ── PERSIST HELPERS ─────────────────────────────── */
function saveFavs()   { localStorage.setItem('wow_favs',   JSON.stringify(S.favs)); }
function saveCart()   { localStorage.setItem('wow_cart',   JSON.stringify(S.cart)); }
function saveRecent() { localStorage.setItem('wow_recent', JSON.stringify(S.recent)); }

function _safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch(e) { return fallback; }
}

// ── PRODUCT LOOKUP ───────────────────────────────── */
function findProd(id) {
  const all = S.catalog.all || [];
  return all.find(p => p.id === id) || null;
}

function getCatalog() {
  const all = S.catalog.all || [];
  if (S.gender === 'mixed') return all;
  const accept = S.gender === 'female'
    ? ['Жінка','female','ж','Ж','Жіночий']
    : ['Чоловік','male','ч','Ч','Чоловічий'];
  // mixed/унісекс товари показуємо в обох каталогах
  return all.filter(p => accept.includes(p.gender) || p.gender === 'mixed' || p.gender === '');
}

function isFav(id)   { return S.favs.some(f => f.id === id); }
function inCart(id)  { return S.cart.some(c => c.id === id); }
