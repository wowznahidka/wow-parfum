/* ============================================================
   WOW.ZNAHIDKA — CATALOG & FILTERS
   Search, size filters, price slider, 3D brand carousel.
   ============================================================ */

// ── BRAND ACCENT COLORS ──────────────────────────── */
const BRAND_CLR = {
  'Dior':              ['#1a1028','#2e1a40'],
  'Chanel':            ['#1a1a1a','#2e2e2e'],
  'Tom Ford':          ['#2a1408','#3e200e'],
  'Byredo':            ['#0e1e22','#1a3038'],
  'Jo Malone':         ['#28220e','#3e3418'],
  'Versace':           ['#1e1400','#342400'],
  'Paco Rabanne':      ['#181010','#2a1818'],
  'YSL':               ['#1a1800','#2c2a00'],
  'Hugo Boss':         ['#0e0e18','#181828'],
  'Guerlain':          ['#1e1408','#2e2010'],
  'Givenchy':          ['#181020','#241830'],
  'Armani':            ['#141414','#202020'],
  'Calvin Klein':      ['#0e1820','#182432'],
  'Narciso Rodriguez': ['#200e18','#301828'],
  'Burberry':          ['#121e12','#1c2e1c'],
  'Mancera':           ['#1a0e20','#28183a'],
  'Xerjoff':           ['#1a1400','#2e2400'],
  'Amouage':           ['#200a0a','#340e0e'],
  'Kilian':            ['#0e0e0e','#1e1818'],
  'Initio':            ['#1a1000','#2e1c00'],
};

function _brandGrad(brand) {
  const c = BRAND_CLR[brand];
  if (c) return `linear-gradient(135deg,${c[0]} 0%,${c[1]} 100%)`;
  let h = 5381;
  for (let i = 0; i < brand.length; i++) h = ((h << 5) + h + brand.charCodeAt(i)) & 0x7fffffff;
  const hue = h % 360;
  return `linear-gradient(135deg,hsl(${hue},50%,14%),hsl(${(hue+28)%360},44%,22%))`;
}

