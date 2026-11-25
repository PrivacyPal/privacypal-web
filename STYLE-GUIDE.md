# PrivacyPal · Design System & Page Building Guide

The live site: a minimal dev-tool SaaS aesthetic. White base, Deep Navy `#01204E`
ink, quiet warm panels, IBM Plex Mono eyebrow labels, generous whitespace, 12/20px
radii. Fonts: **Overused Grotesk** (self-hosted, loaded by `assets/v3.css`) and
**IBM Plex Mono** (Google Fonts).

**The brand (November 2026 rebrand: the Privacy Penguin and One PrivacyPal).** The
logo mark is the penguin emoji itself: the Twemoji 🐧, unaltered. The visual reference
is the brand guidelines page, `brand/index.html` (https://privacypal.ai/brand/,
`noindex`, not in the sitemap): the penguin and its credit, the logo and its variants,
clear space and sizes, misuse, color, type, photography, icons, voice and naming, every
shared component shown live, and every brand file to download. This guide is the
engineering side of the same rules.

**Canonical corporate example: `business.html`. Read it before building any
standard page.** One brand everywhere: every root page, the homepage included, is in
the corporate system below. Fredoka (the Family display face) appears only inside
Family content sections: the `/family/` pages and the live family demo page
`webinars/family/` (`body.wb-family` in `webinars/webinars.css`), always with the
corporate nav and footer. The homepage sets `body.cinema`, which v3.css uses to render
the shared nav transparent over the hero photo until scroll (the nav swaps to the white
logo file for that state); do not reuse that class elsewhere.

## Color

Three core colors. Tokens live in `:root` in `assets/v3.css` (mirrored in
`assets/family-chrome.css`). Use the token, never the hex, in page CSS.

| Token | Hex | Name | Role |
|---|---|---|---|
| `--ink` | `#01204E` | Deep Navy | Text, dark sections, authority |
| `--teal` | `#028391` | Signal Teal | Actions: buttons, links, anything interactive |
| `--gold` | `#FFAC33` | Penguin Gold | The accent: the exact color of the emoji's beak and feet |

Gold support tokens:

| Token | Hex | Use |
|---|---|---|
| `--gold-deep` | `#E8941A` | Pressed state of gold fills, gold shading |
| `--gold-ink` | `#8A5A00` | The only gold allowed as text on white or light (5.9:1) |
| `--gold-tint` | `#FFF4E0` | Soft background wash for a callout or panel |
| `--gold-soft` | `#FFE3B3` | Highlighter behind a word, chip fills |

Supporting colors (small amounts, for meaning and warmth): `--sage` `#4DA394`
(trust, success), `--coral` `#D54751` (risk, one per section), `--ivory` `#F0ECC9`
and `--amber` `#F6DCAC` (background washes), `--espresso` `#503D2D` (grounding).
`--tangerine` `#F0914D` is retired from new work: gold is the warm accent now. Neutrals:
`--text` `#3A4763`, `--muted` `#68758E`, `--panel` `#F6F5EF`, `--line` `#E8E6DC`.
The legacy accent class and token names are kept but remapped: `blue`≙teal,
`pink`≙coral, `orange`≙tangerine.

**The gold rules (gold is a slight accent, never a theme):**
1. About 10% of any surface at most. One gold moment per section is usually right.
2. Where gold belongs: the penguin's own beak and feet, eyebrow dots, a highlighter
   behind one or two words, an underline under a key number, small badges ("Free",
   "New"), icon accent strokes or dots, focus rings, the active tab or toggle, thin
   rules, the stat number on a navy band.
3. Gold as text only on navy or dark photography (8.5:1 on navy). On white, never gold
   text; use `--gold-ink` for a small gold-family label.
4. The primary button is teal (`.btn-primary`) on white and light grounds. On navy or
   a dark photo it may be gold with navy text (`.btn-gold`).
5. Never gold with coral in the same element. Never a gold gradient on text.

