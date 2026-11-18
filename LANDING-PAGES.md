# PrivacyPal campaign landing pages

Campaign pages are single-purpose funnel pages for ads, email, partner links and events. They
are plain static HTML on GitHub Pages, built on the site design system (`assets/v3.css`) plus
one landing layer (`assets/landing.css`). A new page is a copy of `lp-template.html` with its
marked values changed.

Every campaign page:

- lives at the site root, so the URL is short: `https://privacypal.ai/lp-<campaign>.html`
- is `noindex,follow` and stays out of `sitemap.xml` and the site nav, so A/B variants never
  compete in search
- carries its own minimal header and footer, with no `#site-nav-slot` / `#site-footer-slot`
- still loads `assets/v3.js` last, for the shared modals and CTA bindings (see below)
- loads the Google tag and the Meta Pixel

## Files

| File | Role |
| --- | --- |
| `assets/landing.css` | The landing layer. Loads after `assets/v3.css` and only adds `lp-*` components; tokens, buttons, gold utilities and pack components come from v3.css. |
| `lp-template.html` | The starting point. Every editable value is marked in a comment (`EDIT`, `OPTION A/B`, `OPTIONAL`, `KEEP`). Contains both hero options; open `lp-template.html?hero=light` to preview the light one. |
| `lp-banking.html` | Banking and financial services. Light split hero. Goal: book a demo. |
| `lp-ciso.html` | Security leaders (LinkedIn). Dark centered hero. Goal: book a briefing. |
| `max-offer.html` | The Max pack offer page for partners, resellers and campaigns. Navy hero with a live price card. Goal: buy the Max pack. The URL is kept because ads and partner links point at it (`partners/max-affiliate-links.html` hands out `max-offer.html?ref=<code>`). |
| `funnel-thanks.html` | Step 2 of a funnel: the confirmation page. A normal site page (site nav and footer). Tailors itself with `?path=demo` or `?path=download`. |

## The funnel

```
Ad, email, QR code, partner link
        │
        ▼
lp-<campaign>.html         step 1: one page, one decision
        │
   ┌────┴─────┐
   ▼          ▼
Book a demo   Download free     both are shared modals from assets/v3.js:
(calendar)    (one download)    data-cta="demo" and data-cta="download"
   │          │
   └────┬─────┘
        ▼
funnel-thanks.html?path=demo | ?path=download     step 2: confirm, offer the other action
```

- **Business pages** lead with *Book a demo* (or *Get Max* on the offer page) and keep
  *Download free* as the quiet second action: every download includes Personal, free.
- **Self-serve pages** lead with *Download free* and keep *See plans* (`pricing.html`) second.
- **Family pages** lead with *Start Family free* (the 5-day trial) and link to the Founding
  Families page `family/founding/`, which carries its own offer code. Never link straight to
  the Family signup.
- The modals stay in-page. Link to `funnel-thanks.html` explicitly where it helps, for example
  "Already installed? Finish setting up" pointing at `funnel-thanks.html?path=download`.

## What `assets/v3.js` does on a campaign page

v3.js finds no slots, so it injects no nav or footer. It does inject and bind:

- `data-cta="demo"` (also `href="#demo"`): the demo-booking modal.
- `data-cta="download"` (also `href="#download"`): the one download modal (Mac and Windows for
  everyone; iPhone, iPad and Android with the Family or Max pack, protected today and installed
  by invitation; the Linux headless agent with the Max pack). Give every download link
  `href="download.html"` as well, so it still works without JavaScript. Add `data-pack="family"`
  on a Family page or trigger so the modal serves the Family build.
- Build URLs live only in the `DOWNLOADS` config at the top of v3.js. Page code never contains
  a build URL, a version number or a store link.
- `.reveal` (+ `reveal-delay-1|2|3`): fade-up on scroll. Add class `in` to anything above the
  fold so it is visible on first paint.
- `assets/referral.js`: captures `?ref=`, `?partner=` or `?aff=` for 90 days and carries it to
  signup. Load it directly in `<head>` as well only when a script on the page reads
  `window.PPReferral` before v3.js runs (max-offer.html does).

## Spin up a new page

1. `cp lp-template.html lp-<campaign>.html`
2. Pick a hero: keep OPTION A (dark photo) or OPTION B (light split) and delete the other
   option's header and hero (the two `data-hero` blocks), including the `hidden` attribute on
   the one you keep.
