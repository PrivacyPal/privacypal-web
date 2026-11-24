/* PrivacyPal Webinars: page logic for the live demo pages.
     /webinars/                hub: both standing series and their next session
     /webinars/business/       PrivacyPal for business: live group demo (Tue + Thu, 12:00 ET)
     /webinars/family/         PrivacyPal for families: live demo (Tue + Thu, 1:00 PM ET)
     /webinars/watch.html      live room, opened from each registrant's personal link
     /webinars/cancel.html     cancel a registration
     /webinars/verify.html     confirm the email address of a sign-up (link in the confirmation email)
   <body data-wb="hub|series|watch|cancel|verify" data-series="business|family" data-wb-base="./|../">
   data-wb-base is the path from the page to the /webinars/ folder.

   Everything dynamic comes from n8n at automate.privacypal.ai (source:
   PrivacyPal-GTM-System/WEBINARS). Series schedules and dated sessions live in
   the "PrivacyPal Webinars" Google Sheet; this file never sees a YouTube link
   except through /webinar-join for a registered token.

     GET  /webhook/webinars[?series=&s=]         series with their upcoming sessions
     POST /webhook/webinar-register               form-encoded: s + details, or s + r (one-click rebook)
                                                  details: { ok, check: 'verify'|'invite', session }, never a token;
                                                  rebook: { ok, token, watchUrl, session }
     POST /webhook/webinar-verify                 r=<token>: confirms the address and sends the invite
     GET  /webhook/webinar-join?s=<id>&r=<tok>    stream link for a registered token
     POST /webhook/webinar-cancel                 r=<token>

   API data is rendered with textContent only. */