Contrast, measured (WCAG 2.1): navy on white 15.9:1, navy on `--gold-soft` 12.8:1, body
text on white 9.3:1, gold on navy and navy on gold 8.5:1, navy on `--gold-deep` 6.6:1,
`--gold-ink` on white 5.9:1, `--teal-ink` on white 5.8:1, `--gold-ink` on `--gold-tint`
5.4:1, muted on white 4.6:1, white on teal 4.5:1. Gold on white is 1.9:1: marks, dots
and fills only, never text.

## The logo and the penguin

**The mark is the penguin emoji itself:** Twemoji 🐧 (U+1F427), v17.0.3, unaltered, so
the logo and a typed 🐧 are the same drawing. Twemoji is Copyright Twitter, Inc. and
other contributors, licensed under CC BY 4.0, which requires a credit:

- **The footer credit.** `assets/v3.js` injects it into every footer as
  `p.footer-credit` (styled in `assets/v3.css`): "Penguin emoji graphic from Twemoji, ©
  Twitter, Inc. and other contributors, licensed under CC BY 4.0." with links to
  https://github.com/jdecked/twemoji and https://creativecommons.org/licenses/by/4.0/.
  Never remove it. A page with its own footer (the `lp-*` pages, `family/founding/`,
  `partners/`) carries the same line if it shows the penguin.
- **Everywhere else** the penguin is published (documents, decks, videos, the brand
  pack), credit it in a way that fits the medium: the same line in the small print, or a
  link to https://privacypal.ai/brand/, which carries it.
- **Not exclusive.** Anyone may use the same emoji artwork. What identifies PrivacyPal,
  and what we protect, is the "🐧 PrivacyPal" lockup and the PrivacyPal word mark.

**Each platform draws its own 🐧.** Apple, Google and Microsoft ship their own penguin
artwork; Discord and the X website draw emoji with Twemoji, so there a typed 🐧 is our
mark exactly. On PrivacyPal pages `assets/v3.js` renders every typed 🐧 as
`assets/brand/penguin.svg` (an `img.pp-emoji`, alt "🐧"), so "🐧 PrivacyPal" in copy
always shows our penguin. It leaves the character alone inside `script`, `style`,
`textarea`, `input`, `code`, `pre`, `title`, `option`, `noscript` and any element marked
`data-raw-emoji` (use that attribute to show a device's own emoji on purpose, as the
brand guide does). Never use Apple's or another vendor's emoji artwork in a design.

All brand files live in `assets/brand/` (one source of truth; pages reference them,
never copy them):

| File | Use |
|---|---|
| `logo.svg` | The lockup (penguin and navy wordmark). White and light grounds. The default. |
| `logo-white.svg` | Navy, dark sections and dark, calm areas of a photo. The penguin keeps its colors; the wordmark is white. |
| `penguin.svg` | The mark alone: the Twemoji penguin on a 512 canvas. Every size from a 16px favicon up, every ground. |
| `penguin-flat.svg`, `penguin-dark.svg`, `penguin-guide.svg`, `penguin-guide-dark.svg` | The same emoji under earlier names, kept so existing references keep working. Use `penguin.svg` in new work. |
| `app-icon.svg` | The penguin on the white rounded tile: app icon, the download window header, avatars. |
| `favicon.svg` | The SVG favicon: the same penguin. |
| `png/` | PNG exports of all of the above at several sizes. |
| `og/og-*.png` | Open Graph share cards, 1200x630: `default`, `home`, `personal`, `family`, `business`, `pricing`, `download`. |
| `social/` | The profile picture (400px, white tile), LinkedIn, X and YouTube banners, square post examples. |
| `src/` | Sources the build reads: `twemoji-1f427.svg` (the emoji as Twemoji publishes it), its copies on the 512 canvas and the wordmark outlined from Overused Grotesk 600. Edit these, never the outputs. |

**The lockup** is set the way "🐧 PrivacyPal" sits in a line of type
(`scripts/brand/build-brand.js`, `LOCK`): the penguin is 1.6x the cap height, its feet
sit 0.14 cap height below the baseline, and the gap to the P is 0.22x the penguin
height. The wordmark is Overused Grotesk 600, outlined, one color (Deep Navy on light,
white on dark).

