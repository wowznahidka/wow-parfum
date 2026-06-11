/* ============================================================
   WOW.ZNAHIDKA — PRODUCT RENDERING
   Card HTML generation and home-page sections.
   ============================================================ */

// ── UTILS ────────────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtPrice(n) {
  return (Math.round(Number(n) || 0)) + '₴';
}

function _fomoViewers(id) {
  const slot = Math.floor(Date.now() / 30000);
  const h    = Math.abs(hashStr(id + slot));
  return 2 + (h % 5);
}

function quickGridSize(productId, size) {
  const p = findProd(productId);
  if (!p) return;
  if (p.sizes.length === 1 || String(size).toUpperCase() === 'ONE SIZE') {
    S.cart.push({ ...p, size: String(size).toUpperCase() === 'ONE SIZE' ? 'ONE SIZE' : Number(size), qty: 1 });
    saveCart();
    updateBadges();
    _haptic(20);
    toast(`✅ ${esc(p.brand)} ${esc(p.name)} — в кошику! <a onclick="openSheet('sheet-cart')">Кошик →</a>`);
  } else {
    S.spProduct = p;
    openSizePicker(p);
  }
}

function hashStr(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function discPct(p) {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0;
  return Math.round((1 - p.price / p.oldPrice) * 100);
}

function _scarcityText(p) {
  if (!p.sizes || !p.sizes.length || p.sizes[0] === 'ONE SIZE') return '';
  const n = p.sizes.length;
  if (n === 1) return `<div class="scarcity-chip">${L.scarcity1 || '⚡️ Останній розмір!'}</div>`;
  if (n <= 3)  return `<div class="scarcity-chip">${L.scarcityLow || '🔥 Лише'} ${n}${L.scarcityLowSuffix || ' розміри'}</div>`;
  return '';
}

function isTrendingSize(sz, gender) {
  const hot = (gender === 'female' || gender === 'Жінка')
    ? CFG.HOT_SIZES_FEMALE : CFG.HOT_SIZES_MALE;
  return hot.includes(Number(sz));
}

// ── CARD HTML ────────────────────────────────────── */
/* opts: { grid?: bool, eager?: bool } */
function prodCardHtml(p, opts = {}) {
  const { grid = false, eager = false } = opts;
  const low     = p.sizes.length === 1 && p.sizes[0] !== 'ONE SIZE';
  const pct     = discPct(p);
  const gridCls = grid ? ' grid-card' : '';

  const imgPart = p.image && p.image.startsWith('http')
    ? `<img class="card-img" src="${esc(p.image)}" alt="${esc(p.brand)} ${esc(p.name)}"
         loading="${eager ? 'eager' : 'lazy'}" decoding="async" onload="this.classList.add('loaded')">`
    : `<div class="card-img-placeholder" aria-hidden="true">🌸</div>`;

  const badgePart = p.isNew
    ? `<div class="prod-badge badge-new">NEW</div>`
    : low
      ? `<div class="prod-badge badge-low">LAST</div>`
      : '';

  const pricePart = p.oldPrice && p.oldPrice > p.price
    ? `${fmtPrice(p.price)}<span class="prod-card-old">${fmtPrice(p.oldPrice)}</span>${pct > 0 ? `<span class="prod-card-disc">-${pct}%</span>` : ''}`
    : `${fmtPrice(p.price)}`;

  const maxSz  = grid ? 4 : 5;
  const szList = p.sizes[0] === 'ONE SIZE'
    ? (grid
        ? `<button class="sz-quick-btn" onclick="event.stopPropagation();quickGridSize('${p.id}','ONE SIZE')" aria-label="ONE SIZE">ONE SIZE</button>`
        : `<span>ONE SIZE</span>`)
    : p.sizes.slice(0, maxSz).map(s => grid
        ? `<button class="sz-quick-btn" data-sz="${s}" onclick="event.stopPropagation();quickGridSize('${p.id}',${s})" aria-label="${s}">${s}</button>`
        : `<span>${s}</span>`).join('') +
      (p.sizes.length > maxSz ? `<span class="sz-more">+${p.sizes.length - maxSz}</span>` : '');

  const fomoHtml  = '';

  return `<article class="product-card${gridCls}"
    onclick="openProductDetail(findProd('${p.id}'))"
    role="button" tabindex="0" aria-label="${esc(p.brand)} ${esc(p.name)}, ${p.price}₴">
    <div class="card-img-wrap">
      ${imgPart}
      ${badgePart}
    </div>
    <div class="card-body">
      <div class="card-brand">${esc(p.brand)}</div>
      <div class="card-name">${esc(p.name)}</div>
      <div class="card-price">${pricePart}</div>
      <div class="card-sizes-preview${grid ? ' sz-quick-row' : ''}">${szList}</div>
      ${_scarcityText(p)}
      ${fomoHtml}
    </div>
  </article>`;
}

// ── SESSION-SEEDED SHUFFLE ────────────────────────── */
let _sessionSeed = 0;
(function () {
  let s = parseInt(sessionStorage.getItem('wow_seed') || '0');
  if (!s || s < 1000) {
    s = ((Date.now() & 0xffff) * 48271 ^ (Math.random() * 0x7fffffff | 0)) & 0x7fffffff;
    if (s < 1) s = 99991;
    sessionStorage.setItem('wow_seed', s);
  }
  _sessionSeed = s;
})();

function _lcg(s) {
  return (((s >>> 0) * 1664525 + 1013904223) & 0x7fffffff) >>> 0;
}

/* shuffleSeeded(arr, salt) — reproducible within a session, fresh each new visit */
function shuffleSeeded(arr, salt) {
  let s = _lcg((_sessionSeed ^ ((((salt || 0) * 2654435761) | 0) & 0x7fffffff)) >>> 0);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    s = _lcg(s);
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── SKELETON HELPERS ─────────────────────────────── */
function skelCards(n) {
  return Array.from({ length: n }).map(() => `
    <div class="skel-card" aria-hidden="true">
      <div class="skel skel-card-img"></div>
      <div class="skel skel-card-line"></div>
      <div class="skel skel-card-line2"></div>
      <div class="skel skel-card-price"></div>
    </div>`).join('');
}

function skelGridCards(n) {
  return Array.from({ length: n }).map(() => `
    <div class="skel-card sk-grid" aria-hidden="true">
      <div class="skel skel-card-img"></div>
      <div class="skel skel-card-line"></div>
      <div class="skel skel-card-line2"></div>
      <div class="skel skel-card-price"></div>
    </div>`).join('');
}

// ── HOME SECTIONS ────────────────────────────────── */
function renderHome() {
  setHomeGreeting();
  // Instant skeleton
  const popEl = document.getElementById('popular-row');
  const newEl = document.getElementById('new-row');
  if (popEl && !popEl.querySelector('.product-card')) popEl.innerHTML = skelCards(5);
  if (newEl && !newEl.querySelector('.product-card')) newEl.innerHTML = skelCards(5);

  fetchCatalog().then(data => {
    if (!data || !data.length) return;
    renderDailyDeals(getCatalog());
    renderPopularRow(data);
    renderNewRow(data);
    renderHomeBrands(data);
    renderRecentlyViewed(data);
    renderReviews();
    renderHomeAllGrid(data);
    animateCounter(data.length);
    _setupScrollNudge(data.length);
    _updateGenderCounts(data);
  });
}

function setHomeGreeting() {
  const h   = new Date().getHours();
  const msg = h < 12 ? L.greeting0 : h < 17 ? L.greeting1 : h < 22 ? L.greeting2 : L.greeting3;
  const el  = document.getElementById('home-greeting');
  if (el) el.textContent = msg;
}

function animateCounter(total) {
  const el = document.getElementById('models-counter');
  if (!el) return;
  // Якщо вкладка прихована — ставимо фінальне значення зразу (rAF паузується)
  if (document.hidden) { el.textContent = total; return; }
  let cur = 0;
  const step = Math.max(1, total / 60);
  const tick = () => {
    cur = Math.min(cur + step, total);
    el.textContent = Math.round(cur);
    if (cur < total) setTimeout(tick, 16); // setTimeout працює і у фоні
  };
  tick();
}
// При поверненні до вкладки — заповнюємо counter якщо він застряг на 0
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  const el = document.getElementById('models-counter');
  const total = (typeof S !== 'undefined' && S.catalog && S.catalog.all && S.catalog.all.length) || 0;
  if (el && total && (el.textContent === '0' || el.textContent === '')) {
    animateCounter(total);
  }
});

