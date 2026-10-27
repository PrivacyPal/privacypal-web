/* PrivacyPal Webinars: page logic for the live demo pages.
     /webinars/                hub: both standing series and their next session
     /webinars/business/       PrivacyPal for Business live group demo (Tue + Thu, 12:00 ET)
     /webinars/family/         PrivacyPal Family live demo (Tue + Thu, 1:00 PM ET)
     /webinars/watch.html      live room, opened from each registrant's personal link
     /webinars/cancel.html     cancel a registration
   <body data-wb="hub|series|watch|cancel" data-series="business|family" data-wb-base="./|../">
   data-wb-base is the path from the page to the /webinars/ folder.

   Everything dynamic comes from n8n at automate.privacypal.ai (source:
   PrivacyPal-GTM-System/WEBINARS). Series schedules and dated sessions live in
   the "PrivacyPal Webinars" Google Sheet; this file never sees a YouTube link
   except through /webinar-join for a registered token.

     GET  /webhook/webinars[?series=&s=]         series with their upcoming sessions
     POST /webhook/webinar-register               form-encoded: s + details, or s + r (one-click rebook)
     GET  /webhook/webinar-join?s=<id>&r=<tok>    stream link for a registered token
     POST /webhook/webinar-cancel                 r=<token>

   API data is rendered with textContent only. */
(function () {
  'use strict';

  var API = 'https://automate.privacypal.ai/webhook';
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
  function calendarLinks(w, token, watchUrl) {
    var details = (w.subtitle ? w.subtitle + '\n\n' : '') + 'Join here at start time: ' + watchUrl;
    var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(w.title) +
      '&dates=' + icsDate(w.start) + '/' + icsDate(w.end) + '&details=' + encodeURIComponent(details) + '&location=' + encodeURIComponent(watchUrl);
    var o = 'https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent' +
      '&subject=' + encodeURIComponent(w.title) + '&startdt=' + encodeURIComponent(new Date(w.start).toISOString()) +
      '&enddt=' + encodeURIComponent(new Date(w.end).toISOString()) + '&body=' + encodeURIComponent(details) + '&location=' + encodeURIComponent(watchUrl);
    function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
    // same UID as the emailed invite, so a calendar that gets both keeps one event
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PrivacyPal//Webinars//EN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + w.id + '-' + token + '@webinars.privacypal.ai', 'DTSTAMP:' + icsDate(new Date().toISOString()),
      'DTSTART:' + icsDate(w.start), 'DTEND:' + icsDate(w.end), 'SUMMARY:' + esc(w.title),
      'DESCRIPTION:' + esc(details), 'LOCATION:' + esc(watchUrl), 'URL:' + watchUrl,
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
    var other = $('#wb-not-me');
    if (other) other.addEventListener('click', function () { setMode(false); select(selected ? selected.id : ''); });

    setMode(!!rebook);
    if (param('registered') === '1') { show(form, false); show($('#wb-done'), true); show($('#wb-cal-wrap'), false); show($('#wb-room-link'), false); $('#wb-done-mail').textContent = 'Your calendar invite is on its way from ops@privacypal.ai.'; }

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
      $$('[data-cta-series]').forEach(function (n) { show(n, n.getAttribute('data-cta-series') === seriesOf()); });
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
    function embed(ytId) {
      if (video.getAttribute('data-yt') === ytId) return;
      video.innerHTML = '';
      video.setAttribute('data-yt', ytId);
      video.appendChild(el('iframe', {
        src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(ytId) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1',
        title: w.title, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: '',
      }));
      $('#wr-yt').href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(ytId);
      show($('#wr-yt'), true);
      // YouTube serves embedded live chat only to the domain named in embed_domain
      var chatOk = liveState(w) === 'live' && /(^|\.)privacypal\.ai$/.test(location.hostname);
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
        var reg = sid ? seriesUrl(sid, r && r.next ? '?s=' + encodeURIComponent(r.next.id) : '') : BASE;
        if (!r || (!r.ok && !r.session)) {
          if (r && r.error === 'not_found') return message('Live room', 'We could not find this session', 'The link may be incomplete. Open the join link from your calendar invite or email.', 'See upcoming sessions', BASE);
          return message('Live room', 'The live room is not loading', 'Try again in a minute. The stream link is also in the email we send when we go live.', '', '');
        }
        w = r.session;
        if (!r.ok) {
          // a registration seconds old can be newer than the server's snapshot: retry once
          if (r.error === 'not_registered' && !retried && token) { retried = true; return new Promise(function (ok) { setTimeout(ok, 11000); }).then(load); }
          if (r.error === 'cancelled') return message('Registration cancelled', w.title, 'This registration was cancelled. ' + (nextLine() || ''), 'Pick another date', reg);
          if (r.error === 'session_cancelled') return message('Session cancelled', w.title, 'This session was cancelled. ' + (nextLine() || 'We run it every week.'), 'Save a seat at the next one', token ? seriesUrl(sid, '?r=' + encodeURIComponent(token)) : reg);
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
      btn.textContent = 'Cancelling\u2026';
      postForm(API + '/webinar-cancel', { r: token }).then(function (res) {
        show($('#wc-ask'), false);
        if (res && res.ok) {
          $('#wc-done-title').textContent = res.already ? 'Already cancelled' : 'Registration cancelled';
          var t = res.already ? 'This registration was already cancelled.' : 'You will get one last email that removes the session from your calendar.';
          if (res.next) t += ' The next session is ' + fmt(res.next.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeIn(res.next.start, VIEWER_TZ) + '.';
          $('#wc-done-text').textContent = t;
          var again = $('#wc-again');
          if (res.series) { again.href = seriesUrl(res.series, '?r=' + encodeURIComponent(token) + (res.next ? '&s=' + encodeURIComponent(res.next.id) : '')); show(again, true); }
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

  if (PAGE === 'hub') hub();
  else if (PAGE === 'series') series();
  else if (PAGE === 'watch') watch();
  else if (PAGE === 'cancel') cancel();
})();
