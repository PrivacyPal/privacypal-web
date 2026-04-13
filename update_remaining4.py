"""
Updates the 4 remaining pages:
- desktop.html   - has multi-line nav CSS, old dropdowns, hamburger/mobile, white footer
- install.html   - has simple multi-line nav CSS (no dropdowns, no hamburger)
- unsubscribe.html - no nav/footer at all - needs them inserted
- 404.html       - no nav/footer at all - needs them inserted
"""
import re

BASE = 'c:/Users/jason/source/repos/PrivacyPal/privacypal-web/'

# ─── Canonical HTML snippets ────────────────────────────────────────────────

CANONICAL_NAV_HTML = '''<nav id="navbar">
    <div class="nav-container">
        <a href="index.html" class="logo"><img src="privacypal-logo-color.png" alt="PrivacyPal"></a>
        <div class="nav-links">
            <div class="nav-item-dropdown">
                <span class="nav-dropdown-trigger">Platform</span>
                <div class="nav-dropdown-menu">
                    <a href="privacypal-ai.html">Next-Gen AI Anti-Virus</a>
                    <a href="privacy-twins.html">Privacy Twins</a>
                    <a href="device-control.html">Device Control</a>
                </div>
            </div>
            <div class="nav-item-dropdown">
                <span class="nav-dropdown-trigger">Solutions</span>
                <div class="nav-dropdown-menu">
                    <a href="index.html">For SME / SMB</a>
                    <a href="solutions.html#freelancers">For Freelancers</a>
                    <a href="privacypal-cloud.html">For Enterprise</a>
                    <div class="nav-divider"></div>
                    <a href="family.html" class="nav-home-link">For Home (Family)</a>
                </div>
            </div>
            <a href="index.html#pricing">Pricing</a>
            <div class="nav-item-dropdown">
                <span class="nav-dropdown-trigger">Resources</span>
                <div class="nav-dropdown-menu">
                    <a href="developers.html">AI Security 101</a>
                    <a href="about.html">About Us</a>
                    <a href="events.html">Events</a>
                    <a href="contact.html">Contact</a>
                </div>
            </div>
        </div>
        <div class="nav-cta-group">
            <a href="https://portal.privacypal.ai" class="nav-login" target="_blank" rel="noopener">Login</a>
            <a href="desktop.html" class="cta-nav-button">Start Free Trial</a>
        </div>
        <button class="hamburger" id="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
</nav>

<div class="mobile-menu" id="mobileMenu">
    <div class="mobile-dropdown">
        <button class="mobile-dropdown-trigger" onclick="toggleMobileDropdown(this)">Platform</button>
        <div class="mobile-dropdown-menu">
            <a href="privacypal-ai.html" onclick="closeMobileMenu()">Next-Gen AI Anti-Virus</a>
            <a href="privacy-twins.html" onclick="closeMobileMenu()">Privacy Twins</a>
            <a href="device-control.html" onclick="closeMobileMenu()">Device Control</a>
        </div>
    </div>
    <div class="mobile-dropdown">
        <button class="mobile-dropdown-trigger" onclick="toggleMobileDropdown(this)">Solutions</button>
        <div class="mobile-dropdown-menu">
            <a href="index.html" onclick="closeMobileMenu()">For SME / SMB</a>
            <a href="privacypal-cloud.html" onclick="closeMobileMenu()">For Enterprise</a>
            <a href="family.html" onclick="closeMobileMenu()">For Home (Family)</a>
        </div>
    </div>
    <a href="index.html#pricing" onclick="closeMobileMenu()">Pricing</a>
    <a href="https://portal.privacypal.ai" target="_blank" rel="noopener" onclick="closeMobileMenu()">Login</a>
    <a href="desktop.html" class="mobile-cta" onclick="closeMobileMenu()">Start Free Trial</a>
</div>'''

