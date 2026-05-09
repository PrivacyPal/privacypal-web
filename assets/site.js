/* Shared nav + footer injected by JS to keep pages lean */
(function(){
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const onDark = document.body.classList.contains('nav-on-dark');

  const navHTML = `
  <nav class="site-nav ${onDark ? 'on-dark' : ''}" id="siteNav">
    <div class="nav-inner">
      <a class="nav-logo" href="index.html"><img src="assets/logo-color.png" alt="PrivacyPal" class="logo-light-img"><img src="privacypal-logo-light.png" alt="PrivacyPal" class="logo-dark-img" style="display:none"></a>
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

  // inject
  const navHolder = document.getElementById('site-nav-slot');
  const footHolder = document.getElementById('site-footer-slot');
  if (navHolder) navHolder.outerHTML = navHTML;
  if (footHolder) footHolder.outerHTML = footerHTML;

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
})();
