"""
Updates developers.html, privacypal-cloud.html - same multi-line nav CSS pattern as ai-dspm.
"""
import re

BASE = 'c:/Users/jason/source/repos/PrivacyPal/privacypal-web/'

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

# The exact nav CSS text that appears in developers and privacypal-cloud
OLD_NAV_CSS = '''        /* Navigation */
        nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }

        nav.scrolled {
            box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
        }

        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
        }

        .logo img {
            height: 72px;
            max-height: 72px;
            width: auto;
            display: block;
        }

        .nav-links {
            display: flex;
            gap: 40px;
            align-items: center;
        }

        .nav-links a {
            color: #475569;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
            position: relative;
        }

        .nav-links a:hover {
            color: var(--cobalt-light);
        }

        /* Nav dropdowns */
        .nav-item-dropdown { position: relative; }
        .nav-dropdown-trigger {
            color: #475569;
            text-decoration: none;
            font-weight: 500;
            padding: 8px 0;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            background: none;
            border: none;
            font-family: inherit;
            transition: color 0.3s ease;
        }
        .nav-dropdown-trigger:hover { color: var(--cobalt-light); }
        .nav-dropdown-trigger::after {
            content: '';
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 5px solid currentColor;
            margin-left: 4px;
            opacity: 0.7;
        }
        .nav-dropdown-menu {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(8px);
            min-width: 200px;
            background: rgba(255,255,255,0.98);
            backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.12);
            padding: 8px 0;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
            z-index: 1001;
        }
        .nav-item-dropdown:hover .nav-dropdown-menu {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(4px);
        }
        .nav-dropdown-menu a {
            display: block;
            padding: 10px 20px;
            color: #475569;
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.2s, background 0.2s;
        }
        .nav-dropdown-menu a:hover {
            color: var(--cobalt-light);
            background: var(--glass-hover);
        }

        .nav-links a.active {
            color: var(--cobalt-light);
            font-weight: 600;
        }

        .cta-nav-button {
            background: var(--cobalt);
            color: white !important;
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 0 20px rgba(51, 102, 153, 0.4);
        }

        .cta-nav-button:hover {
            background: var(--cobalt-light);
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(51, 102, 153, 0.6);
        }'''

NEW_NAV_CSS = '''        /* NAV */
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

# Mobile menu CSS to replace
OLD_MOBILE_CSS_START = '        /* Mobile Menu */\n        .hamburger {'
# End marker
OLD_MOBILE_CSS_END = '        .mobile-dropdown-menu a:hover { color: var(--cobalt); }'

NEW_MOBILE_CSS = '''        /* HAMBURGER & MOBILE MENU */
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

def add_root_vars(content):
    root_match = re.search(r'(:root\s*\{)([^}]+)(\})', content)
    if root_match:
        root_body = root_match.group(2)
        if '--bg:' not in root_body and '--bg ' not in root_body:
            additions = '\n            --bg: #ffffff;\n            --bg-alt: #f8fafc;\n            --text: #0f172a;\n            --text-muted: #475569;\n            --text-light: #64748b;\n            --border: #e2e8f0;'
            new_root = root_match.group(1) + root_body.rstrip() + additions + '\n        ' + root_match.group(3)
            content = content[:root_match.start()] + new_root + content[root_match.end():]
    return content