// Summer months (May–Aug): push fur/winter products to the back
function _isWinter(p) {
  const t = `${p.name} ${p.brand}`.toLowerCase();
  return ['fur', 'хутр', 'зимов', 'winter', 'шерп', 'термо', 'fleece'].some(kw => t.includes(kw));
}
function _isSummer() { const m = new Date().getMonth(); return m >= 4 && m <= 8; }

function renderPopularRow(data) {
  const el = document.getElementById('popular-row');
  if (!el) return;
  const summer = _isSummer();
  const pool = [...data]
    .filter(p => p.image && p.image.startsWith('http'))
    .sort((a, b) => {
      if (summer) {
        const aw = _isWinter(a) ? 1 : 0, bw = _isWinter(b) ? 1 : 0;
        if (aw !== bw) return aw - bw;
      }
      return b.sizes.length - a.sizes.length;
    })
    .slice(0, 30);
  const items = shuffleSeeded(pool.length >= 4 ? pool : data.slice(0, 30), 1).slice(0, 10);
  el.innerHTML = items.map((p, i) => prodCardHtml(p, { eager: i < 4 })).join('');
}

function renderNewRow(data) {
  const el = document.getElementById('new-row');
  if (!el) return;
  const summer = _isSummer();
  const withPhoto = data.filter(p => p.image && p.image.startsWith('http'));
  const news  = withPhoto.filter(p => p.isNew && !(summer && _isWinter(p)));
  const pool  = news.length >= 3 ? news : withPhoto.filter(p => !(summer && _isWinter(p))).slice(0, 40);
  const items = shuffleSeeded(pool.length >= 3 ? pool : withPhoto.slice(0, 40), 2).slice(0, 8);
  el.innerHTML = items.map((p, i) => prodCardHtml(p, { eager: i < 4 })).join('');
}

