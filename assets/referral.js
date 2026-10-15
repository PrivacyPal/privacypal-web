/* PrivacyPal referral attribution (affiliate / partner / reseller codes).

   A creator, reseller or affiliate partner gets a unique code and shares a link:

     https://privacypal.ai/family/founding/?ref=CREATOR-SMITH
     https://privacypal.ai/family/?ref=CREATOR-SMITH
     https://privacypal.ai/?ref=CREATOR-SMITH

   This file does three things and nothing else:

     1. CAPTURE. Reads ?ref= (with ?partner= and ?aff= as aliases) from the
        current URL and writes the normalized code to localStorage under
        pp_ref with a timestamp. Last touch wins: a new code replaces a stored
        one, an absent code never clears one. The window is 90 days, the usual
        affiliate cookie window, after which a stored code is ignored.

     2. FORWARD. Rewrites outbound links so the code survives every hop to the
        signup wizard: links to the Founding Families offer page inside this
        site, and links to family.privacypal.ai (the Family portal, where
        /signup reads it). The rewrite happens on click, in the capture phase,
        so it works regardless of when a link appeared: v3.js injects the whole
        corporate header and footer after parse, and those links are decorated
        the same as the static ones.

     3. EXPOSE. window.PPReferral for pages that build their own CTA hrefs, the
        Founding Families landing page in particular.

   A referral code is ATTRIBUTION ONLY. It never touches price. The promo code
   (?promo=) is the Stripe coupon and is a separate field end to end: a partner
   may hand out both, and the portal stores and reports them separately.

   The normalization rule here is the same rule family-portal applies in
   web/src/lib/referral.js and family-api applies on the way into the database:
   trim, upper case, at most 64 characters, only A-Z 0-9 _ and -. Anything else
   is treated as no code at all, so a junk or injected value never leaves here. */
(function(){
  'use strict';

  /* Query keys that may carry a code. The first one that normalizes wins. */
  var PARAMS = ['ref', 'partner', 'aff'];
  var STORAGE_KEY = 'pp_ref';
  var PATTERN = /^[A-Z0-9_-]{1,64}$/;
  var WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

  /* Where a code is still worth carrying. Everything else is left alone. */
  var OFFER_PATH = /family\/founding(\/|\/index\.html)?$/i;
  var PORTAL_HOST = /(^|\.)family\.privacypal\.ai$/i;

  function normalize(raw){
    if (typeof raw !== 'string') return '';
    var code = raw.trim().toUpperCase();
    if (!code || code.length > 64) return '';
    return PATTERN.test(code) ? code : '';
  }

  function fromSearch(search){
    var params;
    try { params = new URLSearchParams(search || ''); } catch (e) { return ''; }
    for (var i = 0; i < PARAMS.length; i++){
      var code = normalize(params.get(PARAMS[i]));
      if (code) return code;
    }
    return '';
  }

  /* localStorage throws on the accessor itself in some privacy modes, so every
     read and write is guarded and failure degrades to "no stored code". */
  function store(code){
    if (!code) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: code, ts: Date.now() }));
    } catch (e) { /* private mode or a full quota: the URL still carries it */ }
  }

  function stored(){
    var raw;
    try { raw = window.localStorage.getItem(STORAGE_KEY); } catch (e) { return ''; }
    if (!raw) return '';
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return ''; }
    if (!parsed || typeof parsed !== 'object') return '';
    var ts = Number(parsed.ts);
    if (!isFinite(ts) || (Date.now() - ts) > WINDOW_MS) return '';
    return normalize(parsed.code);
  }

  function clear(){
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nothing to clear */ }
  }

  /* The code in play: this URL first, then the stored one. */
  var arrived = fromSearch(window.location.search);
  if (arrived) store(arrived);

  function current(){
    return arrived || stored();
  }

  /* True for a URL where the signup wizard will eventually read the code. */
  function carries(url){
    if (!url) return false;
    try {
      var u = new URL(url, window.location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
      if (PORTAL_HOST.test(u.hostname)) return true;
      return u.hostname === window.location.hostname && OFFER_PATH.test(u.pathname.replace(/\/+$/, '/'));
    } catch (e) {
      return false;
    }
  }

  /* Add ref= to a URL, leaving an existing ref and every other param alone. */
  function decorate(url){
    var code = current();
    if (!code || !url) return url;
    try {
      var u = new URL(url, window.location.href);
      if (!carries(u.href)) return url;
      if (normalize(u.searchParams.get('ref'))) return u.href;
      u.searchParams.set('ref', code);
      return u.href;
    } catch (e) {
      return url;
    }
  }

  /* Decorate every matching anchor currently in the document. Cheap and
     idempotent, so it is safe to call again after chrome is injected. */
  function decorateAll(root){
    var scope = root || document;
    if (!scope.querySelectorAll) return;
    var links = scope.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++){
      var href = links[i].getAttribute('href');
      if (!carries(href)) continue;
      var next = decorate(href);
      if (next && next !== href) links[i].setAttribute('href', next);
    }
  }

  /* The belt to decorateAll's braces: rewrite at click time, in the capture
     phase, so a link injected by v3.js after this file ran still carries the
     code even though it was never touched by the pass above. */
  document.addEventListener('click', function(ev){
    if (!current()) return;
    var el = ev.target;
    while (el && el !== document && el.tagName !== 'A') el = el.parentNode;
    if (!el || el.tagName !== 'A') return;
    var href = el.getAttribute('href');
    if (!carries(href)) return;
    var next = decorate(href);
    if (next && next !== href) el.setAttribute('href', next);
  }, true);

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ decorateAll(); });
  } else {
    decorateAll();
  }

  window.PPReferral = {
    /** The code in play, '' when there is none. */
    get: current,
    /** Normalize a candidate the same way every layer does. '' when invalid. */
    normalize: normalize,
    /** The code on a query string, normalized. '' when there is none. */
    fromSearch: fromSearch,
    /** Add ref= to a URL that leads to signup. Other URLs come back untouched. */
    decorate: decorate,
    /** Re-run the link pass, for pages that inject their own CTAs. */
    decorateAll: decorateAll,
    /** True when a code is still worth carrying to this URL. */
    carries: carries,
    /** Forget the stored code. Used by tests, not by any page. */
    clear: clear,
    PARAMS: PARAMS,
    STORAGE_KEY: STORAGE_KEY,
    WINDOW_MS: WINDOW_MS
  };
})();
