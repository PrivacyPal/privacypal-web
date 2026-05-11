"""Insert Open Graph + Twitter Card meta tags into every page so social
platforms always preview the PrivacyPal logo, never an in-page image like
the CorePLUS customer logo.

Idempotent: if og:image already exists, the block is replaced rather than
appended.
"""

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://privacypal.ai"
IMAGE_PATH = "assets/logo-color.png"
IMAGE_URL = f"{SITE}/{IMAGE_PATH}"
IMAGE_W = 4000
IMAGE_H = 1108
SITE_NAME = "PrivacyPal"
DEFAULT_DESC = "PrivacyPal creates Privacy Twins for your sensitive data so every prompt, file and connected source is safe before it ever reaches an AI."

SKIP = {"email-signature-template.html"}

BLOCK_START = "<!-- social-share-meta:start -->"
BLOCK_END = "<!-- social-share-meta:end -->"


def url_for(filename: str) -> str:
    if filename == "index.html":
        return f"{SITE}/"
    return f"{SITE}/{filename}"


def extract_first(pattern: str, html: str, default: str) -> str:
    m = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
    if not m:
        return default
    return re.sub(r"\s+", " ", m.group(1)).strip()


def build_block(page_url: str, title: str, description: str) -> str:
    # HTML-escape minimal quotes in extracted content
    def esc(s: str) -> str:
        return s.replace('"', "&quot;")

    title_e = esc(title)
    description_e = esc(description)
    return f"""{BLOCK_START}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="{SITE_NAME}" />
<meta property="og:url" content="{page_url}" />
<meta property="og:title" content="{title_e}" />
<meta property="og:description" content="{description_e}" />
<meta property="og:image" content="{IMAGE_URL}" />
<meta property="og:image:secure_url" content="{IMAGE_URL}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="{IMAGE_W}" />
<meta property="og:image:height" content="{IMAGE_H}" />
<meta property="og:image:alt" content="PrivacyPal" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title_e}" />
<meta name="twitter:description" content="{description_e}" />
<meta name="twitter:image" content="{IMAGE_URL}" />
<meta name="twitter:image:alt" content="PrivacyPal" />
<link rel="image_src" href="{IMAGE_URL}" />
{BLOCK_END}"""


def strip_existing(html: str) -> str:
    # Remove any prior managed block
    html = re.sub(
        re.escape(BLOCK_START) + r".*?" + re.escape(BLOCK_END) + r"\s*",
        "",
        html,
        flags=re.DOTALL,
    )
    # Remove any stray og:*/twitter:*/image_src tags outside the managed block
    html = re.sub(
        r'^[ \t]*<meta[^>]*\b(?:property|name)=["\'](?:og:[^"\']+|twitter:[^"\']+)["\'][^>]*>\s*\n?',
        "",
        html,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    html = re.sub(
        r'^[ \t]*<link[^>]*\brel=["\']image_src["\'][^>]*>\s*\n?',
        "",
        html,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    return html


def process(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    if "</head>" not in html.lower():
        return False

    title = extract_first(r"<title[^>]*>(.*?)</title>", html, SITE_NAME)
    description = extract_first(
        r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
        html,
        DEFAULT_DESC,
    )

    page_url = url_for(path.name)
    block = build_block(page_url, title, description)

    cleaned = strip_existing(html)

    # Insert before </head>
    new_html = re.sub(
        r"</head>",
        block + "\n</head>",
        cleaned,
        count=1,
        flags=re.IGNORECASE,
    )

    if new_html == html:
        return False
    path.write_text(new_html, encoding="utf-8")
    return True


def main() -> None:
    changed = []
    for p in sorted(ROOT.glob("*.html")):
        if p.name in SKIP:
            continue
        if process(p):
            changed.append(p.name)
    print(f"Updated {len(changed)} files:")
    for n in changed:
        print(f"  - {n}")


if __name__ == "__main__":
    main()
