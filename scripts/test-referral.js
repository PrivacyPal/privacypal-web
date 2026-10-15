/**
 * assets/referral.js, exercised against a stub window.
 *
 *   node --test scripts/test-referral.js
 *   npm run test:referral
 *
 * The site has no bundler and no test framework, so the file under test is
 * evaluated in a vm with a hand-built window, document and localStorage. That
 * keeps the thing we ship (a plain IIFE in a <script> tag) the thing we test,
 * with no build step and no dependency to install.
 *
 * What matters here, in the order the code does it:
 *   capture    ?ref= / ?partner= / ?aff= become a stored code, junk does not
 *   window     a stored code older than 90 days is ignored
 *   last touch a new code replaces a stored one, no code never clears one
 *   forward    only offer-page and family.privacypal.ai links are decorated
 *   click      a link injected after load still carries the code
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'assets', 'referral.js'), 'utf8');

/** localStorage, including the modes where the accessor itself throws. */
function fakeStorage(seed = {}, { throwOnAccess = false } = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem(key) {
      if (throwOnAccess) throw new Error('storage blocked');
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      if (throwOnAccess) throw new Error('storage blocked');
      map.set(key, String(value));
    },
    removeItem(key) {
      if (throwOnAccess) throw new Error('storage blocked');
      map.delete(key);
    },
    _map: map
  };
}

/** The smallest anchor the code under test can work with. */
function anchor(href) {
  const attrs = new Map([['href', href]]);
  return {
    tagName: 'A',
    parentNode: null,
    getAttribute: (name) => (attrs.has(name) ? attrs.get(name) : null),
    setAttribute: (name, value) => attrs.set(name, String(value)),
    get href() {
      return attrs.get('href');
    }
  };
}

/**
 * Evaluate assets/referral.js with a stub window at `url`, and hand back the
 * resulting PPReferral plus the hooks a test needs to poke at it.
 */
function load({ url = 'https://privacypal.ai/family/founding/', storage = fakeStorage(), links = [], readyState = 'complete' } = {}) {
  const parsed = new URL(url);
  const listeners = [];
  const ready = [];

  const document = {
    readyState,
    head: { appendChild() {} },
    documentElement: { appendChild() {} },
    addEventListener(type, fn, capture) {
      if (type === 'DOMContentLoaded') ready.push(fn);
      else listeners.push({ type, fn, capture });
    },
    querySelectorAll(selector) {
      return selector === 'a[href]' ? links : [];
    },
    createElement: () => ({ set src(_v) {}, set async(_v) {} })
  };

  const window = {
    location: { href: parsed.href, search: parsed.search, hostname: parsed.hostname, pathname: parsed.pathname },
    localStorage: storage,
    document,
    URL,
    URLSearchParams
  };

  const sandbox = { window, document, URL, URLSearchParams, Date, JSON, Number, isFinite, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox);

  return {
    referral: window.PPReferral,
    storage,
    /** Fire a capture-phase click on `el`, the way a browser would. */
    click(el) {
      listeners
        .filter((l) => l.type === 'click')
        .forEach((l) => l.fn({ target: el }));
    },
    /** Run the DOMContentLoaded handlers, for the readyState:'loading' case. */
    domReady() {
      ready.forEach((fn) => fn());
    }
  };
}

const STORAGE_KEY = 'pp_ref';
const DAY = 24 * 60 * 60 * 1000;

function sealed(code, ts = Date.now()) {
  return fakeStorage({ [STORAGE_KEY]: JSON.stringify({ code, ts }) });
}

/* ------------------------------------------------------------------ *
 * Normalization
 * ------------------------------------------------------------------ */

test('normalize matches the rule family-api applies', () => {
  const { referral } = load();
  assert.equal(referral.normalize('creator-smith'), 'CREATOR-SMITH');
  assert.equal(referral.normalize('  partner_01  '), 'PARTNER_01');
  assert.equal(referral.normalize('ABC123'), 'ABC123');

  // Anything outside A-Z 0-9 _ - is not one of our codes.
  assert.equal(referral.normalize('not a code'), '');
  assert.equal(referral.normalize('drop;table'), '');
  assert.equal(referral.normalize('<script>'), '');
  assert.equal(referral.normalize('café'), '');
  assert.equal(referral.normalize(''), '');
  assert.equal(referral.normalize(null), '');
  assert.equal(referral.normalize(undefined), '');
  assert.equal(referral.normalize(42), '');
  assert.equal(referral.normalize('A'.repeat(64)), 'A'.repeat(64));
  assert.equal(referral.normalize('A'.repeat(65)), '');
});

/* ------------------------------------------------------------------ *
 * Capture
 * ------------------------------------------------------------------ */

test('?ref= is captured and stored', () => {
  const { referral, storage } = load({ url: 'https://privacypal.ai/family/founding/?ref=creator-smith' });
  assert.equal(referral.get(), 'CREATOR-SMITH');
  assert.equal(JSON.parse(storage._map.get(STORAGE_KEY)).code, 'CREATOR-SMITH');
});

