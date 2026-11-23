/* FLIGHT ARCHIVE — director: gate, scroll camera, altimeter, timeline, black box, registry */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }

  /* ── GATE: Johannesburg skyline, once per session ── */
  var gate = $('gate'), gateTimer = null, gateCity = null;
  function ready() { root.classList.add('ready'); }
  function closeGate() {
    if (gateTimer) { clearTimeout(gateTimer); gateTimer = null; }
    try { sessionStorage.setItem('fa-gate', '1'); } catch (e) {}
    gate.classList.add('is-done');
    if (gateCity) setTimeout(gateCity.stop, 800);
    setTimeout(ready, reduce ? 0 : 250);
    window.removeEventListener('keydown', closeGate);
  }
  if (root.classList.contains('gate-on') && gate) {
    if (window.FASkyline) { gateCity = window.FASkyline.create($('city')); gateCity.start(); }
    gate.addEventListener('click', closeGate);
    window.addEventListener('keydown', closeGate);
    gateTimer = setTimeout(closeGate, reduce ? 900 : 3200);
  } else { requestAnimationFrame(ready); }

  /* ── SCROLL: hangar push-in, altimeter, current space ── */
  var hangar = $('hangar'), alt = $('alt'), spaces = [].slice.call(document.querySelectorAll('.space'));
  var ftEl = $('alt-ft'), ticks = $('alt-ticks'), spaceName = $('space-name');
  var bars = { heat: [$('b-heat'), $('v-heat')], sig: [$('b-sig'), $('v-sig')], str: [$('b-str'), $('v-str')] };
  var ticking = false, sunBoost = 0, lastName = '';
  var tl = $('timeline'), svg = $('tl-line'), path = $('tl-path'), tlBuilt = false, tlLen = 0;
  var cockpit = $('cockpit');

  function setBar(b, v) { b[0].style.width = v.toFixed(1) + '%'; b[1].textContent = Math.round(v) + '%'; }

  /* ── PHONE WALK-IN: Kling clip as an image sequence, scrubbed by scroll ── */
  var seq = $('seq'), seqN = +(seq && seq.getAttribute('data-frames')) || 0, seqImgs = [], seqLast = -1, seqOn = false;
  var portrait = window.matchMedia('(orientation: portrait)');
  function seqPath(i) { return '/assets/seq/hangar_' + String(i).padStart(3, '0') + '.webp'; }
  function seqDraw(i) {
    var img = seqImgs[i];
    while (i > 0 && !(img && img.complete && img.naturalWidth)) { i--; img = seqImgs[i]; }
    if (!img || !img.naturalWidth || i === seqLast) return;
    seqLast = i;
    var c = seq.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = seq.clientWidth, H = seq.clientHeight;
    if (seq.width !== Math.round(W * dpr)) { seq.width = Math.round(W * dpr); seq.height = Math.round(H * dpr); }
    var s = Math.max(seq.width / img.naturalWidth, seq.height / img.naturalHeight);
    var w = img.naturalWidth * s, h = img.naturalHeight * s;
    c.drawImage(img, (seq.width - w) / 2, (seq.height - h) / 2, w, h);
  }
  function seqStart() {
    if (seqOn || !seqN || reduce || !portrait.matches) return;
    seqOn = true; hangar.classList.add('has-seq');
    var first = new Image();
    first.onload = function () { seqImgs[0] = first; seqLast = -1; seqDraw(0); };
    first.src = seqPath(0);
    // load the rest in order, a few at a time
    var next = 1, inflight = 0;
    function pump() {
      while (inflight < 6 && next < seqN) {
        (function (i) { var im = new Image(); inflight++; im.onload = im.onerror = function () { inflight--; seqImgs[i] = im; pump(); }; im.src = seqPath(i); })(next++);
      }
    }
    pump();
  }
  seqStart();

  function update() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var hh = hangar.offsetHeight || vh;
    if (seqOn) {
      var q = Math.min(1, Math.max(0, y / Math.max(1, hh - vh)));
      hangar.style.setProperty('--q', q.toFixed(4));
      seqLast = -1; seqDraw(Math.round(q * (seqN - 1)));
    }
    hangar.style.setProperty('--p', reduce || seqOn ? 0 : Math.min(1, Math.max(0, y / hh)).toFixed(4));

    var max = document.documentElement.scrollHeight - vh;
    var j = Math.min(1, Math.max(0, max > 0 ? y / max : 0));
    var altitude = Math.round(Math.pow(j, 1.35) * 32500 / 10) * 10;
    ftEl.textContent = altitude.toLocaleString('en-US');
    ticks.style.transform = 'translateY(' + (-(altitude / 32500) * 3600) + 'px)';
    setBar(bars.heat, Math.min(99, 12 + Math.pow(j, 2.2) * 82 + sunBoost * 10));
    setBar(bars.sig, Math.min(99, 18 + j * 81));
    setBar(bars.str, Math.max(41, 96 - Math.pow(j, 2) * 48 - sunBoost * 6));
    alt.classList.toggle('on', y > (seqOn ? hh - vh * 0.6 : vh * 0.35));

    var name = 'HANGAR 2';
    for (var i = 0; i < spaces.length; i++) { if (spaces[i].getBoundingClientRect().top < vh * 0.45) name = spaces[i].getAttribute('data-space'); }
    if (name !== lastName) { spaceName.textContent = name; lastName = name; }

    drawTimeline(); cockpitSun();
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', function () { tlBuilt = false; update(); });
  window.addEventListener('load', function () { tlBuilt = false; update(); });

  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }); }, { threshold: 0.08 });
    [].forEach.call(document.querySelectorAll('.space__head, .crt, .card, .ev, .folder, .recorder, .memcard'), function (n) { n.classList.add('reveal'); revealIO.observe(n); });
    new IntersectionObserver(function (es) { es.forEach(function (e) { hangar.classList.toggle('paused', !e.isIntersecting); }); }).observe(hangar);
  }

  /* ── FLIGHT PATH: altitude line draws as you scroll; dips at 2022, climbs for 2026 ── */
  function buildTimeline() {
    var evs = tl.querySelectorAll('.ev'), w = svg.clientWidth, h = tl.offsetHeight, top = tl.getBoundingClientRect().top;
    if (!w || !h) return;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var pts = [], n = evs.length;
    [].forEach.call(evs, function (ev, i) {
      var y = ev.getBoundingClientRect().top - top + 10;
      var x = ev.classList.contains('ev--lost') ? w * 0.08 : w * (0.15 + 0.7 * (i / (n - 1)));
      if (ev.classList.contains('ev--live')) x = w * 0.98;
      pts.push([x, y]);
      ev.style.setProperty('--dot', x + 'px');
    });
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var k = 1; k < pts.length; k++) { var my = (pts[k - 1][1] + pts[k][1]) / 2; d += ' C' + pts[k - 1][0] + ' ' + my + ' ' + pts[k][0] + ' ' + my + ' ' + pts[k][0] + ' ' + pts[k][1]; }
    path.setAttribute('d', d);
    tlLen = path.getTotalLength();
    path.style.strokeDasharray = tlLen; tlBuilt = true;
  }
  function drawTimeline() {
    if (!tlBuilt) buildTimeline();
    if (!tlBuilt) return;
    var r = tl.getBoundingClientRect(), vh = window.innerHeight;
    var p = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.75 - r.top) / r.height));
    path.style.strokeDashoffset = tlLen * (1 - p);
  }

  /* ── EVIDENCE: pilot notes ── */
  var note = $('note-card');
  function toggleNote() { var o = note.classList.toggle('is-open'); note.setAttribute('aria-expanded', o); }
  note.addEventListener('click', toggleNote);
  note.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNote(); } });

  /* ── COCKPIT: sun rises with scroll and with the black box ── */
  function cockpitSun() {
    var r = cockpit.getBoundingClientRect(), vh = window.innerHeight;
    var s = Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh * 0.2)));
    cockpit.style.setProperty('--sun', Math.min(1, s * 0.75 + sunBoost * 0.5).toFixed(3));
  }
  (function blackbox() {
    var au = $('bb-au'), btn = $('bb-play'), w = $('bb-wave'), st = $('bb-st'), tm = $('bb-tm');
    var N = 72, h = '';
    for (var i = 0; i < N; i++) { var v = 18 + Math.abs(Math.sin(i * 1.7) * 30 + Math.sin(i * 0.45) * 20) + ((i * 37) % 11); h += '<i style="height:' + Math.min(96, v) + '%"></i>'; }
    w.innerHTML = h;
    var ws = [].slice.call(w.children);
    function f(s) { s = isFinite(s) ? s : 0; return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }
    function paint() { var r = au.duration ? au.currentTime / au.duration : 0; ws.forEach(function (b, i) { b.classList.toggle('on', i < r * N); }); tm.textContent = f(au.currentTime) + ' / ' + f(au.duration); sunBoost = r; update(); }
    au.addEventListener('loadedmetadata', function () { st.textContent = 'SIGNAL: WEAK — FRAGMENT RECOVERED'; paint(); });
    au.addEventListener('error', function () { btn.disabled = true; st.textContent = 'SIGNAL NOT YET RECOVERED'; st.style.color = 'var(--red)'; });
    au.addEventListener('timeupdate', paint);
    au.addEventListener('play', function () { btn.textContent = '❚❚'; st.textContent = 'PLAYBACK — SIGNAL LOCKED'; });
    au.addEventListener('pause', function () { btn.textContent = '▶'; });
    au.addEventListener('ended', function () { btn.textContent = '▶'; st.textContent = 'END OF RECOVERED AUDIO'; });
    btn.addEventListener('click', function () { au.paused ? au.play() : au.pause(); });
    w.addEventListener('click', function (e) { if (!au.duration) return; var r = w.getBoundingClientRect(); au.currentTime = (e.clientX - r.left) / r.width * au.duration; });
  })();

  /* ── REGISTRY: skyline returns; citizen ID card saved on this device only ── */
  var endCity = null;
  if ('IntersectionObserver' in window && window.FASkyline) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (!endCity) endCity = window.FASkyline.create($('city-end'), { horizon: 0.92, height: 0.85 }); endCity.start(); }
        else if (endCity) endCity.stop();
      });
    }, { threshold: 0.05 }).observe($('city-end'));
  }
  function citizenNo(name) { var h = 2166136261; for (var i = 0; i < name.length; i++) { h ^= name.charCodeAt(i); h = Math.imul(h, 16777619); } return 'FA-CIT-' + String((h >>> 0) % 900000 + 100000); }
  function drawId(name) {
    var c = $('id-canvas'), x = c.getContext('2d'), W = c.width, H = c.height, no = citizenNo(name.toUpperCase());
    x.fillStyle = '#0A0B0A'; x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(W * 0.8, H * 0.15, 10, W * 0.8, H * 0.15, W * 0.6); g.addColorStop(0, 'rgba(255,90,31,0.35)'); g.addColorStop(1, 'rgba(255,90,31,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (var i = 0; i < 148; i++) { var bh = (Math.sin(i * 0.7) * 0.5 + 0.6) * 50 + (i > 60 && i < 95 ? 60 : 0) + (i === 104 ? 150 : 0); x.fillStyle = 'rgba(227,160,72,' + (i === 104 ? 0.9 : 0.35) + ')'; x.fillRect(12 + i * 7.2, H - 70 - bh, 4, bh); }
    x.fillStyle = 'rgba(233,227,210,0.25)'; x.fillRect(24, H - 70, W - 48, 1);
    x.strokeStyle = 'rgba(233,227,210,0.25)'; x.lineWidth = 2; x.strokeRect(24, 24, W - 48, H - 48);
    x.fillStyle = '#E3A048'; x.font = '500 22px "Plex Mono", monospace'; x.fillText('FLIGHT INVESTIGATION BUREAU · CITIZEN REGISTRY', 60, 86);
    x.fillStyle = '#E9E3D2'; x.font = '300 70px "Archivo", sans-serif'; x.fillText(name.toUpperCase().slice(0, 18), 60, 200);
    x.fillStyle = '#9A968A'; x.font = '400 21px "Plex Mono", monospace'; x.fillText('CITIZEN NO.', 60, 280); x.fillText('CASE FILE', 430, 280); x.fillText('ISSUED', 690, 280);
    x.fillStyle = '#E9E3D2'; x.font = '500 32px "Plex Mono", monospace'; x.fillText(no, 60, 324); x.fillText('001', 430, 324);
    var d = new Date(); x.fillText(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), 690, 324);
    x.fillStyle = '#E3A048'; x.font = 'italic 26px "Courier Prime", monospace'; x.fillText('CITIZENS, NOT FOLLOWERS.', 60, 400);
    $('id-save').href = c.toDataURL('image/png');
    return no;
  }
  $('mc-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('mc-name').value.trim(); if (!name) return;
    var no = drawId(name);
    $('idcard').hidden = false; $('mc-form').hidden = true;
    $('mc-free').textContent = 'SAVED · ' + no + ' · 7936KB FREE';
    try { localStorage.setItem('fa-citizen', name); } catch (err) {}
  });
  try { var saved = localStorage.getItem('fa-citizen'); if (saved) $('mc-name').value = saved; } catch (err) {}

  update();
})();
