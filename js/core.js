/* core.js - helper, lapisan API REST (SWR + retry + idempotensi), sesi, router hash, Login Google. Training Fire & Safety Super App SHLC */
var $ = function (id) { return document.getElementById(id); };
var val = function (id) { return $(id).value; };
var ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ENT[c]; }); };
var CFG = window.SHLC || {};
var GAS = CFG.GAS_URL || '';
var save = function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
var load = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
var T = '', U = null, Q = null, expRows = [], userRows = [], GCID = '', GTOKEN = '';
var quizPoll = null, LS = null, scanLog = [], scanBusy = false, lastPid = '', lastAt = 0, curTab = '';
var CONSENT = 'Saya menyetujui data pribadi saya (nama, NIK, tanggal lahir, unit kerja, nomor WhatsApp, dan email) dikumpulkan dan diproses oleh Siloam Hospitals Lippo Cikarang untuk pelaksanaan training, pencatatan kehadiran, penilaian, serta penerbitan dan verifikasi sertifikat. Saya dapat mengunduh salinan data saya atau mengajukan penghapusan melalui menu Profil.';

function pd(s) {
  var m = String(s || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
  return m ? new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : new Date(NaN);
}
function dt(s) {
  var m = String(s || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (!m) return esc(String(s || '').replace('T', ' ').slice(0, 16));
  var z = function (n) { return ('0' + n).slice(-2); };
  return esc(m[1] + '-' + z(m[2]) + '-' + z(m[3]) + (m[4] ? ' ' + z(m[4]) + ':' + m[5] : ''));
}
function normWa(v) {
  var raw = String(v == null ? '' : v).trim(), dg = raw.replace(/\D/g, '');
  if (!dg) return '';
  if (raw.charAt(0) === '+') return '+' + dg;
  if (dg.indexOf('62') === 0) return '+' + dg;
  if (dg.charAt(0) === '0') return '+62' + dg.slice(1);
  if (dg.charAt(0) === '8') return '+62' + dg;
  return '+' + dg;
}
function waNum(v) { var n = normWa(v); return /^\+62[1-9]\d{7,12}$/.test(n) ? n.slice(1) : ''; }
function ini(n) { var p = String(n || '?').trim().split(/\s+/); return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase(); }
function bdg(t) {
  var c = /^(Hadir|Lulus|Selesai)$/.test(t) ? 'ok' : /^Gagal$/.test(t) ? 'bad' : /^Belum/.test(t) ? 'warn' : '';
  return '<span class="badge ' + c + '">' + esc(t) + '</span>';
}
function toast(m) {
  var e = $('toast'); e.textContent = m; e.style.display = 'block';
  clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.display = 'none'; }, 4200);
}
function unitCtl(id, cur, list, kosongAwal) {
  if (!list || !list.length) return '<input id="' + id + '" value="' + esc(cur || '') + '">';
  var h = '<select id="' + id + '">';
  if (kosongAwal) h += '<option value="">Pilih unit kerja</option>';
  if (cur && list.indexOf(cur) < 0) h += '<option value="' + esc(cur) + '" selected>' + esc(cur) + ' (saat ini)</option>';
  list.forEach(function (n) { h += '<option value="' + esc(n) + '"' + (n === cur ? ' selected' : '') + '>' + esc(n) + '</option>'; });
  return h + '</select>';
}
async function loadUnits() { var l = await api('daftarUnit'); if (l && l.length && $('s-unit-w')) $('s-unit-w').innerHTML = unitCtl('s-unit', '', l, true); }
function loadScript(src) {
  loadScript.c = loadScript.c || {};
  if (loadScript.c[src]) return loadScript.c[src];
  return loadScript.c[src] = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = function () { delete loadScript.c[src]; no(new Error('Gagal memuat ' + src)); }; document.head.appendChild(s); });
}

/* ================= LAPISAN API (gas-instant-ux-pro) ================= */
var PUBR = { daftarUnit: 1, appConfig: 1, verifyInfo: 1, deVerifikasi: 1, signUp: 1, requestReset: 1, doReset: 1, login: 1, loginGoogle: 1, signUpGoogle: 1, logout: 1 };
// detik kesegaran cache klien per aksi baca (0 = selalu ke server)
var READ = { me: 45, getSchedule: 30, myReg: 30, myStatus: 30, myCert: 60, evalStatus: 60, statusPermintaanSaya: 60, quizStatus: 10, roster: 12, statusAntrean: 15,
  statusBankSoal: 60, reportData: 45, expiryOverview: 60, expiredList: 60, listUsers: 45, permintaanData: 30, unitAdmin: 45, statusCadangan: 60, riwayatLog: 20,
  daftarUnit: 300, appConfig: 300, notifConfig: 30, crmList: 30, blastList: 20, importInfo: 300, deTemplates: 45, deGenerated: 20, deOfficials: 45, keamananConfig: 30 };