Rules:
- Clear space around the logo equals the penguin's height, on every side.
- The lockup is at least 120px wide on screen (30 mm in print). Smaller than that, use
  the penguin alone (`penguin.svg`, one file at every size) or `app-icon.svg`.
- On dark grounds use `logo-white.svg`: the penguin keeps its colors and only the
  wordmark turns white. **Never recolor the logo with a CSS filter**
  (`filter:brightness(0) invert(1)` erases the penguin). Never redraw, trace, recolor,
  flip, tilt, outline, shadow, stretch or animate the penguin, and never build the logo
  from an emoji and a typeface: where the logo goes, place the file.
- **No gold tile.** On gold the penguin's beak and feet disappear. The white tile
  (`app-icon.svg`) is the app icon and the avatar.
- One penguin per view. It is a signature, not wallpaper: never a pattern, never props
  (no padlock, shield, key or badge), and no new poses: the penguin is exactly as
  Twemoji draws it.
- **Never show Tux** (the Linux penguin) and never put our penguin on a Linux tile: the
  Linux platform glyph is a terminal prompt (`>_`).
- In plain text (social posts, bios, chat, email subject lines) type the character:
  `🐧 PrivacyPal`. Interface icons are line drawings, never emoji; 🐧 is the one emoji we
  use, and on our pages it renders as the mark.
- Inline mark in a line of text: type 🐧 (v3.js renders it), or place
  `<img class="pp-penguin" src="assets/brand/penguin.svg" alt="">` (sizes itself to the
  text).
- **Legacy logo PNGs** (`assets/logo-color.png`, `assets/logo-light.png`,
  `privacypal-logo.png`, `privacypal-logo-color.png`, `privacypal-logo-light.png`,
  `family/assets/product/logo-color.png`) now hold the new lockup, rendered by
  `scripts/brand/legacy-logos.js`. They exist only because emails, the RSS feed, JSON-LD
  and third parties hotlink them. **Never use them in page code.** The old infinity
  symbol is retired everywhere.

## Hard rules

