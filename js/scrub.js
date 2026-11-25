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
    ['.builder', 1.0, 0.55]
  ];
  var items = [];
  MAP.forEach(function (m) {
    [].forEach.call(document.querySelectorAll(m[0]), function (el) {
      var f = el.dataset.spFrom ? +el.dataset.spFrom : m[1], t = el.dataset.spTo ? +el.dataset.spTo : m[2];
      items.push({ el: el, f: f, t: t, last: -1 });
    });
  });
  var queued = false;
  function update() {
    queued = false;
    var vh = window.innerHeight;
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
