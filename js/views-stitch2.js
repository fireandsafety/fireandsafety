/* views-stitch2.js - Laporan, Pengguna, Scan, Login (markup Stitch asli, data nyata) */
function repeatRow(el) {                                         // naik sampai elemen yang punya saudara sekelas (baris berulang)
  while (el && el.parentElement) { var p = el.parentElement; if (p.children.length >= 2 && p.children[0].className === el.className && p.children[1].className === el.className) return el; el = p; }
  return null;
}
function setW(el, pct) { if (el) el.style.width = Math.max(0, Math.min(100, pct)) + '%'; }
function jamNow() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2) + ' WIB'; }

/* ===================== LAPORAN ===================== */
V.lap = async function () {
  var res = await Promise.all([api('reportData', T), api('statusAntrean', T), api('statusBankSoal', T)]), r = res[0], q = res[1], bs = res[2];
  var m = MS(TPL.lap); if (!r) { cardMsg(m.firstElementChild || m, 'Laporan', 'Data belum dapat dimuat. Periksa koneksi lalu buka menu ini lagi.'); return; }
  S(m, 'K3RS Compliance W-15 • W-21', 'Komite K3 SHLC'); S(m, 'Hari ini, 08:42 WIB', 'Hari ini, ' + jamNow());
  S(m, 'Export Laporan Lengkap (PDF/XLS)', 'Unduh Expired (Excel)'); btn(m, 'Unduh Expired (Excel)', function () { dlXlsx('expiry'); });
  var pc = function (n) { return r.total ? Math.round(n / r.total * 1000) / 10 : 0; };
  S(m, '842', num(r.aktif)); S(m, '48', num(r.soon)); S(m, '19', num(r.expired)); S(m, '165', num(r.belum));
  [].slice.call(m.querySelectorAll('span,div')).forEach(function (e) { if (plain(e) === 'Karyawan') setTxt(e, 'Peserta'); });
  var tr = find(m, '+4.2%'); if (tr) { var chip = up(tr, 2); gone(chip && chip.querySelector('[class*="bg-"]') ? up(tr, 1) : null); }
  S(m, 'vs kuartal lalu', ''); S(m, '78.4% Total Staf', pc(r.aktif) + '% dari ' + num(r.total) + ' akun');
  S(m, 'Butuh jadwal refresher', 'Segera jadwalkan refresher'); S(m, '4.5% Total', pc(r.soon) + '% Total'); S(m, 'Wajib retraining (KARS Risk)', 'Wajib training ulang'); S(m, '1.8% Total', pc(r.expired) + '% Total');
  S(m, 'Staf outsourcing & rekrut baru', 'Belum lulus Post-test'); S(m, '15.3% Total', pc(r.belum) + '% Total');
  var bars = [].slice.call(m.querySelectorAll('[style*="width"]')); [r.aktif, r.soon, r.expired, r.belum].forEach(function (n, i) { setW(bars[i], pc(n)); });
  /* riwayat training */
  var hRow = repeatRow(find(m, 'Code Red Batch 10')), hBox = hRow.parentElement, hT = hRow.cloneNode(true); hBox.innerHTML = '';
  if (!r.trainings.length) hBox.innerHTML = '<p class="font-body-sm text-body-sm text-on-surface-variant py-4">Belum ada training.</p>';
  r.trainings.slice(0, 10).forEach(function (x) {
    var n = hT.cloneNode(true), pct = x.hadir ? Math.round(x.lulus / x.hadir * 1000) / 10 : 0;
    S(n, '24 Okt 2026', tglPendek(x.tanggal)); S(n, 'Code Red Batch 10', 'Training Fire & Safety (' + (x.jenis === 'online' ? 'Online' : 'Offline QR') + ')'); S(n, 'Skenario Ruang Isolasi & Penanganan APAR Tipe C', 'ID ' + x.sid + ' - ' + (x.status === 'aktif' ? 'sesi aktif' : 'selesai'));
    S(n, '42 Terdaftar • 42 Hadir', x.daftar + ' Terdaftar • ' + x.hadir + ' Hadir'); S(n, '39 Lulus', x.lulus + ' Lulus'); S(n, '92.8%', x.hadir ? pct + '%' : '-');
    S(n, '4.9', x.evalN ? x.evalAvg : '-'); btn(n, 'Hadir', function () { dlXlsx('hadir', x.sid); }); btn(n, 'Nilai', function () { dlXlsx('kuis', x.sid); });
    var eb = btn(n, 'Evaluasi', function () { dlXlsx('eval', x.sid); }); if (!x.evalN) hid(eb);
    hBox.appendChild(n);
  });
  /* per unit */
  var UALL = false, tb = m.querySelector('tbody'), uT = tb.children[0].cloneNode(true), ut = r.perUnit || [], uq = $('unitSearchInput');
  var draw = function () {
    var f0 = ut.filter(function (u) { return !uq.value || u.unit.toLowerCase().indexOf(uq.value.toLowerCase()) > -1; }), f = (UALL || uq.value) ? f0 : f0.slice(0, 10); tb.innerHTML = ''; var mb = $('unit-more'); if (mb) mb.remove(); if (f0.length > f.length) { var tbl = tb.closest('table'); var bt = document.createElement('button'); bt.id = 'unit-more'; bt.type = 'button'; bt.className = 'mt-3 w-full h-10 rounded-xl border border-outline-variant text-[13px] font-bold hover:border-on-surface'; bt.textContent = 'Tampilkan semua ' + f0.length + ' unit'; bt.onclick = function () { UALL = true; draw(); }; tbl.parentNode.appendChild(bt); }
    if (!f.length) { tb.innerHTML = '<tr><td colspan="6" class="py-6 text-center font-body-sm text-body-sm text-on-surface-variant">Tidak ada unit.</td></tr>'; return; }
    f.forEach(function (u) {
      var n = uT.cloneNode(true), td = n.querySelectorAll(':scope > td'), tot = u.karyawan != null ? u.karyawan : u.akun, pct = u.pct != null ? u.pct : (u.akun ? Math.round(u.aktif / u.akun * 1000) / 10 : 0);
      var nm = td[0].querySelector('span:last-child') || td[0]; setTxt(nm, u.unit); setTxt(td[1], tot == null ? '-' : tot); setTxt(td[2], u.aktif); setTxt(td[3], u.soon || 0); setTxt(td[4], u.expired || 0);
      var bar = td[5].querySelector('[style*="width"]'); setW(bar, pct); var pt = td[5].querySelector('span:last-child'); setTxt(pt, pct + '%');
      tb.appendChild(n);
    });
  };
  uq.oninput = draw; draw(); S(m, '43 Unit Terdaftar', ut.length + ' Unit'); S(m, 'Distribusi pemenuhan syarat K3RS di setiap lantai dan departemen klinis/penunjang.', r.unitBaku ? 'Persentase dihitung dari jumlah karyawan yang diisi admin di menu Unit.' : 'Unit dikelompokkan menurut isian peserta. Admin dapat menetapkan unit baku di menu Unit.');
  var fl = find(m, 'Filter', 'button'); gone(fl);
  /* bank soal */
  if (bs) {
    var pv = bs.total ? Math.round(bs.valid / bs.total * 100) : 0, ring = m.querySelector('circle[stroke-dashoffset]');
    S(m, '98%', pv + '%'); if (ring) ring.setAttribute('stroke-dashoffset', String(Math.round(264 * (1 - pv / 100))));
    S(m, '100 Soal Baku Kurikulum Standar Nasional', bs.total + ' soal di bank'); S(m, 'v2.4 Ready', bs.cukup ? 'Siap' : 'Kurang');
    S(m, '98 Soal Valid & Teruji', bs.valid + ' Soal Valid'); S(m, '2 Perlu Review (Distraktor Opsi Rendah)', (bs.total - bs.valid) + ' Soal Bermasalah' + (bs.masalah && bs.masalah.length ? ' (' + bs.masalah.slice(0, 3).join(', ') + ')' : ''));
    S(m, 'Cukup untuk 4 variasi kuis acak 25 butir tanpa pengulangan berlebih pada tiap sesi ujian.', 'Cukup untuk ' + bs.jumlahKuis + ' kuis acak 25 butir tanpa pengulangan soal. Isi sheet "questions" untuk menambah.');
    gone(find(m, 'Reviewer: Tim K3RS & Tim Keperawatan')); gone(find(m, 'Kelola Bank Soal', 'button'));
  }
  /* antrean email */
  if (q) {
    S(m, 'Daemon Aktif', 'Trigger Aktif'); S(m, 'Menunggu', 'Menunggu'); var nums = [].slice.call(m.querySelectorAll('[class~="font-numeric-stat"], [class*="text-2xl"], [class*="text-[28px]"]'));
    S(m, '3', q.menunggu); S(m, '88', q.terkirim); S(m, '0', q.gagal); S(m, 'Terkirim Hari Ini', 'Terkirim'); S(m, 'Sukses via SMTP', 'Berhasil dikirim'); S(m, 'Zero Bounce', q.gagal ? 'Perlu dicek' : 'Tidak ada gagal');
    S(m, '1,412 / 1,500 email tersisa', q.sisaKuota + ' email tersisa'); var qb = find(m, 'Kuota Google Workspace Harian'); if (qb) { var bar = up(qb, 2).querySelector('[style*="width"]'); setW(bar, Math.min(100, q.sisaKuota / (q.sisaKuota > 100 ? 1500 : 100) * 100)); }
    btn(m, 'Proses Antrean Sekarang', async function () { var x = await api('prosesAntreanManual', T); if (x) { toast(x); V.lap(); } });
    btn(m, 'Kirim Ulang Gagal', async function () { var x = await api('ulangGagal', T); if (x) { toast(x); V.lap(); } });
  }
};