var MC = {}, INFL = {}, EPOCH = 0, FOLLOW = {};
var Perf = { rows: [], add: function (a, total, server, c) { this.rows.push({ aksi: a, total: total, server: server == null ? null : server, jaringan: server != null ? total - server : null, cache: !!c }); if (this.rows.length > 200) this.rows.shift(); }, table: function () { console.table(this.rows.slice(-30)); } };
function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; }
function ckey(fn, a) { return fn + '|' + JSON.stringify(PUBR[fn] ? a : a.slice(1)); }
function persistOk(fn) { return U && U.role === 'peserta' || fn === 'daftarUnit' || fn === 'appConfig'; }   // data staf (PII) tidak disimpan di perangkat
function lsKey(k) { return 'shlc:v4:' + (U ? U.uid : 'pub') + ':' + k; }
function cacheGet(k, fn) {
  var c = MC[k]; if (c) return c;
  if (persistOk(fn)) { var s = load(lsKey(k)); if (s) { try { c = JSON.parse(s); MC[k] = c; return c; } catch (e) {} } }
  return null;
}
function cachePut(k, fn, d, noPersist) {
  var o = { t: Date.now(), h: hashStr(JSON.stringify(d)), d: d }; MC[k] = o;
  if (!noPersist && persistOk(fn)) save(lsKey(k), JSON.stringify(o));
  return o;
}
function cacheClear() {
  MC = {}; EPOCH++;
  try { Object.keys(localStorage).filter(function (x) { return x.indexOf('shlc:v4:') === 0; }).forEach(function (x) { localStorage.removeItem(x); }); } catch (e) {}
}
function waitOnline(ms) { return new Promise(function (r) { if (navigator.onLine !== false) return r(); var t = setTimeout(done, ms); function done() { clearTimeout(t); removeEventListener('online', done); r(); } addEventListener('online', done); }); }
async function apiOnce(body, timeout) {
  var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, timeout), t0 = performance.now();
  try {
    var res = await fetch(GAS, { method: 'POST', redirect: 'follow', cache: 'no-store', signal: ctrl.signal, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    var text = await res.text(), j;
    try { j = JSON.parse(text); } catch (e) { return { success: false, network: true, retryable: res.status >= 500 || res.status === 429, message: 'Server membalas HTTP ' + res.status + ' (bukan JSON).' }; }
    Perf.add(body.action, Math.round(performance.now() - t0), j.ms, j.cached); return j;
  } catch (err) { return { success: false, network: true, retryable: true, message: err.name === 'AbortError' ? 'Server terlalu lama merespons.' : 'Koneksi terputus.' }; }
  finally { clearTimeout(timer); }
}
async function rawCall(fn, args, isRead) {
  var body = { action: fn, args: args }, tries = isRead ? 3 : 2, res;
  if (!isRead) body.reqId = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random());
  if (!GAS || GAS.indexOf('XXXX') > -1) return { success: false, message: 'Alamat server (GAS_URL) belum diisi di js/config.js.' };
  for (var i = 0; i < tries; i++) {
    if (i) { await new Promise(function (r) { setTimeout(r, 1200 * i); }); if (navigator.onLine === false) await waitOnline(15000); }
    res = await apiOnce(body, isRead ? (i ? 40000 : 25000) : 90000);
    if (res.success || !res.retryable) break;
  }
  return res;
}
function handleRes(fn, res, quiet) {
  if (res.success) { if (res.nq > 0) scheduleDrain(); return res.data; }
  if (res.code === 'AUTH' && T) { onSessionExpired(); return null; }
  if (!quiet) toast(res.message || 'Terjadi kesalahan.');
  return null;
}
/* api(fn, ...args) -> data atau null (toast bila gagal). Argumen pertama aksi bertoken = T (sama seperti versi lama). */
async function api(fn) {
  var a = Array.prototype.slice.call(arguments, 1), ttl = READ[fn];
  if (!ttl) {                                                                         // ===== TULIS =====
    var r = await rawCall(fn, a, false);
    if (r.success) { cacheClear(); }
    return handleRes(fn, r);
  }
  var k = ckey(fn, a), c = cacheGet(k, fn), age = c ? (Date.now() - c.t) / 1000 : 1e9;
  if (c && age < ttl) { Perf.add(fn, 0, null, true); return c.d; }                   // segar: tanpa jaringan
  if (c) { revalidate(fn, a, k, c); return c.d; }                                    // basi: tampilkan lalu segarkan di latar
  var f = k + '#' + EPOCH;
  if (INFL[f]) return INFL[f];
  var p = rawCall(fn, a, true).then(function (res) {
    delete INFL[f];
    var d = handleRes(fn, res); if (d !== null && d !== undefined) cachePut(k, fn, d); return d;
  });
  INFL[f] = p; return p;
}
async function revalidate(fn, a, k, old) {
  var f = 'rv' + k + '#' + EPOCH; if (INFL[f]) return; INFL[f] = 1; var ep = EPOCH;
  try {
    var res = await rawCall(fn, a, true);
    if (ep !== EPOCH) return;
    if (res.success && res.data !== null && res.data !== undefined) {
      var n = cachePut(k, fn, res.data); if (n.h !== old.h) softRerender();
    } else if (res.code === 'AUTH' && T) onSessionExpired();
  } finally { delete INFL[f]; }
}
var rrT = null;
function softRerender() {                                                            // render ulang hanya bila data berubah dan pengguna tidak sedang mengisi
  clearTimeout(rrT); rrT = setTimeout(function () {
    if (!U || !curTab || !V[curTab] || LS || Q || document.hidden) return;
    var ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && $('M').contains(ae)) return;
    if (document.querySelector('#M input.sel:checked')) return;
    V[curTab](true);
  }, 200);
}
var drainT = null, drainN = 0;
function scheduleDrain() { clearTimeout(drainT); drainT = setTimeout(async function () { if (!T) return; var r = await rawCall('drain', [T], false); if (r.success && drainN++ < 3) { /* tuntas */ } }, 500); }
function warmUp() { try { fetch(GAS + '?w=1&_=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).catch(function () {}); } catch (e) {} }
async function prefetch() {                                                          // menu lain dimuat saat idle: 1 panggilan batch
  var plan = { peserta: [['quizStatus'], ['daftarUnit'], ['statusPermintaanSaya']],
    trainer: [['reportData'], ['statusAntrean'], ['statusBankSoal'], ['expiryOverview'], ['getSchedule']],
    admin: [['listUsers'], ['permintaanData'], ['unitAdmin'], ['expiryOverview'], ['statusCadangan'], ['riwayatLog', '']] }[U.role] || [];
  var calls = [];
  plan.forEach(function (p) { var fn = p[0], args = PUBR[fn] ? p.slice(1) : [T].concat(p.slice(1)); if (!cacheGet(ckey(fn, args), fn) || (Date.now() - cacheGet(ckey(fn, args), fn).t) / 1000 > READ[fn]) calls.push({ action: fn, args: args, key: ckey(fn, args) }); });
  if (!calls.length) return;
  var ep = EPOCH, res = await apiOnce({ action: 'batch', calls: calls }, 40000);
  if (ep !== EPOCH || !res.success) return;
  calls.forEach(function (c) { var r = res.data[c.key]; if (r && r.success && r.data !== null && r.data !== undefined) cachePut(c.key, c.action, r.data); });
}
function idle(fn) { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(fn); }

/* ================= SHELL, SESI, ROUTER ================= */
var V = {};
function show(id) {
  ['v-login', 'v-signup', 'v-forgot', 'v-reset', 'v-verify', 'v-app'].forEach(function (x) { $(x).classList.toggle('hide', x !== id); });
  document.body.className = id === 'v-app' ? 'in' : 'out ' + id;
  if (id === 'v-login') initGoogle();
}
var M = function (h) { var m = $('M'); if (M.last === h) return; M.last = h; m.innerHTML = h; };
function setWho() { $('who-n').textContent = U.nama_ktp; $('who-r').textContent = U.role; $('who-av').textContent = ini(U.nama_ktp); }
async function signup() {
  var d = { nama_ktp: val('s-nama'), nik: val('s-nik'), tgl_lahir: val('s-tgl'), unit_kerja: val('s-unit'), no_wa: normWa(val('s-wa')), email: val('s-email'), username: val('s-user'), password: val('s-pass'), setuju: $('s-setuju').checked };
  if (GTOKEN) { d.idToken = GTOKEN; var g = await api('signUpGoogle', d); if (g) { GTOKEN = ''; startSession(g); } return; }
  var r = await api('signUp', d); if (r) { toast(r); show('v-login'); }
}
async function login() {
  var b = $('l-btn'); b.disabled = true;
  var r = await api('login', val('l-u'), val('l-p')); b.disabled = false; if (!r) return;
  startSession(r);
}
function startSession(r) {
  T = r.token; U = r.user; save('shlc_t', T); save('shlc_u', JSON.stringify(U)); cacheClear();
  Object.keys(r.boot || {}).forEach(function (k) { var fn = k.split('|')[0]; cachePut(PUBR[fn] ? k : k, fn, r.boot[k]); });
  $('l-p').value = ''; boot();
}
function onSessionExpired() {
  if (!T) return; T = ''; U = null; save('shlc_t', null); save('shlc_u', null); cacheClear();
  $('who').classList.add('hide'); show('v-login'); location.hash = ''; toast('Sesi berakhir, silakan masuk lagi.');
}
async function logout() {
  if (LS) await stopScan();
  rawCall('logout', [T], false); T = ''; U = null; curTab = ''; save('shlc_t', null); save('shlc_u', null); save('shlc_tab', null); cacheClear(); M.last = null;
  $('who').classList.add('hide'); $('l-p').value = ''; show('v-login'); location.hash = '';
}
async function forgot() { var r = await api('requestReset', val('f-email')); if (r) { toast(r); show('v-login'); } }
var RESET = '';
async function reset() { var r = await api('doReset', RESET, val('r-p')); if (r) { toast(r); RESET = ''; location.hash = ''; show('v-login'); } }

var TABS = {
  peserta: [['home', 'Beranda', 'home', 1], ['quiz', 'Kuis', 'quiz', 1], ['prof', 'Profil', 'user', 1]],
  trainer: [['jadwal', 'Jadwal', 'cal', 1], ['scan', 'Scan', 'scan', 1], ['lap', 'Laporan', 'chart', 1], ['exp', 'Expired', 'warn', 0], ['dok', 'Dokumen', 'doc', 0], ['prof', 'Profil', 'user', 1]],
  admin: [['lap', 'Laporan', 'chart', 1], ['usr', 'Pengguna', 'users', 1], ['unit', 'Unit', 'building', 1], ['log', 'Log', 'log', 1], ['exp', 'Expired', 'warn', 0], ['notif', 'Notifikasi', 'bell', 0], ['crm', 'Kontak', 'contact', 0], ['dok', 'Dokumen', 'doc', 0], ['mig', 'Migrasi', 'import', 0], ['sec', 'Keamanan', 'shield', 0], ['rst', 'Reset', 'key', 0]]
};
function boot() {
  $('who').classList.remove('hide'); setWho();
  if (!U.setuju) { show('v-app'); $('tabs').innerHTML = ''; consent(); return; }
  var tb = TABS[U.role], hasMore = tb.some(function (t) { return !t[3]; });
  $('tabs').innerHTML = tb.map(function (t) {
    return '<button data-t="' + t[0] + '" class="' + (t[3] ? 'mb' : 'dk') + '" onclick="go(\'' + t[0] + '\')">' + ic(t[2]) + '<span>' + t[1] + '</span></button>';
  }).join('') + (hasMore ? '<button data-t="more" class="mb more" onclick="go(\'more\')">' + ic('more') + '<span>Lainnya</span></button>' : '');
  show('v-app'); route();
  idle(prefetch);
}
function consent() {
  $('pt').textContent = 'Persetujuan Data';
  M('<div class="card solo"><h2>Persetujuan Data Pribadi</h2><p class="sub">Diperlukan sebelum Anda melanjutkan.</p><p>' + esc(CONSENT) + '</p>' +
    '<label class="opt"><input type="checkbox" id="cs-ok"> Saya telah membaca dan menyetujui</label><button class="btn" onclick="acceptCons()">Lanjutkan</button></div>');
}
async function acceptCons() {
  if (!$('cs-ok').checked) { toast('Centang persetujuan terlebih dahulu.'); return; }
  var r = await api('terimaPersetujuan', T); if (r) { U.setuju = true; save('shlc_u', JSON.stringify(U)); boot(); }
}
function go(t) { if (location.hash === '#/' + t) { showTab(t, true); return; } location.hash = '#/' + t; }
function tabInfo(t) { var l = TABS[U.role].filter(function (z) { return z[0] === t; })[0]; return l; }
function showTab(t, again) {
  if (!U || !U.setuju) return;
  var valid = t === 'more' || TABS[U.role].some(function (z) { return z[0] === t; }) && V[t];
  if (!valid) t = TABS[U.role][0][0];
  if (LS) stopScan();
  if (quizPoll) { clearInterval(quizPoll); quizPoll = null; }
  curTab = t; save('shlc_tab', t);
  var cur = tabInfo(t), title = t === 'more' ? 'Lainnya' : cur ? cur[1] : '';
  $('pt').textContent = title; $('bc').textContent = title;
  document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t || (t !== 'more' && b.dataset.t === 'more' && cur && !cur[3])); });
  window.scrollTo(0, 0); M.last = null; $('M').classList.add('enter'); setTimeout(function () { $('M').classList.remove('enter'); }, 700);
  (V[t] || V.more)();
}
function route() {
  var h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'v' || h[0] === 'd') { return showVerify(h[0], h[1]); }
  if (h[0] === 'reset' && h[1]) { RESET = h[1]; return show('v-reset'); }
  if (!U) return;
  if (document.body.className.indexOf('out') === 0) show('v-app');
  var last = load('shlc_tab');
  showTab(h[0] || (TABS[U.role].some(function (t) { return t[0] === last; }) ? last : TABS[U.role][0][0]));
}
async function showVerify(kind, kode) {
  show('v-verify'); var box = $('vf-box'); box.innerHTML = '<div class="skel" style="height:160px"></div>';
  var r = await api(kind === 'v' ? 'verifyInfo' : 'deVerifikasi', kode || ''); var h;
  if (!r) h = '<div class="vs bad"><h2>Tidak dapat memeriksa</h2><p>Periksa koneksi lalu muat ulang halaman.</p></div>';
  else if (!r.found) h = '<div class="vs bad"><h2>Tidak ditemukan</h2><p>Dokumen dengan kode ini tidak terdaftar di sistem SHLC.</p></div>';
  else if (kind === 'v') h = '<div class="vs ' + (r.valid ? 'ok' : 'warn') + '"><h2>' + (r.valid ? 'Sertifikat VALID' : 'Asli, masa berlaku berakhir') + '</h2></div><table class="tbl2"><tr><td>Nama</td><td><b>' + esc(r.nama) + '</b></td></tr><tr><td>NIK</td><td>&bull;&bull;&bull;&bull;' + esc(r.nik4) + '</td></tr><tr><td>No. Sertifikat</td><td>' + esc(r.nomor) + '</td></tr><tr><td>Pelaksanaan</td><td>' + esc(r.tanggal) + '</td></tr><tr><td>Berlaku sampai</td><td>' + esc(r.exp || '-') + '</td></tr></table>';
  else h = '<div class="vs ' + (r.utuh ? 'ok' : 'bad') + '"><h2>' + (r.utuh ? 'Dokumen ASLI dan utuh' : 'Dokumen TIDAK utuh') + '</h2></div><table class="tbl2"><tr><td>Jenis</td><td>' + esc(r.jenis) + '</td></tr><tr><td>Nomor</td><td><b>' + esc(r.nomor) + '</b></td></tr><tr><td>Terbit</td><td>' + esc(r.terbit) + '</td></tr>' +
    (r.penandatangan || []).map(function (p) { return '<tr><td>Penandatangan</td><td>' + esc(p.nama) + '<br><small>' + esc(p.jabatan) + ' &middot; ' + esc(p.waktu) + '</small></td></tr>'; }).join('') + '</table>';
  box.innerHTML = h;
}
function leaveVerify() { location.hash = ''; if (U) { show('v-app'); route(); } else show('v-login'); }