function renderHomeBrands(data) {
  const el = document.getElementById('home-brands-grid');
  if (!el) return;
  const counts = {}, imgs = {};
  data.forEach(p => {
    counts[p.brand] = (counts[p.brand] || 0) + 1;
    if (!imgs[p.brand] && p.image && p.image.startsWith('http')) imgs[p.brand] = p.image;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 14);
  const grad = typeof _brandGrad === 'function' ? _brandGrad : () => '#1a1a1a';
  const glow = typeof _brandGlow === 'function' ? _brandGlow : () => 'rgba(0,0,0,.28)';
  el.innerHTML = entries.map(([brand, cnt]) => `
    <button class="hb-card" onclick="changeTab('catalog');setTimeout(()=>openBrand('${esc(brand)}'),200)"
      style="background:${grad(brand)};--hb-glow:${glow(brand)}"
      aria-label="${esc(brand)}, ${cnt} моделей">
      ${imgs[brand]
        ? `<div class="hb-bg-img" style="background-image:url('${esc(imgs[brand])}')" aria-hidden="true"></div>`
        : ''}
      <div class="hb-text">
        <div class="hb-name">${esc(brand)}</div>
        <div class="hb-cnt">${cnt} мод.</div>
      </div>
    </button>`).join('');
}

function renderRecentlyViewed(data) {
  const sec = document.getElementById('recently-viewed-section');
  const row = document.getElementById('recently-viewed-row');
  if (!sec || !row || !S.recent.length) { sec && sec.classList.add('hidden'); return; }
  const items = S.recent.map(id => data.find(p => p.id === id)).filter(Boolean);
  if (!items.length) { sec.classList.add('hidden'); return; }
  sec.classList.remove('hidden');
  row.innerHTML = items.map((p, i) => prodCardHtml(p, { eager: i < 4 })).join('');
  const cnt = document.getElementById('rv-count');
  if (cnt) cnt.textContent = `· ${items.length}`;
}

function clearRecentlyViewed() {
  S.recent = [];
  try { localStorage.setItem('wow_recent', '[]'); } catch (_) {}
  const sec = document.getElementById('recently-viewed-section');
  if (sec) sec.classList.add('hidden');
  if (typeof toast === 'function') toast('🧹 Історію очищено');
}

function renderReviews() {
  const row = document.getElementById('reviews-row');
  if (!row) return;
  row.innerHTML = S.reviews.map((r, i) => `
    <article class="rev-bubble${i % 2 === 1 ? ' rev-alt' : ''}" role="article">
      <div class="rev-bub-head">
        <span class="rev-bub-emoji">${r.emoji || '😊'}</span>
        <div>
          <div class="rev-bub-name">${esc(r.author)}</div>
          ${r.location ? `<div class="rev-bub-loc">📍 ${esc(r.location)}</div>` : ''}
        </div>
      </div>
      <div class="rev-bub-stars" aria-label="${r.stars || 5} зірок">${'★'.repeat(r.stars || 5)}</div>
      <p class="rev-bub-text">${esc(r.text)}</p>
    </article>`).join('');
}

// ── VIRTUAL GRID (infinite scroll) ───────────────── */
let _gridData     = [];
let _gridRendered = 0;
let _gridObserver = null;

function renderHomeAllGrid(data) {
  const el = document.getElementById('home-all-grid');
  if (!el) return;
  if (_gridObserver) { _gridObserver.disconnect(); _gridObserver = null; }
  // Discounted items first (better conversion), then the rest — both groups shuffled
  const discounted = data.filter(p => p.oldPrice && p.oldPrice > p.price);
  const regular    = data.filter(p => !p.oldPrice || p.oldPrice <= p.price);
  _gridData     = [...shuffleSeeded(discounted, 3), ...shuffleSeeded(regular, 4)];
  _gridRendered = 0;
  el.innerHTML  = '';
  _renderGridBatch(el);
}

function _renderGridBatch(el) {
  const batch = _gridData.slice(_gridRendered, _gridRendered + CFG.GRID_BATCH);
  if (!batch.length) return;
  const frag = document.createDocumentFragment();
  batch.forEach(p => {
    const tmp = document.createElement('div');
    tmp.innerHTML = prodCardHtml(p, { grid: true });
    if (tmp.firstElementChild) frag.appendChild(tmp.firstElementChild);
  });
  const old = el.querySelector('#grid-sentinel');
  if (old) old.remove();
  el.appendChild(frag);
  _gridRendered += batch.length;
  if (_gridRendered < _gridData.length) {
    const sentinel = document.createElement('div');
    sentinel.id = 'grid-sentinel'; sentinel.style.height = '1px';
    el.appendChild(sentinel);
    _gridObserver = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      _gridObserver.disconnect(); _gridObserver = null;
      _renderGridBatch(el);
    }, { rootMargin: '300px' });
    _gridObserver.observe(sentinel);
  }
}

