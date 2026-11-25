/* FLIGHT ARCHIVE — flight path: craft on the line, departures-board dates. */
(function () {
  'use strict';
  var tl = document.getElementById('timeline'), path = document.getElementById('tl-path'), svg = document.getElementById('tl-line'), craft = document.getElementById('craft');
  if (!tl || !path || !craft) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tag = document.getElementById('craft-tag'), evs = [].slice.call(tl.querySelectorAll('.ev'));
  var ticking = false;

  function place() {
    ticking = false;
    var d = path.getAttribute('d'); if (!d) return;
    var len = path.getTotalLength(); if (!len) return;
    var r = tl.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / r.height));
    craft.classList.toggle('on', p > 0.002 && p < 0.999 || p >= 0.999);
    var L = len * p, a = path.getPointAtLength(L), b = path.getPointAtLength(Math.min(len, L + 2));
    // svg is the same size as its viewBox, so path units are CSS px inside the timeline
    var sr = svg.getBoundingClientRect();
    var x = a.x * (sr.width / (svg.viewBox.baseVal.width || sr.width)) + (sr.left - r.left);
    var y = a.y * (sr.height / (svg.viewBox.baseVal.height || sr.height)) + (sr.top - r.top);
    craft.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
    craft.style.setProperty('--ang', ang.toFixed(1) + 'deg');
    // which record is the craft passing?
    var cur = evs[0];
    evs.forEach(function (ev) { if (ev.getBoundingClientRect().top - r.top <= y + 20) cur = ev; });
    var lost = cur.classList.contains('ev--lost'), live = cur.classList.contains('ev--live');
    craft.classList.toggle('lost', lost); craft.classList.toggle('live', live);
    var ft = Math.round((x / Math.max(1, sr.width)) * 325) * 100;
    tag.textContent = lost ? 'NO SIGNAL' : (live ? 'FL ' + Math.round(ft / 100) + ' · LIVE' : 'FL ' + String(Math.round(ft / 100)).padStart(3, '0'));
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(place); } }
  if (!reduce) { window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); setTimeout(place, 600); }

  // departures board: each date flips through characters before settling
  var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#·';
  function flap(el) {
    if (el.dataset.flapped) return; el.dataset.flapped = '1';
    var pulse = el.querySelector('.pulse'), text = el.textContent;
    var spans = [];
    el.textContent = ''; if (pulse) el.appendChild(pulse);
    el.classList.add('flap');
    var i = 0;
    text.split(' ').forEach(function (word, wi) {
      if (wi) el.appendChild(document.createTextNode(' '));
      var w = document.createElement('span'); w.style.whiteSpace = 'nowrap'; w.style.display = 'inline-block'; el.appendChild(w);
      for (var k = 0; k < word.length; k++, i++) {
        var s = document.createElement('span'); s.className = 'fl spin'; s.textContent = CH[Math.floor(Math.random() * CH.length)]; w.appendChild(s);
        spans.push({ s: s, c: word[k], at: 120 + i * 28 + Math.random() * 160 });
      }
      i++;
    });
    var t0 = performance.now();
    (function f(now) {
      var left = 0;
      spans.forEach(function (o) {
        if (now - t0 >= o.at) { if (o.s.textContent !== o.c) { o.s.textContent = o.c; o.s.classList.remove('spin'); } }
        else { left++; if (Math.random() < 0.5) o.s.textContent = CH[Math.floor(Math.random() * CH.length)]; }
      });
      if (left) requestAnimationFrame(f);
    })(t0);
  }
  if (!reduce && document.documentElement.classList.contains('scrub')) {
    // scroll-linked board: letters settle left to right as the record scrolls in, and scramble again on the way back
    var boards = [].map.call(tl.querySelectorAll('.ev__date'), function (el) {
      var pulse = el.querySelector('.pulse'), text = el.textContent, cells = [];
      el.textContent = ''; if (pulse) el.appendChild(pulse); el.classList.add('flap');
      text.split(' ').forEach(function (word, wi) {
        if (wi) el.appendChild(document.createTextNode(' '));
        var w = document.createElement('span'); w.style.whiteSpace = 'nowrap'; w.style.display = 'inline-block'; el.appendChild(w);
        for (var k = 0; k < word.length; k++) { var c = document.createElement('span'); c.className = 'fl'; c.textContent = word[k]; w.appendChild(c); cells.push({ s: c, c: word[k] }); }
      });
      return { ev: el.closest('.ev'), cells: cells };
    });
    var bq = false;
    function boardTick() {
      bq = false;
      boards.forEach(function (b) {
        var sp = parseFloat(b.ev.style.getPropertyValue('--sp')) || 0;
        var n = b.cells.length, settled = Math.floor(Math.max(0, Math.min(1, (sp - 0.04) / 0.42)) * (n + 1));
        b.cells.forEach(function (o, i) {
          if (i < settled) { if (o.s.textContent !== o.c) o.s.textContent = o.c; o.s.classList.remove('spin'); }
          else if (sp > 0) { o.s.textContent = CH[Math.floor(Math.random() * CH.length)]; o.s.classList.add('spin'); }
        });
      });
    }
    window.addEventListener('scroll', function () { if (!bq) { bq = true; requestAnimationFrame(boardTick); } }, { passive: true });
    setTimeout(boardTick, 300);
  } else if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { flap(e.target); io.unobserve(e.target); } }); }, { threshold: 0.6 });
    [].forEach.call(tl.querySelectorAll('.ev__date'), function (d) { io.observe(d); });
  }
})();
