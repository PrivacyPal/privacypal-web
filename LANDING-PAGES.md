# PrivacyPal — Campaign Landing Pages & Funnel

A lightweight system for spinning up **conversion-focused landing pages** fast — for ad
campaigns, events, and activations — without touching the main site. Everything is plain
static HTML that reuses the existing design system, so a new page ships in ~10 minutes.

---

## What's in the system

| File | Role |
| --- | --- |
| `assets/landing.css` | The landing/funnel design layer (loads **after** `site.css`). Namespaces: `.lp-*` (landing), `.fn-*` (funnel/thanks). |
| `lp-template.html` | **The template.** Copy this to start any new page. Heavily commented; every editable value is marked `⇩EDIT`. |
| `funnel-thanks.html` | **Funnel step 2.** The post-conversion "momentum" page. Self-tailors via `?path=demo` / `?path=download`. |
| `lp-banking.html` | Implementation — Banking & FSI (enterprise, primary CTA = *Book a demo*). |
| `lp-legal.html` | Implementation — Legal (enterprise, primary CTA = *Book a demo*). |
| `lp-family.html` | Implementation — Consumer / PrivacyPal Family & Home (self-serve, primary CTA = *Download*). |

These live at the site root, so URLs are clean: `https://privacypal.ai/lp-banking.html`.
They are intentionally **not** in the main nav or `sitemap.xml` — campaign pages are reached
from ads/emails, and staying out of search keeps A/B variants from competing.

---

## The funnel map

```
   Ad / Email / QR / Event
            │
            ▼
   lp-<campaign>.html            ← Step 1: one page, one decision
            │
     ┌──────┴───────┐
     ▼              ▼
  Book a demo    Download           (both are shared modals from site.js —
  (calendar)     (Win/Mac)           just add data-cta="demo" or "download")
     │              │
     └──────┬───────┘
            ▼
   funnel-thanks.html?path=…      ← Step 2: confirm + push the complementary action
```

- **Enterprise pages** lead with *Book a demo*, keep *Download / trial* as the quiet second option.
- **Consumer pages** lead with *Download*, keep *See plans* as the second option.
- `funnel-thanks.html` keeps momentum: if they booked a demo it nudges *install now*; if they
  downloaded it nudges *book onboarding*. Link to it after a conversion, e.g. the consumer page's
  "Already installed? **Finish activating →**" points to `funnel-thanks.html?path=download`.

> To auto-redirect to the thank-you page *after* the modal completes, add a redirect in
> `site.js` (`openModal`/download handler). Today the modals stay in-page; the thank-you page is
> linked explicitly so nothing breaks if JS is blocked.

---

## Spin up a new landing page (checklist)

1. `cp lp-template.html lp-<campaign>.html`
2. Replace every `⇩EDIT` value: `<title>`, meta description, `og:`/`twitter:` block, eyebrow,
   headline, lede, CTAs, trust line, stakes, steps, benefits, quote, stats, FAQ, final CTA.
3. **Pick one goal.** Set the primary CTA (`data-cta="demo"` *or* `data-cta="download"`) in the
   header, hero, final CTA, and the sticky mobile bar — keep them consistent. Demote the other action to `.btn-ghost`.
4. **Choose a hero style:**
   - *Enterprise / dark photo* → `<section class="lp-hero on-dark lp-hero--split">` + a
     `<div class="lp-hero-photo"><img src="assets/hero-shot-XXXX.png"></div>`, and add `on-dark` to the header.
   - *Consumer / warm light* → default `<section class="lp-hero lp-hero--split">` with a
     `.lp-hero-stack` of product screenshots (see `lp-family.html`).
   - *Simple centered* → add `lp-hero--center` and drop the visual column.
5. Ship it. No build step — it's static HTML on GitHub Pages.

---

## Voice & design guardrails (so every page feels like PrivacyPal)

**Voice — "The Operator."** Second-person and direct. Punchy 2–4 word headlines, then one or two
sentences. Always name the *mechanism* (Privacy Twins / on-device / zero-knowledge) — never a bare
claim. Verb-led CTAs: *"Book a demo." "Download free." "Your move."* Confident, human, specific —
never salesy or over-explained.

**Type.** Radley (serif) for headlines & display, Inter for body/UI, JetBrains Mono for
kickers/labels. All three are already linked in every template.

**Color.** Cobalt `#336699` is the anchor; ink `#0b1220` for dark moments; amber `#e9a458` for
warmth (use the `.warm` accent + `.lp-benefits.warm` on consumer pages). Tokens live in `site.css`.

**Imagery** (from the brand kit): soft, natural, warm lighting — never harsh/stock/generic-AI.
Product screenshots cropped clean with a subtle shadow. Line-weight icons only (Feather/Phosphor
style), never filled/multicolor. Available heroes: `assets/hero-shot-{banking,legal,healthcare,technology,telecommunications,about}.png`.
Product proof art: `pp-ext-popup.jpg`, `assets/gemini-protected-card.png`, `assets/activity-feed-wide.png`.

---

## Component quick-reference (`landing.css`)

- `.lp-header` (`.on-dark`) — minimal fixed header (logo + one CTA).
- `.lp-hero` (`.on-dark`, `--split`, `--center`) + `.lp-hero-photo` / `.lp-hero-figure` / `.lp-hero-stack`.
- `.lp-trust` — logo/credibility strip.
- `.lp-section` (`.alt`, `.tight`), `.lp-wrap`, `.lp-head.center`, `.lp-h2`, `.lp-sub`.
- `.lp-stakes` + `.lp-stakes-grid`/`.lp-stake` — the human "why now".
- `.lp-steps`/`.lp-step` — 3-beat how-it-works.
- `.lp-benefits`(`.warm`)/`.lp-benefit` — benefit-first blocks.
- `.lp-split`(`.reverse`) + `.lp-split-figure` + `.lp-check` — image + checklist.
- `.lp-quote`, `.lp-stats`/`.lp-stat` — social proof.
- `.lp-faq` — CSS-only `<details>` accordion.
- `.lp-sticky` — mobile sticky CTA (auto-shows ≤760px).
- `.lp-footer` — minimal legal footer.
- `.final-cta` — reused from `site.css` for the closing block.
- Funnel: `.fn-main`, `.fn-steps`, `.fn-choices`/`.fn-choice`(`.feat`), `.fn-resources`.

CTAs, the demo/download modals, and reveal-on-scroll are all wired by `assets/site.js` — the same
file the whole site uses. Landing pages run **without** the full site nav; `site.js` was made
nav-safe so modals, `data-cta` binding, and `.reveal` still work.
