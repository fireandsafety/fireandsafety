/* views-modules.js - menu Lainnya + modul: Notifikasi WA, CRM Kontak, Dokumen (Doc Engine), Migrasi, Keamanan (Google OAuth) */
var MORE_DESC = { exp: 'Sertifikat segera berakhir dan kedaluwarsa', dok: 'Terbitkan dokumen dari templat, minta tanda tangan pejabat', notif: 'WhatsApp, email per kejadian, blast', crm: 'Daftar kontak Nama - Email - WhatsApp',
  mig: 'Impor data dari aplikasi lama atau CSV', sec: 'Login Google dan pembatasan akses', rst: 'Atur ulang password pengguna', prof: 'Data pribadi dan password' };
V.more = function () {
  var l = TABS[U.role].filter(function (t) { return !t[3]; });
  M('<div class="card solo"><h2>Lainnya</h2><p class="sub">Menu tambahan untuk ' + esc(U.role) + '.</p>' + l.map(function (t) {
    return '<button class="mrow" onclick="go(\'' + t[0] + '\')"><span class="ti">' + ic(t[2]) + '</span><span><b>' + t[1] + '</b><small>' + esc(MORE_DESC[t[0]] || '') + '</small></span>' + ic('chev') + '</button>';
  }).join('') + '<hr style="border:0;border-top:1px solid var(--bd);margin:12px 0"><button class="btn sec full" onclick="logoutAll()">Keluar dari semua perangkat</button></div>');
};
async function logoutAll() { var r = await api('logoutSemua', T); if (r) { toast('Semua sesi dicabut.'); logout(); } }
function chk(id, label, on) { return '<label class="opt"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '> ' + label + '</label>'; }

/* ===================== NOTIFIKASI WA + EMAIL + BLAST ===================== */
V.notif = async function () {
  var res = await Promise.all([api('notifConfig', T), api('blastList', T), api('daftarUnit')]), c = res[0], bl = res[1] || [], un = res[2] || [];
  if (!c) { M('<div class="card solo"><h2>Notifikasi</h2><p class="mut">Tidak dapat memuat. Coba lagi.</p><button class="btn" onclick="V.notif()">Coba lagi</button></div>'); return; }
  var mx = c.matriks.map(function (m) {
    return '<div class="item"><div class="ib"><b>' + esc(m.label) + '</b><div class="row" style="justify-content:flex-start;gap:18px;margin:6px 0">' +
      '<label class="opt" style="margin:0;padding:6px 10px"><input type="checkbox" id="mx-wa-' + m.kode + '"' + (m.wa ? ' checked' : '') + '> WhatsApp</label>' +
      '<label class="opt" style="margin:0;padding:6px 10px"><input type="checkbox" id="mx-em-' + m.kode + '"' + (m.email ? ' checked' : '') + '> Email</label></div>' +
      '<label>Pesan WhatsApp ({nama} {subjek})</label><textarea id="mx-ps-' + m.kode + '" rows="3">' + esc(m.pesan) + '</textarea></div></div>';
  }).join('');
  var bli = bl.map(function (b) {
    var pct = b.total ? Math.round((b.terkirim + b.gagal) / b.total * 100) : 0;
    return '<div class="item"><div class="ib"><b>' + esc(b.judul) + '</b> <span class="badge ' + (b.status === 'selesai' ? 'ok' : b.status === 'berjalan' ? 'blue' : '') + '">' + esc(b.status) + '</span>' +
      '<div class="meta">' + esc(b.tanggal) + ' &middot; ' + b.terkirim + ' terkirim, ' + b.gagal + ' gagal dari ' + b.total + '</div><div class="qpb"><span style="width:' + pct + '%"></span></div>' +
      (b.status === 'berjalan' ? '<div class="row" style="justify-content:flex-start;margin-top:8px"><button class="btn sm sec" onclick="blastNext(\'' + b.bid + '\')">Kirim batch berikutnya</button><button class="btn sm dgr" onclick="blastStop(\'' + b.bid + '\')">Hentikan</button></div>' : '') + '</div></div>';
  }).join('') || '<p class="mut">Belum ada blast.</p>';
  M('<div class="card"><h3>WhatsApp (Fonnte)</h3>' + chk('n-wa', 'Aktifkan notifikasi WhatsApp', c.waAktif) +
    '<label>Token Fonnte ' + (c.adaToken ? '(tersimpan: ' + esc(c.tokenMask) + ', kosongkan bila tidak diubah)' : '(belum diisi)') + '</label><input id="n-tok" type="password" autocomplete="off" placeholder="Tempel token dari fonnte.com">' +
    '<div class="g"><div><label>Ukuran batch</label><select id="n-batch">' + [10, 20, 50].map(function (x) { return '<option' + (x === c.batch ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
    '<div><label>Jeda antarpesan (detik, mis. 5 atau 3-8)</label><input id="n-jeda" value="' + esc(c.jeda) + '"></div></div>' + chk('n-em', 'Aktifkan notifikasi email (sisa kuota hari ini: ' + c.sisaEmail + ')', c.emailAktif) +
    '<p class="mut" style="margin-top:0">Antrean WhatsApp: ' + c.antrean.menunggu + ' menunggu, ' + c.antrean.terkirim + ' terkirim, ' + c.antrean.gagal + ' gagal. Token tidak pernah dikirim ke browser.</p></div>' +
    '<div class="card"><h3>Kejadian dan pesan</h3>' + mx + '<button class="btn" onclick="notifSave()">Simpan Pengaturan</button></div>' +
    '<div class="card"><h3>Uji sambungan</h3><label>Nomor WhatsApp</label><input id="n-uji" placeholder="+6281234567890" onblur="this.value=normWa(this.value)"><button class="btn sec" onclick="notifTest()">Kirim Pesan Uji</button></div>' +
    '<div class="card wide"><h3>Blast WhatsApp</h3><label>Judul (internal)</label><input id="b-judul"><label>Pesan ({nama} {unit})</label><textarea id="b-pesan" rows="4" placeholder="Halo {nama}, ..."></textarea>' +
    '<div class="g"><div><label>Sasaran</label><select id="b-sas"><option value="semua">Semua peserta</option><option value="aktif">Sertifikasi aktif</option><option value="soon">Segera berakhir</option><option value="expired">Kedaluwarsa</option><option value="belum">Belum bersertifikat</option><option value="jadwal">Terdaftar di jadwal aktif</option></select></div>' +
    '<div><label>Unit (opsional)</label><select id="b-unit"><option value="">Semua unit</option>' + un.map(function (u) { return '<option>' + esc(u) + '</option>'; }).join('') + '</select></div></div>' +
    '<button class="btn" onclick="blastNew()">Buat Blast</button><h3 style="margin-top:14px">Riwayat Blast</h3>' + bli + '</div>');
};
async function notifSave() {
  var m = {}; ['DAFTAR_TRAINING', 'SERTIFIKAT_TERBIT', 'PENGINGAT'].forEach(function (k) { if ($('mx-wa-' + k)) m[k] = { wa: $('mx-wa-' + k).checked, email: $('mx-em-' + k).checked, pesan: val('mx-ps-' + k) }; });
  var r = await api('notifSimpan', T, { token: val('n-tok'), waAktif: $('n-wa').checked, emailAktif: $('n-em').checked, batch: +val('n-batch'), jeda: val('n-jeda'), matriks: m });
  if (r) { toast(r); V.notif(); }
}
async function notifTest() { var r = await api('notifUji', T, val('n-uji')); if (r) toast(r); }
async function blastNew() {
  var r = await api('blastBuat', T, { judul: val('b-judul'), pesan: val('b-pesan'), sasaran: { jenis: val('b-sas'), unit: val('b-unit') } }); if (r) { toast(r); V.notif(); }
}
async function blastNext(id) { var r = await api('blastLanjut', T, id); if (r) { toast(r); V.notif(); } }
async function blastStop(id) { var r = await api('blastHenti', T, id); if (r) { toast(r); V.notif(); } }

/* ===================== CRM KONTAK ===================== */
var crmT = null;
V.crm = async function () {
  var c = await api('crmList', T, '', ''); if (!c) { M('<div class="card solo"><h2>Kontak</h2><button class="btn" onclick="V.crm()">Coba lagi</button></div>'); return; }
  M('<div class="tiles">' + tile('contact', 'Total kontak', c.total, 'Peserta, staf, dan manual') + tile('check', 'WhatsApp terdaftar', c.terdaftarWa, 'Hasil deteksi nomor') + tile('warn', 'Opt-out', c.optOut, 'Tidak menerima blast') + '</div>' +
    '<div class="card wide"><h3>Kontak</h3><div class="row" style="justify-content:flex-start;gap:8px"><button class="btn sm" onclick="crmSync()">Sinkron dari akun</button><button class="btn sm sec" onclick="crmDetect()">Deteksi nomor WA</button><button class="btn sm sec" onclick="dlB64(\'crmExport\')">Unduh Excel</button></div>' +
    '<div class="g"><div><input id="k-q" placeholder="Cari nama, email, WA, unit" oninput="crmFind()"></div><div><select id="k-seg" onchange="crmFind()"><option value="">Semua segmen</option><option>Peserta</option><option>Staf</option><option>Lainnya</option></select></div></div><div id="k-list"></div></div>' +
    '<div class="card"><h3>Tambah Kontak Manual</h3><div class="g"><div><label>Nama</label><input id="k-nama"></div><div><label>Email</label><input id="k-email" type="email"></div><div><label>WhatsApp</label><input id="k-wa" placeholder="+62..." onblur="this.value=normWa(this.value)"></div><div><label>Tag</label><input id="k-tag"></div></div><button class="btn" onclick="crmAdd()">Simpan Kontak</button></div>');
  crmRender(c.items);
};
function crmRender(a) {
  $('k-list').innerHTML = a.length ? a.map(function (k) {
    return '<div class="item"><div class="av sm">' + ini(k.nama) + '</div><div class="ib"><b>' + esc(k.nama) + '</b> <span class="badge">' + esc(k.segmen) + '</span> ' + (k.statusWa ? '<span class="badge ' + (k.statusWa === 'Terdaftar' ? 'ok' : 'bad') + '">WA ' + esc(k.statusWa) + '</span>' : '') +
      '<div class="meta">' + esc(k.wa || '-') + ' &middot; ' + esc(k.email || '-') + (k.unit ? ' &middot; ' + esc(k.unit) : '') + '</div>' +
      '<button class="btn sm ' + (k.optOut ? 'sec' : 'dgr') + '" onclick="crmOpt(\'' + k.kid + '\',' + (!k.optOut) + ')">' + (k.optOut ? 'Aktifkan lagi blast' : 'Opt-out blast') + '</button></div></div>';
  }).join('') : '<p class="mut">Tidak ada kontak. Tekan "Sinkron dari akun".</p>';
}
function crmFind() { clearTimeout(crmT); crmT = setTimeout(async function () { var c = await api('crmList', T, val('k-q'), val('k-seg')); if (c) crmRender(c.items); }, 300); }
async function crmSync() { var r = await api('crmSinkron', T); if (r) { toast(r); V.crm(); } }
async function crmDetect() { toast('Memeriksa nomor ke Fonnte...'); var r = await api('waDeteksi', T, null); if (r) { toast(r); V.crm(); } }
async function crmAdd() { var r = await api('crmSimpan', T, { nama: val('k-nama'), email: val('k-email'), wa: val('k-wa'), tag: val('k-tag'), segmen: 'Lainnya' }); if (r) { toast(r); V.crm(); } }
async function crmOpt(kid, ya) { var r = await api('crmOptOut', T, kid, ya); if (r) { toast(r); V.crm(); } }

/* ===================== DOKUMEN (Doc Engine) ===================== */
var DOC = { tpl: [], off: [] };
V.dok = async function () {
  var res = await Promise.all([api('deTemplates', T), api('deOfficials', T), api('deGenerated', T)]); DOC.tpl = res[0] || []; DOC.off = res[1] || []; var gen = res[2] || [], adm = U.role === 'admin';
  var opt = DOC.tpl.map(function (t) { return '<option value="' + t.tid + '">' + esc(t.nama) + ' (' + t.jenis + (t.slot ? ', ' + t.slot + ' TTD' : '') + ')</option>'; }).join('');
  var gl = gen.map(function (g) {
    return '<div class="item"><div class="ib"><b>' + esc(g.nomor || '(belum bernomor)') + '</b> <span class="badge ' + (g.status === 'terbit' ? 'ok' : 'warn') + '">' + esc(g.status) + '</span><div class="meta">' + esc(g.template) + ' &middot; ' + dt(g.dibuat) + ' &middot; ' + esc(g.oleh) + '</div>' +
      (g.url ? '<a class="btn sm sec" target="_blank" rel="noopener" href="' + esc(g.url) + '">Buka PDF</a> <button class="btn sm sec" onclick="copyTxt(\'' + esc(feLink(g.kode)) + '\')">Salin tautan verifikasi</button>' : '') +
      (g.menunggu ? '<button class="btn sm" onclick="docApprove(\'' + g.did + '\')">Setujui dengan PIN</button>' : '') + '</div></div>';
  }).join('') || '<p class="mut">Belum ada dokumen.</p>';
  M('<div class="card"><h3>Buat Dokumen</h3>' + (DOC.tpl.length ? '<label>Templat</label><select id="d-tpl" onchange="docForm()">' + opt + '</select><div id="d-form"></div>' : '<p class="mut">Belum ada templat. ' + (adm ? 'Tambahkan di bawah.' : 'Minta admin menambahkan templat.') + '</p>') + '</div>' +
    '<div class="card"><h3>Dokumen Terbit</h3>' + gl + '</div>' + (adm ? docAdmin() : ''));
  if (DOC.tpl.length) docForm();
};
function feLink(k) { return location.origin + location.pathname.replace(/[^\/]*$/, '') + '#/d/' + k; }
function copyTxt(s) { if (navigator.clipboard) navigator.clipboard.writeText(s).then(function () { toast('Tautan disalin.'); }); else toast(s); }
function docAdmin() {
  return '<div class="card wide"><h3>Templat (admin)</h3><p class="mut">Rancang templat di Google Slides atau Docs dengan penanda seperti {{NAMA}}, {{ISI_KEGIATAN}}, {{NOMOR}}, {{QR}}, {{NAMA_PEJABAT_1}}, {{JABATAN_1}}, {{TTD_1}}. Berkas harus milik akun yang sama dengan skrip.</p>' +
    '<div class="g"><div><label>Nama templat</label><input id="t-nama"></div><div><label>Jenis</label><select id="t-jenis"><option value="slides">Google Slides</option><option value="docs">Google Docs</option></select></div>' +
    '<div><label>URL atau ID berkas</label><input id="t-file"></div><div><label>Format nomor</label><input id="t-fmt" value="SHLC/DOK/{NO}/{BULAN_ROMAWI}/{TAHUN}"></div></div>' +
    '<div class="row" style="justify-content:flex-start;gap:8px"><button class="btn sec sm" onclick="docScan()">Pindai Penanda</button><button class="btn sm" onclick="docSaveTpl()">Simpan Templat</button></div><div id="t-scan"></div>' +
    (DOC.tpl.length ? '<h3 style="margin-top:14px">Templat Aktif</h3>' + DOC.tpl.map(function (t) { return '<div class="item"><div class="ib"><b>' + esc(t.nama) + '</b><div class="meta">' + t.kunci.length + ' penanda &middot; ' + t.slot + ' slot TTD</div><button class="btn sm dgr" onclick="docDelTpl(\'' + t.tid + '\')">Nonaktifkan</button></div></div>'; }).join('') : '') + '</div>' +
    '<div class="card wide"><h3>Pejabat Penanda Tangan</h3><p class="mut">Pejabat menyetujui dokumen dengan PIN setelah login memakai akun dengan email yang sama.</p><div class="g"><div><label>Nama</label><input id="pj-nama"></div><div><label>Jabatan</label><input id="pj-jab"></div><div><label>Email akun</label><input id="pj-email" type="email"></div><div><label>PIN (6-10 angka)</label><input id="pj-pin" type="password" inputmode="numeric"></div></div><button class="btn" onclick="docSavePj()">Simpan Pejabat</button>' +
    DOC.off.map(function (p) { return '<div class="item"><div class="ib"><b>' + esc(p.nama) + '</b><div class="meta">' + esc(p.jabatan) + ' &middot; ' + esc(p.email) + '</div></div></div>'; }).join('') + '</div>';
}
function docForm() {
  var t = DOC.tpl.filter(function (x) { return x.tid === val('d-tpl'); })[0]; if (!t) return;
  var f = t.skema.map(function (s) { var id = 'df-' + s.kunci; return '<label>' + esc(s.kunci.replace(/_/g, ' ')) + '</label>' + (s.tipe === 'teks_panjang' ? '<textarea id="' + id + '" rows="3"></textarea>' : '<input id="' + id + '"' + (s.tipe === 'tanggal' ? ' type="date"' : s.tipe === 'angka' ? ' type="number"' : '') + '>'); }).join('');
  var sl = ''; for (var i = 1; i <= t.slot; i++) sl += '<label>Penandatangan ' + i + '</label><select id="dp-' + i + '">' + DOC.off.map(function (p) { return '<option value="' + p.pid + '">' + esc(p.nama) + ' - ' + esc(p.jabatan) + '</option>'; }).join('') + '</select>';
  $('d-form').innerHTML = f + sl + '<button class="btn" onclick="docMake()">Terbitkan Dokumen</button>' +
    '<hr style="border:0;border-top:1px solid var(--bd);margin:14px 0"><h3>Generate Massal</h3><div class="g"><div><label>Sasaran</label><select id="dm-sas"><option value="jadwal">Peserta hadir di jadwal aktif</option><option value="lulus">Peserta yang pernah lulus</option></select></div></div><p class="mut" style="margin-top:0">Memakai isian di atas sebagai data bersama; NAMA, NIK, UNIT diisi dari akun peserta. Maksimum 40 dokumen per proses.</p><button class="btn sec" onclick="docMass()">Generate Massal</button>';
}
function docData(t) { var d = {}; t.skema.forEach(function (s) { d[s.kunci] = val('df-' + s.kunci); }); return d; }
function docPj(t) { var a = []; for (var i = 1; i <= t.slot; i++) a.push(val('dp-' + i)); return a; }
async function docMake() {
  var t = DOC.tpl.filter(function (x) { return x.tid === val('d-tpl'); })[0]; toast('Memproses dokumen...');
  var r = await api('deGenerate', T, { tid: t.tid, data: docData(t), pejabat: docPj(t) }); if (r) { toast(r.status === 'terbit' ? 'Dokumen terbit: ' + r.nomor : 'Dokumen menunggu tanda tangan pejabat.'); V.dok(); }
}
async function docMass() {
  var t = DOC.tpl.filter(function (x) { return x.tid === val('d-tpl'); })[0]; toast('Membuat dokumen massal...');
  var r = await api('deGenerateMassal', T, { tid: t.tid, sasaran: val('dm-sas'), data: docData(t), pejabat: docPj(t) }); if (r) { toast(r.dibuat + ' dokumen dibuat' + (r.gagal ? ', ' + r.gagal + ' gagal' : '') + '.'); V.dok(); }
}
async function docApprove(did) {
  var pin = prompt('Masukkan PIN pejabat Anda:'); if (!pin) return;
  var r = await api('deSetujui', T, { did: did, pin: pin }); if (r) { toast(r); V.dok(); }
}
async function docScan() {
  var r = await api('deScan', T, val('t-file'), val('t-jenis')); if (!r) return;
  $('t-scan').innerHTML = '<div class="ban gry"><b>' + r.kunci.length + ' penanda ditemukan</b> &middot; ' + r.slotTtd + ' slot TTD' + (r.adaQr ? ' &middot; ada QR' : '') + '<div style="margin-top:6px">' +
    r.kunci.map(function (k) { return '<span class="badge ' + (k.kategori === 'isian' ? 'blue' : '') + '" style="margin:2px">' + esc(k.kunci) + '</span>'; }).join('') + '</div></div>';
}
async function docSaveTpl() { var r = await api('deSimpanTemplate', T, { nama: val('t-nama'), fileId: val('t-file'), jenis: val('t-jenis'), nomorFmt: val('t-fmt') }); if (r) { toast(r); V.dok(); } }
async function docDelTpl(id) { var r = await api('deHapusTemplate', T, id); if (r) { toast(r); V.dok(); } }
async function docSavePj() { var r = await api('deSimpanPejabat', T, { nama: val('pj-nama'), jabatan: val('pj-jab'), email: val('pj-email'), pin: val('pj-pin') }); if (r) { toast(r); V.dok(); } }

/* ===================== MIGRASI DATA ===================== */
V.mig = async function () {
  var i = await api('importInfo', T); if (!i) { M('<div class="card solo"><h2>Migrasi</h2><button class="btn" onclick="V.mig()">Coba lagi</button></div>'); return; }
  var nm = { units: 'Unit kerja', users: 'Akun pengguna', schedules: 'Jadwal', registrations: 'Registrasi', scores: 'Nilai', certificates: 'Sertifikat', questions: 'Bank soal', evaluations: 'Evaluasi' };
  M('<div class="card wide"><h3>Impor dari Aplikasi Lama</h3>' + i.catatan.map(function (c) { return '<p class="mut" style="margin:0">&bull; ' + esc(c) + '</p>'; }).join('') +
    '<label style="margin-top:10px">URL atau ID spreadsheet lama (hanya dibaca)</label><input id="m-src" placeholder="https://docs.google.com/spreadsheets/d/...">' +
    '<div class="row" style="justify-content:flex-start;gap:6px">' + i.sheets.map(function (s) { return '<label class="opt" style="margin:0;padding:6px 10px"><input type="checkbox" class="m-sh" value="' + s + '"' + (s === 'scores' || s === 'evaluations' ? '' : ' checked') + '> ' + nm[s] + '</label>'; }).join('') + '</div>' +
    chk('m-timpa', 'Timpa jadwal dan soal yang sudah ada (jangan dicentang bila ragu)', false) + chk('m-adm', 'Sertakan akun admin lama', false) +
    '<div class="row" style="justify-content:flex-start;gap:8px"><button class="btn sec" onclick="migRun(true)">Pindai (tanpa menulis)</button><button class="btn" onclick="migRun(false)">Jalankan Impor</button></div><div id="m-out"></div></div>' +
    '<div class="card"><h3>Impor Karyawan dari CSV</h3><p class="mut">Kolom: ' + esc(i.csvKolom) + '. Pemisah koma atau titik koma.</p><input type="file" id="m-csvf" accept=".csv,text/csv" onchange="migFile(this)"><textarea id="m-csv" rows="6" placeholder="nama;nik;tgl_lahir;unit;wa;email"></textarea>' +
    '<div class="row" style="justify-content:flex-start;gap:8px"><button class="btn sec" onclick="migCsv(true)">Pindai CSV</button><button class="btn" onclick="migCsv(false)">Impor CSV</button></div><div id="m-cout"></div></div>');
};
function migFile(inp) { var f = inp.files && inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { $('m-csv').value = r.result; }; r.readAsText(f); }
async function migRun(dry) {
  var sh = [].slice.call(document.querySelectorAll('.m-sh:checked')).map(function (x) { return x.value; });
  if (!dry && !confirm('Jalankan impor? Data baru akan ditambahkan ke aplikasi ini (aman diulang).')) return;
  toast(dry ? 'Memindai...' : 'Mengimpor...');
  var r = await api(dry ? 'importScan' : 'importJalankan', T, { source: val('m-src'), sheets: sh, timpa: $('m-timpa').checked, sertakanAdmin: $('m-adm').checked }); if (!r) return;
  $('m-out').innerHTML = '<div class="ban ' + (r.dryRun ? 'amb' : 'grn') + '"><b>' + (r.dryRun ? 'Hasil pindai (belum ada yang ditulis)' : 'Impor selesai') + '</b> dari "' + esc(r.sumber.nama) + '"</div>' +
    '<div style="overflow:auto"><table class="tbl"><tr><th>Data</th><th>Di sumber</th><th>Ditambah</th><th>Diperbarui</th><th>Dilewati</th></tr>' + Object.keys(r.laporan).map(function (k) { var x = r.laporan[k]; return '<tr><td>' + esc(k) + '</td><td>' + x.sumber + '</td><td>' + x.ditambah + '</td><td>' + x.diperbarui + '</td><td>' + x.dilewati + (x.catatan ? ' (' + esc(x.catatan) + ')' : '') + '</td></tr>'; }).join('') + '</table></div>' +
    (r.peringatan.length ? '<div class="ban amb" style="margin-top:10px">' + r.peringatan.map(function (w) { return '<div>' + esc(w) + '</div>'; }).join('') + '</div>' : '');
}
async function migCsv(dry) {
  if (!dry && !confirm('Impor akun dari CSV ini?')) return;
  var r = await api('importCsv', T, { csv: val('m-csv'), dry: dry }); if (!r) return;
  $('m-cout').innerHTML = '<div class="ban ' + (r.dryRun ? 'amb' : 'grn') + '"><b>' + r.ditambah + ' akun ' + (r.dryRun ? 'akan ditambah' : 'ditambah') + ', ' + r.dilewati + ' dilewati.</b><div style="font-weight:400;margin-top:4px">' + esc(r.catatan) + '</div></div>' +
    (r.peringatan.length ? '<div class="ban gry">' + r.peringatan.map(function (w) { return '<div>' + esc(w) + '</div>'; }).join('') + '</div>' : '');
}

/* ===================== KEAMANAN (Google OAuth 2.0) ===================== */
V.sec = async function () {
  var c = await api('keamananConfig', T); if (!c) { M('<div class="card solo"><h2>Keamanan</h2><button class="btn" onclick="V.sec()">Coba lagi</button></div>'); return; }
  M('<div class="card"><h3>Login Google (OAuth 2.0)</h3><div class="ban ' + (c.googleAktif ? 'grn' : 'amb') + '">' + (c.googleAktif ? 'Login Google aktif. Pengguna dapat masuk dengan akun Google yang emailnya cocok dengan akun mereka.' : 'Login Google belum aktif. Isi Client ID di bawah.') + '</div>' +
    '<label>Google OAuth Client ID (tipe Web application)</label><input id="g-cid" value="' + esc(c.googleClientId) + '" placeholder="1234567890-abc.apps.googleusercontent.com">' +
    '<label>Batasi domain email Google (opsional, mis. siloamhospitals.com)</label><input id="g-dom" value="' + esc(c.domain) + '">' +
    '<label>Alamat frontend (GitHub Pages), dipakai pada QR dan tautan email</label><input id="g-fe" value="' + esc(c.frontendUrl) + '" placeholder="https://akun.github.io/nama-repo">' +
    '<button class="btn" onclick="secSave()">Simpan</button></div>' +
    '<div class="card"><h3>Wajibkan Google untuk Trainer dan Admin</h3><p class="mut">Bila aktif, akun trainer dan admin tidak bisa masuk dengan password; harus memakai Google. Peserta tetap bebas memilih.</p>' +
    chk('g-wajib', 'Wajibkan login Google untuk trainer dan admin', c.wajibStaf) + chk('g-konf', 'Saya sudah memastikan semua trainer dan admin dapat masuk dengan Google', false) +
    '<button class="btn" onclick="secWajib()">Simpan Kebijakan</button><h3 style="margin-top:16px">Akun Trainer dan Admin</h3>' +
    c.staf.map(function (s) { return '<div class="item"><div class="ib"><b>' + esc(s.nama) + '</b> <span class="badge blue">' + esc(s.role) + '</span><div class="meta">' + esc(s.username) + ' &middot; ' + esc(s.email) + '</div></div></div>'; }).join('') +
    '<p class="mut">Darurat bila terkunci: jalankan matikanGoogleWajib() dari editor Apps Script.</p></div>');
};
async function secSave() { var r = await api('keamananSimpan', T, { googleClientId: val('g-cid'), domain: val('g-dom'), frontendUrl: val('g-fe') }); if (r) { toast(r); V.sec(); } }
async function secWajib() { var r = await api('keamananSimpan', T, { wajibStaf: $('g-wajib').checked, konfirmasi: $('g-konf').checked }); if (r) { toast(r); V.sec(); } }
