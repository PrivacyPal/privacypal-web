/* PrivacyPal brand guidelines (brand/index.html): page behavior only.
   1. Reads assets/brand/logo.svg and sets the lockup geometry the diagrams use,
      so the clear-space and anatomy figures follow the file when it changes,
      and writes the measured ratios into the anatomy notes.
   2. Highlights the current section in the contents list.
   3. Copies a color value (or the credit line) when its button is pressed. */
(function () {
  'use strict';

  /* 1. Lockup geometry. The mark is the Twemoji penguin emoji, unaltered, and
     the lockup is set the way "🐧 PrivacyPal" sits in a line of type
     (scripts/brand/build-brand.js, LOCK):
       penguin ink height  1.6  x the cap height
       feet                0.14 x the cap height below the baseline
       gap to the P        0.22 x the penguin height
     The wordmark is fixed artwork (Overused Grotesk 600, outlined): baseline
     at y=0, cap height 1300 units, ink starting 99 units into its own box.
     The penguin's box comes from the file's nested <svg>. */
  var WORD_CAP = 1300;
  var WORD_INK_X = 99;
  var SPEC = { mark: 1.6, feet: 0.14, gap: 0.22 };

  // The notes state the spec; if the file ever drifts from it, they state
  // what the file measures instead, so the page never contradicts the logo.
  function fmt(v) { return String(+v.toFixed(2)); }
  function writeMeasure(key, measured) {
    var el = document.querySelector('[data-lg="' + key + '"]');
    if (!el) return;
    el.textContent = Math.abs(measured - SPEC[key]) < 0.01 ? String(SPEC[key]) : fmt(measured);
  }

  function setGeometry(svg) {
    var vb = (svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/) || []).slice(1).map(Number);
    var mk = svg.match(/<svg x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"/);
    // The wordmark's shift is the translate on the path after the nested mark;
    // the emoji carries transforms of its own, so search past its </svg>.
    var tr = svg.slice(svg.indexOf('</svg>') + 6).match(/translate\(([-\d.]+)[ ,]/);
    if (vb.length !== 4 || !mk || !tr) return;
    var vx = vb[0], vy = vb[1], vw = vb[2], vh = vb[3];
    var mx = +mk[1], my = +mk[2], mw = +mk[3], mh = +mk[4];
    var wordX = +tr[1] + WORD_INK_X;
    var xp = mh / vw; // penguin height as a share of the logo width
    var s = document.documentElement.style;
    s.setProperty('--lg-aspect', (vw / vh).toFixed(4));
    s.setProperty('--lg-base', ((0 - vy) / vh).toFixed(4));
    s.setProperty('--lg-cap', ((-WORD_CAP - vy) / vh).toFixed(4));
    s.setProperty('--lg-markb', ((my + mh - vy) / vh).toFixed(4));
    s.setProperty('--lg-markw', ((mx + mw - vx) / vw).toFixed(4));
    s.setProperty('--lg-word', ((wordX - vx) / vw).toFixed(4));
    s.setProperty('--lg-xr', (xp / (1 + 2 * xp)).toFixed(4));
    writeMeasure('mark', mh / WORD_CAP);
    writeMeasure('feet', (my + mh) / WORD_CAP);
    writeMeasure('gap', (wordX - (mx + mw)) / mh);
  }
  try {
    var src = document.documentElement.getAttribute('data-logo') || '../assets/brand/logo.svg';
    if (window.fetch) {
      fetch(src).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) { if (t) setGeometry(t); }).catch(function () {});
    }
  } catch (e) { /* the CSS defaults stand */ }

  /* 2. Contents scrollspy. */
  var toc = document.querySelector('.br-toc nav');
  var links = toc ? Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]')) : [];
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  var current = null;
  function activate(id) {
    if (id === current || !byId[id]) return;
    current = id;
    links.forEach(function (a) { a.classList.toggle('active', a === byId[id]); });
    // keep the active chip visible in the horizontal (mobile) list without moving the page
    var a = byId[id];
    if (toc.scrollWidth > toc.clientWidth + 4) {
      var left = a.offsetLeft - (toc.clientWidth - a.offsetWidth) / 2;
      try { toc.scrollTo({ left: Math.max(0, left), behavior: 'smooth' }); } catch (e) { toc.scrollLeft = left; }
    }
  }
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  // The current section is the last one whose top has passed a reading line
  // a third of the way down the viewport.
  var ticking = false;
  function spy() {
    ticking = false;
    var line = window.innerHeight * 0.33;
    var id = sections.length ? sections[0].id : null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) id = sections[i].id; else break;
    }
    if (id) activate(id);
  }
  if (sections.length) {
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(spy); }
    }, { passive: true });
    window.addEventListener('resize', spy);
    spy();
  }

  /* 3. Copy a color value. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-copy]') : null;
    if (!b) return;
    var val = b.getAttribute('data-copy');
    var label = b.textContent;
    function done(ok) {
      b.textContent = ok ? 'Copied' : val;
      setTimeout(function () { b.textContent = label; }, 1400);
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
    } catch (err) { done(false); }
  });
})();