// ── SCROLL NUDGE ─────────────────────────────────── */
let _scrollNudgeObserver = null;
let _scrollNudgeFired    = false;

function _setupScrollNudge(total) {
  if (_scrollNudgeFired) return;
  if (_scrollNudgeObserver) { _scrollNudgeObserver.disconnect(); _scrollNudgeObserver = null; }
  const sentinel = document.getElementById('home-nudge-sentinel');
  if (!sentinel) return;
  sentinel.style.display = 'block';
  _scrollNudgeObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    _scrollNudgeFired = true;
    _scrollNudgeObserver.disconnect(); _scrollNudgeObserver = null;
    if (S.matchIdx > 0 || S.activeTab !== 'home') return;
    sentinel.parentNode?.querySelectorAll('.scroll-nudge').forEach(n => n.remove());
    const nudge = document.createElement('div');
    nudge.className = 'scroll-nudge';
    nudge.onclick = () => { nudge.remove(); changeTab('match'); };
    nudge.innerHTML = `<p>🌸 Ти переглянув ${total} ароматів</p><small>Свайпай у Match — знайди ідеальну 🔥</small>`;
    sentinel.parentNode?.insertBefore(nudge, sentinel);
  }, { rootMargin: '0px', threshold: 0.5 });
  _scrollNudgeObserver.observe(sentinel);
}

// ── GENDER COUNTS ────────────────────────────────── */
function _updateGenderCounts(data) {
  const mc = data.filter(p => p.gender === 'male'   || p.gender === 'Чоловік').length;
  const fc = data.filter(p => p.gender === 'female' || p.gender === 'Жінка').length;
  const mEl = document.getElementById('g-cnt-male');
  const fEl = document.getElementById('g-cnt-female');
  if (mEl && mc) { mEl.textContent = mc + ' мод.'; mEl.classList.add('vis'); }
  if (fEl && fc) { fEl.textContent = fc + ' мод.'; fEl.classList.add('vis'); }
}

// ── RECENTLY VIEWED TRACKER ───────────────────────── */
function trackView(product) {
  S.recent = S.recent.filter(id => id !== product.id);
  S.recent.unshift(product.id);
  if (S.recent.length > 6) S.recent = S.recent.slice(0, 6);
  saveRecent();
}