def process_devcloud(fname):
    path = BASE + fname
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # 1. Add :root vars
    content = add_root_vars(content)

    # 2. Replace nav CSS
    if OLD_NAV_CSS in content:
        content = content.replace(OLD_NAV_CSS, NEW_NAV_CSS)
        print(f"  Replaced nav CSS in {fname}")
    else:
        print(f"  WARNING: nav CSS not found in {fname}")

    # 3. Replace hamburger/mobile CSS
    if OLD_MOBILE_CSS_START in content:
        start = content.find(OLD_MOBILE_CSS_START)
        end = content.find(OLD_MOBILE_CSS_END, start)
        if end >= 0:
            end += len(OLD_MOBILE_CSS_END)
            content = content[:start] + NEW_MOBILE_CSS + content[end:]
            print(f"  Replaced mobile CSS in {fname}")

    # 4. Replace footer CSS - find footer { through .footer-bottom a:hover { color: var(--cobalt); }
    footer_start = content.find('\n        footer {\n            background: #ffffff;')
    if footer_start < 0:
        footer_start = content.find('\n        footer {\n            background: #0f172a;')
    if footer_start >= 0:
        footer_css_end_marker = '        .footer-bottom a:hover {\n            color: var(--cobalt);\n        }'
        footer_end = content.find(footer_css_end_marker, footer_start)
        if footer_end >= 0:
            footer_end += len(footer_css_end_marker)
            content = content[:footer_start] + '\n' + CANONICAL_FOOTER_CSS + content[footer_end:]
            print(f"  Replaced footer CSS in {fname}")

    # 5. Update @media - replace nav-related media queries
    # Find and update the responsive section
    old_media = '            .nav-links {\n                display: none;\n            }\n\n            .hamburger {\n                display: flex;\n            }'
    new_media = '            .nav-links,.nav-cta-group { display: none; }\n            .hamburger { display: flex; }'
    content = content.replace(old_media, new_media)

    # Update footer-content in media query
    content = content.replace(
        '            .footer-content {\n                grid-template-columns: 1fr;\n            }\n\n            .footer-contact {\n                position: static;\n                text-align: center;\n                margin-top: 20px;\n                padding: 0;\n            }',
        '            .footer-content { grid-template-columns: 1fr; }'
    )

    # Add 1024px media if missing
    if 'grid-template-columns: 1fr 1fr 1fr' not in content and 'grid-template-columns:1fr 1fr 1fr' not in content:
        # Add after style block closing
        content = content.replace('    </style>\n</head>', '        @media(max-width:1024px){.footer-content{grid-template-columns:1fr 1fr 1fr;}}\n    </style>\n</head>')

    # 6. Replace nav + mobile HTML
    nav_pattern = re.compile(
        r'<!--\s*Navigation\s*-->\s*\n\s*<nav id="navbar">.*?</nav>\s*\n\s*<div class="mobile-menu"[^>]*>.*?</div>',
        re.DOTALL
    )
    content, n = nav_pattern.subn(CANONICAL_NAV_HTML, content)
    if n == 0:
        nav_pattern2 = re.compile(
            r'<nav id="navbar">.*?</nav>\s*\n\s*<div class="mobile-menu"[^>]*>.*?</div>',
            re.DOTALL
        )
        content, n2 = nav_pattern2.subn(CANONICAL_NAV_HTML, content)
        if n2 == 0:
            print(f"  WARNING: nav HTML not found in {fname}")
        else:
            print(f"  Replaced nav HTML in {fname}")
    else:
        print(f"  Replaced nav HTML in {fname}")

    # 7. Replace footer HTML
    footer_html_pattern = re.compile(
        r'<!--\s*Footer\s*-->\s*\n\s*<footer>.*?</footer>|<footer>.*?</footer>',
        re.DOTALL
    )
    content, nf = footer_html_pattern.subn('\n    ' + CANONICAL_FOOTER_HTML, content)
    if nf == 0:
        print(f"  WARNING: footer HTML not found in {fname}")
    else:
        print(f"  Replaced footer HTML in {fname}")

    # 8. Update JS - scroll listener
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
    content = content.replace(old_scroll, new_scroll)

    # Replace mobile menu JS IIFE
    old_mobile_js_pattern = re.compile(
        r'// Mobile menu toggle\s*\n\s*\(function\(\)\s*\{.*?function toggleMobileDropdown\([^)]*\)\s*\{[^}]+\}',
        re.DOTALL
    )
    new_mobile_js = """(function(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h&&m){h.addEventListener('click',function(){this.classList.toggle('active');m.classList.toggle('active');document.body.style.overflow=m.classList.contains('active')?'hidden':'';});}})();
        function closeMobileMenu(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h)h.classList.remove('active');if(m)m.classList.remove('active');document.body.style.overflow='';document.querySelectorAll('.mobile-dropdown.open').forEach(function(d){d.classList.remove('open');});}
        function toggleMobileDropdown(btn){btn.closest('.mobile-dropdown').classList.toggle('open');}"""
    content, nj = old_mobile_js_pattern.subn(new_mobile_js, content)
    if nj == 0:
        print(f"  Note: mobile JS pattern not matched in {fname}")

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {fname}")
    else:
        print(f"No changes: {fname}")


for fname in ['developers.html', 'privacypal-cloud.html']:
    try:
        process_devcloud(fname)
    except Exception as e:
        print(f"ERROR: {fname}: {e}")
        import traceback
        traceback.print_exc()
