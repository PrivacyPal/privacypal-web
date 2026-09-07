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
     DELIVERY. Two independent channels, both carrying the complete record,
     so either email on its own is enough to review a candidate.

     Formspree is the form the rest of the site already uses. FormSubmit
     delivers straight to ops@privacypal.ai without any dashboard config.
     Both are known-good: a full 30-field submission with a 4.4KB transcript
     was verified end to end on both routes on 2026-09-07.

     The reason for two: an exam submission was lost on 2026-09-07 and the
     single channel gave no signal, because a POST that is accepted and a
     POST that is accepted and then discarded look identical from the
     browser. Redundancy plus honest reporting is the fix. deliver() tells
     the caller exactly what landed, and the caller never claims success it
     cannot evidence.
     ------------------------------------------------------------------ */
  var FORM_ENDPOINT = 'https://formspree.io/f/mykbaere';
  var OPS_ENDPOINT  = 'https://formsubmit.co/ajax/ops@privacypal.ai';
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

  function timeout(promise, ms, label) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error(label + ' timed out')); }, ms);
      promise.then(function (v) { clearTimeout(t); res(v); },
                   function (e) { clearTimeout(t); rej(e); });
    });
  }

  /* Channel 1: Formspree, complete record. */
  function toFormspree(o) {
    var body = { _subject: o.subject, _replyto: o.replyTo || '', route_to: 'ops@privacypal.ai' };
    for (var k in o.summary) {
      if (Object.prototype.hasOwnProperty.call(o.summary, k)) body[k] = o.summary[k];
    }
    for (var k2 in o.detail) {
      if (Object.prototype.hasOwnProperty.call(o.detail, k2)) body[k2] = o.detail[k2];
    }
    body.message = o.fullMessage || o.shortMessage;
    return timeout(fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      /* These pages set referrer=no-referrer so the unlisted path never leaks.
         'origin' overrides that for this request only: the endpoint sees
         https://privacypal.ai/ and never /ae-academy/... FormSubmit rejects a
         request with no Referer at all, treating it as a local file. */
      referrerPolicy: 'origin',
      body: JSON.stringify(body)
    }), 20000, 'Formspree').then(function (r) {
      if (r.ok) return { channel: 'formspree', ok: true };
      return r.json().catch(function () { return {}; }).then(function (d) {
        throw new Error((d.errors && d.errors.map(function (e) { return e.message; }).join('; ')) ||
                        d.error || ('Formspree returned ' + r.status));
      });
    });
  }

  /* Channel 2: FormSubmit, same complete record, delivered straight to ops@. */
  function toOps(o) {
    var body = { _subject: o.subject, _template: 'table', _captcha: 'false' };
    if (o.replyTo) body._replyto = o.replyTo;
    for (var k in o.summary) {
      if (Object.prototype.hasOwnProperty.call(o.summary, k)) body[k] = o.summary[k];
    }
    for (var k2 in o.detail) {
      if (Object.prototype.hasOwnProperty.call(o.detail, k2)) body[k2] = o.detail[k2];
    }
    body.message = o.fullMessage || o.shortMessage;
    return timeout(fetch(OPS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      referrerPolicy: 'origin',
      body: JSON.stringify(body)
    }), 20000, 'FormSubmit').then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        var ok = d.success === true || d.success === 'true';
        if (ok) return { channel: 'ops', ok: true };
        var msg = String(d.message || ('FormSubmit returned ' + r.status));
        var err = new Error(msg);
        if (/activat/i.test(msg)) err.needsActivation = true;
        throw err;
      });
    });
  }

  /* Fire both, wait for both, report honestly. Resolves even when a channel
     fails: the caller decides what to do with a partial or total failure. */
  function deliver(o) {
    var record = {
      subject: o.subject, at: stamp(),
      summary: o.summary, detail: o.detail || {},
      fullMessage: o.fullMessage || o.shortMessage
    };
    try { w.localStorage.setItem('pp_ae_last_payload', JSON.stringify(record, null, 2)); } catch (e) {}

    if (sendMode() === 'dry') {
      console.log('%c[AE Academy] DRY RUN, nothing was sent', 'background:#01204e;color:#8fd6dc;padding:3px 8px;border-radius:4px');
      console.log('Subject:', o.subject);
      console.log('Both channels would receive:', o.summary);
      console.log((o.fullMessage || o.shortMessage));
      return new Promise(function (res) {
        setTimeout(function () {
          res({ dry: true, anyOk: true, formspree: 'dry', ops: 'dry', errors: [] });
        }, 450);
      });
    }

    return Promise.all([
      toFormspree(o).then(function (r) { return r; }, function (e) { return { channel: 'formspree', ok: false, error: e }; }),
      toOps(o).then(function (r) { return r; }, function (e) { return { channel: 'ops', ok: false, error: e }; })
    ]).then(function (rs) {
      var fs = rs[0], op = rs[1];
      var out = {
        dry: false,
        formspree: fs.ok ? 'ok' : 'failed',
        ops: op.ok ? 'ok' : (op.error && op.error.needsActivation ? 'needs-activation' : 'failed'),
        anyOk: !!(fs.ok || op.ok),
        errors: []
      };
      if (!fs.ok) out.errors.push('Formspree: ' + ((fs.error && fs.error.message) || 'failed'));
      if (!op.ok) out.errors.push('ops@ direct: ' + ((op.error && op.error.message) || 'failed'));
      return out;
    });
  }

  /* The seven curriculum modules, in order. Titles must match the
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
    FORM_ENDPOINT: FORM_ENDPOINT, OPS_ENDPOINT: OPS_ENDPOINT,
    isLocal: isLocal, sendMode: sendMode, deliver: deliver,
    requireEnrolled: requireEnrolled, requireCourseDone: requireCourseDone
  };
})(window, document);
