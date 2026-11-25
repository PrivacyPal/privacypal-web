/* Customer stories (index.html, the 3-up under the logo marquee) and the
   story modal (#tmModal).

   Cards: each .tm-card carries its story in data-* (slug, name, role, kind,
   company, video, poster, duration). Hovering a card with a mouse, or
   focusing it from the keyboard, fades a silent loop of the video
   (.tm-prev) over the cover. On touch screens the card most in view plays
   its loop instead. Neither runs with reduced motion or Save-Data.

   Modal: selecting a card opens the story and plays it with sound. A link
   to /?testimonial=<slug> (or #testimonial-<slug>) opens that story on
   arrival and starts it; browsers allow sound only after a tap, so it
   starts muted when they refuse and shows "Tap for sound". While a story
   is open the address carries ?testimonial=<slug>, so it can be copied
   and shared. Focus moves into the dialog, stays there, and returns to
   the trigger on close. GA4 events: testimonial_open,
   testimonial_complete, testimonial_link_copy. */
(function(){
  'use strict';
  var section = document.getElementById('stories');
  var modal = document.getElementById('tmModal');
  if (!section || !modal) return;
  var cards = [].slice.call(section.querySelectorAll('.tm-card[data-story]'));
  if (!cards.length) return;

  var PARAM = 'testimonial';
  function mq(q){ return !!(window.matchMedia && window.matchMedia(q).matches); }
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var canHover = mq('(hover: hover) and (pointer: fine)');

  function track(name, params){ try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch (e) {} }
  function fmt(t){
    t = Math.max(0, Math.floor(t || 0));
    return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2);
  }

  /* ---------------- the stories, read from the cards ---------------- */
  var stories = cards.map(function(card){
    var d = card.dataset;
    var co = card.querySelector('.tm-co');
    var img = card.querySelector('.tm-media img');
    return {
      slug: d.story, card: card, name: d.name, role: d.role, kind: d.kind || 'Customer story',
      company: d.company, video: d.video, poster: d.poster, duration: d.duration,
      logo: co ? { src: co.getAttribute('src'), alt: co.getAttribute('alt') || '', wide: co.classList.contains('is-wide') } : null,
      thumb: img ? img.getAttribute('src').replace(/-960\.jpg$/, '-480.jpg') : '',
      own: d.company === 'PrivacyPal'
    };
  });
  function find(slug){
    slug = String(slug || '').toLowerCase();
    for (var i = 0; i < stories.length; i++) if (stories[i].slug === slug) return stories[i];
    return null;
  }

  /* ---------------- hover previews ---------------- */
  var previewsOn = !reduce && !saveData;
  function Preview(card){
    var v = card.querySelector('.tm-prev');
    var bar = card.querySelector('.tm-bar i');
    var raf = null, on = false, resetT = null;
    if (!v) return { play:function(){}, stop:function(){}, load:function(){} };
    v.muted = true;
    function load(){
      if (!v.getAttribute('src') && v.dataset.src) { v.preload = 'auto'; v.src = v.dataset.src; }
    }
    function tick(){
      if (!on) return;
      if (v.duration && bar) bar.style.transform = 'scaleX(' + Math.min(1, v.currentTime / v.duration) + ')';
      raf = requestAnimationFrame(tick);
    }
    v.addEventListener('playing', function(){
      if (!on) { v.pause(); return; }
      card.classList.add('is-prev');
      cancelAnimationFrame(raf); tick();
    });
    function play(){
      if (on) return;
      on = true; clearTimeout(resetT);
      load();
      var p = v.play();
      if (p && p.catch) p.catch(function(){});
    }
    function stop(){
      if (!on) return;
      on = false;
      card.classList.remove('is-prev');
      cancelAnimationFrame(raf);
      v.pause();
      /* rewind once the loop has faded out, so the next hover starts at the top */
      resetT = setTimeout(function(){
        if (on) return;
        try { v.currentTime = 0; } catch (e) {}
        if (bar) bar.style.transform = 'scaleX(0)';
      }, 480);
    }
    return { play:play, stop:stop, load:load };
  }
  var previews = cards.map(Preview);
  function stopPreviews(){ previews.forEach(function(p){ p.stop(); }); }

  if (previewsOn && canHover) {
    cards.forEach(function(card, i){
      card.addEventListener('mouseenter', function(){ if (!isOpen()) previews[i].play(); });
      card.addEventListener('mouseleave', function(){ previews[i].stop(); });
      var btn = card.querySelector('.tm-open');
      if (btn) {
        btn.addEventListener('focus', function(){ if (!isOpen() && btn.matches(':focus-visible')) previews[i].play(); });
        btn.addEventListener('blur', function(){ previews[i].stop(); });
      }
    });
    /* fetch the three loops (about 1.4 MB) once the page has loaded and the
       section comes near, so a hover starts at once without slowing the hero */
    if ('IntersectionObserver' in window) {
      var watchNear = function(){
        var near = new IntersectionObserver(function(es){
          if (es.some(function(e){ return e.isIntersecting; })) { previews.forEach(function(p){ p.load(); }); near.disconnect(); }
        }, { rootMargin: '400px 0px' });
        near.observe(section);
      };
      if (document.readyState === 'complete') watchNear(); else window.addEventListener('load', watchNear, { once: true });
    }
  } else if (previewsOn && 'IntersectionObserver' in window) {
    /* touch: the card most in view plays its loop, one at a time. When
       several are in full view (a tablet), they take turns, one loop each. */
    var ratios = cards.map(function(){ return 0; });
    var playing = -1;
    var start = function(i){
      if (playing > -1 && playing !== i) previews[playing].stop();
      playing = i;
      if (i > -1) previews[i].play();
    };
    var pick = function(){
      if (isOpen()) return;
      var best = -1, bestR = .6;
      ratios.forEach(function(r, i){ if (r > bestR + .01) { best = i; bestR = r; } });
      /* the one playing keeps going while it is still among the most in view */
      if (playing > -1 && ratios[playing] >= bestR - .01) return;
      start(best);
    };
    cards.forEach(function(card, i){
      var v = card.querySelector('.tm-prev');
      if (!v) return;
      v.loop = false;
      v.addEventListener('ended', function(){
        if (i !== playing || isOpen()) return;
        var top = Math.max.apply(null, ratios);
        for (var k = 1; k <= cards.length; k++) {
          var j = (i + k) % cards.length;
          if (ratios[j] >= .6 && ratios[j] >= top - .01) {
            if (j === i) { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
            else { previews[i].stop(); start(j); }
            return;
          }
        }
      });
    });
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ ratios[cards.indexOf(e.target.closest('.tm-card'))] = e.isIntersecting ? e.intersectionRatio : 0; });
      pick();
    }, { threshold: [0, .3, .6, .8, 1] });
    cards.forEach(function(card){ io.observe(card.querySelector('.tm-media')); });
    document.addEventListener('visibilitychange', function(){
      if (document.hidden) { stopPreviews(); playing = -1; } else pick();
    });
    var resumeTouch = function(){ playing = -1; pick(); };
  }

  /* ---------------- the modal ---------------- */
  var shell = modal.querySelector('.tm-shell');
  var player = modal.querySelector('.tm-player');
  var video = modal.querySelector('#tmVideo');
  var closeBtn = modal.querySelector('.tm-x');
  var hit = modal.querySelector('.tm-hit');
  var soundBtn = modal.querySelector('.tm-sound');
  var ppBtn = modal.querySelector('.tm-pp');
  var muteBtn = modal.querySelector('.tm-mute');
  var fsBtn = modal.querySelector('.tm-fs');
  var seek = modal.querySelector('.tm-seek');
  var fill = modal.querySelector('.tm-fill');
  var knob = modal.querySelector('.tm-knob');
  var curEl = modal.querySelector('#tmCur');
  var durEl = modal.querySelector('#tmDur');
  var endBox = modal.querySelector('.tm-end');
  var replayBtn = modal.querySelector('.tm-replay');
  var nextBtn = modal.querySelector('.tm-next');
  var kindEl = modal.querySelector('.tm-kind');
  var nameEl = modal.querySelector('#tmName');
  var roleEl = modal.querySelector('#tmRole');
  var chip = modal.querySelector('.tm-chip');
  var chipImg = chip ? chip.querySelector('img') : null;
  var list = modal.querySelector('.tm-list');
  var copyBtn = modal.querySelector('.tm-copy');
  var copyLbl = copyBtn ? copyBtn.querySelector('span') : null;

  var cur = null, lastFocus = null, idleT = null, raf = null, dragging = false, lastSec = -1, tapRevealed = false;
  /* null until the visitor chooses; then their choice holds from story to story */
  var userMuted = null;
  modal.inert = true;

  function isOpen(){ return modal.classList.contains('show'); }
  function idx(s){ return stories.indexOf(s); }
  function nextOf(s){ return stories[(idx(s) + 1) % stories.length]; }

  function fillPanel(s){
    if (kindEl) kindEl.textContent = s.kind;
    nameEl.textContent = s.name;
    roleEl.textContent = s.role;
    if (chip) {
      /* PrivacyPal's own advisor: the PrivacyPal logo already heads the panel */
      if (s.own || !s.logo) { chip.hidden = true; }
      else { chip.hidden = false; chip.classList.toggle('wide', !!s.logo.wide); chipImg.src = s.logo.src; chipImg.alt = s.logo.alt; }
    }
    list.innerHTML = '';
    stories.forEach(function(o){
      if (o === s) return;
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tm-go'; b.setAttribute('data-go', o.slug);
      b.setAttribute('aria-label', 'Watch ' + o.name + ', ' + o.role);
      var im = document.createElement('img'); im.src = o.thumb; im.alt = ''; im.width = 44; im.height = 55; im.decoding = 'async';
      var t = document.createElement('span'); t.className = 't';
      var nb = document.createElement('b'); nb.textContent = o.name;
      var rs = document.createElement('small'); rs.textContent = o.role;
      t.appendChild(nb); t.appendChild(rs);
      var d = document.createElement('span'); d.className = 'd'; d.textContent = o.duration;
      b.appendChild(im); b.appendChild(t); b.appendChild(d);
      li.appendChild(b); list.appendChild(li);
    });
    var n = nextOf(s);
    nextBtn.querySelector('.who').textContent = n.name;
    nextBtn.setAttribute('aria-label', 'Next story: ' + n.name);
    durEl.textContent = s.duration || '0:00';
    curEl.textContent = '0:00';
  }

  function syncState(){
    player.classList.toggle('is-paused', video.paused);
    player.classList.toggle('is-muted', video.muted);
    ppBtn.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
    muteBtn.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
    hit.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
    /* muted by the browser, not by the visitor: offer sound */
    soundBtn.hidden = !(video.muted && userMuted !== true && !player.classList.contains('is-ended'));
  }
  function drawTime(){
    var d = video.duration || 0, t = video.currentTime || 0;
    var r = d ? Math.min(1, t / d) : 0;
    fill.style.transform = 'scaleX(' + r + ')';
    knob.style.left = (r * 100) + '%';
    curEl.textContent = fmt(t);
    if (d) durEl.textContent = fmt(d);
    var sec = Math.floor(t) + Math.round(d) * 1000;
    if (sec === lastSec) return;   /* the slider's values change once a second, not every frame */
    lastSec = sec;
    seek.setAttribute('aria-valuemax', String(Math.round(d)));
    seek.setAttribute('aria-valuenow', String(Math.floor(t)));
    seek.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(d));
  }
  function loop(){ drawTime(); raf = requestAnimationFrame(loop); }

  /* the controls fade after a quiet moment while the story plays; they stay
     while it is paused, while scrubbing, and while a control has keyboard focus */
  function kbFocusInPlayer(){
    var a = document.activeElement;
    if (!a || a === hit || !player.contains(a)) return false;
    try { return a.matches(':focus-visible'); } catch (e) { return true; }
  }
  function wake(){
    player.classList.remove('idle');
    clearTimeout(idleT);
    idleT = setTimeout(function(){
      if (!video.paused && !dragging && !kbFocusInPlayer()) player.classList.add('idle');
    }, 2600);
  }

  function attempt(){
    var p;
    try { p = video.play(); } catch (e) { p = null; }
    if (p && p.then) {
      p.then(syncState, function(err){
        if (err && err.name === 'AbortError') return;   /* a newer src took over */
        if (!video.muted) {
          /* sound refused without a tap (a link visit): start muted, offer sound */
          video.muted = true;
          var q = video.play();
          if (q && q.then) q.then(syncState, syncState); else syncState();
        } else syncState();
      });
    }
    syncState();
  }

  function load(s, how){
    cur = s;
    fillPanel(s);
    endBox.hidden = true;
    lastSec = -1;
    player.classList.remove('is-ended');
    player.classList.add('is-wait');
    video.poster = s.poster;
    video.preload = 'auto';
    video.muted = userMuted === true;
    video.src = s.video;
    drawTime();
    attempt();
    setParam(s.slug);
    wake();
    track('testimonial_open', { testimonial: s.slug, method: how });
  }

  function lock(on){ document.documentElement.classList.toggle('tm-lock', on); }

  function open(s, how, trigger){
    if (!s) return;
    stopPreviews();
    if (!isOpen()) {
      lastFocus = trigger || document.activeElement;
      modal.inert = false;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      lock(true);
      /* focus the dialog itself: it is announced, and Space plays and pauses */
      try { shell.focus({ preventScroll: true }); } catch (e) { shell.focus(); }
      cancelAnimationFrame(raf); loop();
    }
    load(s, how);
  }

  function close(){
    if (!isOpen()) return;
    if (document.fullscreenElement && document.exitFullscreen) { try { document.exitFullscreen(); } catch (e) {} }
    video.pause();
    /* drop the source so a closed story stops downloading */
    video.removeAttribute('src');
    try { video.load(); } catch (e) {}
    cancelAnimationFrame(raf);
    clearTimeout(idleT);
    var back = lastFocus; lastFocus = null;
    if (back && back.focus && back.getClientRects && back.getClientRects().length) { try { back.focus({ preventScroll: true }); } catch (e) {} }
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
    lock(false);
    setParam(null);
    cur = null;
    if (typeof resumeTouch === 'function') resumeTouch();
  }

  /* ---- the address: ?testimonial=<slug> while a story is open ---- */
  var HASH = /^#(?:testimonial|story)[-=/]([a-z0-9-]+)$/i;
  function setParam(slug){
    if (!window.history || !history.replaceState || typeof URL !== 'function') return;
    try {
      var u = new URL(window.location.href);
      if (slug) u.searchParams.set(PARAM, slug); else u.searchParams.delete(PARAM);
      if (HASH.test(u.hash)) u.hash = '';
      var next = u.pathname + u.search + u.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) history.replaceState(history.state, '', next);
    } catch (e) {}
  }
  function fromURL(){
    var slug = null;
    try { slug = new URL(window.location.href).searchParams.get(PARAM); } catch (e) {}
    if (!slug) { var m = window.location.hash.match(HASH); if (m) slug = m[1]; }
    return slug ? find(slug) : null;
  }
  function storyLink(s){
    var base = /(^|\.)privacypal\.ai$/.test(window.location.hostname)
      ? 'https://privacypal.ai/'
      : window.location.origin + window.location.pathname;
    return base + '?' + PARAM + '=' + encodeURIComponent(s.slug);
  }

  /* ---- player controls ---- */
  function toggle(){
    if (video.paused || video.ended) { if (video.ended) video.currentTime = 0; attempt(); }
    else video.pause();
  }
  function unmute(){
    userMuted = false;
    video.muted = false;
    if (video.paused) attempt();
    syncState();
  }
  function seekTo(t){
    if (!video.duration) return;
    video.currentTime = Math.max(0, Math.min(video.duration - .05, t));
    if (player.classList.contains('is-ended')) { endBox.hidden = true; player.classList.remove('is-ended'); }
    drawTime();
  }
  function seekFromPointer(e){
    var r = seek.getBoundingClientRect();
    var x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    seekTo(x * (video.duration || 0));
  }
  function fullscreen(){
    var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (player.requestFullscreen) player.requestFullscreen().catch(function(){});
    else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();   /* iPhone */
  }

  hit.addEventListener('click', function(){
    /* a first tap on a story the browser muted turns the sound on */
    if (video.muted && userMuted !== true) { unmute(); wake(); return; }
    /* on touch, a tap on faded controls brings them back rather than pausing */
    if (tapRevealed) { tapRevealed = false; return; }
    toggle(); wake();
  });
  hit.addEventListener('dblclick', function(e){ e.preventDefault(); fullscreen(); });
  soundBtn.addEventListener('click', function(){
    unmute(); wake();
    /* the button hides itself: keep focus in the dialog */
    try { shell.focus({ preventScroll: true }); } catch (e) {}
  });
  ppBtn.addEventListener('click', function(){ toggle(); wake(); });
  muteBtn.addEventListener('click', function(){
    if (video.muted) unmute(); else { userMuted = true; video.muted = true; syncState(); }
    wake();
  });
  fsBtn.addEventListener('click', fullscreen);
  if (!(player.requestFullscreen || player.webkitRequestFullscreen || video.webkitEnterFullscreen)) fsBtn.hidden = true;

  seek.addEventListener('pointerdown', function(e){
    dragging = true; seek.classList.add('drag');
    try { seek.setPointerCapture(e.pointerId); } catch (err) {}
    seekFromPointer(e); wake();
  });
  seek.addEventListener('pointermove', function(e){ if (dragging) seekFromPointer(e); });
  function endDrag(){ if (!dragging) return; dragging = false; seek.classList.remove('drag'); wake(); }
  seek.addEventListener('pointerup', endDrag);
  seek.addEventListener('pointercancel', endDrag);
  seek.addEventListener('keydown', function(e){
    var k = e.key, d = video.duration || 0;
    if (k === 'ArrowLeft' || k === 'ArrowDown') seekTo(video.currentTime - 5);
    else if (k === 'ArrowRight' || k === 'ArrowUp') seekTo(video.currentTime + 5);
    else if (k === 'Home') seekTo(0);
    else if (k === 'End') seekTo(d);
    else return;
    e.preventDefault(); wake();
  });

  player.addEventListener('pointermove', function(e){ if (e.pointerType === 'mouse') wake(); });
  player.addEventListener('pointerdown', function(e){
    tapRevealed = e.pointerType !== 'mouse' && player.classList.contains('idle') && e.target === hit;
    wake();
  });
  player.addEventListener('focusin', wake);

  ['waiting', 'loadstart', 'seeking'].forEach(function(ev){
    video.addEventListener(ev, function(){ if (video.getAttribute('src')) player.classList.add('is-wait'); });
  });
  ['playing', 'canplay', 'seeked', 'pause', 'error'].forEach(function(ev){
    video.addEventListener(ev, function(){ if (ev !== 'pause' || video.readyState >= 2) player.classList.remove('is-wait'); syncState(); });
  });
  video.addEventListener('play', function(){ syncState(); wake(); });
  video.addEventListener('pause', function(){ syncState(); player.classList.remove('idle'); });
  video.addEventListener('volumechange', syncState);
  video.addEventListener('loadedmetadata', drawTime);
  video.addEventListener('ended', function(){
    player.classList.add('is-ended');
    player.classList.remove('idle');
    endBox.hidden = false;
    syncState();
    if (cur) track('testimonial_complete', { testimonial: cur.slug });
    try { nextBtn.focus({ preventScroll: true }); } catch (e) {}
  });

  replayBtn.addEventListener('click', function(){
    endBox.hidden = true; player.classList.remove('is-ended');
    video.currentTime = 0; attempt(); wake();
  });
  nextBtn.addEventListener('click', function(){ if (cur) load(nextOf(cur), 'next'); });
  list.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('[data-go]') : null;
    if (b) { load(find(b.getAttribute('data-go')), 'more'); try { shell.focus({ preventScroll: true }); } catch (err) {} }
  });

  if (copyBtn) copyBtn.addEventListener('click', function(){
    if (!cur) return;
    var url = storyLink(cur);
    var label = copyLbl.textContent;
    function done(){
      copyBtn.classList.add('ok'); copyLbl.textContent = 'Link copied';
      setTimeout(function(){ copyBtn.classList.remove('ok'); copyLbl.textContent = label; }, 2200);
    }
    function legacy(){
      var ta = document.createElement('textarea');
      ta.value = url; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      shell.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      shell.removeChild(ta);
      copyBtn.focus();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, legacy);
    else legacy();
    track('testimonial_link_copy', { testimonial: cur.slug });
  });

  /* ---- opening, closing, focus ---- */
  section.addEventListener('click', function(e){
    var card = e.target.closest ? e.target.closest('.tm-card') : null;
    if (!card) return;
    var s = find(card.getAttribute('data-story'));
    if (s) { e.preventDefault(); open(s, 'card', card.querySelector('.tm-open')); }
  });
  modal.addEventListener('click', function(e){
    if (e.target === modal) { close(); return; }
    if (e.target.closest && e.target.closest('.tm-x')) close();
  });
  /* a CTA in the panel (Download free, Book a demo) opens its own modal from
     assets/v3.js: close this one first, in the capture phase, so the next
     one is not hidden behind it */
  modal.addEventListener('click', function(e){
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   /* a new tab: this story stays open */
    if (e.target.closest && e.target.closest('[data-cta]')) close();
  }, true);

  document.addEventListener('keydown', function(e){
    if (!isOpen()) return;
    var t = e.target, tag = (t && t.tagName) || '';
    if (e.key === 'Escape') {
      if (document.fullscreenElement || document.webkitFullscreenElement) return;   /* the browser leaves full screen first */
      e.preventDefault(); close(); return;
    }
    if (e.key === 'Tab') {
      var f = [].filter.call(shell.querySelectorAll('button:not([tabindex="-1"]), [href], [tabindex]:not([tabindex="-1"])'), function(el){
        return !el.disabled && !el.hidden && el.getClientRects().length;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (document.activeElement === shell) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (!shell.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var onControl = tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || (t && t.getAttribute && t.getAttribute('role') === 'slider');
    if ((e.key === ' ' || e.key === 'k' || e.key === 'K') && !onControl) { e.preventDefault(); toggle(); wake(); }
    else if (e.key === 'm' || e.key === 'M') { muteBtn.click(); }
    else if (e.key === 'f' || e.key === 'F') { fullscreen(); }
    else if (!onControl && e.key === 'ArrowLeft') { seekTo(video.currentTime - 5); wake(); }
    else if (!onControl && e.key === 'ArrowRight') { seekTo(video.currentTime + 5); wake(); }
  });
  document.addEventListener('visibilitychange', function(){
    if (document.hidden && isOpen() && !video.paused) video.pause();
  });

  /* ---- arriving from a link ---- */
  function fromLink(){
    var s = fromURL();
    if (s && (!isOpen() || cur !== s)) open(s, 'link', null);
  }
  window.addEventListener('hashchange', function(){ if (HASH.test(window.location.hash)) fromLink(); });
  fromLink();
})();
