/* ============================================================
   WOW ECOSYSTEM — REFERRAL SYSTEM v4.0
   - One field: Telegram @username for contact
   - Share link works for ANY product purchase on the site
   - Share to Instagram / TikTok / Facebook / WhatsApp / Telegram
   - Clean link for bio (шапка профілю)
   ============================================================ */

const REF = {
  _MY_KEY:   'wow_myref',
  _MY_TG:    'wow_myref_tg',
  _FROM_KEY: 'wow_ref_from',
  _FROM_TG:  'wow_ref_from_tg',

  // ── My code ──────────────────────────────────── */
  getMyCode() {
    let code = localStorage.getItem(this._MY_KEY);
    if (!code) {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem(this._MY_KEY, code);
    }
    return code;
  },

  // ── My Telegram handle ────────────────────────── */
  getMyTg()         { return localStorage.getItem(this._MY_TG) || ''; },
  isRegistered()    { return !!this.getMyTg(); },

  saveTg(handle) {
    const clean = handle.trim().replace(/^@+/, '');
    if (!clean) return false;
    localStorage.setItem(this._MY_TG, '@' + clean);
    // Notify GAS/admin about new referral partner
    if (typeof postData === 'function') {
      postData({ action: 'new_partner', tg: '@' + clean, ref: this.getMyCode() }).catch(() => {});
    }
    return true;
  },

  // ── My share link ─────────────────────────────── */
  // Works for ANY product — ref is stored on the buyer's device on click
  getMyLink() {
    const url = new URL(location.href);
    url.search = '';
    url.hash   = '';
    url.searchParams.set('ref', this.getMyCode());
    const tg = this.getMyTg();
    if (tg) url.searchParams.set('rt', tg.replace('@', ''));
    return url.toString();
  },

  // ── Capture incoming ref on page load ────────── */
  captureIncoming() {
    const p   = new URLSearchParams(location.search);
    const ref = p.get('ref');
    const tg  = p.get('rt') || ''; // optional: referrer tg handle in URL
    if (ref) {
      const mine = localStorage.getItem(this._MY_KEY);
      if (!mine || ref !== mine) {
        localStorage.setItem(this._FROM_KEY, ref);
        if (tg) localStorage.setItem(this._FROM_TG, '@' + tg.replace('@', ''));
      }
    }
  },

  getReferrer()      { return localStorage.getItem(this._FROM_KEY) || ''; },
  getReferrerLabel() {
    const code = this.getReferrer();
    if (!code) return '';
    const tg = localStorage.getItem(this._FROM_TG) || '';
    return tg ? `${tg} (${code})` : code;
  },

  // ── Init sheet ────────────────────────────────── */
  initSheet() {
    const inp = document.getElementById('ref-link-input');
    if (inp) inp.value = this.getMyLink();

    const tgInp = document.getElementById('ref-tg-inp');
    const tgRow = document.getElementById('ref-tg-row');
    const saved = this.getMyTg();
    if (saved && tgInp)  tgInp.value = saved;
    if (tgRow) tgRow.style.display = '';
  },

  // ── Copy link ─────────────────────────────────── */
  async copy() {
    const link = this.getMyLink();
    try {
      await navigator.clipboard.writeText(link);
    } catch (_) {
      const el = document.createElement('textarea');
      el.value = link;
      el.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(el);
      el.focus(); el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  },
};

// ── Open sheet ────────────────────────────────────── */
function openRefSheet() {
  REF.initSheet();
  if (typeof postData === 'function') {
    postData({
      action:   'ref_sheet_opened',
      ref_code: REF.getMyCode(),
      tg:       REF.getMyTg() || '',
    }).catch(() => {});
  }
  if (typeof openSheet === 'function') openSheet('sheet-ref');
}

// ── Save Telegram handle ──────────────────────────── */
function handleRefSaveTg() {
  const inp = document.getElementById('ref-tg-inp');
  const val = inp?.value.trim() || '';
  if (!val || val.replace('@','').length < 2) {
    if (typeof toast === 'function') toast('⚠️ Введіть нік у Telegram, наприклад @ivan');
    inp?.focus(); return;
  }
  const ok = REF.saveTg(val);
  if (ok && typeof toast === 'function') toast('✅ Збережено! Тепер поділіться посиланням.');
}

// ── Copy ─────────────────────────────────────────── */
async function handleRefCopy() {
  await REF.copy();
  const btn = document.getElementById('ref-copy-btn');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '✓';
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2000);
  }
  if (typeof toast === 'function') toast('📋 Посилання скопійовано! Вставте в шапку профілю.');
}

// ── Share to specific platform ────────────────────── */
function handleRefShareTo(platform) {
  const link = REF.getMyLink();
  const text = encodeURIComponent('Глянь — тут є круті речі 🔥 ' + link);
  const urls = {
    facebook:  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    telegram:  `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Глянь — тут є круті речі 🔥')}`,
  };
  if (urls[platform]) {
    try { window.open(urls[platform], '_blank', 'noopener'); }
    catch(_) { location.href = urls[platform]; }
  }
}

// ── Native share (Instagram, TikTok, інші) ────────── */
function handleRefShare() {
  const link = REF.getMyLink();
  if (navigator.share) {
    navigator.share({
      title: document.title,
      text:  'Глянь — тут є круті речі 🔥',
      url:   link,
    }).catch(() => handleRefCopy());
  } else {
    handleRefCopy();
  }
}
