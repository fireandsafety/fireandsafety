function ring(days, pct, sub) {
  var C = 314.16, off = (C * (1 - pct / 100)).toFixed(1);
  return '<div class="ring"><svg viewBox="0 0 120 120"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf3a"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>' +
    '<circle cx="60" cy="60" r="50" class="rb"/><circle cx="60" cy="60" r="50" class="rf" style="stroke-dasharray:314.16;stroke-dashoffset:' + off + '"/></svg>' +
    '<div class="rc"><b>' + days + '</b><span>' + (sub || 'hari') + '</span></div></div>';
}
function stCard(m) {
  if (!m || m.state === 'belum') return '<div class="st gry"><div><div class="lbl">Status sertifikasi</div><div class="big">Belum bersertifikat</div><p>Daftar training dan selesaikan Post-test (nilai &ge; 80).</p></div>' + ring('0', 0, 'belum lulus') + '</div>';
  var c = m.state === 'ok' ? 'grn' : m.state === 'soon' ? 'amb' : 'red';
  var pct = Math.max(0, Math.min(100, Math.round(m.sisa / 365 * 100)));
  var lbl = m.state === 'expired' ? 'Sertifikasi kedaluwarsa' : m.state === 'soon' ? 'Segera berakhir' : 'Sertifikasi aktif';
  var big = m.sisa >= 0 ? m.sisa + ' hari lagi' : 'Lewat ' + (-m.sisa) + ' hari';
  var note = m.state === 'expired' ? '<p><b>Anda wajib mengikuti training ulang.</b></p>' : m.state === 'soon' ? '<p><b>Segera daftar training berikutnya.</b></p>' : '';
  return '<div class="st ' + c + '"><div><div class="lbl">' + lbl + '</div><div class="big">' + big + '</div>' +
    '<p>Lulus ' + esc(m.lulus) + ' &middot; Berlaku sampai ' + esc(m.exp) + '</p>' + note + '</div>' + ring(m.sisa >= 0 ? m.sisa : 0, pct) + '</div>';
}
function tile(i, l, v, s) {
  return '<div class="tile"><div class="ti">' + ic(i) + '</div><div class="tl">' + l + '</div><div class="tv">' + v + '</div><div class="ts">' + s + '</div></div>';
}
function cd(tg) {
  var t = pd(tg), n = new Date();
  if (isNaN(t)) return '-';
  if (t < n) return 'Sudah lewat';
  var d = Math.round((new Date(t.getFullYear(), t.getMonth(), t.getDate()) - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5);
  return d <= 0 ? 'Hari ini' : 'H-' + d;
}
function wa(x, soon) {
  var n = waNum(x.wa); if (!n) return '';
  var m = soon ? 'Halo ' + x.nama + ', sertifikasi Fire & Safety Anda akan berakhir pada ' + x.exp + '. Mohon segera mendaftar training berikutnya di aplikasi SHLC.'
    : 'Halo ' + x.nama + ', sertifikasi Fire & Safety Anda telah kedaluwarsa pada ' + x.exp + '. Mohon segera mendaftar training ulang di aplikasi SHLC.';
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(m);
}
function certForm(s) {
  var contoh = '';
  if (s.fmt_nomor) {
    contoh = 'Contoh hasil: ' + esc(s.fmt_nomor.replace('{NO}', String(+s.no_awal || 1).padStart(3, '0'))) + (s.no_urut ? ' &middot; nomor terakhir terpakai: ' + esc(s.no_urut) : '');
  } else contoh = 'Belum diatur. Sertifikat terbit otomatis setelah nomor diatur.';
  return '<div class="card"><h3>Nomor Sertifikat Kegiatan</h3>' +
    '<label>Format nomor (gunakan {NO} untuk nomor urut)</label><input id="c-fmt" value="' + esc(s.fmt_nomor || '') + '" placeholder="{NO}/SHLC/FS/X/2026">' +
    '<label>Nomor awal</label><input id="c-awal" type="number" min="1" value="' + esc(s.no_awal || 1) + '"' + (s.no_urut ? ' disabled' : '') + '>' +
    '<p class="mut" style="margin-top:0">' + contoh + '</p>' +
    '<button class="btn" onclick="saveCert()">Simpan &amp; Terbitkan</button></div>';
}
async function saveCert() { var r = await api('setCertFormat', T, val('c-fmt'), val('c-awal')); if (r) { toast(r); V.jadwal(); } }

V.home = async function () {
  var res = await Promise.all([api('myStatus', T), api('getSchedule', T), api('myReg', T), api('myCert', T), api('evalStatus', T)]);
  var m = res[0], s = res[1], g = res[2], ct = res[3], ev = res[4];
  var ban = m ? stCard(m) : '<div class="ban amb">Status sertifikasi belum dapat dimuat. Muat ulang halaman ini.</div>';
  var tiles = '<div class="tiles">' +
    tile('cal', 'Jadwal terdekat', s ? cd(s.tanggal) : '-', s ? dt(s.tanggal) : 'Belum ada jadwal') +
    tile('check', 'Kehadiran', g ? esc(g.status) : 'Belum daftar', g ? esc(g.pid) : 'Daftar di bawah') + '</div>';
  var sch = '<p class="mut">Belum ada jadwal training aktif.</p>';
  if (s) {
    var done = g && g.sid === s.sid;
    sch = '<p style="margin-top:0"><b>' + dt(s.tanggal) + '</b> <span class="badge blue">' + esc(s.jenis) + '</span> <span class="badge">' + cd(s.tanggal) + '</span></p>' +
      (s.jenis === 'online' ? '<p>Link meeting: <a href="' + esc(s.link) + '" target="_blank">' + esc(s.link) + '</a></p>' : '') +
      (done ? '<p class="mut" style="margin-bottom:0">Anda sudah terdaftar pada jadwal ini.</p>' : '<button class="btn" onclick="reg()">Daftar Training Terdekat</button>');
  }
  var rg = '';
  if (g) {
    rg = '<div class="card"><h3>Registrasi Saya</h3><p style="margin-top:0">ID Partisipan: <b>' + esc(g.pid) + '</b> ' + bdg(g.status) + '</p>';
    if (g.status === 'Hadir') rg += '<p class="mut" style="margin-bottom:0">Hadir: ' + esc(g.waktu_hadir) + '</p>';
    else if (g.jenis === 'offline') rg += '<p class="mut">Tunjukkan QR ini kepada trainer:</p><div class="qrbox" id="my-qr"></div><p class="mut" style="margin:8px 0 0">ID: <b>' + esc(g.pid) + '</b>. Naikkan kecerahan layar HP dan jangan arahkan sinar langsung ke layar saat discan.</p>';
    else rg += '<label>Kode absensi (diumumkan trainer di meeting)</label><input id="a-kode" inputmode="numeric"><button class="btn" onclick="attend()">Konfirmasi Kehadiran</button>';
    if (g.gcal && pd(g.tanggal) > new Date()) rg += '<div class="row" style="justify-content:flex-start;margin-top:12px"><a class="btn sm sec" style="text-decoration:none" target="_blank" href="' + esc(g.gcal) + '">Tambah ke Google Kalender</a><button class="btn sm sec" onclick="dlIcs()">Unduh .ics (iPhone/Outlook)</button></div>';
    rg += '</div>';
  }
  var cc = '';
  if (ct) cc = '<div class="card"><h3>Sertifikat</h3><p style="margin-top:0">No. <b>' + esc(ct.nomor) + '</b></p><a class="btn" style="text-decoration:none" href="' + esc(ct.url) + '" target="_blank">Unduh Sertifikat (PDF)</a></div>';
  else if (m && m.state !== 'belum') cc = '<div class="card"><h3>Sertifikat</h3><p class="mut" style="margin:0">Sertifikat sedang disiapkan trainer dan akan dikirim ke email Anda.</p></div>';
  M(ban + tiles + '<div class="card"><h3>Jadwal Training Terdekat</h3>' + sch + '</div>' + rg + cc + evCard(ev));
  if ($('my-qr')) drawQr('my-qr', g.pid);
};
function evCard(e) {
  if (!e || !e.boleh) return '';
  if (e.sudah) return '<div class="card"><h3>Evaluasi Training</h3><p class="mut" style="margin:0">Terima kasih, evaluasi Anda sudah kami terima.</p></div>';
  var h = '<div class="card"><h3>Evaluasi Training</h3><p class="mut" style="margin-top:0">Bantu kami meningkatkan training. Nilai 1 (sangat kurang) sampai 5 (sangat baik). Evaluasi tidak menampilkan nama Anda kepada trainer.</p>';
  e.pertanyaan.forEach(function (q, i) {
    h += '<p style="margin:12px 0 6px"><b>' + (i + 1) + '. ' + esc(q) + '</b></p><div class="rts">' + [1, 2, 3, 4, 5].map(function (n) { return '<label class="rt"><input type="radio" name="ev' + i + '" value="' + n + '"><span>' + n + '</span></label>'; }).join('') + '</div>';
  });
  return h + '<label style="margin-top:14px;display:block">Saran atau komentar (opsional)</label><textarea id="ev-s" rows="3" maxlength="500"></textarea><button class="btn" onclick="sendEval()">Kirim Evaluasi</button></div>';
}
async function sendEval() {
  var a = [];
  for (var i = 0; i < 5; i++) { var c = document.querySelector('input[name="ev' + i + '"]:checked'); if (!c) { toast('Isi semua penilaian (1 sampai 5).'); return; } a.push(+c.value); }
  var r = await api('kirimEvaluasi', T, a, val('ev-s')); if (r) { toast(r); V.home(); }
}
function drawQr(id, text) {
  try { var q = qrcode(0, 'M'); q.addData(String(text)); q.make(); $(id).innerHTML = q.createSvgTag({ cellSize: 6, margin: 24, scalable: true }); }
  catch (e) { $(id).innerHTML = '<p class="mut">QR tidak dapat ditampilkan. Sebutkan ID Partisipan kepada trainer.</p>'; }
}
async function reg() { var r = await api('register', T); if (r) { toast(r); V.home(); } }
async function attend() { var r = await api('attendOnline', T, val('a-kode')); if (r) { toast(r); V.home(); } }

V.quiz = async function () {
  if (quizPoll) { clearInterval(quizPoll); quizPoll = null; }
  var s = await api('quizStatus', T); if (!s) return;
  Q = null;
  function step(n, t, st, d) { return '<div class="stp ' + st + '"><div class="sn">' + (st === 'done' ? '&#10003;' : n) + '</div><div><b>' + t + '</b><small>' + d + '</small></div></div>'; }
  var hasPre = s.pre !== null, terbuka = !!s.postBuka;
  var s1 = s.hadir ? 'done' : 'now', s2 = !s.hadir ? 'lock' : hasPre ? 'done' : 'now', s3 = !s.hadir || !hasPre ? 'lock' : s.lulus ? 'done' : (terbuka ? 'now' : 'lock');
  var d3 = s.lulus ? 'Lulus (nilai terbaik ' + esc(s.best) + ')' : (s.hadir && hasPre && !terbuka ? 'Menunggu trainer membuka Post-test' :
    (terbuka ? 'Dibuka' + (s.postTutup ? ' sampai ' + esc(s.postTutup) + ' WIB' : '') + ' &middot; ' + (s.post ? s.post + 'x percobaan, terbaik ' + esc(s.best) : 'lulus jika nilai &ge; 80') : 'Lulus jika nilai &ge; 80'));
  var h = '<div class="card solo"><h2>Kuis</h2><p class="sub">Urutan wajib: hadir, Pre-test (1x), lalu Post-test sampai lulus. Post-test dibuka oleh trainer.</p><div class="steps">' +
    step(1, 'Kehadiran', s1, s.hadir ? 'Sudah dicatat hadir' : (s.terdaftar ? 'Menunggu dicatat trainer' : 'Belum terdaftar')) +
    step(2, 'Pre-test', s2, hasPre ? 'Nilai ' + esc(s.pre) : 'Wajib, hanya 1x') +
    step(3, 'Post-test', s3, d3) + '</div>';
  if (!s.aktif) h += '<div class="ban gry">Belum ada jadwal training aktif.</div>';
  else if (!s.terdaftar) h += '<div class="ban amb">Anda belum terdaftar pada jadwal aktif. Daftar dulu di menu Beranda.</div>';
  else if (!s.hadir) h += '<div class="ban amb">Kehadiran Anda belum dicatat. Minta trainer menandai hadir (scan QR atau kode absensi), lalu tekan Muat Ulang.</div><button class="btn sec" onclick="V.quiz()">Muat Ulang</button>';
  else if (!hasPre) h += '<button class="btn" onclick="startQ(\'pretest\')">Mulai Pre-test</button>';
  else if (!s.lulus && !terbuka) h += '<div class="ban amb" id="q-wait">Post-test belum dibuka. Tunggu instruksi trainer. Halaman ini memeriksa otomatis setiap 20 detik.</div><button class="btn sec" onclick="V.quiz()">Muat Ulang</button>';
  else if (!s.lulus) h += '<button class="btn" onclick="startQ(\'posttest\')">Mulai Post-test (percobaan ke-' + (s.post + 1) + ')</button>';
  else h += '<div class="ban grn">Anda sudah lulus. Sertifikat tersedia di menu Beranda.</div>';
  M(h + '</div><div id="q-area"></div>');
  if ($('q-wait')) quizPoll = setInterval(function () {
    if (!$('q-wait')) { clearInterval(quizPoll); quizPoll = null; return; }
    if (document.hidden) return;
    api('quizStatus', T).then(function (z) { if (z && z.postBuka && $('q-wait')) V.quiz(); });
  }, 20000);
};
function qprog() {
  if (!Q) return;
  var n = 0; Q.soal.forEach(function (s) { if (document.querySelector('input[name="q' + s.id + '"]:checked')) n++; });
  $('qpbar').style.width = Math.round(n / Q.soal.length * 100) + '%';
  $('qptxt').textContent = n + '/' + Q.soal.length;
}
async function startQ(j) {
  var r = await api('startQuiz', T, j); if (!r) { V.quiz(); return; }
  Q = { j: j, soal: r.soal };
  var h = '<div class="card"><h3>' + esc(r.nama) + '</h3><p class="mut" style="margin-top:0">ID ' + esc(r.pid) + ' &middot; NIK ' + esc(r.nik) + ' &middot; ' + esc(r.unit) + ' &middot; Percobaan ke-' + r.percobaan + '</p>' +
    '<div class="qp"><div class="qpb"><span id="qpbar"></span></div><small class="mut" id="qptxt">0/' + r.soal.length + '</small></div>';
  r.soal.forEach(function (s, i) {
    h += '<p><b>' + (i + 1) + '. ' + esc(s.pertanyaan) + '</b></p>';
    s.pilihan.forEach(function (p, k) {
      h += '<label class="opt"><input type="radio" name="q' + esc(s.id) + '" value="' + 'ABCD'.charAt(k) + '" onchange="qprog()"> ' + esc(p) + '</label>';
    });
  });
  h += '<button class="btn" onclick="sendQ()">Kirim Jawaban</button></div>';
  $('q-area').innerHTML = h;
}
async function sendQ() {
  var a = {};
  Q.soal.forEach(function (s) {
    var c = document.querySelector('input[name="q' + s.id + '"]:checked'); if (c) a[s.id] = c.value;
  });
  var r = await api('submitQuiz', T, Q.j, a); if (!r) return;
  $('q-area').innerHTML = '<div class="card"><h2>Nilai: ' + r.nilai + '</h2><p>' + bdg(r.status) + ' Percobaan ke-' + r.percobaan + '</p>' +
    (r.status === 'Gagal' ? '<p>Nilai belum mencapai 80. Anda dapat mengulang Post-test.</p>' : '') + '<div id="q-ok"></div><button class="btn sec sm" style="margin-top:10px" onclick="V.quiz()">Kembali ke Kuis</button></div>';
  if (r.status === 'Lulus') {
    var m = await api('myStatus', T);
    $('q-ok').innerHTML = '<div class="ban grn">Selamat, Anda dinyatakan LULUS training.' + (m && m.exp ? ' Sertifikasi berlaku sampai ' + esc(m.exp) + '.' : '') + '</div>';
  }
}

V.prof = async function () {
  var res = await Promise.all([api('daftarUnit'), api('statusPermintaanSaya', T)]), un = res[0] || [], rq = res[1];
  M('<div class="card"><h3>Profil</h3><div class="g">' +
    '<div><label>Nama (sesuai KTP)</label><input id="p-nama" value="' + esc(U.nama_ktp) + '"></div>' +
    '<div><label>NIK (tidak dapat diubah)</label><input value="' + esc(U.nik) + '" readonly></div>' +
    '<div><label>Tanggal lahir</label><input id="p-tgl" type="date" value="' + esc(U.tgl_lahir) + '"></div>' +
    '<div><label>Unit kerja</label>' + unitCtl('p-unit', U.unit_kerja, un, false) + '</div>' +
    '<div><label>No. WhatsApp (awali +62)</label><input id="p-wa" placeholder="+6281234567890" onblur="this.value=normWa(this.value)" value="' + esc(normWa(U.no_wa)) + '"></div>' +
    '<div><label>Email</label><input id="p-email" value="' + esc(U.email) + '"></div></div>' +
    '<button class="btn" onclick="saveProf()">Simpan Perubahan</button></div>' +
    '<div class="card"><h3>Ganti Password</h3>' +
    '<label>Password saat ini</label><input id="c-old" type="password"><label>Password baru</label><input id="c-new" type="password">' +
    '<button class="btn" onclick="chPass()">Ubah Password</button></div>' +
    '<div class="card"><h3>Data Pribadi Saya</h3><p class="mut" style="margin-top:0">Anda dapat mengunduh salinan data Anda atau mengajukan penghapusan akun. Permintaan penghapusan ditinjau admin, dan data tertentu dapat tetap disimpan sesuai ketentuan rumah sakit.</p>' +
    '<button class="btn sec" onclick="dlB64(\'unduhDataSaya\')">Unduh Data Saya (Excel)</button>' +
    (rq && rq.status === 'menunggu' ? '<div class="ban amb" style="margin:12px 0 0">Permintaan penghapusan data Anda sedang diproses admin.</div>' :
      (rq && rq.status === 'ditolak' ? '<div class="ban gry" style="margin:12px 0 0">Permintaan terakhir ditolak: ' + esc(rq.catatan) + '</div>' : '') +
      '<label style="margin-top:14px;display:block">Alasan penghapusan (opsional)</label><textarea id="dr-a" rows="2" maxlength="300"></textarea><button class="btn sec dgr" onclick="sure(this,\'ajukanHapus\')">Ajukan Penghapusan Akun</button>') + '</div>');
};
async function ajukanHapus() { var r = await api('ajukanHapusData', T, val('dr-a')); if (r) { toast(r); V.prof(); } }
async function saveProf() {
  var r = await api('updateProfile', T, { nama_ktp: val('p-nama'), tgl_lahir: val('p-tgl'), unit_kerja: val('p-unit'), no_wa: normWa(val('p-wa')), email: val('p-email') });
  if (r) { U = r; setWho(); toast('Profil berhasil diperbarui.'); }
}
async function chPass() { var r = await api('changePass', T, val('c-old'), val('c-new')); if (r) { toast(r); $('c-old').value = ''; $('c-new').value = ''; } }

var selPid = {}, wkT = null;