3. Delete everything marked `TEMPLATE PREVIEW ONLY` (the switcher `<style>`, `<nav>` and
   `<script>`).
4. Change every `EDIT` value: `<title>`, description, robots (`noindex,follow`), og/twitter
   tags (`og:url` = the new URL), eyebrow, headline, lede, CTAs, the Privacy Twin card, stakes,
   steps, benefits, FAQ, final CTA, footer links, sticky CTA.
5. Pick one goal. The header CTA, hero primary, final CTA primary and sticky mobile CTA all do
   the same thing. The other action is a `.btn-ghost`.
6. Delete the `OPTIONAL` blocks you do not need (packs, split, chips).
7. Check the page (see QA) and ship. There is no build step.

## Hero options

| Option | Markup | Header | Use |
| --- | --- | --- | --- |
| Dark photo | `<section class="lp-hero on-dark lp-hero--photo">` with `<div class="lp-hero-bg"><img></div>` and an optional `.lp-hero-aside` (the glass Privacy Twin card) | `.lp-header.on-dark` + `logo-white.svg` | Business, security, paid social |
| Light split | `<section class="lp-hero lp-hero--split">` with `.lp-hero-photo > img` and an optional `.lp-swap` card | `.lp-header` + `logo.svg` | Industry and self-serve pages (lp-banking) |
| Dark centered | `<section class="lp-hero on-dark lp-hero--center">` | `.lp-header.on-dark` + `logo-white.svg` | Text-led pages (lp-ciso) |
| Navy offer | `<section class="lp-hero on-dark">` with page-local layout | `.lp-header.navy` + `logo-white.svg` (sticky) | Offer pages with a price card (max-offer) |

On every dark hero, `.btn-primary` turns gold with navy text and `.btn-ghost` turns to glass.
A light card inside a dark hero (the max-offer price card) resets its buttons to teal.

Photo heroes: landscape about 2400 x 1500, subject in the right two thirds, the left third calm
and dark. Set the crop with `--pos` (desktop) and `--pos-m` (phones) on `.lp-hero-bg`. The layer
adds a navy grade, a shallow-focus blur on the copy side and one warm grade, so different photos
read as one shoot. On phones the photo sits on top and the copy below it on navy.

## Components (`assets/landing.css`)

- `.lp-header` (`.on-dark`, `.navy`), `.lp-logo`, `.lp-header-note`, `.lp-header-right`
- `.lp-hero` (`.on-dark`, `--split`, `--center`, `--photo`), `.lp-hero-inner`, `.lp-hero-copy`,
  `.lp-hero-aside`, `.lp-hero-bg`, `.lp-hero-photo` (`.gold-edge`)
- `.lp-eyebrow` (`.gold`, `.teal`), `.lp-lede`, `.lp-proof` (the approved proof line with a
  shield icon), `.lp-points` (three short checks), `.lp-cta-row`, `.lp-cta-note`,
  `.lp-hero-trust`, `.lp-packs` (a row of `.pack-chip` from v3.css)
- `.lp-swap` (`.glass` on dark): the Privacy Twin card. `<s>` is the real value, `.twin` the
  stand-in. Always tagged "Example".
- `.lp-trust`: the "AI your team already uses" logo strip. Logos are sized by optical weight:
  the ChatGPT and Copilot lockups at the default height, the Claude and Gemini full wordmarks
  with `class="wordmark"` (smaller). Grok, Perplexity and Hermes Agent have no official mark in
  the repo, so they are set as names with `.lp-trust-name`, never as the stand-in SVGs.
- `.lp-section` (`.alt`), `.lp-wrap`, `.lp-head` (`.center`), `.lp-h2` (`em` turns teal),
  `.lp-sub`
- `.lp-stakes-lead`, `.lp-stakes-grid` > `.lp-stake` (`.answer` for the resolution card)
- `.lp-steps` > `.lp-step` (`.num` "01", h4, p)
- `.lp-benefits` > `.lp-benefit` (`.ico`, h3, p)
- `.lp-split`, `.lp-split-figure` (`.photo`), `.lp-check`
- `.lp-stats` > `.lp-stat` (`.n`, `.n.word`, `.l`); `.lp-stats.dark` is the navy proof band:
  numeric figures (140+, 0 bytes) in gold, figures written in words (`.n.word`) in white