1. Every page uses this exact skeleton (pages in a subdirectory prefix `../`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PAGE TITLE · PrivacyPal</title>
<meta name="description" content="..." />
<link rel="icon" href="assets/favicon.ico" sizes="any"/>
<link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="apple-touch-icon.png"/>
<meta name="theme-color" content="#01204E"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/v3.css"/>
<meta property="og:image" content="https://privacypal.ai/assets/brand/og/og-default.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://privacypal.ai/assets/brand/og/og-default.png" />
<!-- plus og:type, og:url, og:title, og:description, twitter:title -->
</head>
<body>
<div id="site-nav-slot"></div>
...page content...
<div id="site-footer-slot"></div>
<script src="assets/v3.js"></script>
</body>
</html>
```

   Open Graph and Twitter images are always absolute `https://privacypal.ai/...` URLs.
   Use the page's own image if it has one without the old logo; otherwise
   `assets/brand/og/og-default.png`. Pack pages use `og-personal.png`, `og-family.png`,
   `og-business.png`; the homepage `og-home.png`; pricing `og-pricing.png`; download
   `og-download.png`. Internal pages (the brand guide, collateral, templates) carry
   `<meta name="robots" content="noindex,nofollow"/>` and stay out of `sitemap.xml`.

2. **Never** hand-write a nav or footer; the slots and `assets/v3.js` inject them (the
   announcement bar, nav with mega menus, mobile menu, footer, the one download modal and
   the demo modal). The menus are Product (One app, three packs; Access; Use cases),
   Platform (Identify, Protect, Govern), Pricing and Company, and the footer mirrors
   them. The slot reserves the chrome's height so nothing jumps. The footer
   carries the company address (`.footer-addr`). The same address appears in the
   Headquarters card on `contact.html` and in the one-line footers of the `lp-*` landing
   pages, `family/founding/` and `partners/`. If it ever changes, change all of them,
   plus the `PostalAddress` JSON-LD in `contact.html`. Edits to the Announcement, Nav,
   Footer or Modal sections of `assets/v3.css` (and to the tokens) are mirrored in
   `assets/family-chrome.css` in the same change.
3. Assets are referenced from the site root: `assets/...` on root pages, `../assets/...`
   from a subdirectory (`v3.js` derives its own prefix for the chrome).
4. Links between pages are plain relative (`business.html`, `pricing.html`).
5. Copy for a page that replaces an older one comes from that page's last version in git
   history. Keep every fact, number, feature list and claim. You may tighten headlines to
   fit the aesthetic (short, sentence case). **Never invent** stats, customers,
   testimonials or capabilities.
6. Calls to action:
   - Demo: `<a class="btn btn-ghost" href="#" data-cta="demo">Book a demo</a>`.
   - Download: `<a class="btn btn-primary" href="download.html" data-cta="download">Download free</a>`.
     Every `data-cta="download"` and `data-cta="family-download"` opens the same single
     download modal, with the same builds; a modified click (new tab) follows the
     `download.html` href.
   - **Never hardcode a build URL.** Download URLs live in exactly one place, the
     `DOWNLOADS` config at the top of `assets/v3.js`.
   - Family "start your trial" CTAs go to `family/founding/` (the coded Founding Families
     page), never straight to the portal's `/signup`.
7. Page-specific CSS goes in one `<style>` block in `<head>` (or one page stylesheet for a
   large page, as `brand/assets/guide.css` does), uses the tokens (`var(--panel)`,
   `var(--muted)`, `var(--line)`, `var(--r-lg)` …), and stays small. If a component exists
   in v3.css, use it; don't re-create it. Avoid page classes that collide with v3.css
   components (`.panel`, `.split`, `.stat`): prefix page classes.
8. **No em dashes (U+2014) anywhere**: copy, titles, meta tags, alt text and visible
   comments. Use a comma, colon, period, parentheses or a sparing semicolon. Step
   labels use the middle dot ("01 · Name"); numeric ranges use an unspaced en dash
   ("1–9 users"). Title tags end in " · PrivacyPal".
9. Headline style: sentence case, short, no exclamation marks. Eyebrows are lowercase-ish
   mono labels ("How it works", "Coverage", "By industry"). US spelling (color, license,
   organization).

## Naming: One PrivacyPal

There is one product, **PrivacyPal**, and one download. Everything a person can buy or be
given is a **pack** that switches on inside the same app. The packs are **Personal**,
**Family** and **Max**, and they stack (Max from an employer and Family for the kids, in
the same app).

| Pack | Price | Who | Platforms |
|---|---|---|---|
| **Personal** (formerly Pro) | Free (no card, no trial clock, no expiry) | Any individual, included with every download | Mac and Windows |
| **Family** | $9.99/month per household, up to 5 family members, 5-day free trial | Parents | Mac, Windows, iPhone, iPad, Android (phones protected today, installed by invitation) |
| **Max** | $34/user/month for 1–9 users, volume pricing from 10 users (bands in `pricing.html`), paid from day one | Organizations, or provided under a company's or partner's license | Mac, Windows, the Linux headless agent, iPhone, iPad, Android (phones protected today, installed by invitation) |

- The product, always: **PrivacyPal**. Use it alone wherever the pack is obvious.
- Packs on cards, chips, tables and toggles: **Personal**, **Family**, **Max**, e.g.
  "Max · $34/user/mo". In sentences: "the Family pack", "the Max pack", "Personal (free)"
  or "Personal, included free".
- Audience framing stays: **PrivacyPal for families**, **PrivacyPal for business**
  (lowercase audience word) in titles and headings, e.g.
  `<title>PrivacyPal for families · PrivacyPal</title>`; "Your business";
  `business.html`. Business is the audience and Max is the pack: never
  "Business pack".
- CTAs: "Download free", "Add the Family pack" or "Start Family free", "Get Max" or
  "Buy Max", "Talk to sales", "Book a demo".
- **Max is paid from day one.** A larger rollout goes to "Talk to sales" or "Book a
  demo"; those two CTAs, beside "Get Max" and "Buy Max", are the paths a page, partner
  page or PDF offers for Max.
- **Phones are protected today with the Family and Max packs.** Write: "Protected today
  on iPhone, iPad and Android with Family or Max. Install by invitation." (or a close
  variant). Phones are never "early access". Never list phones on a Personal card or
  page. Linux is the Max headless agent.
