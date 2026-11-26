/* FLIGHT ARCHIVE — Player One.
   Third person (you watch Si at the CRT) → press start → the camera dives into the screen
   → you land in the archive terminal as the player. Tap, Enter/Space, or a real controller. */
(function () {
  'use strict';
  var sec = document.getElementById('console'), btn = document.getElementById('press-start');
  if (!sec || !btn) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false, inView = false;
  var flash = document.createElement('div'); flash.className = 'cv-flash'; flash.setAttribute('aria-hidden', 'true'); document.body.appendChild(flash);

  // slow push-in while the scene scrolls past
  var scrub = document.documentElement.classList.contains('scrub');
  function onScroll() {
    var r = sec.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    sec.style.setProperty('--cv', p.toFixed(3));
    inView = r.top < vh * 0.5 && r.bottom > vh * 0.5;
    if (scrub && !busy) {
      // pinned: 0 when the scene locks to the top, 1 when it lets go
      var q = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      var d = Math.min(1, Math.max(0, (q - 0.18) / 0.62));
      d = d < .5 ? 4 * d * d * d : 1 - Math.pow(-2 * d + 2, 3) / 2;       // ease in-out
      sec.style.setProperty('--dv', d.toFixed(4));
      // shake, colour split and tearing peak mid-dive and calm as you come through the glass
      var bump = 4 * d * (1 - d), jit = bump * (d > 0.15 ? 1 : 0);
      sec.style.setProperty('--bump', bump.toFixed(3));
      sec.style.setProperty('--sx', ((Math.random() - .5) * 10 * jit).toFixed(1) + 'px');
      sec.style.setProperty('--sy', ((Math.random() - .5) * 8 * jit).toFixed(1) + 'px');
      sec.style.setProperty('--ca', (0.2 + bump * 1.6 + (Math.random() < .2 ? bump * 2 : 0)).toFixed(2));
      sec.style.setProperty('--t1', ((Math.random() - .5) * 40 * bump).toFixed(1) + '%');
      sec.style.setProperty('--t2', ((Math.random() - .5) * 60 * bump).toFixed(1) + '%');
      sec.style.setProperty('--t1y', (10 + Math.random() * 70).toFixed(0) + '%');
      sec.style.setProperty('--t2y', (10 + Math.random() * 80).toFixed(0) + '%');
      sec.style.setProperty('--nx', ((Math.random() - .5) * 40).toFixed(0) + '%');
      sec.style.setProperty('--ny', ((Math.random() - .5) * 40).toFixed(0) + '%');
      // green flash as you go through the glass, fading as the terminal arrives
      var f = q < 0.68 ? 0 : Math.min(1, (q - 0.68) / 0.2);
      // once the scene unpins, the flash covers the hand-off and fades as the terminal slides in
      if (q >= 1) f = Math.max(0, Math.min(1, (r.bottom - vh * 0.3) / (vh * 0.7)));
      if (r.top > vh) f = 0;
      flash.style.opacity = f.toFixed(3);
      if (q > 0.6 && !buzzed) { buzzed = true; try { navigator.vibrate && navigator.vibrate([12, 30, 40]); } catch (e) {} }
      if (q < 0.3) buzzed = false;
    }
  }
  var buzzed = false;
  // keep the glitch alive while you hold still mid-dive
  setInterval(function () { var d = parseFloat(sec.style.getPropertyValue('--dv')) || 0; if (scrub && !busy && d > 0.12 && d < 0.97) onScroll(); }, 70);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function land() {
    var target = document.getElementById('archive');
    if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 24, behavior: 'instant' });
    var input = document.getElementById('crt-in');
    if (input && window.matchMedia('(hover: hover)').matches) setTimeout(function () { input.focus({ preventScroll: true }); }, 900);
  }

  function start() {
    if (busy) return; busy = true;
    try { navigator.vibrate && navigator.vibrate([12, 30, 60]); } catch (e) {}
    if (reduce) { land(); busy = false; return; }
    // line the scene up full-screen first so the dive lands dead centre on the CRT
    window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    sec.classList.add('go'); flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    setTimeout(land, 1150);                       // jump while the screen is fully green
    setTimeout(function () { sec.classList.remove('go'); flash.classList.remove('on'); busy = false; }, 1950);
  }
  btn.addEventListener('click', start);

  document.addEventListener('keydown', function (e) {
    if (!inView || busy) return;
    if (e.key === 'Enter' || e.key === ' ') { if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return; e.preventDefault(); start(); }
  });

  // real controllers: START (9) or A/Cross (0)
  var polling = false, was = {};
  function poll() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [], any = false;
    for (var i = 0; i < pads.length; i++) {
      var g = pads[i]; if (!g) continue; any = true;
      [9, 0].forEach(function (b) {
        var down = g.buttons[b] && g.buttons[b].pressed, k = i + ':' + b;
        if (down && !was[k] && inView) start();
        was[k] = down;
      });
    }
    if (any) requestAnimationFrame(poll); else polling = false;
  }
  window.addEventListener('gamepadconnected', function () {
    var hint = sec.querySelector('.console__hint'); if (hint) hint.textContent = 'CONTROLLER CONNECTED · PRESS START';
    if (!polling) { polling = true; requestAnimationFrame(poll); }
  });
})();
