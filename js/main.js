/* FLIGHT ARCHIVE — Gate + Hangar director */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── THE GATE: once per session, under 2 s, tap or key to skip ── */
  var gate = document.getElementById('gate');
  var gateTimer = null;

  function ready() { root.classList.add('ready'); }

  function closeGate() {
    if (gateTimer) { clearTimeout(gateTimer); gateTimer = null; }
    try { sessionStorage.setItem('fa-gate', '1'); } catch (e) {}
    gate.classList.add('is-done');
    if (window.FASkyline) setTimeout(window.FASkyline.stop, 700);
    setTimeout(ready, reduce ? 0 : 250);
    window.removeEventListener('keydown', closeGate);
  }

  if (root.classList.contains('gate-on') && gate) {
    if (window.FASkyline) window.FASkyline.start();
    gate.addEventListener('click', closeGate);
    window.addEventListener('keydown', closeGate);
    gateTimer = setTimeout(closeGate, reduce ? 900 : 3200);
  } else {
    requestAnimationFrame(ready);
  }

  /* ── SCROLL CAMERA: push toward the pilot, then cut to black ── */
  var hangar = document.getElementById('hangar');
  var ticking = false;

  function update() {
    ticking = false;
    var h = hangar.offsetHeight || window.innerHeight;
    var p = Math.min(1, Math.max(0, window.scrollY / h));
    hangar.style.setProperty('--p', reduce ? 0 : p.toFixed(4));
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  /* ── pause the hangar's animations when it is off screen ── */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { hangar.classList.toggle('paused', !e.isIntersecting); });
    }, { threshold: 0 }).observe(hangar);
  }
})();