(function () {
  'use strict';

  var API = 'https://automate.privacypal.ai/webhook';
  // development only: on localhost, localStorage pp-webinar-api may point the pages at a
  // local API (PrivacyPal-GTM-System/WEBINARS/tools/local-api.js). Never on the live site.
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    try { var devApi = localStorage.getItem('pp-webinar-api'); if (devApi && /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}\/webhook$/.test(devApi)) API = devApi; } catch (e) { /* storage blocked */ }
  }
  var B = document.body;
  var PAGE = B.getAttribute('data-wb');
  var SERIES = B.getAttribute('data-series') || '';
  var BASE = B.getAttribute('data-wb-base') || './';
  var VIEWER_TZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })();
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* ------------------------------------------------------------ helpers */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function param(name) { try { return new URLSearchParams(location.search).get(name) || ''; } catch (e) { return ''; } }
  function show(node, on) { if (node) node.hidden = !on; }
  function setText(sel, text) { $$(sel).forEach(function (n) { n.textContent = text; }); }
  function seriesUrl(id, query) { return BASE + encodeURIComponent(id) + '/' + (query || ''); }

  function request(url, opts, timeoutMs) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs) : null;
    return fetch(url, Object.assign({ cache: 'no-store', signal: ctl ? ctl.signal : undefined }, opts || {}))
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'bad_response' }; }).then(function (j) { j._status = r.status; return j; }); })
      .finally(function () { if (t) clearTimeout(t); });
  }
  function getJSON(url) { return request(url, null, 15000); }
  // form-encoded keeps this a CORS "simple request": no preflight
  function postForm(url, data) { return request(url, { method: 'POST', body: new URLSearchParams(data) }, 45000); }

  function fmt(iso, tz, opts) {
    var o = Object.assign({}, opts);
    if (tz) o.timeZone = tz;
    try { return new Intl.DateTimeFormat('en-US', o).format(new Date(iso)); } catch (e) { delete o.timeZone; return new Intl.DateTimeFormat('en-US', o).format(new Date(iso)); }
  }
  function timeIn(iso, tz) { return fmt(iso, tz, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }); }
  function whenLine(w) {
    var local = fmt(w.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' });
    var time = timeIn(w.start, VIEWER_TZ);
    var host = timeIn(w.start, w.timezone);
    return { day: local, time: time, host: host === time ? '' : host };
  }
  function liveState(w) {
    var now = Date.now();
    if (w.status === 'cancelled') return 'cancelled';
    if (now < Date.parse(w.start)) return 'upcoming';
    if (now < Date.parse(w.end)) return 'live';
    return 'ended';
  }
  function relative(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60);
    if (d > 1) return d + ' days';
    if (d === 1) return '1 day ' + h + 'h';
    if (h > 0) return h + 'h ' + m + 'm';
    return Math.max(1, m) + ' min';
  }
  /* "Tuesdays and Thursdays at 12:00 PM ET", from the series rule; the time is
     shown as the sheet states it (in the series zone) plus the viewer's own time
     when that differs, taken from the next real session. */
  function scheduleLabel(s) {
    var days = (s.days || []).map(function (d) { return DAY_NAMES[d] + 's'; });
    var dayText = days.length > 1 ? days.slice(0, -1).join(', ') + ' and ' + days[days.length - 1] : (days[0] || '');
    var next = (s.sessions || [])[0];
    var hostTime = next ? timeIn(next.start, s.timezone) : s.time;
    var mine = next ? timeIn(next.start, VIEWER_TZ) : '';
    return { days: dayText, time: hostTime, local: mine && mine !== hostTime ? mine + ' your time' : '' };
  }
  function track(name, params) { try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) { /* never blocks */ } }
  function pixel(name, params) { try { if (window.fbq) window.fbq('track', name, params || {}); } catch (e) { /* never blocks */ } }

  /* --------------------------------------------- add-to-calendar fallbacks */
  function icsDate(iso) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  /* room (optional): { location, start, end } for a confirmed seat at an in-person event,
     so the entry matches the emailed invite (the venue, doors open to the end of the program). */
  function calendarLinks(w, token, watchUrl, room) {
    var loc = room && room.location ? room.location : watchUrl;
    var start = room && room.start ? room.start : w.start;
    var end = room && room.end ? room.end : w.end;
    var details = (w.subtitle ? w.subtitle + '\n\n' : '') + (room && room.location ? 'Venue: ' + room.location + '\n\nWatching online instead? Your link: ' + watchUrl : 'Join here at start time: ' + watchUrl);
    var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(w.title) +
      '&dates=' + icsDate(start) + '/' + icsDate(end) + '&details=' + encodeURIComponent(details) + '&location=' + encodeURIComponent(loc);
    var o = 'https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent' +
      '&subject=' + encodeURIComponent(w.title) + '&startdt=' + encodeURIComponent(new Date(start).toISOString()) +
      '&enddt=' + encodeURIComponent(new Date(end).toISOString()) + '&body=' + encodeURIComponent(details) + '&location=' + encodeURIComponent(loc);
    function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
    // same UID as the emailed invite, so a calendar that gets both keeps one event
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PrivacyPal//Webinars//EN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + w.id + '-' + token + '@webinars.privacypal.ai', 'DTSTAMP:' + icsDate(new Date().toISOString()),
      'DTSTART:' + icsDate(start), 'DTEND:' + icsDate(end), 'SUMMARY:' + esc(w.title),
      'DESCRIPTION:' + esc(details), 'LOCATION:' + esc(loc), 'URL:' + watchUrl,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(w.title), 'TRIGGER:-PT15M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
    return { google: g, outlook: o, ics: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })) };
  }

  function catalog(query) { return getJSON(API + '/webinars' + (query ? '?' + query : '')); }

  /* ==================================================================== HUB */
  function hub() {
    catalog().then(function (cat) {
      (cat && cat.series || []).forEach(function (s) {
        var door = $('[data-door="' + s.id + '"]');
        if (!door) return;
        var lbl = scheduleLabel(s);
        setText('[data-door="' + s.id + '"] [data-sched]', lbl.days + ' at ' + lbl.time);
        var next = (s.sessions || []).filter(function (x) { return x.registrationOpen; })[0];
        var when = $('[data-next]', door);
        if (next) {
          var live = liveState(next) === 'live';
          when.textContent = (live ? 'Live now: ' : 'Next: ') + fmt(next.start, VIEWER_TZ, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
          show(when, true);
        }
      });
    }).catch(function () { /* the doors work without dates */ });
  }

  /* ================================================================= SERIES */
  function series() {
    var root = $('#wb-root');
    var form = $('#wb-form');
    var err = $('#wb-error');
    var chips = $('#wb-sessions');
    var rebook = param('r');
    var wantS = param('s').toLowerCase();
    var started = Date.now();
    var sessions = [];
    var selected = null;
    var seriesData = null;

    function setMode(rebookMode) {
      $$('[data-form-field]', form).forEach(function (n) { show(n, !rebookMode); });
      $$('[data-form-field] input[required]', form).forEach(function (n) { n.required = !rebookMode; });
      show($('#wb-rebook-note'), rebookMode);
      $('#wb-submit').textContent = rebookMode ? 'Save my seat' : 'Register free';
      $('#wb-card-title').textContent = rebookMode ? 'Welcome back' : 'Save your seat';
      if (!rebookMode) rebook = '';
    }

    function select(id) {
      selected = sessions.filter(function (x) { return x.id === id; })[0] || null;
      $$('.wb-chip', chips).forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-id') === id); c.setAttribute('aria-pressed', c.getAttribute('data-id') === id ? 'true' : 'false'); });
      $('#wb-s').value = selected ? selected.id : '';
      var btn = $('#wb-submit');
      btn.disabled = !selected;
      if (selected && liveState(selected) === 'live') btn.textContent = rebook ? 'Join now' : 'Register and join now';
      else btn.textContent = rebook ? 'Save my seat' : 'Register free';
    }

    function renderChips() {
      chips.innerHTML = '';
      var open = sessions.filter(function (x) { return x.registrationOpen || x.status === 'closed'; }).slice(0, 6);
      if (!open.length) {
        chips.appendChild(el('div', { 'class': 'wb-none' }, 'No dates are open right now. New sessions go up every week, so check back soon.'));
        $('#wb-submit').disabled = true;
        return;
      }
      open.forEach(function (x) {
        var live = liveState(x) === 'live';
        var b = el('button', { type: 'button', 'class': 'wb-chip', 'data-id': x.id, 'aria-pressed': 'false' });
        if (!x.registrationOpen) b.disabled = true;
        b.appendChild(el('b', null, fmt(x.start, VIEWER_TZ, { weekday: 'short', month: 'short', day: 'numeric' })));
        b.appendChild(el('small', null, timeIn(x.start, VIEWER_TZ)));
        if (live) b.appendChild(el('span', { 'class': 'tag' }, 'LIVE'));
        else if (!x.registrationOpen) b.appendChild(el('span', { 'class': 'tag' }, 'FULL'));
        b.addEventListener('click', function () { select(x.id); });
        chips.appendChild(b);
      });
      var pick = open.filter(function (x) { return x.id === wantS && x.registrationOpen; })[0] || open.filter(function (x) { return x.registrationOpen; })[0];
      if (pick) select(pick.id);
    }

    function renderSeries(s) {
      seriesData = s;
      var lbl = scheduleLabel(s);
      setText('[data-sched-days]', lbl.days);
      setText('[data-sched-time]', lbl.time + (lbl.local ? ' (' + lbl.local + ')' : ''));
      setText('[data-duration]', String(s.durationMin));
      var hosts = $('#wb-hosts');
      if (hosts && s.hosts && s.hosts.length) {
        hosts.innerHTML = '';
        hosts.appendChild(el('span', { 'class': 'lbl' }, s.hosts.length > 1 ? 'Hosts' : 'Host'));
        s.hosts.forEach(function (h) { hosts.appendChild(el('div', null, h)); });
        show(hosts, true);
      }
      var live = (s.sessions || []).filter(function (x) { return liveState(x) === 'live'; })[0];
      if (live) { $('#wb-badge').textContent = 'Live now'; $('#wb-badge').className = 'wb-badge live'; }
    }

    function doneState(res, firstName) {
      show(form, false);
      var done = $('#wb-done');
      show(done, true);
      if (done.getBoundingClientRect().top < 80) done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var w = res.session;
      var live = liveState(w) === 'live';
      $('#wb-done-name').textContent = (firstName ? firstName + ', you\u2019re in.' : 'You\u2019re in.');
      $('#wb-done-when').textContent = fmt(w.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeIn(w.start, VIEWER_TZ);
      $('#wb-done-mail').textContent = live
        ? 'We are live right now. Your room is open, and your calendar invite with the same link is on its way.'
        : res.inviteSent === false
          ? 'Your seat is saved. Your calendar invite is running late; it will arrive within a few minutes. You can also add it yourself:'
          : 'Your calendar invite is on its way from ops@privacypal.ai. Accept it and your personal join link lands in your calendar. Not in your inbox? Check spam, or add it yourself:';
      var links = calendarLinks(w, res.token, res.watchUrl);
      $('#wb-cal-google').href = links.google;
      $('#wb-cal-outlook').href = links.outlook;
      $('#wb-cal-ics').href = links.ics;
      $('#wb-cal-ics').setAttribute('download', w.id + '.ics');
      var room = $('#wb-room-link');
      room.href = res.watchUrl;
      room.textContent = live ? 'Open the live room now' : 'Your live room link';
      room.className = live ? 'btn btn-primary' : 'link-arrow';
      show($('#wb-cal-wrap'), !live);
      if (live) setTimeout(function () { location.href = res.watchUrl; }, 1500);
    }

    /* A form sign-up: the address is confirmed by email before the invite goes out. */
    function inboxState(res, email) {
      show(form, false);
      show($('#wb-done'), false);
      var box = $('#wb-inbox');
      show(box, true);
      if (box.getBoundingClientRect().top < 80) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var t = $('#wb-inbox-text');
      t.textContent = '';
      var to = email ? el('b', null, email) : null;
      if (res.check === 'invite') {
        $('#wb-inbox-title').textContent = 'You\u2019re already registered';
        t.appendChild(document.createTextNode('This email already has a seat on this date. ' + (res.emailSent === false ? 'Your calendar invite is on its way again' : 'We sent your calendar invite again') + (to ? ' to ' : '')));
        if (to) t.appendChild(to);
        t.appendChild(document.createTextNode('.'));
      } else {
        $('#wb-inbox-title').textContent = 'Check your inbox';
        t.appendChild(document.createTextNode(res.emailSent === false ? 'Your confirmation email is running a little late and arrives within a few minutes' : 'We sent a confirmation email'));
        if (to) { t.appendChild(document.createTextNode(' to ')); t.appendChild(to); }
        t.appendChild(document.createTextNode('. Press '));
        t.appendChild(el('b', null, 'Confirm my seat'));
        t.appendChild(document.createTextNode(' in it and your calendar invite with your personal join link follows straight after.'));
      }
      var when = $('#wb-inbox-when');
      if (res.session && res.session.start) {
        when.textContent = fmt(res.session.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeIn(res.session.start, VIEWER_TZ);
        show(when, true);
      }
    }

    var MESSAGES = {
      email: 'Check your email address.',
      first_name: 'Add your first name, letters only.',
      session: 'Pick a date first.',
      not_found: 'That session could not be found. Reload the page and pick a date.',
      closed: 'Registration for that date has closed. Pick another date.',
      rebook_not_found: 'We could not find your earlier registration. Fill in your details to register.',
      rate_limited: 'Too many sign-ups from this network in a short time. Wait a few minutes and try again.',
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.classList.remove('on');
      if (!selected) { err.textContent = MESSAGES.session; err.classList.add('on'); return; }
      if (!rebook && !form.reportValidity()) return;
      var btn = $('#wb-submit');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Saving your seat\u2026';
      var data = { s: selected.id, tz: VIEWER_TZ, _e: String(Date.now() - started) };
      if (rebook) data.r = rebook;
      else {
        new FormData(form).forEach(function (v, k) { if (k !== '_html' && k !== 's') data[k] = v; });
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { var v = param(k); if (v) data[k] = v; });
        var ref = param('ref') || (window.PPReferral && window.PPReferral.get && window.PPReferral.get()) || '';
        if (ref) data.ref = ref;
      }
      postForm(API + '/webinar-register', data).then(function (res) {
        if (res && res.ok && res.check && res.session) {
          inboxState(res, data.email || '');
          track('sign_up', { method: 'webinar', series: SERIES, session_id: res.session.id, rebook: false, check: res.check });
          pixel('CompleteRegistration', { content_name: res.session.title, content_category: SERIES });
          return;
        }
        if (res && res.ok && res.token && res.session) {
          doneState(res, rebook ? '' : data.first_name);
          track('sign_up', { method: 'webinar', series: SERIES, session_id: res.session.id, rebook: !!rebook });
          pixel('CompleteRegistration', { content_name: res.session.title, content_category: SERIES });
          return;
        }
        if (res && res.error === 'rebook_not_found') setMode(false);
        throw new Error((res && res.error) || 'unknown');
      }).catch(function (ex) {
        var key = ex && ex.message;
        err.textContent = MESSAGES[key] || 'Something went wrong on our side. Try again in a minute, or email hi@privacypal.ai and we will add you by hand.';
        err.classList.add('on');
        btn.disabled = false;
        btn.textContent = label;
      });
    });
    var retry = $('#wb-inbox-retry');
    if (retry) retry.addEventListener('click', function () {
      show($('#wb-inbox'), false);
      show(form, true);
      setMode(false);
      if (selected) select(selected.id);
      var btn = $('#wb-submit');
      btn.disabled = !selected;
      var em = $('#wb-email');
      if (em) { em.value = ''; em.focus(); }
    });
    var other = $('#wb-not-me');
    if (other) other.addEventListener('click', function () { setMode(false); select(selected ? selected.id : ''); });

    setMode(!!rebook);
    var checkParam = param('check');
    if (checkParam === 'verify' || checkParam === 'invite') inboxState({ check: checkParam }, '');
    else if (param('registered') === '1') { show(form, false); show($('#wb-done'), true); show($('#wb-cal-wrap'), false); show($('#wb-room-link'), false); $('#wb-done-mail').textContent = 'Your calendar invite is on its way from ops@privacypal.ai.'; }

    catalog('series=' + encodeURIComponent(SERIES) + (wantS ? '&s=' + encodeURIComponent(wantS) : '')).then(function (cat) {
      root.classList.remove('loading');
      var s = cat && cat.ok && (cat.series || []).filter(function (x) { return x.id === SERIES; })[0];
      if (!s) throw new Error('no series');
      sessions = (s.sessions || []).slice();
      // a one-off or unlisted session reached by its link joins the list
      if (cat.requested && cat.requested.series === SERIES && !sessions.some(function (x) { return x.id === cat.requested.id; })) {
        if (cat.requested.registrationOpen) sessions.unshift(cat.requested);
      }
      sessions.sort(function (a, b) { return Date.parse(a.start) - Date.parse(b.start); });
      renderSeries(s);
      renderChips();
    }).catch(function () {
      root.classList.remove('loading');
      chips.innerHTML = '';
      chips.appendChild(el('div', { 'class': 'wb-none' }, 'Dates are not loading right now. Try again in a minute, or email hi@privacypal.ai and we will add you by hand.'));
      $('#wb-submit').disabled = true;
    });
  }

  /* ============================================================ LIVE ROOM */
  function watch() {
    var id = (param('s') || param('w')).toLowerCase();
    var token = param('r');
    var stage = $('#wr-stage');
    var video = $('#wr-video');
    var chat = $('#wr-chat');
    var w = null;
    var res = null;
    var pollTimer = null;
    var tickTimer = null;
    var retried = false;

    function seriesOf() { return (w && w.series) || id.split('-')[0] || ''; }
    function isEv() { return !!(res && res.event) || (w && w.kind === 'event'); }
    function evPage() { return '../live/?e=' + encodeURIComponent(id); }
    /* events: a theater stage, who is on it, the run of show, the venue for people in the room */
    function eventExtras() {
      var e = res && res.event;
      document.body.classList.toggle('wr-theater', !!e);
      if (!e) return;
      var people = $('#wr-ev-people');
      people.innerHTML = '';
      (e.people || []).forEach(function (p) {
        var d = el('div', { 'class': 'wr-ev-person' });
        d.appendChild(avatar(p));
        var t = el('div');
        t.appendChild(el('b', null, p.name));
        t.appendChild(el('small', null, [ROLE_LABEL[p.role], [p.title, p.company].filter(Boolean).join(', ')].filter(Boolean).join(' · ')));
        d.appendChild(t);
        people.appendChild(d);
      });
      show($('#wr-ev-people-card'), (e.people || []).length > 0);
      var ag = $('#wr-ev-agenda');
      ag.innerHTML = '';
      (e.agenda || []).forEach(function (a) { var li = el('li'); li.appendChild(el('span', { 'class': 'at' }, a.at || '')); li.appendChild(el('span', null, a.item)); ag.appendChild(li); });
      var inRoom = e.venue && (e.attend === 'in_person' || e.attend === 'both') && e.seat === 'confirmed';
      var vb = $('#wr-ev-venue');
      vb.innerHTML = '';
      if (inRoom) {
        vb.appendChild(el('b', null, 'Your seat in the room'));
        vb.appendChild(el('div', null, venueText(e.venue) + (e.venue.room ? ', ' + e.venue.room : '')));
        if (e.doorsMin) vb.appendChild(el('div', null, 'Doors open ' + e.doorsMin + ' minutes before the start.'));
        vb.appendChild(el('a', { href: mapsUrl(e.venue), target: '_blank', rel: 'noopener' }, 'Open in Maps'));
      }
      show(vb, !!inRoom);
      $('#wr-ev-side-label').textContent = (e.agenda || []).length ? 'Agenda' : 'Venue';
      show($('#wr-ev-side-card'), (e.agenda || []).length > 0 || !!inRoom);
      show($('#wr-ev'), (e.people || []).length > 0 || (e.agenda || []).length > 0 || !!inRoom);
      var biz = e.audience !== 'consumer';
      $('#wr-ev-cta-title').textContent = biz ? 'Govern every AI at work, and keep your team moving.' : 'Their world is full of AI. You hold the keys.';
      $('#wr-ev-cta-text').textContent = biz
        ? 'Personal is included free with every download of PrivacyPal. When the whole company needs covering, the Max pack adds agents and copilots, admin and one policy across every seat.'
        : 'With the Family pack you choose the AI your kids use, keep their real identity away from AI providers, and see how AI shows up in their day.';
      var cta = $('#wr-ev-cta-primary');
      if (res.cta && res.cta.url) { cta.textContent = res.cta.label; cta.href = res.cta.url; show(cta, true); }
      show($('#wr-ev-cta'), true);
    }
    function message(eyebrow, title, text, linkLabel, href) {
      show($('#wr-live'), false);
      var box = $('#wr-msg');
      show(box, true);
      $('.eyebrow', box).textContent = eyebrow;
      $('h1', box).textContent = title;
      $('.lede', box).textContent = text;
      var a = $('#wr-msg-register');
      show(a, !!linkLabel);
      if (linkLabel) { a.textContent = linkLabel; a.href = href; }
    }
    function nextLine() {
      if (!res || !res.next) return '';
      return 'Next session: ' + fmt(res.next.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeIn(res.next.start, VIEWER_TZ) + '.';
    }
    function showCta() {
      $$('[data-cta-series]').forEach(function (n) { show(n, !isEv() && n.getAttribute('data-cta-series') === seriesOf()); });
    }

    function waiting(text) {
      video.innerHTML = '';
      var wait = el('div', { 'class': 'wr-wait' });
      wait.appendChild(el('span', { 'class': 'eyebrow' }, 'Starts in'));
      wait.appendChild(el('div', { 'class': 'count', id: 'wr-count' }, relative(Date.parse(w.start) - Date.now())));
      wait.appendChild(el('p', null, text));
      video.appendChild(wait);
    }
    function external(url) {
      video.innerHTML = '';
      video.removeAttribute('data-yt');
      var box = el('div', { 'class': 'wr-wait' });
      box.appendChild(el('span', { 'class': 'eyebrow' }, liveState(w) === 'live' ? 'Live now' : 'Streams on YouTube'));
      box.appendChild(el('div', { 'class': 'count' }, 'Watch on YouTube'));
      box.appendChild(el('p', null, 'This session streams on our YouTube channel. The button opens it in a new tab.'));
      box.appendChild(el('a', { 'class': 'btn btn-primary', href: url, target: '_blank', rel: 'noopener' }, 'Open the stream'));
      video.appendChild(box);
    }
    function embed(ytId, replay) {
      if (video.getAttribute('data-yt') === ytId) return;
      video.innerHTML = '';
      video.setAttribute('data-yt', ytId);
      video.appendChild(el('iframe', {
        src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(ytId) + '?' + (replay ? '' : 'autoplay=1&') + 'rel=0&modestbranding=1&playsinline=1',
        title: w.title, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: '',
      }));
      $('#wr-yt').href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(ytId);
      show($('#wr-yt'), true);
      // YouTube serves embedded live chat only to the domain named in embed_domain; an event may switch chat off
      var chatOk = !replay && liveState(w) === 'live' && /(^|\.)privacypal\.ai$/.test(location.hostname) && !(res.event && res.event.chat === false);
      if (chatOk && !chat.firstChild) chat.appendChild(el('iframe', { src: 'https://www.youtube.com/live_chat?v=' + encodeURIComponent(ytId) + '&embed_domain=' + encodeURIComponent(location.hostname), title: 'Live chat' }));
      stage.classList.toggle('with-chat', chatOk);
      show(chat, chatOk);
    }

    function render() {
      var state = liveState(w);
      var wl = whenLine(w);
      $('#wr-title').textContent = w.title;
      $('#wr-meta').textContent = wl.day + ', ' + wl.time + (wl.host ? ' (' + wl.host + ')' : '') + ' \u00b7 ' + w.durationMin + ' min';
      $('#wr-badge').textContent = state === 'live' ? 'Live now' : state === 'ended' ? 'Ended' : 'Upcoming';
      $('#wr-badge').className = 'wb-badge' + (state === 'live' ? ' live' : '');
      document.title = w.title + ' \u00b7 Live room \u00b7 PrivacyPal';
      showCta();
      eventExtras();
      if (state === 'ended' && isEv()) {
        clearInterval(tickTimer);
        // an event's recording plays right here, for registrants
        if (res.replayId) { $('#wr-badge').textContent = 'On demand'; embed(res.replayId, true); return; }
        video.innerHTML = '';
        video.removeAttribute('data-yt');
        var fin = el('div', { 'class': 'wr-wait' });
        fin.appendChild(el('span', { 'class': 'eyebrow' }, 'Event ended'));
        fin.appendChild(el('div', { 'class': 'count' }, 'Thanks for joining'));
        fin.appendChild(el('p', null, res.replay ? 'The recording is ready.' : 'The recording link arrives in your follow-up email when it is ready.'));
        if (res.replay) fin.appendChild(el('a', { 'class': 'btn btn-gold', href: res.replay, target: '_blank', rel: 'noopener' }, 'Watch the recording'));
        video.appendChild(fin);
        stage.classList.remove('with-chat');
        show(chat, false);
        return;
      }
      if (state === 'ended') {
        clearInterval(tickTimer);
        video.innerHTML = '';
        video.removeAttribute('data-yt');
        var done = el('div', { 'class': 'wr-wait' });
        done.appendChild(el('span', { 'class': 'eyebrow' }, 'Session ended'));
        done.appendChild(el('div', { 'class': 'count' }, 'Thanks for joining'));
        done.appendChild(el('p', null, (res.replay ? 'The recording is ready. ' : '') + (nextLine() || 'We run this session every week.')));
        if (res.replay) done.appendChild(el('a', { 'class': 'btn btn-primary', href: res.replay, target: '_blank', rel: 'noopener' }, 'Watch the recording'));
        if (res.next) done.appendChild(el('a', { 'class': 'btn btn-ghost', href: seriesUrl(seriesOf(), '?r=' + encodeURIComponent(token) + '&s=' + encodeURIComponent(res.next.id)) }, 'Save a seat at the next one'));
        video.appendChild(done);
        stage.classList.remove('with-chat');
        show(chat, false);
        return;
      }
      if (res.youtubeId) embed(res.youtubeId);
      else if (res.youtubeUrl) external(res.youtubeUrl);
      else waiting(state === 'live' ? 'We are about to start. This page connects to the stream on its own; keep it open.' : 'Keep this page open: the stream starts here on its own. You can also come back with the link in your calendar invite.');
    }

    function load() {
      return getJSON(API + '/webinar-join?s=' + encodeURIComponent(id) + '&r=' + encodeURIComponent(token)).then(function (r) {
        res = r;
        var sid = seriesOf();
        var ev = !!(r && r.event);
        document.body.classList.toggle('wr-theater', ev);
        var reg = ev ? evPage() : sid ? seriesUrl(sid, r && r.next ? '?s=' + encodeURIComponent(r.next.id) : '') : BASE;
        if (!r || (!r.ok && !r.session)) {
          if (r && r.error === 'not_found') return message('Live room', 'We could not find this session', 'The link may be incomplete. Open the join link from your calendar invite or email.', 'See upcoming sessions', BASE);
          return message('Live room', 'The live room is not loading', 'Try again in a minute. The stream link is also in the email we send when we go live.', '', '');
        }
        w = r.session;
        if (!r.ok) {
          // a registration seconds old can be newer than the server's snapshot: retry once
          if (r.error === 'not_registered' && !retried && token) { retried = true; return new Promise(function (ok) { setTimeout(ok, 11000); }).then(load); }
          if (r.error === 'not_verified') return message('One step left', w.title, 'Confirm your email first: press Confirm my seat in the email we sent you, and this room opens with your calendar invite.', '', '');
          if (r.error === 'cancelled') return message('Registration canceled', w.title, 'This registration was canceled. ' + (nextLine() || ''), ev ? 'Register again' : 'Pick another date', reg);
          if (r.error === 'session_cancelled' && ev) return message('Event canceled', w.title, 'This event was canceled. We are sorry for the change of plans.', 'Event page', reg);
          if (r.error === 'session_cancelled') return message('Session canceled', w.title, 'This session was canceled. ' + (nextLine() || 'We run it every week.'), 'Save a seat at the next one', token ? seriesUrl(sid, '?r=' + encodeURIComponent(token)) : reg);
          return message('Registered guests only', w.title, 'The live room opens with the personal link in your calendar invite. Not registered yet? It takes ten seconds.', 'Register free', reg);
        }
        show($('#wr-msg'), false);
        show($('#wr-live'), true);
        render();
        schedule();
      }).catch(function () {
        message('Live room', 'The live room is not loading', 'Check your connection and reload. The stream link is also in the email we send when we go live.', '', '');
      });
    }

    function schedule() {
      clearTimeout(pollTimer);
      clearInterval(tickTimer);
      var state = liveState(w);
      tickTimer = setInterval(function () {
        var c = $('#wr-count');
        if (c && liveState(w) === 'upcoming') c.textContent = relative(Date.parse(w.start) - Date.now());
        if (liveState(w) !== state) { state = liveState(w); render(); }
      }, 15000);
      // ask the server again only when something can still change: no stream link yet, or the end (recording)
      if (!res.youtubeId && !res.youtubeUrl && state !== 'ended') pollTimer = setTimeout(load, 90000);
      else if (state !== 'ended') pollTimer = setTimeout(load, Math.max(60000, Date.parse(w.end) - Date.now() + 5 * 60000));
    }

    if (!id || !token) {
      message('Registered guests only', 'This is the live room', 'It opens with the personal link in your calendar invite. Not registered yet? It takes ten seconds.', 'See upcoming sessions', BASE);
      return;
    }
    track('webinar_join', { session_id: id });
    load();
  }

  /* =============================================================== CANCEL */
  function cancel() {
    var token = param('r');
    var btn = $('#wc-confirm');
    var out = $('#wc-result');
    if (!token) {
      show($('#wc-ask'), false);
      out.textContent = 'This link is incomplete. Use the cancel link from your invite email.';
      show(out, true);
      return;
    }
    btn.addEventListener('click', function () {
      btn.disabled = true;
      btn.textContent = 'Canceling\u2026';
      postForm(API + '/webinar-cancel', { r: token }).then(function (res) {
        show($('#wc-ask'), false);
        if (res && res.ok) {
          $('#wc-done-title').textContent = res.already ? 'Already canceled' : 'Registration canceled';
          var t = res.already ? 'This registration was already canceled.' : 'You will get one last email that removes the session from your calendar.';
          if (res.next) t += ' The next session is ' + fmt(res.next.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeIn(res.next.start, VIEWER_TZ) + '.';
          $('#wc-done-text').textContent = t;
          var again = $('#wc-again');
          if (res.session && res.session.kind === 'event') {
            $('#wc-done-text').textContent = res.already ? 'This registration was already canceled.' : 'You will get one last email that removes the event from your calendar.';
            again.href = '../live/?e=' + encodeURIComponent(res.session.id);
            again.textContent = 'Event page';
            show(again, true);
          } else if (res.series) { again.href = seriesUrl(res.series, '?r=' + encodeURIComponent(token) + (res.next ? '&s=' + encodeURIComponent(res.next.id) : '')); show(again, true); }
          show($('#wc-done'), true);
        } else {
          out.textContent = res && res.error === 'not_found'
            ? 'We could not find this registration. It may already have been removed.'
            : 'Something went wrong on our side. Try again in a minute, or reply to your invite email and we will cancel it for you.';
          show(out, true);
        }
      }).catch(function () {
        show($('#wc-ask'), false);
        out.textContent = 'Something went wrong on our side. Try again in a minute, or reply to your invite email and we will cancel it for you.';
        show(out, true);
      });
    });
  }

  /* =============================================================== VERIFY */
  /* The confirmation email links here with the registration token. Confirming takes
     a button press (a POST), so a mail scanner that opens the link confirms nobody. */
  function verify() {
    var token = param('r');
    var btn = $('#wv-confirm');
    var out = $('#wv-result');
    function fail(text) { show($('#wv-ask'), false); out.textContent = text; show(out, true); }
    if (!token) { fail('This link is incomplete. Open the Confirm my seat button in your confirmation email.'); return; }
    function nextLine(res) {
      return res && res.next ? ' The next session is ' + fmt(res.next.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeIn(res.next.start, VIEWER_TZ) + '.' : '';
    }
    function done(res) {
      if (res.session && res.session.kind === 'event') return doneEvent(res);
      show($('#wv-ask'), false);
      var w = res.session;
      var live = liveState(w) === 'live';
      $('#wv-done-title').textContent = res.already ? 'You\u2019re already confirmed' : 'You\u2019re in.';
      $('#wv-done-when').textContent = fmt(w.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeIn(w.start, VIEWER_TZ);
      $('#wv-done-title-sub').textContent = w.title;
      $('#wv-done-mail').textContent = live
        ? 'We are live right now. Your room is open, and your calendar invite with the same link is on its way.'
        : res.already
          ? 'Your seat is confirmed and your calendar invite is in your inbox. You can also add the session yourself:'
          : res.inviteSent === false
            ? 'Your seat is confirmed. Your calendar invite is running a little late and arrives within a few minutes. You can also add it yourself:'
            : 'Your calendar invite is on its way from ops@privacypal.ai. Accept it and your personal join link lands in your calendar. You can also add it yourself:';
      var links = calendarLinks(w, res.token, res.watchUrl);
      $('#wv-cal-google').href = links.google;
      $('#wv-cal-outlook').href = links.outlook;
      $('#wv-cal-ics').href = links.ics;
      $('#wv-cal-ics').setAttribute('download', w.id + '.ics');
      show($('#wv-cal-wrap'), !live);
      var room = $('#wv-room-link');
      room.href = res.watchUrl;
      room.textContent = live ? 'Open the live room now' : 'Your live room link';
      room.className = live ? 'btn btn-primary' : 'link-arrow';
      show($('#wv-done'), true);
      if (!res.already) track('webinar_verified', { series: w.series, session_id: w.id });
      if (live) setTimeout(function () { location.href = res.watchUrl; }, 1500);
    }
    /* An event: the one email that went out says what happened (delivered), and so does this page. */
    function doneEvent(res) {
      show($('#wv-ask'), false);
      var w = res.session;
      var e = res.event || {};
      var seat = res.seat || '';
      var inRoom = seat === 'confirmed';
      var kind = res.delivered || (res.already ? (res.attend === 'in_person' && !inRoom ? 'seat_' + (seat || 'waitlist') : 'invite') : 'invite');
      var live = liveState(w) === 'live';
      var title = kind === 'ondemand' ? 'Your recording is ready' : kind === 'seat_waitlist' ? 'You\u2019re on the waitlist' : kind === 'seat_requested' ? 'Request received'
        : inRoom ? 'Your seat is confirmed' : res.already ? 'You\u2019re already confirmed' : 'You\u2019re in.';
      $('#wv-done-title').textContent = title;
      $('#wv-done-title-sub').textContent = w.title;
      $('#wv-done-when').textContent = (kind === 'ondemand' ? 'Recorded ' : '') + fmt(w.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeIn(w.start, VIEWER_TZ) + (inRoom && e.venue ? ' \u00b7 ' + e.venue : '');
      var mail = kind === 'ondemand' ? 'Your email is confirmed. Press play below; the link is in your inbox too.'
        : kind === 'seat_waitlist' ? 'Your email is confirmed and the room is full. If a seat opens up, your confirmation and calendar invite arrive straight away.' + (e.online ? ' The event is streamed too: your link below works at start time.' : '')
        : kind === 'seat_requested' ? 'Your email is confirmed. The organizers confirm seats in the room, and you hear from us as soon as yours is confirmed, with your calendar invite.' + (e.online ? ' The event is streamed too: your link below works at start time.' : '')
        : live ? 'We are live right now. Your room is open, and your calendar invite with the same link is on its way.'
        : (inRoom ? 'Your calendar invite with the venue is on its way from ops@privacypal.ai.' : 'Your calendar invite with your personal join link is on its way from ops@privacypal.ai.') +
          (res.attend === 'both' && seat === 'waitlist' ? ' You are on the waitlist for a seat in the room; if one opens up, your invite moves to the venue.' : res.attend === 'both' && seat === 'requested' ? ' Your request for a seat in the room is with the organizers.' : '') +
          ' You can also add it yourself:';
      $('#wv-done-mail').textContent = mail;
      var calendar = kind === 'invite' && !live;
      if (calendar) {
        var room = inRoom && e.venue ? { location: e.venue, start: new Date(Date.parse(w.start) - (e.doorsMin || 0) * 60000).toISOString(), end: new Date(Date.parse(w.end) + (e.afterMin || 0) * 60000).toISOString() } : null;
        var links = calendarLinks(w, res.token, res.watchUrl, room);
        $('#wv-cal-google').href = links.google;
        $('#wv-cal-outlook').href = links.outlook;
        $('#wv-cal-ics').href = links.ics;
        $('#wv-cal-ics').setAttribute('download', w.id + '.ics');
      }
      show($('#wv-cal-wrap'), calendar);
      var link = $('#wv-room-link');
      var showRoom = kind === 'ondemand' || live || e.online !== false;
      link.href = res.watchUrl;
      link.textContent = kind === 'ondemand' ? 'Watch the recording' : live ? 'Open the live room now' : 'Your live room link';
      link.className = kind === 'ondemand' || live ? 'btn btn-primary' : 'link-arrow';
      show(link, showRoom);
      show($('#wv-done'), true);
      if (!res.already) track('webinar_verified', { series: 'event', session_id: w.id, attend: res.attend, seat: seat });
      if (live && kind === 'invite' && res.attend !== 'in_person') setTimeout(function () { location.href = res.watchUrl; }, 1500);
    }
    function closed(res) {
      show($('#wv-ask'), false);
      var cancelled = res.error === 'cancelled';
      $('#wv-closed-title').textContent = cancelled ? 'This registration was canceled' : 'That date has closed';
      $('#wv-closed-text').textContent = (cancelled
        ? 'This sign-up was canceled, so there is nothing to confirm.'
        : 'Your email is confirmed, but registration for that date has closed.') + (nextLine(res) || ' New dates go up every week.');
      var a = $('#wv-closed-next');
      if (res.session && res.session.kind === 'event') {
        $('#wv-closed-title').textContent = cancelled ? 'This registration was canceled' : 'Registration has closed';
        $('#wv-closed-text').textContent = cancelled ? 'This sign-up was canceled, so there is nothing to confirm.' : 'Your email is confirmed, but registration for this event has closed.';
        a.href = '../live/?e=' + encodeURIComponent(res.session.id);
        a.textContent = 'Event page';
        show(a, true);
      } else if (res.series) {
        // a confirmed address rebooks in one click; a canceled sign-up picks a date and fills in the form
        a.href = seriesUrl(res.series, !cancelled && res.next ? '?r=' + encodeURIComponent(token) + '&s=' + encodeURIComponent(res.next.id) : '');
        a.textContent = !cancelled && res.next ? 'Save my seat at the next one' : 'Pick another date';
        show(a, true);
      }
      show($('#wv-closed'), true);
    }
    btn.addEventListener('click', function () {
      btn.disabled = true;
      btn.textContent = 'Confirming\u2026';
      postForm(API + '/webinar-verify', { r: token }).then(function (res) {
        if (res && res.ok && res.token && res.session) return done(res);
        if (res && (res.error === 'closed' || res.error === 'cancelled')) return closed(res);
        if (res && (res.error === 'not_found' || res.error === 'token')) return fail('We could not find this sign-up. It may be from an older email: register again from the live demo page and use the newest email.');
        throw new Error((res && res.error) || 'unknown');
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = 'Confirm my seat';
        out.textContent = 'Something went wrong on our side. Press the button again in a minute, or email hi@privacypal.ai and we will add you by hand.';
        show(out, true);
      });
    });
  }

  /* ================================================================== EVENT */
  /* live/?e=<event id>: one page for every ad-hoc webinar, in-person and hybrid event.
     Everything on it comes from GET /webhook/webinars?e=<id>; ?preview=<id> renders a Studio
     preview (kept two hours on the server, fetched from the Admin webhook) with registration off. */
  var HEROES = {
    emperor: { tone: 'light', wide: 'assets/emperor-2000.webp', narrow: 'assets/emperor-1000.webp', img: 'assets/emperor-1400.jpg' },
    business: { tone: 'dark', wide: '../assets/home/scene-business-2000.webp', narrow: '../assets/home/scene-business-960.webp', img: '../assets/home/scene-business-2000.jpg' },
    family: { tone: 'dark', wide: '../assets/home/scene-family-1600.webp', narrow: '../assets/home/scene-family-960.webp', img: '../assets/home/scene-family-1600.jpg' },
    you: { tone: 'dark', wide: '../assets/home/scene-you-1600.webp', narrow: '../assets/home/scene-you-960.webp', img: '../assets/home/scene-you-1600.jpg' },
  };
  var EV_FIELDS = {
    company: { label: 'Company', type: 'text', ac: 'organization', max: 100 },
    job_title: { label: 'Job title', type: 'text', ac: 'organization-title', max: 100 },
    phone: { label: 'Mobile phone', type: 'tel', ac: 'tel', max: 30, ph: 'For day-of updates only' },
    linkedin: { label: 'LinkedIn profile', type: 'text', ac: 'url', max: 200, ph: 'linkedin.com/in/you' },
    dietary: { label: 'Dietary requirements', type: 'text', max: 200, ph: 'Vegetarian, allergies, or none' },
    accessibility: { label: 'Accessibility needs', type: 'text', max: 300, ph: 'Anything that helps you take part' },
    question: { label: 'Your question for the speakers', type: 'textarea', max: 500, ph: 'Your AI tools, your industry, your compliance questions' },
  };
  var ROLE_LABEL = { host: 'Host', speaker: 'Speaker', moderator: 'Moderator', panelist: 'Panelist', producer: 'Producer' };
  var ICON = {
    date: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    time: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
    length: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/></svg>',
    online: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    venue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
  };
  function icon(name) { var s = el('span'); s.innerHTML = ICON[name]; return s.firstChild; } // static markup only, never data
  function initials(name) { return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (p) { return p.charAt(0).toUpperCase(); }).join(''); }
  function avatar(p, cls) {
    if (p.photo) {
      var img = el('img', { 'class': 'ev-avatar ' + (cls || ''), src: p.photo, alt: '', loading: 'lazy', width: '80', height: '80' });
      img.addEventListener('error', function () { var d = el('div', { 'class': 'ev-avatar initials ' + (cls || '') }, initials(p.name)); img.replaceWith(d); });
      return img;
    }
    return el('div', { 'class': 'ev-avatar initials ' + (cls || ''), 'aria-hidden': 'true' }, initials(p.name));
  }
  function formatLabel(f) { return f === 'hybrid' ? 'Hybrid event' : f === 'in_person' ? 'In-person event' : 'Live webinar'; }
  function venueText(v) { return v ? [v.name, v.address, v.city].filter(Boolean).join(', ') : ''; }
  function mapsUrl(v) { return v.mapUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venueText(v)); }
  function durationText(min) { return min < 90 || min % 60 ? min + ' minutes' : (min / 60) + ' hours'; }
  /* Paragraphs from blank lines; "- " lines become a list; **word** becomes bold. Built as
     DOM nodes, so nothing in the text is ever parsed as markup. */
  function richText(root, text) {
    root.innerHTML = '';
    String(text || '').split(/\n{2,}/).forEach(function (block) {
      var ls = block.split('\n');
      if (ls.every(function (l) { return /^\s*[-•*]\s+/.test(l); })) {
        var ul = el('ul');
        ls.forEach(function (l) { var li = el('li'); inline(li, l.replace(/^\s*[-•*]\s+/, '')); ul.appendChild(li); });
        root.appendChild(ul);
      } else {
        var p = el('p');
        ls.forEach(function (l, i) { if (i) p.appendChild(el('br')); inline(p, l); });
        root.appendChild(p);
      }
    });
  }
  function inline(node, text) {
    String(text).split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
      if (/^\*\*[^*]+\*\*$/.test(part)) node.appendChild(el('b', null, part.slice(2, -2)));
      else if (part) node.appendChild(document.createTextNode(part));
    });
  }
  function tracked(url, source, medium, content) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'utm_source=' + encodeURIComponent(source) + '&utm_medium=' + encodeURIComponent(medium) + '&utm_campaign=' + encodeURIComponent(param('e')) + (content ? '&utm_content=' + encodeURIComponent(content) : '');
  }

  function eventPage() {
    var id = param('e').toLowerCase();
    var previewId = param('preview');
    var preview = /^[0-9a-f]{32}$/.test(previewId);
    var root = $('#ev-root');
    var form = $('#ev-form');
    var err = $('#ev-error');
    var started = Date.now();
    var ev = null;
    var attend = '';
    var tick = null;
    var lastState = '';
    var canonical = 'https://privacypal.ai/live/?e=' + encodeURIComponent(id);

    function missing(title, text) {
      root.classList.remove('loading');
      root.classList.add('missing');
      if (title) $('#ev-missing-title').textContent = title;
      if (text) $('#ev-missing-text').textContent = text;
      show($('#ev-missing'), true);
    }
    function stateOf() {
      if (ev.status === 'cancelled') return 'cancelled';
      return liveState({ start: ev.start, end: ev.end, status: '' });
    }
    function level(k, a) {
      var f = (ev.fields || {})[k] || { online: 'off', in_person: 'off' };
      if (a === 'online') return f.online;
      if (a === 'in_person') return f.in_person;
      var rank = { off: 0, optional: 1, required: 2 };
      return rank[f.online] > rank[f.in_person] ? f.online : f.in_person;
    }

    /* ---- hero, facts and content ---- */
    function renderHero() {
      var h = HEROES[ev.hero] || null;
      var hero = $('#ev-hero');
      if (h) {
        $('#ev-hero-src-wide').srcset = h.wide;
        $('#ev-hero-src-narrow').srcset = h.narrow;
        $('#ev-hero-img').src = h.img;
        hero.classList.toggle('tone-dark', h.tone === 'dark');
      } else if (/^https:\/\//.test(ev.hero || '')) {
        $('#ev-hero-src-wide').removeAttribute('srcset');
        $('#ev-hero-src-narrow').removeAttribute('srcset');
        $('#ev-hero-img').src = ev.hero;
        hero.classList.add('tone-dark');
      }
      // the primary action on a dark photo is gold (STYLE-GUIDE.md, gold rule 4)
      $('#ev-cta').className = 'btn btn-lg ' + (hero.classList.contains('tone-dark') ? 'btn-gold' : 'btn-primary');
      $('#ev-title').textContent = ev.title;
      $('#ev-subtitle').textContent = ev.subtitle || '';
      var aud = $('#ev-audience');
      aud.textContent = ev.audience === 'consumer' ? 'For individuals and families' : 'For business';
      show(aud, true);
      var top = $('#ev-topic');
      top.textContent = ev.topic === 'industry' ? 'Industry briefing' : 'Product session';
      show(top, true);
      var when = $('#ev-when');
      when.textContent = '';
      // an in-person event is told in the venue's time; online in the viewer's
      var tz = ev.format === 'in_person' ? ev.timezone : VIEWER_TZ;
      when.appendChild(document.createTextNode(fmt(ev.start, tz, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ' · ' + timeIn(ev.start, tz)));
      var other = ev.format === 'in_person' ? timeIn(ev.start, VIEWER_TZ) : timeIn(ev.start, ev.timezone);
      var otherLabel = ev.format === 'in_person' ? ' your time' : ev.format === 'online' ? ' host time' : ' at the venue';
      if (other !== timeIn(ev.start, tz)) when.appendChild(el('small', null, other + otherLabel));
      document.title = ev.title + ' · PrivacyPal';
    }
    function fact(name, label, main, sub, link) {
      var d = el('div', { 'class': 'ev-fact' });
      var dt = el('dt');
      dt.appendChild(icon(name));
      dt.appendChild(document.createTextNode(label));
      var dd = el('dd');
      if (link) dd.appendChild(el('a', { href: link, target: '_blank', rel: 'noopener' }, main));
      else dd.appendChild(document.createTextNode(main));
      if (sub) dd.appendChild(el('small', null, sub));
      d.appendChild(dt);
      d.appendChild(dd);
      return d;
    }
    function renderFacts() {
      var box = $('#ev-facts');
      box.innerHTML = '';
      var tz = ev.format === 'in_person' ? ev.timezone : VIEWER_TZ;
      box.appendChild(fact('date', 'Date', fmt(ev.start, tz, { weekday: 'long', month: 'long', day: 'numeric' }), fmt(ev.start, tz, { year: 'numeric' })));
      var t = timeIn(ev.start, tz);
      var hostT = timeIn(ev.start, ev.timezone);
      box.appendChild(fact('time', 'Time', t + ' to ' + timeIn(ev.end, tz).replace(/ [A-Z]{2,5}$|\s?GMT[+-]\d+$/, ''), t !== hostT ? hostT + (ev.format === 'online' ? ' host time' : ' at the venue') : (ev.inPerson && ev.inPerson.doorsMin ? 'Doors open ' + ev.inPerson.doorsMin + ' minutes before' : '')));
      box.appendChild(fact('length', 'Length', durationText(ev.durationMin), ev.inPerson && ev.inPerson.afterMin ? 'Then ' + ev.inPerson.afterMin + ' minutes in the room' : 'Free to join'));
      if (ev.format === 'online') box.appendChild(fact('online', 'Where', 'Online', ev.chat ? 'Live on privacypal.ai, with chat' : 'Live on privacypal.ai'));
      else if (ev.venue) box.appendChild(fact('venue', 'Where', ev.venue.name || ev.venue.address, (ev.venue.city || '') + (ev.format === 'hybrid' ? (ev.venue.city ? ', and online' : 'And online') : ''), mapsUrl(ev.venue)));
    }
    function renderContent() {
      $('#ev-about-label').textContent = ev.format === 'online' ? 'About this webinar' : 'About this event';
      if (ev.description) richText($('#ev-desc'), ev.description); else show($('#ev-about-wrap'), false);
      var learn = $('#ev-learn');
      learn.innerHTML = '';
      (ev.learn || []).forEach(function (l) { learn.appendChild(el('li', null, l)); });
      show($('#ev-learn-wrap'), (ev.learn || []).length > 0);

      var people = ev.people || [];
      var box = $('#ev-people');
      box.innerHTML = '';
      box.classList.toggle('one', people.length === 1);
      people.forEach(function (p) {
        var card = el('div', { 'class': 'ev-person' });
        card.appendChild(avatar(p));
        var body = el('div');
        body.appendChild(el('span', { 'class': 'role' }, ROLE_LABEL[p.role] || 'Speaker'));
        body.appendChild(el('h4', null, p.name));
        var org = [p.title, p.company].filter(Boolean).join(', ');
        if (org) body.appendChild(el('div', { 'class': 'org' }, org));
        if (p.bio) body.appendChild(el('p', { 'class': 'bio' }, p.bio));
        if (p.linkedin) { var a = el('a', { 'class': 'li', href: p.linkedin, target: '_blank', rel: 'noopener' }); a.appendChild(icon('linkedin')); a.appendChild(document.createTextNode('LinkedIn')); body.appendChild(a); }
        card.appendChild(body);
        box.appendChild(card);
      });
      var allHosts = people.length && people.every(function (p) { return p.role === 'host'; });
      $('#ev-people-label').textContent = people.length === 1 ? (allHosts ? 'Your host' : 'Your speaker') : allHosts ? 'Your hosts' : 'Speakers';
      show($('#ev-people-wrap'), people.length > 0);

      var ag = $('#ev-agenda');
      ag.innerHTML = '';
      (ev.agenda || []).forEach(function (a) {
        var li = el('li', a.at ? null : { 'class': 'no-time' });
        if (a.at) li.appendChild(el('span', { 'class': 'at' }, a.at));
        li.appendChild(el('span', { 'class': 'item' }, a.item));
        ag.appendChild(li);
      });
      show($('#ev-agenda-wrap'), (ev.agenda || []).length > 0);

      var v = ev.venue;
      if (v && (v.name || v.address)) {
        var vb = $('#ev-venue');
        vb.innerHTML = '';
        var main = el('div', { 'class': 'v-main' });
        main.appendChild(el('h3', null, v.name || v.address));
        main.appendChild(el('p', { 'class': 'addr' }, [v.name ? v.address : '', v.city, v.room].filter(Boolean).join(' · ')));
        var mb = el('a', { 'class': 'btn btn-ghost btn-sm', href: mapsUrl(v), target: '_blank', rel: 'noopener' }, 'Open in Maps');
        main.appendChild(mb);
        vb.appendChild(main);
        var side = el('div', { 'class': 'v-side' });
        var doors = ev.inPerson && ev.inPerson.doorsMin ? 'Doors open ' + timeIn(new Date(Date.parse(ev.start) - ev.inPerson.doorsMin * 60000).toISOString(), ev.timezone) + ', ' + ev.inPerson.doorsMin + ' minutes before the start.' : '';
        [['Arriving', [doors, v.arrival].filter(Boolean).join(' ')], ['Accessibility', v.accessibility]].forEach(function (x) {
          if (!x[1]) return;
          var p = el('p');
          p.appendChild(el('span', { 'class': 'lbl' }, x[0]));
          p.appendChild(document.createTextNode(x[1]));
          side.appendChild(p);
        });
        if (side.firstChild) vb.appendChild(side);
        show($('#ev-venue-wrap'), true);
      }
      if (ev.whoFor) { $('#ev-who').textContent = ev.whoFor; show($('#ev-who-wrap'), true); }
      renderFaq();
      renderBottom();
      renderShare();
    }
    function renderFaq() {
      var qs = [];
      var ip = ev.format !== 'online';
      qs.push(['Is it free?', 'Yes. Register with your name and email, confirm the email we send, and your calendar invite arrives with your personal link.']);
      if (ev.format !== 'in_person') qs.push(['How do I join online?', 'Open the link in your calendar invite a few minutes early. The stream plays in your browser on privacypal.ai: no download, no camera, no microphone.' + (ev.chat ? ' Ask questions in the live chat.' : '')]);
      if (ip && ev.venue) qs.push(['Where is it, and when should I arrive?', venueText(ev.venue) + (ev.venue.room ? ', ' + ev.venue.room : '') + '.' + (ev.inPerson && ev.inPerson.doorsMin ? ' Doors open ' + ev.inPerson.doorsMin + ' minutes before the start.' : '')]);
      if (ip && ev.inPerson) {
        if (ev.inPerson.mode === 'approval') qs.push(['How are seats in the room confirmed?', 'The organizers confirm each seat. Ask for one when you register; you hear from us as soon as it is confirmed, with your calendar invite.' + (ev.format === 'hybrid' ? ' Pick in person and online to get the stream link straight away as well.' : '')]);
        else if (ev.inPerson.capacity) qs.push(['What if the room is full?', 'You join the waitlist. When a seat opens up, the next person on the list gets it automatically, with a confirmation and a calendar invite.' + (ev.format === 'hybrid' ? ' The event is streamed too, so you can always join online.' : '')]);
        if (ev.inPerson.guestsMax) qs.push(['Can I bring someone?', 'Yes, up to ' + ev.inPerson.guestsMax + (ev.inPerson.guestsMax > 1 ? ' guests' : ' guest') + '. Add them when you register so we hold a seat for each.']);
      }
      if (ev.format !== 'in_person' && ev.replayAccess !== 'none') qs.push(['Will there be a recording?', ev.replayAccess === 'public' ? 'Yes. The recording goes up on this page after the event.' : 'Yes. Everyone who registers gets the recording after the event, in their follow-up email and their live room.']);
      qs.push(['What if I can’t make it?', 'Cancel from any of our emails and the event leaves your calendar.' + (ip && ev.inPerson && ev.inPerson.capacity ? ' Your seat goes to the next person on the waitlist.' : '')]);
      var box = $('#ev-faq');
      box.innerHTML = '';
      qs.forEach(function (q) { var d = el('details'); d.appendChild(el('summary', null, q[0])); d.appendChild(el('p', null, q[1])); box.appendChild(d); });
    }
    function renderBottom() {
      var biz = ev.audience !== 'consumer';
      $('#ev-bottom-title').textContent = biz ? 'Govern every AI at work, and keep your team moving.' : 'Their world is full of AI. You hold the keys.';
      $('#ev-bottom-text').textContent = biz
        ? 'Personal is included free with every download of PrivacyPal. When the whole company needs covering, the Max pack adds agents and copilots, admin and one policy across every seat.'
        : 'With the Family pack you choose the AI your kids use, keep their real identity away from AI providers, and see how AI shows up in their day.';
      var sec = $('#ev-bottom-secondary');
      if (ev.cta && ev.cta.url) {
        sec.textContent = ev.cta.label;
        sec.href = ev.cta.url;
        sec.removeAttribute('data-cta');
        if (/^https:\/\/(www\.)?privacypal\.ai\//.test(ev.cta.url)) sec.removeAttribute('target'); else { sec.target = '_blank'; sec.rel = 'noopener'; }
      }
    }
    function renderShare() {
      var url = canonical;
      var li = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(tracked(url, 'linkedin', 'social', 'share'));
      var x = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(ev.title) + '&url=' + encodeURIComponent(tracked(url, 'x', 'social', 'share'));
      var mail = 'mailto:?subject=' + encodeURIComponent(ev.title) + '&body=' + encodeURIComponent((ev.subtitle ? ev.subtitle + '\n\n' : '') + fmt(ev.start, ev.timezone, { weekday: 'long', month: 'long', day: 'numeric' }) + ', ' + timeIn(ev.start, ev.timezone) + '\n\n' + tracked(url, 'email', 'share', 'forward'));
      $('#ev-share-li').href = li;
      $('#ev-share-x').href = x;
      $('#ev-share-mail').href = mail;
      var copy = function () {
        var link = tracked(url, 'link', 'share', 'copy');
        var done = function () { show($('#ev-copied'), true); setTimeout(function () { show($('#ev-copied'), false); }, 2200); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { window.prompt('Copy this link', link); });
        else window.prompt('Copy this link', link);
        track('share', { method: 'copy', content_type: 'event', item_id: ev.id });
      };
      $('#ev-share-copy').onclick = copy;
      $('#ev-share').onclick = function () {
        if (navigator.share) navigator.share({ title: ev.title, text: ev.subtitle || ev.title, url: tracked(url, 'device', 'share', 'native') }).catch(function () { /* dismissed */ });
        else copy();
      };
    }

    /* ---- state: badge, countdown, call to action, the card ---- */
    function renderState() {
      var st = stateOf();
      lastState = st;
      var badge = $('#ev-badge');
      var onDemand = st === 'ended' && ev.onDemandOpen;
      badge.textContent = st === 'live' ? 'Live now' : st === 'cancelled' ? 'Cancelled' : onDemand ? 'On demand' : st === 'ended' ? 'Ended' : formatLabel(ev.format);
      badge.className = 'wb-badge' + (st === 'live' ? ' live' : '');
      var cta = $('#ev-cta');
      var open = ev.registrationOpen && !preview;
      show(cta, ev.registrationOpen || preview);
      cta.textContent = st === 'live' ? 'Register and join now' : onDemand ? 'Watch the recording' : (ev.attendOptions || []).length === 1 && ev.attendOptions[0] === 'in_person' && ev.inPerson && ev.inPerson.mode === 'approval' ? 'Request a seat' : 'Register free';
      var bp = $('#ev-bottom-primary');
      show(bp, ev.registrationOpen);
      bp.textContent = cta.textContent;
      // the public recording plays on the page itself
      if (st === 'ended' && ev.publicReplay) {
        var rp = $('#ev-replay');
        if (!rp.firstChild) rp.appendChild(el('iframe', { src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(ev.publicReplay) + '?rel=0&modestbranding=1&playsinline=1', title: ev.title, allow: 'encrypted-media; picture-in-picture; fullscreen', allowfullscreen: '' }));
        show($('#ev-replay-wrap'), true);
      }
      if (!ev.registrationOpen) {
        show(form, false);
        var c = $('#ev-closed');
        var t = $('#ev-closed-title');
        var p = $('#ev-closed-text');
        var a = $('#ev-closed-cta');
        show(a, false);
        if (st === 'cancelled') { t.textContent = 'This event was canceled'; p.textContent = 'We are sorry for the change of plans. Everyone who registered has been told.'; }
        else if (st === 'ended' && ev.publicReplay) { t.textContent = 'Watch the recording'; p.textContent = 'The full session is on this page. Press play on the recording.'; }
        else if (st === 'ended') { t.textContent = 'This event has ended'; p.textContent = 'Thank you to everyone who joined us.'; }
        else { t.textContent = 'Registration is closed'; p.textContent = 'Registration for this event has closed. Already registered? Your personal link is in your calendar invite.'; }
        if (ev.cta && ev.cta.url) { a.textContent = ev.cta.label; a.href = ev.cta.url; show(a, true); }
        show(c, true);
      } else {
        show($('#ev-closed'), false);
        if (!$('#ev-inbox').hidden) return;
        show(form, true);
        $('#ev-card-title').textContent = onDemand ? 'Get the recording' : st === 'live' ? 'Join now, free' : 'Register free';
        $('#ev-card-sub').textContent = onDemand ? 'Confirm your email and the recording is yours, straight away.' : 'Confirm your email and your calendar invite follows straight after.';
        renderAttend();
      }
      if (preview) { $('#ev-submit').disabled = true; $('#ev-submit').textContent = 'Registration is off in preview'; }
    }
    function countdown() {
      var box = $('#ev-countdown');
      var st = stateOf();
      if (st !== lastState) { renderState(); }
      if (st === 'upcoming') {
        var ms = Date.parse(ev.start) - Date.now();
        var s = Math.max(0, Math.floor(ms / 1000));
        var d = Math.floor(s / 86400); s -= d * 86400;
        var h = Math.floor(s / 3600); s -= h * 3600;
        var m = Math.floor(s / 60); s -= m * 60;
        var c = $('#ev-count');
        c.innerHTML = '';
        [[d, d === 1 ? 'day' : 'days'], [h, 'hrs'], [m, 'min'], [s, 'sec']].forEach(function (x, i) {
          if (i === 0 && !d) return;
          var sp = el('span');
          sp.appendChild(el('b', null, i ? pad(x[0]) : String(x[0])));
          sp.appendChild(el('small', null, x[1]));
          c.appendChild(sp);
        });
        $('#ev-count-lbl').textContent = 'Starts in';
        box.classList.remove('live');
        show(box, true);
      } else if (st === 'live') {
        $('#ev-count-lbl').textContent = 'Live now';
        $('#ev-count').textContent = '';
        $('#ev-count').appendChild(el('span', null, 'Started ' + timeIn(ev.start, VIEWER_TZ)));
        box.classList.add('live');
        show(box, true);
      } else show(box, false);
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    /* ---- the registration card ---- */
    function attendCopy(a) {
      var v = ev.venue || {};
      if (a === 'online') return { t: 'Online', s: ev.onDemandOpen ? 'The recording, whenever suits you' : 'Watch live on privacypal.ai' };
      if (a === 'in_person') return { t: 'In person', s: [v.name, v.city].filter(Boolean).join(', ') };
      return { t: 'In person, and online', s: 'Your seat in the room, plus the stream link if plans change' };
    }
    function seatTag(a) {
      if (a === 'online' || !ev.inPerson) return null;
      if (ev.inPerson.mode === 'approval') return el('span', { 'class': 'seats' }, 'By approval');
      if (ev.seatsLeft === null || ev.seatsLeft === undefined) return null;
      if (ev.seatsLeft <= 0) return el('span', { 'class': 'seats full' }, 'Waitlist');
      return ev.seatsLeft <= 25 ? el('span', { 'class': 'seats' }, ev.seatsLeft + (ev.seatsLeft === 1 ? ' seat left' : ' seats left')) : null;
    }
    function renderAttend() {
      var opts = ev.attendOptions || [];
      var box = $('#ev-attend-opts');
      // one way to join needs no choice; a hybrid event asks
      if (opts.indexOf(attend) < 0) attend = opts.length === 1 ? opts[0] : '';
      show($('#ev-attend'), opts.length > 1);
      show($('#ev-step-details'), opts.length > 1);
      box.innerHTML = '';
      opts.forEach(function (a) {
        var c = attendCopy(a);
        var lab = el('label', { 'class': 'ev-opt' + (a === attend ? ' on' : '') });
        var r = el('input', { type: 'radio', name: 'attend', value: a });
        r.checked = a === attend;
        r.addEventListener('change', function () { attend = a; renderAttend(); });
        lab.appendChild(r);
        var txt = el('span');
        txt.appendChild(el('b', null, c.t));
        if (c.s) txt.appendChild(el('small', null, c.s));
        lab.appendChild(txt);
        var tag = seatTag(a);
        lab.appendChild(tag || el('span'));
        box.appendChild(lab);
      });
      renderFields();
    }
    function renderFields() {
      var box = $('#ev-fields');
      var keep = {};
      $$('input,textarea,select', box).forEach(function (n) { keep[n.name] = n.value; });
      box.innerHTML = '';
      // before a choice, the shorter online set; the in-person questions appear when someone picks the room
      var opts0 = ev.attendOptions || [];
      var a = attend || (opts0.indexOf('online') >= 0 ? 'online' : opts0[0] || 'online');
      $('#ev-email-label').textContent = ev.audience === 'consumer' ? 'Email' : 'Work email';
      var pair = null;
      Object.keys(EV_FIELDS).forEach(function (k) {
        var lv = level(k, a);
        if (lv === 'off') return;
        var f = EV_FIELDS[k];
        var wrap = el('div');
        var lab = el('label', { 'for': 'ev-f-' + k }, f.label);
        if (lv === 'optional') { lab.appendChild(document.createTextNode(' ')); lab.appendChild(el('span', { 'class': 'opt' }, '(optional)')); }
        wrap.appendChild(lab);
        var input = f.type === 'textarea' ? el('textarea', { id: 'ev-f-' + k, name: k, maxlength: String(f.max) }) : el('input', { id: 'ev-f-' + k, name: k, type: f.type, maxlength: String(f.max), autocomplete: f.ac || 'off' });
        if (f.ph) input.setAttribute('placeholder', f.ph);
        if (lv === 'required') input.required = true;
        if (keep[k]) input.value = keep[k];
        wrap.appendChild(input);
        // company and job title sit side by side
        if (k === 'company' || k === 'job_title') {
          if (!pair) { pair = el('div', { 'class': 'row' }); box.appendChild(pair); }
          pair.appendChild(wrap);
        } else box.appendChild(wrap);
      });
      var gmax = ev.inPerson ? ev.inPerson.guestsMax : 0;
      var gw = $('#ev-guests-wrap');
      var sel = $('#ev-guests');
      if (a !== 'online' && gmax > 0) {
        var cur = sel.value || '0';
        sel.innerHTML = '';
        for (var i = 0; i <= gmax; i++) sel.appendChild(el('option', { value: String(i) }, i === 0 ? 'Just me' : 'Me and ' + i + (i > 1 ? ' guests' : ' guest')));
        sel.value = cur;
        show(gw, true);
      } else { sel.innerHTML = ''; show(gw, false); }
      show($('#ev-marketing-wrap'), ev.marketing !== false);
      show($('#ev-photo-note'), a !== 'online' && !!(ev.inPerson && ev.inPerson.photoNotice));
      var btn = $('#ev-submit');
      btn.disabled = preview || !attend;
      if (!preview) btn.textContent = !attend ? 'Choose how you will join' : stateOf() === 'live' && a !== 'in_person' ? 'Register and join now' : ev.onDemandOpen ? 'Send me the recording' : a !== 'online' && ev.inPerson && ev.inPerson.mode === 'approval' ? 'Request my seat' : 'Register free';
    }

    var MESSAGES = {
      email: 'Check your email address.',
      first_name: 'Add your first name, letters only.',
      attend: 'Choose how you will join.',
      attend_closed: 'In-person registration has closed. You can still join online.',
      not_found: 'This event could not be found. Reload the page and try again.',
      closed: 'Registration for this event has closed.',
      rate_limited: 'Too many sign-ups from this network in a short time. Wait a few minutes and try again.',
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (preview) return;
      err.classList.remove('on');
      if (!attend) { err.textContent = MESSAGES.attend; err.classList.add('on'); return; }
      if (!form.reportValidity()) return;
      var btn = $('#ev-submit');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Saving your seat…';
      var data = { s: ev.id, attend: attend, tz: VIEWER_TZ, _e: String(Date.now() - started) };
      new FormData(form).forEach(function (v, k) { if (k !== 'attend') data[k] = v; });
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { var v = param(k); if (v) data[k] = v; });
      var ref = param('ref') || (window.PPReferral && window.PPReferral.get && window.PPReferral.get()) || '';
      if (ref) data.ref = ref;
      postForm(API + '/webinar-register', data).then(function (res) {
        if (res && res.ok && res.check && res.session) {
          inbox(res, data.email || '');
          track('sign_up', { method: 'event', event_id: ev.id, attend: attend, check: res.check, format: ev.format, audience: ev.audience });
          pixel('CompleteRegistration', { content_name: ev.title, content_category: 'event' });
          return;
        }
        if (res && res.error === 'required' && res.field) {
          var f = EV_FIELDS[res.field];
          var n = $('#ev-f-' + res.field);
          if (n) n.focus();
          throw new Error('Add your ' + (f ? f.label.toLowerCase() : res.field.replace(/_/g, ' ')) + (res.field === 'linkedin' ? ' (a linkedin.com link).' : res.field === 'phone' ? ' (digits, with the country code if outside the US).' : '.'));
        }
        if (res && res.error === 'attend_closed' && res.options) { ev.attendOptions = res.options; attend = ''; renderAttend(); }
        throw new Error(MESSAGES[(res && res.error) || ''] || 'Something went wrong on our side. Try again in a minute, or email hi@privacypal.ai and we will add you by hand.');
      }).catch(function (ex) {
        err.textContent = ex && ex.message && !/^(Failed to fetch|NetworkError|Load failed|The user aborted)/.test(ex.message) ? ex.message : 'Something went wrong on our side. Try again in a minute, or email hi@privacypal.ai and we will add you by hand.';
        err.classList.add('on');
        btn.disabled = false;
        btn.textContent = label;
      });
    });
    function inbox(res, email) {
      show(form, false);
      var box = $('#ev-inbox');
      show(box, true);
      if (box.getBoundingClientRect().top < 80) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var t = $('#ev-inbox-text');
      t.textContent = '';
      var to = email ? el('b', null, email) : null;
      if (res.check === 'invite') {
        $('#ev-inbox-title').textContent = 'You’re already registered';
        t.appendChild(document.createTextNode('This email already has a seat at this event. We sent your calendar invite again' + (to ? ' to ' : '')));
        if (to) t.appendChild(to);
        t.appendChild(document.createTextNode('.'));
      } else {
        $('#ev-inbox-title').textContent = 'Check your inbox';
        t.appendChild(document.createTextNode(res.emailSent === false ? 'Your confirmation email is running a little late and arrives within a few minutes' : 'We sent a confirmation email'));
        if (to) { t.appendChild(document.createTextNode(' to ')); t.appendChild(to); }
        t.appendChild(document.createTextNode('. Press '));
        t.appendChild(el('b', null, 'Confirm my seat'));
        t.appendChild(document.createTextNode(attend !== 'online' && ev.inPerson
          ? (ev.inPerson.mode === 'approval' ? ' in it, and your request for a seat in the room goes to the organizers.' : ' in it to claim your seat in the room. Seats go in the order people confirm.')
          : ' in it and your calendar invite with your personal link follows straight after.'));
      }
      var when = $('#ev-inbox-when');
      when.textContent = fmt(ev.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeIn(ev.start, VIEWER_TZ);
      show(when, true);
    }
    $('#ev-inbox-retry').addEventListener('click', function () {
      show($('#ev-inbox'), false);
      show(form, true);
      renderAttend();
      var em = $('#ev-email');
      if (em) { em.value = ''; em.focus(); }
    });

    function render(data) {
      ev = data;
      root.classList.remove('loading');
      renderHero();
      renderFacts();
      renderContent();
      renderState();
      countdown();
      clearInterval(tick);
      tick = setInterval(countdown, 1000);
      var chk = param('check');
      if (chk === 'verify' || chk === 'invite') inbox({ check: chk }, '');
    }

    if (!id || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(id)) { missing(); return; }
    if (preview) {
      // the Studio (webinar.privacypal.ai) saved the preview on the server under a random id;
      // a moment's retry covers a preview opened before its save has settled
      var getPreview = function (tries) {
        return postForm(API + '/webinar-admin', { a: 'preview_get', d: JSON.stringify({ id: previewId }) }).then(function (j) {
          if (j && j.ok && j.event && j.event.id === id) { show($('#ev-preview'), true); render(j.event); return; }
          if (tries > 0) return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return getPreview(tries - 1); });
          missing('Nothing to preview', 'A preview link lasts two hours. Open the preview again from the Studio.');
        });
      };
      getPreview(2).catch(function () { missing('The preview is not loading', 'Check your connection and open the preview again from the Studio.'); });
      return;
    }
    catalog('e=' + encodeURIComponent(id)).then(function (cat) {
      if (!cat || !cat.ok) throw new Error('unavailable');
      if (!cat.event) { missing(); return; }
      render(cat.event);
    }).catch(function () {
      missing('This event is not loading', 'Check your connection and reload the page. If it keeps happening, email hi@privacypal.ai and we will register you by hand.');
    });
  }

  if (PAGE === 'hub') hub();
  else if (PAGE === 'event') eventPage();
  else if (PAGE === 'series') series();
  else if (PAGE === 'watch') watch();
  else if (PAGE === 'cancel') cancel();
  else if (PAGE === 'verify') verify();
})();
