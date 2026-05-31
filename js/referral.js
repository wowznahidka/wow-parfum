const REF = (() => {
  const KEY_REF  = 'wow_ref';
  const KEY_SEEN = 'wow_ref_seen';

  function captureIncoming() {
    try {
      const p = new URLSearchParams(location.search);
      const ref = p.get('ref') || p.get('utm_source');
      if (ref) localStorage.setItem(KEY_REF, ref);
    } catch(_) {}
  }

  function getReferrerLabel() {
    try { return localStorage.getItem(KEY_REF) || null; } catch(_) { return null; }
  }

  function initBlock() {
    try {
      const ref = getReferrerLabel();
      if (!ref || localStorage.getItem(KEY_SEEN)) return;
      localStorage.setItem(KEY_SEEN, '1');
    } catch(_) {}
  }

  return { captureIncoming, getReferrerLabel, initBlock };
})();