/* ===================== PENGGUNA ===================== */
var USRT = null, usrPage = 1, usrQ = '', usrRole = '', EDITUID = '';
V.usr = async function () {
  var res = await Promise.all([api('listUsers', T), api('permintaanData', T), api('daftarUnit')]);
  userRows = res[0] || []; reqRows = res[1] || []; unitNames = res[2] || []; usrPage = 1; usrQ = ''; usrRole = ''; EDITUID = '';
  var m = MS(TPL.usr), pend = reqRows.filter(function (x) { return x.status === 'menunggu'; });
  hid(up(find(m, 'Sync Aktif'), 1));
  /* kartu permintaan hapus data */
  var rc = up(find(m, 'Permintaan Penghapusan & De-identifikasi Data Pribadi'), 3);
  rc = m.querySelector('[class~="border-l-[6px]"]') || rc;
  if (!pend.length) { gone(rc); var ws = m.querySelector('section, div'); }
  else {
    var q = pend[0];
    S(m, '1 Permintaan Menunggu Peninjauan', pend.length + ' Permintaan Menunggu Peninjauan'); S(m, 'REQ-PDP-2026-089', q.rid); S(m, 'dr. Hendra Wibowo, Sp.B', q.nama || q.username || '-'); S(m, 'hendra.wibowo', q.username || '-');
    S(m, 'SHLC-2018-0211', q.uid || '-'); S(m, 'Bedah Umum (Surgical Ward 3B)', q.unit || '-'); S(m, '22 Oktober 2026', tglLong(q.waktu)); S(m, '(08:44 WIB)', '(' + jamTxt(q.waktu) + ')');
    var al = [].slice.call(m.querySelectorAll('p,div')).filter(function (e) { return e.children.length === 0 && e.textContent.indexOf('Pindah tugas definitif') > -1; })[0]; if (al) al.textContent = '“' + (q.alasan || 'Tidak ada alasan yang ditulis.') + '”';
    var ta = $('pdp-notes'); ta.id = 'rq-' + q.rid; S(m, 'Penyetujuan otomatis melakukan anonymization hashing SHA-256.', 'Menyetujui akan menghapus akun dan data pribadi pemohon dari sistem.');
    btn(m, 'Setujui & Anonimkan Akun', function () { if (confirm('Setujui dan hapus akun ' + (q.nama || q.username) + '?')) rqSetuju(q.rid); }); btn(m, 'Tolak Permintaan', function () { rqTolak(q.rid); });
    S(m, 'Catatan Peninjau K3RS / DPO', 'Catatan (wajib bila menolak)');
  }
  /* direktori */
  S(m, '1,074', num(userRows.length)); S(m, 'Terverifikasi di RS', 'Akun terdaftar');
  var cnt = function (r) { return userRows.filter(function (u) { return u.role === r; }).length; };
  var chips = [].slice.call(m.querySelectorAll('button')).filter(function (b) { return /^(Semua|Peserta|Trainer K3|Admin)\b/.test(plain(b)); });
  var chipCls = { on: chips[0].className, off: chips[1].className }, cv = ['', 'peserta', 'trainer', 'admin'], cl = ['Semua', 'Peserta', 'Trainer K3', 'Admin'], cn = [userRows.length, cnt('peserta'), cnt('trainer'), cnt('admin')];
  chips.forEach(function (b, i) { b.className = i === 0 ? chipCls.on : chipCls.off; var sp = b.querySelectorAll('span'); if (sp[0]) sp[0].textContent = cl[i]; if (sp[1]) sp[1].textContent = num(cn[i]); b.onclick = function () { usrRole = cv[i]; usrPage = 1; chips.forEach(function (x, k) { x.className = k === i ? chipCls.on : chipCls.off; }); renderUsr(); }; });
  var us = $('user-search'); us.placeholder = 'Cari nama, username, atau unit kerja...'; us.oninput = function () { usrQ = us.value.toLowerCase(); usrPage = 1; renderUsr(); };
  gone(find(m, 'Tambah Staf K3', 'button')); gone(up(find(m, 'Sort: Paling Baru'), 1));
  var cards = repeatRow(find(m, 'Ns. Siti Rahmawati, S.Kep')); var box = cards.parentElement, sib = [].slice.call(box.children);
  USRT = { box: box, peserta: sib[0].cloneNode(true), admin: sib[1].cloneNode(true), trainer: sib[2].cloneNode(true) };
  var pg = find(m, 'Menampilkan 4 dari 1,074 personel tanggap darurat'); USRT.pgWrap = up(pg, 1); USRT.pgBtns = [].slice.call(USRT.pgWrap.querySelectorAll('button')).map(function (b) { return b.cloneNode(true); });
  USRT.edit = up(find(m, 'Edit Kredensial Staf'), 3);
  editPanel(null); renderUsr();
};
function usrFilt() { return userRows.filter(function (u) { return (!usrRole || u.role === usrRole) && (!usrQ || (u.nama + ' ' + u.username + ' ' + u.unit + ' ' + u.nik).toLowerCase().indexOf(usrQ) > -1); }); }
function renderUsr() {
  var f = usrFilt(), per = 6, np = Math.max(1, Math.ceil(f.length / per)); if (usrPage > np) usrPage = np;
  var box = USRT.box; box.innerHTML = '';
  f.slice((usrPage - 1) * per, usrPage * per).forEach(function (u) {
    var n = USRT[u.role === 'admin' ? 'admin' : u.role === 'trainer' ? 'trainer' : 'peserta'].cloneNode(true), self = U && u.uid === U.uid;
    var av = n.querySelector('div[class*="w-12"]'); if (av) av.textContent = ini(u.nama);
    var h3 = n.querySelector('h3'); if (h3) { h3.textContent = u.nama; var rb = h3.nextElementSibling; if (rb) rb.textContent = u.role === 'admin' ? 'Admin K3' : u.role === 'trainer' ? 'Trainer K3' : 'Peserta'; }
    var p1 = n.querySelector('p > span'); if (p1) p1.textContent = '@' + u.username; var mono = n.querySelector('.font-mono'); if (mono) mono.textContent = u.nik || '-';
    var tr = n.querySelectorAll('p span.truncate'); if (tr.length) tr[tr.length - 1].textContent = u.unit || '-';
    var info = n.querySelector('[class*="bg-surface-container-low"][class*="px-3"]'); if (info) { var sps = info.querySelectorAll('span'); var lab = [].slice.call(sps).filter(function (e) { return /:$/.test(e.textContent.trim()); })[0]; if (lab) lab.textContent = 'Email:'; var vl = info.lastElementChild; if (vl) vl.textContent = u.email || '-'; }
    [].slice.call(n.querySelectorAll('button')).forEach(function (b) { if (b.textContent.trim() === 'more_vert') gone(b); });
    btn(n, 'Jadikan Trainer', function () { chRole(u.uid, 'trainer'); }); btn(n, 'Jadikan Peserta', function () { chRole(u.uid, 'peserta'); });
    btn(n, 'Edit Profil', function () { editPanel(u.uid); if (window.innerWidth < 1024) USRT.edit.scrollIntoView({ behavior: 'smooth' }); });
    var del = find(n, 'Hapus', 'button'); if (del) { if (self || u.role === 'admin') hid(del); else del.onclick = function () { if (confirm('Hapus akun ' + u.nama + '? Semua data pendaftaran dan sertifikatnya ikut dihapus.')) hapusUser2(u.uid); }; }
    gone(find(n, 'Kelola Akses', 'button'));
    box.appendChild(n);
  });
  if (!f.length) box.innerHTML = '<p class="font-body-sm text-body-sm text-on-surface-variant">Tidak ada pengguna.</p>';
  var pw = USRT.pgWrap, tx = pw.firstElementChild; setTxt(tx, 'Menampilkan ' + Math.min(per, Math.max(0, f.length - (usrPage - 1) * per)) + ' dari ' + num(f.length) + ' pengguna');
  var pbox = pw.lastElementChild; pbox.innerHTML = ''; var B = USRT.pgBtns;
  var mk = function (i, label, fn, dis) { var b = B[i].cloneNode(true); b.textContent = label; b.onclick = fn; if (dis) b.disabled = true; pbox.appendChild(b); };
  mk(0, 'Sebelumnya', function () { if (usrPage > 1) { usrPage--; renderUsr(); } }, usrPage <= 1);
  var a = Math.max(1, usrPage - 1), z = Math.min(np, a + 2); a = Math.max(1, z - 2);
  for (var i = a; i <= z; i++) (function (i) { mk(i === usrPage ? 1 : 2, i, function () { usrPage = i; renderUsr(); }); })(i);
  mk(B.length - 1, 'Berikutnya', function () { if (usrPage < np) { usrPage++; renderUsr(); } }, usrPage >= np);
}
function editPanel(uid) {
  var m = $('M'), u = uid ? userRows.filter(function (x) { return x.uid === uid; })[0] : null; EDITUID = uid || '';
  var nm = $('edit-name'), nk = $('edit-nik'), dob = $('edit-dob'), un = $('edit-unit'), ph = $('edit-phone'), em = $('edit-email');
  var ok = find(m, 'Perubahan data berhasil disimpan ke audit log K3RS.'); if (ok) hid(up(ok, 1));
  hid(up(find(m, 'SHLC Main Tower'), 0)); S(m, 'Unit Kerja Operasional (43 Unit)', 'Unit Kerja (' + unitNames.length + ' unit)'); S(m, 'Nomor WhatsApp Siaga Darurat', 'Nomor WhatsApp'); S(m, 'Panel Sinkronisasi SIMRS & K3', u ? u.username : 'Pilih "Edit Profil" pada kartu pengguna'); S(m, 'Live Edit', u ? 'Mengedit' : 'Menunggu');
  S(m, 'Alamat Email Resmi Siloam', 'Alamat Email'); S(m, 'Role Kewenangan K3RS', 'Role Pengguna');
  un.innerHTML = '<option value="">-</option>' + unitNames.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('');
  nm.value = u ? u.nama : ''; nk.value = u ? u.nik : ''; dob.value = u ? tglIso(u.tgl) || u.tgl : ''; ph.value = u ? String(u.wa || '').replace(/^\+62/, '') : ''; em.value = u ? u.email : '';
  if (u) { if (unitNames.indexOf(u.unit) < 0 && u.unit) un.insertAdjacentHTML('afterbegin', '<option value="' + esc(u.unit) + '">' + esc(u.unit) + ' (saat ini)</option>'); un.value = u.unit; }
  [nm, nk, dob, un, ph, em].forEach(function (e) { e.disabled = !u; });
  var radios = [].slice.call(m.querySelectorAll('input[type="radio"]')); radios.forEach(function (rd, i) { var val = ['peserta', 'trainer', 'admin'][i]; rd.value = val; rd.checked = u ? u.role === val : false; rd.disabled = !u || val === 'admin' && !(u && u.role === 'admin') || (u && u.role === 'admin') || (u && U && u.uid === U.uid); });
  S(m, 'Otorisasi oleh Dr. Ferry Hidayat (Audit ID: SHLC-ADM-774)', 'Setiap perubahan tercatat di Log audit.');
  btn(m, 'Simpan Perubahan Data', saveEdit2);
}
async function saveEdit2() {
  if (!EDITUID) { toast('Pilih pengguna dengan tombol Edit Profil.'); return; }
  var ph = ($('edit-phone').value || '').replace(/\D/g, '').replace(/^0+/, '').replace(/^62/, '');
  var r = await api('editUser', T, EDITUID, { nama_ktp: $('edit-name').value, nik: $('edit-nik').value, tgl_lahir: $('edit-dob').value, unit_kerja: $('edit-unit').value, no_wa: ph ? '+62' + ph : '', email: $('edit-email').value });
  if (!r) return;
  var rd = $('M').querySelector('input[type="radio"]:checked'); var u = userRows.filter(function (x) { return x.uid === EDITUID; })[0];
  if (rd && u && rd.value !== u.role && (rd.value === 'peserta' || rd.value === 'trainer')) await api('setRole', T, EDITUID, rd.value);
  toast(r); V.usr();
}
async function hapusUser2(id) { var r = await api('hapusUser', T, id); if (r) { toast(r); V.usr(); } }
async function chRole(uid, role) { var r = await api('setRole', T, uid, role); if (r) { toast(r); V.usr(); } }