- `.lp-faq` (CSS-only `<details>`), `.lp-quote` (cleared quotes only)
- `.lp-final` > `.lp-final-card` (navy; gold primary)
- `.lp-footer`, `.lp-footer-logo`, `.lp-footer-links`, `.lp-footer-copy`, `.lp-footer-addr`
- `.lp-sticky`: the mobile CTA bar (760px and below)

From `assets/v3.css`: `.btn` variants, `.btn-gold`, `.badge-gold`, `.mark-gold`, `.pack-chip`,
`.pack-grid` / `.pack-card`, `.stack-app`.

## Brand rules on campaign pages

**Logo.** `assets/brand/logo.svg` on light, `assets/brand/logo-white.svg` on dark grounds and
photos. Never recolor or filter the logo. Header 28px tall (25px on phones), footer 24px.
Below 120px wide use the penguin alone (`assets/brand/penguin.svg`, on any ground). The
penguin is a signature: one per view. The header logo already carries it, so a page adds no
extra penguin unless the header is out of view.

**Penguin credit.** The logo penguin is the Twemoji 🐧 emoji (U+1F427), used unaltered under
CC BY 4.0, and a typed 🐧 in page copy renders as that same image (v3.js). The license requires
a credit line wherever the logo shows. v3.js adds it only to the site footer, so every campaign
footer carries it in its own markup: keep the `<p class="footer-credit">` line from
`lp-template.html`.

**Color.** Deep Navy `#01204E` for text and dark sections, Signal Teal `#028391` for actions,
Penguin Gold `#ffac33` as the accent. Gold rules:

1. About 10% of a surface at most; one gold moment per section is usually right.
2. Allowed: eyebrow dots, the underline under one or two words of a headline (`<em>` in a hero
   `h1`), numeric stat figures on a navy band (word stats stay white), the active row or tab,
   small badges, focus rings on dark.
3. Gold text only on navy or dark photos. On white, never gold text.
4. A gold button only on navy or dark photos. On white and light surfaces the primary button is
   teal.
5. Never gold next to coral in one element, never gold gradients on text.

**Type.** Overused Grotesk (loaded by v3.css) for everything, IBM Plex Mono for eyebrows,
labels and notes. Headlines weight 500, sentence case, tight tracking.

**Icons.** Inline stroke SVGs, 24px viewBox, stroke 1.6 to 2.2, no fill, `aria-hidden="true"`.

## Copy and claims

- Product: **PrivacyPal**, one app and one download. Packs: **Personal** (free), the **Family
  pack** ($9.99 a month per household), the **Max pack** ($34 per user a month). On cards,
  chips, tables and toggles: Personal, Family, Max. "Business" names the audience, never the
  pack: "PrivacyPal for business", "Your business", `business.html`.
  "PrivacyPal for families" likewise (lowercase audience word). The product name never carries
  a pack name. PrivacyPal Cloud (deploy) and PrivacyPal SDK (build) keep their names. Earlier
  plan names are retired and never appear in page copy.
- CTAs: "Download free", "Start Family free", "Get Max" or "Buy Max", "Book a demo", "Talk to
  sales". The Max pack is paid from day one; for a larger rollout the CTA is "Talk to sales" or
  "Book a demo".
- Devices: Personal runs on Mac and Windows. iPhone, iPad and Android are protected today with
  the Family or Max pack, and install by invitation. Write "Protected today on iPhone, iPad and
  Android with Family or Max. Install by invitation." (or a close variant), and never list
  phones on a Personal card or page. The Linux headless agent comes with Max.
- Surfaces: Personal covers ChatGPT, Claude, Gemini, Grok and Perplexity web chat. Microsoft
  Copilot, Claude Code, Codex, Hermes Agent and the agent surfaces are Max only; never list
  Copilot or Claude Code as a Family feature. The Family pack protects the OpenAI and xAI APIs for
  parents, and a parent can hold Max on top of Family (paid by them or their company).
- Accounts: one PrivacyPal account per person; kids keep their own protected profiles. A company
  can invite Personal users and Family pack holders into its Max account under a license it
  provisions ("Your company can add Max to your PrivacyPal account"); the company seat stacks
  with their own Family pack.
