/* FLIGHT ARCHIVE — scroll-scrubbed film scenes (flight recorder, cockpit finale).
   A pinned section holds a <canvas data-seq="/assets/seq/name_" data-frames="N">.
   Scroll progress through the pin picks the frame; scroll up rewinds. Frames lazy-load
   in order once the scene is near, so they never slow the first screen. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scenes = [].map.call(document.querySelectorAll('canvas[data-seq]'), function (cv) {
    return { cv: cv, ctx: cv.getContext('2d'), base: cv.dataset.seq, n: +cv.dataset.frames || 0,
      sec: cv.closest('section'), imgs: [], loading: false, last: -1, q: 0 };
  });
  if (!scenes.length) return;

  function path(s, i) { return s.base + String(i).padStart(3, '0') + '.webp'; }
  function size(s) {
    var r = s.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (s.cv.width !== w || s.cv.height !== h) { s.cv.width = w; s.cv.height = h; s.last = -1; }
  }
  function draw(s, i) {
    // nearest loaded frame at or before i, so a fast scroll never shows a blank
    var k = i; while (k > 0 && !s.imgs[k]) k--;
    var im = s.imgs[k]; if (!im || k === s.last) return;
    s.last = k;
    var cw = s.cv.width, ch = s.cv.height, iw = im.naturalWidth, ih = im.naturalHeight;
    var sc = Math.max(cw / iw, ch / ih), dw = iw * sc, dh = ih * sc;   // cover
    s.ctx.drawImage(im, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }
  function load(s) {
    if (s.loading) return; s.loading = true;
    var next = 0, inflight = 0;
    (function pump() {
      while (inflight < 6 && next < s.n) {
        (function (i) {
          var im = new Image(); inflight++;
          im.onload = function () { inflight--; s.imgs[i] = im; if (i === 0 || Math.abs(i - Math.round(s.q * (s.n - 1))) < 3) { s.last = -1; draw(s, Math.round(s.q * (s.n - 1))); } pump(); };
          im.onerror = function () { inflight--; pump(); };
          im.src = path(s, i);
        })(next++);
      }
    })();
  }
  var queued = false;
  function update() {
    queued = false;
    var vh = window.innerHeight;
    scenes.forEach(function (s) {
      var r = s.sec.getBoundingClientRect();
      if (r.top < vh * 2.5 && r.bottom > -vh) load(s);            // start loading a little early
      if (r.bottom < 0 || r.top > vh) return;
      var q = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      s.q = q; s.sec.style.setProperty('--fq', q.toFixed(4));
      size(s); draw(s, reduce ? s.n - 1 : Math.round(q * (s.n - 1)));
    });
  }
  function q() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', q, { passive: true }); window.addEventListener('resize', function () { scenes.forEach(function (s) { s.last = -1; }); q(); });
  update();
})();