/* ===================== SCAN ===================== */
V.scan = async function () {
  loadScript(LIBQR).catch(function () {});
  scanLog = []; lastPid = ''; scanBusy = false;
  var s = await api('getSchedule', T), m = MS(TPL.scan), online = s && s.jenis === 'online';
  S(m, 'Code Red Modul W-14', 'Scan QR Kehadiran'); S(m, 'Presensi Mandiri Trainer', 'Presensi trainer'); S(m, 'Sesi Aktif: Tanggap Darurat Kebakaran (Code Red) - Auditorium Lt. 4', s ? 'Sesi aktif: ' + tglMid(s.tanggal) + ' ' + jamTxt(s.tanggal) : 'Belum ada jadwal aktif');
  S(m, 'Trainer ID: TR-0842', 'Trainer: ' + U.nama_ktp.split(' ')[0]); S(m, 'Continuous Fast Scanner', 'Kamera tetap menyala');
  var ct = $('continuousToggle'); if (ct) { ct.checked = true; ct.disabled = true; }
  S(m, 'HD 1080p Optical Feed', 'Kamera Langsung'); var sn = find(m, 'Sensor 36.4°C'); if (sn) gone(up(sn, 1));
  /* viewfinder: kamera asli menggantikan gambar placeholder */
  var stage = m.querySelector('img') ? m.querySelector('img').parentElement : null, img = m.querySelector('img');
  if (img) { var live = document.createElement('div'); live.id = 'qr-live'; live.className = 'absolute inset-0 w-full h-full hide bg-black overflow-hidden'; img.parentNode.insertBefore(live, img.nextSibling); }
  var cap = find(m, 'Mencari QR Code Peserta... Arahkan QR pada layar HP peserta'); if (cap) setTxt(cap, 'Tekan Mulai Kamera lalu arahkan QR di layar HP peserta');
  var stop = find(m, 'Hentikan Kamera', 'button'); stop.id = 'sb-stop'; stop.classList.add('hide'); stop.onclick = stopScan;
  var start = stop.cloneNode(true); start.id = 'sb-start'; start.removeAttribute('title'); start.classList.remove('hide'); stop.parentNode.insertBefore(start, stop); var ic1 = start.querySelector('.material-symbols-outlined'); if (ic1) ic1.textContent = 'play_circle'; S(start, 'Hentikan Kamera', 'Mulai Kamera'); start.onclick = startScan;
  gone(find(m, 'Ganti Kamera Belakang', 'button')); btn(m, 'Cek Izin & Masalah Kamera', camDiag);
  var dg = document.createElement('div'); dg.id = 'cam-diag'; dg.className = 'px-6 pb-4 text-body-sm text-white'; up(stop, 2).appendChild(dg);
  var tmp = document.createElement('div'); tmp.id = 'qr-tmp'; tmp.style.display = 'none'; m.appendChild(tmp);
  /* riwayat */
  var hr = repeatRow(find(m, 'Ns. Budi Santoso')); USRT = { hbox: hr.parentElement, htpl: hr.cloneNode(true) }; USRT.hbox.innerHTML = '';
  S(m, 'Sinkronisasi langsung ke Basis Data K3 Komite Medik', 'Tercatat langsung ke Google Sheets'); S(m, '5 Total Sesi Ini', '0 Total Sesi Ini'); S(m, 'Riwayat 5 Pindai Terakhir', 'Riwayat Pindai Terakhir');
  gone(up(find(m, 'Buka Lembar Lengkap Presensi'), 1)); var kp = find(m, 'Kapasitas Sesi: 45/60 Peserta Terdata'); if (kp) gone(up(kp, 1));
  var okl = [].slice.call(m.querySelectorAll('div')).filter(function (d) { return /BERHASIL TERCATAT/.test(d.textContent) && /Cetak Slip/.test(d.textContent); }), okc = okl[okl.length - 1]; USRT.ok = okc; hid(okc); btn(m, 'Cetak Slip', function () { window.print(); }); var xb = m.querySelector('button [class*="close"]'); 
  [].slice.call(okc.querySelectorAll('button')).forEach(function (b) { if (b.textContent.trim() === 'close') b.onclick = function () { hid(okc); }; });
  /* alternatif manual */
  var uf = find(m, 'Unggah Foto QR dari Galeri', 'button'); var fi = document.createElement('input'); fi.type = 'file'; fi.id = 'qr-file'; fi.accept = 'image/*'; fi.setAttribute('capture', 'environment'); fi.style.display = 'none'; fi.onchange = function () { scanFile(fi); }; uf.parentNode.appendChild(fi); uf.onclick = function () { fi.click(); };
  var pid = $('participantId'); pid.id = 'm-pid'; pid.placeholder = 'PTC-AB12CD'; pid.setAttribute('autocapitalize', 'characters'); btn(m, 'Catat Hadir Manual', function () { mark($('m-pid').value, 'Manual Trainer'); $('m-pid').value = ''; });
  S(m, 'Unggah berkas PNG/JPEG badge peserta', 'Foto QR dari layar HP peserta'); S(m, 'Punya Tangkapan Layar QR?', 'Kamera bermasalah?');
  S(m, 'Gunakan jika kamera laptop/tablet mengalami kendala pencahayaan di lapangan simulasi outdoor atau layar HP peserta memantulkan silau.', 'Gunakan jika kamera tidak bisa dipakai, pencahayaan buruk, atau layar HP peserta memantulkan silau.');
  S(m, 'Penanganan kendala scan optik di lapangan', 'Foto QR atau ketik ID peserta');
  logScanRender();
};
function logScanRender() {
  if (!USRT || !USRT.hbox) return; var box = USRT.hbox; box.innerHTML = '';
  scanLog.slice(0, 5).forEach(function (x) {
    var n = USRT.htpl.cloneNode(true), nm = x.m.replace(/\s*tercatat hadir\.?$/i, '').replace(/\.$/, '');
    var av = n.querySelector('div > div, div'); S(n, 'BS', ini(nm)); S(n, 'Ns. Budi Santoso', nm); S(n, 'Instalasi Gawat Darurat (IGD) • Reg. TR-902', x.src); S(n, '08:32 WIB', x.t); box.appendChild(n);
  });
  var tt = find($('M'), '0 Total Sesi Ini') || find($('M'), scanLog.length - 1 + ' Total Sesi Ini'); if (tt) setTxt(tt, scanLog.length + ' Total Sesi Ini');
  var ok = USRT.ok; if (ok && scanLog.length) { ok.classList.remove('hidden'); var x = scanLog[0], nm2 = x.m.replace(/\s*tercatat hadir\.?$/i, '').replace(/\.$/, ''); S(ok, 'Ns. Siti Rahmawati, S.Kep', nm2); S(ok, '(NIK: SHLC-2021-0842) - Unit ICU', x.m); S(ok, '08:34:12 WIB', x.t); S(ok, 'QR Kamera Trainer', x.src); gone(find(ok, 'Floor Readiness: Auditorium Lt. 4 (Evakuasi Pasien Kritis)')); gone(find(ok, '• Floor Readiness:')); }
}
function logScan(msg) { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); }; scanLog.unshift({ m: msg, t: z(d.getHours()) + '.' + z(d.getMinutes()) + ' WIB', src: scanBusy ? 'QR Kamera' : 'Manual / Foto' }); logScanRender(); }

