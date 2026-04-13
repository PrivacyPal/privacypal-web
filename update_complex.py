"""
Updates nav/footer/JS in complex multi-line CSS pages.
Each page has its nav CSS sections identified by known markers.
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
        .cta-nav-button:hover { background:var(--cobalt-light); transform:translateY(-1px); }
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
        .mobile-dropdown-menu a:last-child { border-bottom:none; }
        /* FOOTER */
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

CANONICAL_JS_FUNCS = '''        window.addEventListener('scroll',function(){document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50);});
        (function(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h&&m){h.addEventListener('click',function(){this.classList.toggle('active');m.classList.toggle('active');document.body.style.overflow=m.classList.contains('active')?'hidden':'';});}})();
        function closeMobileMenu(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h)h.classList.remove('active');if(m)m.classList.remove('active');document.body.style.overflow='';document.querySelectorAll('.mobile-dropdown.open').forEach(function(d){d.classList.remove('open');});}
        function toggleMobileDropdown(btn){btn.closest('.mobile-dropdown').classList.toggle('open');}'''

ROOT_VARS_EXTRA = '''            --bg: #ffffff;
            --bg-alt: #f8fafc;
            --text: #0f172a;
            --text-muted: #475569;
            --text-light: #64748b;
            --border: #e2e8f0;'''

def process_complex_file(filename):
    path = BASE + filename
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Ensure :root has needed vars
    # Find :root block and add missing vars
    root_match = re.search(r':root\s*\{([^}]+)\}', content)
    if root_match:
        root_content = root_match.group(1)
        new_root = root_content
        if '--bg:' not in root_content and '--bg ' not in root_content:
            # Add after --cobalt-light line or at start
            new_root = root_content.rstrip() + '\n' + ROOT_VARS_EXTRA + '\n'
        content = content[:root_match.start(1)] + new_root + content[root_match.end(1):]

    # 2. Replace nav CSS section
    # Find from /* Navigation */ or /* Nav */ through .cta-nav-button:hover { ... }
    # Also replace hamburger/mobile-menu CSS

    # Strategy: find the style block, then identify nav section and hamburger section
    # Replace them with canonical CSS

    # Find nav CSS start marker
    nav_css_patterns = [
        r'/\* Navigation \*/',
        r'/\* Nav \*/',
        r'nav \{',
        r'nav\{',
    ]

    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if not style_match:
        print(f"No style block in {filename}")
        return

    style_content = style_match.group(1)
    new_style = style_content

    # Find where nav CSS starts (look for /* Navigation */ or first nav { rule)
    nav_start = None
    for pattern in [r'/\* Navigation \*/', r'\n\s*/\* Nav \*/', r'\n\s*nav \{', r'\n\s*nav\{']:
        m = re.search(pattern, new_style)
        if m:
            nav_start = m.start()
            break

    if nav_start is None:
        print(f"  Could not find nav CSS start in {filename}")
    else:
        # Find where the page-specific CSS starts (after nav CSS)
        # Look for a comment like /* Developer Hero */ or /* Page */
        # or any non-nav selector that comes after the nav/cta-nav-button block
        # Find end of nav CSS section - look for first non-nav comment or class
        after_nav = new_style[nav_start:]

        # Find the cta-nav-button:hover end
        cta_end = re.search(r'\.cta-nav-button:hover\s*\{[^}]+\}', after_nav)
        if cta_end:
            nav_css_end = nav_start + cta_end.end()
        else:
            nav_css_end = nav_start + 500  # fallback

        # Now find hamburger CSS block
        hamburger_start = re.search(r'\n\s*\.hamburger\s*\{', new_style)
        if hamburger_start:
            # Find the end of mobile-dropdown-menu CSS
            mobile_end = re.search(r'\.mobile-dropdown-menu\s+a:last-child[^}]+\}', new_style)
            if not mobile_end:
                mobile_end = re.search(r'\.mobile-cta:hover[^}]+\}', new_style)
            if mobile_end:
                hamburger_css_end = mobile_end.end()
            else:
                hamburger_css_end = hamburger_start.end() + 2000  # fallback

            # Remove hamburger/mobile CSS section
            # But first handle the case where it might be inside @media
            new_style = new_style[:hamburger_start.start()] + new_style[hamburger_css_end:]

        # Now replace nav CSS section (re-find since we may have shifted)
        nav_start2 = None
        for pattern in [r'/\* Navigation \*/', r'\n\s*/\* Nav \*/', r'\n\s*nav \{', r'\n\s*nav\{']:
            m = re.search(pattern, new_style)
            if m:
                nav_start2 = m.start()
                break

        if nav_start2 is not None:
            after_nav2 = new_style[nav_start2:]
            cta_end2 = re.search(r'\.cta-nav-button:hover\s*\{[^}]+\}', after_nav2)
            if cta_end2:
                nav_css_end2 = nav_start2 + cta_end2.end()
                # Also remove .nav-links a.active if present
                remaining = new_style[nav_css_end2:]
                active_match = re.match(r'\s*\.nav-links\s+a\.active\s*\{[^}]+\}', remaining)
                if active_match:
                    nav_css_end2 += active_match.end()
                new_style = new_style[:nav_start2] + '\n' + new_style[nav_css_end2:]

    # Insert canonical nav+footer CSS at the end of style but before closing </style>
    # Find a good insertion point - before the first @media or before </style>
    # Actually insert right where nav CSS was removed (before page-specific CSS)
    # Let's just append to end of style content before any @media blocks

    # Simpler approach: find the last line of page-specific CSS before @media
    # and insert canonical CSS there. Or: prepend to the style block after :root/body.

    # Find the end of :root/body/html declarations
    body_end = re.search(r'body\s*\{[^}]+\}', new_style)
    if body_end:
        insert_point = body_end.end()
        new_style = new_style[:insert_point] + '\n\n' + CANONICAL_NAV_CSS + new_style[insert_point:]

    # Update @media blocks - add nav-cta-group to hidden list
    new_style = re.sub(
        r'\.nav-links\s*\{\s*display:\s*none;\s*\}',
        '.nav-links,.nav-cta-group{display:none;}',
        new_style
    )
    # Update footer-content media query
    new_style = re.sub(
        r'\.footer-content\s*\{\s*grid-template-columns:\s*1fr;\s*\}',
        '.footer-content{grid-template-columns:1fr;}',
        new_style
    )
    new_style = re.sub(
        r'\.footer-contact\s*\{\s*position:\s*static;.*?\}',
        '',
        new_style,
        flags=re.DOTALL
    )

    # Also add @media 1024px if not present
    if 'max-width:1024px' not in new_style and 'max-width: 1024px' not in new_style:
        # Add before </style>
        new_style = new_style + '\n        @media(max-width:1024px){.footer-content{grid-template-columns:1fr 1fr 1fr;}}'

    content = content[:style_match.start(1)] + new_style + content[style_match.end(1):]

    # 3. Replace nav HTML + mobile-menu HTML
    nav_pattern = re.compile(r'<!--\s*Navigation\s*-->\s*<nav id="navbar">.*?</nav>\s*\n\s*<div class="mobile-menu"[^>]*>.*?</div>', re.DOTALL)
    nav_match = nav_pattern.search(content)
    if not nav_match:
        # Try without comment
        nav_pattern2 = re.compile(r'<nav id="navbar">.*?</nav>\s*\n\s*<div class="mobile-menu"[^>]*>.*?</div>', re.DOTALL)
        nav_match = nav_pattern2.search(content)

    if nav_match:
        content = content[:nav_match.start()] + CANONICAL_NAV_HTML + content[nav_match.end():]
    else:
        print(f"  WARNING: Could not find nav HTML in {filename}")

    # 4. Replace footer HTML
    footer_pattern = re.compile(r'<!--\s*Footer\s*-->\s*<footer>.*?</footer>', re.DOTALL)
    footer_match = footer_pattern.search(content)
    if not footer_match:
        footer_pattern2 = re.compile(r'<footer>.*?</footer>', re.DOTALL)
        footer_match = footer_pattern2.search(content)

    if footer_match:
        content = content[:footer_match.start()] + '\n    ' + CANONICAL_FOOTER_HTML + content[footer_match.end():]
    else:
        print(f"  WARNING: Could not find footer in {filename}")

    # 5. Replace/update mobile menu JS in script blocks
    # Find and replace old hamburger/mobile JS
    # Pattern: the (function() { var hamburger... }) block and closeMobileMenu/toggleMobileDropdown functions
    js_pattern = re.compile(
        r'//\s*Mobile menu toggle\s*\n\s*\(function\(\).*?function toggleMobileDropdown\([^)]*\)\s*\{[^}]+\}',
        re.DOTALL
    )
    js_match = js_pattern.search(content)
    if js_match:
        content = content[:js_match.start()] + CANONICAL_JS_FUNCS + content[js_match.end():]
    else:
        # Try simpler pattern
        js_pattern2 = re.compile(
            r'\(function\(\)\s*\{[^}]*hamburger[^}]*\}\s*\}\)\(\);.*?function toggleMobileDropdown\([^)]*\)\s*\{[^}]+\}',
            re.DOTALL
        )
        js_match2 = js_pattern2.search(content)
        if js_match2:
            content = content[:js_match2.start()] + CANONICAL_JS_FUNCS + content[js_match2.end():]
        else:
            print(f"  WARNING: Could not find mobile JS in {filename}")

    # Also replace old scroll event listener if separate
    scroll_pattern = re.compile(
        r"window\.addEventListener\('scroll',\s*function\(\)\s*\{[^}]+\}\s*\}\s*\}\s*\)\s*;",
        re.DOTALL
    )
    scroll_match = scroll_pattern.search(content)
    if scroll_match:
        content = content[:scroll_match.start()] + content[scroll_match.end():]

    # Add scroll listener to canonical JS if not present
    if 'navbar' in content and "window.addEventListener('scroll'" not in content:
        # Find first <script> before </body>
        last_script = list(re.finditer(r'<script>', content))
        if last_script:
            pos = last_script[-1].end()
            content = content[:pos] + '\n        ' + "window.addEventListener('scroll',function(){document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50);});" + content[pos:]

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filename}")
    else:
        print(f"No changes: {filename}")


# Files with complex multi-line CSS
complex_pages = [
    'ai-dspm.html',
    'developers.html',
    'privacypal-cloud.html',
]

for page in complex_pages:
    try:
        process_complex_file(page)
    except Exception as e:
        print(f"ERROR processing {page}: {e}")
        import traceback
        traceback.print_exc()
