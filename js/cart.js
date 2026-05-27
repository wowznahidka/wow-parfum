/* ============================================================
   WOW.ZNAHIDKA — FAVORITES, CART & CHECKOUT
   Preserves all GAS/Telegram integration logic.
   ============================================================ */

// ── FAVORITES ────────────────────────────────────── */
function addToFavs(p) {
  if (!isFav(p.id)) {
    S.favs.push(p);
    saveFavs();
    updateBadges();
  }
}

function removeFromFavs(id, e) {
  if (e) e.stopPropagation();
  S.favs = S.favs.filter(f => f.id !== id);
  saveFavs();
  updateBadges();
  renderFavSheet();
}

function renderFavSheet() {
  const el = document.getElementById('fav-list');
  if (!el) return;
  if (!S.favs.length) {
    el.innerHTML = `<div class="sh-empty">
      <div class="sh-empty-ico">🤍</div>
      <p>${L.favsEmpty}</p>
    </div>`;
    return;
  }

  el.innerHTML = S.favs.map(p => {
    const inCartSizes = S.cart.filter(c => c.id === p.id).map(c => Number(c.size));
    let sizeChips;
    if (p.sizes[0] === 'ONE SIZE') {
      sizeChips = `<button class="fav-sz-quick one-size" onclick="quickAddToCart('${p.id}','ONE SIZE',this)">ONE SIZE — В кошик</button>`;
    } else {
      const visible = p.sizes.slice(0, 7);
      const more    = p.sizes.length > 7 ? p.sizes.length - 7 : 0;
      sizeChips = visible.map(sz => {
        const sel = inCartSizes.includes(Number(sz));
        return `<button class="fav-sz-quick${sel ? ' sel' : ''}" onclick="quickAddToCart('${p.id}',${sz},this)">${sz}</button>`;
      }).join('') + (more ? `<span style="font-size:10px;color:var(--text-muted);align-self:center;padding:0 2px">+${more}</span>` : '');
    }
    return `<div class="fav-item">
      ${p.image && p.image.startsWith('http')
        ? `<img class="fav-img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onload="this.classList.add('loaded')">`
        : `<div class="fav-img-ph" aria-hidden="true">🌸</div>`}
      <div class="fav-body">
        <div class="fav-brand">${esc(p.brand)}</div>
        <div class="fav-name">${esc(p.name)}</div>
        <div class="fav-price">${p.price}₴</div>
        <div class="fav-sizes">${sizeChips}</div>
      </div>
      <div class="fav-acts">
        <button class="fav-rm" onclick="removeFromFavs('${esc(p.id)}',event)" aria-label="Видалити"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg></button>
      </div>
    </div>`;
  }).join('');

  // Resume-match banner
  const remaining = S.matchPool.length > 0 ? S.matchPool.length - S.matchIdx : 0;
  if (remaining > 0) {
    el.innerHTML += `<div class="fav-resume-match" onclick="closeAllSheets();changeTab('match')">
      <div><span>🔥 Ще ${remaining} ароматів чекають</span><br><small>Свайпай далі — знайди свій аромат</small></div>
      <span class="i-arr" style="width:8px;height:8px;border-width:2px" aria-hidden="true"></span>
    </div>`;
  }
}

// Quick-add size from fav sheet (skips full size-picker modal)
function quickAddToCart(productId, size, btnEl) {
  const p = findProd(productId) || S.favs.find(f => f.id === productId);
  if (!p) return;
  // Visual selection
  btnEl.closest('.fav-sizes')?.querySelectorAll('.fav-sz-quick').forEach(b => b.classList.remove('sel'));
  btnEl.classList.add('sel');
  _haptic([10, 30, 10]);
  const sz     = String(size).toUpperCase() === 'ONE SIZE' ? 'ONE SIZE' : Number(size);
  const exists = S.cart.find(c => c.id === p.id && String(c.size) === String(sz));
  if (!exists) {
    S.cart.push({ ...p, size: sz, qty: 1 });
  } else {
    exists.qty = (exists.qty || 1) + 1;
  }
  saveCart();
  updateBadges();
  rememberSize(sz);
  // Swap buttons
  const acts = btnEl.closest('.fav-item')?.querySelector('.fav-acts');
  if (acts) {
    acts.innerHTML = `
      <button class="fav-to-cart" onclick="closeAllSheets();openSheet('sheet-cart')" style="background:var(--green)">Кошик</button>
      <button class="fav-rm" onclick="removeFromFavs('${esc(p.id)}',event)" aria-label="Видалити"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg></button>`;
  }
  toast(`✅ Розмір ${sz} — в кошику! <a onclick="closeAllSheets();openSheet('sheet-cart')">Переглянути →</a>`);
}

// ── CART ─────────────────────────────────────────── */
function renderCartSheet() {
  const el       = document.getElementById('cart-list');
  const sumBlock = document.getElementById('cart-summary-block');
  if (!el) return;
  const _trashSvg = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>`;
  if (!S.cart.length) {
    el.innerHTML = `<div class="sh-empty"><div class="sh-empty-ico"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div><p>${L.cartEmpty}</p></div>`;
    sumBlock?.classList.add('hidden');
    return;
  }
 const total = S.cart.reduce((s, p) => s + (Number(p.price) || 0) * (p.qty || 1), 0);
  el.innerHTML = S.cart.map(p => {
    const sid = esc(p.id);
    const ssz = String(p.size).replace(/'/g, "\\'");
    return `
    <div class="cart-item">
      ${p.image && p.image.startsWith('http')
        ? `<img class="cart-img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onload="this.classList.add('loaded')">`
        : `<div class="cart-img-ph" aria-hidden="true"></div>`}
      <div class="cart-body">
        <div class="cart-brand">${esc(p.brand)}</div>
        <div class="cart-name">${esc(p.name)}</div>
        ${p.isFreeShipping ? '<div class="cart-deal-tag">🚚 Безкоштовна доставка</div>' : ''}
        <div class="cart-size-tag">${L.sizeLabel || 'Розмір'} ${p.size}</div>
        <div class="cart-price">${(Number(p.price) || 0) * (p.qty || 1)}₴</div>
      </div>
      <div class="cart-item-controls">
        <div class="cart-qty-row">
          <button class="cart-qty-btn" onclick="decrementCartQty('${sid}','${ssz}')" aria-label="Зменшити">−</button>
          <span class="cart-qty-num">${p.qty || 1}</span>
          <button class="cart-qty-btn" onclick="incrementCartQty('${sid}','${ssz}')" aria-label="Збільшити">+</button>
        </div>
        <button class="cart-rm" onclick="removeFromCart('${sid}','${ssz}')" aria-label="Видалити">${_trashSvg}</button>
      </div>
    </div>`;
  }).join('');
  const totalQty = S.cart.reduce((s, p) => s + (p.qty || 1), 0);
  if (sumBlock) {
    sumBlock.innerHTML = `
      <div class="cart-summary">
        <div class="cart-sum-row"><span>${L.cartRowItems||'Товари'}</span><span>${totalQty} ${L.cartItems}</span></div>
        <div class="cart-sum-row"><span>${L.cartRowDelivery||'Доставка'}</span><span>${L.cartDelivery}</span></div>
        <div class="cart-sum-total"><span>${L.cartToPay}</span><span>${total} ₴</span></div>
      </div>
      <button class="cart-checkout-btn" onclick="openCheckout()">${L.cartCheckout}</button>`;
    sumBlock.classList.remove('hidden');
  }
}

function incrementCartQty(id, size) {
  const item = S.cart.find(c => c.id === id && String(c.size) === String(size));
  if (!item) return;
  item.qty = (item.qty || 1) + 1;
  saveCart();
  updateBadges();
  renderCartSheet();
}

function decrementCartQty(id, size) {
  const item = S.cart.find(c => c.id === id && String(c.size) === String(size));
  if (!item) return;
  if ((item.qty || 1) <= 1) { removeFromCart(id, size); return; }
  item.qty--;
  saveCart();
  updateBadges();
  renderCartSheet();
}

function removeFromCart(id, size) {
  S.cart = S.cart.filter(c => !(c.id === id && String(c.size) === String(size)));
  saveCart();
  updateBadges();
  renderCartSheet();
}

function _saveCustomerData(name, phone, city) {
  try { localStorage.setItem('wow_customer', JSON.stringify({ name, phone, city })); } catch(_) {}
}

function _prefillCheckout() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem('wow_customer') || 'null'); } catch(_) { return; }
  if (!saved) return;
  const nameEl  = document.getElementById('f-name');
  const phoneEl = document.getElementById('f-phone');
  const cityEl  = document.getElementById('f-city');
  if (nameEl  && !nameEl.value  && saved.name)  { nameEl.value  = saved.name;  validateField(nameEl,  'name');  }
  if (cityEl  && !cityEl.value  && saved.city)  { cityEl.value  = saved.city;  validateField(cityEl,  'city');  }
  if (phoneEl && !phoneEl.value && saved.phone) { phoneEl.value = saved.phone; formatPhone(phoneEl); }
}

function _renderCheckoutSummary() {
  const el = document.getElementById('checkout-items-summary');
  if (!el) return;
  el.innerHTML = S.cart.map(c => `
    <div class="co-item">
      ${c.image && c.image.startsWith('http')
        ? `<img class="co-img" src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" onload="this.classList.add('loaded')">`
        : `<div class="co-img-ph">👟</div>`}
      <div class="co-body">
        <div class="co-name">${esc(c.brand)} ${esc(c.name)}</div>
        <div class="co-meta">Розмір ${c.size}${(c.qty||1) > 1 ? ` · ${c.qty} пари` : ''} · ${(Number(c.price)||0) * (c.qty||1)}₴${c.isFreeShipping ? ' · <span style="color:var(--green);font-weight:700">🚚 Безкоштовна доставка</span>' : ''}</div>
      </div>
    </div>`).join('');
}

function openCheckout() {
  const total    = S.cart.reduce((s, p) => s + (Number(p.price) || 0) * (p.qty || 1), 0);
  const contents = S.cart.map(c => ({ content_id: c.id, content_name: `${c.brand} ${c.name}`, price: Number(c.price) || 0, quantity: c.qty || 1 }));
  if (window.fbq)  fbq('track', 'InitiateCheckout', { currency: 'UAH', value: total, contents, num_items: S.cart.length, content_type: 'product' });
  if (window.gtag) gtag('event', 'begin_checkout', { currency: 'UAH', value: total, items: S.cart.map(c => ({ item_id: c.id, item_name: `${c.brand} ${c.name}`, price: Number(c.price) || 0, quantity: c.qty || 1 })) });
  if (window.ttq)  try { ttq.track('InitiateCheckout', { currency: 'UAH', value: total, contents }); } catch(_) {}
  closeAllSheets();
  setTimeout(() => {
    const sh = document.getElementById('sheet-checkout');
    const ov = document.getElementById('overlay');
    sh?.classList.add('on');
    ov?.classList.add('on');
    _openSheetId = 'sheet-checkout';
    _renderCheckoutSummary();
    _prefillCheckout();
  }, 100);
}

// ── CHECKOUT FORM ────────────────────────────────── */
let _submitLock = false;

function setDelivTab(t) {
  S.delivType = t;
  document.getElementById('dtab-dept')?.classList.toggle('on', t === 'dept');
  document.getElementById('dtab-post')?.classList.toggle('on', t === 'post');
  const lbl = document.getElementById('depot-label');
  const inp = document.getElementById('f-depot');
  if (lbl) lbl.textContent = t === 'dept' ? L.formDept : L.formPost;
  if (inp) inp.placeholder = t === 'dept' ? L.deptPh : L.postPh;
}

function formatPhone(inp) {
  let v = inp.value.replace(/\D/g,'');
  if (v.startsWith('380')) v = v.slice(3);
  if (v.startsWith('0'))   v = v.slice(1);
  v = v.slice(0, 9);
  let fmt = '+380 ';
  if (v.length > 0) fmt += '(' + v.slice(0,2);
  if (v.length >= 2) fmt += ') ' + v.slice(2,5);
  if (v.length >= 5) fmt += '-' + v.slice(5,7);
  if (v.length >= 7) fmt += '-' + v.slice(7,9);
  inp.value = fmt;
  const digits = v.length;
  const valid  = digits >= 9;
  _setFieldState(inp, 'phone', valid, digits > 0);
}

function validateField(inp, type) {
  const v     = inp.value.trim();
  let valid;
  if (type === 'depot') valid = v.length >= 1;
  else if (type === 'name') valid = v.length >= 3 && /[а-яёіїєa-z]/i.test(v);
  else valid = v.length >= 2;
  _setFieldState(inp, type, valid, v.length > 0);
}

function _setFieldState(inp, type, valid, touched) {
  inp.classList.toggle('valid', valid);
  inp.classList.toggle('err',   !valid && touched);
  const ico = document.getElementById(`f-${type}-ico`);
  if (ico) ico.textContent = valid ? '✅' : (touched ? '❌' : '');
  const err = document.getElementById(`f-${type}-err`);
  if (err) err.classList.toggle('vis', !valid && touched);
}

function applyPromo() {
  const code     = document.getElementById('f-promo')?.value.trim().toUpperCase();
  if (!code) return;
  const discount = S.promoCodes[code];
  if (discount) {
    S.promoDiscount = discount;
    toast(`🎉 Промокод активовано! -${discount}%`);
  } else {
    toast('❌ Промокод не знайдено');
  }
}

async function submitOrder() {
  if (_submitLock) return;
  _submitLock = true;

  const name  = document.getElementById('f-name')?.value.trim()  || '';
  const phone = document.getElementById('f-phone')?.value.trim() || '';
  const city  = document.getElementById('f-city')?.value.trim()  || '';
  const depot = document.getElementById('f-depot')?.value.trim() || '';

  // Revalidate
  validateField(document.getElementById('f-name'),  'name');
  formatPhone(document.getElementById('f-phone'));
  validateField(document.getElementById('f-city'),  'city');
  validateField(document.getElementById('f-depot'), 'depot');

  const nameValid  = name.length >= 3 && /[а-яёіїєa-z]/i.test(name);
  const phoneValid = phone.replace(/\D/g,'').length >= 9;
  const cityValid  = city.length >= 2;
  const depotValid = depot.length >= 1;

  if (!nameValid) {
    toast('⚠️ Введіть коректне ім\'я (мінімум 3 символи)');
    document.getElementById('f-name')?.focus();
    _submitLock = false;
    return;
  }
  if (!phoneValid || !cityValid || !depotValid) {
    toast('⚠️ Заповніть всі поля коректно');
    _submitLock = false;
    return;
  }

  const btn = document.getElementById('checkout-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = L.submitting; }

  const itemsStr = S.cart.map(c => {
    const dealMark = c.isFreeShipping ? ' 🚚 (Безкоштовна доставка)' : '';
    return `${c.brand} ${c.name}${dealMark}, розмір ${c.size}${(c.qty||1)>1?` × ${c.qty}`:''} — ${(Number(c.price)||0)*(c.qty||1)}₴`;
  }).join('\n');
  const total = S.cart.reduce((s, p) => s + (Number(p.price) || 0) * (p.qty || 1), 0);
  const delivLabel = `${S.delivType === 'dept' ? 'Відділення' : 'Поштомат'} №${depot}`;

  const payload = {
    action:   'new_order',
    fio:      name,
    phone,
    city,
    delivery: `${city}, ${delivLabel}`,
    items:    itemsStr,
    total,
    promo:    document.getElementById('f-promo')?.value.trim() || '',
    cart:     S.cart.map(c => ({ id: c.id, brand: c.brand || '', name: c.name || '', price: Number(c.price) || 0, size: String(c.size), qty: c.qty || 1, supplier: c.supplier || 0 })),
    utm:      S.utm || null,
  };

  // Зберігаємо замовлення локально ДО відправки — страховка
  try { localStorage.setItem('wow_pending_order', JSON.stringify({ ...payload, ts: Date.now() })); } catch(_) {}

  const ok = await postData(payload);

  if (ok === false) {
    toast('⚠️ Немає з\'єднання. Перевірте мережу або напишіть нам у Telegram.');
    if (btn) { btn.disabled = false; btn.textContent = L.submitOrder; }
    _submitLock = false;
    return;
  }

  // ok === true (підтверджено GAS) або null (відправлено, відповідь непрозора)
  _saveCustomerData(name, phone, city);
  try { localStorage.removeItem('wow_pending_order'); } catch(_) {}

  // Analytics pixels
  const _cartItems = S.cart.map(c => ({ id: c.id, quantity: c.qty || 1, item_price: Number(c.price) || 0 }));
  if (window.fbq) fbq('track', 'Purchase', {
    currency: 'UAH', value: total,
    content_type: 'product',
    content_ids: S.cart.map(c => c.id),
    contents:    _cartItems,
    num_items:   S.cart.reduce((s, c) => s + (c.qty || 1), 0),
  });
  if (window.gtag) gtag('event', 'purchase', {
    currency: 'UAH', value: total,
    transaction_id: Date.now().toString(36),
    items: S.cart.map(c => ({ item_id: c.id, item_name: `${c.brand} ${c.name}`, price: Number(c.price) || 0, quantity: c.qty || 1 })),
  });
  if (window.ttq) {
    try {
      ttq.track('PlaceAnOrder', {
        currency: 'UAH', value: total,
        contents: S.cart.map(c => ({ content_id: c.id, content_name: `${c.brand} ${c.name}`, price: c.price, quantity: 1 })),
      });
    } catch(e) {}
  }

  // Show success
  const info = document.getElementById('success-order-info');
  if (info) {
    const tgFallback = ok === null
      ? `<div style="margin-top:10px;font-size:12px;color:var(--text-muted);line-height:1.6">
           Якщо не зв'яжемось протягом години —
           <a href="${CFG.TG_URL}" target="_blank" style="color:var(--blue);font-weight:700">напишіть нам у Telegram</a>
         </div>`
      : '';
    info.innerHTML = `<b>${esc(name)}</b> · ${esc(phone)}<br>
      ${esc(city)}, ${S.delivType === 'dept' ? 'відд.' : 'поштомат'} ${esc(depot)}<br>
      ${S.cart.map(c => `${esc(c.brand)} ${esc(c.name)} (${c.size})`).join(', ')}${tgFallback}`;
  }
  closeAllSheets();
  document.getElementById('view-success')?.classList.add('on');

  S.cart = [];
  saveCart();
  updateBadges();
  if (btn) { btn.disabled = false; btn.textContent = L.submitOrder; }
  _submitLock = false;
  // Примусово оновлюємо каталог — щоб наступний покупець бачив актуальні залишки
  S.catalog.loadedFromServer = false;
  bgRefreshCatalog();
}

function goHome() {
  document.getElementById('view-success')?.classList.remove('on');
  changeTab('home');
}

// ── SIZE MEMORY (localStorage) ────────────────────── */
function getRememberedSize() {
  try {
    return localStorage.getItem('wow_my_size') || null;
  } catch(e) { return null; }
}

function rememberSize(sz) {
  try {
    const s = String(sz).trim();
    if (s && s !== 'undefined' && s !== 'null') localStorage.setItem('wow_my_size', s);
  } catch(e) {}
}

// ── REVIEW SUBMIT ─────────────────────────────────── */
function setStarRating(n) {
  S.starRating = n;
  document.querySelectorAll('.star-pick').forEach((btn, i) => btn.classList.toggle('on', i < n));
}

function resetReviewForm() {
  S.starRating = 0;
  document.querySelectorAll('.star-pick').forEach(b => b.classList.remove('on'));
  const a = document.getElementById('rev-author-inp');
  const t = document.getElementById('rev-text-inp');
  if (a) a.value = ''; if (t) t.value = '';
}

async function submitReview() {
  const author = document.getElementById('rev-author-inp')?.value.trim() || '';
  const text   = document.getElementById('rev-text-inp')?.value.trim()   || '';
  const stars  = S.starRating || 5;
  if (!text) { toast('⚠️ Напишіть текст відгуку'); return; }
  const btn = document.querySelector('.rev-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Надсилаємо…'; }
  try {
    await postData({ action: 'review', author: author || 'Анонім', stars, text });
  } catch(e) {}
  S.reviews.unshift({ emoji: '😊', author: author || 'Анонім', stars, text, location: '' });
  renderReviews();
  closeAllSheets();
  resetReviewForm();
  if (btn) { btn.disabled = false; btn.textContent = L.sendReview; }
  toast(`⭐ Дякуємо за відгук! <a href="${CFG.TG_URL}" target="_blank" rel="noopener">Написати у Telegram →</a>`);
}