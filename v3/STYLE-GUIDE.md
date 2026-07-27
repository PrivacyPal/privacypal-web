# PrivacyPal v3 — Design System & Page Building Guide

v3 is a complete redesign: minimal dev-tool SaaS aesthetic. White base, black ink,
quiet `#f5f5f5` panels, IBM Plex Mono eyebrow labels, pastel gradient accents,
generous whitespace, 12/20px radii. Fonts: **Overused Grotesk** (self-hosted,
loaded by `assets/v3.css`) + **IBM Plex Mono** (Google Fonts).

**Canonical example: `v3/index.html`. Read it before building any page.**

## Hard rules

1. Every page uses this exact skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PAGE TITLE — PrivacyPal</title>
<meta name="description" content="..." />
<link rel="icon" href="../assets/favicon.ico"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/v3.css"/>
<!-- og/twitter meta -->
</head>
<body>
<div id="site-nav-slot"></div>
...page content...
<div id="site-footer-slot"></div>
<script src="assets/v3.js"></script>
</body>
</html>
```

2. **Never** hand-write a nav or footer — the slots + `assets/v3.js` inject them.
3. Images and other root assets are referenced with `../` prefixes
   (e.g. `../assets/hero-shot-banking.png`, `../product-shot-001.png`).
   CSS/JS under `v3/assets/` are referenced *without* `../` (`assets/v3.css`).
4. Links between v3 pages are plain relative (`banking.html`, `pricing.html`).
5. Copy comes from the old page at the repo root. Keep every fact, number,
   feature list and claim. You may tighten headlines to fit the aesthetic
   (short, sentence case, no title case). **Never invent** stats, customers,
   testimonials or capabilities.
6. Demo CTAs: `<a class="btn btn-ghost" href="#" data-cta="demo">Book a demo</a>`.
   Download CTAs: `<a class="btn btn-primary" href="#" data-cta="download">Download</a>`.
   (v3.js binds these to shared modals.)
7. Page-specific CSS goes in one `<style>` block in `<head>`, uses the tokens
   (`var(--panel)`, `var(--muted)`, `var(--line)`, `var(--r-lg)` …), and stays small.
   If you need a component that exists in v3.css — use it, don't re-create it.
8. Headline style: sentence case, short, no trailing gimmicks. Eyebrows are
   lowercase-ish mono labels ("How it works", "Coverage", "By industry").

## Component reference (all in assets/v3.css)

| Component | Markup sketch |
|---|---|
| Page hero | `<header class="page-hero"><div class="container"><span class="eyebrow">label</span><h1>…</h1><p class="lede">…</p><div class="btn-row">…</div></div></header>` (add class `center` for centered variant; `page-hero-media` for a big screenshot below) |
| Section | `<section class="section"><div class="container"><div class="section-head [center]"><span class="eyebrow">…</span><h2>…</h2><p class="lede">…</p></div> …content… </div></section>` (use `section-sm` or inline `style="padding-top:24px"` to tighten) |
| Eyebrow accents | `eyebrow blue|pink|orange` (colored square dot) |
| Buttons | `btn btn-primary` (black), `btn btn-ghost` (bordered), `btn-lg`, `btn-sm`, wrap in `btn-row`; text links: `link-arrow` |
| Feature cards | `card-grid cols-2|cols-3|cols-4` > `feature-card` (`.ico` box + `h4` + `p`, optional `.ico grad-blue|grad-pink|grad-orange`, optional trailing `link-arrow`) |
| Media showcase | `showcase` (`.shot > img` + `.body > h4 + p`) inside `card-grid cols-3` |
| Gray panel | `panel` (rounded gray box, any layout inside), `panel-white` |
| Stats strip | `stats [cols-3]` > `stat` (`.n` big number w/ `<small>` unit + `.l` label) |
| Steps | `steps` > `step` (`.num` chip "01" + h4 + p) |
| Numbered deep-dive | `deep` (2-col) with `.num-tag` ("01 · Name"), left: eyebrow/h2/lede/btn-row, right: `deep-list` > `deep-item` (`<b>` + `<p>`) or a `card-grid cols-2` of feature-cards, or `.media > img` |
| Code / install | `code-block` (one-liner + copy button `data-cli-copy="cmd"`), `code-multi` (pre-formatted block, spans `.c` comment `.k` keyword `.s` string) |
| Before/after compare | `twin-compare` > `twin-box before|after` (+ `twin-mid > .bubble` arrow), `.red`/`.green` inline marks |
| Quote (small) | `quote-card` (blockquote + `.who` avatar/name) |
| Quote (large) | `bigquote` (blockquote with `<b>` gradient highlights + `.who`) |
| Pricing | `pricing-grid` > `price-card [dark]` (`.plan` + `price-badge`, `.price-desc`, `.amount` (`.big` + `small` + `.save`), `ul` ticks, `.btn`), `billing-toggle` |
| Industry rows | `industry-list` > `industry-row` (icon box + h4 + p + link-arrow) |
| CTA banner | `cta-banner [dark]` inside `container cta-stack` — h2 + p + btn-row. End most pages with ONE cta-banner section before the footer. |
| Prose | `prose` wrapper for articles/legal (styles h2/h3/p/ul/blockquote/code/pre, `.kicker`) |
| Forms | `form` wrapper, `.row` for 2-col, label + input/select/textarea |
| Tables | `table-wrap` > `table.compare` (`td.yes` / `td.no`) |
| Pills | `pill-row` > `pill` |
| Marquee | see index.html logos section |
| Reveal animation | add `reveal` (+ `reveal-delay-1|2|3`) to blocks; v3.js observes them |

## Icons
Inline stroke SVGs, 24px viewBox, `stroke-width:1.6–1.8`, no fill
(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">…`).
Copy icon paths from index.html or draw simple ones. No emoji.

## Available images (reference with ../)
- Logos: `../assets/logo-color.png` (nav/footer use this automatically)
- Product shots: `../product-shot-001.png` … `-007.png`, `../privacypal-screen-001.png`,
  `../assets/privacypal-desktop-claude-example.png`, `../assets/activity-feed-wide.png`,
  `../assets/gemini-protected-card.png`, `../assets/claude-processing-banner.png`,
  `../assets/privacypal-installer.png`, `../pp-ext-popup.jpg`, `../ppal-ext-light.png`,
  `../cws-screen-003.png`
- Industry heroes: `../assets/hero-shot-banking.png`, `-healthcare.png`, `-legal.png`,
  `-technology.png`, `-telecommunications.png`, `-about.png`
- Team photos: `../jason-melo.jpg`, `../chris-adamo.jpeg`, `../ralph_vetsch.jpeg`,
  `../brandon_turp.png`, `../erik-frantzen.jpg`, `../jordan_serlin.jpg`,
  `../palvinder-head.png` (check old team.html for who's who)
- Customer logos: see index.html marquee
- Integrations: `../assets/salesforce.svg`, `slack.svg`, `notion.svg`, `sqlserver.svg`,
  `workday.svg`, `oracle.svg`, `gdocs.svg`, `gdrive.svg`, `word.svg`,
  `../assets/chatgpt.png`, `claude.png`, `gemini.png`, `copilot.webp`
- Cloud logos: `../logos/aws.svg`, `azure.svg`, `gcp.svg`, `digitalocean.svg`, `vercel.svg`
- Partner: `../nvidia-inception-program-badge-rgb-for-screen.png`