/* ================= LOGIN GOOGLE (Google Identity Services) ================= */
function initGoogle() {
  var w = $('g-btn'); if (!w || !GCID) { if (w) w.innerHTML = ''; return; }
  if (w.dataset.ok) return;
  loadScript('https://accounts.google.com/gsi/client').then(function () {
    if (!window.google || !google.accounts) return;
    google.accounts.id.initialize({ client_id: GCID, callback: onGoogle, auto_select: false, cancel_on_tap_outside: true });
    google.accounts.id.renderButton(w, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', logo_alignment: 'left', width: Math.min(360, (w.parentNode.clientWidth || 340)) });
    w.dataset.ok = '1'; $('g-sep').classList.remove('hide');
  }).catch(function () { w.innerHTML = '<p class="mut" style="font-size:12px">Login Google tidak dapat dimuat (periksa koneksi).</p>'; });
}
async function onGoogle(resp) {
  var r = await api('loginGoogle', resp.credential); if (!r) return;
  if (r.needSignup) {
    GTOKEN = resp.credential; show('v-signup'); loadUnits();
    $('s-email').value = r.google.email; $('s-email').readOnly = true; $('s-nama').value = r.google.nama || '';
    $('s-user-w').classList.add('hide'); $('s-pass-w').classList.add('hide');
    toast('Akun Google belum terhubung. Lengkapi data untuk mendaftar.'); return;
  }
  startSession(r);
}