CANONICAL_FOOTER_HTML = '''<footer>
    <div class="footer-content">
        <div class="footer-brand">
            <h3>PrivacyPal</h3>
            <p>Use ChatGPT, Claude, Copilot, and any AI tool without exposing your sensitive data or IP.</p>
            <div class="social-links">
                <a href="https://x.com/privacypalai" title="X">\U0001d54f</a>
                <a href="https://www.linkedin.com/company/privacypalai/" title="LinkedIn">in</a>
            </div>
        </div>
        <div class="footer-links"><h4>Platform</h4><ul>
            <li><a href="privacypal-ai.html">Next-Gen AI Anti-Virus</a></li>
            <li><a href="privacy-twins.html">Privacy Twins</a></li>
            <li><a href="device-control.html">Device Control</a></li>
            <li><a href="ai-dspm.html">AI-DSPM</a></li>
            <li><a href="desktop.html">Install</a></li>
        </ul></div>
        <div class="footer-links"><h4>Solutions</h4><ul>
            <li><a href="index.html">For SME / SMB</a></li>
            <li><a href="privacypal-cloud.html">For Enterprise</a></li>
            <li><a href="banking.html">Banking</a></li>
            <li><a href="healthcare.html">Healthcare</a></li>
            <li><a href="family.html" class="footer-family-link">PrivacyPal Family</a></li>
        </ul></div>
        <div class="footer-links"><h4>Company</h4><ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="events.html">Events</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="developers.html">Developers</a></li>
            <li><a href="index.html#pricing">Pricing</a></li>
        </ul></div>
        <div class="footer-links"><h4>Legal</h4><ul>
            <li><a href="privacy-policy.html">Privacy Policy</a></li>
            <li><a href="terms-of-service.html">Terms of Service</a></li>
        </ul></div>
    </div>
    <div class="footer-bottom">
        <p>&copy; 2026 PrivacyPal LLC. All rights reserved. | <a href="mailto:hi@privacypal.ai">hi@privacypal.ai</a></p>
        <div class="footer-contact"><strong>PrivacyPal</strong>2700 North Military Trail<br>Boca Raton, FL 33431<br>+1 (917) 428-5968</div>
    </div>
</footer>'''

CANONICAL_NAV_CSS = '''        /* NAV */
        nav { position:fixed; top:0; left:0; right:0; z-index:1000; background:#fff; border-bottom:1px solid var(--border); transition:box-shadow 0.3s; }
        nav.scrolled { box-shadow:0 4px 24px rgba(0,0,0,0.06); }
        .nav-container { max-width:1280px; margin:0 auto; padding:0.85rem 24px; display:flex; justify-content:space-between; align-items:center; }
        .logo { display:flex; align-items:center; text-decoration:none; }
        .logo img { height:52px; width:auto; }
        .nav-links { display:flex; gap:28px; align-items:center; }
        .nav-links a { color:var(--text-muted); text-decoration:none; font-weight:500; font-size:0.9rem; transition:color 0.2s; }
        .nav-links a:hover { color:var(--cobalt); }
        .nav-item-dropdown { position:relative; }
        .nav-dropdown-trigger { color:var(--text-muted); font-weight:500; font-size:0.9rem; padding:8px 0; display:flex; align-items:center; gap:4px; cursor:pointer; background:none; border:none; font-family:inherit; transition:color 0.2s; }
        .nav-dropdown-trigger:hover,.nav-dropdown-trigger.nav-active { color:var(--cobalt); font-weight:700; }
        .nav-dropdown-trigger::after { content:''; width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid currentColor; margin-left:4px; opacity:0.7; }
        .nav-dropdown-menu { position:absolute; top:100%; left:50%; transform:translateX(-50%) translateY(8px); min-width:210px; background:#fff; border:1px solid var(--border); border-radius:12px; box-shadow:0 12px 40px rgba(0,0,0,0.12); padding:8px 0; opacity:0; visibility:hidden; transition:opacity 0.2s,visibility 0.2s,transform 0.2s; z-index:1001; }
        .nav-item-dropdown:hover .nav-dropdown-menu { opacity:1; visibility:visible; transform:translateX(-50%) translateY(4px); }
        .nav-dropdown-menu a { display:block; padding:10px 20px; color:var(--text-muted); text-decoration:none; font-size:0.875rem; transition:color 0.2s,background 0.2s; }
        .nav-dropdown-menu a:hover,.nav-dropdown-menu a.nav-active { color:var(--cobalt); background:rgba(51,102,153,0.06); font-weight:600; }
        .nav-divider { height:1px; background:var(--border); margin:6px 0; }
        .nav-home-link { color:#0ea5a0!important; font-weight:600!important; }
        .nav-cta-group { display:flex; gap:10px; align-items:center; }
        .nav-login { color:var(--text-muted)!important; font-weight:500; font-size:0.9rem; text-decoration:none; padding:10px 18px; border-radius:8px; transition:color 0.2s,background 0.2s; }
        .nav-login:hover { color:var(--cobalt)!important; background:var(--bg-alt); }
        .cta-nav-button { background:var(--cobalt); color:white!important; padding:10px 22px; border-radius:50px; font-weight:600; font-size:0.9rem; text-decoration:none; transition:all 0.3s; box-shadow:0 0 20px rgba(51,102,153,0.35); white-space:nowrap; }
        .cta-nav-button:hover { background:var(--cobalt-light); transform:translateY(-1px); }'''

