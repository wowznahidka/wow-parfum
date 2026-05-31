/* ============================================================
   WOW.ZNAHIDKA — DAILY DEALS
   3 seeded-random products with free delivery, refreshed at midnight.
   All users see the same products on the same day (deterministic PRNG).
   ============================================================ */

// ── PRNG (mulberry32) ────────────────────────────── */
function _mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function _getDateSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ── DEAL SELECTION ───────────────────────────────── */
function getDailyDeals(catalog, count) {
  count = count || 3;
  const seed     = _getDateSeed();
  const cacheKey = 'wow_deals_' + seed;

  // Purge previous days' cache entries
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('wow_deals_') && k !== cacheKey) localStorage.removeItem(k);
    });
  } catch(_) {}

  // Server-side deals take priority — GAS computed them deterministically,
  // so all clients see identical products regardless of local array order.
  if (S.catalog.dailyDeals && S.catalog.dailyDeals.length) {
    const deals = S.catalog.dailyDeals
      .map(id => (catalog || []).find(p => String(p.id) === String(id)))
      .filter(Boolean)
      .slice(0, count)
      .map(p => ({ ...p, isFreeShipping: true }));
    if (deals.length) {
      try { localStorage.setItem(cacheKey, JSON.stringify(deals)); } catch(_) {}
      return deals;
    }
  }

  // Return cached for today (client-side fallback while server loads)
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) return JSON.parse(raw);
  } catch(_) {}

  // Client-side selection fallback (stable sort ensures same result if IDs are consistent)
  const eligible = catalog
    .filter(p => p.sizes.length > 0 && !(p.sizes.length === 1 && p.sizes[0] === 'ONE SIZE'))
    .sort((a, b) => String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0);
  if (!eligible.length) return [];

  const rng = _mulberry32(seed);
  const arr = [...eligible];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }

  const deals = arr.slice(0, count).map(p => ({ ...p, isFreeShipping: true }));
  try { localStorage.setItem(cacheKey, JSON.stringify(deals)); } catch(_) {}
  return deals;
}

// ── COUNTDOWN ────────────────────────────────────── */
function _timeUntilMidnight() {
  const now = new Date();
  const mid = new Date(now); mid.setHours(24, 0, 0, 0);
  const ms  = mid - now;
  return {
    h: Math.floor(ms / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
}

// ── CARD HTML ────────────────────────────────────── */
function _dealCardHtml(p) {
  const img = p.image && p.image.startsWith('http')
    ? `<img class="card-img" src="${esc(p.image)}" alt="${esc(p.brand)} ${esc(p.name)}"
         loading="lazy" decoding="async" onload="this.classList.add('loaded')">`
    : `<div class="card-img-placeholder" aria-hidden="true">🌸</div>`;

  const szList = p.sizes[0] === 'ONE SIZE'
    ? '<span>ONE SIZE</span>'
    : p.sizes.slice(0, 5).map(s => `<span>${s}</span>`).join('') +
      (p.sizes.length > 5 ? `<span class="sz-more">+${p.sizes.length - 5}</span>` : '');

  return `<article class="product-card dd-card"
    onclick="openDealDetail('${esc(p.id)}')"
    role="button" tabindex="0"
    aria-label="${esc(p.brand)} ${esc(p.name)}, ${p.price}₴, безкоштовна доставка">
    <div class="card-img-wrap">
      ${img}
      <div class="dd-badge" aria-label="Безкоштовна доставка">🚚</div>
    </div>
    <div class="card-body">
      <div class="card-brand">${esc(p.brand)}</div>
      <div class="card-name">${esc(p.name)}</div>
      <div class="card-price">${p.price}₴</div>
      <div class="card-sizes-preview">${szList}</div>
    </div>
  </article>`;
}

// ── OPEN DEAL IN PRODUCT DETAIL ──────────────────── */
function openDealDetail(productId) {
  // Pull from today's cache so isFreeShipping is guaranteed present
  let dealProduct = null;
  try {
    const cached = JSON.parse(localStorage.getItem('wow_deals_' + _getDateSeed()) || '[]');
    dealProduct  = cached.find(d => d.id === productId) || null;
  } catch(_) {}
  if (!dealProduct) {
    const base = findProd(productId);
    if (!base) return;
    dealProduct = { ...base, isFreeShipping: true };
  }
  openProductDetail(dealProduct);
}

// ── RENDER SECTION ───────────────────────────────── */
let _ddTimerID = null;

function renderDailyDeals(catalog) {
  const sec = document.getElementById('daily-deals-section');
  if (!sec) return;

  if (_ddTimerID) { clearInterval(_ddTimerID); _ddTimerID = null; }

  const deals = getDailyDeals(catalog);
  if (!deals.length) { sec.hidden = true; return; }
  sec.hidden = false;

  const row = sec.querySelector('.dd-row');
  if (row) row.innerHTML = deals.map(_dealCardHtml).join('');

  const timerEl = sec.querySelector('.dd-timer');

  function _tick() {
    const { h, m, s } = _timeUntilMidnight();
    if (timerEl) {
      timerEl.textContent =
        String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0');
    }
    // Midnight: fade out → re-fetch → re-render → fade in
    if (h === 0 && m === 0 && s === 0) {
      clearInterval(_ddTimerID); _ddTimerID = null;
      sec.style.transition = 'opacity .5s ease';
      sec.style.opacity    = '0';
      setTimeout(() => {
        fetchCatalog().then(data => {
          renderDailyDeals(data);
          sec.style.opacity = '1';
          setTimeout(() => { sec.style.transition = ''; }, 520);
        });
      }, 520);
    }
  }

  _tick();
  _ddTimerID = setInterval(_tick, 1000);
}
