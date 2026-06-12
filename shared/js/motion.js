/* ============================================================
   WOW — SHARED MOTION & PWA UTILITIES
   Scroll-reveal · Reduced motion · PWA install prompt
   Used across all WOW shops via shared/js/motion.js
   ============================================================ */

(function () {
  'use strict';

  // ── REDUCED MOTION ────────────────────────────────── //
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduce-motion');
  }

  // ── SCROLL REVEAL ────────────────────────────────── //
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('s-in');
        ro.unobserve(e.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    const targets = [
      '.h-scroll',
      '.brands-grid',
      '#daily-deals-section',
      '.add-review-btn',
      '.cod-banner',
      '[data-reveal]',
    ];
    document.querySelectorAll(targets.join(',')).forEach(el => {
      if (!el.classList.contains('s-in')) ro.observe(el);
    });
  }

  // ── PWA INSTALL PROMPT ────────────────────────────── //
  let _installPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _installPrompt = e;
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.hidden = false;
  });

  window._triggerPwaInstall = function () {
    if (!_installPrompt) return;
    _installPrompt.prompt();
    _installPrompt.userChoice.then(() => {
      _installPrompt = null;
      const btn = document.getElementById('pwa-install-btn');
      if (btn) btn.hidden = true;
    });
  };

  window.addEventListener('appinstalled', () => {
    _installPrompt = null;
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.hidden = true;
  });

  // ── SW UPDATE NOTIFICATION ────────────────────────── //
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (document.visibilityState === 'hidden') window.location.reload();
    });
  }

  // ── INIT ─────────────────────────────────────────── //
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }

  window._WowMotion = { refresh: initReveal };
}());
