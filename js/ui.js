/* ============================================================
   WOW.ZNAHIDKA — UI PRIMITIVES
   Toast · Badges · Tabs · Gender · Splash · FAQ · Idle nudge
   ============================================================ */

// ── HAPTIC ────────────────────────────────────────── */
let _lastHapticTime = 0;
function _haptic(pattern) {
  if (!navigator.vibrate) return;
  const now = Date.now();
  if (now - _lastHapticTime < 100) return;
  _lastHapticTime = now;
  navigator.vibrate(pattern);
}

// ── TOAST ─────────────────────────────────────────── */
const _TOAST_MAX = 3;
let _lastToastMsg  = '';
let _lastToastTime = 0;

function toast(msg, _type = '') {
  const now   = Date.now();
  const plain = msg.replace(/<[^>]+>/g, '').slice(0, 80);
  if (plain === _lastToastMsg && now - _lastToastTime < 900) return;
  _lastToastMsg  = plain;
  _lastToastTime = now;
  const container = document.getElementById('toasts');
  if (!container) return;
  while (container.children.length >= _TOAST_MAX) {
    container.lastChild?.remove();
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = msg;
  container.prepend(el);
  setTimeout(() => el.remove(), 3200);
}

// ── BADGES ────────────────────────────────────────── */
function updateBadges() {
  const fb = document.getElementById('fav-badge');
  const cb = document.getElementById('cart-badge');
  const totalQty = S.cart.reduce((s, p) => s + (p.qty || 1), 0);
  if (fb) { fb.textContent = S.favs.length; fb.classList.toggle('hidden', S.favs.length === 0); }
  if (cb) { cb.textContent = totalQty; cb.classList.toggle('hidden', totalQty === 0); }
  updateCartBar();
}

function updateCartBar() {
  const bar = document.getElementById('cart-sticky-bar');
  if (!bar) return;
  const totalQty = S.cart.reduce((s, p) => s + (p.qty || 1), 0);
  const total    = S.cart.reduce((s, p) => s + (Number(p.price) || 0) * (p.qty || 1), 0);
  bar.classList.toggle('vis', totalQty > 0);
  if (!totalQty) return;
  const cEl = document.getElementById('csb-count');
  const lEl = document.getElementById('csb-label');
  const tEl = document.getElementById('csb-total');
  if (cEl) cEl.textContent = totalQty;
  if (lEl) lEl.textContent = L.csbLabel || 'пар у кошику';
  if (tEl) tEl.textContent = total + '₴';
}

// ── FAQ RENDER ────────────────────────────────────── */
function renderFaq() {
  const el = document.getElementById('faq-list');
  if (!el || !L.faqItems) return;
  const titleText = (L.faqTitle || 'Часті запитання').replace(/^❓\s*/, '');
  el.innerHTML = `<div class="faq-block">
    <div class="faq-block-hdr">
      <span class="faq-block-ico">❓</span>
      <span class="faq-block-ttl">${esc(titleText)}</span>
    </div>
    ${L.faqItems.map(item => `
    <div class="faq-item" onclick="toggleFaq(this)">
      <div class="faq-q">${esc(item.q)}<span class="faq-toggle" aria-hidden="true">+</span></div>
      <div class="faq-a">${esc(item.a)}</div>
    </div>`).join('')}
  </div>`;
}

function updateTimestamp() {
  const el = document.getElementById('update-ts');
  if (!el || !S.lastFetchTime) return;
  const h = S.lastFetchTime.getHours().toString().padStart(2,'0');
  const m = S.lastFetchTime.getMinutes().toString().padStart(2,'0');
  el.textContent = `${L.updated} ${h}:${m}`;
}

// ── TABS ──────────────────────────────────────────── */
function changeTab(tab) {
  if (tab !== 'match') cleanupSwipe();
  S.activeTab = tab;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + tab)?.classList.add('active');
  document.querySelector(`.nav-item[data-tab="${tab}"]`)?.classList.add('active');
  document.querySelectorAll('.dsk-nav-btn').forEach(b => b.classList.remove('active'));
  const tabMap = { home:'dsk-btn-home', catalog:'dsk-btn-catalog', match:'dsk-btn-match', contacts:'dsk-btn-contacts' };
  document.getElementById(tabMap[tab])?.classList.add('active');
  document.getElementById('pages').scrollTop = 0;
  window.scrollTo(0, 0);
  if (tab === 'home')    renderHome();
  if (tab === 'match')   initMatch();
  if (tab === 'catalog') renderCatalog();
}

