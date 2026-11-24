/* FLIGHT ARCHIVE — personnel file: fields type in as you reach them, once the folder is open. */
(function () {
  'use strict';
  var folder = document.querySelector('.folder'); if (!folder) return;
  var rows = [].slice.call(folder.querySelectorAll('.dossier > div'));
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { rows.forEach(function (r) { r.classList.add('in'); }); return; }
  var queue = [], timer = null, clipped = false;
  function next() {
    timer = null; var r = queue.shift(); if (!r) return;
    r.classList.add('in');
    if (r.querySelector('.red')) setTimeout(function () { try { navigator.vibrate && navigator.vibrate(18); } catch (e) {} }, 500);
    timer = setTimeout(next, 230);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; io.unobserve(e.target); queue.push(e.target);
      // wait for the cover to flip before the first field types
      if (!timer) timer = setTimeout(next, folder.classList.contains('open') ? 0 : 1600);
    });
  }, { threshold: 0.9 });
  rows.forEach(function (r) { io.observe(r); });
  // the paperclip snap is felt, not just seen
  new MutationObserver(function () { if (!clipped && folder.classList.contains('open')) { clipped = true; setTimeout(function () { try { navigator.vibrate && navigator.vibrate(10); } catch (e) {} }, 1900); } })
    .observe(folder, { attributes: true, attributeFilter: ['class'] });
})();
