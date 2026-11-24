/* PrivacyPal shared chrome: announcement bar, nav, mobile menu, footer, the
   one download modal, the demo modal, and the behaviors behind them.
   Injected by JS to keep pages lean: a page carries <div id="site-nav-slot">
   and <div id="site-footer-slot"> and loads this file last. A page without the
   slots (lp-banking, lp-ciso, max-offer) still gets the modals and bindings. */
(function(){

  /* =====================================================================
     DOWNLOADS: the only place on the site where build URLs live.

     One product, one download (One PrivacyPal). Every download trigger on the
     site (data-cta="download", data-cta="family-download", a[href="#download"],
     a[href="#family-download"]) opens the same modal, and every platform tile
     on download.html takes its href from here. Page code never hardcodes a
     build URL or version number: it uses data-cta="download" or links to
     download.html, and download.html's tiles, Linux buttons, checksum links,
     curl lines ([data-dl-cmd]) and version labels ([data-dl-version]) carry
     version-free fallbacks (anchors and plain words) that this file fills.

     On a release: replace the version in every URL below (one find and
     replace inside this object) and update `version`. No other file changes. Linux is the headless
     agent build: CLI only, for servers and WSL, published to proxy/linux/cloud/
     on its own release train, so it has its own `version` and can trail the
     desktop app. Each URL must be one that resolves today (an S3 key that does
     not exist answers 403).

     Packs and platforms (2026-11-17): Personal (free) runs on Mac and
     Windows. Phones (iPhone, iPad, Android) come only with the Family pack or
     the Max pack, and the Linux headless agent is a Max pack surface. The
     tiles say so; never present phones or Linux as part of Personal.

     Phones (2026-11-17, round 3): iPhone, iPad and Android are protected
     today with the Family or Max pack. There is no public store listing yet,
     so installs are by invitation, delivered through Apple TestFlight and
     Google Play testing: no store badges and no store URLs anywhere, and the
     phone tiles go to the invitation request page (its file name is kept
     so old links still work). Phone copy says "Protected today with Family
     or Max · install by invitation".

     One PrivacyPal, one download (2.0.2, 2026-11-24). There is no separate
     Family download: the Family pack switches on inside the same app, so every
     page and every trigger (data-cta="family-download" and data-pack="family"
     included) gets the same builds below.
     ===================================================================== */
  var DOWNLOADS = {
    version: '2.0.2',
    mac: {
      url: 'https://privacypal-production-desktop-596719033801.s3.us-east-1.amazonaws.com/proxy/macos/PrivacyPal-2.0.2-arm64.dmg'
    },
    windows: {
      url: 'https://privacypal-production-desktop-596719033801.s3.us-east-1.amazonaws.com/proxy/windows/PrivacyPal-Setup-2.0.2.exe',
      winget: 'winget install PrivacyPal.AI'
    },
    linux: {
      version: '2.0.2',
      x64: 'https://privacypal-production-desktop-596719033801.s3.us-east-1.amazonaws.com/proxy/linux/cloud/privacypal-agent-2.0.2-linux-x86_64.tar.gz',
      arm64: 'https://privacypal-production-desktop-596719033801.s3.us-east-1.amazonaws.com/proxy/linux/cloud/privacypal-agent-2.0.2-linux-aarch64.tar.gz'
    },
    ios: { url: 'family/early-access.html' },
    android: { url: 'family/early-access.html' }
  };

  /* Root prefix: pages in subdirectories (e.g. /family/) load this file as
     ../assets/v3.js; derive the prefix from the script src so every relative
     href/src in the injected chrome resolves from the site root. */
  var ROOT = (function(){
    var s = document.currentScript;
    if (!s) {
      var all = document.getElementsByTagName('script');
      s = all[all.length - 1];
    }
    var src = (s && s.getAttribute('src')) || '';
    var m = src.match(/^(.*?)assets\/v3\.js/);
    return m ? m[1] : '';
  })();
  function rel(html){
    if (!ROOT) return html;
    return html.replace(/(href|src)="(?!(?:https?:)?\/\/|https?:|mailto:|tel:|#|\/)/g, '$1="' + ROOT);
  }
  function abs(u){
    return (!u || /^(?:[a-z]+:|\/\/|\/|#)/i.test(u)) ? u : ROOT + u;
  }

  /* Referral attribution. assets/referral.js captures ?ref= (partner, reseller
     and creator codes) and forwards it to the Founding Families offer page and
     on to family.privacypal.ai (signup, and the portal download routes above).
     It is loaded from here rather than from a <script> tag in every page, so
     every corporate page gets it for free.

     Load order does not matter: referral.js rewrites a matching link on click,
     in the capture phase, so the FAMILY_OFFER links this file injects below
     carry the code even though they are built before referral.js arrives.
     The /family/ pages load referral.js themselves as well (and so does
     family/founding/, which does not load this file); the guard below keeps
     it to one copy per page. */
  (function(){
    if (window.PPReferral) return;
    if (document.querySelector('script[src$="assets/referral.js"]')) return;
    var s = document.createElement('script');
    s.src = ROOT + 'assets/referral.js';
    s.async = true;
    (document.head || document.documentElement).appendChild(s);
  })();

  /* The Family pack's offer and sign-in.

     IMPORTANT: no link on this site goes straight to the portal's /signup. A bare
     ?promo= on the signup URL does not reliably reach the wizard, so every
     Family "start your trial" CTA on the site goes to FAMILY_OFFER, the coded
     Founding Families landing page, which states the code on the page and hands
     off to /signup itself (forwarding utm_* and fbclid). Adding a direct signup
     link anywhere would silently drop the discount. It is a site-relative path
     so rel() can prefix it for pages in subdirectories.

     The chrome's primary CTA is "Download free" on every page: Personal is free
     (no card, no trial). The announce bar is context-aware: on Family pages it
     pushes the Founding Families offer for the Family pack (which keeps its
     5-day trial); on every other page it announces One PrivacyPal and links to
     download.html. The Max pack has no trial: it is paid from day one.

     Pack names (2026-11-17): Personal (free), Family and Max. "Business" is
     the audience (business.html, "PrivacyPal for business"), never a pack
     name. Class names (.pk.business,
     .pack-chip.business) stay as they are.

     The portal links are safe to use directly: none of them needs a code.
       /login             Parent HQ, for families who already have an account */
  var FAMILY_PORTAL = 'https://family.privacypal.ai';
  var FAMILY_OFFER = 'family/founding/index.html';
  var FAMILY_LOGIN = FAMILY_PORTAL + '/login';
  var BUSINESS_PORTAL = 'https://portal.privacypal.ai';
  var DOCS_URL = 'https://privacypal.ai/documentation/sdk/';

  /* True on /family/* and on /webinars/family/ (the path contains /family/).
     Drives the announce bar. family/founding/ does not load this file. */
  var IS_FAMILY = /(^|\/)family\//.test(location.pathname);

  /* Social profiles: update these when handles are confirmed. */
  var SOCIAL = {
    linkedin: 'https://www.linkedin.com/company/privacypalai',
    x: 'https://x.com/PrivacyPalAI',
    youtube: 'https://www.youtube.com/@PrivacyPal-AI-Cloud',
    github: 'https://github.com/privacypal'
  };

  var ICONS = {
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.31h4.52V23H.24V8.31zM8.34 8.31h4.33v2h.06c.6-1.14 2.08-2.34 4.28-2.34 4.58 0 5.42 3.01 5.42 6.92V23h-4.51v-7.12c0-1.7-.03-3.88-2.37-3.88-2.37 0-2.73 1.85-2.73 3.76V23H8.34V8.31z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.24 2H21.5l-7.13 8.16L22.75 22h-6.57l-5.15-6.73L5.14 22H1.87l7.63-8.72L1.25 2h6.74l4.65 6.15L18.24 2zm-1.15 18h1.81L7.02 3.85H5.08L17.09 20z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.38.82 1.11.82 2.24v3.32c0 .32.21.7.82.57A12 12 0 0 0 12 .3z"/></svg>',
    ext: '<svg class="ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>',
    apple: '<svg class="os-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>',
    windows: '<svg class="os-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 4.5L10.5 3.5V11H3V4.5ZM11.5 3.35L21 2V11H11.5V3.35ZM3 12H10.5V20.5L3 19.5V12ZM11.5 12H21V22L11.5 20.65V12Z"/></svg>',
    /* Linux is a terminal glyph, never a penguin (Tux is a penguin too). */
    terminal: '<svg class="os-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="19" height="16" rx="2.6"/><path d="m6.8 9.3 3.1 2.7-3.1 2.7M12.4 15.2h4.8"/></svg>',
    phone: '<svg class="os-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6.2" y="2.5" width="11.6" height="19" rx="2.8"/><path d="M10.6 5.4h2.8M10.8 18.5h2.4"/></svg>',
    android: '<svg class="os-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.6 17.5a7.4 7.4 0 0 1 14.8 0z"/><path d="m8.2 10.9-1.7-2.6M15.8 10.9l1.7-2.6"/><circle cx="9.3" cy="14.4" r=".55" fill="currentColor"/><circle cx="14.7" cy="14.4" r=".55" fill="currentColor"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10.4c0 5.9-8 11.6-8 11.6S4 16.3 4 10.4a8 8 0 0 1 16 0z"/><circle cx="12" cy="10.4" r="2.7"/></svg>'
  };

  function social(){
    return '<a href="' + SOCIAL.github + '" target="_blank" rel="noopener" aria-label="GitHub">' + ICONS.github + '</a>' +
           '<a href="' + SOCIAL.linkedin + '" target="_blank" rel="noopener" aria-label="LinkedIn">' + ICONS.linkedin + '</a>' +
           '<a href="' + SOCIAL.x + '" target="_blank" rel="noopener" aria-label="X (Twitter)">' + ICONS.x + '</a>' +
           '<a href="' + SOCIAL.youtube + '" target="_blank" rel="noopener" aria-label="YouTube">' + ICONS.youtube + '</a>';
  }

  /* ---------------- Download helpers ---------------- */

  /* The visitor's device, used to mark "your device" on platform tiles and
     to label download.html's main button. iPadOS reports itself as a Mac, so
     a Mac with a touch screen counts as iPad. */
  var DEVICE = (function(){
    var ua = navigator.userAgent || '';
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua) || (/mac/i.test(p) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/win/i.test(p) || /windows nt/i.test(ua)) return 'windows';
    if (/mac/i.test(p) || /mac os x/i.test(ua)) return 'mac';
    if (/cros/i.test(ua)) return '';
    if (/linux|x11/i.test(p + ' ' + ua)) return 'linux';
    return '';
  })();
  function normOS(os){
    os = String(os || '').toLowerCase();
    if (os === 'win') return 'windows';
    if (os === 'macos' || os === 'osx') return 'mac';
    if (os === 'iphone' || os === 'ipad' || os === 'ipados') return 'ios';
    return os;
  }

  function hrefFor(key){
    switch (key) {
      case 'mac':         return DOWNLOADS.mac.url;
      case 'windows':
      case 'win':         return DOWNLOADS.windows.url;
      case 'linux':
      case 'linux-x64':   return DOWNLOADS.linux.x64;
      case 'linux-arm64': return DOWNLOADS.linux.arm64;
      case 'linux-x64-sha256':   return DOWNLOADS.linux.x64 + '.sha256';
      case 'linux-arm64-sha256': return DOWNLOADS.linux.arm64 + '.sha256';
      case 'ios':         return abs(DOWNLOADS.ios.url);
      case 'android':     return abs(DOWNLOADS.android.url);
    }
    return '';
  }
  function fileOf(url){ return String(url || '').split('/').pop(); }

  var AUTO_LABEL = {
    mac: 'Download for Mac',
    windows: 'Download for Windows',
    linux: 'Download the Max Linux agent',
    ios: 'Request your iPhone invitation',
    android: 'Request your Android invitation'
  };

  /* Fill every [data-dl] link inside root from DOWNLOADS, mark the visitor's
     platform, and fill version and file name labels. Runs on page load (for
     download.html and any page with platform tiles) and again each time the
     modal opens. */
  function hydrate(root){
    if (!root) return;
    root.querySelectorAll('[data-dl]').forEach(function(a){
      var key = a.getAttribute('data-dl');
      if (key === 'auto') {
        if (!DEVICE) return;
        a.setAttribute('href', hrefFor(DEVICE === 'linux' ? 'linux-x64' : DEVICE));
        var lbl = a.querySelector('[data-dl-label]');
        if (lbl) lbl.textContent = AUTO_LABEL[DEVICE];
        a.setAttribute('data-os', DEVICE);
        return;
      }
      var url = hrefFor(key);
      if (url) a.setAttribute('href', url);
    });
    root.querySelectorAll('[data-dl-file]').forEach(function(el){
      var key = el.getAttribute('data-dl-file');
      el.textContent = fileOf(hrefFor(key));
    });
    /* command lines: data-dl-cmd="curl -LO {linux-x64}" fills the element's
       text, and its copy button's data-cli-copy, with the resolved URLs */
    root.querySelectorAll('[data-dl-cmd]').forEach(function(el){
      var cmd = el.getAttribute('data-dl-cmd').replace(/\{([a-z0-9-]+)\}/g, function(_, k){ return hrefFor(k); });
      var out = el.querySelector('[data-dl-cmd-text]') || el;
      out.textContent = cmd;
      var copy = el.querySelector('[data-cli-copy]');
      if (copy) copy.setAttribute('data-cli-copy', cmd);
    });
    root.querySelectorAll('[data-dl-version]').forEach(function(el){
      var which = el.getAttribute('data-dl-version');
      if (which === 'linux') el.textContent = (el.getAttribute('data-dl-prefix') || '') + DOWNLOADS.linux.version;
      else el.textContent = 'Version ' + DOWNLOADS.version;
    });
    if (DEVICE) {
      root.querySelectorAll('.platform[data-os]').forEach(function(t){
        t.classList.toggle('is-you', normOS(t.getAttribute('data-os')) === DEVICE);
      });
    }
  }

  /* The five platform tiles. Used by the modal; download.html, install.html and
     desktop.html carry the same markup with version-free fallback hrefs (anchors
     on download.html) for visitors without JavaScript, and hydrate() replaces
     them from DOWNLOADS. Mac and Windows
     run every pack (Personal included); Linux is the Max headless agent; the
     phone tiles are protected today with the Family or Max pack, installed
     by invitation. */
  function platformTiles(){
    return '' +
      '<a class="platform" data-os="mac" data-dl="mac" href="download.html#mac" rel="noopener">' +
        ICONS.apple +
        '<span class="os-name">Mac</span>' +
        '<span class="os-meta">Apple Silicon · macOS 13+</span>' +
        '<span class="os-go">' + ICONS.down + 'Download .dmg</span>' +
      '</a>' +
      '<a class="platform" data-os="windows" data-dl="windows" href="download.html#windows" rel="noopener">' +
        ICONS.windows +
        '<span class="os-name">Windows</span>' +
        '<span class="os-meta">Windows 11 · 64-bit</span>' +
        '<span class="os-go">' + ICONS.down + 'Download .exe</span>' +
      '</a>' +
      '<div class="platform multi" data-os="linux">' +
        ICONS.terminal +
        '<span class="os-name">Linux</span>' +
        '<span class="os-meta">The Max headless agent · CLI</span>' +
        '<span class="os-links">' +
          '<a data-dl="linux-x64" href="download.html#linux" rel="noopener" aria-label="Download the Linux agent for x86_64">x86_64</a>' +
          '<a data-dl="linux-arm64" href="download.html#linux" rel="noopener" aria-label="Download the Linux agent for aarch64">aarch64</a>' +
        '</span>' +
      '</div>' +
      '<a class="platform" data-os="ios" data-dl="ios" href="' + DOWNLOADS.ios.url + '">' +
        ICONS.phone +
        '<span class="os-name">iPhone and iPad</span>' +
        '<span class="os-meta">Protected today with Family or Max · install by invitation</span>' +
        '<span class="os-go">Request an invite <span aria-hidden="true">→</span></span>' +
      '</a>' +
      '<a class="platform" data-os="android" data-dl="android" href="' + DOWNLOADS.android.url + '">' +
        ICONS.android +
        '<span class="os-name">Android</span>' +
        '<span class="os-meta">Protected today with Family or Max · install by invitation</span>' +
        '<span class="os-go">Request an invite <span aria-hidden="true">→</span></span>' +
      '</a>';
  }

  /* ---------------- Announcement bar ---------------- */
  var announceHTML = IS_FAMILY
  ? '<div class="announce">' +
      '<a href="' + FAMILY_OFFER + '"><span class="tag">New</span>' +
        '<span class="msg"><span class="long">Founding Families: the Family pack is 50% off your first year</span><span class="short">Founding Families: 50% off year one</span></span>' +
        '<span class="arrow" aria-hidden="true">→</span></a>' +
    '</div>'
  : '<div class="announce">' +
      '<a href="download.html"><span class="tag">New</span>' +
        '<span class="msg"><span class="long">One PrivacyPal: Personal is free, and the Family and Max packs switch on in the same app</span><span class="short">One PrivacyPal: Personal is free</span></span>' +
        '<span class="arrow" aria-hidden="true">→</span></a>' +
    '</div>';

  /* ---------------- Nav ---------------- */
  var navHTML =
  '<nav class="site-nav" id="siteNav" aria-label="Main">' +
    '<div class="nav-inner">' +
      /* Two logo files toggled by CSS: navy wordmark on light, white wordmark
         (with the dark-ground penguin) over the homepage's cinema photo. Never
         recolor the logo with a CSS filter. */
      '<a class="nav-logo" href="index.html" aria-label="PrivacyPal home">' +
        '<img class="logo-ink" src="assets/brand/logo.svg" alt="PrivacyPal" width="146" height="28">' +
        '<img class="logo-light" src="assets/brand/logo-white.svg" alt="" width="146" height="28" aria-hidden="true">' +
      '</a>' +

      '<div class="nav-menu" id="navMenu">' +

        '<div class="nav-item nav-item--product" data-drop>' +
          '<button type="button" aria-expanded="false">Product <span class="caret"></span></button>' +
          '<div class="nav-drop">' +
            '<div class="nav-group">' +
              '<h6>One app, three packs</h6>' +
              '<a href="privacypal-pro.html"><b><i class="pk personal"></i>Personal <span class="nav-badge">Free</span></b><small>Protection for you across the AI chat apps</small></a>' +
              '<a href="family/index.html"><b><i class="pk family"></i>Family pack</b><small>Guardrails for your kids&rsquo; AI and Roblox</small></a>' +
              '<a href="privacypal-max.html"><b><i class="pk business"></i>Max pack</b><small>Privacy and governance for every AI at work</small></a>' +
              '<a href="pricing.html"><b>Compare packs</b><small>Personal, Family and Max side by side</small></a>' +
            '</div>' +
            '<div class="nav-group">' +
              '<h6>Access</h6>' +
              '<a href="index.html#how"><b>How it works</b><small>On the device, before data reaches an AI</small></a>' +
              '<a href="download.html"><b>Download</b><small>Mac and Windows; phones with Family or Max, Linux with Max</small></a>' +
              '<a href="privacypal-cloud.html"><b>Cloud</b><small>Sovereign deployment in your own cloud</small></a>' +
              '<a href="developers.html"><b>SDK and API</b><small>Build PrivacyPal protection into your software</small></a>' +
              '<a href="' + DOCS_URL + '" target="_blank" rel="noopener"><b>Developer docs ' + ICONS.ext + '</b><small>SDK reference and developer guides</small></a>' +
            '</div>' +
            '<div class="nav-group">' +
              '<h6>Use cases</h6>' +
              '<a href="accounting.html"><b>Accounting</b><small>CPA firms, tax practices and advisory</small></a>' +
              '<a href="banking.html"><b>Banking</b><small>Community banks, credit unions and wealth</small></a>' +
              '<a href="family/index.html"><b>Education</b><small>Private AI for students, with homework mode</small></a>' +
              '<a href="healthcare.html"><b>Healthcare</b><small>Clinics, therapists and specialist practices</small></a>' +
              '<a href="legal.html"><b>Legal</b><small>Law firms, in-house counsel and paralegals</small></a>' +
              '<a href="technology.html"><b>Technology</b><small>SaaS teams shipping AI on customer data</small></a>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="nav-item nav-item--platform" data-drop>' +
          '<button type="button" aria-expanded="false">Platform <span class="caret"></span></button>' +
          '<div class="nav-drop">' +
            '<div class="nav-group">' +
              '<h6>Identify</h6>' +
              '<a href="privacy-twins.html"><b>Privacy Twins</b><small>Realistic stand-ins, so the AI still works</small></a>' +
              '<a href="privacypal-max.html#connections"><b>Intellectual property</b><small>Learns what is sensitive in the systems you run</small></a>' +
              '<a href="ai-dspm.html"><b>DSPM</b><small>On-device and network data security posture</small></a>' +
              '<a href="private-memory.html"><b>Private Memory</b><small>One memory across every AI: yours</small></a>' +
            '</div>' +
            '<div class="nav-group">' +
              '<h6>Protect</h6>' +
              '<a href="device-control.html"><b>On-device protection</b><small>Real-time protection across every AI app</small></a>' +
              '<a href="privacypal-max.html#memory"><b>Private MCP</b><small>Your internal tools over MCP, hosted for you</small></a>' +
              '<a href="privacypal-max.html#agents"><b>Every AI surface</b><small>Agents, apps and APIs under one policy</small></a>' +
              '<a href="privacypal-ai.html#how-it-works"><b>Zero-configuration shield</b><small>Runs on the device and sees every AI interaction</small></a>' +
            '</div>' +
            '<div class="nav-group">' +
              '<h6>Govern</h6>' +
              '<a href="privacypal-ai.html"><b>Agent governance</b><small>Claude Code, Copilot and MCP under control</small></a>' +
              '<a href="privacypal-cloud.html"><b>Cloud</b><small>The governance plane, in your own VPC</small></a>' +
              '<a href="privacypal-max.html#control"><b>Device control</b><small>Approve, block and redirect AI tools per team</small></a>' +
              '<a href="privacypal-max.html#control"><b>Org-wide visibility</b><small>Every interception in one activity feed</small></a>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="nav-item"><a href="pricing.html">Pricing</a></div>' +

        '<div class="nav-item nav-item--company" data-drop>' +
          '<button type="button" aria-expanded="false">Company <span class="caret"></span></button>' +
          '<div class="nav-drop">' +
            '<div class="nav-group">' +
              '<h6>Company</h6>' +
              '<a href="about.html"><b>About us</b><small>Mission and the AI OS vision</small></a>' +
              '<a href="team.html"><b>Team</b><small>The people behind PrivacyPal</small></a>' +
              '<a href="careers.html"><b>Careers</b><small>Build the trust layer for AI</small></a>' +
              '<a href="contact.html"><b>Contact</b><small>Talk to a human</small></a>' +
            '</div>' +
            '<div class="nav-group">' +
              '<h6>Resources</h6>' +
              '<a href="blog.html"><b>The Privacy Log</b><small>Our blog on AI, privacy and governance</small></a>' +
              '<a href="news.html"><b>Newsroom</b><small>News, press and happenings</small></a>' +
              '<a href="events.html"><b>Events</b><small>Where to find us next</small></a>' +
              '<a href="webinars/"><b>Live demos</b><small>Every Tuesday and Thursday</small></a>' +
            '</div>' +
            '<a class="nav-feature nav-feature--note" href="careers.html">' +
              '<span class="nf-kicker">Careers</span>' +
              '<span class="cap"><b>We&rsquo;re hiring</b><small>Build the trust layer for AI →</small></span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="nav-right">' +
        '<div class="nav-social">' + social() + '</div>' +
        '<div class="nav-item nav-item--signin" data-drop>' +
          '<button type="button" aria-expanded="false">Sign in <span class="caret"></span></button>' +
          '<div class="nav-drop drop-right">' +
            '<div class="nav-group slim">' +
              '<a href="' + FAMILY_LOGIN + '"><b>Parent HQ</b><small>Family pack sign-in</small></a>' +
              '<a href="' + BUSINESS_PORTAL + '" target="_blank" rel="noopener"><b>PrivacyPal portal</b><small>Personal, Max and Cloud sign-in</small></a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<a class="btn btn-ghost" href="#" data-cta="demo">Book a demo</a>' +
        '<a class="btn btn-primary" href="download.html" data-cta="download">Download free</a>' +
        '<button class="nav-burger" id="navBurger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>' +
      '</div>' +
    '</div>' +
  '</nav>' +

  /* Mobile menu: the same information architecture, one section per menu. */
  '<nav class="mobile-menu" id="mobileMenu" aria-label="Menu">' +
    '<details class="mm-sec"><summary>Product</summary><div class="mm-links">' +
      '<h6>One app, three packs</h6>' +
      '<a href="privacypal-pro.html"><i class="pk personal"></i>Personal <span class="nav-badge">Free</span></a>' +
      '<a href="family/index.html"><i class="pk family"></i>Family pack</a>' +
      '<a href="privacypal-max.html"><i class="pk business"></i>Max pack</a>' +
      '<a href="pricing.html">Compare packs</a>' +
      '<h6>Access</h6>' +
      '<a href="index.html#how">How it works</a>' +
      '<a href="download.html">Download</a>' +
      '<a href="privacypal-cloud.html">Cloud</a>' +
      '<a href="developers.html">SDK and API</a>' +
      '<a href="' + DOCS_URL + '" target="_blank" rel="noopener">Developer docs</a>' +
      '<h6>Use cases</h6>' +
      '<a href="accounting.html">Accounting</a>' +
      '<a href="banking.html">Banking</a>' +
      '<a href="family/index.html">Education</a>' +
      '<a href="healthcare.html">Healthcare</a>' +
      '<a href="legal.html">Legal</a>' +
      '<a href="technology.html">Technology</a>' +
    '</div></details>' +
    '<details class="mm-sec"><summary>Platform</summary><div class="mm-links">' +
      '<h6>Identify</h6>' +
      '<a href="privacy-twins.html">Privacy Twins</a>' +
      '<a href="privacypal-max.html#connections">Intellectual property</a>' +
      '<a href="ai-dspm.html">DSPM</a>' +
      '<a href="private-memory.html">Private Memory</a>' +
      '<h6>Protect</h6>' +
      '<a href="device-control.html">On-device protection</a>' +
      '<a href="privacypal-max.html#memory">Private MCP</a>' +
      '<a href="privacypal-max.html#agents">Every AI surface</a>' +
      '<a href="privacypal-ai.html#how-it-works">Zero-configuration shield</a>' +
      '<h6>Govern</h6>' +
      '<a href="privacypal-ai.html">Agent governance</a>' +
      '<a href="privacypal-cloud.html">Cloud</a>' +
      '<a href="privacypal-max.html#control">Device control</a>' +
      '<a href="privacypal-max.html#control">Org-wide visibility</a>' +
    '</div></details>' +
    '<a class="mm-link" href="pricing.html">Pricing</a>' +
    '<details class="mm-sec"><summary>Company</summary><div class="mm-links">' +
      '<a href="about.html">About us</a>' +
      '<a href="team.html">Team</a>' +
      '<a href="careers.html">Careers</a>' +
      '<a href="contact.html">Contact</a>' +
      '<h6>Resources</h6>' +
      '<a href="blog.html">The Privacy Log</a>' +
      '<a href="news.html">Newsroom</a>' +
      '<a href="events.html">Events</a>' +
      '<a href="webinars/">Live demos</a>' +
    '</div></details>' +
    '<div class="mm-signin">' +
      '<a href="' + FAMILY_LOGIN + '"><b>Parent HQ</b><small>Family pack sign-in</small></a>' +
      '<a href="' + BUSINESS_PORTAL + '" target="_blank" rel="noopener"><b>PrivacyPal portal</b><small>Personal, Max, Cloud</small></a>' +
    '</div>' +
    '<div class="mm-ctas">' +
      '<a class="btn btn-ghost" href="#" data-cta="demo">Book a demo</a>' +
      '<a class="btn btn-primary" href="download.html" data-cta="download">Download free</a>' +
    '</div>' +
    '<div class="mm-social">' + social() + '</div>' +
  '</nav>';

  /* ---------------- Footer ---------------- */
  var footerHTML =
  '<footer class="site-footer">' +
    '<div class="footer-inner">' +
      '<div class="footer-top">' +
        '<div class="footer-brand">' +
          '<a class="foot-logo" href="index.html" aria-label="PrivacyPal home"><img src="assets/brand/logo.svg" alt="PrivacyPal" width="157" height="30" loading="lazy"></a>' +
          '<p class="footer-tag">We protect your data from AI, at home and at work.</p>' +
          '<p class="footer-proof">The same technology that protects 140+ companies.</p>' +
          '<div class="footer-news">' +
            '<h5>The Privacy Log, weekly</h5>' +
            '<form action="mailto:hello@privacypal.ai" method="get" data-newsletter>' +
              '<input type="email" name="subject" placeholder="you@company.com" aria-label="Email address" required>' +
              '<button class="btn btn-primary" type="submit">Subscribe</button>' +
            '</form>' +
            '<p>AI governance, on-device privacy and what the agentic shift means for your data.</p>' +
          '</div>' +
          /* Headquarters. Also the mailing address on contact.html; keep the
             two in step, and keep the PostalAddress itemprops intact so the
             address stays machine-readable for search and maps. */
          '<address class="footer-addr" itemscope itemtype="https://schema.org/PostalAddress">' +
            '<h5>Headquarters</h5>' +
            '<div class="footer-addr-row">' +
              ICONS.pin +
              '<p>' +
                '<b>PrivacyPal</b>' +
                '<span itemprop="streetAddress">1601 Belvedere Rd<br>Suite E-300</span>' +
                '<span><span itemprop="addressLocality">West Palm Beach</span>, <span itemprop="addressRegion">FL</span> <span itemprop="postalCode">33406</span></span>' +
                '<span itemprop="addressCountry">United States</span>' +
              '</p>' +
            '</div>' +
          '</address>' +
        '</div>' +
        '<div class="footer-grid">' +
          '<div class="footer-col">' +
            '<h5>Product</h5>' +
            '<a href="pricing.html">Pricing</a>' +
            '<h6>One app, three packs</h6>' +
            '<a href="privacypal-pro.html">Personal <small>FREE</small></a>' +
            '<a href="family/index.html">Family pack</a>' +
            '<a href="privacypal-max.html">Max pack</a>' +
            '<a href="pricing.html">Compare packs</a>' +
            '<h6>Access</h6>' +
            '<a href="index.html#how">How it works</a>' +
            '<a href="download.html">Download</a>' +
            '<a href="privacypal-cloud.html">Cloud</a>' +
            '<a href="developers.html">SDK and API</a>' +
            '<a href="' + DOCS_URL + '" target="_blank" rel="noopener">Developer docs</a>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h5>Use cases</h5>' +
            '<a href="accounting.html">Accounting</a>' +
            '<a href="banking.html">Banking</a>' +
            '<a href="family/index.html">Education</a>' +
            '<a href="healthcare.html">Healthcare</a>' +
            '<a href="legal.html">Legal</a>' +
            '<a href="technology.html">Technology</a>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h5>Platform</h5>' +
            '<h6>Identify</h6>' +
            '<a href="privacy-twins.html">Privacy Twins</a>' +
            '<a href="privacypal-max.html#connections">Intellectual property</a>' +
            '<a href="ai-dspm.html">DSPM</a>' +
            '<a href="private-memory.html">Private Memory</a>' +
            '<h6>Protect</h6>' +
            '<a href="device-control.html">On-device protection</a>' +
            '<a href="privacypal-max.html#memory">Private MCP</a>' +
            '<a href="privacypal-max.html#agents">Every AI surface</a>' +
            '<a href="privacypal-ai.html#how-it-works">Zero-configuration shield</a>' +
            '<h6>Govern</h6>' +
            '<a href="privacypal-ai.html">Agent governance</a>' +
            '<a href="privacypal-cloud.html">Cloud</a>' +
            '<a href="privacypal-max.html#control">Device control</a>' +
            '<a href="privacypal-max.html#control">Org-wide visibility</a>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h5>Company</h5>' +
            '<a href="about.html">About us</a>' +
            '<a href="team.html">Team</a>' +
            '<a href="careers.html">Careers <small>HIRING</small></a>' +
            '<a href="news.html">Newsroom</a>' +
            '<a href="contact.html">Contact</a>' +
            '<a href="privacy.html">Privacy Policy</a>' +
            '<a href="terms.html">Terms of Service</a>' +
            '<a href="privacy.html#security">Security</a>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h5>Resources</h5>' +
            '<a href="' + DOCS_URL + '" target="_blank" rel="noopener">Documentation</a>' +
            '<a href="blog.html">The Privacy Log</a>' +
            '<a href="family/guidebook.html">The Guidebook</a>' +
            '<a href="events.html">Events</a>' +
            '<a href="webinars/">Live demos</a>' +
            '<a href="download.html#install">Install guide</a>' +
            '<a href="' + BUSINESS_PORTAL + '" target="_blank" rel="noopener">PrivacyPal portal</a>' +
            '<a href="' + FAMILY_LOGIN + '">Parent HQ</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<div class="footer-legal">' +
          '<span>© 2026 PrivacyPal</span>' +
          '<a href="privacy.html">Privacy</a>' +
          '<a href="terms.html">Terms</a>' +
          '<a href="mailto:hello@privacypal.ai">hello@privacypal.ai</a>' +
        '</div>' +
        '<div class="footer-social">' + social() + '</div>' +
      '</div>' +
      /* The penguin is the Twemoji penguin emoji, used unaltered under CC BY 4.0,
         which requires this credit. Keep it wherever the footer renders. */
      '<p class="footer-credit">Penguin emoji graphic from <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noopener">Twemoji</a>, &copy; Twitter, Inc. and other contributors, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>.</p>' +
    '</div>' +
  '</footer>';

  /* ---------------- Shared modals (demo + the one download) ---------------- */
  var modalsHTML =
  '<div class="pp-modal" id="ppDemoModal" aria-hidden="true">' +
    '<div class="pp-modal-card demo" role="dialog" aria-modal="true" aria-label="Book a demo">' +
      '<div class="pp-modal-head"><h3>Book a demo</h3>' +
      '<button class="pp-modal-close" type="button" data-modal-close aria-label="Close">&times;</button></div>' +
      '<div class="pp-modal-body">' +
        '<p class="pp-modal-alt">Prefer to see it with a group first? <a href="webinars/business/">Join the live demo</a>, every Tuesday and Thursday at noon ET.</p>' +
        '<div class="pp-modal-loading" id="ppDemoLoading"><div class="pp-spinner"></div>Loading…</div>' +
        '<iframe id="ppDemoFrame" title="Book a demo" data-src="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0en3ttxqL4LChfrMDCbYeqxtKuKXOR4YRnGz0Sfg0RIwh7nO51zW3MqxBnQzAVcSkQoy3_6UJZ?gv=true" style="display:none"></iframe>' +
      '</div>' +
    '</div>' +
  '</div>' +
  /* The one download modal. data-cta="download" and data-cta="family-download"
     both open it, with the same builds (see DOWNLOADS). */
  '<div class="pp-modal" id="ppDownloadModal" aria-hidden="true">' +
    '<div class="pp-modal-card dl" role="dialog" aria-modal="true" aria-labelledby="ppDlTitle">' +
      '<div class="pp-modal-head">' +
        '<div class="pp-dl-title">' +
          '<img src="assets/brand/app-icon.svg" alt="" width="40" height="40">' +
          '<div><h3 id="ppDlTitle">Download PrivacyPal</h3><span class="pp-dl-ver" data-dl-version>Version ' + DOWNLOADS.version + '</span></div>' +
        '</div>' +
        '<button class="pp-modal-close" type="button" data-modal-close aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="pp-modal-body">' +
        '<p class="pp-dl-lede">Personal is free on Mac and Windows. Add the Family or Max pack any time: either one protects your iPhone, iPad and Android today, installed by invitation. Your company can also add Max to your account.</p>' +
        '<div class="pp-dl-packs">' +
          '<span class="pack-chip personal">Personal · free</span>' +
          '<span class="pack-chip family">Family · $9.99/mo</span>' +
          '<span class="pack-chip business">Max · $34/user/mo</span>' +
        '</div>' +
        '<div class="platform-grid list-sm">' + platformTiles() + '</div>' +
        '<div class="pp-dl-trust">' +
          '<div class="pp-dl-trust-item"><span class="pp-dl-trust-ico">' + ICONS.shield + '</span>' +
            '<p><b>Signed and notarized.</b> Notarized by Apple, a trusted publisher on Windows.</p></div>' +
          '<div class="pp-dl-trust-item"><span class="pp-dl-trust-ico">' + ICONS.bolt + '</span>' +
            '<p><b>Live in about 20 minutes.</b> Install, sign in, and protection starts on the device.</p></div>' +
          '<a class="pp-dl-more" href="download.html">System requirements and install steps <span aria-hidden="true">→</span></a>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

  /* ---------------- Inject ---------------- */
  var navHolder = document.getElementById('site-nav-slot');
  var footHolder = document.getElementById('site-footer-slot');
  if (navHolder) navHolder.outerHTML = rel(announceHTML + navHTML);
  if (footHolder) footHolder.outerHTML = rel(footerHTML);
  if (!document.getElementById('ppDemoModal')) {
    var wrap = document.createElement('div');
    wrap.innerHTML = rel(modalsHTML);
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  /* Fill download links and "your device" marks on the page itself
     (download.html, install.html, desktop.html, any page with tiles). */
  hydrate(document);

  /* The logo mark is the penguin emoji. On PrivacyPal pages a typed 🐧 renders
     as that same image, so "🐧 PrivacyPal" in copy always matches the logo,
     whatever emoji font the visitor's device has. Form fields, code and
     scripts are left alone. */
  (function penguinEmoji(){
    var PENGUIN = '\uD83D\uDC27';
    if (!document.body || document.body.textContent.indexOf(PENGUIN) === -1) return;
    var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE|TITLE|OPTION|NOSCRIPT)$/;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){
        if (n.nodeValue.indexOf(PENGUIN) === -1) return NodeFilter.FILTER_REJECT;
        for (var p = n.parentNode; p && p !== document.body; p = p.parentNode) {
          if (SKIP.test(p.nodeName) || (p.hasAttribute && p.hasAttribute('data-raw-emoji'))) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function(t){
      var frag = document.createDocumentFragment();
      t.nodeValue.split(PENGUIN).forEach(function(part, i){
        if (i) {
          var img = document.createElement('img');
          img.className = 'pp-emoji';
          img.src = ROOT + 'assets/brand/penguin.svg';
          img.alt = PENGUIN;
          img.draggable = false;
          frag.appendChild(img);
        }
        if (part) frag.appendChild(document.createTextNode(part));
      });
      t.parentNode.replaceChild(frag, t);
    });
  })();

  /* ---------------- Nav behavior ---------------- */
  var nav = document.getElementById('siteNav');
  if (nav) {
    var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive:true }); onScroll();
  }

  /* dropdowns: open on hover with a mouse or pen, and on click or tap
     (Enter or Space on the focused button).
     A closed drop is display:none (v3.css), so it never widens the page; an
     open one that would cross a viewport edge shifts back in (fitDrop).
     Keyboard: Tab moves through an open drop, tabbing out closes it, and
     Escape closes it and returns focus to its button. */
  /* Runs once the drop is displayed (measured after .open is set). Keeps it
     16px inside both viewport edges: a left-anchored drop moves with
     margin-left, a .drop-right one with margin-right. */
  function fitDrop(drop){
    if (!drop) return;
    var right = drop.classList.contains('drop-right');
    drop.style.marginLeft = '';
    drop.style.marginRight = '';
    var vw = document.documentElement.clientWidth, pad = 16;
    var r = drop.getBoundingClientRect();
    if (!r.width) return;
    var dx = 0;
    if (r.right > vw - pad) dx = (vw - pad) - r.right;
    if (r.left + dx < pad) dx = pad - r.left;
    if (dx) drop.style[right ? 'marginRight' : 'marginLeft'] = (right ? -dx : dx) + 'px';
  }
  function closeAllDrops(except){
    document.querySelectorAll('.nav-item.open').forEach(function(o){
      if (o === except) return;
      o.classList.remove('open');
      var b = o.querySelector('button'); if (b) b.setAttribute('aria-expanded','false');
    });
  }
  var HAS_POINTER = 'PointerEvent' in window;
  /* Menu aim. A diagonal move from a top button to a link on the far side of
     its menu crosses the neighbouring buttons. While the pointer is heading
     down into the open menu, a neighbour must not take over and the open
     menu must not close. "Heading into" means the pointer sits inside the
     triangle from where it was a moment ago to the open menu's top corners,
     and is still moving. Once it stops on a button, that button wins. */
  var aimTrail = [];
  function trackAim(e){
    if (e.pointerType === 'touch') return;
    /* pointerenter and the document pointermove report the same point:
       keep one, with the time the pointer first reached it */
    var l = aimTrail[aimTrail.length - 1];
    if (l && l.x === e.clientX && l.y === e.clientY) return;
    aimTrail.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (aimTrail.length > 6) aimTrail.shift();
  }
  document.addEventListener(HAS_POINTER ? 'pointermove' : 'mousemove', trackAim, { passive: true });
  function aimingAt(menuItem){
    var d = menuItem && menuItem.classList.contains('open') && menuItem.querySelector('.nav-drop');
    if (!d || aimTrail.length < 2) return false;
    var c = aimTrail[aimTrail.length - 1], p = null;
    if (Date.now() - c.t > 110) return false;            /* the pointer has stopped */
    /* direction from where this movement started: the point just before
       the 120ms window (after a pause that is the resting point, so a gentle
       start that stays on one pixel row still reads as heading down) */
    for (var i = 0; i < aimTrail.length - 1; i++) {
      if (c.t - aimTrail[i].t <= 120) { p = aimTrail[i ? i - 1 : 0]; break; }
    }
    if (!p || (c.x === p.x && c.y === p.y)) return false;
    var r = d.getBoundingClientRect();
    if (c.y >= r.top) return false;                      /* already level with the menu */
    function side(ax, ay, bx, by, px, py){ return (bx - ax) * (py - ay) - (by - ay) * (px - ax); }
    var s1 = side(p.x, p.y, r.left, r.top, c.x, c.y),
        s2 = side(r.left, r.top, r.right, r.top, c.x, c.y),
        s3 = side(r.right, r.top, p.x, p.y, c.x, c.y);
    var neg = s1 < 0 || s2 < 0 || s3 < 0, pos = s1 > 0 || s2 > 0 || s3 > 0;
    return !(neg && pos);
  }
  /* The pointer is moving but this movement has no earlier point yet, so its
     direction is unknown: the first sample after a pause, when it starts on
     one button and lands on the next, or a start that has not left its pixel
     row yet (a level slide of more than 6px along the bar has a direction).
     Neither "aiming" nor "stopped". */
  function justStarted(){
    var n = aimTrail.length;
    if (!n) return false;
    var c = aimTrail[n - 1];
    if (Date.now() - c.t > 110) return false;            /* stopped, not starting */
    for (var i = 0; i < n - 1; i++) {
      if (c.t - aimTrail[i].t <= 120 && (aimTrail[i].y !== c.y || Math.abs(aimTrail[i].x - c.x) > 6)) return false;
    }
    return true;
  }
  /* keyboard focus (not a mouse click) is on a link inside el */
  function keyFocusIn(el){
    var a = document.activeElement;
    if (!a || a === document.body || !el.contains(a)) return false;
    try { return a.matches(':focus-visible'); } catch (_) { return false; }
  }
  document.querySelectorAll('.nav-item[data-drop]').forEach(function(item){
    var btn = item.querySelector('button');
    var drop = item.querySelector('.nav-drop');
    var closeTimer = null, openTimer = null, hoverOpened = false;
    /* a hover open is noted, so the click that follows can tell */
    function hoverOpenNow(){
      if (!item.classList.contains('open')) hoverOpened = true;
      open();
    }
    function open(){
      clearTimeout(closeTimer); clearTimeout(openTimer);
      if (item.classList.contains('open')) return;
      closeAllDrops(item);
      item.classList.add('open');
      btn.setAttribute('aria-expanded','true');
      fitDrop(drop);
    }
    function close(){
      clearTimeout(closeTimer); clearTimeout(openTimer);
      hoverOpened = false;
      item.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }
    /* Hover open waits while the pointer is only passing through on its way
       into another open menu, and while a movement has only just begun and
       its direction is not known yet. */
    function hoverOpen(e){
      /* pointerenter fires before the document pointermove for the same
         point, so record it here or the trail misses the entering point */
      if (e && e.clientX != null) trackAim(e);
      var other = document.querySelector('.nav-item.open');
      if (!other || other === item) { hoverOpenNow(); return; }
      if (!aimingAt(other) && !justStarted()) { hoverOpenNow(); return; }
      clearTimeout(openTimer);
      openTimer = setTimeout(function check(){
        if (!item.matches(':hover')) return;
        if (aimingAt(other)) { openTimer = setTimeout(check, 70); return; }
        hoverOpenNow();
      }, 70);
    }
    /* Hover close is forgiving: a short grace period for diagonal moves
       toward a link, never while the pointer is still over the item or its
       menu, never while it is heading into the menu, and never while
       keyboard focus is on one of its links (focusout below closes it once
       focus leaves). */
    function closeIfAway(){
      if (item.matches(':hover')) return;
      if (keyFocusIn(drop)) return;
      if (aimingAt(item)) { closeTimer = setTimeout(closeIfAway, 70); return; }
      close();
    }
    function hoverLeave(){
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      closeTimer = setTimeout(closeIfAway, 280);
    }
    /* Hover opens for a mouse or pen only: a tap fires the click below, so
       touch screens wide enough for this nav (tablets in landscape) do not
       open on the emulated hover and then close again on the same tap. */
    if (HAS_POINTER) {
      item.addEventListener('pointerenter', function(e){ if (e.pointerType !== 'touch') hoverOpen(e); });
      item.addEventListener('pointerleave', function(e){ if (e.pointerType !== 'touch') hoverLeave(); });
    } else {
      item.addEventListener('mouseenter', hoverOpen);
      item.addEventListener('mouseleave', hoverLeave);
    }
    /* The click toggles, except the first pointer click after a hover open
       (a mouse that moves in, settles and clicks, or a pen tap whose
       pointerenter has just opened it): that one keeps the menu open, and a
       second click closes it. Enter or Space on the button (detail 0) always
       toggles. */
    btn.addEventListener('click', function(e){
      if (!item.classList.contains('open')) { hoverOpened = false; open(); return; }
      if (e.detail !== 0 && hoverOpened) { hoverOpened = false; return; }
      close();
    });
    /* a link chosen in the menu closes it, so a same-page anchor does not
       leave the menu open over the section it scrolled to */
    drop.addEventListener('click', function(e){
      /* a modified click opens a new tab and leaves this page where it is: keep the menu */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.target.closest('a')) close();
    });
    item.addEventListener('focusout', function(e){
      if (e.relatedTarget && !item.contains(e.relatedTarget)) close();
    });
  });
  document.addEventListener('click', function(e){
    if (!e.target.closest('.nav-item[data-drop]')) closeAllDrops();
  });
  window.addEventListener('resize', function(){
    document.querySelectorAll('.nav-item.open .nav-drop').forEach(fitDrop);
  });

  /* mobile menu */
  var burger = document.getElementById('navBurger');
  var mmenu = document.getElementById('mobileMenu');
  function setMenu(on){
    if (!burger || !mmenu) return;
    if (on && document.querySelector('.pp-modal.show')) return;   /* never open behind a modal */
    if (on && nav) mmenu.style.paddingTop = Math.round(nav.getBoundingClientRect().bottom + 12) + 'px';
    /* keyboard focus scrolls links clear of the nav bar above the menu */
    mmenu.style.scrollPaddingTop = on ? mmenu.style.paddingTop : '';
    mmenu.classList.toggle('active', on);
    burger.classList.toggle('active', on);
    burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    document.body.style.overflow = on ? 'hidden' : '';
    if (nav) nav.classList.toggle('menu-open', on);
    /* The page behind the full-screen menu is inert while it is open, so Tab
       stays in the nav, the menu and (while it is on screen) the announcement
       bar. Only what this sets is cleared again. */
    Array.prototype.forEach.call(document.body.children, function(el){
      if (on) {
        if (el === nav || el === mmenu || el.hasAttribute('inert')) return;
        if (el.classList.contains('announce') && el.getBoundingClientRect().bottom > 0) return;
        el.setAttribute('inert', ''); el.setAttribute('data-mm-inert', '');
      } else if (el.hasAttribute('data-mm-inert')) {
        el.removeAttribute('inert'); el.removeAttribute('data-mm-inert');
      }
    });
  }
  if (burger && mmenu) {
    burger.addEventListener('click', function(){ setMenu(!mmenu.classList.contains('active')); });
    mmenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(e){
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   /* new tab: keep the menu */
        setMenu(false);
      });
    });
    /* rotating a tablet past the breakpoint hides the burger: close the menu */
    if (window.matchMedia) {
      var desk = window.matchMedia('(min-width:1081px)');
      var onDesk = function(e){ if (e.matches && mmenu.classList.contains('active')) setMenu(false); };
      if (desk.addEventListener) desk.addEventListener('change', onDesk); else if (desk.addListener) desk.addListener(onDesk);
    }
  }

  /* reveal on scroll */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* ---------------- Modals ---------------- */
  var lastFocus = null;
  function openModal(id){
    var m = document.getElementById(id);
    if (!m) return;
    /* opened from the nav bar over the mobile menu: close the menu so the
       page (and this modal) is no longer inert */
    if (mmenu && mmenu.classList.contains('active')) setMenu(false);
    lastFocus = document.activeElement;
    m.classList.add('show');
    m.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    var x = m.querySelector('.pp-modal-close');
    if (x) setTimeout(function(){ try { x.focus({ preventScroll:true }); } catch (err) { x.focus(); } }, 30);
    if (id === 'ppDemoModal') {
      var f = document.getElementById('ppDemoFrame');
      var l = document.getElementById('ppDemoLoading');
      if (f && f.dataset.src && !f.src) {
        f.src = f.dataset.src;
        f.addEventListener('load', function(){ if (l) l.style.display='none'; f.style.display='block'; }, { once:true });
        setTimeout(function(){ if (l && l.style.display !== 'none'){ l.style.display='none'; f.style.display='block'; } }, 3500);
      } else if (f && f.src) {
        if (l) l.style.display='none';
        f.style.display='block';
      }
    }
  }
  function closeModal(m){
    if (typeof m === 'string') m = document.getElementById(m);
    if (!m) return;
    m.classList.remove('show');
    m.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    /* a trigger inside the (now closed) mobile menu is not rendered: hand focus to the burger */
    var back = lastFocus;
    if (back && back.getClientRects && !back.getClientRects().length && burger && burger.getClientRects().length) back = burger;
    if (back && back.focus) { try { back.focus({ preventScroll:true }); } catch (err) {} }
    lastFocus = null;
  }
  /* The one download modal: the same builds from every trigger. */
  function openDownload(){
    var m = document.getElementById('ppDownloadModal');
    hydrate(m);
    openModal('ppDownloadModal');
  }

  /* Globals kept for compatibility with older inline handlers: both download
     openers open the same modal with the same builds. */
  window.openDemoModal = function(e){ if(e && e.preventDefault) e.preventDefault(); openModal('ppDemoModal'); };
  window.closeDemoModal = function(){ closeModal('ppDemoModal'); };
  window.openDownloadModal = function(e){ if(e && e.preventDefault) e.preventDefault(); openDownload(); };
  window.closeDownloadModal = function(){ closeModal('ppDownloadModal'); };
  window.openFamilyDownloadModal = function(e){ if(e && e.preventDefault) e.preventDefault(); openDownload(); };
  window.closeFamilyDownloadModal = function(){ closeModal('ppDownloadModal'); };

  /* Read-only view of the download config for page scripts. */
  window.PPDownloads = {
    version: DOWNLOADS.version,
    device: DEVICE,
    hrefFor: function(key){ return hrefFor(key); }
  };

  document.addEventListener('click', function(e){
    if (e.target.classList && e.target.classList.contains('pp-modal')) closeModal(e.target);
    var x = e.target.closest ? e.target.closest('[data-modal-close]') : null;
    if (x) { var m = x.closest('.pp-modal'); if (m) closeModal(m); }
  });
  /* the demo modal's calendar iframe takes Tab itself, so focus can leave the
     modal from inside it: bring it back to Close */
  document.addEventListener('focusin', function(e){
    var om = document.querySelector('.pp-modal.show');
    if (!om || om.contains(e.target)) return;
    var x = om.querySelector('.pp-modal-close');
    if (x) { try { x.focus({ preventScroll:true }); } catch (err) { x.focus(); } }
  });
  document.addEventListener('keydown', function(e){
    /* Tab stays inside an open modal */
    if (e.key === 'Tab') {
      var om = document.querySelector('.pp-modal.show');
      if (!om) return;
      var f = [].filter.call(om.querySelectorAll('a[href],button,iframe,[tabindex]:not([tabindex="-1"])'), function(el){ return el.getClientRects().length; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (!om.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.pp-modal.show').forEach(closeModal);
    var inDrop = document.activeElement && document.activeElement.closest &&
      document.activeElement.closest('.nav-item.open');
    closeAllDrops();
    if (inDrop) { var ib = inDrop.querySelector('button'); if (ib) ib.focus(); }
    if (mmenu && mmenu.classList.contains('active')) { setMenu(false); if (burger) burger.focus(); }
  });

  /* copy buttons */
  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('[data-cli-copy]') : null;
    if (!btn) return;
    var txt = btn.getAttribute('data-cli-copy');
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
    var old = btn.textContent; btn.textContent = 'Copied!';
    setTimeout(function(){ btn.textContent = old; }, 1400);
  });

  /* bind demo + download triggers. A modified click (new tab, new window) on
     a trigger with a real href follows the link (download.html) instead. */
  function modified(e, el){
    var h = el.getAttribute && el.getAttribute('href');
    return (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && h && h.charAt(0) !== '#';
  }
  document.addEventListener('click', function(e){
    if (!e.target.closest) return;
    var demo = e.target.closest('[data-cta="demo"], a[href="#demo"], a[href="#book-demo"]');
    if (demo) { e.preventDefault(); openModal('ppDemoModal'); return; }
    var dl = e.target.closest('[data-cta="download"], [data-cta="family-download"], a[href="#download"], a[href="#family-download"]');
    if (dl) {
      if (modified(e, dl)) return;
      e.preventDefault();
      openDownload();
    }
  });

  /* newsletter → mailto fallback */
  document.addEventListener('submit', function(e){
    var f = e.target.closest ? e.target.closest('[data-newsletter]') : null;
    if (!f) return;
    e.preventDefault();
    var email = f.querySelector('input[type="email"]');
    var v = email ? email.value : '';
    location.href = 'mailto:hello@privacypal.ai?subject=' + encodeURIComponent('Newsletter signup') +
      '&body=' + encodeURIComponent('Please add ' + v + ' to the PrivacyPal newsletter.');
  });
})();
