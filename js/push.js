/* ============================================================
   WOW.PARFUM — PWA Push Notifications
   ============================================================ */

const PUSH_GAS_URL = (typeof CFG !== 'undefined' && CFG.GAS_URL) ? CFG.GAS_URL : '';

// Отримуємо VAPID public key з admin сервера або fallback-хардкод
// Заміни цей ключ після генерації: /api/push/vapid-keygen в адмінці → /api/push/vapid-public
const PUSH_VAPID_PUBLIC = (typeof CFG !== 'undefined' && CFG.VAPID_PUBLIC_KEY)
  ? CFG.VAPID_PUBLIC_KEY
  : 'BEl62iUYgUivxIkv69yViEuiBIa40Hi9aBqpAMmxDh7mHMOQfnXvjcRHRRuCnpakRZPYHdWNDxMIc6hL3IxBOE';

function _urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function _getSwRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.ready; } catch { return null; }
}

async function isPushSubscribed() {
  const reg = await _getSwRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

async function askPushPermission() {
  if (!('Notification' in window) || !('PushManager' in window)) {
    toast('Ваш браузер не підтримує push');
    return;
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    toast('Сповіщення вимкнено в налаштуваннях браузера');
    return;
  }

  try {
    const reg = await _getSwRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: _urlBase64ToUint8Array(PUSH_VAPID_PUBLIC),
    });
    await _savePushSubscription(sub);
    dismissPushBanner();
    toast('🔔 Підписка активована — будеш першим про знижки!');
    const dsf = document.getElementById('dsf-push-btn');
    if (dsf) { dsf.textContent = '✅ Підписано'; dsf.disabled = true; }
  } catch (e) {
    toast('Не вдалось підписатись: ' + e.message);
  }
}

async function _savePushSubscription(sub) {
  const payload = sub.toJSON();
  if (!PUSH_GAS_URL) return;
  try {
    await fetch(PUSH_GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addPushSubscription', subscription: payload }),
    });
  } catch {}
}

function dismissPushBanner() {
  const el = document.getElementById('push-banner');
  if (el) el.classList.remove('visible');
  try { localStorage.setItem('wow_push_dismissed', '1'); } catch {}
}

async function _initPushBanner() {
  if (!('Notification' in window) || !('PushManager' in window)) return;
  if (Notification.permission === 'granted') return;
  if (Notification.permission === 'denied')  return;
  try { if (localStorage.getItem('wow_push_dismissed')) return; } catch {}

  setTimeout(() => {
    const el = document.getElementById('push-banner');
    if (el) el.classList.add('visible');
  }, 8000);
}

async function _syncDesktopNavActive(tab) {
  document.querySelectorAll('.dsk-nav-btn').forEach(b => b.classList.remove('active'));
  const map = { home:'dsk-btn-home', catalog:'dsk-btn-catalog', match:'dsk-btn-match', contacts:'dsk-btn-contacts' };
  const el = document.getElementById(map[tab]);
  if (el) el.classList.add('active');
}

function dsfFamily(family) {
  document.querySelectorAll('#desktop-filter-sidebar .dsf-section:nth-child(1) .dsf-chip')
    .forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${family}'`)));
  const chip = document.querySelector(`.niche-fam-chip[data-family="${family}"]`);
  if (chip) chip.click();
}

function dsfGender(gender) {
  document.querySelectorAll('#desktop-filter-sidebar .dsf-section:nth-child(2) .dsf-chip')
    .forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${gender}'`)));
  if (typeof setGender === 'function') setGender(gender === 'mixed' ? null : gender, false);
}

function dsfVol(vol) {
  document.querySelectorAll('#desktop-filter-sidebar .dsf-section:nth-child(3) .dsf-chip')
    .forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${vol}'`)));
  const chip = [...document.querySelectorAll('.size-chip')].find(c => c.dataset.size === vol || (vol === 'all' && c.dataset.size === ''));
  if (chip) chip.click();
}

document.addEventListener('DOMContentLoaded', () => {
  _initPushBanner();

  const dsf = document.getElementById('desktop-filter-sidebar');
  if (window.innerWidth >= 1024 && dsf) dsf.style.display = 'block';

  window.addEventListener('resize', () => {
    if (dsf) dsf.style.display = window.innerWidth >= 1024 ? 'block' : 'none';
  });

  isPushSubscribed().then(subbed => {
    const btn = document.getElementById('dsf-push-btn');
    if (btn && subbed) { btn.textContent = '✅ Вже підписано'; btn.disabled = true; }
  });
});