/* ===================== LOGIN ===================== */
function initLoginView() {
  var v = $('v-login'); v.innerHTML = '<main class="w-full flex-1 flex items-center justify-center p-4">' + TPL.login + '</main>';
  var u = $('shlc-username'), p = $('shlc-password'); u.id = 'l-u'; p.id = 'l-p'; u.placeholder = 'username Anda'; u.setAttribute('autocapitalize', 'none'); u.autocomplete = 'username'; p.autocomplete = 'current-password';
  S(v, 'Username atau Email SHLC', 'Username'); S(v, 'Gunakan akun karyawan SHLC Anda untuk memulai sesi.', 'Gunakan akun karyawan SHLC Anda untuk memulai sesi.');
  p.onkeydown = u.onkeydown = function (e) { if (e.key === 'Enter') login(); };
  var eye = v.querySelector('button [class*="visibility"], button'); [].slice.call(v.querySelectorAll('button')).forEach(function (b) { if (b.textContent.trim() === 'visibility') b.onclick = function (e) { e.preventDefault(); p.type = p.type === 'password' ? 'text' : 'password'; }; });
  var rem = find(v, 'Ingat saya'); if (rem) { var row = up(rem, 1); var lf = find(v, 'Lupa password?', 'a,button'); lf.onclick = function (e) { e.preventDefault(); show('v-forgot'); }; lf.removeAttribute('href'); if (row.firstElementChild === rem || row.contains(rem)) gone(rem.closest('label') || rem); }
  var lb = find(v, 'Masuk ke Aplikasi', 'button'); lb.id = 'l-btn'; lb.type = 'button'; lb.onclick = function () { login(); };
  var dv = find(v, 'atau'); var gb = document.createElement('div'); gb.id = 'g-btn'; gb.className = 'flex justify-center min-h-[44px] mb-4'; var gs = up(dv, 1); gs.id = 'g-sep'; gs.parentNode.insertBefore(gb, gs.nextSibling);
  var su = find(v, 'Daftar akun baru', 'a,button'); su.removeAttribute('href'); su.onclick = function (e) { e.preventDefault(); show('v-signup'); loadUnits(); };
  S(v, 'REV.2025', 'V4.0'); S(v, 'EN-133', 'SHLC');
  var chp = up(find(v, 'Registrasi &'), 3); if (chp) chp.classList.add('hidden', 'md:grid'); var otr = up(find(v, 'Otoritas Keselamatan Kerja'), 2); if (otr) otr.classList.add('hidden', 'lg:flex');
  var f = v.querySelector('form'); if (f) f.onsubmit = function (e) { e.preventDefault(); login(); };
}
