/* ============================================================
   WOW.ZNAHIDKA — MODALS: SIZE PICKER & PRODUCT DETAIL
   ============================================================ */

function _copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text).catch(() => {}); return; }
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;pointer-events:none';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  } catch(e) {}
}

// ── SIZE PICKER ───────────────────────────────────── */
let _autoSelectTimer = null;

function openSizePicker(product) {
  if (!product) return;
  clearTimeout(_autoSelectTimer);
  _autoSelectTimer = null;
  S.spProduct      = product;
  S.spSelectedSize = null;

  // Product info row
  document.getElementById('sp-product-info').innerHTML = `
    ${product.image && product.image.startsWith('http')
      ? `<img class="sp-img" src="${esc(product.image)}" alt="${esc(product.name)}" loading="lazy" onload="this.classList.add('loaded')">`
      : `<div class="sp-img-ph" aria-hidden="true"></div>`}
    <div class="sp-info">
      <div class="sp-brand">${esc(product.brand)}</div>
      <div class="sp-name">${esc(product.name)}</div>
      <div class="sp-price">${product.price}₴</div>
    </div>`;

  // Size grid
  const grid  = document.getElementById('sp-size-grid');
  const mySize = getRememberedSize();
  const hasMySz = mySize && (product.sizes.includes(mySize) || product.sizes.includes(String(mySize)));
  const low    = product.sizes.length === 1 && product.sizes[0] !== 'ONE SIZE';

  const qty = product.sizeQty || {};
  const hasQtyData = Object.keys(qty).length > 0;

  grid.innerHTML = product.sizes.map(sz => {
    const szArg    = sz === 'ONE SIZE' ? "'ONE SIZE'" : sz;
    const pairQty  = hasQtyData ? (qty[sz] || 1) : null;
    const isLast   = low || (hasQtyData && pairQty === 1);
    const badge    = (hasQtyData && pairQty >= 2)
      ? `<span class="sz-qty">${pairQty}</span>`
      : '';
    return `<button class="sz-btn${isLast ? ' sz-btn-last' : ''}" data-size="${sz}" onclick="selectSize(${szArg})" aria-label="Розмір ${sz}">
      ${sz}${badge}
    </button>`;
  }).join('');

  // My size shortcut
  const mySzWrap = document.getElementById('sp-my-size-bar-wrap');
  if (mySzWrap) {
    mySzWrap.innerHTML = hasMySz
      ? `<div class="sp-my-size-bar" role="button" onclick="selectSize(${mySize});_haptic(12)">
           ✅ ${L.mySizeLabel}: <strong>${mySize}</strong>
           <span style="margin-left:auto">${L.mySizeTap}</span>
         </div>`
      : '';
    if (hasMySz) {
      _autoSelectTimer = setTimeout(() => {
        if (S.spProduct && S.spProduct.id === product.id) selectSize(mySize);
        _autoSelectTimer = null;
      }, 80);
    }
  }

  // Urgency banner — один розмір залишився
  const urgencyEl  = document.getElementById('sp-urgency');
  const confirmBtn = document.querySelector('.sp-confirm-btn');
  const isLastSize = product.sizes.length === 1 && product.sizes[0] !== 'ONE SIZE';
  if (urgencyEl) {
    urgencyEl.innerHTML = isLastSize
      ? `<div class="sp-urgency-banner" role="alert">⚡ Останній розмір — бронюй зараз</div>`
      : '';
  }
  if (confirmBtn) {
    confirmBtn.style.background = isLastSize ? 'var(--red)' : '';
    confirmBtn.style.boxShadow  = isLastSize ? 'var(--shadow-red)' : '';
  }

  // Open sheet
  closeAllSheets();
  document.getElementById('sheet-size')?.classList.add('on');
  document.getElementById('overlay')?.classList.add('on');
  _openSheetId = 'sheet-size';
}


function selectSize(sz) {
  S.spSelectedSize = sz;
  document.querySelectorAll('.sz-btn').forEach(b => {
    const bv = b.dataset.size;
    b.classList.toggle('sel', bv === String(sz) || Number(bv) === Number(sz));
  });
  rememberSize(sz);
  _haptic(12);
}

