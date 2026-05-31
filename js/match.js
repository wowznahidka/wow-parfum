/* ============================================================
   WOW.ZNAHIDKA — MATCH / SWIPE ENGINE
   Tinder-style card stack with pointer + touch support.
   ============================================================ */

let _swipeLocked      = false;
let _swipeRenderTimer = null;
let _matchCombo       = 0;
let _comboTimer       = null;

async function initMatch() {
  clearTimeout(_swipeRenderTimer);
  _swipeRenderTimer = null;
  _swipeLocked = false;

  const data = await fetchCatalog();
  if (!data || !data.length) return;

  const _pool = [...data];
  for (let i = _pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [_pool[i], _pool[j]] = [_pool[j], _pool[i]];
  }
  S.matchPool  = _pool;
  S.matchIdx   = 0;
  _matchCombo  = 0;
  clearTimeout(_comboTimer);
  _updateComboUI();
  renderMatchCard();
}

function renderMatchCard() {
  const stage   = document.getElementById('card-stage');
  const counter = document.getElementById('match-counter');
  if (!stage) return;

  if (S.matchIdx >= S.matchPool.length) {
    _renderMatchDone(stage, counter);
    return;
  }

  const p     = S.matchPool[S.matchIdx];
  const faved = isFav(p.id);
  counter.textContent = `${S.matchIdx + 1} / ${S.matchPool.length}`;

  const card = document.createElement('div');
  card.className = 'm-card' + (faved ? ' is-fav' : '');
  card.id = 'current-match-card';
  card.innerHTML = `
    <div class="m-card-media">
      ${p.image && p.image.startsWith('http')
        ? `<img class="m-card-img" src="${esc(p.image)}" alt="${esc(p.brand)} ${esc(p.name)}"
             loading="lazy" onload="this.classList.add('loaded')">`
        : `<div class="m-card-img-ph" aria-hidden="true">🌸</div>`}
      ${faved ? `<div class="m-card-fav-badge" aria-hidden="true">❤️</div>` : ''}
      <div class="swipe-label like" id="sw-like">${L.matchLike}</div>
      <div class="swipe-label nope" id="sw-nope">${L.matchNope}</div>
    </div>
    <div class="m-card-body">
      <div class="m-card-brand">${esc(p.brand)}</div>
      <div class="m-card-name">${esc(p.name)}</div>
      <div class="m-card-price">${p.price}₴</div>
      <div class="m-card-sizes">${L.sizesIn}${p.sizes.map(String).join(', ') || '?'}</div>
    </div>
  `;

  stage.innerHTML = '';
  stage.appendChild(card);
  attachSwipeListeners(card, p);
}

function _renderMatchDone(stage, counter) {
  const favCount  = S.favs.length;
  const cartCount = S.cart.length;
  counter.textContent = `${S.matchPool.length} / ${S.matchPool.length}`;
  stage.innerHTML = `<div class="match-empty">
    <div class="match-empty-ico" style="animation:bounceY .9s ease-in-out infinite alternate">🏆</div>
    <h3 style="font-size:22px;font-weight:900;margin-top:4px">Ти переглянув усе!</h3>
    <p style="font-size:14px;color:var(--text-dim);line-height:1.6;max-width:260px;text-align:center">
      ${S.matchPool.length} пар переглянуто.<br>
      ${favCount > 0 ? `<strong style="color:var(--text)">${favCount} пари</strong> чекають у Улюблених.` : 'Лайкни пари, які сподобались — ми підберемо розмір.'}
    </p>
    ${favCount > 0 ? `
    <button class="match-restart-btn"
      style="background:var(--red);box-shadow:var(--shadow-red);margin-top:4px"
      onclick="openSheet('sheet-fav')">
      ❤️ Улюблені · ${favCount} пари
    </button>` : ''}
    ${cartCount > 0 ? `
    <button class="match-restart-btn"
      style="background:var(--text);color:var(--accent-inv);margin-top:${favCount ? '8px' : '4px'}"
      onclick="openSheet('sheet-cart')">
      🛒 Кошик · ${cartCount} пари
    </button>` : ''}
    <button class="match-go-favs-btn" style="margin-top:${favCount || cartCount ? '8px' : '4px'}"
      onclick="initMatch()">
      🔄 Почати знову
    </button>
  </div>`;
}

