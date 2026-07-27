# PrivacyPal — Version 3 (redesign preview)

A complete redesign of privacypal.ai living side-by-side with the current site.
Nothing outside `v3/` was touched — the live site keeps working as-is.

- **Preview locally:** `npm run serve` from the repo root, then open
  http://localhost:8000/v3/
- **On GitHub Pages** it deploys automatically at https://privacypal.ai/v3/

## Design direction

Minimal dev-tool SaaS aesthetic: white base, black ink, quiet `#f5f5f5` panels,
mono eyebrow labels, pastel gradient accents (blue/cyan, pink, orange), 12/20px
corner radii, generous whitespace, logo marquees, numbered product deep-dives,
mega-menu navigation with social icons, stacked CTA banners, and an
"ask your AI about PrivacyPal" row.

Typography:
- **Overused Grotesk** (variable, self-hosted at `assets/fonts/`, SIL OFL —
  license included alongside the font file)
- **IBM Plex Mono** (Google Fonts) for eyebrows, labels, code and stats units

See `STYLE-GUIDE.md` for the full component reference.

## Architecture

- Plain static HTML, same as the current site.
- `assets/v3.css` — the entire design system.
- `assets/v3.js` — injects announcement bar, nav (mega menus, mobile menu),
  footer, and the shared demo/download modals into the
  `#site-nav-slot` / `#site-footer-slot` placeholders on every page; also
  handles dropdowns, reveal-on-scroll, copy buttons and CTA bindings.
- `assets/blog.js`, `news.js`, `careers.js`, `events.js` — adapted copies of the
  root versions; they fetch the SAME data files (`../blog/blog.json`,
  `../news/news.json`, `../careers/jobs.json`) so content stays in sync with
  the live site automatically.
- Images are referenced from the repo root via `../` — no duplication.

## Promoting v3 to the live site (later)

1. Archive the current root pages (e.g. into `site-v3-prev/` — same pattern as
   `site-v1/`, `site-v2/`).
2. Move `v3/*.html` and `v3/assets/*` to the root.
3. Strip the `../` prefixes (they become root-relative):
   `sed -i '' 's|\.\./assets/|assets/|g; s|\.\./|""|g'`-style pass, plus set the
   data fetch paths in `assets/blog.js` / `news.js` / `careers.js` back to
   `blog/blog.json` etc.
4. Update `sitemap.xml`.

## To confirm before launch

- Social profile URLs in `assets/v3.js` (`SOCIAL` constant at the top) are
  placeholders pointing at presumed handles — verify/replace them.
- The footer newsletter form falls back to a `mailto:hello@privacypal.ai`
  signup (no list backend is wired in the repo).