CANONICAL_HAMBURGER_CSS = '''        /* HAMBURGER & MOBILE MENU */
        .hamburger { display:none; flex-direction:column; justify-content:center; align-items:center; gap:6px; width:44px; height:44px; background:none; border:none; cursor:pointer; z-index:1002; padding:0; }
        .hamburger span { display:block; width:24px; height:2px; background:#0f172a; border-radius:2px; transition:all 0.3s; transform-origin:center; }
        .hamburger.active span:nth-child(1) { transform:translateY(8px) rotate(45deg); }
        .hamburger.active span:nth-child(2) { opacity:0; }
        .hamburger.active span:nth-child(3) { transform:translateY(-8px) rotate(-45deg); }
        .mobile-menu { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.98); backdrop-filter:blur(24px); z-index:999; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:28px; opacity:0; visibility:hidden; transition:opacity 0.3s,visibility 0.3s; }
        .mobile-menu.active { opacity:1; visibility:visible; }
        .mobile-menu a { color:#0f172a; text-decoration:none; font-size:1.3rem; font-weight:600; transition:color 0.2s; }
        .mobile-menu a:hover { color:var(--cobalt); }
        .mobile-menu .mobile-cta { background:var(--cobalt); color:white!important; padding:14px 32px; border-radius:50px; font-weight:600; }
        .mobile-dropdown { width:100%; text-align:center; }
        .mobile-dropdown-trigger { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:10px 24px; font-size:1.3rem; font-weight:600; color:#0f172a; background:none; border:none; cursor:pointer; font-family:inherit; transition:color 0.2s; }
        .mobile-dropdown-trigger:hover { color:var(--cobalt); }
        .mobile-dropdown-trigger::after { content:''; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid currentColor; transition:transform 0.25s; }
        .mobile-dropdown.open .mobile-dropdown-trigger::after { transform:rotate(180deg); }
        .mobile-dropdown-menu { max-height:0; overflow:hidden; transition:max-height 0.3s; }
        .mobile-dropdown.open .mobile-dropdown-menu { max-height:400px; }
        .mobile-dropdown-menu a { display:block; padding:10px 24px; font-size:1rem; font-weight:500; color:var(--text-muted); border-bottom:1px solid rgba(0,0,0,0.05); }
        .mobile-dropdown-menu a:last-child { border-bottom:none; }'''

CANONICAL_FOOTER_CSS = '''        /* FOOTER */
        footer { background:#0f172a; color:rgba(255,255,255,0.7); padding:64px 24px 32px; }
        .footer-content { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr; gap:40px; padding-bottom:48px; border-bottom:1px solid rgba(255,255,255,0.08); }
        .footer-brand h3 { color:#fff; font-family:'Radley',Georgia,serif; font-size:1.4rem; margin-bottom:12px; }
        .footer-brand p { font-size:0.88rem; line-height:1.65; max-width:240px; }
        .social-links { display:flex; gap:12px; margin-top:20px; }
        .social-links a { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:8px; background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.7); text-decoration:none; font-size:0.85rem; font-weight:700; transition:background 0.2s,color 0.2s; }
        .social-links a:hover { background:#336699; color:#fff; }
        .footer-links h4 { color:#fff; font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:16px; }
        .footer-links ul { list-style:none; display:flex; flex-direction:column; gap:10px; }
        .footer-links ul li a { color:rgba(255,255,255,0.65); text-decoration:none; font-size:0.875rem; transition:color 0.2s; }
        .footer-links ul li a:hover { color:#fff; }
        .footer-family-link { color:#0ea5a0!important; font-weight:600; }
        .footer-bottom { max-width:1100px; margin:32px auto 0; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; }
        .footer-bottom p { font-size:0.82rem; }
        .footer-bottom a { color:rgba(255,255,255,0.5); text-decoration:none; }
        .footer-bottom a:hover { color:#fff; }
        .footer-contact { font-size:0.78rem; line-height:1.7; text-align:right; }
        .footer-contact strong { display:block; color:#fff; }'''