test('partner and aff are accepted as aliases, ref wins', () => {
  assert.equal(load({ url: 'https://privacypal.ai/?partner=reseller-9' }).referral.get(), 'RESELLER-9');
  assert.equal(load({ url: 'https://privacypal.ai/?aff=aff-7' }).referral.get(), 'AFF-7');
  assert.equal(load({ url: 'https://privacypal.ai/?aff=AFF-7&ref=REF-1' }).referral.get(), 'REF-1');
});

test('a junk code is no code, and never reaches storage', () => {
  const { referral, storage } = load({ url: 'https://privacypal.ai/?ref=not%20a%20code' });
  assert.equal(referral.get(), '');
  assert.equal(storage._map.has(STORAGE_KEY), false);
});

test('no code on the URL falls back to the stored one', () => {
  const { referral } = load({ url: 'https://privacypal.ai/family/founding/', storage: sealed('CREATOR-SMITH') });
  assert.equal(referral.get(), 'CREATOR-SMITH');
});

test('an empty ref never clears a stored code', () => {
  const { referral } = load({ url: 'https://privacypal.ai/?ref=', storage: sealed('CREATOR-SMITH') });
  assert.equal(referral.get(), 'CREATOR-SMITH');
});

test('last touch wins', () => {
  const storage = sealed('OLD-PARTNER');
  const { referral } = load({ url: 'https://privacypal.ai/?ref=NEW-PARTNER', storage });
  assert.equal(referral.get(), 'NEW-PARTNER');
  assert.equal(JSON.parse(storage._map.get(STORAGE_KEY)).code, 'NEW-PARTNER');
});

test('a stored code expires after the 90 day window', () => {
  const fresh = load({ storage: sealed('CREATOR-SMITH', Date.now() - 89 * DAY) });
  assert.equal(fresh.referral.get(), 'CREATOR-SMITH');

  const stale = load({ storage: sealed('CREATOR-SMITH', Date.now() - 91 * DAY) });
  assert.equal(stale.referral.get(), '');
});

test('a corrupt or hand-edited store reads as no code', () => {
  assert.equal(load({ storage: fakeStorage({ [STORAGE_KEY]: 'not json' }) }).referral.get(), '');
  assert.equal(load({ storage: fakeStorage({ [STORAGE_KEY]: '"a string"' }) }).referral.get(), '');
  assert.equal(load({ storage: fakeStorage({ [STORAGE_KEY]: JSON.stringify({ code: 'OK' }) }) }).referral.get(), '');
  assert.equal(
    load({ storage: fakeStorage({ [STORAGE_KEY]: JSON.stringify({ code: 'not a code', ts: Date.now() }) }) }).referral.get(),
    ''
  );
});

test('blocked storage degrades to the URL, it does not throw', () => {
  const blocked = fakeStorage({}, { throwOnAccess: true });
  const { referral } = load({ url: 'https://privacypal.ai/?ref=CREATOR-SMITH', storage: blocked });
  assert.equal(referral.get(), 'CREATOR-SMITH');
  assert.equal(load({ storage: blocked }).referral.get(), '');
});

/* ------------------------------------------------------------------ *
 * Which URLs carry a code
 * ------------------------------------------------------------------ */

test('carries() is true only for the offer page and the Family portal', () => {
  const { referral } = load({ url: 'https://privacypal.ai/index.html?ref=CREATOR-SMITH' });

  assert.equal(referral.carries('https://family.privacypal.ai/signup'), true);
  assert.equal(referral.carries('https://family.privacypal.ai/download'), true);
  assert.equal(referral.carries('family/founding/index.html'), true);
  assert.equal(referral.carries('family/founding/'), true);
  assert.equal(referral.carries('/family/founding/'), true);
  assert.equal(referral.carries('https://privacypal.ai/family/founding/'), true);

  // Everywhere else is left alone.
  assert.equal(referral.carries('pricing.html'), false);
  assert.equal(referral.carries('https://privacypal.ai/family/'), false);
  assert.equal(referral.carries('https://example.com/signup'), false);
  assert.equal(referral.carries('mailto:hi@privacypal.ai'), false);
  assert.equal(referral.carries('tel:+15551234567'), false);
  assert.equal(referral.carries('#demo'), false);
  assert.equal(referral.carries(''), false);
  assert.equal(referral.carries(null), false);
});

/* ------------------------------------------------------------------ *
 * Forwarding
 * ------------------------------------------------------------------ */

test('decorate adds ref to a signup URL and leaves other params alone', () => {
  const { referral } = load({ url: 'https://privacypal.ai/family/founding/?ref=CREATOR-SMITH' });
  const out = new URL(referral.decorate('https://family.privacypal.ai/signup?promo=FOUNDINGFAMILY-0926-496&utm_source=yt'));
  assert.equal(out.searchParams.get('ref'), 'CREATOR-SMITH');
  assert.equal(out.searchParams.get('promo'), 'FOUNDINGFAMILY-0926-496');
  assert.equal(out.searchParams.get('utm_source'), 'yt');
});