function requestPhoto() {
  if (!S.spProduct) return;
  const p = S.spProduct;
  const szText = S.spSelectedSize ? `Розмір: ${S.spSelectedSize}` : 'Розмір: уточнимо';
  const productUrl = `${location.origin}${location.pathname}?product=${p.id}`;
  const msg = `Привіт! 👋 Хочу побачити більше фото 📸\n👟 ${p.brand} ${p.name}\n${szText}\n💰 ${p.price}₴\n🔗 ${productUrl}`;
  postData({ action: 'photo_request', product: p, size: S.spSelectedSize });
  openTgLink(`https://t.me/znahidkawow?text=${encodeURIComponent(msg)}`);
}

function confirmSize() {
  if (!S.spSelectedSize) {
    toast('⚠️ Оберіть розмір!');
    document.getElementById('sp-size-grid')?.animate(
      [{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }],
      { duration: 240, iterations: 2 }
    );
    return;
  }
  const p        = S.spProduct;
  const sz       = S.spSelectedSize;
  const existing = S.cart.find(c => c.id === p.id && String(c.size) === String(sz));
  if (existing) {
    toast(`⚠️ ${esc(p.name)} (${sz}) вже є в кошику! <a onclick="openSheet('sheet-cart')">Переглянути →</a>`);
    closeAllSheets();
    return;
  }
  S.cart.push({ ...p, size: sz, qty: 1 });
  saveCart();
  updateBadges();
  renderCartSheet();
  closeAllSheets();
  _haptic([10, 30, 10]);
  // GA4 + Meta Pixel
  if (window.gtag) gtag('event', 'add_to_cart', { currency: 'UAH', value: p.price, items: [{ item_id: p.id, item_name: `${p.brand} ${p.name}`, price: p.price }] });
  if (window.fbq)  fbq('track', 'AddToCart', { currency: 'UAH', value: p.price, content_ids: [p.id], content_type: 'product' });
  if (window.ttq)  try { ttq.track('AddToCart', { currency: 'UAH', value: p.price, content_id: p.id, content_name: `${p.brand} ${p.name}`, content_type: 'product', quantity: 1 }); } catch(_) {}
  toast(`✅ ${esc(p.name)} (${sz}) — в кошику! <a onclick="openSheet('sheet-cart')">Переглянути →</a>`);
}

// ── PRODUCT DETAIL ────────────────────────────────── */

function _pdPhotoTg() {
  const p = S.pdProduct;
  if (!p) return;
  const productUrl = `${location.origin}${location.pathname}?product=${p.id}`;
  const msg = `Привіт! 👋 Хочу побачити більше фото 📸\n👟 ${p.brand} ${p.name}\n💰 ${p.price}₴\n🔗 ${productUrl}`;
  postData({ action: 'photo_request', product: p, size: null });
  openTgLink(`https://t.me/znahidkawow?text=${encodeURIComponent(msg)}`);
}