CANONICAL_JS = (
    "        window.addEventListener('scroll',function(){document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50);});\n"
    "        (function(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h&&m){h.addEventListener('click',function(){this.classList.toggle('active');m.classList.toggle('active');document.body.style.overflow=m.classList.contains('active')?'hidden':'';});}})();\n"
    "        function closeMobileMenu(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h)h.classList.remove('active');if(m)m.classList.remove('active');document.body.style.overflow='';document.querySelectorAll('.mobile-dropdown.open').forEach(function(d){d.classList.remove('open');});}\n"
    "        function toggleMobileDropdown(btn){btn.closest('.mobile-dropdown').classList.toggle('open');}"
)

ROOT_ADDITIONS = """
            --bg: #ffffff;
            --bg-alt: #f8fafc;
            --text: #0f172a;
            --text-muted: #475569;
            --text-light: #64748b;
            --border: #e2e8f0;"""

FONT_LINK = '    <link href="https://fonts.googleapis.com/css2?family=Radley:ital@0;1&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">'

# ─── desktop.html ────────────────────────────────────────────────────────────

def process_desktop():
    fname = 'desktop.html'
    path = BASE + fname
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    orig = c

    # 1. Add :root vars if needed
    root_m = re.search(r'(:root\s*\{)([^}]+)(\})', c)
    if root_m and '--bg:' not in root_m.group(2):
        new_root = root_m.group(1) + root_m.group(2).rstrip() + ROOT_ADDITIONS + '\n        ' + root_m.group(3)
        c = c[:root_m.start()] + new_root + c[root_m.end():]

    # 2. Ensure font import
    if 'fonts.googleapis.com' not in c:
        c = c.replace('    <style>', FONT_LINK + '\n    <style>', 1)

    # 3. Replace nav CSS block: from `        nav {` through `.cta-nav-button:hover {`
    #    Also remove .mobile-cta:hover block that's in old style
    nav_css_start = c.find('\n        nav {\n            position: fixed;')
    if nav_css_start < 0:
        nav_css_start = c.find('\n        nav {\n            position: fixed;')
    cta_end_marker = '            box-shadow: 0 0 28px rgba(51, 102, 153, 0.45);\n        }'
    cta_end = c.find(cta_end_marker)
    if nav_css_start >= 0 and cta_end >= 0:
        cta_end += len(cta_end_marker)
        c = c[:nav_css_start] + '\n' + CANONICAL_NAV_CSS + c[cta_end:]
        print(f"  Replaced nav CSS in {fname}")
    else:
        print(f"  WARNING: nav CSS block not found in {fname}")

    # 4. Replace footer CSS
    footer_css_start = c.find('\n        footer {\n            background: #fff;')
    if footer_css_start < 0:
        footer_css_start = c.find('\n        footer {\n            background: #ffffff;')
    footer_css_end_marker1 = '        .footer-contact strong { color: #0f172a; }'
    footer_css_end = c.find(footer_css_end_marker1, footer_css_start if footer_css_start >= 0 else 0)
    if footer_css_start >= 0 and footer_css_end >= 0:
        footer_css_end += len(footer_css_end_marker1)
        c = c[:footer_css_start] + '\n' + CANONICAL_FOOTER_CSS + c[footer_css_end:]
        print(f"  Replaced footer CSS in {fname}")
    else:
        print(f"  WARNING: footer CSS block not found in {fname}")

    # 5. Replace hamburger/mobile CSS
    hamb_start = c.find('\n        .hamburger {\n            display: none;')
    mobile_cta_end_marker = '        .mobile-cta:hover {\n            background: var(--cobalt-light);\n            transform: translateY(-2px);\n            box-shadow: 0 0 30px rgba(51, 102, 153, 0.6);\n        }'
    hamb_end = c.find(mobile_cta_end_marker)
    if hamb_start >= 0 and hamb_end >= 0:
        hamb_end += len(mobile_cta_end_marker)
        c = c[:hamb_start] + '\n' + CANONICAL_HAMBURGER_CSS + c[hamb_end:]
        print(f"  Replaced hamburger CSS in {fname}")
    else:
        print(f"  WARNING: hamburger CSS not found in {fname}")

    # 6. Fix @media - update nav-links/footer lines
    c = c.replace(
        '            .nav-links { display: none; }\n            .hamburger { display: flex; }',
        '            .nav-links,.nav-cta-group { display: none; }\n            .hamburger { display: flex; }'
    )
    c = c.replace(
        '            .footer-content { grid-template-columns: 1fr; }\n            .footer-contact { position: static; text-align: center; margin-top: 16px; }',
        '            .footer-content { grid-template-columns: 1fr; }'
    )
    # Also fix 900px media if that's what's there
    c = c.replace(
        '@media (max-width: 900px) {\n            .dl-grid { grid-template-columns: 1fr; }\n            .footer-content { grid-template-columns: 1fr; }\n            .footer-contact { position: static; text-align: center; margin-top: 16px; }\n            .nav-links { display: none; }\n            .hamburger { display: flex; }\n        }',
        '@media (max-width: 900px) {\n            .dl-grid { grid-template-columns: 1fr; }\n            .footer-content { grid-template-columns: 1fr; }\n            .nav-links,.nav-cta-group { display: none; }\n            .hamburger { display: flex; }\n        }'
    )

    # Add 1024px media query for footer 3-col if missing
    if 'grid-template-columns: 1fr 1fr 1fr' not in c and 'grid-template-columns:1fr 1fr 1fr' not in c:
        c = c.replace('    </style>\n</head>', '        @media(max-width:1024px){.footer-content{grid-template-columns:1fr 1fr 1fr;}}\n    </style>\n</head>')

    # 7. Replace nav + mobile HTML
    nav_p = re.compile(r'<nav id="navbar">.*?</nav>\s*\n\s*<div class="mobile-menu"[^>]*>.*?</div>', re.DOTALL)
    c, n = nav_p.subn(CANONICAL_NAV_HTML, c)
    if n == 0:
        print(f"  WARNING: nav HTML not found in {fname}")
    else:
        print(f"  Replaced nav HTML in {fname}")

    # 8. Replace footer HTML
    footer_p = re.compile(r'<footer>.*?</footer>', re.DOTALL)
    c, nf = footer_p.subn('\n    ' + CANONICAL_FOOTER_HTML, c)
    if nf == 0:
        print(f"  WARNING: footer HTML not found in {fname}")
    else:
        print(f"  Replaced footer HTML in {fname}")

    # 9. Update JS - replace verbose scroll listener
    old_scroll = """        window.addEventListener('scroll', function() {
            var navbar = document.getElementById('navbar');
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });"""
    new_scroll = "        window.addEventListener('scroll',function(){document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50);});"
    c = c.replace(old_scroll, new_scroll)

    # Replace verbose hamburger IIFE + closeMobileMenu + toggleMobileDropdown (keeping toggleMacDropdown etc)
    # Pattern: (function() { hamburger ... })(); \n\n        function closeMobileMenu ... toggleMobileDropdown ...
    old_js_p = re.compile(
        r'\(function\(\)\s*\{\s*\n\s*var hamburger.*?function toggleMobileDropdown\([^)]*\)\s*\{[^}]+\}',
        re.DOTALL
    )
    new_js = """(function(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h&&m){h.addEventListener('click',function(){this.classList.toggle('active');m.classList.toggle('active');document.body.style.overflow=m.classList.contains('active')?'hidden':'';});}})();
        function closeMobileMenu(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h)h.classList.remove('active');if(m)m.classList.remove('active');document.body.style.overflow='';document.querySelectorAll('.mobile-dropdown.open').forEach(function(d){d.classList.remove('open');});}
        function toggleMobileDropdown(btn){btn.closest('.mobile-dropdown').classList.toggle('open');}"""
    c, nj = old_js_p.subn(new_js, c)
    if nj == 0:
        print(f"  Note: verbose JS IIFE not matched in {fname}")
    else:
        print(f"  Replaced JS in {fname}")

    if c != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Updated: {fname}")
    else:
        print(f"No changes: {fname}")


