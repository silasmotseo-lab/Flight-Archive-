/* FLIGHT ARCHIVE — recovered footage. Tap to play with sound, tap again to pause. */
(function () {
  'use strict';
  var box = document.getElementById('tape'), v = document.getElementById('tape-v');
  if (!box || !v) return;
  var tc = document.getElementById('tape-tc'), prog = document.getElementById('tape-prog');
  function mmss(s) { s = Math.floor(s || 0); return '00:' + (s < 10 ? '0' : '') + s; }
  function toggle() {
    if (v.paused) {
      var bb = document.querySelector('.cockpit audio'); if (bb && !bb.paused) bb.pause();
      try { navigator.vibrate && navigator.vibrate(15); } catch (e) {}
      v.play();
    } else v.pause();
  }
  box.addEventListener('click', toggle);
  v.addEventListener('play', function () { box.classList.add('on'); });
  v.addEventListener('pause', function () { box.classList.remove('on'); });
  v.addEventListener('ended', function () { box.classList.remove('on'); v.currentTime = 0; });
  v.addEventListener('timeupdate', function () {
    tc.textContent = mmss(v.currentTime) + ' / 00:45';
    prog.style.width = (v.currentTime / (v.duration || 45) * 100) + '%';
  });
  // stop the tape if it scrolls off screen
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting && !v.paused) v.pause(); }); }, { threshold: 0.2 }).observe(box);
})();
