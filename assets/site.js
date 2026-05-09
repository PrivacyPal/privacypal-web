/* Shared nav + footer injected by JS to keep pages lean */
(function(){
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const onDark = document.body.classList.contains('nav-on-dark');

  const navHTML = `
  <nav class="site-nav ${onDark ? 'on-dark' : ''}" id="siteNav">
    <div class="nav-inner">
      <a class="nav-logo" href="index.html"><img src="assets/logo-color.png" alt="PrivacyPal" class="logo-light-img"><img src="privacypal-logo-light.png" alt="PrivacyPal" class="logo-dark-img"></a>
      <div class="nav-links">
        <div class="dropdown">
          <span>Products</span>
          <div class="dropdown-menu">
            <a href="privacypal-pro.html"><b>PrivacyPal Pro</b><small>For SME teams, firms & agencies</small></a>
            <a href="privacypal-cloud.html"><b>PrivacyPal Cloud</b><small>Self-hosted gateway for your infra</small></a>
          </div>
        </div>
        <div class="dropdown">
          <span>Solutions</span>
          <div class="dropdown-menu">
            <a href="banking.html">Banking</a>
            <a href="healthcare.html">Healthcare</a>
            <a href="legal.html">Legal</a>
            <a href="telecommunications.html">Telco</a>
            <a href="technology.html">Technology</a>
          </div>
        </div>
        <div class="dropdown">
          <span>Company</span>
          <div class="dropdown-menu">
            <a href="about.html"><b>About</b><small>Our story & mission</small></a>
            <a href="team.html"><b>Team</b><small>The people behind PrivacyPal</small></a>
            <a href="developers.html"><b>Developers</b><small>Docs, SDKs, API reference</small></a>
          </div>
        </div>
        <a class="nav-link" href="index.html#pricing">Pricing</a>
        <a class="nav-cta" href="index.html#download">Download</a>
      </div>
      <button class="hamburger" id="hamb" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </nav>
  <div class="mobile-menu" id="mmenu">
    <a href="privacypal-pro.html">PrivacyPal Pro</a>
    <a href="privacypal-cloud.html">PrivacyPal Cloud</a>
    <a href="banking.html">Solutions</a>
    <a href="about.html">About</a>
    <a href="team.html">Team</a>
    <a href="developers.html">Developers</a>
    <a href="index.html#pricing">Pricing</a>
    <a href="index.html#download">Download</a>
  </div>`;

  const footerHTML = `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="assets/logo-color.png" alt="PrivacyPal">
          <p>Use any AI. Keep what's yours, yours. PrivacyPal creates Privacy Twins for your sensitive data — so every prompt, file, and connected source is safe before it ever leaves your device.</p>
        </div>
        <div class="footer-col">
          <h5>Products</h5>
          <a href="privacypal-pro.html">PrivacyPal Pro</a>
          <a href="privacypal-cloud.html">PrivacyPal Cloud</a>
        </div>
        <div class="footer-col">
          <h5>Solutions</h5>
          <a href="banking.html">Banking</a>
          <a href="healthcare.html">Healthcare</a>
          <a href="legal.html">Legal</a>
          <a href="telecommunications.html">Telco</a>
          <a href="technology.html">Technology</a>
        </div>
        <div class="footer-col">
          <h5>Company</h5>
          <a href="about.html">About</a>
          <a href="team.html">Team</a>
          <a href="developers.html">Developers</a>
          <a href="index.html#pricing">Pricing</a>
          <a href="mailto:hello@privacypal.ai">Contact</a>
        </div>
        <div class="footer-col">
          <h5>Legal</h5>
          <a href="privacy.html">Privacy Policy</a>
          <a href="terms.html">Terms of Service</a>
          <a href="privacy.html#dpa">DPA</a>
          <a href="privacy.html#security">Security</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 PrivacyPal — Safe AI, Anywhere.</span>
        <span><a href="mailto:hello@privacypal.ai">hello@privacypal.ai</a></span>
      </div>
    </div>
  </footer>`;

  // shared modals (demo + download)
  const modalsHTML = `
  <div class="pp-modal" id="ppDemoModal" aria-hidden="true">
    <div class="pp-modal-card demo" role="dialog" aria-modal="true" aria-label="Book a Demo">
      <div class="pp-modal-head">
        <h3>Book a Demo</h3>
        <button class="pp-modal-close" type="button" data-modal-close aria-label="Close">&times;</button>
      </div>
      <div class="pp-modal-body">
        <div class="pp-modal-loading" id="ppDemoLoading"><div class="pp-spinner"></div>Loading…</div>
        <iframe id="ppDemoFrame" data-src="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0en3ttxqL4LChfrMDCbYeqxtKuKXOR4YRnGz0Sfg0RIwh7nO51zW3MqxBnQzAVcSkQoy3_6UJZ?gv=true" style="display:none"></iframe>
      </div>
    </div>
  </div>
  <div class="pp-modal" id="ppDownloadModal" aria-hidden="true">
    <div class="pp-modal-card dl" role="dialog" aria-modal="true" aria-label="Download PrivacyPal">
      <div class="pp-modal-head">
        <h3>Download PrivacyPal · v1.8.2</h3>
        <button class="pp-modal-close" type="button" data-modal-close aria-label="Close">&times;</button>
      </div>
      <div class="pp-modal-body">
        <div class="pp-dl-grid">
          <div class="pp-dl-card win">
            <div class="pp-dl-row">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 4.5L10.5 3.5V11H3V4.5ZM11.5 3.35L21 2V11H11.5V3.35ZM3 12H10.5V20.5L3 19.5V12ZM11.5 12H21V22L11.5 20.65V12Z"/></svg>
              <span class="label">Microsoft · Windows 11</span>
            </div>
            <h4>Windows 11</h4>
            <p>Run PrivacyPal on your PC with a full installer. Optimized for the Windows 11 experience.</p>
            <div class="pp-dl-pills"><span class="pp-dl-pill">64-bit</span><span class="pp-dl-pill">.exe installer</span><span class="pp-dl-pill">Windows 11</span></div>
            <a class="pp-dl-btn win" href="https://privacypal-production-desktop-596719033801.s3.us-east-1.amazonaws.com/proxy/windows/PrivacyPal-Setup-1.8.2.exe" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 4.5L10.5 3.5V11H3V4.5ZM11.5 3.35L21 2V11H11.5V3.35ZM3 12H10.5V20.5L3 19.5V12ZM11.5 12H21V22L11.5 20.65V12Z"/></svg>
              Download for Windows
            </a>
            <p class="pp-dl-filename">PrivacyPal-Setup-1.8.2.exe</p>
            <div class="pp-dl-cli">
              <div class="cli-label">Or install via PowerShell</div>
              <div class="cli-block"><span><span class="prompt">&gt;</span>winget install PrivacyPal.AI</span>
                <button class="cli-copy" type="button" data-cli-copy="winget install PrivacyPal.AI">Copy</button>
              </div>
            </div>
          </div>
          <div class="pp-dl-card mac">
            <div class="pp-dl-row">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              <span class="label">Apple · macOS</span>
            </div>
            <h4>macOS</h4>
            <p>Native support for Apple Silicon and Intel Macs. Choose your chip and install in seconds.</p>
            <div class="pp-dl-pills"><span class="pp-dl-pill">.dmg installer</span><span class="pp-dl-pill">Apple Silicon &amp; Intel</span><span class="pp-dl-pill">macOS 13+</span></div>
            <div class="pp-dl-btn mac coming">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Coming Soon
            </div>
            <p class="pp-dl-filename" style="opacity:.7">PrivacyPal.dmg — landing soon</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // inject
  const navHolder = document.getElementById('site-nav-slot');
  const footHolder = document.getElementById('site-footer-slot');
  if (navHolder) navHolder.outerHTML = navHTML;
  if (footHolder) footHolder.outerHTML = footerHTML;
  // append modals to body once
  if (!document.getElementById('ppDemoModal')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = modalsHTML;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  // nav behavior
  const nav = document.getElementById('siteNav');
  const onScroll = () => { if (window.scrollY > 12) nav.classList.add('scrolled'); else nav.classList.remove('scrolled'); };
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();

  // hamburger
  const hamb = document.getElementById('hamb');
  const mmenu = document.getElementById('mmenu');
  if (hamb) hamb.addEventListener('click', () => { hamb.classList.toggle('active'); mmenu.classList.toggle('active'); });
  if (mmenu) mmenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { hamb.classList.remove('active'); mmenu.classList.remove('active'); }));

  // reveal observer
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }});
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ---- modal helpers ----
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('show');
    m.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    // lazy-load demo iframe on first open
    if (id === 'ppDemoModal') {
      const f = document.getElementById('ppDemoFrame');
      const l = document.getElementById('ppDemoLoading');
      if (f && f.dataset.src && !f.src) {
        f.src = f.dataset.src;
        f.addEventListener('load', () => {
          if (l) l.style.display = 'none';
          f.style.display = 'block';
        }, { once:true });
        setTimeout(() => {
          if (l && l.style.display !== 'none') { l.style.display='none'; f.style.display='block'; }
        }, 3500);
      } else if (f && f.src) {
        if (l) l.style.display = 'none';
        f.style.display = 'block';
      }
    }
  }
  function closeModal(m) {
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

  // delegate close-on-overlay/X and ESC
  document.addEventListener('click', function(e){
    if (e.target.classList && e.target.classList.contains('pp-modal')) closeModal(e.target);
    if (e.target.matches('[data-modal-close]')) {
      const m = e.target.closest('.pp-modal'); if (m) closeModal(m);
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') {
      document.querySelectorAll('.pp-modal.show').forEach(closeModal);
    }
  });

  // CLI copy buttons
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-cli-copy]');
    if (!btn) return;
    const txt = btn.getAttribute('data-cli-copy');
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
    const old = btn.textContent; btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = old; }, 1400);
  });

  // Auto-bind demo + download triggers across the site
  function bindCtas(){
    const demoSelectors = '[data-cta="demo"], a.book-demo, a[href="#demo"], a[href="#book-demo"]';
    document.querySelectorAll(demoSelectors).forEach(el => {
      if (el.dataset.ppBound) return; el.dataset.ppBound = '1';
      el.addEventListener('click', e => { e.preventDefault(); openModal('ppDemoModal'); });
    });
    const dlSelectors = '[data-cta="download"], a[href="#download"], a[href="desktop.html"]';
    document.querySelectorAll(dlSelectors).forEach(el => {
      if (el.dataset.ppBound) return; el.dataset.ppBound = '1';
      el.addEventListener('click', e => { e.preventDefault(); openModal('ppDownloadModal'); });
    });
  }
  bindCtas();
})();
