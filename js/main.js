/* ================= INISIALISASI ================= */
window.addEventListener('hashchange', function () { route(); });
window.addEventListener('online', function () { $('net').classList.add('hide'); softRerender(); });
window.addEventListener('offline', function () { $('net').classList.remove('hide'); });
document.addEventListener('visibilitychange', function () { if (!document.hidden && U) { if (Date.now() - (initT || 0) > 120000) warmUp(); softRerender(); } });
var initT = Date.now();
(async function init() {
  $('s-setuju-t').textContent = CONSENT; initLoginView();
  if (navigator.onLine === false) $('net').classList.remove('hide');
  warmUp();
  var t = load('shlc_t'), u = load('shlc_u');
  if (t && u) { try { U = JSON.parse(u); T = t; } catch (e) { U = null; T = ''; } }
  var h = location.hash.replace(/^#\/?/, '').split('/');
  if (U && h[0] !== 'v' && h[0] !== 'd' && h[0] !== 'reset') {                       // buka seketika dari data perangkat, validasi sesi di latar
    boot();
    api('me', T);
  } else if (h[0] === 'v' || h[0] === 'd' || h[0] === 'reset') route(); else show('v-login');
  var c = await api('appConfig'); if (c && c.googleClientId) { GCID = c.googleClientId; if (!U) initGoogle(); } else if (CFG.GOOGLE_CLIENT_ID) { GCID = CFG.GOOGLE_CLIENT_ID; if (!U) initGoogle(); }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();
