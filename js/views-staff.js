var LIBQR = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';
V.jadwal = async function () {
  var r = await api('roster', T); var s = r && r.schedule; selPid = {};
  var h = '<div class="card"><h3>Set Jadwal Training Terdekat</h3>' +
    '<label>Tanggal &amp; jam</label><input id="j-tgl" type="datetime-local">' +
    '<label>Metode</label><select id="j-jenis" onchange="$(\'j-link-w\').classList.toggle(\'hide\',this.value!==\'online\')"><option value="offline">Offline (absensi scan QR)</option><option value="online">Online (absensi kode)</option></select>' +
    '<div id="j-link-w" class="hide"><label>Link meeting</label><input id="j-link" type="url"></div>' +
    '<button class="btn" onclick="saveSch()">Publikasikan</button><p class="mut" style="margin:10px 0 0">Jadwal baru menggantikan jadwal aktif sebelumnya.</p></div>';
  if (s) {
    var hd = r.rows.filter(function (x) { return x.status === 'Hadir'; }).length, pre = r.rows.filter(function (x) { return x.status === 'Hadir' && x.pre !== ''; }).length, lul = r.rows.filter(function (x) { return +x.post >= 80; }).length;
    var opt = function (a, sel) { return a.map(function (m) { return '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + (m ? m + ' menit' : 'Tanpa batas waktu') + '</option>'; }).join(''); };
    var box = function (t, bd, ket, body) { return '<div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--bd)"><div class="row" style="justify-content:flex-start;gap:8px"><b>' + t + '</b><span class="badge ' + (bd ? 'ok' : 'warn') + '">' + (bd ? 'Dibuka' + (bd === 1 ? ', tanpa batas waktu' : ' sampai ' + esc(bd) + ' WIB') : 'Tertutup') + '</span></div><p class="mut" style="margin:6px 0 8px">' + ket + '</p><div class="row" style="justify-content:flex-start;gap:8px">' + body + '</div></div>'; };
    var ab = s.jenis === 'online' ? box('Absensi online', s.absen_buka ? (s.absen_tutup || 1) : 0, 'Kode hanya diterima saat absensi dibuka. Buka saat sesi dimulai.',
      '<select id="ab-m" style="width:auto;margin:0">' + opt([15, 30, 60, 90, 0], 30) + '</select><button class="btn sm" onclick="abOpen()">Buka Absensi</button>' + (s.absen_buka ? '<button class="btn sm sec" onclick="abClose()">Tutup</button>' : '') + '<button class="btn sm sec" onclick="abNew()">Ganti Kode</button>') : '';
    var ptb = box('Post-test', s.post_buka ? (s.post_tutup || 1) : 0, 'Hadir ' + hd + ' &middot; Pre-test selesai ' + pre + ' &middot; Lulus Post-test ' + lul + '. Buka setelah materi selesai dan peserta siap.',
      '<select id="pt-m" style="width:auto;margin:0">' + opt([30, 45, 60, 90, 0], 45) + '</select><button class="btn sm" onclick="ptOpen()">Buka Post-test</button>' + (s.post_buka ? '<button class="btn sm sec" onclick="ptClose()">Tutup Post-test</button>' : ''));
    h += '<div class="stack"><div class="card"><h3>Jadwal Aktif</h3><p style="margin-top:0"><b>' + dt(s.tanggal) + '</b> <span class="badge blue">' + esc(s.jenis) + '</span></p>' +
      (s.jenis === 'online' ? '<p class="mut" style="margin-bottom:0">Kode absensi (umumkan di meeting):</p><div class="code">' + esc(s.kode_absen) + '</div>' : '') +
      ab + ptb + '<div class="row" style="justify-content:flex-start;margin-top:14px"><button class="btn sec sm" onclick="dlXlsx(\'hadir\')">Unduh Daftar Hadir (Excel)</button><button class="btn sec sm" onclick="dlXlsx(\'kuis\')">Unduh Hasil Kuis (Excel)</button><button class="btn sec sm" onclick="remind(this)">Kirim pengingat ke semua peserta</button></div></div>';
    h += certForm(s);
    h += '<div class="card"><h3>Daftarkan Peserta di Lokasi</h3><p class="mut" style="margin-top:0">Untuk peserta yang belum mendaftar sendiri. Cari nama, username, NIK, atau unit.</p><input id="wk-q" placeholder="Cari peserta (min. 2 huruf)" oninput="cariWk()"><div id="wk-res"></div></div></div>';
    h += '<div class="card wide"><h3>Peserta Terdaftar (' + r.rows.length + ')</h3>';
    if (r.rows.length) {
      h += '<div class="row" style="justify-content:flex-start;gap:8px"><button class="btn sm sec" onclick="selAll()">Pilih semua yang belum hadir</button><button class="btn sm" id="bulk-btn" onclick="bulkHadir()" disabled>Tandai hadir terpilih (0)</button></div>';
      r.rows.forEach(function (x) {
        var p = esc(x.pid), bt = [];
        if (x.status !== 'Hadir') bt.push('<button class="btn sm sec" onclick="markRow(\'' + p + '\')">Tandai hadir</button>');
        if (x.status === 'Hadir' && !x.nomor) bt.push('<button class="btn sm sec dgr" data-p="' + p + '" onclick="sure(this,\'batalHadir\')">Batalkan hadir</button>');
        if (x.status !== 'Hadir' && x.pre === '') bt.push('<button class="btn sm sec dgr" data-p="' + p + '" onclick="sure(this,\'batalDaftar\')">Batalkan pendaftaran</button>');
        if (x.nomor) bt.push('<button class="btn sm sec" data-p="' + p + '" onclick="kirimUlangSert(this)">Kirim ulang email sertifikat</button>');
        h += '<div class="item">' + (x.status !== 'Hadir' ? '<input type="checkbox" class="sel" data-p="' + p + '" onchange="selTog(this)" aria-label="Pilih ' + esc(x.nama) + '">' : '') + '<div class="av sm">' + esc(ini(x.nama)) + '</div><div class="ib"><div class="row"><b>' + esc(x.nama) + '</b>' + bdg(x.status) + '</div>' +
          '<div class="meta">' + p + ' &middot; NIK ' + esc(x.nik) + ' &middot; ' + esc(x.unit) + '<br>WA ' + esc(x.wa) +
          '<br>Pre-test ' + esc(x.pre || '-') + ' &middot; Post-test ' + esc(x.post || '-') + ' &middot; ' + esc(x.percobaan) + 'x percobaan' +
          (x.nomor ? '<br>Sertifikat ' + esc(x.nomor) : '') + '</div><div class="row" style="justify-content:flex-start">' + bt.join('') + '</div></div></div>';
      });
    } else h += '<p class="mut">Belum ada peserta terdaftar.</p>';
    h += '</div>';
  }
  M(h);
};
function sure(b, fn) {
  if (!b.classList.contains('arm')) {
    b.dataset.t = b.textContent; b.classList.add('arm'); b.textContent = 'Klik lagi untuk yakin';
    setTimeout(function () { if (b.classList.contains('arm')) { b.classList.remove('arm'); b.textContent = b.dataset.t; } }, 4000); return;
  }
  window[fn](b.getAttribute('data-p'));
}
async function batalHadir(pid) { var r = await api('batalkanHadir', T, pid); if (r) { toast(r); V.jadwal(); } }
async function batalDaftar(pid) { var r = await api('batalkanPendaftaran', T, pid); if (r) { toast(r); V.jadwal(); } }
function selTog(cb) {
  if (cb.checked) selPid[cb.getAttribute('data-p')] = 1; else delete selPid[cb.getAttribute('data-p')];
  var n = Object.keys(selPid).length, b = $('bulk-btn'); if (b) { b.disabled = !n; b.textContent = 'Tandai hadir terpilih (' + n + ')'; }
}
function selAll() { document.querySelectorAll('input.sel').forEach(function (c) { c.checked = true; selTog(c); }); }
async function bulkHadir() { var r = await api('tandaiHadirMassal', T, Object.keys(selPid)); if (r) { toast(r); V.jadwal(); } }
async function abOpen() { var r = await api('setAbsen', T, 'buka', val('ab-m')); if (r) { toast(r); V.jadwal(); } }
async function abClose() { var r = await api('setAbsen', T, 'tutup', 0); if (r) { toast(r); V.jadwal(); } }
async function abNew() { var r = await api('setAbsen', T, 'ganti', 0); if (r) { toast(r); V.jadwal(); } }
function remind(b) {
  if (!b.classList.contains('arm')) {
    api('pengingatPeserta', T, false).then(function (i) {
      if (!i) return; b.dataset.t = b.textContent; b.classList.add('arm'); b.textContent = 'Kirim ' + i.jumlah + ' email? Sisa kuota ' + i.sisaKuota + '. Klik lagi';
      setTimeout(function () { if (b.classList.contains('arm')) { b.classList.remove('arm'); b.textContent = b.dataset.t; } }, 8000);
    }); return;
  }
  b.disabled = true; api('pengingatPeserta', T, true).then(function (r) { b.disabled = false; b.classList.remove('arm'); b.textContent = b.dataset.t; if (r) toast(r); });
}
function cariWk() { clearTimeout(wkT); wkT = setTimeout(doCariWk, 350); }
async function doCariWk() {
  var q = val('wk-q'), el = $('wk-res'); if (!el) return;
  if (String(q).trim().length < 2) { el.innerHTML = ''; return; }
  var r = await api('cariPeserta', T, q); if (!r) return;
  el.innerHTML = r.length ? r.map(function (u) {
    return '<div class="item"><div class="av sm">' + esc(ini(u.nama)) + '</div><div class="ib"><b>' + esc(u.nama) + '</b><div class="meta">' + esc(u.username) + ' &middot; ' + esc(u.unit) + '</div>' +
      (u.pid ? '<span class="badge ok">Sudah terdaftar</span>' : '<div class="row" style="justify-content:flex-start"><button class="btn sm" onclick="daftarWk(\'' + esc(u.uid) + '\',true)">Daftarkan dan hadir</button><button class="btn sm sec" onclick="daftarWk(\'' + esc(u.uid) + '\',false)">Daftarkan saja</button></div>') + '</div></div>';
  }).join('') : '<p class="mut">Tidak ada peserta yang cocok. Peserta harus membuat akun dulu.</p>';
}
async function daftarWk(uid, hadir) { var r = await api('daftarkanPeserta', T, uid, hadir); if (r) { toast(r); V.jadwal(); } }
async function dlB64(fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  toast('Menyiapkan file Excel, mohon tunggu...');
  var r = await api.apply(null, [fn, T].concat(args)); if (!r) return;
  var bin = atob(r.b64), n = bin.length, u8 = new Uint8Array(n);
  for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
  var blob = new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = r.name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  toast('File ' + r.name + ' diunduh.');
}
function dlXlsx(jenis, sid) { return dlB64('exportXlsx', jenis, sid || ''); }
async function dlIcs() {
  var r = await api('kalenderInfo', T); if (!r) return;
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([r.ics], { type: 'text/calendar' })); a.download = r.name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  toast('File kalender diunduh. Buka file tersebut untuk menyimpannya.');
}
async function markRow(pid) { await mark(pid, 'Manual Trainer'); V.jadwal(); }
async function saveSch() {
  var r = await api('setSchedule', T, { tanggal: val('j-tgl'), jenis: val('j-jenis'), link: val('j-link') }); if (r) { toast(r); V.jadwal(); }
}

V.scan = function () {
  loadScript(LIBQR).catch(function () {});
  scanLog = []; lastPid = ''; scanBusy = false;
  M('<div class="card solo"><h2>Scan QR Kehadiran</h2>' +
    '<p class="sub">Untuk training offline. Ketuk Mulai Scan, lalu arahkan kamera ke QR di layar HP peserta. Kehadiran tercatat otomatis dan kamera tetap menyala untuk peserta berikutnya.</p>' +
    '<div id="qr-live" class="hide" style="width:100%;max-width:460px;margin:0 auto 12px;border-radius:16px;overflow:hidden;background:#000"></div>' +
    '<button class="scanbtn" id="sb-start" onclick="startScan()">' + ic('cam') + '<span>Mulai Scan Kamera</span></button>' +
    '<button class="btn sec full hide" id="sb-stop" onclick="stopScan()">Berhenti Scan</button>' +
    '<div id="cam-diag"></div><p id="scan-res" style="font-weight:700;margin:12px 0 4px"></p><div id="scan-log"></div>' +
    '<hr style="border:0;border-top:1px solid var(--bd);margin:16px 0"><h3>Alternatif</h3>' +
    '<p class="mut" style="margin-top:0">Jika kamera langsung tidak bisa dipakai, foto QR peserta atau masukkan ID secara manual.</p>' +
    '<div class="row" style="justify-content:flex-start"><button class="btn sec" id="sb-photo" onclick="$(\'qr-file\').click()">Foto QR Peserta</button><button class="btn sec" onclick="camDiag()">Cek Kamera</button></div>' +
    '<input id="qr-file" type="file" accept="image/*" capture="environment" style="display:none" onchange="scanFile(this)">' +
    '<div id="qr-tmp" style="display:none"></div>' +
    '<input id="m-pid" style="margin-top:12px" placeholder="ID Partisipan, mis. PTC-AB12CD" autocapitalize="characters"><button class="btn sec" onclick="mark($(\'m-pid\').value,\'Manual Trainer\')">Tandai Hadir</button></div>');
};
function onScan(txt) {
  txt = String(txt || '').trim().toUpperCase();
  var n = Date.now();
  if (scanBusy || !txt || (txt === lastPid && n - lastAt < 5000)) return;
  scanBusy = true; lastPid = txt; lastAt = n;
  mark(txt, 'QR Scan').then(function (r) { if (r && navigator.vibrate) navigator.vibrate(150); }).then(function () { scanBusy = false; lastAt = Date.now(); });
}
function errName(e) {
  var s = String(e && e.name ? e.name + ': ' + (e.message || '') : e);
  var m = s.match(/(NotAllowedError|NotFoundError|NotReadableError|OverconstrainedError|SecurityError|AbortError|NotSupportedError)/);
  if (!m && /permission|denied/i.test(s)) return 'NotAllowedError';
  return m ? m[1] : 'Lainnya';
}
function camAdvice(n) {
  var L = {
    NotAllowedError: ['Ketuk ikon pengaturan di kiri bilah alamat Chrome, pilih Izin > Kamera > Izinkan, lalu muat ulang halaman.',
      'Chrome > Setelan situs > Kamera: pastikan script.google.com tidak ada di daftar Diblokir. Pengaturan umum "Tanya dulu" tidak menimpa blokir per situs.',
      'Pengaturan Android > Aplikasi > Chrome > Izin > Kamera: pilih Izinkan hanya saat aplikasi digunakan.',
      'Jika tetap ditolak, gunakan Foto QR Peserta. Fitur itu memakai aplikasi kamera bawaan HP dan tidak memerlukan izin ini.'],
    NotFoundError: ['HP tidak mendeteksi kamera. Gunakan Foto QR Peserta atau input manual.'],
    NotReadableError: ['Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera, Zoom, atau video call, lalu coba lagi.'],
    SecurityError: ['Browser memblokir kamera pada halaman ini. Gunakan Foto QR Peserta atau input manual.'],
    NotSupportedError: ['Browser ini tidak mendukung kamera langsung pada halaman ini. Gunakan Chrome versi terbaru, atau gunakan Foto QR Peserta.']
  };
  return '<ol style="margin:6px 0 0;padding-left:20px">' + (L[n] || ['Kamera tidak dapat dibuka. Gunakan Foto QR Peserta atau input manual.']).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
}
async function camDiag() {
  var o = [], n = '', box = $('cam-diag'); if (box) box.innerHTML = '<p class="mut">Memeriksa kamera...</p>';
  if (LS) await stopScan();
  o.push('Halaman aman (HTTPS): ' + (window.isSecureContext ? 'ya' : 'TIDAK'));
  var pp = document.permissionsPolicy || document.featurePolicy;
  o.push('Kebijakan halaman mengizinkan kamera: ' + (pp && pp.allowsFeature ? (pp.allowsFeature('camera') ? 'ya' : 'TIDAK (diblokir)') : 'tidak diketahui'));
  try { var st = await navigator.permissions.query({ name: 'camera' }); o.push('Status izin kamera di browser: ' + st.state); } catch (e) { o.push('Status izin kamera: tidak dapat dibaca'); }
  var md = navigator.mediaDevices;
  o.push('Akses kamera tersedia di browser: ' + (md && md.getUserMedia ? 'ya' : 'TIDAK'));
  if (md && md.enumerateDevices) { try { var dv = await md.enumerateDevices(); o.push('Kamera terdeteksi: ' + dv.filter(function (d) { return d.kind === 'videoinput'; }).length); } catch (e) {} }
  if (md && md.getUserMedia) {
    try { var s = await md.getUserMedia({ video: true }); s.getTracks().forEach(function (t) { t.stop(); }); o.push('Uji buka kamera: BERHASIL'); }
    catch (e) { n = errName(e); o.push('Uji buka kamera: GAGAL (' + esc(e && e.name || 'error') + ': ' + esc(e && e.message || '') + ')'); }
  }
  if (box) box.innerHTML = '<div class="ban ' + (n ? 'amb' : 'grn') + '" style="font-weight:500"><b>Hasil pemeriksaan kamera</b>' +
    o.map(function (l) { return '<div>' + (/^(Uji|Kebijakan|Halaman|Akses)/.test(l) ? l : l) + '</div>'; }).join('') + (n ? '<p style="margin:10px 0 0"><b>Cara memperbaiki:</b></p>' + camAdvice(n) : '<p style="margin:8px 0 0">Kamera siap dipakai. Tekan Mulai Scan Kamera.</p>') + '</div>';
}
async function startScan() {
  if (LS) return;
  try { await loadScript(LIBQR); } catch (e) { toast('Pustaka pemindai tidak dapat dimuat. Periksa koneksi, atau gunakan Foto QR / input manual.'); return; }
  $('qr-live').classList.remove('hide');
  var cfg = { verbose: false, experimentalFeatures: { useBarCodeDetectorIfSupported: true } };
  try { if (typeof Html5QrcodeSupportedFormats !== 'undefined') cfg.formatsToSupport = [Html5QrcodeSupportedFormats.QR_CODE]; } catch (e) {}
  LS = new Html5Qrcode('qr-live', cfg);
  try {
    await LS.start({ facingMode: 'environment' }, { fps: 10, qrbox: function (w, h) { var s = Math.floor(Math.min(w, h) * 0.75); return { width: s, height: s }; } }, onScan, function () {});
    $('sb-start').classList.add('hide'); $('sb-stop').classList.remove('hide');
  } catch (e) {
    var nm = errName(e);
    await stopScan();
    toast(nm === 'NotAllowedError' ? 'Izin kamera ditolak. Lihat langkah perbaikan di bawah, atau gunakan Foto QR Peserta.' : 'Kamera tidak dapat dibuka (' + nm + '). Lihat saran di bawah atau gunakan Foto QR Peserta.');
    var bx = $('cam-diag'); if (bx) bx.innerHTML = '<div class="ban amb" style="font-weight:500"><b>Kamera tidak dapat dibuka (' + esc(nm) + ')</b>' + camAdvice(nm) + '<p style="margin:10px 0 0">Tekan <b>Cek Kamera</b> untuk pemeriksaan lengkap.</p></div>';
  }
}
async function stopScan() {
  var s = LS; LS = null;
  try { if (s) { await s.stop(); s.clear(); } } catch (e) {}
  var q = $('qr-live'); if (q) { q.classList.add('hide'); q.innerHTML = ''; }
  var a = $('sb-start'), b = $('sb-stop'); if (a) a.classList.remove('hide'); if (b) b.classList.add('hide');
}
function shrink(file, max) {
  return new Promise(function (ok, no) {
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, max / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      im.onload = im.onerror = null; im.src = ''; URL.revokeObjectURL(url);
      c.toBlob(function (bl) { c.width = c.height = 1; if (bl) ok(new File([bl], 'qr.jpg', { type: 'image/jpeg' })); else no(new Error('gagal memproses gambar')); }, 'image/jpeg', 0.9);
    };
    im.onerror = function () { URL.revokeObjectURL(url); no(new Error('gambar tidak dapat dibuka')); };
    im.src = url;
  });
}
async function nativeQr(file) {
  if (!('BarcodeDetector' in window)) return null;
  try {
    var det = new BarcodeDetector({ formats: ['qr_code'] }), bmp = await createImageBitmap(file);
    var r = await det.detect(bmp); if (bmp.close) bmp.close();
    return r && r.length ? r[0].rawValue : null;
  } catch (e) { return null; }
}
async function decodeQr(file) {
  try { await loadScript(LIBQR); } catch (e) {}
  var sizes = [1600, 1280, 900, 640], last = null;
  for (var i = 0; i < sizes.length; i++) {
    var q = null;
    try { var small = await shrink(file, sizes[i]); var nv = await nativeQr(small); if (nv) return nv; q = new Html5Qrcode('qr-tmp'); return await q.scanFile(small, false); }
    catch (e) { last = e; }
    finally { try { if (q) q.clear(); } catch (e2) {} }
  }
  throw last || new Error('QR tidak terbaca');
}
async function scanFile(inp) {
  var f = inp.files[0]; if (!f) return;
  toast('Membaca QR...');
  try { var t = await decodeQr(f); await mark(t, 'QR Scan'); }
  catch (e) {
    var m = String(e && e.message || e);
    toast(/memory|memori/i.test(m) ? 'Memori HP penuh. Tutup aplikasi lain lalu coba lagi, atau gunakan input manual.' : 'QR tidak terbaca. Foto lebih dekat dan fokus, atau gunakan input manual.');
  }
  inp.value = '';
}
function logScan(r) {
  var e = $('scan-log'); if (!e) return;
  scanLog.unshift(new Date().toTimeString().slice(0, 5) + '  ' + r);
  e.innerHTML = scanLog.slice(0, 8).map(function (l) { return '<div class="meta" style="margin:2px 0">' + esc(l) + '</div>'; }).join('');
}
async function mark(pid, metode) {
  var r = await api('verify', T, pid, metode);
  if (r) { toast(r); var e = $('scan-res'); if (e) e.textContent = r; logScan(r); }
  return r;
}

V.exp = async function () {
  var r = await api('expiryOverview', T) || { expired: [], soon: [] }; expRows = [];
  r.expired.forEach(function (x) { x.status = 'Kedaluwarsa'; expRows.push(x); });
  r.soon.forEach(function (x) { x.status = 'Segera berakhir'; expRows.push(x); });
  function lst(a, soon) {
    if (!a.length) return '<p class="mut" style="margin:0">' + (soon ? 'Tidak ada yang berakhir dalam 30 hari.' : 'Tidak ada peserta yang kedaluwarsa.') + '</p>';
    return a.map(function (x) {
      return '<div class="item"><div class="av sm' + (soon ? '' : ' red') + '">' + esc(ini(x.nama)) + '</div><div class="ib"><b>' + esc(x.nama) + '</b><div class="meta">NIK ' + esc(x.nik) + ' &middot; ' + esc(x.unit) +
        '<br>WA ' + esc(x.wa) + ' &middot; ' + esc(x.email) + '<br>Lulus terakhir ' + esc(x.lulus) + ' &middot; ' + (soon ? 'Berakhir ' + esc(x.exp) + ' (' + esc(x.sisa) + ' hari lagi)' : 'Kedaluwarsa ' + esc(x.exp)) + '</div>' +
        '<div class="row" style="justify-content:flex-start">' +
        (waNum(x.wa) ? '<a class="btn sm sec" style="text-decoration:none" target="_blank" href="' + esc(wa(x, soon)) + '">WhatsApp</a>' : '<span class="badge warn">No. WA tidak valid</span>') +
        '<button class="btn sm sec" data-e="' + esc(x.email) + '" onclick="kirimEmail(this)">Kirim Email</button></div></div></div>';
    }).join('');
  }
  M('<div class="card wide"><div class="row" style="margin-bottom:8px"><h3 style="margin:0">Masa Berlaku Sertifikasi</h3><button class="btn sec sm" onclick="dlXlsx(\'expiry\')">Unduh Excel</button></div>' +
    '<p class="mut" style="margin:0">Dihitung otomatis setiap menu ini dibuka: tanggal lulus Post-test terakhir + 1 tahun. Peserta tidak perlu login. Hanya yang pernah lulus Post-test di aplikasi ini yang tercatat. Tombol Kirim Email mengirim pemberitahuan resmi dari sistem (maksimal 1x per jam untuk setiap peserta).</p></div>' +
    '<div class="card"><h3>Wajib Training Ulang (' + r.expired.length + ')</h3>' + lst(r.expired, false) + '</div>' +
    '<div class="card"><h3>Segera Berakhir, 30 Hari (' + r.soon.length + ')</h3>' + lst(r.soon, true) + '</div>');
};
async function kirimEmail(b) {
  b.disabled = true;
  var r = await api('kirimEmailPengingat', T, b.getAttribute('data-e'));
  b.disabled = false; if (r) toast(r);
}

function unitCard(r) {
  if (!r.perUnit || !r.perUnit.length) return '';
  var h = '<div class="card wide"><h3>Tersertifikasi per Unit</h3><div style="grid-column:1/-1;overflow-x:auto"><table class="tbl"><thead><tr><th>Unit</th><th>Akun peserta</th><th>Aktif</th><th>Kedaluwarsa</th><th>Belum</th><th>Karyawan</th><th>% aktif</th></tr></thead><tbody>';
  r.perUnit.forEach(function (u) { h += '<tr><td><b>' + esc(u.unit) + '</b></td><td>' + esc(u.akun) + '</td><td>' + esc(u.aktif) + '</td><td>' + esc(u.expired) + '</td><td>' + esc(u.belum) + '</td><td>' + (u.karyawan == null ? '-' : esc(u.karyawan)) + '</td><td>' + (u.pct == null ? '-' : esc(u.pct) + '%') + '</td></tr>'; });
  return h + '</tbody></table></div><p class="mut" style="margin:0">' + (r.unitBaku ? 'Persentase dihitung dari jumlah karyawan yang diisi admin di menu Unit (tanda - bila belum diisi).' : 'Daftar unit baku belum ditetapkan, jadi unit dikelompokkan menurut isian peserta. Admin dapat menetapkannya di menu Unit.') + ' Akun peserta hanya mencakup yang sudah membuat akun.</p></div>';
}
function bankCard(b) {
  if (!b) return '';
  return '<div class="card"><h3>Bank Soal</h3><div class="row" style="justify-content:flex-start;gap:8px"><span class="badge ' + (b.cukup ? 'ok' : 'warn') + '">Soal valid: ' + esc(b.valid) + ' dari ' + esc(b.total) + '</span><span class="badge">Tiap kuis: ' + esc(Math.min(b.jumlahKuis, b.valid)) + ' soal acak</span></div>' +
    '<p class="mut" style="margin:8px 0 0">' + (b.cukup ? 'Bank soal cukup. Setiap kuis memilih soal acak dengan urutan pilihan acak.' : 'Bank soal belum mencapai ' + esc(b.jumlahKuis) + ' soal valid, jadi kuis memakai semua soal yang ada. Isi sheet questions (id, pertanyaan, A, B, C, D, kunci).') + '</p>' +
    (b.masalah && b.masalah.length ? '<div class="meta" style="margin-top:8px">' + b.masalah.map(esc).join('<br>') + '</div>' : '') + '</div>';
}
function qcard(q) {
  if (!q || !q.aktif) return '<div class="card"><h3>Antrean Email</h3><p class="mut" style="margin:0">Sheet antrean belum dibuat. Jalankan setup() di editor Apps Script.</p></div>';
  var tl = { konfirmasi: 'Konfirmasi pendaftaran', sertifikat: 'Sertifikat', pengingat: 'Pengingat' };
  var h = '<div class="card wide"><h3>Antrean Email</h3><p class="mut" style="margin-top:0">Google membatasi jumlah email per hari. Email yang melebihi kuota menunggu dan dikirim otomatis dengan urutan prioritas: sertifikat, konfirmasi, pengingat.</p>' +
    '<div class="row" style="justify-content:flex-start;gap:8px"><span class="badge ok">Sisa kuota hari ini: ' + esc(q.sisaKuota) + '</span><span class="badge ' + (q.menunggu ? 'warn' : '') + '">Menunggu: ' + esc(q.menunggu) + '</span><span class="badge ' + (q.gagal ? 'bad' : '') + '">Gagal: ' + esc(q.gagal) + '</span><span class="badge">Terkirim 24 jam: ' + esc(q.terkirim24) + '</span></div>';
  h += '<div style="grid-column:1/-1">' + (q.items && q.items.length ? q.items.map(function (i) {
    return '<div class="meta" style="margin:4px 0">' + esc(tl[i.tipe] || i.tipe) + ' &middot; ' + esc(i.tujuan) + ' &middot; <b>' + esc(i.status) + '</b>' + (i.percobaan ? ' (percobaan ' + esc(i.percobaan) + ')' : '') + (i.error ? '<br>' + esc(i.error) : '') + '</div>';
  }).join('') : '<p class="mut" style="margin:0">Tidak ada email yang menunggu atau gagal.</p>') + '</div>';
  return h + '<div class="row" style="justify-content:flex-start;gap:8px"><button class="btn sm" onclick="antreProses()">Kirim sekarang</button><button class="btn sm sec" onclick="antreUlang()">Coba ulang yang gagal</button></div></div>';
}
async function antreProses() { var r = await api('prosesAntreanManual', T); if (r) { toast(r); V.lap(); } }
async function antreUlang() { var r = await api('ulangGagal', T); if (r) { toast(r); V.lap(); } }
async function kirimUlangSert(b) {
  b.disabled = true; var r = await api('kirimUlangSertifikat', T, b.getAttribute('data-p')); b.disabled = false; if (r) toast(r);
}
V.lap = async function () {
  var res = await Promise.all([api('reportData', T), api('statusAntrean', T), api('statusBankSoal', T)]); var r = res[0], q = res[1], bs = res[2]; if (!r) return;
  var h = '<div class="tiles">' +
    tile('check', 'Tersertifikasi aktif', esc(r.aktif), 'dari ' + esc(r.total) + ' akun peserta') +
    tile('warn', 'Segera berakhir', esc(r.soon), 'dalam 30 hari') +
    tile('warn', 'Kedaluwarsa', esc(r.expired), 'wajib training ulang') +
    tile('user', 'Belum bersertifikat', esc(r.belum), 'belum lulus Post-test') + '</div>' +
    '<div class="card wide"><h3>Riwayat Training (' + r.trainings.length + ')</h3>';
  if (!r.trainings.length) h += '<p class="mut">Belum ada training.</p>';
  r.trainings.forEach(function (x) {
    var pct = x.hadir ? Math.round(x.lulus / x.hadir * 100) + '%' : '-', sid = esc(x.sid);
    h += '<div class="item"><div class="ib"><div class="row"><b>' + dt(x.tanggal) + '</b><span><span class="badge blue">' + esc(x.jenis) + '</span> ' +
      (x.status === 'aktif' ? '<span class="badge ok">aktif</span>' : '<span class="badge">selesai</span>') + '</span></div>' +
      '<div class="meta">Terdaftar ' + esc(x.daftar) + ' &middot; Hadir ' + esc(x.hadir) + ' &middot; Lulus ' + esc(x.lulus) + ' &middot; Kelulusan ' + pct + (x.evalN ? '<br>Evaluasi: ' + esc(x.evalN) + ' responden &middot; rata-rata ' + esc(x.evalAvg) + ' dari 5' : '') + '</div>' +
      '<div class="row" style="justify-content:flex-start"><button class="btn sm sec" onclick="dlXlsx(\'hadir\',\'' + sid + '\')">Daftar Hadir (Excel)</button>' +
      '<button class="btn sm sec" onclick="dlXlsx(\'kuis\',\'' + sid + '\')">Hasil Kuis (Excel)</button>' +
      (x.evalN ? '<button class="btn sm sec" onclick="dlXlsx(\'eval\',\'' + sid + '\')">Evaluasi (Excel)</button>' : '') + '</div></div></div>';
  });
  M(h + '</div>' + unitCard(r) + bankCard(bs) + qcard(q));
};

var reqRows = [], unitNames = [];
V.usr = async function () {
  var res = await Promise.all([api('listUsers', T), api('permintaanData', T), api('daftarUnit')]);
  userRows = res[0] || []; reqRows = res[1] || []; unitNames = res[2] || [];
  var pend = reqRows.filter(function (q) { return q.status === 'menunggu'; }), h = '';
  if (reqRows.length) h += '<div class="card wide"><h3>Permintaan Hapus Data (' + pend.length + ' menunggu)</h3><p class="mut" style="margin-top:0">Permintaan peserta atas hak penghapusan data pribadi. Tinjau dulu kewajiban penyimpanan data, misalnya rekam pelatihan untuk akreditasi, sebelum menyetujui.</p>' + reqRows.map(reqItem).join('') + '</div>';
  h += '<div class="card wide"><h3>Kelola Pengguna (' + userRows.length + ')</h3><p class="mut" style="margin-top:0">Pendaftar baru otomatis menjadi peserta. Naikkan menjadi trainer di sini. Pengguna perlu keluar lalu masuk lagi agar menu trainer muncul.</p>' +
    '<input id="u-q" placeholder="Cari nama, username, atau unit" oninput="renderUsers()"><div id="u-edit"></div><div id="u-list"></div></div>';
  M(h); renderUsers();
};
function reqItem(q) {
  var rid = esc(q.rid);
  return '<div class="item"><div class="ib"><div class="row"><b>' + esc(q.nama || q.username || '(data sudah dihapus)') + '</b>' + (q.status === 'menunggu' ? '<span class="badge warn">menunggu</span>' : q.status === 'selesai' ? '<span class="badge ok">selesai</span>' : '<span class="badge bad">ditolak</span>') + '</div>' +
    '<div class="meta">' + esc(q.username) + ' &middot; ' + esc(q.waktu) + (q.alasan ? '<br>Alasan: ' + esc(q.alasan) : '') + (q.catatan ? '<br>Catatan admin: ' + esc(q.catatan) : '') + '</div>' +
    (q.status === 'menunggu' ? '<textarea id="rq-' + rid + '" rows="2" maxlength="300" placeholder="Alasan penolakan (wajib bila ditolak)"></textarea><div class="row" style="justify-content:flex-start;gap:8px"><button class="btn sm dgr sec" data-p="' + rid + '" onclick="sure(this,\'rqSetuju\')">Setujui dan hapus akun</button><button class="btn sm sec" onclick="rqTolak(\'' + rid + '\')">Tolak</button></div>' : '') + '</div></div>';
}
async function rqSetuju(rid) { var r = await api('prosesPermintaan', T, rid, 'setuju', ''); if (r) { toast(r); V.usr(); } }
async function rqTolak(rid) { var r = await api('prosesPermintaan', T, rid, 'tolak', val('rq-' + rid)); if (r) { toast(r); V.usr(); } }
function editForm(uid) {
  var u = userRows.filter(function (z) { return z.uid === uid; })[0]; if (!u) return;
  $('u-edit').innerHTML = '<div class="card" style="border-color:var(--em);margin-bottom:12px"><h3>Edit: ' + esc(u.username) + '</h3><div class="g">' +
    '<div><label>Nama (sesuai KTP)</label><input id="e-nama" value="' + esc(u.nama) + '"></div><div><label>NIK</label><input id="e-nik" value="' + esc(u.nik) + '"></div>' +
    '<div><label>Tanggal lahir</label><input id="e-tgl" type="date" value="' + esc(u.tgl) + '"></div><div><label>Unit kerja</label>' + unitCtl('e-unit', u.unit, unitNames, false) + '</div>' +
    '<div><label>No. WhatsApp (awali +62)</label><input id="e-wa" value="' + esc(normWa(u.wa)) + '" onblur="this.value=normWa(this.value)"></div><div><label>Email</label><input id="e-email" value="' + esc(u.email) + '"></div></div>' +
    '<div class="row" style="justify-content:flex-start;gap:8px"><button class="btn sm" onclick="saveEdit(\'' + esc(u.uid) + '\')">Simpan</button><button class="btn sm sec" onclick="$(\'u-edit\').innerHTML=\'\'">Batal</button></div></div>';
  $('u-edit').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
async function saveEdit(uid) {
  var r = await api('editUser', T, uid, { nama_ktp: val('e-nama'), nik: val('e-nik'), tgl_lahir: val('e-tgl'), unit_kerja: val('e-unit'), no_wa: normWa(val('e-wa')), email: val('e-email') });
  if (r) { toast(r); V.usr(); }
}
function renderUsers() {
  var q = String(val('u-q') || '').toLowerCase();
  var f = userRows.filter(function (u) { return !q || (u.nama + ' ' + u.username + ' ' + u.unit).toLowerCase().indexOf(q) > -1; });
  var h = f.slice(0, 40).map(function (u) {
    var uid = esc(u.uid);
    var del = (u.role === 'admin' || (U && u.uid === U.uid)) ? '' : '<button class="btn sm dgr" data-u="' + uid + '" onclick="delUser(this)">Hapus</button>';
    var btn = u.role === 'admin' ? '' : u.role === 'trainer' ? '<button class="btn sm sec" onclick="chRole(\'' + uid + '\',\'peserta\')">Jadikan Peserta</button>' : '<button class="btn sm" onclick="chRole(\'' + uid + '\',\'trainer\')">Jadikan Trainer</button>';
    return '<div class="item"><div class="av sm">' + esc(ini(u.nama)) + '</div><div class="ib"><div class="row"><b>' + esc(u.nama) + '</b><span class="badge' + (u.role === 'peserta' ? '' : ' blue') + '">' + esc(u.role) + '</span></div>' +
      '<div class="meta">' + esc(u.username) + ' &middot; ' + esc(u.unit) + '</div><div class="row" style="justify-content:flex-start">' + btn + '<button class="btn sm sec" onclick="editForm(\'' + uid + '\')">Edit</button>' + del + '</div></div></div>';
  }).join('');
  if (f.length > 40) h += '<p class="mut">Menampilkan 40 dari ' + f.length + '. Persempit pencarian.</p>';
  $('u-list').innerHTML = h || '<p class="mut">Tidak ada hasil.</p>';
}
async function delUser(b) {
  if (!b.classList.contains('arm')) {
    b.classList.add('arm'); b.textContent = 'Klik lagi untuk menghapus';
    setTimeout(function () { b.classList.remove('arm'); b.textContent = 'Hapus'; }, 4000); return;
  }
  var id = b.getAttribute('data-u'); b.disabled = true;
  var r = await api('hapusUser', T, id);
  if (!r) { b.disabled = false; return; }
  toast(r); userRows = userRows.filter(function (u) { return u.uid !== id; }); renderUsers();
}
async function chRole(uid, role) {
  var r = await api('setRole', T, uid, role); if (!r) return;
  toast(r); userRows.forEach(function (u) { if (u.uid === uid) u.role = role; }); renderUsers();
}

var unitData = null;
V.unit = async function () {
  var u = await api('unitAdmin', T); if (!u) return; unitData = u;
  var names = u.units.map(function (z) { return z.unit; });
  var h = '<div class="card"><h3>Tambah Unit Kerja</h3><p class="mut" style="margin-top:0">' + (u.aktif ? 'Peserta wajib memilih unit dari daftar ini saat mendaftar dan mengubah profil.' : 'Belum ada unit baku, jadi peserta masih mengisi unit secara bebas. Setelah unit pertama ditambahkan, isian bebas diganti pilihan dari daftar.') + '</p>' +
    '<label>Nama unit</label><input id="un-n" maxlength="80"><label>Jumlah karyawan (opsional, untuk persentase di Laporan)</label><input id="un-k" inputmode="numeric"><button class="btn" onclick="unitSimpan()">Tambah / Perbarui</button></div>';
  if (u.units.length) h += '<div class="card wide"><h3>Daftar Unit (' + u.units.length + ')</h3>' + u.units.map(function (z) {
    var n = esc(z.unit);
    return '<div class="item"><div class="ib"><b>' + n + '</b><div class="meta">Pengguna: ' + esc(z.dipakai) + ' &middot; Karyawan: ' + (z.karyawan === '' ? '-' : esc(z.karyawan)) + '</div>' +
      '<div class="row" style="justify-content:flex-start;gap:6px"><input style="width:150px;margin:0" placeholder="Nama baru" data-u="' + n + '" id="rn-' + esc(names.indexOf(z.unit)) + '"><button class="btn sm sec" onclick="unitGanti(' + names.indexOf(z.unit) + ')">Ganti nama</button>' +
      '<button class="btn sm sec dgr" data-p="' + esc(names.indexOf(z.unit)) + '" onclick="sure(this,\'unitHapus\')"' + (z.dipakai ? ' disabled title="Masih dipakai"' : '') + '>Hapus</button></div></div></div>';
  }).join('') + '</div>';
  if (u.lain.length) h += '<div class="card wide"><h3>Perlu Dipetakan (' + u.lain.length + ')</h3><p class="mut" style="margin-top:0">Isian unit lama yang belum ada di daftar baku. Pilih unit tujuan agar laporan per unit akurat.</p>' + (u.aktif ? u.lain.map(function (z, i) {
    return '<div class="item"><div class="ib"><b>' + esc(z.nilai) + '</b><div class="meta">' + esc(z.jumlah) + ' pengguna</div><div class="row" style="justify-content:flex-start;gap:6px"><select id="pm-' + i + '" style="width:auto;max-width:220px;margin:0">' + names.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('') + '</select><button class="btn sm" onclick="unitPetakan(' + i + ')">Petakan</button></div></div></div>';
  }).join('') : '<p class="mut" style="margin:0">Tambahkan unit baku terlebih dahulu.</p>') + '</div>';
  M(h);
};
async function unitSimpan() { var r = await api('simpanUnit', T, val('un-n'), val('un-k')); if (r) { toast(r); V.unit(); } }
async function unitGanti(i) { var r = await api('gantiNamaUnit', T, unitData.units[i].unit, val('rn-' + i)); if (r) { toast(r); V.unit(); } }
async function unitHapus(i) { var r = await api('hapusUnit', T, unitData.units[+i].unit); if (r) { toast(r); V.unit(); } }
async function unitPetakan(i) { var r = await api('petakanUnit', T, unitData.lain[i].nilai, val('pm-' + i)); if (r) { toast(r); V.unit(); } }

V.log = async function () {
  var res = await Promise.all([api('statusCadangan', T), api('riwayatLog', T, '')]), c = res[0], lg = res[1] || [];
  M('<div class="card"><h3>Cadangan Data</h3><p class="mut" style="margin-top:0">Salinan seluruh data dibuat otomatis tiap malam (jika pasangTrigger() sudah dijalankan) dan disimpan ' + esc(c ? c.simpan : 14) + ' salinan terakhir di folder Drive "Cadangan SHLC".</p>' +
    '<div class="row" style="justify-content:flex-start;gap:8px"><span class="badge ' + (c && c.terakhir ? 'ok' : 'warn') + '">Terakhir: ' + (c && c.terakhir ? esc(c.terakhir) : 'belum ada') + '</span></div>' +
    '<div class="row" style="justify-content:flex-start;gap:8px;margin-top:12px"><button class="btn" onclick="cadangNow(this)">Cadangkan sekarang</button>' + (c && c.url ? '<a class="btn sec" style="text-decoration:none" target="_blank" href="' + esc(c.url) + '">Buka folder</a>' : '') + '</div></div>' +
    '<div class="card wide"><h3>Riwayat Perubahan</h3><div class="row" style="justify-content:flex-start;gap:8px"><button class="btn sec sm" onclick="dlB64(\'exportLog\')">Unduh Excel</button></div>' +
    '<input id="lg-q" placeholder="Cari pelaku, aksi, atau target" oninput="cariLog()"><div id="lg-list" style="grid-column:1/-1"></div></div>');
  renderLog(lg);
};
function renderLog(a) {
  var el = $('lg-list'); if (!el) return;
  el.innerHTML = a.length ? a.map(function (l) {
    return '<div class="meta" style="margin:6px 0;border-bottom:1px solid var(--bd);padding-bottom:6px"><b>' + esc(l.aksi) + '</b> &middot; ' + esc(l.target) + (l.detail ? ' &middot; ' + esc(l.detail) : '') + '<br>' + esc(l.waktu) + ' &middot; ' + esc(l.aktor) + ' (' + esc(l.peran) + ')</div>';
  }).join('') : '<p class="mut">Belum ada catatan.</p>';
}
var lgT = null;
function cariLog() { clearTimeout(lgT); lgT = setTimeout(async function () { var r = await api('riwayatLog', T, val('lg-q')); if (r) renderLog(r); }, 350); }
async function cadangNow(b) { b.disabled = true; var r = await api('cadangkanSekarang', T); b.disabled = false; if (r) { toast(r); V.log(); } }

V.rst = function () {
  M('<div class="card solo"><h3>Reset Password Pengguna</h3>' +
    '<label>Username</label><input id="x-u" autocapitalize="none"><label>Password baru (min. 8 karakter)</label><input id="x-p" type="password">' +
    '<button class="btn" onclick="admReset()">Reset Password</button></div>');
};
async function admReset() { var r = await api('adminReset', T, val('x-u'), val('x-p')); if (r) { toast(r); $('x-u').value = ''; $('x-p').value = ''; } }
