import re
import sys

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

CANONICAL_JS = '''        window.addEventListener('scroll',function(){document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50);});
        (function(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h&&m){h.addEventListener('click',function(){this.classList.toggle('active');m.classList.toggle('active');document.body.style.overflow=m.classList.contains('active')?'hidden':'';});}})();
        function closeMobileMenu(){var h=document.getElementById('hamburger'),m=document.getElementById('mobileMenu');if(h)h.classList.remove('active');if(m)m.classList.remove('active');document.body.style.overflow='';document.querySelectorAll('.mobile-dropdown.open').forEach(function(d){d.classList.remove('open');});}
        function toggleMobileDropdown(btn){btn.closest('.mobile-dropdown').classList.toggle('open');}'''

# CSS to insert/replace for nav/footer
NAV_CSS_BLOCK = '''        /* NAV */
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

MEDIA_QUERIES = '''        @media(max-width:768px){.nav-links,.nav-cta-group{display:none;}.hamburger{display:flex;}.footer-content{grid-template-columns:1fr;}}
        @media(max-width:1024px){.footer-content{grid-template-columns:1fr 1fr 1fr;}}'''

FONT_LINK = '    <link href="https://fonts.googleapis.com/css2?family=Radley:ital@0;1&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">'
PRECONNECT1 = '    <link rel="preconnect" href="https://fonts.googleapis.com">'
PRECONNECT2 = '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'

def process_file(filename, extra_css='', extra_font_url=None):
    """Process a file with the old-style nav (simple pages like solutions, events, products)."""
    path = BASE + filename
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Ensure font imports exist
    if 'fonts.googleapis.com/css2' not in content:
        # Add font links before </head> or before <style>
        if PRECONNECT1 not in content:
            content = content.replace('<style>', PRECONNECT1 + '\n' + PRECONNECT2 + '\n' + FONT_LINK + '\n    <style>', 1)
        else:
            if FONT_LINK not in content:
                content = content.replace(PRECONNECT2, PRECONNECT2 + '\n' + FONT_LINK, 1)

    # 2. Replace the entire style block content (nav/footer CSS)
    # Strategy: find the <style> block, replace known old nav/footer patterns
    # We use a broad regex to replace the old compact CSS blocks typical in simple pages

    # For simple pages that have the compact CSS format (all on ~3 lines for nav/footer/hamburger)
    # Pattern: everything from nav{ to the @media line
    # We'll replace the body+nav+footer CSS in the style block

    # Remove old nav/footer/hamburger/mobile CSS blocks
    # The simple pages have this pattern in their style: nav{...} ... @media(...)

    # Find style tag content
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if not style_match:
        print(f"WARNING: No style block found in {filename}")
        return

    old_style = style_match.group(1)
    new_style = old_style

    # Remove old nav CSS (everything that starts with nav{ or /* Navigation */ or /* Nav */ patterns)
    # For simple pages (solutions, events, products, contact), the CSS is compact
    # Remove: nav{...} through @media block at end of style

    # Strategy: split on known page-specific CSS that must be preserved
    # Most simple pages have page-specific CSS AFTER the hamburger/mobile CSS
    # We'll detect the @media line and replace everything from :root (or nav{) through @media

    # The compact pages typically have:
    # :root{...}
    # body{...}
    # nav{...} ...
    # .page-specific-css{...}
    # footer{...}
    # .hamburger{...} .mobile-menu{...}
    # @media(...)

    # Let's find what page-specific CSS to preserve
    # We'll remove the old nav/footer/hamburger/mobile-menu CSS and replace with canonical

    # For compact single-line CSS, we can identify blocks by their selectors
    lines = new_style.split('\n')

    # Find lines that are page-specific (not nav/footer/hamburger/mobile)
    nav_footer_selectors = [
        'nav{', 'nav.', '.nav-', '.logo{', '.logo ', '.logo i',
        'footer{', '.footer-', '.social-links',
        '.hamburger{', '.hamburger ', '.hamburger.',
        '.mobile-menu{', '.mobile-menu.', '.mobile-menu a',
        '.mobile-dropdown{', '.mobile-dropdown-',
        '.mobile-cta{', '.mobile-cta:',
        '@media(max-width:768px)', '@media(max-width:1024px)',
        '@media (max-width: 768px)', '@media (max-width: 1024px)',
    ]

    # Actually for these simple pages, let's just do a regex-based replacement
    # Remove everything from nav{ through end of @media block
    # The page-specific stuff comes BETWEEN the nav end and footer start in the HTML
    # but in CSS it's intermixed. Let's handle differently.

    # For simple pages: remove entire old style content and reconstruct
    # keeping only page-specific CSS

    # Identify page-specific CSS lines (lines that don't match nav/footer patterns)
    page_specific_lines = []
    skip_next = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        is_nav_footer = False
        for sel in nav_footer_selectors:
            if stripped.lower().startswith(sel.lower()):
                is_nav_footer = True
                break

        # Also skip :root and body (we'll put canonical ones)
        if stripped.startswith(':root{') or stripped.startswith('*{') or stripped.startswith('html{') or stripped.startswith('body{'):
            is_nav_footer = True

        if not is_nav_footer:
            page_specific_lines.append(line)

    page_specific_css = '\n'.join(page_specific_lines).strip()

    # Build new style content
    root_body = '''        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--cobalt:#336699;--cobalt-dark:#1a3a5a;--cobalt-light:#4a86c2;--bg:#ffffff;--bg-alt:#f8fafc;--text:#0f172a;--text-muted:#475569;--text-light:#64748b;--border:#e2e8f0;}
        html{scroll-behavior:smooth;}
        body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;}'''

    new_style_content = root_body + '\n' + NAV_CSS_BLOCK
    if page_specific_css:
        new_style_content += '\n        /* PAGE-SPECIFIC */\n' + page_specific_css
    new_style_content += '\n' + MEDIA_QUERIES

    content = content.replace(style_match.group(0), '<style>' + new_style_content + '\n    </style>')

    # 3. Replace nav + mobile-menu HTML
    # Find <nav id="navbar"> ... </div>\n</div> (the mobile-menu closing div)
    nav_pattern = re.compile(r'<nav id="navbar">.*?</nav>\s*<div class="mobile-menu"[^>]*>.*?</div>', re.DOTALL)
    nav_match = nav_pattern.search(content)
    if nav_match:
        content = content[:nav_match.start()] + CANONICAL_NAV_HTML + content[nav_match.end():]
    else:
        print(f"WARNING: Could not find nav pattern in {filename}")

    # 4. Replace footer
    footer_pattern = re.compile(r'<footer>.*?</footer>', re.DOTALL)
    footer_match = footer_pattern.search(content)
    if footer_match:
        content = content[:footer_match.start()] + CANONICAL_FOOTER_HTML + content[footer_match.end():]
    else:
        print(f"WARNING: Could not find footer in {filename}")

    # 5. Replace/update script JS for nav
    # Look for old scroll/hamburger JS and replace
    old_js_patterns = [
        r"window\.addEventListener\('scroll'.*?toggleMobileDropdown\(btn\)\{[^}]+\}",
    ]

    script_pattern = re.compile(r'(<script>)(.*?)(</script>)', re.DOTALL)
    def replace_script(m):
        inner = m.group(2)
        # Replace old nav JS with canonical
        new_inner = re.sub(
            r"window\.addEventListener\('scroll'.*?function toggleMobileDropdown\([^)]*\)\{[^\}]+\}",
            CANONICAL_JS.strip(),
            inner,
            flags=re.DOTALL
        )
        if new_inner == inner:
            # Append canonical JS if not found
            new_inner = CANONICAL_JS.strip() + '\n' + inner.strip()
        return m.group(1) + '\n' + new_inner + '\n    ' + m.group(3)

    # Find the last script block (before </body>)
    # Replace the scroll/hamburger JS in it
    last_script = list(script_pattern.finditer(content))
    if last_script:
        # Use the last script block
        m = last_script[-1]
        inner = m.group(2)
        new_inner = re.sub(
            r"window\.addEventListener\('scroll'.*?function toggleMobileDropdown\([^)]*\)\{[^\}]+\}",
            CANONICAL_JS.strip(),
            inner,
            flags=re.DOTALL
        )
        if new_inner == inner:
            # Try to find and replace old scroll listener
            new_inner = re.sub(
                r"window\.addEventListener\('scroll'.*?\}\);",
                '',
                inner,
                flags=re.DOTALL
            )
            new_inner = CANONICAL_JS.strip() + '\n' + new_inner.strip()
        content = content[:m.start()] + '<script>\n' + new_inner + '\n    </script>' + content[m.end():]

    # 6. Add padding-top to body if needed (to account for fixed nav)
    # Check if first section/hero already has top padding
    # Simple check: if no padding-top in body or first section
    if 'padding-top:80px' not in content and 'padding-top: 80px' not in content:
        # Check if hero sections have top padding
        if 'padding:120px' not in content and 'padding-top:120px' not in content and 'padding-top: 120px' not in content:
            # Add body padding-top
            content = content.replace(
                'body{font-family:',
                'body{padding-top:80px;font-family:'
            ).replace(
                "body { font-family:",
                "body { padding-top:80px; font-family:"
            )

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filename}")
    else:
        print(f"No changes: {filename}")

# Process simple pages with the compact CSS format
simple_pages = [
    'solutions.html',
    'events.html',
    'products.html',
]

for page in simple_pages:
    try:
        process_file(page)
    except Exception as e:
        print(f"ERROR processing {page}: {e}")
        import traceback
        traceback.print_exc()
