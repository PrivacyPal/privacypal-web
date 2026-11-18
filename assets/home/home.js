/* PrivacyPal homepage behaviors (index.html only).

   1. The hero console. Three scenes (Family, Business, You) cross through
      navy behind one headline: the outgoing photo is gone before the
      incoming one starts, so two faces never overlap. The tabs are the
      progress indicator; the pause control sits outside the tablist. Each
      scene brings a new illustrative prompt per loop (with its own footer
      line), a thin gold scan line wipes each sensitive detail into its
      Privacy Twin, and the scene's pack lights up in the "Your packs" row.
      Scenes 2 and 3 load only after the page has painted.
   2. The "One filter" triptych. One gold line sweeps across three lives;
      each detail becomes its twin exactly where the line passes.

   Reduced motion: no autoplay, no sweep, every swap shown finished.
   Review flags: ?scene=0|1|2 opens on that scene, ?still holds the
   finished frames (hero and triptych). Every name and number below is an invented example. */
(function(){
  var REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var GLYPH = {
    chatgpt: 'assets/glyph-chatgpt.png',
    claude: 'assets/glyph-claude.png',
    gemini: 'assets/glyph-gemini.png',
    copilot: 'assets/glyph-copilot.png'
  };
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* [plain, [real, twin], plain, ...] to markup; returns { html, count } */
  function tokens(parts, opts){
    opts = opts || {};
    var count = 0;
    var html = parts.map(function(part){
      if (typeof part === 'string') return esc(part);
      var d = opts.stagger ? ' style="--d:' + (count * opts.stagger).toFixed(2) + 's"' : '';
      count++;
      return '<span class="tok"' + d + '><span class="o">' + esc(part[0]) +
             '</span><span class="t"><span class="sr"> becomes </span>' + esc(part[1]) + '</span>' +
             (opts.scan ? '<i class="scan" aria-hidden="true"></i>' : '') + '</span>';
    }).join('');
    return { html: html, count: count };
  }

  /* ================= 1. Hero console ================= */
  (function(){
    var hero = document.getElementById('oc-hero');
    if (!hero) return;
    var shots = hero.querySelectorAll('.oc-shot'),
        tabs = hero.querySelectorAll('.oc-tab'),
        panels = hero.querySelectorAll('.oc-panel'),
        packs = hero.querySelectorAll('.oc-pk'),
        keys = hero.querySelectorAll('.oc-k'),
        pauseBtn = hero.querySelector('.oc-pause');
    var n = shots.length, DUR = 7000, STAGGER = .45, cur = 0, timer = 0, started = 0, left = DUR;
    var q = new URLSearchParams(location.search);
    var still = q.has('still');
    var playing = !REDUCE && !still, inView = true, docVisible = !document.hidden;

    /* Illustrative prompts, one list per scene, rotating each loop. The
       first of each list is the static markup (the no-JS frame). Every
       prompt fits two lines of the console at 360px; `foot` is the line
       under the prompt and names the same AI and the same detail. Each twin
       renders at least as wide as its real value, so the finished swap
       hugs its text. */
    var PROMPTS = [
      [ /* Family */
        { ai:'gemini', to:'To Gemini · family laptop', p:["Make up a story about me, ",["Mia Thompson","Ava Richardson"],", and my dog at ",["14 Alder Lane","22 Birch Lane"],"."], foot:'Her real name and address never reach Gemini.' },
        { ai:'chatgpt', to:'To ChatGPT · family computer', p:["My school is ",["Lincoln Elementary","Brookfield Academy"],". Quiz me on my spelling words."], foot:'The real school name never reaches ChatGPT.' },
        { ai:'gemini', to:"To Gemini · kid's tablet", p:["My birthday is ",["June 3, 2017","April 9, 2017"],". Plan a party for my class."], foot:'The real birthday never reaches Gemini.' }
      ],
      [ /* Business */
        { ai:'copilot', to:'To Copilot · work laptop', p:["Summarize 90 days of wires for ",["Dana Whitfield","Grace Holloway"],", account ",["0047 8821 9360","0093 4586 2737"],"."], foot:"The client's real name and account never reach Copilot." },
        { ai:'chatgpt', to:'To ChatGPT · work laptop', p:["Draft a reply to ",["Priya Raman","Laura Haynes"]," about her new loan terms."], foot:"The client's real name never reaches ChatGPT." },
        { ai:'claude', to:'To Claude · work laptop', p:["Review the term sheet for ",["Harbor Point Capital","Westbrook Lane Group"]," before Friday."], foot:'The real company name never reaches Claude.' }
      ],
      [ /* You */
        { ai:'chatgpt', to:'To ChatGPT · your laptop', p:["Write a dispute letter for the $412 charge on my card ",["4539 2210 8841 7720","4716 0093 5512 3348"],"."], foot:'Your real card number never reaches ChatGPT.' },
        { ai:'claude', to:'To Claude · your laptop', p:["Polish my cover letter. My number is ",["(561) 555-0148","(415) 555-0298"],"."], foot:'Your real phone number never reaches Claude.' },
        { ai:'chatgpt', to:'To ChatGPT · your laptop', p:["Help me appeal this bill for policy ",["HX-5582-0173","QM-3194-7706"],"."], foot:'Your real policy number never reaches ChatGPT.' }
      ]
    ];
    var seen = [1, 0, 0];               /* scene 0 is on screen at load */

    function setDone(panel, count){
      /* the status flips to "N Privacy Twins" once the last detail is swapped */
      panel.style.setProperty('--done', (1.45 + Math.max(0, count - 1) * STAGGER + .9).toFixed(2) + 's');
    }
    function renderPrompt(k){
      var list = PROMPTS[k], item = list[seen[k] % list.length];
      seen[k]++;
      if (seen[k] === 1) return;        /* first showing: the markup already holds it */
      var panel = panels[k], t = tokens(item.p, { stagger: STAGGER, scan: true });
      panel.querySelector('.oc-to').innerHTML = '<img src="' + GLYPH[item.ai] + '" alt="" width="14" height="14">' + esc(item.to);
      panel.querySelector('.oc-prompt p').innerHTML = t.html;
      var ft = panel.querySelector('.oc-foot .ft');
      if (ft) ft.innerHTML = '<b>Swapped on this device.</b> ' + esc(item.foot);
      panel.querySelector('.oc-state .s2 .n').textContent = t.count + (t.count === 1 ? ' Privacy Twin' : ' Privacy Twins');
      setDone(panel, t.count);
    }
    panels.forEach(function(p){ setDone(p, p.querySelectorAll('.tok').length); });

    /* Scene photos: <source data-srcset> and <img data-src> load on demand */
    function loadShot(k){
      var s = shots[k];
      if (s.getAttribute('data-loaded')) return;
      s.setAttribute('data-loaded', '1');
      s.querySelectorAll('source[data-srcset]').forEach(function(src){
        src.srcset = src.getAttribute('data-srcset'); src.removeAttribute('data-srcset');
      });
      var img = s.querySelector('img');
      if (img && img.getAttribute('data-src')) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
    }
    function setShot(k){
      for (var j = 0; j < n; j++) {
        if (j === k || !shots[j].classList.contains('is-on')) continue;
        shots[j].classList.add('is-out');
        shots[j].classList.remove('is-on');
        (function(s){ setTimeout(function(){ if (!s.classList.contains('is-on')) s.classList.remove('is-out'); }, 700); })(shots[j]);
      }
      loadShot(k);
      var img = shots[k].querySelector('img');
      var go = function(){ if (cur === k) { shots[k].classList.remove('is-out'); shots[k].classList.add('is-on'); } };
      if (img.complete && img.naturalWidth) go();
      else img.addEventListener('load', go, { once:true });
    }

    function show(i, user){
      i = (i + n) % n;
      var same = i === cur;
      if (!same) renderPrompt(i);
      for (var k = 0; k < n; k++) {
        var on = k === i;
        if (!on && panels[k].classList.contains('is-on')) {
          panels[k].classList.add('was');
          (function(p){ setTimeout(function(){ if (!p.classList.contains('is-on')) p.classList.remove('was'); }, 600); })(panels[k]);
        }
        if (on) panels[k].classList.remove('was');
        panels[k].classList.toggle('is-on', on);
        panels[k].setAttribute('aria-hidden', on ? 'false' : 'true');
        tabs[k].classList.toggle('is-on', on);
        tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
        tabs[k].tabIndex = on ? 0 : -1;
        keys[k].classList.toggle('is-on', on);
        if (packs[k]) packs[k].classList.toggle('is-on', on);
      }
      if (same && user) {             /* re-click: replay the bar and the swap */
        var bar = tabs[i].querySelector('.oc-bar i');
        bar.style.animation = 'none'; panels[i].classList.remove('is-on');
        void hero.offsetWidth;
        bar.style.animation = ''; panels[i].classList.add('is-on');
      }
      cur = i;
      setShot(i);
      left = DUR; schedule();
    }
    function live(){ return playing && inView && docVisible; }
    function schedule(){
      clearTimeout(timer); timer = 0;
      if (live()) { started = Date.now(); timer = setTimeout(function(){ show(cur + 1); }, left); }
    }
    function halt(){
      if (timer) { clearTimeout(timer); timer = 0; left = Math.max(400, left - (Date.now() - started)); }
    }
    function sync(){
      hero.classList.toggle('is-held', !live());
      if (live()) { if (!timer) schedule(); } else halt();
    }
    function setPlaying(p){
      playing = p;
      hero.classList.toggle('is-paused', !p);
      pauseBtn.setAttribute('aria-label', p ? 'Pause the scenes' : 'Play the scenes');
      pauseBtn.setAttribute('aria-pressed', p ? 'false' : 'true');
      sync();
    }

    tabs.forEach(function(t, k){
      t.addEventListener('click', function(){ show(k, true); });
      t.addEventListener('keydown', function(e){
        var to = e.key === 'ArrowRight' ? cur + 1 : e.key === 'ArrowLeft' ? cur - 1 :
                 e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
        if (to === null) return;
        e.preventDefault(); show(to, true); tabs[cur].focus();
      });
    });
    pauseBtn.addEventListener('click', function(){ setPlaying(!playing); });

    /* hold while the hero is off screen or the tab is hidden; resume only
       when both say the hero can be seen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(es){ inView = es[0].isIntersecting; sync(); }, { threshold: .15 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function(){ docVisible = !document.hidden; sync(); });

    if (still) hero.classList.add('oc-still');
    if (!playing) { hero.classList.add('is-paused'); pauseBtn.setAttribute('aria-label', 'Play the scenes'); pauseBtn.setAttribute('aria-pressed', 'true'); }
    hero.style.setProperty('--dur', DUR + 'ms');

    /* scenes 2 and 3 load once the page has painted */
    function later(){ setTimeout(function(){ for (var k = 0; k < n; k++) loadShot(k); }, 600); }
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later, { once:true });

    var s = parseInt(q.get('scene'), 10);
    if (!isNaN(s) && s > 0 && s < n) show(s);
    else { schedule(); sync(); }
  })();

  /* ================= 2. One filter triptych ================= */
  (function(){
    var tri = document.getElementById('lfTri');
    if (!tri) return;
    var line = tri.querySelector('.lf-filter');
    var panels = [].slice.call(tri.querySelectorAll('.lf-panel'));

    /* Illustrative prompts per life, rotating each sweep. The first of each
       list is the static markup (the no-JS and reduced-motion frame). The
       Family examples follow the 7-to-17 casting (REBRAND-SPEC section 17). */
    var DATA = [
      [ /* Family */
        ["I'm ",["Maya Chen","Ella Brooks"]," and I go to ",["Lakeview Middle","Westbrook Middle"],". Help me plan my science fair project."],
        ["My little brother ",["Noah Chen","Owen Brooks"]," is turning nine. Write him a birthday poem."],
        ["We live at ",["14 Harbor Lane","22 Willow Lane"],". What can I build for the science fair?"]
      ],
      [ /* Business */
        ["Draft a discharge note for ",["Robert Alvarez","Thomas Kendall"],", born ",["04/12/1961","09/27/1958"],"."],
        ["Summarize last month's wires on account ",["4417 2093 8816","7302 5518 0094"]," for the audit."],
        ["Review the term sheet for ",["Harbor Point Capital","Westbrook Lane Group"]," before Friday."]
      ],
      [ /* You */
        ["Is this charge on my card ",["4532 7781 0926 3318","4916 2045 8873 1150"]," a scam?"],
        ["Rewrite my resume summary. My email is ",["sam.ortiz@mail.com","lee.baker@mail.com"],"."],
        ["Polish my cover letter. My number is ",["(561) 555-0148","(415) 555-0298"],"."]
      ]
    ];

    function render(set, animate){
      panels.forEach(function(p, i){
        var q = p.querySelector('.lf-q');
        q.innerHTML = tokens(DATA[i][set % DATA[i].length]).html;
        /* the markup shows finished twins (the no-JS frame); the sweep starts from the real details */
        q.querySelectorAll('.tok').forEach(function(t){ t.style.setProperty('--wipe', '0%'); });
        p.classList.add('checking');
        if (animate) { q.classList.remove('in'); void q.offsetWidth; q.classList.add('in'); }
      });
    }
    /* reduced motion and ?still: the markup's finished frame stays, twins shown, no sweep */
    if (REDUCE || new URLSearchParams(location.search).has('still')) return;

    var SWEEP = 6400, HOLD = 2800;
    var set = 0, start = null, raf = null, pausedAt = null;
    render(set, false);

    function place(p){
      var w = tri.clientWidth;
      var x = (-0.02 + p * 1.04) * w;
      line.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      var tr = tri.getBoundingClientRect();
      panels.forEach(function(panel){
        var toks = panel.querySelectorAll('.tok'), all = true;
        for (var k = 0; k < toks.length; k++) {
          var r = toks[k].getBoundingClientRect();
          var f = Math.max(0, Math.min(1, (x - (r.left - tr.left)) / Math.max(1, r.width)));
          toks[k].style.setProperty('--wipe', (f * 100).toFixed(1) + '%');
          if (f < 1) all = false;
        }
        panel.classList.toggle('checking', !all);
      });
    }
    function frame(now){
      if (start === null) start = now - 0.06 * SWEEP;
      var t = now - start;
      if (t < SWEEP) { line.classList.add('live'); place(t / SWEEP); }
      else if (t < SWEEP + HOLD) { if (line.classList.contains('live')) { place(1); line.classList.remove('live'); } }
      else { set++; render(set, true); start = now; place(0); }
      raf = requestAnimationFrame(frame);
    }
    function run(){
      if (raf !== null) return;
      if (pausedAt !== null && start !== null) start += performance.now() - pausedAt;
      pausedAt = null; raf = requestAnimationFrame(frame);
    }
    function stop(){ if (raf !== null) { cancelAnimationFrame(raf); raf = null; pausedAt = performance.now(); } }
    var seenTri = false, docVis = !document.hidden;
    function syncTri(){ (seenTri && docVis) ? run() : stop(); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(es){ seenTri = es[0].isIntersecting; syncTri(); }, { threshold: .2 }).observe(tri);
    } else { seenTri = true; run(); }
    document.addEventListener('visibilitychange', function(){ docVis = !document.hidden; syncTri(); });
  })();

})();