// ── SWIPE LISTENER ───────────────────────────────── */
function attachSwipeListeners(card, product) {
  cleanupSwipe();
  let startX = 0, deltaX = 0, startTime = 0, dragging = false;
  const DIST_THRESHOLD = 80;
  const FLING_DIST     = 36;
  const FLING_VEL      = 0.42;

  const onDown = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging  = true;
    startTime = Date.now();
    startX    = e.clientX;
    deltaX    = 0;
    card.style.transition = 'none';
    card.setPointerCapture?.(e.pointerId);
  };

  _moveHandler = e => {
    if (!dragging) return;
    deltaX = e.clientX - startX;
    const rot = deltaX / 14;
    card.style.transform = `translateX(${deltaX}px) rotate(${rot}deg)`;
    const likeEl = document.getElementById('sw-like');
    const nopeEl = document.getElementById('sw-nope');
    const lr = Math.min(1, Math.max(0, (deltaX  - 16) / 72));
    const nr = Math.min(1, Math.max(0, (-deltaX - 16) / 72));
    if (likeEl) likeEl.style.opacity = lr;
    if (nopeEl) nopeEl.style.opacity = nr;
    if (likeEl) likeEl.classList.toggle('visible', lr > 0.12);
    if (nopeEl) nopeEl.classList.toggle('visible', nr > 0.12);
  };

  _upHandler = e => {
    if (!dragging) return;
    dragging = false;
    const elapsed  = Date.now() - startTime;
    const velocity = elapsed > 0 ? Math.abs(deltaX) / elapsed : 0;
    const isFling  = velocity >= FLING_VEL && Math.abs(deltaX) >= FLING_DIST;
    if (isFling || Math.abs(deltaX) > DIST_THRESHOLD) {
      swipeCard(deltaX > 0 ? 'right' : 'left');
    } else {
      card.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
      card.style.transform  = 'translateX(0) rotate(0deg)';
      const likeEl = document.getElementById('sw-like');
      const nopeEl = document.getElementById('sw-nope');
      if (likeEl) { likeEl.style.opacity = '0'; likeEl.classList.remove('visible'); }
      if (nopeEl) { nopeEl.style.opacity = '0'; nopeEl.classList.remove('visible'); }
    }
    deltaX = 0;
  };

  // Pointer Events API handles both mouse and touch — no duplicate touch handlers needed
  card.addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('pointermove', _moveHandler, { passive: true });
  document.addEventListener('pointerup', _upHandler);
  document.addEventListener('pointercancel', _upHandler);
}

// ── SWIPE ACTION ─────────────────────────────────── */
function swipeCard(dir) {
  if (_swipeLocked) return;
  _swipeLocked = true;

  const card = document.getElementById('current-match-card');
  const p    = S.matchPool[S.matchIdx];
  if (!card || !p) { _swipeLocked = false; return; }

  card.style.pointerEvents = 'none';
  cleanupSwipe();

  const flyX  = (dir === 'right' ? 1 : -1) * (window.innerWidth * 1.3);
  card.style.transition = 'transform .38s cubic-bezier(.4,0,1,1), opacity .28s ease';
  card.style.transform  = `translateX(${flyX}px) rotate(${dir === 'right' ? 24 : -24}deg)`;
  card.style.opacity    = '0';

  if (dir === 'right') {
    addToFavs(p);
    _haptic(30);
    tryShowPWAAfterLike();
    _matchCombo++;
    clearTimeout(_comboTimer);
    _comboTimer = setTimeout(() => { _matchCombo = 0; _updateComboUI(); }, 3500);
    _spawnHearts(card);
    _updateComboUI();
    if (_matchCombo === 3)       toast('🔥 Три поспіль! Смак є!');
    else if (_matchCombo === 5)  toast('🔥🔥 Комбо ×5! Майстер!');
    else if (_matchCombo === 10) toast('💎 ×10 — ЛЕГЕНДА!');
    else if (_matchCombo > 10 && _matchCombo % 5 === 0) toast(`💎 ×${_matchCombo} — UNSTOPPABLE!`);
    else toast(`❤️ Додано! <a onclick="openSheet('sheet-fav')">Переглянути →</a>`);
  }

  S.matchIdx++;
  clearTimeout(_swipeRenderTimer);
  _swipeRenderTimer = setTimeout(() => {
    _swipeLocked      = false;
    _swipeRenderTimer = null;
    renderMatchCard();
  }, 310);
}

// ── COMBO UI ─────────────────────────────────────── */
function _updateComboUI() {
  const el = document.getElementById('match-combo');
  if (!el) return;
  if (_matchCombo >= 2) {
    el.textContent = `🔥 ×${_matchCombo}`;
    el.style.display = 'flex';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'comboPop .35s cubic-bezier(.34,1.56,.64,1)';
  } else {
    el.style.display = 'none';
  }
}

// ── HEART PARTICLES ──────────────────────────────── */
function _spawnHearts(card) {
  const rect = card.getBoundingClientRect();
  const cx   = rect.left + rect.width  * 0.5;
  const cy   = rect.top  + rect.height * 0.35;
  const pool = ['❤️','🔥','✨','💎','🩷','⭐'];
  for (let i = 0; i < 9; i++) {
    const el = document.createElement('div');
    el.textContent = pool[i % pool.length];
    const dx = (Math.random() - 0.5) * 240;
    const dy = -(70 + Math.random() * 140);
    el.style.cssText = `
      position:fixed;left:${cx}px;top:${cy}px;
      font-size:${16 + Math.random() * 16}px;
      pointer-events:none;z-index:9999;
      --dx:${dx}px;--dy:${dy}px;
      animation:heartFly ${0.5 + Math.random() * 0.5}s ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}