function openProductDetail(product) {
  if (!product) return;
  S.pdProduct = product;
  trackView(product);
  if (window.fbq)  fbq('track', 'ViewContent', { currency: 'UAH', value: product.price, content_ids: [product.id], content_name: `${product.brand} ${product.name}`, content_type: 'product' });
  if (window.gtag) gtag('event', 'view_item', { currency: 'UAH', value: product.price, items: [{ item_id: product.id, item_name: `${product.brand} ${product.name}`, price: product.price }] });
  if (window.ttq)  ttq.track('ViewContent', { currency: 'UAH', value: product.price, content_id: product.id, content_name: `${product.brand} ${product.name}` });

  const faved = isFav(product.id);
  const pct   = discPct(product);

  // Scarcity
  const qty   = product.sizeQty || {};
  const qKeys = Object.keys(qty);
  const total = qKeys.length > 0
    ? qKeys.reduce((s, k) => s + (qty[k] || 1), 0)
    : product.sizes.length;
  const hasRealSizes = product.sizes.length > 0 && product.sizes[0] !== 'ONE SIZE';
  const scarcHtml = hasRealSizes && total === 1
    ? `<div class="pd-scarc-hero sc-last">🔥 Остання пара!</div>`
    : hasRealSizes && total === 2
      ? `<div class="pd-scarc-hero sc-low">⚡ Залишилось 2 пари</div>`
      : '';

  // Price row
  const priceHtml = product.oldPrice && product.oldPrice > product.price
    ? `<span class="pd-price">${product.price}₴</span>
       <span class="pd-old">${product.oldPrice}₴</span>
       ${pct > 0 ? `<span class="pd-disc-tag">−${pct}%</span>` : ''}`
    : `<span class="pd-price">${product.price}₴</span>`;

  // Size preview chips (non-interactive, max 7)
  const CHIP_MAX = 7;
  const sizesToShow = product.sizes.slice(0, CHIP_MAX);
  const moreCount   = product.sizes.length - sizesToShow.length;
  const sizeChips = product.sizes[0] === 'ONE SIZE' ? '' :
    `<div class="pd-sizes-pre">
      ${sizesToShow.map(s => `<span class="pd-size-chip">${s}</span>`).join('')}
      ${moreCount > 0 ? `<span class="pd-size-chip chip-more">+${moreCount}</span>` : ''}
    </div>`;

  // TG SVG icon (inline, no external requests)
  const tgIco = `<svg class="pd-btn-tg-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.944 2.56a1.5 1.5 0 0 0-1.53-.22L2.53 9.6c-.96.37-1.02 1.7-.1 2.16l4.06 2.02 1.56 5.14c.2.65.99.87 1.49.41l2.3-2.12 4.48 3.29c.59.43 1.42.1 1.57-.61L22.44 4.04a1.5 1.5 0 0 0-.5-1.48zM9.4 14.83l-.83 2.72-.94-3.1 8.33-5.9-6.56 6.28z" fill="#fff"/>
  </svg>`;

  document.getElementById('product-detail-content').innerHTML = `
    <div class="pd-hero">
      ${product.image && product.image.startsWith('http')
        ? `<img class="pd-img" src="${esc(product.image)}" alt="${esc(product.brand)} ${esc(product.name)}" loading="lazy" decoding="async" onload="this.classList.add('loaded')">`
        : `<div class="pd-img-ph" aria-hidden="true">🌸</div>`}
      <div class="pd-hero-vignette" aria-hidden="true"></div>
      <button class="pd-fav-float ${faved ? 'on' : ''}" id="pd-fav-btn"
        onclick="togglePdFav()" aria-label="${faved ? 'Видалити з улюблених' : 'Додати в улюблені'}">
        ${faved ? '❤️' : '🤍'}
      </button>
      ${scarcHtml}
    </div>

    <div class="pd-info">
      <div class="pd-brand">${esc(product.brand)}</div>
      <h2 class="pd-name">${esc(product.name)}</h2>
      <div class="pd-price-row">${priceHtml}</div>
      ${sizeChips}
      ${product.description ? `<p class="pd-desc">${esc(product.description)}</p>` : ''}
      <div class="pd-trust">
        <span class="pd-trust-item">✅ Без передоплати</span>
        <span class="pd-trust-sep">·</span>
        ${product.isFreeShipping
          ? `<span class="pd-trust-item pd-trust-free">🚚 Безкоштовна доставка</span>`
          : `<span class="pd-trust-item">📦 Нова Пошта</span><span class="pd-trust-sep">·</span><span class="pd-trust-item">↩️ Примірка</span>`}
      </div>
    </div>

    <div class="pd-cta">
      <button class="pd-btn-size" onclick="openSizePicker(S.pdProduct)">
        Обрати розмір
      </button>
      <button class="pd-btn-tg" onclick="_pdPhotoTg()">
        ${tgIco}
        Запросити фото в Telegram
      </button>
      <button class="pd-btn-brand" onclick="closeAllSheets();changeTab('catalog');setTimeout(()=>openBrand('${esc(product.brand)}'),220)">
        Ще від ${esc(product.brand)} <span class="i-arr" aria-hidden="true"></span>
      </button>
    </div>`;

  openSheet('sheet-product');
}

function togglePdFav() {
  const p = S.pdProduct;
  if (!p) return;
  if (isFav(p.id)) { S.favs = S.favs.filter(f => f.id !== p.id); }
  else             { S.favs.unshift(p); }
  saveFavs();
  updateBadges();
  const btn   = document.getElementById('pd-fav-btn');
  const faved = isFav(p.id);
  if (btn) {
    btn.className = 'pd-fav-float' + (faved ? ' on' : '');
    btn.textContent = faved ? '❤️' : '🤍';
    btn.setAttribute('aria-label', faved ? 'Видалити з улюблених' : 'Додати в улюблені');
  }
  toast(faved ? '❤️ Додано до улюблених' : 'Видалено з улюблених');
}
