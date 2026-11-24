/* FLIGHT ARCHIVE — the archive terminal: directory, file viewer, command line.
   All file text comes from the original archive (V1). Nothing here is invented history. */
(function () {
  var FS = [
    { dir: 'BLACK_BOX_RECOVERIES', files: [
      { name: '2019-04-12_voice_memo.wav', meta: 'FORMAT .WAV · DURATION 1:42 · SIGNAL QUALITY 31%', body: [
        'ACCESSING: 2019-04-12_VOICE_MEMO.WAV...', '', 'CONTENT: PILOT TRANSMISSION', '',
        '"...if you\'re hearing this, it means I didn\'t make it."', '"Or maybe I did."', '', '— END RECOVERED AUDIO —' ] },
      { name: '███████████████.wav', locked: 'ACCESS DENIED' } ] },
    { dir: 'FLIGHT_LOGS', files: [
      { name: '2018_flight_log_001.txt', meta: 'FIRST FLIGHT · ARCHIVED', body: [
        'FLIGHT LOG #001 — FIRST FLIGHT — 2018', '', 'YEAR ........ 2018', 'ALTITUDE .... INITIAL ASCENT', 'STATUS ...... ARCHIVED' ] },
      { name: '2021-11-03_altitude_log.txt', meta: 'FLIGHT LOG #024 · OPEN', body: [
        'ALTITUDE LOG — 2021-11-03', '', 'ALTITUDE .... 622m', 'VELOCITY .... 83m/s', 'HEAT LEVELS . RISING',
        'PILOT ....... NON-COMPLIANT', 'STATUS ...... WARNING IGNORED' ] },
      { name: '2022_flight_log_019.txt', meta: 'FIRST FLIGHT · LAST KNOWN', body: [
        'FLIGHT LOG #019 — FIRST FLIGHT — 2022 — LAST KNOWN', '', 'YEAR ........ 2022', 'ALTITUDE .... █████████', 'SIGNAL ...... LOST' ] },
      { name: '2026_flight_log_020.txt', meta: 'SECOND FLIGHT · LIVE', live: true, body: [
        'FLIGHT LOG #020 — SECOND FLIGHT — 2026 — ● LIVE', '', 'YEAR ........ 2026', 'ALTITUDE .... INCREASING', 'HEAT ........ RISING',
        'PILOT ....... NON-COMPLIANT', 'STATUS ...... IN PROGRESS' ] },
      { name: 'git_log.txt', meta: 'FLIGHT_ARCHIVE // GIT_LOG', body: [
        'a1b2c3d  wings holding', 'd4e5f6g  altitude increasing', 'h7i8j9k  warning ignored', 'k0l1m2n  heat levels abnormal',
        'o3p4q5r  signal lost', 's6t7u8v  black box active', 'w9x0y1z  // 2026 — second ascent', 'z2a3b4c  pilot: non-compliant. rising.' ] } ] },
    { dir: 'EVIDENCE', files: [
      { name: 'pilot_notes.txt', meta: 'UNDATED · SOURCE UNKNOWN', body: [
        'Entry undated.', '', 'They said I fell. I didn\'t fall.', 'I landed exactly where I needed to.', '',
        'The sun didn\'t burn me. It showed me what I was made of.', 'Turns out — something that doesn\'t melt.', '',
        'Second flight isn\'t a comeback.', 'It\'s a continuation.', '', '— SI' ] },
      { name: 'wing_structure_model_i.txt', meta: 'TECHNICAL BLUEPRINT · REDACTED', body: [
        'WING STRUCTURE — MODEL I', '', 'TITANIUM FRAME', 'CERAMIC FEATHERS', 'SOLAR RESISTANT COATING', '', 'NOTES: ██████████████████' ] },
      { name: '████████.log', locked: 'FILE CORRUPTED' } ] },
    { dir: 'MEDIA_ARCHIVE', files: [
      { name: '2019-07-18_aegean_sector_daily.txt', meta: 'RECOVERED PRESS', body: [
        'AEGEAN SECTOR DAILY · 2019-07-18', '', 'LOCAL MYTH OR TRUTH? THE ICARUS INCIDENT', '',
        'Witnesses report an unidentified aerial event over the sector. Officials deny involvement. Bureau declines comment.' ] },
      { name: '2019-07-19_world_wire.txt', meta: 'RECOVERED PRESS', body: [
        'WORLD WIRE · 2019-07-19', '', 'GOVERNMENT DENIES SECOND FLIGHT CLAIMS', '',
        'A spokesperson confirmed the subject is deceased. New signals detected in the region remain unexplained.' ] },
      { name: '2019-08-02_tech_recovery_digest.txt', meta: 'RECOVERED PRESS', body: [
        'TECH RECOVERY DIGEST · 2019-08-02', '', 'RECOVERED DEBRIS CONFIRMS ADVANCED TECHNOLOGY', '',
        'Material recovered near the Aegean sector does not match any known aerospace manufacturer. Investigation ongoing.' ] },
      { name: '2026_bureau_notice.txt', meta: 'FLIGHT INVESTIGATION BUREAU', body: [
        'FLIGHT INVESTIGATION BUREAU · 2026', '', 'UNEXPLAINED SIGNAL DETECTED — CASE REOPENED', '',
        'Bureau sources confirm new telemetry received. The signal matches patterns from the original First Flight recordings.' ] } ] },
    { dir: 'CASE_FILE_001', files: [
      { name: 'case_001_summary.txt', meta: 'RESTRICTED', body: [
        'CASE FILE 001 — ICARUS, THE 2ND FLIGHT — RESTRICTED', '', 'CONTENTS: FLIGHT LOGS · BLACK BOX · EVIDENCE · PILOT PROFILE', '',
        'NOTE: Subject declared deceased 2019. Status disputed.' ] },
      { name: '██████████████.pdf', locked: 'ACCESS DENIED' } ] },
    { dir: 'CASE_FILE_002', sealed: 'ACCESS DENIED', unlock: { name: 'case_002_recovered.txt', meta: 'UNLOCKED · ALL EVIDENCE RECOVERED', body: [
        'CASE FILE 002 — ACCESS GRANTED', '', 'All six pieces of evidence recovered.', 'You found everything the Bureau missed.', '',
        'CONTENTS: SEALED UNTIL RELEASE.', '', 'Citizens, not followers.' ] } },
    { dir: 'CASE_FILE_003', sealed: 'FILE CORRUPTED' },
    { dir: 'CASE_FILE_004', sealed: 'REDACTED' }
  ];

  var tree = document.getElementById('crt-tree'), view = document.getElementById('crt-view'),
      vTitle = document.getElementById('crt-view-title'), vMeta = document.getElementById('crt-view-meta'),
      vBody = document.getElementById('crt-view-body'), back = document.getElementById('crt-back'),
      screen = document.getElementById('crt'), hist = document.getElementById('crt-hist'), input = document.getElementById('crt-in');
  if (!tree) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var typing = null, flat = [];

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  FS.forEach(function (d, di) {
    var g = el('div', 'dir' + (d.sealed ? ' dir--sealed' : ''));
    var h = el('button', 'dir__name'); h.type = 'button';
    h.appendChild(el('span', 'dir__caret', '▶')); h.appendChild(el('span', null, d.dir));
    if (d.sealed) h.appendChild(el('span', 'dir__seal', d.sealed));
    g.appendChild(h);
    var list = el('div', 'dir__files');
    (d.files || []).forEach(function (f) {
      flat.push(f);
      var b = el('button', 'file' + (f.locked ? ' file--locked' : '') + (f.live ? ' file--live' : '')); b.type = 'button';
      b.appendChild(el('span', 'file__icon', '▤')); b.appendChild(el('span', 'file__name', f.name));
      b.addEventListener('click', function () { open(f, b); });
      list.appendChild(b);
    });
    g.appendChild(list);
    if (d.unlock) window.addEventListener('fa:unlock', function () {
      d.sealed = null; g.classList.remove('dir--sealed'); var s2 = h.querySelector('.dir__seal'); if (s2) s2.remove();
      d.files = [d.unlock]; flat.push(d.unlock);
      var b2 = el('button', 'file file--live'); b2.type = 'button';
      b2.appendChild(el('span', 'file__icon', '▤')); b2.appendChild(el('span', 'file__name', d.unlock.name));
      b2.addEventListener('click', function () { open(d.unlock, b2); });
      list.appendChild(b2); g.classList.add('is-open');
      print('RES', d.dir + ': UNLOCKED');
    });
    h.addEventListener('click', function () {
      if (d.sealed) { flash(h); print('ERR', d.dir + ': ' + d.sealed); return; }
      g.classList.toggle('is-open');
    });
    if (di < 3) g.classList.add('is-open');
    tree.appendChild(g);
  });

  function flash(node) { node.classList.remove('is-denied'); void node.offsetWidth; node.classList.add('is-denied'); }

  function open(f, btn) {
    if (f.locked) { flash(btn); print('ERR', f.name + ': ' + f.locked); return; }
    [].forEach.call(tree.querySelectorAll('.file.is-active'), function (x) { x.classList.remove('is-active'); });
    if (btn) btn.classList.add('is-active');
    screen.classList.add('is-viewing');
    vTitle.textContent = f.name; vMeta.textContent = f.meta || '';
    vBody.textContent = '';
    if (typing) clearInterval(typing);
    var text = f.body.join('\n'), i = 0;
    if (reduce) { vBody.textContent = text; return; }
    typing = setInterval(function () {
      i += 3; vBody.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(typing); typing = null; }
    }, 16);
  }
  back.addEventListener('click', function () { screen.classList.remove('is-viewing'); });

  /* command line */
  function print(kind, text) { var l = el('div', 'ln ln--' + kind.toLowerCase(), text); hist.appendChild(l); hist.scrollTop = hist.scrollHeight; }
  var cmds = {
    help: function () { print('SYS', 'COMMANDS: ls · open <file> · status · pilot · logs · blackbox · clear'); },
    ls: function () { FS.forEach(function (d) { print('RES', (d.sealed ? '✕ ' : '▶ ') + d.dir + (d.sealed ? '  [' + d.sealed + ']' : '')); }); },
    status: function () { print('ERR', 'FLIGHT STATUS: UNKNOWN'); print('ERR', 'PILOT: ACTIVE — NON-COMPLIANT'); print('RES', 'ALTITUDE: INCREASING · HEAT: RISING · SIGNAL: WEAK'); print('RES', 'CASE 001: OPEN — INVESTIGATION ACTIVE'); },
    pilot: function () { print('RES', 'SI / ICARUS · JOHANNESBURG, ZA'); print('RES', 'FIRST FLIGHT: 2018—2022 · 2ND FLIGHT: ACTIVE'); print('ERR', 'COMPLIANCE: NON-COMPLIANT'); print('SYS', 'NOTE: Dashboards lack the means to show total speeds.'); },
    logs: function () { print('RES', '#001 2018 — INITIAL ASCENT — ARCHIVED'); print('RES', '#002–#018 2019–2022 — ARCHIVED'); print('ERR', '#019 2022 — LAST KNOWN — SIGNAL LOST'); print('RES', '#020 2026 — SECOND FLIGHT — ● LIVE'); },
    blackbox: function () { open(flat[0]); },
    clear: function () { hist.textContent = ''; }
  };
  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var v = input.value.trim(); if (!v) return; input.value = '';
    print('CMD', 'FA-001 > ' + v);
    var parts = v.toLowerCase().split(/\s+/);
    if (parts[0] === 'open' && parts[1]) {
      var f = flat.filter(function (x) { return x.name.toLowerCase().indexOf(parts[1]) === 0 || x.name.toLowerCase().indexOf(parts[1]) > -1; })[0];
      if (f) open(f); else print('ERR', 'FILE NOT FOUND: ' + parts[1]);
      return;
    }
    (cmds[parts[0]] || function () { print('ERR', 'UNRECOGNISED: ' + v + ' — type help'); })();
  });
  print('SYS', "FLIGHT_ARCHIVE TERMINAL v2.6.1 — TYPE 'help' FOR COMMANDS");
})();
