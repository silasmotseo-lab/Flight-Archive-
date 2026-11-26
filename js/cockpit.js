/* FLIGHT ARCHIVE — cockpit: the final climb, flown by scroll.
   Altimeter, attitude and heat gauges, warning lights and the black box's signal search
   all follow --cq (0→1), the pinned section's scroll progress. */
(function () {
  'use strict';
  var sec = document.getElementById('cockpit'); if (!sec) return;
  var $ = function (id) { return document.getElementById(id); };
  // altimeter ticks
  var ticks = $('ck-ticks'), h = '';
  for (var i = 0; i < 50; i++) {
    var a = i / 50 * Math.PI * 2, maj = i % 5 === 0, r1 = maj ? 40 : 44, r2 = 49;
    h += '<line class="' + (maj ? '' : 'mn') + '" x1="' + (60 + Math.sin(a) * r1).toFixed(2) + '" y1="' + (60 - Math.cos(a) * r1).toFixed(2) + '" x2="' + (60 + Math.sin(a) * r2).toFixed(2) + '" y2="' + (60 - Math.cos(a) * r2).toFixed(2) + '"/>';
    if (maj) h += '<text x="' + (60 + Math.sin(a) * 32).toFixed(2) + '" y="' + (60 - Math.cos(a) * 32).toFixed(2) + '">' + (i / 5) + '</text>';
  }
  ticks.innerHTML = h;
  var n1 = $('ck-n1'), n2 = $('ck-n2'), altR = $('ck-alt'), ball = $('hz-ball'), hzR = $('hz-read'), heatR = $('heat-read');
  var lights = [].slice.call(sec.querySelectorAll('.lt'));
  var rec = $('bb'), wave = $('bb-wave'), st = $('bb-st'), au = $('bb-au');
  var hasAudio = false, failed = false;
  au.addEventListener('loadedmetadata', function () { hasAudio = true; rec.classList.remove('searching'); });
  au.addEventListener('error', function () { failed = true; rec.classList.add('searching'); });
  var scrub = document.documentElement.classList.contains('scrub');
  var q = 0, queued = false, bars = null;

  function progress() {
    var r = sec.getBoundingClientRect(), vh = window.innerHeight;
    if (scrub) return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
    return Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height)));
  }
  function draw() {
    queued = false;
    q = progress();
    sec.style.setProperty('--cq', q.toFixed(4));
    // same altitude as the side altimeter, so the two instruments agree
    var side = document.getElementById('alt-ft');
    var alt = side ? (parseInt(side.textContent.replace(/[^0-9]/g, ''), 10) || 0) : 28000 + q * 4500;
    n1.style.transform = 'rotate(' + ((alt % 1000) / 1000 * 360).toFixed(2) + 'deg)';
    n2.style.transform = 'rotate(' + ((alt % 10000) / 10000 * 360).toFixed(2) + 'deg)';
    n1.style.transformOrigin = n2.style.transformOrigin = '60px 60px';
    altR.textContent = alt.toLocaleString('en-US');
    var pitch = 4 + q * 14, bank = Math.sin(q * Math.PI * 2.4) * 11 * (1 - q * 0.4);
    ball.style.transform = 'rotate(' + bank.toFixed(2) + 'deg) translateY(' + (pitch * 1.3).toFixed(2) + 'px)';
    hzR.textContent = '+' + String(Math.round(pitch)).padStart(2, '0') + '°';
    heatR.textContent = Math.round(412 + Math.pow(q, 1.6) * 1180);
    lights.forEach(function (l) { l.classList.toggle('on', q >= parseFloat(l.dataset.on)); });
    // black box: no audio yet → the waveform is static that locks on as you climb
    if (failed && !hasAudio) {
      if (!bars) bars = [].slice.call(wave.children);
      // the signal locks on as you push in on the recorder in the recovery scene
      var recov = document.getElementById('recovery');
      var fq = recov ? (parseFloat(recov.style.getPropertyValue('--fq')) || 0) : q;
      var lock = Math.min(1, Math.max(0, (fq - 0.55) / 0.4));
      bars.forEach(function (b, i) {
        var target = 18 + Math.abs(Math.sin(i * 1.7) * 30 + Math.sin(i * 0.45) * 20);
        var noise = 8 + Math.random() * 80;
        b.style.height = Math.min(96, noise * (1 - lock) + target * lock).toFixed(0) + '%';
      });
      st.textContent = lock < 1 ? 'SIGNAL: SEARCHING · ' + String(Math.round(lock * 100)).padStart(2, '0') + '%' : 'SIGNAL LOCATED · FRAGMENT PENDING RELEASE';
      st.style.color = lock < 1 ? 'var(--red)' : 'var(--amber)';
    }
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(draw); } }
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
  draw();
})();