# ─── install.html ─────────────────────────────────────────────────────────────

def process_install():
    fname = 'install.html'
    path = BASE + fname
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    orig = c

    # 1. Add :root vars if needed
    root_m = re.search(r'(:root\s*\{)([^}]+)(\})', c)
    if root_m and '--bg:' not in root_m.group(2):
        new_root = root_m.group(1) + root_m.group(2).rstrip() + ROOT_ADDITIONS + '\n        ' + root_m.group(3)
        c = c[:root_m.start()] + new_root + c[root_m.end():]

    # 2. Ensure font import
    if 'fonts.googleapis.com' not in c:
        c = c.replace('    <style>', FONT_LINK + '\n    <style>', 1)

    # 3. Replace nav CSS block: `        /* Navigation */\n        nav {` through `.cta-nav-button:hover {`
    nav_css_start = c.find('\n        /* Navigation */\n        nav {')
    cta_end_marker = '        .cta-nav-button:hover {\n            background: var(--cobalt-light);\n            transform: translateY(-2px);\n            box-shadow: 0 0 30px rgba(51, 102, 153, 0.6);\n        }'
    cta_end = c.find(cta_end_marker)
    if nav_css_start >= 0 and cta_end >= 0:
        cta_end += len(cta_end_marker)
        c = c[:nav_css_start] + '\n' + CANONICAL_NAV_CSS + '\n' + CANONICAL_HAMBURGER_CSS + c[cta_end:]
        print(f"  Replaced nav CSS + added hamburger CSS in {fname}")
    else:
        print(f"  WARNING: nav CSS not found in {fname} (start={nav_css_start}, end={cta_end})")

    # 4. Replace footer CSS
    footer_css_start = c.find('\n        footer {\n            background: #ffffff;')
    if footer_css_start < 0:
        footer_css_start = c.find('\n        footer {\n            background: white;')
    footer_css_end_marker = '.footer-bottom a:hover {\n            color: var(--cobalt);\n        }'
    footer_css_end = c.find(footer_css_end_marker, footer_css_start if footer_css_start >= 0 else 0)
    if footer_css_start >= 0 and footer_css_end >= 0:
        footer_css_end += len(footer_css_end_marker)
        c = c[:footer_css_start] + '\n' + CANONICAL_FOOTER_CSS + c[footer_css_end:]
        print(f"  Replaced footer CSS in {fname}")
    else:
        print(f"  WARNING: footer CSS not found in {fname}")

    # 5. Fix @media
    c = c.replace(
        '            .nav-links {\n                display: none;\n            }\n\n            .hamburger {\n                display: flex;\n            }',
        '            .nav-links,.nav-cta-group { display: none; }\n            .hamburger { display: flex; }'
    )
    # Also simpler inline versions
    c = c.replace(
        '            .nav-links { display: none; }',
        '            .nav-links,.nav-cta-group { display: none; }'
    )
    c = c.replace(
        '            .footer-content {\n                grid-template-columns: 1fr;\n            }\n\n            .footer-contact {\n                position: static;\n                text-align: center;\n                margin-top: 20px;\n                padding: 0;\n            }',
        '            .footer-content { grid-template-columns: 1fr; }'
    )
    if 'grid-template-columns: 1fr 1fr 1fr' not in c and 'grid-template-columns:1fr 1fr 1fr' not in c:
        c = c.replace('    </style>\n</head>', '        @media(max-width:1024px){.footer-content{grid-template-columns:1fr 1fr 1fr;}}\n    </style>\n</head>')

    # 6. Replace old simple nav HTML (no mobile-menu) with canonical
    #    Old: <!-- Navigation -->\n    <nav id="navbar">...</nav>
    #    Install has no mobile-menu div at all - need to add canonical nav+mobile
    nav_p_comment = re.compile(r'<!--\s*Navigation\s*-->\s*\n\s*<nav id="navbar">.*?</nav>', re.DOTALL)
    c, n = nav_p_comment.subn(CANONICAL_NAV_HTML, c)
    if n == 0:
        nav_p = re.compile(r'<nav id="navbar">.*?</nav>', re.DOTALL)
        c, n2 = nav_p.subn(CANONICAL_NAV_HTML, c)
        if n2 == 0:
            print(f"  WARNING: nav HTML not found in {fname}")
        else:
            print(f"  Replaced nav HTML in {fname}")
    else:
        print(f"  Replaced nav HTML in {fname}")

    # 7. Replace footer HTML
    footer_p = re.compile(r'<footer>.*?</footer>', re.DOTALL)
    c, nf = footer_p.subn('\n    ' + CANONICAL_FOOTER_HTML, c)
    if nf == 0:
        print(f"  WARNING: footer HTML not found in {fname}")
    else:
        print(f"  Replaced footer HTML in {fname}")

    # 8. Update JS
    old_scroll = '''        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });'''
    new_scroll = "        window.addEventListener('scroll',function(){document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50);});"
    c = c.replace(old_scroll, new_scroll)

    # If there's no mobile JS, check and add before </script>
    if 'closeMobileMenu' not in c:
        # Insert canonical mobile JS before last closing </script>
        last_script = c.rfind('</script>')
        if last_script >= 0:
            mobile_js = (
                "\n        (function(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');"
                "if(h&&m){h.addEventListener('click',function(){this.classList.toggle('active');"
                "m.classList.toggle('active');document.body.style.overflow=m.classList.contains('active')?'hidden':'';});"
                "}})();\n"
                "        function closeMobileMenu(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');"
                "if(h)h.classList.remove('active');if(m)m.classList.remove('active');"
                "document.body.style.overflow='';document.querySelectorAll('.mobile-dropdown.open').forEach(function(d){d.classList.remove('open');});}\n"
                "        function toggleMobileDropdown(btn){btn.closest('.mobile-dropdown').classList.toggle('open');}\n"
            )
            c = c[:last_script] + mobile_js + c[last_script:]
            print(f"  Added mobile JS in {fname}")

    if c != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Updated: {fname}")
    else:
        print(f"No changes: {fname}")


