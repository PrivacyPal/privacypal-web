/* PrivacyPal Webinars: page logic for /webinars/ (landing + registration),
   /webinars/watch.html (live room) and /webinars/cancel.html.

   Everything dynamic comes from n8n at automate.privacypal.ai (source:
   PrivacyPal-GTM-System/WEBINARS). The webinar list lives in the
   "PrivacyPal Webinars" Google Sheet; this file never sees a YouTube link
   except through /webinar-join for a registered token.

     GET  /webhook/webinars?w=<id>              public catalog
     POST /webhook/webinar-register              form-encoded registration
     GET  /webhook/webinar-join?w=<id>&r=<tok>   stream id for a registered token
     POST /webhook/webinar-cancel                r=<token>

   API data is rendered with textContent only. */
(function () {
  'use strict';

  var API = 'https://automate.privacypal.ai/webhook';
  var PAGE = document.body.getAttribute('data-wb');
  var VIEWER_TZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })();

  /* ------------------------------------------------------------ helpers */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function param(name) { try { return new URLSearchParams(location.search).get(name) || ''; } catch (e) { return ''; } }
  function show(node, on) { if (node) node.hidden = !on; }

  function getJSON(url, timeoutMs) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 15000) : null;
    return fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'bad_response' }; }).then(function (j) { j._status = r.status; return j; }); })
      .finally(function () { if (t) clearTimeout(t); });
  }
  function postForm(url, data, timeoutMs) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 45000) : null;
    // form-encoded keeps this a CORS "simple request": no preflight
    return fetch(url, { method: 'POST', body: new URLSearchParams(data), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'bad_response' }; }).then(function (j) { j._status = r.status; return j; }); })
      .finally(function () { if (t) clearTimeout(t); });
  }

  function fmt(iso, tz, opts) {
    var o = Object.assign({}, opts);
    if (tz) o.timeZone = tz;
    try { return new Intl.DateTimeFormat('en-US', o).format(new Date(iso)); } catch (e) { delete o.timeZone; return new Intl.DateTimeFormat('en-US', o).format(new Date(iso)); }
  }
  function whenLine(w) {
    var local = fmt(w.start, VIEWER_TZ, { weekday: 'long', month: 'long', day: 'numeric' });
    var time = fmt(w.start, VIEWER_TZ, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    var host = fmt(w.start, w.timezone, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    return { day: local, time: time, host: host === time ? '' : host };
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
  function liveState(w) {
    var now = Date.now();
    if (w.status === 'cancelled') return 'cancelled';
    if (now < Date.parse(w.start)) return 'upcoming';
    if (now < Date.parse(w.end)) return 'live';
    return 'ended';
  }
  function track(name, params) {
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) { /* analytics never blocks */ }
  }
  function pixel(name, params) {
    try { if (window.fbq) window.fbq('track', name, params || {}); } catch (e) { /* analytics never blocks */ }
  }

  /* --------------------------------------------- add-to-calendar fallbacks */
  function icsDate(iso) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function calendarLinks(w, token, watchUrl) {
    var details = (w.subtitle ? w.subtitle + '\n\n' : '') + 'Join here at start time: ' + watchUrl;
    var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(w.title) +
      '&dates=' + icsDate(w.start) + '/' + icsDate(w.end) +
      '&details=' + encodeURIComponent(details) +
      '&location=' + encodeURIComponent(watchUrl);
    var o = 'https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent' +
      '&subject=' + encodeURIComponent(w.title) +
      '&startdt=' + encodeURIComponent(new Date(w.start).toISOString()) +
      '&enddt=' + encodeURIComponent(new Date(w.end).toISOString()) +
      '&body=' + encodeURIComponent(details) +
      '&location=' + encodeURIComponent(watchUrl);
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

  /* ================================================================ LANDING */
  function landing() {
    var id = param('w').toLowerCase();
    var root = $('#wb-root');
    var form = $('#wb-form');
    var err = $('#wb-error');
    var started = Date.now();

    function renderEmpty(kind, w) {
      show($('#wb-main'), false);
      var box = $('#wb-empty');
      show(box, true);
      var copy = {
        none: ['Webinars', 'No live session is scheduled right now', 'New sessions are announced here first. Check back soon.'],
        not_found: ['Webinars', 'We could not find that session', 'The link may be mistyped or the session may have been removed.'],
        ended: ['Session ended', w ? w.title : 'This session has ended', 'Registered guests get the replay by email once it is ready.'],
        cancelled: ['Session cancelled', w ? w.title : 'This session was cancelled', 'Registered guests have been told by email. We will announce any new date on the site.'],
        closed: ['Registration closed', w ? w.title : 'Registration is closed', 'This session is full or registration has closed. Registered guests keep their seats.'],
        error: ['Webinars', 'Registration is not loading right now', 'Something went wrong on our side. Try again in a minute, or email hi@privacypal.ai and we will add you by hand.'],
      }[kind];
      $('.eyebrow', box).textContent = copy[0];
      $('h1', box).textContent = copy[1];
      $('.lede', box).textContent = copy[2];
    }

    function renderWebinar(w, others) {
      show($('#wb-empty'), false);
      show($('#wb-main'), true);
      document.title = w.title + ' · PrivacyPal';
      var state = liveState(w);
      $('#wb-badge').textContent = state === 'live' ? 'Live now' : 'Live webinar';
      $('#wb-badge').className = 'wb-badge' + (state === 'live' ? ' live' : '');
      $('#wb-title').textContent = w.title;
      $('#wb-lede').textContent = w.subtitle || w.summary || '';
      var wl = whenLine(w);
      $('#wb-month').textContent = fmt(w.start, VIEWER_TZ, { month: 'short' });
      $('#wb-day').textContent = fmt(w.start, VIEWER_TZ, { day: 'numeric' });
      $('#wb-when-day').textContent = wl.day;
      $('#wb-when-time').textContent = wl.time + (wl.host ? ' (' + wl.host + ')' : '') + ' \u00b7 ' + w.durationMin + ' min \u00b7 Online';
      var hosts = $('#wb-hosts');
      hosts.innerHTML = '';
      if (w.hosts && w.hosts.length) {
        hosts.appendChild(el('span', { 'class': 'lbl' }, w.hosts.length > 1 ? 'Hosts' : 'Host'));
        w.hosts.forEach(function (h) { hosts.appendChild(el('div', null, h)); });
      }
      show(hosts, !!(w.hosts && w.hosts.length));
      if (w.summary && w.subtitle) { $('#wb-summary').textContent = w.summary; show($('#wb-summary-wrap'), true); }
      var learn = $('#wb-learn');
      learn.innerHTML = '';
      (w.learn || []).forEach(function (l) { learn.appendChild(el('li', null, l)); });
      show($('#wb-learn-section'), !!(w.learn && w.learn.length));
      if (w.image) { var img = $('#wb-image'); img.src = w.image; img.alt = w.title; show($('#wb-image-wrap'), true); }
      $('#wb-w').value = w.id;
      var more = $('#wb-more');
      more.innerHTML = '';
      (others || []).forEach(function (o) {
        var a = el('a', { href: '?w=' + encodeURIComponent(o.id) });
        a.appendChild(el('span', { 'class': 'when' }, fmt(o.start, VIEWER_TZ, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })));
        a.appendChild(el('h4', null, o.title));
        more.appendChild(a);
      });
      show($('#wb-more-section'), !!(others && others.length));
      if (param('registered') === '1') doneState(w, null);
    }

    function doneState(w, res) {
      show(form, false);
      var done = $('#wb-done');
      show(done, true);
      if (res && done.getBoundingClientRect().top < 80) done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#wb-done-name').textContent = res && res.firstName ? res.firstName + ', you\u2019re in.' : 'You\u2019re in.';
      if (res && res.token) {
        var links = calendarLinks(w, res.token, res.watchUrl);
        $('#wb-cal-google').href = links.google;
        $('#wb-cal-outlook').href = links.outlook;
        var ics = $('#wb-cal-ics');
        ics.href = links.ics;
        ics.setAttribute('download', w.id + '.ics');
        $('#wb-room-link').href = res.watchUrl;
        show($('#wb-done-links'), true);
        $('#wb-done-mail').textContent = res.inviteSent === false
          ? 'Your seat is saved. Your calendar invite is running late; it will arrive within a few minutes. You can also add it yourself:'
          : 'Your calendar invite is on its way from ops@privacypal.ai. Accept it and your personal join link lands in your calendar. Not in your inbox? Check spam, or add it yourself:';
      } else {
        $('#wb-done-mail').textContent = 'Your calendar invite is on its way from ops@privacypal.ai. Accept it and your personal join link lands in your calendar.';
        show($('#wb-done-links'), false);
      }
    }

    var MESSAGES = {
      email: 'Check your email address.',
      first_name: 'Add your first name, letters only.',
      webinar: 'This session could not be found. Reload the page and try again.',
      not_found: 'This session could not be found. Reload the page and try again.',
      closed: 'Registration for this session has closed.',
      rate_limited: 'Too many sign-ups from this network in a short time. Wait a few minutes and try again.',
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.classList.remove('on');
      if (!form.reportValidity()) return;
      var btn = $('button[type=submit]', form);
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = 'Saving your seat\u2026';
      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) { data[k] = v; });
      delete data._html;
      data.tz = VIEWER_TZ;
      data._e = String(Date.now() - started);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { var v = param(k); if (v) data[k] = v; });
      var ref = param('ref') || (window.PPReferral && window.PPReferral.get && window.PPReferral.get()) || '';
      if (ref) data.ref = ref;
      postForm(API + '/webinar-register', data).then(function (res) {
        if (res && res.ok && res.token) {
          res.firstName = data.first_name;
          doneState(res.webinar || current, res);
          track('sign_up', { method: 'webinar', webinar_id: (res.webinar || current).id });
          pixel('CompleteRegistration', { content_name: (res.webinar || current).title });
          return;
        }
        if (res && res.ok) { doneState(current, null); return; }
        throw new Error((res && res.error) || 'unknown');
      }).catch(function (ex) {
        var key = ex && ex.message;
        err.textContent = MESSAGES[key] || 'Something went wrong on our side. Try again in a minute, or email hi@privacypal.ai and we will add you by hand.';
        err.classList.add('on');
        btn.disabled = false;
        btn.textContent = label;
      });
    });

    var current = null;
    getJSON(API + '/webinars' + (id ? '?w=' + encodeURIComponent(id) : '')).then(function (cat) {
      root.classList.remove('loading');
      if (!cat || !cat.ok) return renderEmpty('error');
      var listed = cat.webinars || [];
      var w = id ? cat.requested : listed[0];
      if (!w) return renderEmpty(id ? 'not_found' : 'none');
      current = w;
      var state = liveState(w);
      if (state === 'cancelled') return renderEmpty('cancelled', w);
      if (state === 'ended') return renderEmpty('ended', w);
      if (!w.registrationOpen) return renderEmpty('closed', w);
      renderWebinar(w, listed.filter(function (o) { return o.id !== w.id; }).slice(0, 3));
    }).catch(function () { root.classList.remove('loading'); renderEmpty('error'); });
  }

  /* ============================================================ LIVE ROOM */
  function watch() {
    var id = param('w').toLowerCase();
    var token = param('r');
    var stage = $('#wr-stage');
    var video = $('#wr-video');
    var chat = $('#wr-chat');
    var w = null;
    var ytId = null;
    var pollTimer = null;
    var tickTimer = null;
    var retried = false;

    function message(eyebrow, title, text, register) {
      show($('#wr-live'), false);
      var box = $('#wr-msg');
      show(box, true);
      $('.eyebrow', box).textContent = eyebrow;
      $('h1', box).textContent = title;
      $('.lede', box).textContent = text;
      var reg = $('#wr-msg-register');
      reg.href = './' + (id ? '?w=' + encodeURIComponent(id) : '');
      show(reg, !!register);
    }

    function waiting(text) {
      video.innerHTML = '';
      var wait = el('div', { 'class': 'wr-wait' });
      wait.appendChild(el('span', { 'class': 'eyebrow' }, 'Starts in'));
      wait.appendChild(el('div', { 'class': 'count', id: 'wr-count' }, relative(Date.parse(w.start) - Date.now())));
      wait.appendChild(el('p', null, text));
      video.appendChild(wait);
    }

    function embed() {
      if (video.getAttribute('data-yt') === ytId) return;
      video.innerHTML = '';
      video.setAttribute('data-yt', ytId);
      video.appendChild(el('iframe', {
        src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(ytId) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1',
        title: w.title, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: '',
      }));
      $('#wr-yt').href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(ytId);
      show($('#wr-yt'), true);
      var live = liveState(w) === 'live';
      // YouTube serves embedded live chat only to the domain named in embed_domain
      var chatOk = live && /(^|\.)privacypal\.ai$/.test(location.hostname);
      if (chatOk && !chat.firstChild) {
        chat.appendChild(el('iframe', { src: 'https://www.youtube.com/live_chat?v=' + encodeURIComponent(ytId) + '&embed_domain=' + encodeURIComponent(location.hostname), title: 'Live chat' }));
      }
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
      document.title = w.title + ' · Live room · PrivacyPal';
      if (state === 'ended') {
        clearInterval(tickTimer);
        video.innerHTML = '';
        var done = el('div', { 'class': 'wr-wait' });
        done.appendChild(el('span', { 'class': 'eyebrow' }, 'Session ended'));
        done.appendChild(el('div', { 'class': 'count' }, 'Thanks for joining'));
        done.appendChild(el('p', null, w.replay ? 'The replay is ready.' : 'We will email you the replay as soon as it is ready.'));
        if (w.replay) { var a = el('a', { 'class': 'btn btn-primary', href: w.replay, target: '_blank', rel: 'noopener' }, 'Watch the replay'); a.style.marginTop = '18px'; done.appendChild(a); }
        video.appendChild(done);
        stage.classList.remove('with-chat');
        show(chat, false);
        return;
      }
      if (ytId) embed();
      else waiting(state === 'live' ? 'We are about to start. This page connects to the stream on its own; keep it open.' : 'Keep this page open: the stream starts here on its own. You can also come back with the link in your calendar invite.');
    }

    function load() {
      return getJSON(API + '/webinar-join?w=' + encodeURIComponent(id) + '&r=' + encodeURIComponent(token)).then(function (res) {
        if (!res || (!res.ok && !res.webinar)) {
          if (res && res.error === 'not_found') return message('Live room', 'We could not find this session', 'The link may be incomplete. Open the join link from your calendar invite or email.', false);
          return message('Live room', 'The live room is not loading', 'Try again in a minute. If it keeps happening, the stream link is also in the email we send when we go live.', false);
        }
        if (!res.ok) {
          // a registration seconds old can be newer than the server's snapshot: retry once
          if (res.error === 'not_registered' && !retried && token) { retried = true; return new Promise(function (r) { setTimeout(r, 11000); }).then(load); }
          var t = res.webinar ? res.webinar.title : 'This session';
          if (res.error === 'cancelled') return message('Registration cancelled', t, 'This registration was cancelled. You can register again while the session is open.', true);
          if (res.error === 'webinar_cancelled') return message('Session cancelled', t, 'This session was cancelled. We will announce any new date on the site.', false);
          return message('Registered guests only', t, 'The live room opens with the personal link in your calendar invite. Not registered yet? It takes ten seconds.', true);
        }
        show($('#wr-msg'), false);
        show($('#wr-live'), true);
        w = res.webinar;
        w.replay = res.replay;
        ytId = res.youtubeId;
        render();
        schedule();
      }).catch(function () {
        message('Live room', 'The live room is not loading', 'Check your connection and reload. The stream link is also in the email we send when we go live.', false);
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
      // ask the server again only when something can still change: no stream id yet, or the session has ended (replay)
      if (!ytId && state !== 'ended') pollTimer = setTimeout(load, 90000);
      else if (state !== 'ended') pollTimer = setTimeout(load, Math.max(60000, Date.parse(w.end) - Date.now() + 5 * 60000));
    }

    if (!id || !token) {
      message('Registered guests only', 'This is the live room', 'It opens with the personal link in your calendar invite. Not registered yet? It takes ten seconds.', true);
      return;
    }
    track('webinar_join', { webinar_id: id });
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
          $('#wc-done-text').textContent = res.already
            ? 'This registration was already cancelled.'
            : 'You will get one last email that removes the event from your calendar.';
          var again = $('#wc-again');
          if (res.webinar && res.webinar.registrationOpen) { again.href = './?w=' + encodeURIComponent(res.webinar.id); show(again, true); }
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

  if (PAGE === 'landing') landing();
  else if (PAGE === 'watch') watch();
  else if (PAGE === 'cancel') cancel();
})();
