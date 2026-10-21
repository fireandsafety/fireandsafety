# Panduan Instalasi - Training Fire & Safety Super App SHLC v4

Arsitektur: **Frontend** (HTML/CSS/JS) di GitHub Pages, **Backend** Google Apps Script sebagai API JSON, **data** tetap di Google Sheets. Login: username/password dan **Google OAuth 2.0**.

## Bagian A - Backend (Apps Script)

1. Buka proyek Apps Script yang sekarang. Hapus isi lama, lalu buat 5 berkas dan tempel isinya dari paket ini: `Kode.gs`, `Api.gs`, `Notifikasi.gs`, `Migrasi.gs`, `DocEngine.gs`. Berkas `Index.html` lama tidak dipakai lagi (hapus).
2. Di `Kode.gs` baris 5, isi `SS_ID` dengan ID Sheet Anda yang sekarang. Memakai Sheet yang sama berarti **semua data tetap ada, tanpa migrasi**.
3. Buka Project Settings > centang "Show appsscript.json", lalu ganti isinya dengan `appsscript.json` dari paket (menambah izin Docs untuk modul Dokumen).
4. Jalankan berurutan dari editor (izinkan akses bila diminta): `setup()` > `setupApi()` > `isiUnitAwal()` > `pasangTrigger()`. Akun admin baru: `buatAdmin()`.
5. Deploy > Manage deployments > ikon pensil > Version: **New version** > Deploy. Pengaturan: Execute as **Me**, Who has access **Anyone**. Salin URL Web App (akhiran `/exec`). Jika ini deployment pertama, pilih New deployment.

## Bagian B - Frontend (GitHub Pages)

1. Buka `frontend/js/config.js`, ganti `GAS_URL` dengan URL `/exec` tadi. Simpan.
2. Buat akun di github.com, lalu repository baru, mis. `shlc-fire-safety` (Public).
3. Unggah seluruh isi folder `frontend` (bukan folder luarnya): Add file > Upload files, seret semua berkas dan folder, Commit. Berkas `.nojekyll` harus ikut.
4. Settings > Pages > Source: Deploy from a branch > `main` / `/ (root)` > Save. Tunggu 1 sampai 3 menit. Alamat: `https://AKUN.github.io/shlc-fire-safety/`.
5. Kembali ke editor Apps Script, jalankan sekali: `setFrontendUrl("https://AKUN.github.io/shlc-fire-safety")`. Ini membuat QR sertifikat dan tautan reset password mengarah ke frontend baru.
6. Update berikutnya: ganti berkas yang berubah di repository, Commit, tunggu 1 menit, muat ulang (Ctrl+F5).

## Bagian C - Login Google OAuth 2.0

1. console.cloud.google.com > buat project (mis. "SHLC Fire Safety").
2. APIs & Services > OAuth consent screen. Akun Google Workspace rumah sakit: pilih **Internal**. Akun Gmail biasa: **External**, isi nama aplikasi dan email, lalu tambahkan email semua pengguna uji di Test users (atau Publish app).
3. Credentials > Create credentials > OAuth client ID > Application type **Web application**.
4. Authorized JavaScript origins: `https://AKUN.github.io` (hanya domain, **tanpa** nama repository dan tanpa garis miring akhir). Create.
5. Salin Client ID (`...apps.googleusercontent.com`). Masukkan lewat menu admin **Lainnya > Keamanan**, atau jalankan `setGoogleClientId("....apps.googleusercontent.com")`.
6. Muat ulang aplikasi: tombol **Masuk dengan Google** muncul. Pengguna yang emailnya cocok dengan akun aplikasi langsung masuk; email baru diarahkan melengkapi pendaftaran.
7. Opsional di menu Keamanan: batasi domain email, dan **Wajibkan Google untuk trainer dan admin** (password staf dinonaktifkan). Pastikan semua staf sudah berhasil masuk dengan Google sebelum mengaktifkan. Bila terkunci: jalankan `matikanGoogleWajib()` dari editor.

Catatan keamanan: token Google diverifikasi di server (penerbit, audiens Client ID, kedaluwarsa, email terverifikasi). Sesi memakai token HMAC bertanda tangan; reset password atau "keluar dari semua perangkat" mencabut sesi lama. Data pribadi staf tidak disimpan di cache perangkat.

## Bagian D - Modul

- **Notifikasi WhatsApp (Fonnte)**: Lainnya > Notifikasi. Isi token Fonnte, aktifkan, atur kejadian dan pesan, uji ke nomor sendiri. Blast dikirim bertahap (10/20/50 per putaran) oleh trigger 5 menit. Kontak yang opt-out tidak menerima blast.
- **Kontak (CRM)**: Lainnya > Kontak > Sinkron dari akun, lalu Deteksi nomor WA.
- **Migrasi**: Lainnya > Migrasi. Tempel URL spreadsheet aplikasi **lama**, tekan Pindai (tidak menulis), periksa laporan, lalu Jalankan Impor. Aman diulang. Impor karyawan juga bisa dari CSV.
- **Dokumen**: Lainnya > Dokumen. Rancang templat di Google Slides/Docs dengan penanda `{{NAMA}}`, `{{ISI_KEGIATAN}}`, `{{NOMOR}}`, `{{QR}}`, `{{NAMA_PEJABAT_1}}`, `{{JABATAN_1}}`, `{{TTD_1}}`. Daftarkan pejabat (email = email akunnya, PIN 6-10 angka), simpan templat, terbitkan. Dokumen dengan TTD berstatus menunggu sampai pejabat memasukkan PIN.

## Bagian E - Daftar periksa setelah pasang

1. Buka URL frontend: halaman login tampil. 2. Login admin. 3. Menu Unit berisi 43 unit. 4. Daftar peserta uji, hadir, kuis. 5. Sertifikat terbit, buka QR-nya di HP (halaman Sertifikat VALID). 6. Uji WA ke nomor sendiri. Daftar uji lengkap: dokumen "Daftar Uji di Apps Script Asli".

## Masalah umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| "Alamat server belum diisi" | config.js belum diubah | Isi GAS_URL, unggah ulang |
| "Koneksi terputus" terus | Deployment bukan Anyone, atau URL salah | Deploy New version, akses Anyone, pakai URL `/exec` |
| Tombol Google tidak muncul | Client ID kosong atau origin salah | Ulangi Bagian C langkah 4-5 |
| "Token Google bukan untuk aplikasi ini" | Client ID berbeda | Samakan Client ID |
| Perubahan kode tidak terasa | Lupa New version | Deploy > Manage deployments > New version |
| Halaman lama masih tampil | Cache service worker | Ctrl+F5 atau hapus data situs |
