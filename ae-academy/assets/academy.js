/* ============================================================
   PrivacyPal · AE Certification Academy: shared runtime
   Holds candidate state, renders the portal chrome, guards each
   stage, and tracks module progress. No dependency on v3.js:
   this portal deliberately does not carry the public site nav.
   ============================================================ */
(function (w, d) {
  'use strict';

  var KEY = 'pp_ae_academy_v1';
  var NDA_VERSION = '2026.09-AE-1';

  /* ------------------------------------------------------------------
     Where submissions go. ONE place to change it.
     This is the same Formspree form the live unsubscribe page uses, so
     it is already active and already accepts cross-origin posts from
     privacypal.ai and from localhost. Both submissions carry
     route_to: ops@privacypal.ai and a distinguishing subject line.
     ------------------------------------------------------------------ */
  var FORM_ENDPOINT = 'https://formspree.io/f/mykbaere';
  var MODE_KEY = 'pp_ae_send_mode';

  function isLocal() {
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(w.location.hostname) ||
           w.location.protocol === 'file:';
  }

  /* live posts for real; dry logs the payload and sends nothing.
     Default: dry on localhost, live everywhere else. ?live=1 / ?dry=1 override. */
  function sendMode() {
    var q = new URLSearchParams(w.location.search);
    if (q.get('live') === '1') { try { w.localStorage.setItem(MODE_KEY, 'live'); } catch (e) {} return 'live'; }
    if (q.get('dry')  === '1') { try { w.localStorage.setItem(MODE_KEY, 'dry');  } catch (e) {} return 'dry'; }
    try { var v = w.localStorage.getItem(MODE_KEY); if (v === 'live' || v === 'dry') return v; } catch (e) {}
    return isLocal() ? 'dry' : 'live';
  }

  function postForm(payload) {
    try { w.localStorage.setItem('pp_ae_last_payload', JSON.stringify(payload, null, 2)); } catch (e) {}
    if (sendMode() === 'dry') {
      console.log('%c[AE Academy] DRY RUN, nothing was sent to ' + FORM_ENDPOINT,
                  'background:#01204e;color:#8fd6dc;padding:3px 8px;border-radius:4px');
      console.log('Subject:', payload._subject);
      console.table(Object.keys(payload).reduce(function (o, k) {
        if (k !== 'message') o[k] = String(payload[k]).slice(0, 90);
        return o;
      }, {}));
      if (payload.message) console.log('%c--- message body ---', 'color:#028391', '\n' + payload.message);
      return new Promise(function (res) { setTimeout(function () { res({ ok: true, dry: true }); }, 450); });
    }
    return fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (r.ok) return { ok: true, dry: false };
      return r.json().catch(function () { return {}; }).then(function (d) {
        var msg = (d.errors && d.errors.map(function (e) { return e.message; }).join('; ')) ||
                  d.error || ('Formspree returned ' + r.status);
        throw new Error(msg);
      });
    });
  }

  /* The nine curriculum modules, in order. Titles must match the
     data-mod ids used by curriculum.html. */
  var MODULES = [
    { id: 'm1', n: '01', t: 'The market and the wedge',
      b: 'Why AI adoption stalls, who stalls it, and the one move that unblocks it.' },
    { id: 'm2', n: '02', t: 'The mechanism: Privacy Twins on device',
      b: 'What happens between the keystroke and the model. Sell the mechanism.' },
    { id: 'm3', n: '03', t: 'What you sell: the platform and the price book',
      b: 'Pro, Max, Cloud, SDK, and how the price book behaves.' },
    { id: 'm4', n: '04', t: 'Who we sell to',
      b: 'Four buyer types, the builder override, five industries and their regulators.' },
    { id: 'm5', n: '05', t: 'The motion and the pipeline',
      b: 'What the machine does for you, and the rule it never breaks.' },
    { id: 'm6', n: '06', t: 'MEDDIC and the proposal gate',
      b: 'Six criteria, twelve points, one gate. The heart of this certification.' },
    { id: 'm7', n: '07', t: 'Discovery, objections and closing',
      b: 'Question banks, the ten objection codes, the competition, and how deals close.' }
  ];

  /* ---------- state ---------- */
  function load() {
    try {
      var raw = w.localStorage.getItem(KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      return (s && s.email) ? s : null;
    } catch (e) { return null; }
  }

  function save(s) {
    try { w.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  function patch(obj) {
    var s = load() || {};
    for (var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) s[k] = obj[k]; }
    return save(s);
  }

  function reset() {
    try { w.localStorage.removeItem(KEY); } catch (e) {}
  }

  /* ---------- helpers ---------- */
  function initials(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '??';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function stamp(dt) {
    var x = dt ? new Date(dt) : new Date();
    return x.toISOString();
  }

  function pretty(dt) {
    var x = dt ? new Date(dt) : new Date();
    return x.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function minutesSince(iso) {
    if (!iso) return null;
    var ms = Date.now() - new Date(iso).getTime();
    if (isNaN(ms) || ms < 0) return null;
    return Math.round(ms / 60000);
  }

  /* ---------- chrome ---------- */
  function head(opts) {
    opts = opts || {};
    var s = load();
    var slot = d.getElementById('ac-head-slot');
    if (!slot) return;
    var who = '';
    if (s && s.name) {
      who = '<div class="ac-who"><span class="av">' + esc(initials(s.name)) + '</span>' +
            '<span class="nm">' + esc(s.name.split(/\s+/)[0]) + '</span></div>';
    }
    slot.innerHTML =
      '<header class="ac-head">' +
        '<div class="ac-head-in">' +
          '<a class="ac-brand" href="index.html">' +
            '<img src="../assets/logo-color.png" alt="PrivacyPal">' +
            '<span class="sep"></span>' +
            '<span class="lbl">AE Certification</span>' +
          '</a>' +
          '<div class="ac-head-right">' +
            (opts.step ? '<span class="ac-step" id="acStep">' + esc(opts.step) + '</span>' : '') +
            who +
          '</div>' +
        '</div>' +
        '<div class="ac-rail"><i id="acRail" style="width:' + (opts.progress || 0) + '%"></i></div>' +
      '</header>';
  }

  function foot() {
    var slot = d.getElementById('ac-foot-slot');
    if (!slot) return;
    slot.innerHTML =
      '<footer class="ac-foot"><div class="ac-foot-in">' +
        '<span>PrivacyPal AE Certification Program · Confidential, provided under NDA</span>' +
        '<span>Questions: <a href="mailto:ops@privacypal.ai">ops@privacypal.ai</a></span>' +
      '</div></footer>';
  }

  function progress(pct, stepText) {
    var rail = d.getElementById('acRail');
    if (rail) rail.style.width = Math.max(0, Math.min(100, pct)) + '%';
    var st = d.getElementById('acStep');
    if (st && stepText) st.textContent = stepText;
  }

  /* ---------- guards ---------- */
  function gate(msg, href, label) {
    d.body.innerHTML =
      '<div class="ac-gate"><p>' + esc(msg) + '</p>' +
      '<p style="margin-top:22px"><a class="btn btn-primary" href="' + href + '">' + esc(label) + '</a></p></div>';
  }

  function requireEnrolled() {
    var s = load();
    if (!s || !s.ndaAccepted) {
      w.location.replace('index.html');
      return null;
    }
    return s;
  }

  function requireCourseDone() {
    var s = requireEnrolled();
    if (!s) return null;
    var done = s.modulesDone || [];
    var all = MODULES.every(function (m) { return done.indexOf(m.id) !== -1; });
    if (!all) {
      w.location.replace('curriculum.html');
      return null;
    }
    return s;
  }

  /* ------------------------------------------------------------------
     Local-only dev toolbar. Never renders on privacypal.ai.
     ------------------------------------------------------------------ */
  function devBar(extra) {
    if (!isLocal()) return;
    var mode = sendMode();
    var bar = d.createElement('div');
    bar.id = 'ppDevBar';
    bar.style.cssText =
      'position:fixed;left:12px;bottom:74px;z-index:200;display:flex;gap:6px;align-items:center;' +
      'background:#01204e;color:#fff;border-radius:10px;padding:7px 9px;font:500 11px/1 ui-monospace,Menlo,monospace;' +
      'box-shadow:0 10px 30px -12px rgba(1,32,78,.55);flex-wrap:wrap;max-width:calc(100vw - 24px)';
    function btn(label, fn, tone) {
      var b = d.createElement('button');
      b.textContent = label;
      b.style.cssText =
        'font:inherit;border:0;border-radius:6px;padding:5px 9px;cursor:pointer;' +
        'background:' + (tone || 'rgba(255,255,255,.14)') + ';color:#fff';
      b.onclick = fn;
      bar.appendChild(b);
      return b;
    }
    var tag = d.createElement('span');
    tag.textContent = 'DEV';
    tag.style.cssText = 'color:#8fd6dc;letter-spacing:.14em;padding-right:4px';
    bar.appendChild(tag);

    btn(mode === 'live' ? 'SENDING LIVE' : 'DRY RUN',
        function () {
          try { w.localStorage.setItem(MODE_KEY, mode === 'live' ? 'dry' : 'live'); } catch (e) {}
          w.location.reload();
        },
        mode === 'live' ? '#d54751' : '#028391');

    btn('reset', function () {
      reset();
      try { w.localStorage.removeItem('pp_ae_exam_answers_v1'); } catch (e) {}
      w.location.href = 'index.html';
    });

    btn('skip to exam', function () {
      var st = load() || {};
      st.name = st.name || 'Local Tester';
      st.email = st.email || 'local@example.com';
      st.ndaAccepted = true;
      st.ndaVersion = NDA_VERSION;
      st.ndaSignature = st.ndaSignature || st.name;
      st.ndaSignedAt = st.ndaSignedAt || stamp();
      st.enrolledAt = st.enrolledAt || stamp();
      st.modulesDone = MODULES.map(function (m) { return m.id; });
      st.courseCompletedAt = stamp();
      delete st.submitted;
      save(st);
      w.location.href = 'exam.html';
    });

    btn('last payload', function () {
      var raw = '';
      try { raw = w.localStorage.getItem('pp_ae_last_payload') || ''; } catch (e) {}
      if (!raw) { alert('No submission has been built yet in this browser.'); return; }
      var win = w.open('', '_blank');
      win.document.write('<title>Last AE Academy payload</title>' +
        '<pre style="font:12px/1.55 ui-monospace,Menlo,monospace;padding:24px;white-space:pre-wrap">' +
        esc(raw) + '</pre>');
      win.document.close();
    });

    (extra || []).forEach(function (e) { btn(e.label, e.fn); });
    d.body.appendChild(bar);
  }

  w.PPAcademy = {
    KEY: KEY,
    NDA_VERSION: NDA_VERSION,
    MODULES: MODULES,
    load: load, save: save, patch: patch, reset: reset,
    initials: initials, esc: esc, stamp: stamp, pretty: pretty, minutesSince: minutesSince,
    head: head, foot: foot, progress: progress, gate: gate, devBar: devBar,
    FORM_ENDPOINT: FORM_ENDPOINT, isLocal: isLocal, sendMode: sendMode, postForm: postForm,
    requireEnrolled: requireEnrolled, requireCourseDone: requireCourseDone
  };
})(window, document);
