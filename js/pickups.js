/* FLIGHT ARCHIVE — recovered evidence pickups. Find all six to unlock Case File 002. */
(function () {
  var ITEMS = [
    { k: 'headset',   name: 'PILOT HEADSET',    space: 'hangar',    pin: true, x: 78, y: 64 },
    { k: 'crt',       name: 'CRT MONITOR',      space: 'archive',   x: 84, y: 16 },
    { k: 'recorder',  name: 'FLIGHT RECORDER',  space: 'locker',    x: 80, y: 1 },
    { k: 'blueprint', name: 'WING BLUEPRINT',   space: 'path',      x: 82, y: 42 },
    { k: 'memcard',   name: 'MEMORY CARD',      space: 'personnel', x: 84, y: 14 },
    { k: 'sun',       name: 'SUN DISC',         space: 'cockpit',   x: 80, y: 68 }
  ];
  var KEY = 'fa-evidence';
  var got = {};
  try { got = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}

  var hud = document.createElement('div');
  hud.className = 'pk-hud'; hud.setAttribute('aria-live', 'polite');
  document.body.appendChild(hud);
  var toast = document.createElement('div'); toast.className = 'pk-toast'; document.body.appendChild(toast);

  function count() { return ITEMS.filter(function (i) { return got[i.k]; }).length; }
  function paintHud() {
    var n = count();
    hud.innerHTML = 'EVIDENCE <b>' + n + '</b>/' + ITEMS.length;
    hud.classList.toggle('done', n === ITEMS.length);
    hud.classList.toggle('show', n > 0);
  }
  function say(text) { toast.textContent = text; toast.classList.remove('on'); void toast.offsetWidth; toast.classList.add('on'); }

  ITEMS.forEach(function (it) {
    if (got[it.k]) return;
    var host = document.getElementById(it.space); if (!host) return;
    if (it.pin) host = host.querySelector('.hangar__pin') || host;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pk pk--' + it.k;
    b.style.left = it.x + '%'; b.style.top = it.y + '%';
    b.setAttribute('aria-label', 'Collect evidence: ' + it.name.toLowerCase());
    b.innerHTML = '<span class="pk__beam"></span><span class="pk__ring"></span><span class="pk__bob"><img src="/assets/pickups/' + it.k + '.webp" alt="" draggable="false"></span>';
    b.addEventListener('click', function () {
      if (got[it.k]) return;
      got[it.k] = 1;
      try { localStorage.setItem(KEY, JSON.stringify(got)); } catch (e) {}
      if (navigator.vibrate) navigator.vibrate([18, 40, 30]);
      b.classList.add('got');
      setTimeout(function () { b.remove(); }, 700);
      paintHud();
      var n = count();
      say(n === ITEMS.length ? '◆ ALL EVIDENCE RECOVERED · CASE FILE 002 UNLOCKED' : '◆ ' + it.name + ' RECOVERED');
      if (n === ITEMS.length) window.dispatchEvent(new CustomEvent('fa:unlock'));
    });
    host.appendChild(b);
  });
  paintHud();
  if (count() === ITEMS.length) setTimeout(function () { window.dispatchEvent(new CustomEvent('fa:unlock')); }, 0);
})();