- US spelling: license, color, center.
- Voice: second person, short sentences, the mechanism named. Say what PrivacyPal does, never
  what it does not do.
- Mechanism, in these words or close to them: "Protection runs on the device, before a prompt
  or file reaches an AI provider." "Sensitive details are swapped for Privacy Twins, realistic
  stand-ins, so the AI still works and the real data never reaches the AI provider." Keep to
  that form: no absolute "never leaves the device" or "stays with you" claims.
- No em dashes anywhere: copy, titles, meta, alt text, comments. Ranges use an unspaced en dash
  (1–9). Step labels use "01".

**Approved figures and proof (use these words):**

- "The same technology that protects 140+ companies and global banks."
- "140+ companies"; "Tens of millions of sensitive details protected"; "trusted by global banks"
  (never name a bank); "NVIDIA Inception member"; "0 bytes of sensitive data sent to AI
  providers"; "patent-pending Privacy Twins".
- Prices: Personal free (no card, no trial clock, no expiry). Family $9.99 a month, up to 5
  family members, 5-day free trial, 30-day money-back guarantee. Max per user per month:
  1–9 users $34 monthly / $30 annual, 10–99 $29 / $25, 100–999 $26 / $21, 1000+ $22 / $17,
  paid from day one.

Add no other number: no latency, data-type counts, query volumes or other customer counts, and
no market statistic without its source. No testimonial, logo or customer that has not been
cleared for the website. Describe facts; do not rank PrivacyPal against anyone.

**Compliance and audit wording.** Name a regulation or framework (GLBA, SOX, FINRA, SOC 2, ISO
27001 and the like) only as the buyer's requirement, never as something PrivacyPal is "aligned
to", "pre-mapped to" or certified for. For audit, describe the record itself: every prompt and
file gets an audit record (the user, the AI tool, the time, the kinds of data protected, the
risk level), the logs are SIEM-ready, and admins review them user by user. Write "SIEM-ready",
not "streamed to your SIEM".

## Photography

Real-feeling people in real places, warm natural light, navy shadows; never stock-generic, no
padlocks or glowing graphics, nothing readable on a screen. When a page uses a temporary photo,
mark the `<img>` with `data-standin="<path of the final photo>"`; searching the repo for
`data-standin` lists every photo still to swap. Compress before shipping (JPEG quality about 82).

## The max-offer price card (machinery)

`max-offer.html` carries a live price card. Its rules are documented at the top of the file;
in short:

- Two codes ride on the URL and are never conflated: `?promo=` (a Stripe coupon, changes
  price) and `?ref=` (partner attribution, aliases `?partner=` and `?aff=`, never changes price).
- Discounts come only from `GET https://api.privacypal.ai/api/billing/public/max-offer`. The
  page never computes a discount. `?api=` overrides the host for testing.
- The list price book in the page script (`BANDS`, `STOPS`) and the pricing table on the page
  must match `assets/pricing.js`. Change all three together.
- Every `a[data-signup]` gets its href rebuilt to `https://portal.privacypal.ai/signup` with
  `plan`, `seats`, the codes and any `utm_*` / `fbclid`; any other portal parameter on the URL
  is forwarded unchanged and never shown. The billing system's identifiers for the Max pack
  (`plan=max`, the endpoint path) stay as they are.
- The card has two paths of equal weight: "Buy with a card" (self-serve signup through
  `a[data-signup]`) and "Talk to sales" (`data-cta="demo"`, the shared demo modal) for a larger
  rollout. The Max pack is paid from day one.
- `[data-jump]` scrolls to the price card (`#start`).

## QA before you ship

1. Serve the repo locally with a server that supports Range requests (Safari needs it for
   video) and open the page.
2. Screenshot desktop 1440 x 900 (and full page) and mobile 390 x 844. Check: no horizontal
   scroll, the hero CTA above the fold on a phone, the sticky CTA not covering the footer text.
3. Console clean, no 404s. Click every `data-cta` and check the right modal opens.
4. `noindex,follow` present, page absent from `sitemap.xml`, `og:url` and `og:image` correct.
5. Search the file for an em dash, for retired plan names and for "Business pack": all must
   return nothing. Check the footer carries the penguin credit line.
