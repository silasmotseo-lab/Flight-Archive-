/* FLIGHT ARCHIVE — evidence locker: torch beam, swinging tags, cards that react. */
(function () {
  'use strict';
  var table = document.querySelector('.locker .table'); if (!table) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = [].slice.call(table.querySelectorAll('.card'));
  var tx = 50, ty = 30, goalX = 50, goalY = 30, manualUntil = 0, lastY = window.scrollY, sw = 0, visible = false;

  // torch: lights the middle of your screen, sways a little, follows your finger
  function aim(cx, cy) {
    var r = table.getBoundingClientRect();
    goalX = (cx - r.left) / r.width * 100; goalY = (cy - r.top) / r.height * 100;
  }
  function onPointer(e) { var p = e.touches ? e.touches[0] : e; aim(p.clientX, p.clientY); manualUntil = performance.now() + 1600; }
  table.addEventListener('pointermove', onPointer); table.addEventListener('touchmove', onPointer, { passive: true });
  table.addEventListener('pointerdown', onPointer);

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) loop(); }, { rootMargin: '100px' }).observe(table);
  else visible = true;

  var running = false;
  function loop() {
    if (running || reduce) return; running = true;
    (function f(now) {
      if (!visible) { running = false; return; }
      if (now > manualUntil) {
        var r = table.getBoundingClientRect();
        var cx = window.innerWidth / 2 + Math.sin(now / 1400) * Math.min(120, r.width * 0.28);
        aim(cx, window.innerHeight * 0.48 + Math.cos(now / 1900) * 40);
      }
      tx += (goalX - tx) * 0.08; ty += (goalY - ty) * 0.08;
      table.style.setProperty('--tx', tx.toFixed(2) + '%'); table.style.setProperty('--ty', ty.toFixed(2) + '%');
      // whichever card the beam is on is lit above the dark
      var r2 = table.getBoundingClientRect(), bx = r2.left + tx / 100 * r2.width, by = r2.top + ty / 100 * r2.height;
      cards.forEach(function (c) { var b = c.getBoundingClientRect(); var on = c.classList.contains('is-on') || c.classList.contains('is-open') || (bx > b.left - 40 && bx < b.right + 40 && by > b.top - 30 && by < b.bottom + 30); c.classList.toggle('lit', on); });
      // tags swing with scroll speed
      var dy = window.scrollY - lastY; lastY = window.scrollY;
      sw += (Math.max(-14, Math.min(14, dy * 0.6)) - sw) * 0.2;
      table.style.setProperty('--sw', sw.toFixed(2));
      requestAnimationFrame(f);
    })(performance.now());
  }

  function countUp(el) {
    var to = +el.getAttribute('data-to'), t0 = performance.now();
    (function f(now) { var k = Math.min(1, (now - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  function wave(card) {
    var pl = card.querySelector('.fx__wave'); if (!pl) return; var t0 = performance.now();
    (function f(now) {
      if (!card.classList.contains('is-on')) return;
      var t = (now - t0) / 1000, pts = '';
      for (var i = 0; i <= 120; i++) {
        var x = i * 2, drop = Math.sin(i * 0.37 + t * 9) > 0.55 ? 0.1 : 1;   // signal keeps dropping out (31%)
        var y = 24 + Math.sin(i * 0.9 + t * 14) * Math.sin(i * 0.13 + t * 3) * 18 * drop * (0.4 + Math.random() * 0.6);
        pts += x + ',' + y.toFixed(1) + ' ';
      }
      pl.setAttribute('points', pts); requestAnimationFrame(f);
    })(t0);
  }
  [].forEach.call(table.querySelectorAll('.card--act'), function (c) {
    function go() {
      var on = c.classList.toggle('is-on'); c.setAttribute('aria-expanded', on);
      try { navigator.vibrate && navigator.vibrate(on ? 12 : 6); } catch (e) {}
      if (!on) return;
      [].forEach.call(c.querySelectorAll('[data-to]'), countUp);
      if (c.getAttribute('data-act') === 'memo') wave(c);
      if (c.getAttribute('data-act') === 'uv') [].forEach.call(c.querySelectorAll('.fx__ln'), function (l) { l.style.animation = 'none'; void l.offsetWidth; l.style.animation = ''; });
    }
    c.addEventListener('click', go);
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
})();
