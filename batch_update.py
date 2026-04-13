"""
Batch update nav/footer/JS for remaining pages.
Uses file-level string replacements.
"""
import re
import os

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

CANONICAL_NAV_CSS_BLOCK = '''        /* NAV */
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

def read_file(fname):
    with open(BASE + fname, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(fname, content):
    with open(BASE + fname, 'w', encoding='utf-8') as f:
        f.write(content)

def replace_nav_mobile_html(content, fname):
    """Replace nav + mobile-menu HTML with canonical version."""
    # Try with mobile-menu div
    pattern = re.compile(
        r'<nav id="navbar">.*?</nav>\s*\n\s*<div class="mobile-menu"[^>]*>.*?</div>',
        re.DOTALL
    )
    new_content, n = pattern.subn(CANONICAL_NAV_HTML, content)
    if n > 0:
        return new_content

    # Try without mobile-menu (some pages don't have it)
    pattern2 = re.compile(r'<nav id="navbar">.*?</nav>', re.DOTALL)
    new_content2, n2 = pattern2.subn(CANONICAL_NAV_HTML, content)
    if n2 > 0:
        return new_content2

    print(f"  WARNING: nav HTML not found in {fname}")
    return content

def replace_footer_html(content, fname):
    """Replace footer HTML."""
    pattern = re.compile(r'<footer>.*?</footer>', re.DOTALL)
    new_content, n = pattern.subn(CANONICAL_FOOTER_HTML, content)
    if n == 0:
        print(f"  WARNING: footer not found in {fname}")
    return new_content

def add_root_vars(content):
    """Add missing CSS vars to :root."""
    root_match = re.search(r'(:root\s*\{)([^}]+)(\})', content)
    if root_match:
        root_body = root_match.group(2)
        additions = ''
        if '--bg:' not in root_body and '--bg ' not in root_body:
            additions += '\n            --bg: #ffffff;\n            --bg-alt: #f8fafc;\n            --text: #0f172a;\n            --text-muted: #475569;\n            --text-light: #64748b;\n            --border: #e2e8f0;'
        if additions:
            new_root = root_match.group(1) + root_body.rstrip() + additions + '\n        ' + root_match.group(3)
            content = content[:root_match.start()] + new_root + content[root_match.end():]
    return content

def update_js_mobile(content, fname):
    """Replace old mobile menu JS with canonical."""
    # Replace old verbose scroll listener
    content = re.sub(
        r"window\.addEventListener\('scroll',\s*function\(\)\s*\{[^}]*navbar[^}]*\}\s*\}\s*\)\s*;",
        "window.addEventListener('scroll',function(){document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50);});",
        content,
        flags=re.DOTALL
    )
    # Replace old mobile menu IIFE + functions
    js_pattern = re.compile(
        r'(?://[^\n]*\n\s*)?\(function\(\)\s*\{[^}]*hamburger[^}]*\}[^}]*\}\s*\}\s*\)\(\);'
        r'[\s\S]*?function toggleMobileDropdown\([^)]*\)\s*\{[^}]+\}',
        re.DOTALL
    )
    new_content = js_pattern.sub(
        '(function(){var h=document.getElementById(\'hamburger\'),m=document.getElementById(\'mobileMenu\');if(h&&m){h.addEventListener(\'click\',function(){this.classList.toggle(\'active\');m.classList.toggle(\'active\');document.body.style.overflow=m.classList.contains(\'active\')?\'hidden\':\'\';});}})();\n        function closeMobileMenu(){var h=document.getElementById(\'hamburger\'),m=document.getElementById(\'mobileMenu\');if(h)h.classList.remove(\'active\');if(m)m.classList.remove(\'active\');document.body.style.overflow=\'\';document.querySelectorAll(\'.mobile-dropdown.open\').forEach(function(d){d.classList.remove(\'open\');});}\n        function toggleMobileDropdown(btn){btn.closest(\'.mobile-dropdown\').classList.toggle(\'open\');}',
        content
    )
    if new_content == content:
        print(f"  Note: mobile JS pattern not matched in {fname}")
    return new_content

def add_missing_font(content):
    """Add Radley+Inter font if missing."""
    if 'fonts.googleapis.com' not in content:
        font_html = '    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="https://fonts.googleapis.com/css2?family=Radley:ital@0;1&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">\n'
        content = content.replace('    <style>', font_html + '    <style>', 1)
    return content

def update_media_queries(content):
    """Update @media blocks to use canonical nav hiding."""
    content = re.sub(
        r'\.nav-links\s*\{\s*display:\s*none;\s*\}',
        '.nav-links,.nav-cta-group { display:none; }',
        content
    )
    return content

# ============================
# Pages needing the compact CSS approach (similar to solutions/events but with added page CSS)
# ============================

# banking, healthcare, telecommunications, technology - these have compact CSS
def process_compact_standard(fname):
    """Process pages with compact single-line CSS (banking, healthcare, etc.)"""
    content = read_file(fname)
    original = content

    # Add font if missing
    content = add_missing_font(content)

    # Add missing :root vars
    content = add_root_vars(content)

    # Find the style block
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if not style_match:
        print(f"No style block in {fname}")
        return

    style_content = style_match.group(1)

    # Remove old nav/footer/hamburger/mobile CSS lines
    # Split into lines and filter out nav/footer lines
    lines = style_content.split('\n')
    nav_footer_prefixes = [
        'nav{', 'nav.', '.nav-', '.logo{', '.logo i', '.logo ',
        'footer{', '.footer-', '.social-links',
        '.hamburger{', '.hamburger ', '.hamburger.',
        '.mobile-menu{', '.mobile-menu.', '.mobile-menu a',
        '.mobile-dropdown{', '.mobile-dropdown-', '.mobile-dropdown.',
        '.mobile-cta{', '.mobile-cta:',
        'body{', ':root{', '*{', 'html{',
        '@media(max-width:', '@media (max-width:',
    ]

    page_specific = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        is_nav_footer = False
        for prefix in nav_footer_prefixes:
            if stripped.lower().startswith(prefix.lower()):
                is_nav_footer = True
                break
        if not is_nav_footer:
            page_specific.append(line)

    page_css = '\n'.join(page_specific).strip()

    # Build canonical style content
    root_body = '''        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--cobalt:#336699;--cobalt-dark:#1a3a5a;--cobalt-light:#4a86c2;--bg:#ffffff;--bg-alt:#f8fafc;--text:#0f172a;--text-muted:#475569;--text-light:#64748b;--border:#e2e8f0;}
        html{scroll-behavior:smooth;}
        body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;}'''

    new_style = root_body + '\n' + CANONICAL_NAV_CSS_BLOCK
    if page_css:
        new_style += '\n        /* PAGE-SPECIFIC */\n' + page_css
    new_style += '''
        @media(max-width:768px){.nav-links,.nav-cta-group{display:none;}.hamburger{display:flex;}.footer-content{grid-template-columns:1fr;}}
        @media(max-width:1024px){.footer-content{grid-template-columns:1fr 1fr 1fr;}}'''

    content = content[:style_match.start()] + '<style>' + new_style + '\n    </style>' + content[style_match.end():]

    # Replace nav+mobile HTML
    content = replace_nav_mobile_html(content, fname)

    # Replace footer
    content = replace_footer_html(content, fname)

    # Update JS
    content = update_js_mobile(content, fname)

    if content != original:
        write_file(fname, content)
        print(f"Updated: {fname}")
    else:
        print(f"No changes: {fname}")


# ============================
# Complex pages (developers, privacypal-cloud, install, desktop)
# with multi-line CSS - similar structure to ai-dspm
# ============================

def process_complex_like_ai_dspm(fname, nav_css_end_marker, hamburger_start_marker, hamburger_end_marker, footer_css_start, footer_css_end, media_section, media_replacement):
    """Generic processor for ai-dspm-style complex pages."""
    content = read_file(fname)
    original = content

    # Add :root vars
    content = add_root_vars(content)

    # Replace nav CSS section
    if nav_css_end_marker in content:
        # Find the nav start
        nav_start_patterns = ['        /* Navigation */\n', '        /* Nav */\n', '        nav {\n']
        nav_start_idx = -1
        nav_start_marker = None
        for p in nav_start_patterns:
            idx = content.find(p)
            if idx != -1:
                nav_start_idx = idx
                nav_start_marker = p
                break

        if nav_start_idx >= 0:
            end_idx = content.find(nav_css_end_marker, nav_start_idx)
            if end_idx >= 0:
                end_idx += len(nav_css_end_marker)
                # Skip any trailing whitespace/newlines up to the next comment/selector
                new_nav_css = '\n' + CANONICAL_NAV_CSS_BLOCK.replace('        /* NAV */', '        /* NAV */') + '\n\n'
                content = content[:nav_start_idx] + new_nav_css + content[end_idx:]

    # Replace hamburger/mobile CSS
    if hamburger_start_marker in content:
        ham_start = content.find(hamburger_start_marker)
        ham_end = content.find(hamburger_end_marker, ham_start)
        if ham_end >= 0:
            ham_end += len(hamburger_end_marker)
            canonical_ham = '''        /* HAMBURGER & MOBILE MENU */
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
            content = content[:ham_start] + canonical_ham + '\n' + content[ham_end:]

    # Replace footer CSS
    if footer_css_start in content:
        fc_start = content.find(footer_css_start)
        fc_end = content.find(footer_css_end, fc_start)
        if fc_end >= 0:
            fc_end += len(footer_css_end)
            canonical_footer_css = '''        /* FOOTER */
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
            content = content[:fc_start] + canonical_footer_css + '\n' + content[fc_end:]

    # Replace media section
    if media_section and media_section in content:
        content = content.replace(media_section, media_replacement)

    # Replace nav+mobile HTML
    content = replace_nav_mobile_html(content, fname)

    # Replace footer HTML
    content = replace_footer_html(content, fname)

    # Update JS
    content = update_js_mobile(content, fname)

    if content != original:
        write_file(fname, content)
        print(f"Updated: {fname}")
    else:
        print(f"No changes: {fname}")


# ============================
# Process compact pages
# ============================
compact_pages = [
    'banking.html',
    'healthcare.html',
    'telecommunications.html',
    'technology.html',
    'about.html',
    'privacy-policy.html',
    'terms-of-service.html',
]

for page in compact_pages:
    try:
        process_compact_standard(page)
    except Exception as e:
        print(f"ERROR processing {page}: {e}")
        import traceback
        traceback.print_exc()


# ============================
# Handle simple pages that already have some structure but need full rebuild
# ============================

print("\nDone with compact pages.\n")