function refreshCurrentTab() {
  const t = S.activeTab;
  if (t === 'home')    renderHome();
  if (t === 'match')   initMatch();
  if (t === 'catalog') { S.catBrand = null; renderCatalog(); }
}

// ── GENDER ────────────────────────────────────────── */
function setGender(g, skipFade) {
  S.gender = g;
  localStorage.setItem('wow_gender', g);
  _scrollNudgeFired = false;
  document.querySelectorAll('.g-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.gender === g);
    b.setAttribute('aria-pressed', b.dataset.gender === g ? 'true' : 'false');
  });
  // Drive the CSS segmented-control slider via data attribute
  const toggle = document.getElementById('gender-toggle');
  if (toggle) toggle.dataset.active = g;
  if (!skipFade) {
    const pages = document.getElementById('pages');
    pages.style.opacity = '0';
    setTimeout(() => {
      pages.style.transition = 'opacity .22s ease';
      pages.style.opacity = '1';
      refreshCurrentTab();
    }, 180);
  }
}

// ── SHEETS ────────────────────────────────────────── */
let _openSheetId = null;

function openSheet(id) {
  closeAllSheets();
  const sh = document.getElementById(id);
  const ov = document.getElementById('overlay');
  if (!sh) return;
  sh.classList.add('on');
  ov.classList.add('on');
  _openSheetId = id;
  if (id === 'sheet-fav')    renderFavSheet();
  if (id === 'sheet-cart')   renderCartSheet();
  if (id === 'sheet-review') resetReviewForm();
}

function closeAllSheets() {
  document.querySelectorAll('.sheet').forEach(s => s.classList.remove('on'));
  document.getElementById('overlay')?.classList.remove('on');
  _openSheetId = null;
  updateCartBar();
}

// ── FAQ ───────────────────────────────────────────── */
function toggleFaq(el) {
  el.classList.toggle('open');
  const tog = el.querySelector('.faq-toggle');
  if (tog) tog.textContent = el.classList.contains('open') ? '−' : '+';
}

// ── IDLE NUDGE ────────────────────────────────────── */
let _idleTimer     = null;
let _idleNudgeDone = false;

function resetIdleTimer() {
  clearTimeout(_idleTimer);
  if (_idleNudgeDone) return;
  _idleTimer = setTimeout(_fireIdleNudge, 9000);
}

function _fireIdleNudge() {
  if (_idleNudgeDone || S.activeTab !== 'home') return;
  _idleNudgeDone = true;
  const icon = document.querySelector('.nav-item[data-tab="match"] .nav-icon');
  if (icon) {
    icon.style.display = 'inline-block';
    icon.style.animation = 'nudgePulse .55s cubic-bezier(.34,1.56,.64,1) 3';
    setTimeout(() => { icon.style.animation = ''; }, 2200);
  }
}

// ── PWA ───────────────────────────────────────────── */
let deferredPrompt = null;

function initPWA() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    if (!localStorage.getItem('wow_pwa_android')) setTimeout(_showAndroidBanner, 45000);
  });
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') localStorage.setItem('wow_pwa_android','1');
      deferredPrompt = null;
    }
    dismissPwa('android');
  });
  const isIOS        = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true;
  if (isIOS && !isStandalone && !localStorage.getItem('wow_pwa_ios')) {
    setTimeout(_showIOSBanner, 35000);
  }
}

