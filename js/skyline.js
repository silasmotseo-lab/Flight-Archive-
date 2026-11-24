/* FLIGHT ARCHIVE — Johannesburg skyline in live bars. FASkyline.create(canvas, {horizon, height}) */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build() {
    var seed = 20261123;
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
    var blocks = [], u = 0;
    while (u < 1) {
      var w = 0.008 + rnd() * 0.022;
      var inCBD = u > 0.36 && u < 0.64, inBraam = u > 0.24 && u < 0.36;
      var hi = inCBD ? 0.26 + rnd() * 0.22 : inBraam ? 0.18 + rnd() * 0.16 : 0.05 + rnd() * 0.12;
      blocks.push({ u0: u, u1: u + w, h: hi, f1: 1.1 + rnd() * 2.2, f2: 2.5 + rnd() * 4, ph: rnd() * 6.28 });
      u += w;
    }
    return { rnd: rnd, blocks: blocks };
  }

  var landmarks = [
    { u0: 0.138, u1: 0.142, h: 0.62 },                                       // Brixton Tower
    { u0: 0.435, u1: 0.468, h: 0.50 }, { u0: 0.442, u1: 0.461, h: 0.55 },    // stepped CBD block
    { u0: 0.505, u1: 0.540, h: 0.64 },                                       // Carlton Centre
    { u0: 0.697, u1: 0.701, h: 0.86 },                                       // Hillbrow Tower shaft
    { u0: 0.6985, u1: 0.6995, h: 1.0, tip: true },                           // Hillbrow antenna
    { u0: 0.795, u1: 0.842, h: 0.56 }                                        // Ponte City
  ];
  var pods = [
    { u0: 0.131, u1: 0.149, lo: 0.50, hi: 0.555 },
    { u0: 0.684, u1: 0.714, lo: 0.66, hi: 0.735 },
    { u0: 0.688, u1: 0.710, lo: 0.75, hi: 0.775 }
  ];

  function ease(x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); }

  function create(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d'), city = build(), rnd = city.rnd;
    var W, H, dpr, bars = [], horizon, maxH, raf = null, t0 = 0, running = false, level = 0;

    function profile(u) {
      var r = { h: 0, lm: false, tip: false, blk: null };
      for (var i = 0; i < city.blocks.length; i++) { var b = city.blocks[i]; if (u >= b.u0 && u < b.u1) { r.h = b.h; r.blk = b; break; } }
      if (!opts.flat) for (var j = 0; j < landmarks.length; j++) { var L = landmarks[j]; if (u >= L.u0 && u < L.u1 && L.h > r.h) { r.h = L.h; r.lm = true; r.tip = !!L.tip; } }
      return r;
    }

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var narrow = W < 700;
      horizon = Math.round(H * (opts.horizon || (narrow ? 0.56 : 0.6)));
      maxH = Math.min(H * (opts.height || (narrow ? 0.40 : 0.46)), W * 0.9);
      var bw = narrow ? 3 : 4, gap = narrow ? 1.5 : 2, n = Math.floor(W / (bw + gap));
      bars = [];
      for (var i = 0; i < n; i++) {
        var uu = (i + 0.5) / n, p = profile(uu), blk = p.blk || { f1: 2, f2: 3, ph: 0 };
        bars.push({ x: i * (bw + gap) + (W - n * (bw + gap)) / 2, w: bw, h: p.h, lm: p.lm, tip: p.tip,
          f1: blk.f1, f2: blk.f2, ph: blk.ph, delay: uu * 0.9 + rnd() * 0.12,
          win: p.h > 0.12 && rnd() < 0.5 ? 0.15 + rnd() * 0.7 : -1, winPh: rnd() * 6.28 });
      }
      if (!opts.flat) landmarks.forEach(function (L) {
        if ((L.u1 - L.u0) * W >= 8) return;
        var mid = (L.u0 + L.u1) / 2, best = null, d = 1e9;
        bars.forEach(function (b) { var bu = (b.x + b.w / 2) / W; if (Math.abs(bu - mid) < d) { d = Math.abs(bu - mid); best = b; } });
        if (best && best.h < L.h) { best.h = L.h; best.lm = true; best.tip = !!L.tip; }
      });
    }

    function draw(now) {
      var t = reduce ? 10 : (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      var g = ctx.createLinearGradient(0, horizon - maxH * 0.6, 0, horizon);
      g.addColorStop(0, 'rgba(227,160,72,0)'); g.addColorStop(1, 'rgba(227,160,72,0.07)');
      ctx.fillStyle = g; ctx.fillRect(0, horizon - maxH * 0.6, W, maxH * 0.6);

      var beat = Math.max(Math.pow(Math.max(0, Math.sin(t * 3.4)), 6), level);
      for (var i = 0; i < bars.length; i++) {
        var b = bars[i], rise = reduce ? 1 : ease((t - b.delay) / 0.7);
        if (rise <= 0) continue;
        var base = b.h * maxH * rise;
        var amp = b.lm ? 0.02 : 0.075 + level * 0.08;
        var lvl = 0.5 + 0.5 * Math.sin(t * b.f1 + b.ph) * Math.sin(t * b.f2 * 0.37 + b.ph * 2);
        var top = horizon - base - (lvl * 0.75 + beat * 0.25) * amp * maxH * rise;
        var bg = ctx.createLinearGradient(0, top, 0, horizon);
        bg.addColorStop(0, b.lm ? 'rgba(233,190,120,0.95)' : 'rgba(227,160,72,0.85)');
        bg.addColorStop(1, 'rgba(227,160,72,0.10)');
        ctx.fillStyle = bg; ctx.fillRect(b.x, top, b.w, horizon - top);
        ctx.fillStyle = b.lm ? 'rgba(255,236,200,0.95)' : 'rgba(255,214,150,0.9)';
        ctx.fillRect(b.x, top, b.w, 1.5);
        if (b.win > 0 && rise > 0.9 && Math.sin(t * 0.9 + b.winPh) > -0.4) { ctx.fillStyle = 'rgba(255,240,210,0.9)'; ctx.fillRect(b.x, horizon - base * b.win, b.w, 1.5); }
        var rh = (horizon - top) * 0.38, rg = ctx.createLinearGradient(0, horizon, 0, horizon + rh);
        rg.addColorStop(0, 'rgba(227,160,72,0.18)'); rg.addColorStop(1, 'rgba(227,160,72,0)');
        ctx.fillStyle = rg; ctx.fillRect(b.x, horizon + 2, b.w, rh);
        if (b.tip && rise > 0.98 && (reduce || Math.sin(t * 3.2) > 0.2)) {
          ctx.fillStyle = 'rgba(255,70,50,0.95)'; ctx.beginPath(); ctx.arc(b.x + b.w / 2, top - 4, 2.2, 0, 6.283); ctx.fill();
          ctx.fillStyle = 'rgba(255,70,50,0.18)'; ctx.beginPath(); ctx.arc(b.x + b.w / 2, top - 4, 9, 0, 6.283); ctx.fill();
        }
      }
      var podRise = reduce ? 1 : ease((t - 0.75) / 0.7);
      if (podRise > 0 && !opts.flat) pods.forEach(function (P) {
        var x0 = P.u0 * W, x1 = P.u1 * W, y0 = horizon - P.hi * maxH * podRise, y1 = horizon - P.lo * maxH * podRise;
        ctx.globalAlpha = podRise;
        ctx.fillStyle = 'rgba(232,180,110,0.92)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        ctx.fillStyle = 'rgba(20,14,8,0.55)'; for (var yy = y0 + 3; yy < y1 - 1; yy += 3) ctx.fillRect(x0, yy, x1 - x0, 1);
        ctx.fillStyle = 'rgba(255,236,200,0.95)'; ctx.fillRect(x0, y0, x1 - x0, 1.5);
        ctx.globalAlpha = 1;
      });
      ctx.fillStyle = 'rgba(233,227,210,0.18)'; ctx.fillRect(0, horizon, W, 1);
      if (running && !reduce) raf = requestAnimationFrame(draw);
    }

    return {
      start: function (replay) { layout(); t0 = performance.now() - (replay === false ? 5000 : 0); running = true; if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); window.addEventListener('resize', layout); },
      stop: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = null; window.removeEventListener('resize', layout); },
      level: function (v) { level = v; }
    };
  }

  window.FASkyline = { create: create };
})();