# ─── unsubscribe.html ─────────────────────────────────────────────────────────

def process_unsubscribe():
    fname = 'unsubscribe.html'
    path = BASE + fname
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    orig = c

    # This page has no nav or footer. Body currently has flex centering.
    # Strategy:
    # 1. Add nav+hamburger CSS and footer CSS into the <style> block
    # 2. Fix body style (remove flex centering, add padding-top)
    # 3. Add canonical nav HTML right after <body>
    # 4. Add canonical footer HTML right before </body>
    # 5. Add canonical JS

    # 1. Add CSS into style block before </style>
    nav_footer_css = '\n' + CANONICAL_NAV_CSS + '\n' + CANONICAL_HAMBURGER_CSS + '\n' + CANONICAL_FOOTER_CSS + '\n'
    c = c.replace('    </style>\n</head>', nav_footer_css + '        @media(max-width:768px){.nav-links,.nav-cta-group{display:none;}.hamburger{display:flex;}}\n        @media(max-width:1024px){.footer-content{grid-template-columns:1fr 1fr 1fr;}}\n    </style>\n</head>')

    # 2. Fix body to remove flex centering, add padding-top:80px
    c = c.replace(
        '        body {\n            font-family: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n            background: var(--bg);\n            color: var(--text);\n            min-height: 100vh;\n            display: flex;\n            flex-direction: column;\n            align-items: center;\n            justify-content: center;\n        }',
        '        body { font-family: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding-top: 80px; }'
    )

    # Also wrap the main content in a centering div, or just let unsubscribe-container center itself
    # The .unsubscribe-container already has max-width and padding. Add margin:auto
    c = c.replace(
        '        .unsubscribe-container {\n            text-align: center;\n            max-width: 520px;\n            padding: 40px 24px;\n        }',
        '        .unsubscribe-container { text-align: center; max-width: 520px; padding: 40px 24px; margin: 60px auto; }'
    )
    c = c.replace(
        '        .success-container {',
        '        .success-container { margin: 60px auto; max-width: 520px; text-align: center; padding: 40px 24px; }\n        .success-container-x {'
    )
    # Fix the duplicate - remove the dummy class
    c = c.replace(
        '        .success-container { margin: 60px auto; max-width: 520px; text-align: center; padding: 40px 24px; }\n        .success-container-x {',
        '        .success-container { margin: 60px auto; max-width: 520px; text-align: center; padding: 40px 24px; }\n        .success-container {'
    )

    # 3. Insert nav after <body>
    c = c.replace('<body>\n\n    <!-- Unsubscribe Form -->', '<body>\n\n' + CANONICAL_NAV_HTML + '\n\n    <!-- Unsubscribe Form -->')

    # 4. Add footer before </body>
    js_block = '\n    <script>\n' + CANONICAL_JS + '\n    </script>\n'
    c = c.replace('</body>\n</html>', '\n    ' + CANONICAL_FOOTER_HTML + js_block + '</body>\n</html>')

    print(f"Updated: {fname}")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)


