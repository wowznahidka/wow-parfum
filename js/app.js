/* ============================================================
   WOW.ZNAHIDKA — BOOTSTRAP
   DOMContentLoaded init, migrations, deep links.
   ============================================================ */

window.addEventListener('DOMContentLoaded', () => {

  // ── MIGRATIONS ───────────────────────────────── */
  // Rename wow_liked → wow_favs (old key)
  const oldLiked = localStorage.getItem('wow_liked');
  if (oldLiked && !localStorage.getItem('wow_favs')) {
    localStorage.setItem('wow_favs', oldLiked);
  }
  localStorage.removeItem('wow_liked');
  // Remove stale v1/v2 cache entries
  localStorage.removeItem('wow_catalog_v1');
  localStorage.removeItem('wow_catalog_v2');
  // Clear old deals cache so stable-sort fix applies immediately
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('wow_deals_')) localStorage.removeItem(k);
    });
  } catch(_) {}

  // ── ANALYTICS ────────────────────────────────── */
  _injectGA();
  _injectPixel();
  _injectTTPixel();

  try { REF.captureIncoming(); REF.initBlock(); } catch(_) {}

  // ── UTM ATTRIBUTION ──────────────────────────── */
  (function() {
    const p = new URLSearchParams(location.search);
    const src = p.get('utm_source') || '', camp = p.get('utm_campaign') || '',
          vid = p.get('utm_video')  || '', med  = p.get('utm_medium')   || '';
    if (src || camp || vid) {
      S.utm = { source: src, campaign: camp, video: vid, medium: med };
      _saveUtm(S.utm);
    }
  })();

  // ── PWA SETUP ────────────────────────────────── */
  registerSW();

  // ── LANGUAGE ─────────────────────────────────── */
  applyLang();

  // ── GENDER FROM URL PARAM (?g=m|f|mix) ──────── */
  const _gParam = new URLSearchParams(location.search).get('g');
  if      (_gParam === 'm')   setGender('male',   true);
  else if (_gParam === 'f')   setGender('female', true);
  else if (_gParam === 'mix') setGender('mixed',  true);
  else                        setGender(S.gender, true);

  // ── INIT ─────────────────────────────────────── */
  updateBadges();
  fetchCatalog().then(() => {
    renderHome();
    checkDeepLink();
    updateCartBar();
  });
  initPWA();
  initKeyboardHandler();

  // ── SCROLL REVEAL ────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const _ro = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('s-in'); _ro.unobserve(e.target); } });
    }, { threshold: 0.08 });
    const _observe = () => document.querySelectorAll('.product-card:not(.s-in)').forEach(el => _ro.observe(el));
    document.addEventListener('scroll', _observe, { passive: true, once: true });
    setTimeout(_observe, 600);
  }

  // ── IDLE NUDGE ───────────────────────────────── */
  ['touchstart','mousemove','scroll','click','keydown'].forEach(ev =>
    document.addEventListener(ev, resetIdleTimer, { passive: true })
  );
  resetIdleTimer();

  // ── KEYBOARD ACCESSIBILITY ────────────────────── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllSheets();
  });

  // GA4 page_view fires automatically via gtag('config') in _injectGA()
});
