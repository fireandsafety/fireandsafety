/* sw.js - cache aplikasi (shell) agar terbuka instan dan tetap tampil saat sinyal buruk. Permintaan ke server (GAS) TIDAK pernah di-cache di sini. */
var V = 'shlc-v4-1';
var SHELL = ['./', 'index.html', 'css/style.css', 'js/config.js', 'js/qrcode.js', 'js/icons.js', 'js/core.js', 'js/views-user.js', 'js/views-staff.js', 'js/views-modules.js', 'js/main.js', 'assets/logo-siloam.png', 'assets/logo-api.png', 'assets/banner.jpg', 'assets/icon-192.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== V; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request); }));   // jaringan dulu (selalu versi terbaru), cache bila offline
});
