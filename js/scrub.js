/* FLIGHT ARCHIVE — scroll scrub.
   Every reveal is tied to scroll position instead of a timer: scroll down and it plays,
   scroll back up and it rewinds. Each element gets --sp (0→1) from where its top edge
   sits in the viewport: 0 when it is at `from` (fraction of screen height), 1 at `to`. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement; root.classList.add('scrub');
  // selector → [from, to]
  var MAP = [
    ['.space__head', 1.0, 0.55],
    ['.crt', 0.82, 0.12],
    ['.card', 1.02, 0.5],
    ['.ev', 0.98, 0.42],
    ['.ev--clip .clip', 1.02, 0.55],
    ['.folder', 0.9, 0.05],
    ['.dossier > div', 0.95, 0.55],
    ['.recorder', 1.0, 0.45],
    ['.memcard', 1.0, 0.45],
    ['.tape', 1.0, 0.5],
    ['.builder', 1.0, 0.55],
    ['.footage', 0.35, -0.2],
    ['.registry', 1.0, 0.15],
    ['.recovery', 1.0, 0.0]
  ];
  var items = [];
  MAP.forEach(function (m) {
    [].forEach.call(document.querySelectorAll(m[0]), function (el) {
      var f = el.dataset.spFrom ? +el.dataset.spFrom : m[1], t = el.dataset.spTo ? +el.dataset.spTo : m[2];
      items.push({ el: el, f: f, t: t, last: -1 });
    });
  });
  // section exits: --ex 0→1 as a section's bottom edge travels from mid-screen to the top
  var secs = [].slice.call(document.querySelectorAll('main > section'));
  // title letters: each one assembles from its own scattered 3D position
  [].forEach.call(document.querySelectorAll('.space__title'), function (t) {
    if (t.dataset.split) return; t.dataset.split = '1';
    var txt = t.textContent; t.textContent = ''; t.setAttribute('aria-label', txt);
    var n = 0;
    txt.split(' ').forEach(function (w, wi) {
      if (wi) t.appendChild(document.createTextNode(' '));
      var ws = document.createElement('span'); ws.className = 'tw'; ws.setAttribute('aria-hidden', 'true'); t.appendChild(ws);
      for (var k = 0; k < w.length; k++, n++) {
        var c = document.createElement('span'); c.className = 'tl'; c.textContent = w[k];
        var a = Math.sin(n * 12.9898 + txt.length) * 43758.5453; a -= Math.floor(a);
        var b = Math.sin(n * 78.233 + 4.1) * 12543.123; b -= Math.floor(b);
        c.style.setProperty('--i', n);
        c.style.setProperty('--lx', ((a - .5) * 160).toFixed(0) + 'px');
        c.style.setProperty('--ly', ((b - .5) * 120 - 30).toFixed(0) + 'px');
        c.style.setProperty('--lz', (-(200 + a * 500)).toFixed(0) + 'px');
        c.style.setProperty('--lr', ((b - .5) * 140).toFixed(0) + 'deg');
        ws.appendChild(c);
      }
    });
  });
  var queued = false;
  function update() {
    queued = false;
    var vh = window.innerHeight;
    for (var j = 0; j < secs.length; j++) {
      var rb = secs[j].getBoundingClientRect().bottom;
      var ex = Math.max(0, Math.min(1, (vh * 0.55 - rb) / (vh * 0.55)));
      ex = Math.round(ex * 1000) / 1000;
      if (secs[j]._ex !== ex) { secs[j].style.setProperty('--ex', ex); secs[j]._ex = ex; }
    }
    for (var i = 0; i < items.length; i++) {
      var it = items[i], top = it.el.getBoundingClientRect().top;
      var p = (vh * it.f - top) / (vh * (it.f - it.t));
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      p = Math.round(p * 1000) / 1000;
      if (p !== it.last) { it.el.style.setProperty('--sp', p); it.last = p; }
    }
  }
  function q() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', q, { passive: true }); window.addEventListener('resize', q);
  update();
  window.FAScrub = { refresh: q };
})();