# ─── 404.html ─────────────────────────────────────────────────────────────────

def process_404():
    fname = '404.html'
    path = BASE + fname
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    orig = c

    # Add font link, :root vars, nav+hamburger+footer CSS, fix body, add nav/footer HTML + JS

    # 1. Add font link before <style>
    if 'fonts.googleapis.com' not in c:
        c = c.replace('    <style>', '    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    ' + FONT_LINK + '\n    <style>', 1)

    # 2. Add :root + body padding + nav+hamburger+footer CSS
    new_css_block = """        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --cobalt: #336699;
            --cobalt-dark: #1a3a5a;
            --cobalt-light: #4a86c2;
            --bg: #ffffff;
            --bg-alt: #f8fafc;
            --text: #0f172a;
            --text-muted: #475569;
            --text-light: #64748b;
            --border: #e2e8f0;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #ffffff;
            color: #0f172a;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-top: 80px;
        }"""
    c = c.replace(
        '        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body {\n            font-family: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n            background: #ffffff;\n            color: #0f172a;\n            min-height: 100vh;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n        }',
        new_css_block
    )

    # 3. Add nav+hamburger+footer CSS before </style>
    nav_footer_css = '\n' + CANONICAL_NAV_CSS + '\n' + CANONICAL_HAMBURGER_CSS + '\n' + CANONICAL_FOOTER_CSS + '\n'
    c = c.replace('    </style>\n</head>', nav_footer_css + '        @media(max-width:768px){.nav-links,.nav-cta-group{display:none;}.hamburger{display:flex;}}\n        @media(max-width:1024px){.footer-content{grid-template-columns:1fr 1fr 1fr;}}\n    </style>\n</head>')

    # 4. Insert nav after <body>
    c = c.replace('<body>\n    <div class="error-container">', '<body>\n\n' + CANONICAL_NAV_HTML + '\n\n    <div class="error-container">')

    # 5. Add footer before </body>
    js_block = '\n    <script>\n' + CANONICAL_JS + '\n    </script>\n'
    c = c.replace('</body>\n</html>', '\n    ' + CANONICAL_FOOTER_HTML + js_block + '</body>\n</html>')

    if c != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Updated: {fname}")
    else:
        print(f"No changes: {fname}")


# ─── Run all ──────────────────────────────────────────────────────────────────

print("=== desktop.html ===")
try:
    process_desktop()
except Exception as e:
    import traceback; traceback.print_exc()

print("\n=== install.html ===")
try:
    process_install()
except Exception as e:
    import traceback; traceback.print_exc()

print("\n=== unsubscribe.html ===")
try:
    process_unsubscribe()
except Exception as e:
    import traceback; traceback.print_exc()

print("\n=== 404.html ===")
try:
    process_404()
except Exception as e:
    import traceback; traceback.print_exc()