- **Microsoft Copilot and Claude Code are Max only**, never Family features. The Family
  pack protects the OpenAI API and the xAI API for parents; a parent can hold Max on top
  of Family, paid by them or by their company.
- **Invitations:** a company can invite Personal users and Family pack holders into its
  Max account under a license it provisions; the seat stacks with their own Family pack
  ("Your company can add Max to your PrivacyPal account").
- **Identity:** "One PrivacyPal account for you. Your kids keep their own protected
  profiles."
- **PrivacyPal Cloud** and **PrivacyPal SDK** keep their names. Present them as the
  "Deploy" and "Build" options of PrivacyPal for business, beside the Max pack, not as
  rival products.
- **Retired names:** never write "PrivacyPal Pro", "PrivacyPal Max" or "PrivacyPal
  Family" as product names, and never "Pro" as a plan. Historical records (blog posts,
  news releases, past event pages) keep the names they were published with; legal pages
  are edited by counsel only. Internal identifiers that no visitor reads stay as they are
  (`.pack-card.business`, `.pack-chip.business`, `data-price="max-*"` in
  `assets/pricing.js`).

## Voice and claims

The Operator: lead with the point, name the mechanism in one clause, talk to one person
(second person, imperative CTAs), and say what PrivacyPal does, never what it doesn't
(affirmative copy only; no "not covered" blocks). Never "honest/honestly" as framing,
never "load-bearing", never name a competitor.

- Core line: "We protect your data from AI, at home and at work."
- Proof line: "The same technology that protects 140+ companies."
- Mechanism: "Protection runs on the device, before a prompt or file reaches an AI
  provider. Sensitive details are swapped for Privacy Twins, realistic stand-ins, so the
  AI still works and the real data never reaches the AI provider." Avoid absolute
  wording such as "the real data never leaves" or "100% on-device"; "never reaches the
  AI provider" is the form to use.
- Approved proof: 140+ companies; tens of millions of protected data elements;
  NVIDIA Inception member; 0 bytes of sensitive data sent to
  AI providers (a mechanism statement); patent-pending Privacy Twins. Any other number
  needs a source before it ships. Never "hundreds of companies", 340ms latency or 47 data
  types, and never invent a testimonial, customer or stat.

## Component reference (all in assets/v3.css)

