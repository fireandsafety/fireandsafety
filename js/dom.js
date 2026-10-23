/* dom.js - pengikat data ke markup Stitch: markup tetap 100% asli, hanya teks/atribut yang diganti */
function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
function plain(el) {
  var t = '';
  (function w(n) { if (n.nodeType === 3) t += n.nodeValue; else if (n.nodeType === 1 && !(n.classList && n.classList.contains('material-symbols-outlined'))) for (var c = n.firstChild; c; c = c.nextSibling) w(c); })(el);
  return norm(t);
}
function find(root, text, sel) {                                  // elemen terdalam yang teksnya (tanpa ikon) sama persis; sel = naik ke leluhur terdekat yang cocok
  var want = norm(text), els = root.querySelectorAll('*'), i, e, k, ok;
  for (i = 0; i < els.length; i++) {
    e = els[i]; if (plain(e) !== want) continue;
    ok = true; for (k = 0; k < e.children.length; k++) if (plain(e.children[k]) === want) { ok = false; break; }
    if (ok) return sel ? e.closest(sel) : e;
  }
  return null;
}
function findAll(root, text, sel) {
  var want = norm(text), out = [], els = root.querySelectorAll('*'), i, e, k, ok;
  for (i = 0; i < els.length; i++) {
    e = els[i]; if (plain(e) !== want) continue;
    ok = true; for (k = 0; k < e.children.length; k++) if (plain(e.children[k]) === want) { ok = false; break; }
    if (ok) out.push(sel ? e.closest(sel) : e);
  }
  return out;
}
function setTxt(el, v) {
  if (!el) return el; v = String(v == null ? '' : v);
  var tn = null, c;
  for (c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim()) { tn = c; break; }
  if (tn) { tn.nodeValue = ' ' + v + ' '; for (c = tn.nextSibling; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim()) c.nodeValue = ' '; }
  else if (!el.children.length) el.textContent = v; else el.appendChild(document.createTextNode(' ' + v));
  return el;
}
function S(root, from, to, sel) { return setTxt(find(root, from, sel), to); }
function Hh(root, from, html, sel) { var e = find(root, from, sel); if (e) e.innerHTML = html; return e; }
function btn(root, label, fn) { var e = find(root, label, 'button,a,label'); if (e) { e.onclick = function (ev) { if (ev) ev.preventDefault(); fn.call(e, ev); }; e.removeAttribute('href'); } return e; }
function gone(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
function hid(el) { if (el) el.classList.add('hidden'); }
function up(el, n) { while (el && n-- > 0) el = el.parentElement; return el; }
function fill(container, sampleSel, items, fn, limit) {            // gandakan contoh pertama untuk tiap data
  var smp = container.querySelector(sampleSel); if (!smp) return;
  var tpl = smp.cloneNode(true), par = smp.parentNode, nodes = par.querySelectorAll(':scope > ' + sampleSel);
  for (var i = 0; i < nodes.length; i++) par.removeChild(nodes[i]);
  items.slice(0, limit || 500).forEach(function (it, ix) { var n = tpl.cloneNode(true); fn(n, it, ix); par.appendChild(n); });
}
var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function tglPanjang(s) { var d = pd(s); return isNaN(d) ? '-' : HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear(); }
function tglPendek(s) { var d = pd(s); return isNaN(d) ? '-' : d.getDate() + ' ' + BLN[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(); }
function jamTxt(s) { var d = pd(s); return isNaN(d) ? '' : ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2) + ' WIB'; }
function tglIso(s) { var d = pd(s); return isNaN(d) ? '' : d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function num(n) { return String(n == null ? 0 : n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function MS(h) { var m = $('M'); m.innerHTML = h; M.last = null; return m; }   // layar Stitch: markup asli apa adanya
function cardOf(el) { return el ? (el.closest('[class*="rounded-[20px]"]') || el.closest('section') || up(el, 3)) : null; }