function _brandGlow(brand) {
  const c = BRAND_CLR[brand];
  if (c) {
    const hex = c[0].replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},0.45)`;
  }
  return 'rgba(0,0,0,0.28)';
}

// ── RENDER CATALOG ───────────────────────────────── */
async function renderCatalog() {
  const cv = document.getElementById('catalog-view');
  if (cv && !cv.querySelector('.product-card')) {
    cv.innerHTML = `<div class="prods-grid cat-main-grid">${skelGridCards(6)}</div>`;
  }
  const data = await fetchCatalog();
  updateTimestamp();
  renderSizeChips();
  renderPriceSlider();
  if (S.searchQ) renderSearchResults(data);
  else _renderUnifiedCatalog(data);
}

// ── SIZE CHIPS ───────────────────────────────────── */
function renderSizeChips() {
  const row = document.getElementById('size-chips-row');
  if (!row) return;
  const chips = CFG.SIZES_ALL.map(sz =>
    `<button class="sz-chip ${S.sizeFilters.includes(sz) ? 'on' : ''}"
       onclick="toggleSizeFilter(${sz})" aria-pressed="${S.sizeFilters.includes(sz)}">${sz}</button>`
  ).join('');
  const clearBtn = `<button class="sz-clear ${S.sizeFilters.length ? 'vis' : ''}"
    id="sz-clear-btn" onclick="clearSizeFilters()">× Скинути</button>`;
  row.innerHTML = chips + clearBtn;
}

function toggleSizeFilter(sz) {
  const idx = S.sizeFilters.indexOf(sz);
  if (idx > -1) S.sizeFilters.splice(idx, 1);
  else          S.sizeFilters.push(sz);
  _haptic(8);
  renderSizeChips();
  _applyFilters();
}

function clearSizeFilters() {
  S.sizeFilters = [];
  renderSizeChips();
  _applyFilters();
}

function filterBySize(products) {
  if (!S.sizeFilters.length) return products;
  return products.filter(p => S.sizeFilters.some(sz => p.sizes.includes(sz)));
}

// ── PRICE SLIDER ─────────────────────────────────── */
const PRICE_MAX = 6000;

function renderPriceSlider() {
  const wrap = document.getElementById('price-filter-wrap');
  if (!wrap) return;
  const min = S.priceMin || 0;
  const max = (S.priceMax !== undefined && S.priceMax <= PRICE_MAX) ? S.priceMax : PRICE_MAX;
  wrap.innerHTML = `
    <div class="price-slider-box">
      <div class="price-slider-head">
        <span class="price-slider-lbl">💰 Ціна</span>
        <span class="price-slider-vals" id="price-slider-vals">${_priceLabel(min, max)}</span>
      </div>
      <div class="price-dual-track">
        <div class="price-track-bg"></div>
        <div class="price-track-fill" id="price-track-fill"></div>
        <input type="range" class="price-range-inp" id="price-rng-min"
          min="0" max="${PRICE_MAX}" step="100" value="${min}"
          oninput="onPriceMin(this.value)">
        <input type="range" class="price-range-inp" id="price-rng-max"
          min="0" max="${PRICE_MAX}" step="100" value="${max}"
          oninput="onPriceMax(this.value)">
      </div>
    </div>`;
  _updatePriceFill();
}

function _priceLabel(min, max) {
  if (min <= 0 && max >= PRICE_MAX) return 'Будь-яка ціна';
  if (max >= PRICE_MAX) return `від ${min}₴`;
  return `${min}₴ — ${max}₴`;
}

function _updatePriceFill() {
  const minI = document.getElementById('price-rng-min');
  const maxI = document.getElementById('price-rng-max');
  const fill = document.getElementById('price-track-fill');
  const vals = document.getElementById('price-slider-vals');
  if (!minI || !maxI || !fill) return;
  const min = +minI.value, max = +maxI.value;
  fill.style.left  = (min / PRICE_MAX * 100) + '%';
  fill.style.width = ((max - min) / PRICE_MAX * 100) + '%';
  if (vals) vals.textContent = _priceLabel(min, max);
}

function onPriceMin(v) {
  const maxI = document.getElementById('price-rng-max');
  if (maxI && +v > +maxI.value) { document.getElementById('price-rng-min').value = maxI.value; v = maxI.value; }
  S.priceMin = +v;
  _updatePriceFill();
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(_applyFilters, 200);
}

function onPriceMax(v) {
  const minI = document.getElementById('price-rng-min');
  if (minI && +v < +minI.value) { document.getElementById('price-rng-max').value = minI.value; v = minI.value; }
  S.priceMax = +v;
  _updatePriceFill();
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(_applyFilters, 200);
}

function _resetPriceSlider() {
  S.priceMin = 0;
  S.priceMax = PRICE_MAX;
  renderPriceSlider();
  _applyFilters();
}

function filterByPrice(products) {
  const min = S.priceMin || 0;
  const max = (S.priceMax !== undefined && S.priceMax <= PRICE_MAX) ? S.priceMax : PRICE_MAX;
  if (min <= 0 && max >= PRICE_MAX) return products;
  return products.filter(p => {
    const price = Number(p.price) || 0;
    return price >= min && price <= max;
  });
}

// ── APPLY FILTERS ────────────────────────────────── */
function _applyFilters() {
  const cv = document.getElementById('catalog-view');
  if (cv) cv.classList.add('filtering');
  requestAnimationFrame(() => {
    const data = getCatalog();
    if (!data) { if (cv) cv.classList.remove('filtering'); return; }
    if (S.searchQ)                                  renderSearchResults(data);
    else if (document.getElementById('cat-stories-row')) _updateCatalogGrid(data);
    else                                             _renderUnifiedCatalog(data);
    if (cv) cv.classList.remove('filtering');
  });
}

// ── SEARCH ───────────────────────────────────────── */
let _searchTimer = null;

function onSearchInput(q) {
  const clr = document.getElementById('cat-search-clear');
  if (clr) clr.classList.toggle('vis', q.length > 0);
  _showSearchSuggestions(q);
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => {
    S.searchQ = q.toLowerCase().trim();
    const data = getCatalog();
    if (!data) return;
    if (S.searchQ) { _hideSuggestions(); renderSearchResults(data); }
    else _renderUnifiedCatalog(data);
  }, 280);
}

function clearSearch() {
  const inp = document.getElementById('cat-search');
  if (inp) inp.value = '';
  _hideSuggestions();
  S.searchQ  = '';
  S.catBrand = null;
  const clr = document.getElementById('cat-search-clear');
  if (clr) clr.classList.remove('vis');
  const data = getCatalog();
  if (data) _renderUnifiedCatalog(data);
}

function _showSearchSuggestions(q) {
  const box = document.getElementById('search-sugg');
  if (!box) return;
  if (q.length < 2) { _hideSuggestions(); return; }
  const data = getCatalog();
  if (!data) return;
  const ql = q.toLowerCase();
  const brandSet = new Set();
  const modelSet = new Set();
  data.forEach(p => {
    if (p.brand.toLowerCase().includes(ql)) brandSet.add(p.brand);
    if (p.name.toLowerCase().includes(ql) && modelSet.size < 4)
      modelSet.add(p.name.split(' ').slice(0, 3).join(' '));
  });
  const brands = [...brandSet].slice(0, 3);
  const models = [...modelSet].slice(0, 3);
  if (!brands.length && !models.length) { _hideSuggestions(); return; }
  box.innerHTML = [
    ...brands.map(b => `<button class="sugg-item sugg-brand" onclick="_pickSugg('${esc(b)}')" ><span class="sugg-ico">🌸</span>${esc(b)}</button>`),
    ...models.map(m => `<button class="sugg-item" onclick="_pickSugg('${esc(m)}')"><span class="sugg-ico">🔍</span>${esc(m)}</button>`),
  ].join('');
  box.classList.add('vis');
}

function _hideSuggestions() {
  const box = document.getElementById('search-sugg');
  if (box) { box.innerHTML = ''; box.classList.remove('vis'); }
}

function _pickSugg(text) {
  const inp = document.getElementById('cat-search');
  if (inp) { inp.value = text; inp.blur(); }
  _hideSuggestions();
  S.searchQ = text.toLowerCase().trim();
  const data = getCatalog();
  if (data) renderSearchResults(data);
}

function renderSearchResults(data) {
  const el = document.getElementById('catalog-view');
  if (!el) return;
  const results = filterByNiche(filterByPrice(filterBySize(data))).filter(p =>
    p.brand.toLowerCase().includes(S.searchQ) ||
    p.name.toLowerCase().includes(S.searchQ)
  );
  if (!results.length) {
    el.innerHTML = `<div class="cat-empty">
      <div class="cat-empty-ico">🔍</div>
      <p>Не знайдено за запитом «${esc(S.searchQ)}»</p>
      <a class="tg-link-btn" href="${CFG.TG_URL}" target="_blank" rel="noopener noreferrer">💬 Написати нам</a>
    </div>`;
    return;
  }
  el.innerHTML = `<div class="prods-grid" style="padding:0 16px">
    ${results.slice(0, 48).map(p => prodCardHtml(p, { grid: true })).join('')}
  </div>`;
}

// ── UNIFIED CATALOG (Stories + Grid) ─────────────── */

const _BRAND_ABBR = {
  'Dior':'DR','Chanel':'CH','Tom Ford':'TF','Byredo':'BYR',
  'Jo Malone':'JM','Versace':'VRS','Paco Rabanne':'PR','YSL':'YSL',
  'Hugo Boss':'HB','Guerlain':'GRL','Givenchy':'GVN','Armani':'ARM',
  'Calvin Klein':'CK','Narciso Rodriguez':'NR','Burberry':'BBR',
  'Mancera':'MNC','Xerjoff':'XRJ','Amouage':'AMG','Kilian':'KLN','Initio':'INT',
};
function _brandAbbr(brand) {
  return _BRAND_ABBR[brand] || brand.replace(/\s+/g,'').slice(0,3).toUpperCase();
}

function _buildBrandMap(data) {
  const map = {};
  data.forEach(p => {
    if (!map[p.brand]) map[p.brand] = { count: 0, img: null };
    map[p.brand].count++;
    if (!map[p.brand].img && p.image && p.image.startsWith('http'))
      map[p.brand].img = p.image;
  });
  return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
}

// ── CATALOG GRID — INCREMENTAL RENDERER ──────────── */
let _catGridData     = [];
let _catGridRendered = 0;
let _catGridObserver = null;
let _catGridGen      = 0;

function _renderCatalogGrid(container, products) {
  if (_catGridObserver) { _catGridObserver.disconnect(); _catGridObserver = null; }
  _catGridGen++;
  if (!products.length) {
    container.innerHTML = `<div class="cat-empty">
      <div class="cat-empty-ico">🔍</div>
      <p>Немає товарів з вибраними фільтрами</p>
      <button class="tg-link-btn" onclick="clearSizeFilters();_resetPriceSlider()">× Скинути фільтри</button>
    </div>`;
    return;
  }
  _catGridData     = products;
  _catGridRendered = 0;
  const grid = document.createElement('div');
  grid.className = 'prods-grid cat-main-grid';
  container.innerHTML = '';
  container.appendChild(grid);
  _renderCatGridBatch(grid, _catGridGen);
}

function _renderCatGridBatch(grid, gen) {
  if (gen !== _catGridGen) return;
  const batch = _catGridData.slice(_catGridRendered, _catGridRendered + CFG.GRID_BATCH);
  if (!batch.length) return;
  const frag = document.createDocumentFragment();
  batch.forEach(p => {
    const tmp = document.createElement('div');
    tmp.innerHTML = prodCardHtml(p, { grid: true });
    if (tmp.firstElementChild) frag.appendChild(tmp.firstElementChild);
  });
  grid.appendChild(frag);
  _catGridRendered += batch.length;
  if (_catGridRendered < _catGridData.length) {
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    grid.appendChild(sentinel);
    _catGridObserver = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting || gen !== _catGridGen) return;
      _catGridObserver.disconnect(); _catGridObserver = null;
      _renderCatGridBatch(grid, gen);
    }, { rootMargin: '400px' });
    _catGridObserver.observe(sentinel);
  }
}

function _renderUnifiedCatalog(data) {
  const el = document.getElementById('catalog-view');
  if (!el) return;
  const filtered     = filterByNiche(filterByPrice(filterBySize(data)));
  const brandEntries = _buildBrandMap(data);
  const activeBrand  = S.catBrand;
  const products     = activeBrand ? filtered.filter(p => p.brand === activeBrand) : filtered;

  const storyAll = `<div class="cat-story ${!activeBrand ? 'active' : ''}" data-brand=""
    onclick="_selectBrandStory(null)" role="button" aria-label="Всі бренди"
    style="--sc1:#1a2a1a;--sc2:#284028">
    <div class="cat-story-ring ${!activeBrand ? 'active' : ''}">
      <div class="cat-story-inner">
        <span class="cat-story-ph">🌸</span>
      </div>
    </div>
    <div class="cat-story-lbl">Всі</div>
  </div>`;

  const storiesHtml = brandEntries.map(([brand, info]) => {
    const clrs    = BRAND_CLR[brand] || ['#2a2a2a', '#404040'];
    const isActive = activeBrand === brand;
    const abbr    = _brandAbbr(brand);
    return `<div class="cat-story ${isActive ? 'active' : ''}" data-brand="${esc(brand)}"
        onclick="_selectBrandStory('${esc(brand)}')" role="button" aria-label="${esc(brand)}"
        style="--sc1:${clrs[0]};--sc2:${clrs[1]}">
      <div class="cat-story-ring ${isActive ? 'active' : ''}">
        <div class="cat-story-inner">
          <span class="cat-story-abbr">${abbr}</span>
        </div>
      </div>
      <div class="cat-story-lbl">${esc(brand)}</div>
    </div>`;
  }).join('');

  const salt = activeBrand ? (activeBrand.charCodeAt(0) * 31 + activeBrand.length) | 0 : 99;
  el.innerHTML = `
    <div class="cat-stories-hdr">
      <span class="cat-vibe-line">Знайди свій аромат</span>
      <span class="cat-vibe-fire">🔥</span>
      ${activeBrand ? `<button class="cat-story-reset" onclick="_selectBrandStory(null)">× ${esc(activeBrand)}</button>` : ''}
    </div>
    <div class="cat-stories-row" id="cat-stories-row" role="list" aria-label="Фільтр по бренду">
      ${storyAll}${storiesHtml}
    </div>
    <div id="cat-grid-wrap"></div>`;
  _renderCatalogGrid(document.getElementById('cat-grid-wrap'), shuffleSeeded(products, salt));
}

function _updateCatalogGrid(data) {
  const filtered = filterByNiche(filterByPrice(filterBySize(data)));
  const products  = S.catBrand ? filtered.filter(p => p.brand === S.catBrand) : filtered;
  const gw = document.getElementById('cat-grid-wrap');
  if (!gw) return;
  const salt = S.catBrand ? (S.catBrand.charCodeAt(0) * 31 + S.catBrand.length) | 0 : 99;
  _renderCatalogGrid(gw, shuffleSeeded(products, salt));
}

function _selectBrandStory(brand) {
  S.catBrand = brand || null;
  _haptic(8);
  document.querySelectorAll('.cat-story').forEach(s => {
    const b    = s.dataset.brand || null;
    const active = brand ? (b === brand) : (!b || b === '');
    s.classList.toggle('active', active);
    s.querySelector('.cat-story-ring')?.classList.toggle('active', active);
  });
  const hdr = document.querySelector('.cat-stories-hdr');
  if (hdr) {
    let btn = hdr.querySelector('.cat-story-reset');
    if (brand && !btn) {
      btn = document.createElement('button');
      btn.className = 'cat-story-reset';
      btn.onclick   = () => _selectBrandStory(null);
      hdr.appendChild(btn);
    }
    if (btn) btn.textContent = brand ? `× ${brand}` : '';
    if (!brand && btn) btn.remove();
  }
  const data = getCatalog();
  if (!data) return;
  _updateCatalogGrid(data);
  const gw = document.getElementById('cat-grid-wrap');
  if (gw) gw.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openBrand(brand) {
  S.catBrand = brand || null;
  const data = getCatalog();
  if (data) _renderUnifiedCatalog(data);
}

function backToBrands() {
  _selectBrandStory(null);
}

// ── NICHE FILTER ─────────────────────────────────── */
let _nicheFilter = '';

document.addEventListener('click', function(e) {
  const chip = e.target.closest('.niche-fam-chip');
  if (!chip) return;
  const key = chip.dataset.cat || chip.dataset.style || '';
  filterNiche(key === 'all' ? '' : key);
});

function filterNiche(key) {
  _nicheFilter = (key == null || key === 'all') ? '' : key;
  document.querySelectorAll('.niche-fam-chip').forEach(function(btn) {
    const bk = btn.dataset.cat || btn.dataset.style || '';
    const isActive = (!_nicheFilter && (!bk || bk === 'all')) || bk === _nicheFilter;
    btn.classList.toggle('active', isActive);
  });
  _applyFilters();
}

function filterByNiche(products) {
  if (!_nicheFilter) return products;
  return products.filter(function(p) {
    const fields = [p.category, p.tags, p.name, p.type].filter(Boolean).join(' ').toLowerCase();
    return fields.includes(_nicheFilter.toLowerCase());
  });
}
