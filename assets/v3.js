/* PrivacyPal v3 — shared announcement bar, nav, footer, modals & behaviors.
   Injected by JS to keep pages lean (same pattern as the current site). */
(function(){

  var DOWNLOAD_WIN = 'https://privacypal-production-desktop-596719033801.s3.us-east-1.amazonaws.com/proxy/windows/PrivacyPal-Setup-1.8.10.exe';
  var DOWNLOAD_MACOS_ARM64 = 'https://privacypal-production-desktop-596719033801.s3.us-east-1.amazonaws.com/proxy/macos/PrivacyPal-1.8.10-arm64.dmg';
  var DOWNLOAD_MACOS_X64 = 'https://privacypal-production-desktop-596719033801.s3.us-east-1.amazonaws.com/proxy/macos/PrivacyPal-1.8.10-x64.dmg';

  /* Social profiles — update these when handles are confirmed. */
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
    extLink: '<svg class="ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>'
  };

  function social(cls){
    return '<a href="' + SOCIAL.github + '" target="_blank" rel="noopener" aria-label="GitHub">' + ICONS.github + '</a>' +
           '<a href="' + SOCIAL.linkedin + '" target="_blank" rel="noopener" aria-label="LinkedIn">' + ICONS.linkedin + '</a>' +
           '<a href="' + SOCIAL.x + '" target="_blank" rel="noopener" aria-label="X (Twitter)">' + ICONS.x + '</a>' +
           '<a href="' + SOCIAL.youtube + '" target="_blank" rel="noopener" aria-label="YouTube">' + ICONS.youtube + '</a>';
  }

  /* ---------------- Announcement bar ---------------- */
  var announceHTML =
  '<div class="announce">' +
    '<a href="#" data-cta="download"><span class="tag">New</span> PrivacyPal v1.8.10 is out for Mac &amp; Windows — Install now <span class="arrow">→</span></a>' +
  '</div>';

  /* ---------------- Nav ---------------- */
  var navHTML =
  '<nav class="site-nav" id="siteNav" aria-label="Main">' +
    '<div class="nav-inner">' +
      '<a class="nav-logo" href="index.html"><img src="assets/logo-color.png" alt="PrivacyPal"></a>' +

      '<div class="nav-menu" id="navMenu">' +

        '<div class="nav-item" data-drop>' +
          '<button type="button" aria-expanded="false">Product <span class="caret"></span></button>' +
          '<div class="nav-drop">' +
            '<div class="nav-group">' +
              '<h6>Platform</h6>' +
              '<a href="device-control.html"><b>On-Device Protection</b><small>Real-time interception across every AI app</small></a>' +
              '<a href="ai-dspm.html"><b>AI-DSPM</b><small>On-device + network data security posture</small></a>' +
              '<a href="privacy-twins.html"><b>Privacy Twins</b><small>Synthetic substitution — no blunt redaction</small></a>' +
              '<a href="privacypal-ai.html"><b>Agent Governance</b><small>Claude Code, Copilot &amp; MCP under control</small></a>' +
            '</div>' +
            '<div class="nav-group">' +
              '<h6>Editions</h6>' +
              '<a href="privacypal-pro.html"><b>PrivacyPal Pro</b><small>SME governance for firms &amp; growing teams</small></a>' +
              '<a href="privacypal-max.html"><b>PrivacyPal Max</b><small>Agentic privacy &amp; enterprise AI enablement</small></a>' +
              '<a href="privacypal-cloud.html"><b>PrivacyPal Cloud</b><small>Self-hosted gateway for sovereign infra</small></a>' +
              '<a href="developers.html"><b>PrivacyPal SDK</b><small>Agent-to-agent governance for developers</small></a>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="nav-item" data-drop>' +
          '<button type="button" aria-expanded="false">Solutions <span class="caret"></span></button>' +
          '<div class="nav-drop">' +
            '<div class="nav-group">' +
              '<h6>By industry</h6>' +
              '<a href="banking.html"><b>Banking</b><small>Community banks, credit unions &amp; wealth</small></a>' +
              '<a href="healthcare.html"><b>Healthcare</b><small>Clinics, therapists &amp; specialist practices</small></a>' +
              '<a href="legal.html"><b>Legal</b><small>Law firms, in-house counsel &amp; paralegals</small></a>' +
              '<a href="telecommunications.html"><b>Telco</b><small>Carriers &amp; MSPs with subscriber data</small></a>' +
              '<a href="technology.html"><b>Technology</b><small>SaaS teams shipping AI on customer data</small></a>' +
            '</div>' +
            '<div class="nav-group">' +
              '<h6>By team</h6>' +
              '<a href="privacypal-pro.html"><b>For growing teams</b><small>Install once, govern every AI — Pro</small></a>' +
              '<a href="privacypal-max.html"><b>For AI-native enterprise</b><small>Agents, connections &amp; DSPM — Max</small></a>' +
              '<a href="privacypal-cloud.html"><b>For regulated &amp; sovereign</b><small>Your VPC, your keys — Cloud</small></a>' +
              '<a href="developers.html"><b>For developers</b><small>Govern your own agents — SDK</small></a>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="nav-item"><a href="https://privacypal.ai/documentation/sdk/" target="_blank" rel="noopener">Docs ' + ICONS.extLink + '</a></div>' +

        '<div class="nav-item" data-drop>' +
          '<button type="button" aria-expanded="false">Company <span class="caret"></span></button>' +
          '<div class="nav-drop">' +
            '<div class="nav-group">' +
              '<a href="about.html"><b>About us</b><small>Mission &amp; the AI OS vision</small></a>' +
              '<a href="team.html"><b>Team</b><small>The people behind PrivacyPal</small></a>' +
              '<a href="news.html"><b>Newsroom</b><small>News, press &amp; happenings</small></a>' +
              '<a href="events.html"><b>Events</b><small>Where to find us next</small></a>' +
              '<a href="contact.html"><b>Contact</b><small>Talk to a human</small></a>' +
            '</div>' +
            '<a class="nav-feature" href="careers.html">' +
              '<img src="assets/hero-shot-about.png" alt="" loading="lazy">' +
              '<span class="cap"><b>We&rsquo;re hiring</b><small>Build the trust layer for AI →</small></span>' +
            '</a>' +
          '</div>' +
        '</div>' +

        '<div class="nav-item"><a href="blog.html">Blog</a></div>' +
        '<div class="nav-item"><a href="pricing.html">Pricing</a></div>' +
      '</div>' +

      '<div class="nav-right">' +
        '<div class="nav-social">' + social() + '</div>' +
        '<a class="nav-signin" href="https://portal.privacypal.ai" target="_blank" rel="noopener">Sign in</a>' +
        '<a class="btn btn-ghost" href="#" data-cta="demo">Book a demo</a>' +
        '<a class="btn btn-primary" href="#" data-cta="download">Install</a>' +
        '<button class="nav-burger" id="navBurger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '</div>' +
    '</div>' +
  '</nav>' +

  '<div class="mobile-menu" id="mobileMenu">' +
    '<h6>Platform</h6>' +
    '<a href="device-control.html">On-Device Protection</a>' +
    '<a href="ai-dspm.html">AI-DSPM</a>' +
    '<a href="privacy-twins.html">Privacy Twins</a>' +
    '<a href="privacypal-ai.html">Agent Governance</a>' +
    '<h6>Editions</h6>' +
    '<a href="privacypal-pro.html">PrivacyPal Pro</a>' +
    '<a href="privacypal-max.html">PrivacyPal Max</a>' +
    '<a href="privacypal-cloud.html">PrivacyPal Cloud</a>' +
    '<a href="developers.html">PrivacyPal SDK</a>' +
    '<h6>Solutions</h6>' +
    '<a href="banking.html">Banking</a>' +
    '<a href="healthcare.html">Healthcare</a>' +
    '<a href="legal.html">Legal</a>' +
    '<a href="telecommunications.html">Telco</a>' +
    '<a href="technology.html">Technology</a>' +
    '<h6>Company</h6>' +
    '<a href="about.html">About us</a>' +
    '<a href="team.html">Team</a>' +
    '<a href="blog.html">Blog</a>' +
    '<a href="news.html">Newsroom</a>' +
    '<a href="events.html">Events</a>' +
    '<a href="careers.html">Careers</a>' +
    '<a href="contact.html">Contact</a>' +
    '<h6>More</h6>' +
    '<a href="pricing.html">Pricing</a>' +
    '<a href="https://privacypal.ai/documentation/sdk/" target="_blank" rel="noopener">Docs</a>' +
    '<a href="https://portal.privacypal.ai" target="_blank" rel="noopener">Sign in</a>' +
    '<div class="mm-ctas">' +
      '<a class="btn btn-ghost" href="#" data-cta="demo">Book a demo</a>' +
      '<a class="btn btn-primary" href="#" data-cta="download">Install</a>' +
    '</div>' +
    '<div class="mm-social">' + social() + '</div>' +
  '</div>';

  /* ---------------- Footer ---------------- */
  var footerHTML =
  '<footer class="site-footer">' +
    '<div class="footer-inner">' +
      '<div class="footer-grid">' +
        '<div class="footer-col">' +
          '<h5>Product</h5>' +
          '<a href="device-control.html">On-Device Protection</a>' +
          '<a href="ai-dspm.html">AI-DSPM</a>' +
          '<a href="privacy-twins.html">Privacy Twins</a>' +
          '<a href="privacypal-ai.html">Agent Governance</a>' +
          '<a href="privacypal-pro.html">PrivacyPal Pro</a>' +
          '<a href="privacypal-max.html">PrivacyPal Max</a>' +
          '<a href="privacypal-cloud.html">PrivacyPal Cloud</a>' +
          '<a href="developers.html">PrivacyPal SDK</a>' +
          '<a href="pricing.html">Pricing</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h5>Solutions</h5>' +
          '<a href="banking.html">Banking</a>' +
          '<a href="healthcare.html">Healthcare</a>' +
          '<a href="legal.html">Legal</a>' +
          '<a href="telecommunications.html">Telco</a>' +
          '<a href="technology.html">Technology</a>' +
          '<a href="privacypal-cloud.html">For Enterprise</a>' +
          '<a href="install.html">Install guide</a>' +
          '<a href="desktop.html">Desktop app</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h5>Resources</h5>' +
          '<a href="https://privacypal.ai/documentation/sdk/" target="_blank" rel="noopener">Documentation</a>' +
          '<a href="blog.html">The Privacy Log</a>' +
          '<a href="news.html">Newsroom</a>' +
          '<a href="events.html">Events</a>' +
          '<a href="https://portal.privacypal.ai" target="_blank" rel="noopener">User Portal</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h5>Company</h5>' +
          '<a href="about.html">About us</a>' +
          '<a href="team.html">Team</a>' +
          '<a href="careers.html">Careers <small>HIRING</small></a>' +
          '<a href="contact.html">Contact</a>' +
          '<a href="privacy.html">Privacy Policy</a>' +
          '<a href="terms.html">Terms of Service</a>' +
          '<a href="privacy.html#dpa">DPA</a>' +
          '<a href="privacy.html#security">Security</a>' +
        '</div>' +
        '<div class="footer-news">' +
          '<h5>Weekly newsletter</h5>' +
          '<p>The Privacy Log in your inbox — AI governance, on-device privacy and what the agentic shift means for your data. No spam, ever.</p>' +
          '<form action="mailto:hello@privacypal.ai" method="get" data-newsletter>' +
            '<input type="email" name="subject" placeholder="you@company.com" aria-label="Email address" required>' +
            '<button class="btn btn-primary" type="submit">Subscribe</button>' +
          '</form>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<a class="foot-logo" href="index.html"><img src="assets/logo-color.png" alt="PrivacyPal"></a>' +
        '<div class="footer-social">' + social() + '</div>' +
        '<div class="footer-legal">' +
          '<span>© 2026 PrivacyPal — Governance for the AI Operating System.</span>' +
          '<a href="privacy.html">Privacy</a>' +
          '<a href="terms.html">Terms</a>' +
          '<a href="mailto:hello@privacypal.ai">hello@privacypal.ai</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</footer>';

  /* ---------------- Shared modals (demo + download) ---------------- */
  var modalsHTML =
  '<div class="pp-modal" id="ppDemoModal" aria-hidden="true">' +
    '<div class="pp-modal-card demo" role="dialog" aria-modal="true" aria-label="Book a Demo">' +
      '<div class="pp-modal-head"><h3>Book a demo</h3>' +
      '<button class="pp-modal-close" type="button" data-modal-close aria-label="Close">&times;</button></div>' +
      '<div class="pp-modal-body">' +
        '<div class="pp-modal-loading" id="ppDemoLoading"><div class="pp-spinner"></div>Loading…</div>' +
        '<iframe id="ppDemoFrame" title="Book a demo" data-src="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0en3ttxqL4LChfrMDCbYeqxtKuKXOR4YRnGz0Sfg0RIwh7nO51zW3MqxBnQzAVcSkQoy3_6UJZ?gv=true" style="display:none"></iframe>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="pp-modal" id="ppDownloadModal" aria-hidden="true">' +
    '<div class="pp-modal-card dl" role="dialog" aria-modal="true" aria-label="Install PrivacyPal">' +
      '<div class="pp-modal-head"><h3>Install PrivacyPal · v1.8.10</h3>' +
      '<button class="pp-modal-close" type="button" data-modal-close aria-label="Close">&times;</button></div>' +
      '<div class="pp-modal-body">' +
        '<div class="pp-dl-grid">' +
          '<div class="pp-dl-card win">' +
            '<div class="pp-dl-row"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 4.5L10.5 3.5V11H3V4.5ZM11.5 3.35L21 2V11H11.5V3.35ZM3 12H10.5V20.5L3 19.5V12ZM11.5 12H21V22L11.5 20.65V12Z"/></svg><span class="label">Microsoft · Windows 11</span></div>' +
            '<h4>Windows 11</h4>' +
            '<p>Run PrivacyPal on your PC with a full installer. Optimized for the Windows 11 experience.</p>' +
            '<div class="pp-dl-pills"><span class="pp-dl-pill">64-bit</span><span class="pp-dl-pill">.exe installer</span><span class="pp-dl-pill">Windows 11</span></div>' +
            '<a class="pp-dl-btn win" href="' + DOWNLOAD_WIN + '" rel="noopener noreferrer">Install for Windows</a>' +
            '<p class="pp-dl-filename">PrivacyPal-Setup-1.8.10.exe</p>' +
            '<div class="pp-dl-cli"><div class="cli-label">Or install via PowerShell</div>' +
            '<div class="cli-block"><span><span class="prompt">&gt;</span>winget install PrivacyPal.AI</span>' +
            '<button class="cli-copy" type="button" data-cli-copy="winget install PrivacyPal.AI">Copy</button></div></div>' +
          '</div>' +
          '<div class="pp-dl-card mac">' +
            '<div class="pp-dl-row"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg><span class="label">Apple · macOS</span></div>' +
            '<h4>macOS</h4>' +
            '<p>Native builds for Apple Silicon and Intel Macs. Pick the architecture that matches your chip.</p>' +
            '<div class="pp-dl-pills"><span class="pp-dl-pill">.dmg installer</span><span class="pp-dl-pill">M1–M5+</span><span class="pp-dl-pill">macOS 13+</span></div>' +
            '<a class="pp-dl-btn mac" href="' + DOWNLOAD_MACOS_ARM64 + '" rel="noopener noreferrer">Apple Silicon</a>' +
            '<a class="pp-dl-btn mac mac-secondary" href="' + DOWNLOAD_MACOS_X64 + '" rel="noopener noreferrer">Intel Mac</a>' +
            '<p class="pp-dl-arch-hint">Not sure which? Open the Apple menu → <b>About This Mac</b> and read the <b>Chip</b> line — anything M-series is Apple Silicon.</p>' +
            '<p class="pp-dl-filename">PrivacyPal-1.8.10-{arm64,x64}.dmg</p>' +
          '</div>' +
        '</div>' +
        '<div class="pp-dl-trust">' +
          '<div class="pp-dl-trust-card"><span class="pp-dl-trust-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span>' +
          '<div class="pp-dl-trust-body"><h5>Signed &amp; notarized</h5><p>Notarized by Apple. Trusted publisher on Windows. No scary first-launch dialogs.</p></div></div>' +
          '<div class="pp-dl-trust-card"><span class="pp-dl-trust-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg></span>' +
          '<div class="pp-dl-trust-body"><h5>Live in a minute</h5><p>Drop into Applications, sign in, and your AI guardrails work everywhere — no setup.</p></div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

  /* ---------------- Inject ---------------- */
  var navHolder = document.getElementById('site-nav-slot');
  var footHolder = document.getElementById('site-footer-slot');
  if (navHolder) navHolder.outerHTML = announceHTML + navHTML;
  if (footHolder) footHolder.outerHTML = footerHTML;
  if (!document.getElementById('ppDemoModal')) {
    var wrap = document.createElement('div');
    wrap.innerHTML = modalsHTML;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  /* ---------------- Nav behavior ---------------- */
  var nav = document.getElementById('siteNav');
  if (nav) {
    var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive:true }); onScroll();
  }

  /* dropdowns: open on hover (desktop) and on click */
  document.querySelectorAll('.nav-item[data-drop]').forEach(function(item){
    var btn = item.querySelector('button');
    var closeTimer = null;
    function open(){
      clearTimeout(closeTimer);
      document.querySelectorAll('.nav-item.open').forEach(function(o){ if (o !== item) o.classList.remove('open'); });
      item.classList.add('open');
      btn.setAttribute('aria-expanded','true');
    }
    function close(){
      item.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', function(){ closeTimer = setTimeout(close, 120); });
    btn.addEventListener('click', function(){ item.classList.contains('open') ? close() : open(); });
  });
  document.addEventListener('click', function(e){
    if (!e.target.closest('.nav-item[data-drop]')) {
      document.querySelectorAll('.nav-item.open').forEach(function(o){
        o.classList.remove('open');
        var b = o.querySelector('button'); if (b) b.setAttribute('aria-expanded','false');
      });
    }
  });

  /* mobile menu */
  var burger = document.getElementById('navBurger');
  var mmenu = document.getElementById('mobileMenu');
  if (burger && mmenu) {
    burger.addEventListener('click', function(){
      var on = mmenu.classList.toggle('active');
      burger.classList.toggle('active', on);
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
      document.body.style.overflow = on ? 'hidden' : '';
    });
    mmenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        mmenu.classList.remove('active'); burger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  /* reveal on scroll */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* ---------------- Modals ---------------- */
  function openModal(id){
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add('show');
    m.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
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
  }
  window.openDemoModal = function(e){ if(e) e.preventDefault(); openModal('ppDemoModal'); };
  window.closeDemoModal = function(){ closeModal('ppDemoModal'); };
  window.openDownloadModal = function(e){ if(e) e.preventDefault(); openModal('ppDownloadModal'); };
  window.closeDownloadModal = function(){ closeModal('ppDownloadModal'); };

  document.addEventListener('click', function(e){
    if (e.target.classList && e.target.classList.contains('pp-modal')) closeModal(e.target);
    var x = e.target.closest ? e.target.closest('[data-modal-close]') : null;
    if (x) { var m = x.closest('.pp-modal'); if (m) closeModal(m); }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') document.querySelectorAll('.pp-modal.show').forEach(closeModal);
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

  /* bind demo + download triggers */
  document.addEventListener('click', function(e){
    var demo = e.target.closest ? e.target.closest('[data-cta="demo"], a[href="#demo"], a[href="#book-demo"]') : null;
    if (demo) { e.preventDefault(); openModal('ppDemoModal'); return; }
    var dl = e.target.closest ? e.target.closest('[data-cta="download"], a[href="#download"]') : null;
    if (dl) { e.preventDefault(); openModal('ppDownloadModal'); }
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
