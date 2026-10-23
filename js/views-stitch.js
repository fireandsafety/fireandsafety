/* views-stitch.js - Beranda Peserta + Jadwal Trainer (markup Stitch asli, data nyata) */
function qrSvg(text, cls) {
  try { var q = qrcode(0, 'M'); q.addData(String(text)); q.make(); var h = q.createSvgTag({ cellSize: 6, margin: 0, scalable: true }); return cls ? h.replace('<svg', '<svg class="' + cls + '"') : h; }
  catch (e) { return ''; }
}
function tglMid(s) { var d = pd(s); return isNaN(d) ? '-' : HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BLN[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(); }
function tglLong(s) { var d = pd(s); return isNaN(d) ? '-' : d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear(); }
function verifUrl(kode) { return location.origin + location.pathname.replace(/[^\/]*$/, '') + '#/v/' + kode; }
function cardMsg(el, title, msg) { el.innerHTML = '<div class="flex items-center gap-3 mb-3"><span class="material-symbols-outlined text-secondary">info</span><h3 class="font-headline-sm text-headline-sm text-on-surface">' + esc(title) + '</h3></div><p class="font-body-md text-body-md text-on-surface-variant">' + esc(msg) + '</p>'; }

/* ===================== BERANDA PESERTA ===================== */
V.home = async function () {
  var res = await Promise.all([api('myStatus', T), api('getSchedule', T), api('myReg', T), api('myCert', T), api('evalStatus', T), api('quizStatus', T)]);
  var m = res[0], s = res[1], g = res[2], ct = res[3], ev = res[4], qs = res[5], r = MS(TPL.home);
  var st = m ? m.state : 'belum', online = s && s.jenis === 'online', done = g && s && g.sid === s.sid;
  /* hero sertifikasi */
  S(r, 'Sertifikasi Aktif & Terverifikasi', { ok: 'Sertifikasi Aktif & Terverifikasi', soon: 'Sertifikasi Segera Berakhir', expired: 'Sertifikasi Kedaluwarsa', belum: 'Belum Bersertifikat' }[st] || 'Belum Bersertifikat');
  var hp = [].slice.call(r.querySelectorAll('p')).filter(function (x) { return x.textContent.indexOf('Masa berlaku sertifikat Anda') > -1; })[0];
  if (hp) hp.innerHTML = st === 'belum' ? 'Daftar training lalu selesaikan Post-test dengan nilai minimal <span class="text-on-primary font-bold">80</span> untuk memperoleh sertifikat resmi <strong class="text-white">K3 SHLC</strong>.' :
    st === 'expired' ? 'Masa berlaku sertifikat Anda berakhir pada <span class="text-on-primary font-bold">' + esc(tglLong(m.exp)) + '</span>. <strong class="text-white">Wajib mengikuti training ulang</strong> sesuai standar <strong class="text-white">JCI</strong> &amp; <strong class="text-white">KARS</strong>.' :
    'Masa berlaku sertifikat Anda ' + (st === 'soon' ? 'segera berakhir pada ' : 'aman hingga ') + '<span class="text-on-primary font-bold">' + esc(tglLong(m.exp)) + '</span>. Diakui resmi untuk kebutuhan audit keselamatan berkala standar <strong class="text-white">JCI</strong> &amp; <strong class="text-white">KARS</strong>.';
  S(r, 'ICU (Intensive Care Unit)', U.unit_kerja || '-'); S(r, 'SHLC-2021-0842', U.nik || '-'); S(r, 'REG-2026-FST-0419', ct ? ct.nomor : (g ? g.pid : '-'));
  var sisa = m && m.sisa >= 0 ? m.sisa : 0, ring = r.querySelector('circle[stroke-dashoffset]');
  S(r, '324', sisa); if (ring) ring.setAttribute('stroke-dashoffset', String(Math.round(427 * (1 - Math.min(1, sisa / 365)))));
  S(r, 'Kondisi Prima', { ok: 'Kondisi Prima', soon: 'Segera Perpanjang', expired: 'Wajib Retraining', belum: 'Belum Bersertifikat' }[st] || '-');
  S(r, 'Siklus Evaluasi Tahunan #2026', 'Siklus Tahunan #' + (m && m.exp ? m.exp.slice(0, 4) : new Date().getFullYear()));
  /* tiga kartu ringkas */
  S(r, 'Jumat, 24 Okt 2026', s ? tglMid(s.tanggal) : 'Belum ada jadwal');
  S(r, 'Offline QR (Ruang Serbaguna Lt. 4)', s ? (online ? 'Online (kode absensi)' : 'Offline QR (scan oleh trainer)') : 'Menunggu jadwal dari trainer');
  S(r, 'Hadir Terkonfirmasi', g ? (g.status === 'Hadir' ? 'Hadir Terkonfirmasi' : g.status) : 'Belum Terdaftar');
  var ci = find(r, 'check_circle', '.material-symbols-outlined') || r.querySelector('.text-emerald-600.material-symbols-outlined'); if (ci && !(g && g.status === 'Hadir')) hid(ci);
  S(r, 'Metode: Scan QR Kamera Petugas', g ? 'Metode: ' + (g.jenis === 'online' ? 'Kode absensi online' : 'Scan QR oleh trainer') : 'Daftar pada jadwal di bawah');
  S(r, '92', qs && qs.best != null ? qs.best : '-'); S(r, 'Lulus (Standar KKM 80)', qs && qs.lulus ? 'Lulus (Standar KKM 80)' : 'Belum lulus (min. 80)');
  /* kartu jadwal */
  S(r, 'Simulasi Tanggap Darurat & Evakuasi Kebakaran Rumah Sakit (Code Red)', s ? 'Training Fire & Safety (' + (online ? 'Online' : 'Offline QR') + ')' : 'Belum ada jadwal training aktif');
  S(r, 'FST-2026-B10', s ? s.sid : '-'); S(r, 'Pendaftaran Dibuka', done ? 'Anda Sudah Terdaftar' : 'Pendaftaran Dibuka');
  if (s) {
    S(r, 'Jumat, 24 Oktober 2026', tglPanjang(s.tanggal)); S(r, '08.30 - 11.30 WIB (3 Jam)', jamTxt(s.tanggal));
    S(r, 'Auditorium Siloam Lt. 4', online ? 'Online (Meeting)' : 'Sesuai pengumuman trainer'); S(r, '& Lapangan Simulasi APAR SHLC', online ? 'Tautan meeting dibagikan trainer' : 'Siloam Hospitals Lippo Cikarang');
    S(r, 'Trainer: Tim Instruktur Sertifikasi BNSP Damkar & K3 SHLC', 'Trainer: Tim Instruktur K3 SHLC'); gone(find(r, 'Kuota Tersedia: 14/40'));
    var b1 = find(r, 'Daftar Sesi Ini', 'button');
    if (done) { setTxt(b1, 'Telah Terdaftar'); b1.disabled = true; b1.classList.remove('bg-secondary-container'); b1.classList.add('bg-emerald-600'); } else btn(r, 'Daftar Sesi Ini', reg);
    btn(r, 'Tambah ke Kalender (.ics)', function () { if (done) dlIcs(); else toast('Daftar dulu pada jadwal ini.'); });
    var gc = find(r, 'Google Kalender', 'a'); if (gc) { if (g && g.gcal) { gc.href = g.gcal; gc.target = '_blank'; gc.rel = 'noopener'; } else hid(gc); }
  } else { var gr = r.querySelector('[class~="md:grid-cols-2"]'); hid(find(r, 'Daftar Sesi Ini', 'button')); hid(find(r, 'Tambah ke Kalender (.ics)', 'button')); hid(find(r, 'Google Kalender', 'a')); hid(up(find(r, 'Hari & Waktu'), 3)); }
  /* kartu ID + QR */
  var idc = cardOf(find(r, 'ID Peserta Pelatihan'));
  if (!g) { hid(idc); } else {
    S(r, 'PID-SHLC-2026-0992', g.pid); S(r, 'Terdaftar & Siap', g.status === 'Hadir' ? 'Hadir Tercatat' : 'Terdaftar & Siap'); S(r, 'Sesi Aktif: Ruang Serbaguna Lt. 4', 'Sesi aktif: ' + tglMid(g.tanggal));
    var panel = up(find(r, 'Metode Cadangan Absensi Online'), 2), frame = r.querySelector('[class~="p-3.5"]'), qcol = frame && frame.parentElement, grid = qcol && qcol.parentElement;
    if (g.status === 'Hadir') { grid.innerHTML = '<div class="md:col-span-12 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 text-emerald-800"><span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">check_circle</span><div><div class="font-title-md text-title-md">Kehadiran tercatat</div><div class="font-body-sm text-body-sm">' + esc(g.waktu_hadir || '') + '</div></div></div>'; }
    else if (g.jenis === 'online') {
      hid(qcol); panel.className = panel.className.replace('md:col-span-7', 'md:col-span-12');
      S(r, 'Metode Cadangan Absensi Online', 'Absensi Online dengan Kode');
      S(r, 'Jika pemindai kamera terkendala, masukkan 6 digit token unik yang diumumkan Trainer di layar presentasi:', 'Masukkan kode absensi yang diumumkan trainer di meeting. Kode hanya diterima saat absensi dibuka.');
      var ti = $('tokenAbsensi'); if (ti) { ti.placeholder = 'Kode absensi'; ti.maxLength = 12; ti.inputMode = 'numeric'; }
      S(r, 'Token terenkripsi & diverifikasi instan oleh Komite K3', 'Diverifikasi langsung oleh sistem'); btn(r, 'Konfirmasi', function () { attend2($('tokenAbsensi').value); });
    } else {
      var svg = frame.querySelector('svg'); if (svg) { var w = document.createElement('div'); w.innerHTML = qrSvg(g.pid, svg.getAttribute('class')); var ns = w.firstChild; if (ns) svg.parentNode.replaceChild(ns, svg); }
      hid(panel); qcol.className = qcol.className.replace('md:col-span-5', 'md:col-span-12');
      S(r, 'Tunjukkan QR ini ke Trainer saat masuk ruangan', 'Tunjukkan QR ini ke trainer. ID: ' + g.pid);
    }
  }
  /* sertifikat digital */
  var cc = cardOf(find(r, 'Sertifikat Digital'));
  if (!ct) { cardMsg(cc, 'Sertifikat Digital', m && m.state !== 'belum' ? 'Sertifikat sedang disiapkan trainer dan akan dikirim ke email Anda.' : 'Sertifikat terbit otomatis setelah Anda lulus Post-test (nilai minimal 80).'); }
  else {
    S(r, 'Terverifikasi', st === 'ok' ? 'Terverifikasi' : st === 'soon' ? 'Segera Berakhir' : 'Kedaluwarsa');
    S(r, 'Ns. Siti Rahmawati, S.Kep', U.nama_ktp); S(r, 'Spesialisasi Evakuasi Pasien ICU & Penggunaan APAR Kelas A/B/C', 'Training Fire & Safety - ' + (U.unit_kerja || ''));
    S(r, 'ISO 45001:2018', 'FIRE & SAFETY'); S(r, 'KARS Accreditated', 'Komite K3 SHLC'); S(r, 'HASH: 9A48-E7F2', ct.kode ? 'KODE: ' + ct.kode : '');
    S(r, 'SHLC/K3/FST/2026/X/0419', ct.nomor); S(r, '14 Oktober 2026', tglLong(ct.waktu || (m && m.lulus))); S(r, '14 Oktober 2027', m && m.exp ? tglLong(m.exp) : '-');
    btn(r, 'Unduh Sertifikat PDF Resmi', function () { window.open(ct.url, '_blank', 'noopener'); });
    var vb = find(r, 'Buka Halaman Verifikasi Publik', 'a'); if (vb) { if (ct.kode) { vb.href = verifUrl(ct.kode); vb.target = '_blank'; } else hid(vb); }
    var pv = find(r, 'Pratinjau Dokumen'); if (pv) up(pv, 1).onclick = function () { window.open(ct.url, '_blank', 'noopener'); };
  }
  /* evaluasi */
  var ec = cardOf(find(r, 'Evaluasi Sesi Training'));
  if (!ev || !ev.boleh) { cardMsg(ec, 'Evaluasi Sesi Training', 'Evaluasi dapat diisi setelah Anda lulus Post-test.'); }
  else if (ev.sudah) { cardMsg(ec, 'Evaluasi Sesi Training', 'Terima kasih, evaluasi Anda sudah kami terima.'); }
  else {
    EVR = [0, 0, 0, 0, 0];
    [].slice.call(r.querySelectorAll('[data-rating-row]')).forEach(function (row, i) {
      var lab = row.querySelector('span'); setTxt(lab, (i + 1) + '. ' + (ev.pertanyaan[i] || ''));
      var stars = row.querySelectorAll('[data-idx]'); stars.forEach(function (sp) {
        sp.style.fontVariationSettings = "'FILL' 0"; sp.classList.remove('text-amber-400'); sp.classList.add('text-slate-300'); sp.style.cursor = 'pointer';
        sp.onclick = function () { var k = +sp.getAttribute('data-idx'); EVR[i] = k; stars.forEach(function (z) { var on = +z.getAttribute('data-idx') <= k; z.style.fontVariationSettings = on ? "'FILL' 1" : "'FILL' 0"; z.classList.toggle('text-amber-400', on); z.classList.toggle('text-slate-300', !on); }); };
      });
    });
    btn(r, 'Kirim Evaluasi Anonim', sendEval2);
  }
};
var EVR = [0, 0, 0, 0, 0];
async function sendEval2() {
  if (EVR.some(function (x) { return !x; })) { toast('Beri bintang untuk kelima butir penilaian.'); return; }
  var f = $('evalFeedback'), r = await api('kirimEvaluasi', T, EVR, f ? f.value : ''); if (r) { toast(r); V.home(); }
}
async function attend2(kode) { var r = await api('attendOnline', T, kode); if (r) { toast(r); V.home(); } }

/* ===================== JADWAL TRAINER ===================== */
var rosterPage = 1, rosterQ = '', ROSTER = [], TPLR = null, jdTimer = null;
function fmtFormat(f, no) {
  var d = new Date(), RM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return String(f || '').replace(/\{NO\}/g, ('000' + no).slice(-Math.max(3, String(no).length))).replace(/\{TAHUN\}/g, d.getFullYear()).replace(/\{BULAN_ROMAWI\}/g, RM[d.getMonth() + 1]).replace(/\{BULAN\}/g, ('0' + (d.getMonth() + 1)).slice(-2));
}
V.jadwal = async function () {
  if (jdTimer) { clearInterval(jdTimer); jdTimer = null; }
  var d = await api('roster', T), s = d && d.schedule, rows = d ? d.rows : [], m = MS(TPL.jadwal); selPid = {}; ROSTER = rows; rosterPage = 1; rosterQ = '';
  var online = s && s.jenis === 'online';
  /* --- form jadwal --- */
  var tg = $('inp-jadwal-tanggal'); tg.type = 'datetime-local'; tg.value = ''; tg.id = 'j-tgl';
  var sel = $('sel-metode'); sel.id = 'j-jenis'; sel.innerHTML = '<option value="offline">Offline QR - kehadiran dipindai trainer</option><option value="online">Online - kehadiran dengan kode absensi</option>';
  var lk = $('inp-link-meeting'); lk.id = 'j-link'; lk.value = ''; lk.placeholder = 'https://meet.google.com/...'; var lkw = up(lk, 2); lkw.classList.add('hidden');
  sel.onchange = function () { lkw.classList.toggle('hidden', sel.value !== 'online'); };
  S(m, 'Tautan Video Conference (Opsional Cadangan)', 'Tautan Meeting (untuk metode Online)'); S(m, 'Digunakan bagi delegasi perawat siaga yang memantau pengarahan via tablet unit.', 'Tautan dibagikan ke peserta pada jadwal online.');
  S(m, 'Jadwal baru otomatis mengarsipkan jadwal sebelumnya dan menyinkronkan antrean absensi unit terkait ke data registrasi SIMRS.', 'Jadwal baru menggantikan jadwal aktif sebelumnya. Post-test dan absensi online tertutup sampai trainer membukanya.');
  btn(m, 'Publikasikan Jadwal Baru', saveSch2);
  /* --- nomor sertifikat --- */
  var fm = $('inp-format-cert'), na = $('inp-nomor-awal'), prev = find(m, 'SHLC/K3/FST/2026/X/0419');
  fm.value = s ? (s.fmt_nomor || '') : ''; fm.placeholder = '{NO}/SHLC/FS/{BULAN_ROMAWI}/{TAHUN}'; na.value = s ? (s.no_awal || 1) : 1; na.type = 'number'; na.min = 1; if (s && s.no_urut) na.disabled = true; if (!s) { fm.disabled = true; na.disabled = true; }
  var upd = function () { var f = fm.value; setTxt(prev, f && f.indexOf('{NO}') > -1 ? fmtFormat(f, +na.value || 1) : 'Format harus memuat {NO}'); };
  fm.oninput = upd; na.oninput = upd; upd();
  S(m, '{NO} / {BULAN} / {TAHUN} / K3-SHLC', '{NO} {BULAN} {BULAN_ROMAWI} {TAHUN}'); S(m, 'Output otomatis untuk setiap staf berstatus kelulusan post-test ≥ 75.', 'Output otomatis untuk setiap peserta yang lulus Post-test (nilai minimal 80).');
  S(m, 'Nomor Urut Awal Dokumen', 'Nomor Urut Awal'); btn(m, 'Simpan & Terapkan Format', saveCert2);
  /* --- walk-in --- */
  var wq = m.querySelector('input[type="search"]'); wq.id = 'wk-q'; wq.placeholder = 'Cari nama, NIK, username, atau unit (min. 2 huruf)';
  var wbox = wq.parentElement.nextElementSibling; var wtpl = wbox.firstElementChild.cloneNode(true); wbox.innerHTML = '';
  var wk = function (res) {
    wbox.innerHTML = ''; if (!res.length) { wbox.innerHTML = '<p class="font-body-sm text-body-sm text-on-surface-variant">Tidak ada hasil.</p>'; return; }
    res.slice(0, 8).forEach(function (u) {
      var n = wtpl.cloneNode(true), p = n.querySelectorAll('p'); n.querySelector('div > div').textContent = ini(u.nama); setTxt(p[0], u.nama); setTxt(p[1], u.username + ' - ' + u.unit);
      var bs = n.querySelectorAll('button');
      if (u.pid) { bs[0].parentNode.innerHTML = '<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">Sudah terdaftar</span>'; }
      else { bs[0].onclick = function () { daftarWk(u.uid, false); }; bs[1].onclick = function () { daftarWk(u.uid, true); }; }
      wbox.appendChild(n);
    });
  };
  var wT = null; wq.oninput = function () { clearTimeout(wT); wT = setTimeout(async function () { var q = wq.value.trim(); if (q.length < 2) { wbox.innerHTML = ''; return; } var res = await api('cariPeserta', T, q); if (res) wk(res); }, 350); };
  /* --- sisi kanan --- */
  var right = up(find(m, 'Daftar Peserta Sesi Ini'), 5) ? m.querySelector('[class~="lg:col-span-7"]') : null;
  if (!s) {
    var sec0 = m.querySelector('section'); right.innerHTML = '<section class="' + sec0.className + '"><div class="flex flex-col items-center text-center gap-3 py-10"><span class="material-symbols-outlined text-[48px] text-outline">event_busy</span><h2 class="font-headline-sm text-headline-sm text-on-surface">Belum ada jadwal aktif</h2><p class="font-body-sm text-body-sm text-on-surface-variant max-w-sm">Publikasikan jadwal pada formulir di sebelah kiri untuk mulai membuka pendaftaran, absensi, dan Post-test.</p></div></section>';
    return;
  }
  var hd = rows.filter(function (x) { return x.status === 'Hadir'; }).length, pre = rows.filter(function (x) { return x.status === 'Hadir' && x.pre !== ''; }).length, lul = rows.filter(function (x) { return +x.post >= 80; }).length;
  S(m, 'Sesi Berlangsung', 'Sesi Aktif'); gone(find(m, 'W-13')); gone(up(find(m, 'Sync Live Server K3RS'), 1)); S(m, 'Metode Pelatihan Tanggap Darurat', 'Metode Pelatihan'); S(m, '24 Okt 2026', tglPendek(s.tanggal)); S(m, 'Simulasi Tanggap Darurat & Evakuasi (Code Red)', 'Training Fire & Safety (' + (online ? 'Online' : 'Offline QR') + ')');
  S(m, 'Koordinator Lapangan: Dr. Ferry Hidayat • Lokasi Lapangan Simulasi Timur', 'Koordinator: ' + U.nama_ktp + ' - ' + tglPanjang(s.tanggal) + ', ' + jamTxt(s.tanggal));
  var tgt = find(m, '48 Staf'); if (tgt) setTxt(tgt, rows.length);
  S(m, '42', hd); S(m, '40', pre); S(m, '28', lul);
  /* post-test */
  var pOpen = !!s.post_buka, pb = find(m, 'Aktif s/d 17.00 WIB');
  setTxt(pb, pOpen ? 'Dibuka' + (s.post_tutup ? ' s/d ' + jamTxt(s.post_tutup) : ' (tanpa batas)') : 'Tertutup');
  if (!pOpen) { pb.className = pb.className.replace(/bg-\S+/g, '').replace(/text-\S+/g, '') + ' bg-surface-container-high text-on-surface-variant'; }
  var tm = $('posttest-timer'), tutup = s.post_tutup ? pd(s.post_tutup) : null;
  var tick = function () { if (!pOpen) { tm.textContent = 'Tertutup'; return; } if (!tutup || isNaN(tutup)) { tm.textContent = 'Tanpa batas'; return; } var ms = tutup - new Date(); if (ms <= 0) { tm.textContent = '00:00:00'; return; } var z = function (n) { return ('0' + n).slice(-2); }; tm.textContent = z(Math.floor(ms / 36e5)) + ':' + z(Math.floor(ms % 36e5 / 6e4)) + ':' + z(Math.floor(ms % 6e4 / 1e3)); };
  tick(); if (pOpen && tutup) jdTimer = setInterval(function () { if (!$('posttest-timer')) { clearInterval(jdTimer); return; } tick(); }, 1000);
  S(m, 'sisa durasi pengerjaan', pOpen ? (tutup ? 'sisa durasi pengerjaan' : 'ditutup manual oleh trainer') : 'Buka setelah materi selesai');
  var sd = $('sel-durasi'); sd.innerHTML = [30, 45, 60, 90, 0].map(function (v) { return '<option value="' + v + '"' + (v === 45 ? ' selected' : '') + '>' + (v ? v + ' Menit' : 'Tanpa batas') + '</option>'; }).join('');
  btn(m, 'Buka Post', ptOpen2); btn(m, 'Tutup Post', ptClose);
  /* absen online */
  var aOpen = !!s.absen_buka, apb = find(m, 'Aktif 45 Menit'), code = $('code-val');
  if (online) {
    setTxt(apb, aOpen ? 'Dibuka' + (s.absen_tutup ? ' s/d ' + jamTxt(s.absen_tutup) : '') : 'Tertutup'); if (!aOpen) apb.className = apb.className.replace(/bg-\S+/g, '').replace(/text-\S+/g, '') + ' bg-surface-container-high text-on-surface-variant';
    code.textContent = s.kode_absen || '------'; var cp = m.querySelector('[title="Salin Kode PIN"]'); if (cp) cp.onclick = function () { copyTxt(s.kode_absen || ''); };
    gone(up(find(m, 'Validasi SIMRS Siap'), 1));
    var tb = find(m, 'Tutup Absen', 'button');
    if (aOpen) btn(m, 'Tutup Absen', abClose); else { setTxt(tb, 'Buka Absen 30 Menit'); tb.onclick = function () { abOpen2(30); }; }
    btn(m, 'Ganti Kode Acak', abNew);
  } else {
    var ap = up(find(m, 'Absen Cadangan'), 3); setTxt(apb, 'Tidak dipakai'); apb.className = apb.className.replace(/bg-\S+/g, '').replace(/text-\S+/g, '') + ' bg-surface-container-high text-on-surface-variant';
    S(m, 'Gunakan bila pemindaian QR Barcode lapangan mengalami kendala konektivitas.', 'Jadwal Offline: kehadiran dicatat dengan Scan QR peserta. Absensi kode hanya untuk jadwal Online.');
    var pin = up(code, 2); if (pin) hid(pin); gone(up(find(m, 'Validasi SIMRS Siap'), 1)); hid(up(find(m, 'Tutup Absen', 'button'), 1));
  }
  S(m, 'WhatsApp Blast Reminder', 'Kirim Pengingat Email'); btn(m, 'Kirim Pengingat Email', function () { remind(this); });
  btn(m, 'Daftar Hadir (Excel)', function () { dlXlsx('hadir'); }); btn(m, 'Hasil Kuis (Excel)', function () { dlXlsx('kuis'); });
  /* tabel peserta */
  S(m, '48 Terdata', rows.length + ' Terdata'); S(m, 'Log real-time kehadiran aparatur & verifikasi kompetensi evakuasi K3RS', 'Kehadiran, nilai Pre-test dan Post-test peserta pada sesi ini');
  var tbody = m.querySelector('tbody'); TPLR = { hadir: tbody.children[0].cloneNode(true), daftar: tbody.children[3].cloneNode(true), pg: null };
  var pgw = tbody.closest('section').querySelector('[class~="mt-4"]'); TPLR.pg = pgw; TPLR.pgBtns = [].slice.call(pgw.querySelectorAll('button')).map(function (b) { return b.cloneNode(true); });
  var fq = m.querySelector('input[placeholder="Filter nama/unit..."]'); fq.oninput = function () { rosterQ = fq.value.toLowerCase(); rosterPage = 1; renderRoster(); };
  var hc = m.querySelector('thead input[type="checkbox"]'); hc.checked = false; hc.onchange = function () { pageRows().forEach(function (x) { if (x.status !== 'Hadir') { if (hc.checked) selPid[x.pid] = 1; else delete selPid[x.pid]; } }); renderRoster(); };
  btn(m, 'Tandai Hadir Massal', bulkHadir); btn(m, 'Batalkan', function () { selPid = {}; renderRoster(); }); hid(find(m, 'Pengingat Post-test', 'button'));
  renderRoster();
};
function filtRows() { return ROSTER.filter(function (x) { return !rosterQ || (x.nama + ' ' + x.unit + ' ' + x.nik + ' ' + x.pid).toLowerCase().indexOf(rosterQ) > -1; }); }
function pageRows() { var f = filtRows(); return f.slice((rosterPage - 1) * 15, rosterPage * 15); }
function renderRoster() {
  var m = $('M'), tbody = m.querySelector('tbody'); if (!tbody || !TPLR) return; tbody.innerHTML = '';
  var f = filtRows(), pr = pageRows();
  pr.forEach(function (x) {
    var hadir = x.status === 'Hadir', tr = (hadir ? TPLR.hadir : TPLR.daftar).cloneNode(true), td = tr.querySelectorAll(':scope > td'), p = esc(x.pid);
    var cb = td[0].querySelector('input'); if (hadir) { cb.disabled = true; cb.checked = false; cb.style.opacity = '.35'; } else { cb.checked = !!selPid[x.pid]; cb.onchange = function () { if (cb.checked) selPid[x.pid] = 1; else delete selPid[x.pid]; updBulk(); }; }
    var dv = td[1].querySelectorAll('div'); setTxt(dv[0], x.nama); setTxt(dv[1], 'NIK: ' + x.nik + ' • ' + x.pid);
    setTxt(td[2].querySelector('span'), x.unit || '-');
    setTxt(td[3].querySelector('span'), x.status);
    if (hadir) {
      var t4 = td[4].querySelectorAll(':scope > div'); setTxt(t4[0], 'Hadir tercatat'); if (t4[1]) t4[1].innerHTML = '<span class="material-symbols-outlined text-[14px]">' + (online_(x) ? 'pin' : 'qr_code_scanner') + '</span> ' + (x.nomor ? 'Sertifikat terbit' : 'Menunggu Post-test');
      var sp = td[5].querySelectorAll('span'); sp.forEach(function (z) { z.classList.add('whitespace-nowrap'); }); setTxt(sp[0], 'Pre: ' + (x.pre === '' ? '-' : x.pre)); setTxt(sp[2], x.post ? 'Post: ' + x.post + (x.percobaan > 1 ? ' (' + x.percobaan + 'x)' : '') : 'Post: -');
      var ac = td[6].querySelector('div'); ac.innerHTML = '';
      if (x.nomor) ac.appendChild(ibtn('verified', 'Kirim ulang email sertifikat', function () { kirimUlangSert(this); }, x.pid));
      else ac.appendChild(ibtn('undo', 'Batalkan hadir', function () { if (confirm('Batalkan kehadiran peserta ini?')) batalHadir(x.pid); }, x.pid));
    } else {
      td[6].querySelector('div').innerHTML = ''; var ac2 = td[6].querySelector('div');
      var ab = document.createElement('button'); ab.type = 'button'; ab.title = 'Catat hadir manual'; ab.textContent = 'Absenkan'; ab.className = TPLR.daftar.querySelector('td:last-child button').className; ab.onclick = function () { markRow(x.pid); }; ac2.appendChild(ab);
      if (x.pre === '') ac2.appendChild(ibtn('close', 'Batalkan pendaftaran', function () { if (confirm('Batalkan pendaftaran peserta ini?')) batalDaftar(x.pid); }, x.pid));
    }
    tbody.appendChild(tr);
  });
  if (!pr.length) tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center font-body-sm text-body-sm text-on-surface-variant">Tidak ada peserta.</td></tr>';
  var pgw = tbody.closest('section').querySelector('[class~="mt-4"]'), st = pgw.querySelectorAll('strong'); if (st[0]) st[0].textContent = pr.length; if (st[1]) st[1].textContent = f.length;
  var sy = find(pgw, 'Sinkronisasi SIMRS Aktif'); if (sy) { var bp = sy.previousElementSibling; gone(bp); gone(sy); }
  var np = Math.max(1, Math.ceil(f.length / 15)), box = pgw.lastElementChild; box.innerHTML = '';
  var mk = function (i, fn, dis) { var b = TPLR.pgBtns[i].cloneNode(true); b.onclick = fn; if (dis) b.disabled = true; box.appendChild(b); return b; };
  mk(0, function () { if (rosterPage > 1) { rosterPage--; renderRoster(); } }, rosterPage <= 1);
  var a = Math.max(1, rosterPage - 2), z = Math.min(np, a + 4); a = Math.max(1, z - 4);
  for (var i = a; i <= z; i++) (function (i) { var b = TPLR.pgBtns[i === rosterPage ? 1 : 2].cloneNode(true); b.textContent = i; b.onclick = function () { rosterPage = i; renderRoster(); }; box.appendChild(b); })(i);
  mk(TPLR.pgBtns.length - 1, function () { if (rosterPage < np) { rosterPage++; renderRoster(); } }, rosterPage >= np);
  var hc = $('M').querySelector('thead input[type="checkbox"]'); if (hc) hc.checked = pr.some(function (x) { return x.status !== 'Hadir'; }) && pr.filter(function (x) { return x.status !== 'Hadir'; }).every(function (x) { return selPid[x.pid]; });
  updBulk();
}
function online_(x) { return false; }
function ibtn(icon, title, fn, pid) {
  var b = document.createElement('button'); b.type = 'button'; b.title = title; b.setAttribute('data-p', pid); b.className = 'p-1 rounded-md text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-all';
  b.innerHTML = '<span class="material-symbols-outlined text-[18px]">' + icon + '</span>'; b.onclick = fn; return b;
}
function updBulk() {
  var n = Object.keys(selPid).length, bar = find($('M'), 'Tandai Hadir Massal', 'button'); if (!bar) return; var wrap = up(bar, 2);
  wrap.classList.toggle('hidden', !n); var c = $('bulk-counter'); if (c) c.textContent = n;
}
async function saveSch2() {
  var r = await api('setSchedule', T, { tanggal: val('j-tgl'), jenis: val('j-jenis'), link: val('j-link') }); if (r) { toast(r); V.jadwal(); }
}
async function saveCert2() { var r = await api('setCertFormat', T, val('inp-format-cert'), val('inp-nomor-awal')); if (r) { toast(r); V.jadwal(); } }
async function ptOpen2() { var r = await api('setPostTest', T, 'buka', parseInt(val('sel-durasi'), 10) || 0); if (r) { toast(r); V.jadwal(); } }
async function ptOpen() { return ptOpen2(); }
async function ptClose() { var r = await api('setPostTest', T, 'tutup', 0); if (r) { toast(r); V.jadwal(); } }
async function abOpen2(m) { var r = await api('setAbsen', T, 'buka', m); if (r) { toast(r); V.jadwal(); } }
