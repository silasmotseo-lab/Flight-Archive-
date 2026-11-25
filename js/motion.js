/* FLIGHT ARCHIVE — scroll motion: CRT power-on and boot, self-opening file, folder, count-ups */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (reduce || !('IntersectionObserver' in window)) return;

  function once(el, threshold, fn) {
    if (!el) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { threshold: threshold });
    io.observe(el);
  }

  /* ── CRT: power-on, then the screen types itself ── */
  var crt = document.getElementById('crt');
  if (crt) {
    var glass = crt.querySelector('.crt__glass');
    var roll = document.createElement('div'); roll.className = 'crt__roll'; glass.appendChild(roll);
    crt.classList.add('crt--off');
    var touched = false;
    crt.addEventListener('pointerdown', function () { touched = true; });
    crt.addEventListener('keydown', function () { touched = true; });

    if (root.classList.contains('scrub')) {
      /* scroll-linked: the tube warms up, then each line and folder types in as you scroll; scroll up rewinds */
      var sLines = [].slice.call(crt.querySelectorAll('.crt__top p, .crt__h'));
      var sDirs = [].slice.call(crt.querySelectorAll('.dir'));
      crt.classList.remove('crt--off'); crt.classList.add('crt--scrub');
      var steps = sLines.length + sDirs.length, ready = false, sq = false;
      function crtScrub() {
        sq = false;
        var sp = parseFloat(crt.style.getPropertyValue('--sp')) || 0;
        var pw = Math.min(1, sp / 0.22);
        crt.style.setProperty('--pw', pw.toFixed(3));
        var span = 0.7 / Math.max(1, steps);              // lines and folders share 0.24 → 0.94
        sLines.forEach(function (l, i) {
          var a = 0.24 + i * span, lp = Math.max(0, Math.min(1, (sp - a) / span));
          l.style.setProperty('--lp', lp.toFixed(3));
        });
        sDirs.forEach(function (d, i) {
          var a = 0.24 + (sLines.length + i) * span;
          d.classList.toggle('shown', sp >= a);
        });
        if (!ready && sp >= 0.96) { ready = true; crt.classList.add('crt--ready'); }
      }
      window.addEventListener('scroll', function () { if (!sq) { sq = true; requestAnimationFrame(crtScrub); } }, { passive: true });
      crtScrub();
    } else once(crt, 0.3, function () {
      crt.classList.remove('crt--off'); crt.classList.add('crt--on');
      var lines = [].slice.call(crt.querySelectorAll('.crt__top p, .crt__h'));
      var dirs = [].slice.call(crt.querySelectorAll('.dir'));
      var t = 750;
      lines.forEach(function (l) { setTimeout(function () { l.classList.add('typed'); }, t); t += 380; });
      dirs.forEach(function (d) { setTimeout(function () { d.classList.add('shown'); }, t); t += 140; });
      setTimeout(function () { crt.classList.add('crt--ready'); }, t + 200);
    });

    /* keep scrolling and the terminal opens the pilot notes by itself */
    var opened = false;
    window.addEventListener('scroll', function () {
      if (opened || touched || !crt.classList.contains('crt--ready')) return;
      var r = crt.getBoundingClientRect(), vh = window.innerHeight;
      if (r.top < vh * 0.12 && r.bottom > vh * 0.6) {
        opened = true;
        var f = [].filter.call(crt.querySelectorAll('.file__name'), function (n) { return n.textContent === 'pilot_notes.txt'; })[0];
        if (f) f.parentNode.click();
      }
    }, { passive: true });
  }

  /* ── PERSONNEL: the folder cover flips open ── */
  var folder = document.querySelector('.folder');
  once(folder, 0.35, function () { folder.classList.add('open'); });

  /* ── NUMBERS: count up into place ── */
  function countUp(el) {
    var target = el.getAttribute('data-count'), n = parseInt(target, 10), pad = target.length, start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(n * e)).padStart(pad, '0');
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0'.padStart(pad, '0');
    requestAnimationFrame(step);
  }
  var hero = [].slice.call(document.querySelectorAll('.status [data-count]'));
  hero.forEach(function (el) { el.textContent = '0'.padStart(el.getAttribute('data-count').length, '0'); });
  (function waitReady() {
    if (root.classList.contains('ready')) setTimeout(function () { hero.forEach(countUp); }, 500);
    else setTimeout(waitReady, 120);
  })();
  [].forEach.call(document.querySelectorAll('[data-count]:not(.status [data-count])'), function (el) { once(el, 0.6, function () { countUp(el); }); });
})();
