/* sw.js - cache shell aplikasi agar terbuka instan dan tetap tampil saat sinyal buruk. Permintaan ke server (GAS) TIDAK pernah di-cache di sini. */
var V = 'shlc-v5-1';
var SHELL = ['./', 'index.html', 'css/app.css', 'css/legacy.css', 'js/config.js', 'js/qrcode.js', 'js/icons.js', 'js/core.js', 'js/tpl.js', 'js/dom.js', 'js/views-user.js', 'js/views-staff.js', 'js/views-modules.js', 'js/views-stitch.js', 'js/views-stitch2.js', 'js/main.js',
  'assets/icons.woff2', 'assets/fonts/dm-400.woff2', 'assets/fonts/dm-500.woff2', 'assets/fonts/dm-700.woff2', 'assets/fonts/sora-600.woff2', 'assets/fonts/sora-700.woff2', 'assets/fonts/sora-800.woff2', 'assets/logo-siloam.png', 'assets/logo-api.png', 'assets/banner.jpg', 'assets/icon-192.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== V; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  var isFont = /\.woff2$/.test(u.pathname);
  if (isFont) { e.respondWith(caches.match(e.request).then(function (c) { return c || fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(V).then(function (x) { x.put(e.request, cp); }); return r; }); })); return; }   // font: cache dulu (tidak berubah)
  e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request); }));   // lainnya: jaringan dulu, cache bila offline
});