test('decorate never overwrites a ref already on the URL', () => {
  const { referral } = load({ url: 'https://privacypal.ai/?ref=STORED' });
  const out = new URL(referral.decorate('https://family.privacypal.ai/signup?ref=EXPLICIT'));
  assert.equal(out.searchParams.get('ref'), 'EXPLICIT');
});

test('decorate is a no-op with no code, and on unrelated URLs', () => {
  const none = load({ url: 'https://privacypal.ai/' }).referral;
  assert.equal(none.decorate('https://family.privacypal.ai/signup'), 'https://family.privacypal.ai/signup');

  const some = load({ url: 'https://privacypal.ai/?ref=CREATOR-SMITH' }).referral;
  assert.equal(some.decorate('pricing.html'), 'pricing.html');
  assert.equal(some.decorate('https://example.com/signup'), 'https://example.com/signup');
});

test('links already in the document are decorated on load', () => {
  const offer = anchor('family/founding/index.html');
  const portal = anchor('https://family.privacypal.ai/signup?promo=FOUNDINGFAMILY-0926-496');
  const other = anchor('pricing.html');

  load({ url: 'https://privacypal.ai/index.html?ref=CREATOR-SMITH', links: [offer, portal, other] });

  assert.match(offer.href, /[?&]ref=CREATOR-SMITH/);
  assert.match(portal.href, /[?&]ref=CREATOR-SMITH/);
  assert.match(portal.href, /promo=FOUNDINGFAMILY-0926-496/);
  assert.equal(other.href, 'pricing.html');
});

test('the load pass waits for DOMContentLoaded while the page is still parsing', () => {
  const offer = anchor('family/founding/index.html');
  const ctx = load({
    url: 'https://privacypal.ai/index.html?ref=CREATOR-SMITH',
    links: [offer],
    readyState: 'loading'
  });

  assert.equal(offer.href, 'family/founding/index.html');
  ctx.domReady();
  assert.match(offer.href, /[?&]ref=CREATOR-SMITH/);
});

/* ------------------------------------------------------------------ *
 * Click interception: the v3.js-injected-chrome case
 * ------------------------------------------------------------------ */

test('a link injected after load carries the code when clicked', () => {
  // links:[] is the point. This anchor never existed during the load pass,
  // exactly like the header and footer v3.js injects.
  const ctx = load({ url: 'https://privacypal.ai/index.html?ref=CREATOR-SMITH', links: [] });
  const injected = anchor('family/founding/index.html');

  ctx.click(injected);
  assert.match(injected.href, /[?&]ref=CREATOR-SMITH/);
});

test('a click walks up from the element actually clicked', () => {
  const ctx = load({ url: 'https://privacypal.ai/?ref=CREATOR-SMITH' });
  const link = anchor('https://family.privacypal.ai/signup');
  const span = { tagName: 'SPAN', parentNode: link, getAttribute: () => null, setAttribute: () => {} };

  ctx.click(span);
  assert.match(link.href, /[?&]ref=CREATOR-SMITH/);
});

test('a click on an unrelated link changes nothing', () => {
  const ctx = load({ url: 'https://privacypal.ai/?ref=CREATOR-SMITH' });
  const link = anchor('pricing.html');
  ctx.click(link);
  assert.equal(link.href, 'pricing.html');
});

test('a click with no code in play changes nothing', () => {
  const ctx = load({ url: 'https://privacypal.ai/' });
  const link = anchor('https://family.privacypal.ai/signup');
  ctx.click(link);
  assert.equal(link.href, 'https://family.privacypal.ai/signup');
});

/* ------------------------------------------------------------------ *
 * The Founding Families CTA, as that page builds it
 * ------------------------------------------------------------------ */

test('the offer page CTA carries both the promo code and the referral code', () => {
  const { referral } = load({ url: 'https://privacypal.ai/family/founding/?ref=creator-smith&utm_source=youtube' });

  // The same lines as the inline script at the foot of family/founding/index.html.
  const here = new URLSearchParams('?ref=creator-smith&utm_source=youtube');
  const out = new URLSearchParams();
  out.set('promo', 'FOUNDINGFAMILY-0926-496');
  const ref = referral.get() || '';
  if (ref) out.set('ref', ref);
  here.forEach((v, k) => {
    if (/^utm_/i.test(k) || k === 'fbclid') out.set(k, v);
  });

  assert.equal(out.get('promo'), 'FOUNDINGFAMILY-0926-496');
  assert.equal(out.get('ref'), 'CREATOR-SMITH');
  assert.equal(out.get('utm_source'), 'youtube');
});

test('with no partner code the CTA is exactly what it was before', () => {
  const { referral } = load({ url: 'https://privacypal.ai/family/founding/' });
  const out = new URLSearchParams();
  out.set('promo', 'FOUNDINGFAMILY-0926-496');
  const ref = referral.get() || '';
  if (ref) out.set('ref', ref);
  assert.equal(out.toString(), 'promo=FOUNDINGFAMILY-0926-496');
});