| Component | Markup sketch |
|---|---|
| Page hero | `<header class="page-hero"><div class="container"><span class="eyebrow">label</span><h1>…</h1><p class="lede">…</p><div class="btn-row">…</div></div></header>` (add class `center` for centered variant; `page-hero-media` for a big screenshot below) |
| Section | `<section class="section"><div class="container"><div class="section-head [center]"><span class="eyebrow">…</span><h2>…</h2><p class="lede">…</p></div> …content… </div></section>` (use `section-sm` or inline `style="padding-top:24px"` to tighten) |
| Eyebrow accents | `eyebrow blue|pink|orange|gold` (colored square dot) |
| Buttons | `btn btn-primary` (teal, the primary action on light grounds), `btn btn-gold` (primary action on navy or dark photography only), `btn-ghost` (bordered), `btn-panel` (warm gray), sizes `btn-lg`, `btn-sm`, wrap in `btn-row`; text links: `link-arrow` |
| Gold accents | `mark-gold` (highlighter behind 1–2 words), `ul-gold` (gold underline under a key number), `text-gold` (navy or dark photo only), `badge-gold` ("Free", "New"), `dot-gold` |
| Inline penguin | Type 🐧 (v3.js renders it as `img.pp-emoji`), or `<img class="pp-penguin" src="assets/brand/penguin.svg" alt="">` |
| Pack chip | `<span class="pack-chip personal|family|business">Family · $9.99/mo</span>` (dot: teal, gold, navy). The `business` class is the Max pack: label it "Max · $34/user/mo". Inside an `.on-dark` ancestor the chips switch to the dark style. |
| Pack cards | `pack-grid` > `pack-card personal|family|business [dark]` with `.pack-head` (`.pack-name`, `.pack-for`, optional `badge-gold`), `.pack-price` (`.big` + `small`), `.pack-desc`, `ul > li`, `.pack-cta` (`.btn` + `.pack-fine`). The `business` card is named Max. A `dark` card takes `btn-gold`. Never list phones on the Personal card. |
| Platform tiles | `platform-grid list-sm` > `a.platform[data-os][data-dl]` with `svg.os-ico`, `.os-name`, `.os-meta`, `.os-go` (`list-sm` turns the tiles into compact rows on phones, the visitor's own first; every download surface uses it). Linux is `div.platform.multi` with `.os-links` (x86_64, aarch64), meta "The Max headless agent · CLI". `v3.js` fills every `data-dl` href from `DOWNLOADS` and adds `.is-you` to the visitor's platform. Linux uses the terminal glyph, never a penguin. Phone tiles say "Protected today with Family or Max · install by invitation" and link to the invitation request page (`family/early-access.html`, a URL kept for old links; no store badges). |
| Packs stack window | `stack-app` > `.bar` (`.dots` + `.title` with `pp-penguin`) + `.row` (`.ico` + `div(b, small)` + `.toggle.on[.gold|.ink]`). Personal teal, Family gold, Max navy. |
| Feature cards | `card-grid cols-2|cols-3|cols-4` > `feature-card` (`.ico` box + `h4` + `p`, optional `.ico grad-blue|grad-pink|grad-orange`, optional trailing `link-arrow`) |
| Media showcase | `showcase` (`.shot > img` + `.body > h4 + p`) inside `card-grid cols-3` |
| Gray panel | `panel` (rounded gray box, any layout inside), `panel-white` |
| Stats strip | `stats [cols-3]` > `stat` (`.n` big number with `<small>` unit + `.l` label) |
| Steps | `steps` > `step` (`.num` chip "01" + h4 + p) |
| Numbered deep-dive | `deep` (2-col) with `.num-tag` ("01 · Name"), left: eyebrow/h2/lede/btn-row, right: `deep-list` > `deep-item` (`<b>` + `<p>`) or a `card-grid cols-2` of feature-cards, or `.media > img` |
| Code / install | `code-block` (one-liner + copy button `data-cli-copy="cmd"`), `code-multi` (pre-formatted block, spans `.c` comment `.k` keyword `.s` string) |
| Before/after compare | `twin-compare` > `twin-box before|after` (+ `twin-mid > .bubble` arrow), `.red`/`.green` inline marks |
| Quote (small) | `quote-card` (blockquote + `.who` avatar/name) |
| Quote (large) | `bigquote` (blockquote with `<b>` gradient highlights + `.who`) |
| Pricing | `pricing-grid` > `price-card [dark]` (`.plan` + `price-badge`, `.price-desc`, `.amount` (`.big` + `small` + `.save`), `ul` check marks, `.btn`), `billing-toggle`, `seat-calc` (driven by `assets/pricing.js`) |
| Industry rows | `industry-list` > `industry-row` (icon box + h4 + p + link-arrow) |
| CTA banner | `cta-banner [dark]` inside `container cta-stack`: h2 + p + btn-row. End most pages with ONE cta-banner section before the footer. |
| Prose | `prose` wrapper for articles/legal (styles h2/h3/p/ul/blockquote/code/pre, `.kicker`) |
| Forms | `form` wrapper, `.row` for 2-col, label + input/select/textarea |
| Tables | `table-wrap` > `table.compare` (`td.yes` / `td.no`) |
| Pills | `pill-row` > `pill` |
| Marquee | see index.html logos section |
| Customer stories | homepage only: `.tm-grid` > `.tm-card[data-story]` (`.tm-media` with the 4:5 cover, `.tm-prev` hover loop, `.tm-play` pill; `.tm-who` with `.tm-name > button.tm-open`, `.tm-role` and the company logo `img.tm-co`) and the `#tmModal` video modal. Names, titles and quotes come from the person's own recording and release; never draft them. See `README.md`, Homepage customer stories |
| Reveal animation | add `reveal` (+ `reveal-delay-1|2|3`) to blocks; v3.js observes them |

## Downloads

One "Download PrivacyPal" everywhere: Mac (Apple Silicon), Windows, Linux (the Max
headless agent CLI), iPhone and iPad, Android. The canonical page is `download.html`;
`install.html` and `desktop.html` point to it. Personal runs on Mac and Windows.
iPhone, iPad and Android are protected today with the Family or Max pack and install by
invitation (through Apple TestFlight and Google Play testing): there is no public App
Store or Google Play listing yet, so no store badges and no store URLs anywhere.

`DOWNLOADS` at the top of `assets/v3.js` is the only place build URLs live. On a release,
update the version in its URLs and `version` (Linux has its own `linux.version`).
**There is no separate Family download.** One PrivacyPal: the Family pack switches on
inside the same app, so every page and trigger (the `/family/` pages,
`data-cta="family-download"`, `data-pack="family"`) gets the same builds. Never link to a
Family-only installer or the Family portal's download routes. Page scripts can read
`window.PPDownloads` (`version`, `device`, `hrefFor(key)`).

## Icons

Inline stroke SVGs, 24px viewBox, `stroke-width:1.6–1.8`, round caps and joins, no fill
(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">…`), navy
at rest and teal when interactive. Gold only as one accent stroke or dot. Platform glyphs:
the filled Apple and Windows marks; line glyphs for phones, Android, and `>_` for Linux
(the set lives in `ICONS` in `assets/v3.js`). Copy icon paths from existing pages or draw
simple ones. Icons are never emoji; the one emoji we use is 🐧, which renders as the mark.

## Photography

Real-feeling people in real places, warm natural cinematic light, shallow depth of field,
one shared grade (warm highlights, deep navy shadows, a touch of gold in the light).
Screens in shot are out of focus or angled away; nothing on a screen is readable.
Landscape heroes keep a calm left third for the headline. No security clichés (padlocks,
shields, holograms, blue code overlays): the interface cards show the protection. Never
the same photo twice in one view.

**Family casting.** Every Family image casts a mother with one or two children aged 7 to
17 (a 7-to-10-year-old, a tween or a teen), doing what kids that age do with AI and
games: homework help, a laptop or tablet at the kitchen table, a phone on the sofa, a
game on the family computer. A dad can join her as a second parent. Copy examples use
the same ages ("Mia, 11", "homework help", "her phone"). In `family/assets/photos/`,
use `homework-boy.jpg`, `teens-sunset.jpg`, `study-together.jpg` and `classroom.jpg`;
`couch-tablet.jpg`, `hero-dad-kids.jpg`, `paint-girl.jpg`, `family-beach.jpg` and
`teens-friends.jpg` (young adults, no mother) are retired from every page, document and
template.

Some photos are placeholders for final photography. Each carries
`data-standin="<final file path>"`; when the final file lands at that path, switch the
`src` (a search for `data-standin` lists every swap). The collateral and OG builds pick up
the final file automatically. The homepage serves graded crops from `assets/home/`, built
by the scripts in `scripts/home/` (see `README.md`, Brand assets).

## Available images

- Logos and the penguin: `assets/brand/` (see the table above). The chrome uses
  `assets/brand/logo.svg` and `logo-white.svg` automatically.
- Product shots to use: the interim crops `product-shot-002-activity.png`,
  `product-shot-003-classify.png`, `product-shot-004-agents.png`, `product-shot-005-event.png`,
  `product-shot-007-panel.png`,
  `assets/privacypal-desktop-claude-example-trim.png` (the Claude desktop example with both
  title bars cut; `/family/` pages use its copy
  `family/assets/product/privacypal-desktop-claude-example-trim.png`) and
  `assets/privacypal-desktop-claude-panel.png` (the PrivacyPal panel alone, cropped from the
  trim). Also `privacypal-screen-001.png`, `assets/activity-feed-wide.png`,
  `assets/gemini-protected-card.png`, `assets/claude-processing-banner.png`,
  `assets/privacypal-installer.png`, `pp-ext-popup.jpg`, `ppal-ext-light.png`,
  `cws-screen-003.png`.
- **Do not use until re-captured** (internal photo brief, section 10): the full captures
  `product-shot-001.png` to `product-shot-007.png`, which show the ring logo and, in some,
  "Pro Plan", a "PRO" user header, the browser extension button, proxy and mitmproxy rows
  and a placeholder note. `product-shot-001.png` stays only where privacypal-ai.html
  already uses it. The untrimmed
  `assets/privacypal-desktop-claude-example.png` (and its `family/assets/product/` copy)
  carries the same retired title bars: use it only behind a CSS crop that hides the top
  416 px, as `device-control.html` (`.shot-trim`) and `partners/program.html` (`.crop`) do.
- Industry heroes: `assets/hero-shot-accounting.png`, `-banking.png`, `-healthcare.png`,
  `-legal.png`, `-technology.png`, `-about.png` (large PNGs: 2–6 MB each)
- Team photos: `jason-melo.jpg`, `shayra-antia.jpg`, `cian-omaidin.jpg`,
  `chris-adamo.jpeg`, `jordan_serlin.jpg`, `ralph_vetsch.jpeg`,
  `brandon_turp.png` (check `team.html` for who's who)
- Customer logos: see the index.html marquee
- Integrations: `assets/salesforce.svg`, `slack.svg`, `notion.svg`, `sqlserver.svg`,
  `workday.svg`, `oracle.svg`, `gdocs.svg`, `gdrive.svg`, `word.svg`,
  `assets/chatgpt.png`, `claude.png`, `gemini.png`, `copilot.webp` (lockups),
  `grok.svg`, `hermes.svg` (stand-in lockups until official brand assets land),
  `glyph-chatgpt.png`, `glyph-claude.png`, `glyph-gemini.png`, `glyph-copilot.png` (square glyphs)
- Cloud logos: `logos/aws.svg`, `azure.svg`, `gcp.svg`, `digitalocean.svg`, `vercel.svg`
- Partner: `nvidia-inception-program-badge-rgb-for-screen.png`
- Launch film: `assets/home/launch-film.mp4` (1080p H.264, 1:22, the interim cut the
  homepage plays), poster `assets/family-launch-poster.jpg`. **Do not use until
  re-rendered** (internal photo brief, section 10): the full film
  `assets/family-launch-film.mp4` (1:52), which carries retired naming, Copilot as a Family
  feature and "never leaves home" claims, and its chip thumb `assets/family-launch-card.jpg`
  (the ring logo with a "Family" badge).
- Family photography: `family/assets/photos/` (see Family casting under Photography for
  which files to use).

## Brand build

The brand files are generated, not hand-edited. See `README.md` (Brand assets) for the
commands. With Node 20 on the PATH (puppeteer 21 needs it):

| npm script | Runs | Makes |
|---|---|---|
| `npm run brand` | `build-brand.js`, then `legacy-logos.js` | The penguin files, logos, app icon, favicons and PNGs; the legacy logo PNGs and the brand pack ZIP |
| `npm run brand:og` | `build-og.js` | Share cards, social images, the slide template PDF |
| `npm run brand:collateral` | `build-collateral.js` | The one-pager and brochure PDFs |
| `npm run brand:all` | `build-brand.js`, `build-og.js`, `build-collateral.js`, `scripts/generate-partner-pdf.js`, then `legacy-logos.js` last | Everything, plus the partner link PDFs |

The brand pack ZIP includes the social images. `brand:all` builds it last, after
`build-og.js`, so it is already current. After a standalone `brand:og`, refresh it with
`node scripts/brand/legacy-logos.js --pack-only`.