function _showAndroidBanner() {
  if (!localStorage.getItem('wow_pwa_android')) document.getElementById('pwa-android')?.classList.add('on');
}
function _showIOSBanner() {
  if (!localStorage.getItem('wow_pwa_ios')) document.getElementById('pwa-ios')?.classList.add('on');
}
function dismissPwa(type) {
  document.getElementById('pwa-' + type)?.classList.remove('on');
  localStorage.setItem('wow_pwa_' + type, '1');
}
function tryShowPWAAfterLike() {
  if (deferredPrompt && !localStorage.getItem('wow_pwa_android')) _showAndroidBanner();
}

// ── SERVICE WORKER ────────────────────────────────── */
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ── SWIPE CLEANUP (used by tabs) ─────────────────── */
let _moveHandler = null;
let _upHandler   = null;
function cleanupSwipe() {
  if (_moveHandler) document.removeEventListener('pointermove',  _moveHandler);
  if (_upHandler)   {
    document.removeEventListener('pointerup',     _upHandler);
    document.removeEventListener('pointercancel', _upHandler);
  }
  _moveHandler = null; _upHandler = null;
}

// ── IN-APP BROWSER LINK HANDLER ──────────────────── */
function _isInApp() {
  const ua = navigator.userAgent || '';
  return /Instagram|FBAN|FBAV|Facebook|TikTok|BytedanceWebview|Snapchat|Line\/|LinkedInApp|Twitter/.test(ua);
}

function openLink(url) {
  if (_isInApp()) {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => _copyFallback(url));
      } else { _copyFallback(url); }
    } catch(e) { _copyFallback(url); }
    toast('🔗 Посилання скопійовано! Вставте у Chrome або Safari');
    return false;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return false;
}

// Telegram links must open even inside Instagram/TikTok in-app browsers.
// window.location.href redirects the system URL handler → opens Telegram app.
function openTgLink(url) {
  window.location.href = url;
  return false;
}

function _copyFallback(text) {
  const ta = Object.assign(document.createElement('textarea'), { value: text });
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;pointer-events:none';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

// ── iOS KEYBOARD HANDLER ─────────────────────────── */
// On iOS Safari visualViewport shrinks when keyboard appears, but position:fixed
// sheets stay full-height — the focused input ends up behind the keyboard.
// Fix: pad the sheet by the keyboard height and scroll the input into view.
function initKeyboardHandler() {
  if (!window.visualViewport) return;

  let _active = null; // { input, sheet }
  let _timer  = null;

  function _adjust() {
    if (!_active) return;
    const kbH = window.innerHeight - window.visualViewport.height;
    if (kbH > 80) {
      _active.sheet.style.paddingBottom = (kbH + 24) + 'px';
      requestAnimationFrame(() => {
        if (_active) _active.input.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    } else {
      _active.sheet.style.paddingBottom = '';
    }
  }

  function _onResize() {
    clearTimeout(_timer);
    _timer = setTimeout(_adjust, 50);
  }

  document.addEventListener('focusin', e => {
    const el = e.target;
    if (!el.matches('input, textarea')) return;
    const sheet = el.closest('.sheet');
    if (!sheet) return;
    // Sheet changed — restore previous sheet's padding
    if (_active && _active.sheet !== sheet) _active.sheet.style.paddingBottom = '';
    _active = { input: el, sheet };
    window.visualViewport.addEventListener('resize', _onResize);
    _onResize();
  }, true);

  document.addEventListener('focusout', () => {
    // Delay to let focusin on the next field fire first (field-to-field navigation)
    setTimeout(() => {
      const focused = document.activeElement;
      if (focused && focused.matches('input, textarea') && focused.closest('.sheet')) return;
      window.visualViewport.removeEventListener('resize', _onResize);
      if (_active) { _active.sheet.style.paddingBottom = ''; _active = null; }
    }, 100);
  });
}
