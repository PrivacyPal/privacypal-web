# PrivacyPal for families: the /family/ sub-site

The Family pack's pages: guardrails for the AI kids use (and for Roblox), Privacy
Twins, Family Memory, Pal Agents and Parent HQ, packaged for parents. Since the
November 2026 rebrand ("One PrivacyPal") there is one product, **PrivacyPal**, and
three packs that switch on inside it: **Personal** (free), **Family** ($9.99 a month
per household) and **Max** ($34 per user per month, volume bands). Packs stack: a
parent can hold Max (paid by them or by their company) on top of Family. These
pages sell the Family pack. They live at
`/family/` with their own content design system (`family.css` + `family.js`) and
share the corporate header, footer and modals with the main site:

- Every page except `founding/` loads `../assets/v3.js`, which injects the shared
  announcement bar, nav, footer and the download and demo modals into
  `#site-nav-slot` / `#site-footer-slot` (v3.js derives the `../` prefix from its
  script src).
- The chrome is styled by `assets/family-chrome.css`, a **scoped mirror** of the
  Announcement/Nav/Footer/Modal sections of `assets/v3.css`. If those sections
  change in v3.css, update family-chrome.css to match. Scoping keeps corporate
  tokens inside the chrome and Family tokens out of it.
- `founding/` keeps its own minimal header and legal-only footer and does not load
  v3.js (see below).
- Pages are indexed and listed in `sitemap.xml`.

**URL:** `https://privacypal.ai/family/` (note the trailing slash).

## Naming (read before editing copy)

- The product is always **PrivacyPal**. Prefer it alone wherever the pack is obvious.
- The purchasable pack is **the Family pack**; on cards and labels just **Family**.
- Audience framing in titles and headings: **PrivacyPal for families** (lowercase
  audience word). Title tags end in ` · PrivacyPal`.
- The other packs are **Personal** (free) and **the Max pack** ("Max" on chips and
  cards, "Max · $34/user/mo"). Never "Business pack"; "Pro" is never a plan word.
  Audience framing stays: "PrivacyPal for business", "your business".
- CTAs: "Start Family free" (Family keeps its 5-day trial), "Download PrivacyPal".
- Identity line: "One PrivacyPal account for you. Your kids keep their own protected
  profiles." Invitations: "Your company can add Max to your PrivacyPal account under
  a license it provisions, and it stacks with your Family pack."
- The retired product name ("PrivacyPal" followed by "Family" as one name) is not
  written on these pages, testimonials included: it is PrivacyPal with the Family
  pack on (Jason Melo, 2026-11-17). The one exception is the Meta Pixel event name
  in the `founding/` script (reporting continuity).
- Offer, feature and page names stay: Founding Families, Family Memory, the Family
  Promise, Parent HQ, Pal Agents, Explorer / Navigator / Pilot.

## Launch state

- **Shipping:** Mac, Windows, iPhone, iPad and Android, up to 5 family members,
  $9.99 a month, 5-day free trial, 30-day money-back, cancel anytime. Roblox on the
  family Mac.
- **Phones are protected today, installed by invitation** (Jason Melo, 2026-11-17):
  iPhone, iPad and Android install through Apple TestFlight and Google Play testing,
  with the invitation sent by email. There is no public App Store or Google Play
  listing, so there are no store badges and no store URLs anywhere, and phones are
  never called "early access". The device line: "Protected today on Mac, Windows,
  iPhone, iPad and Android; phones and tablets install by invitation." Phones come
  with the Family and Max packs (Personal is Mac and Windows), so a phone line on a
  shared page always names Family or Max.
- **Early access features:** Wellbeing Signal, Answer Guard, Deep Insights, Roblox
  danger alerts and the in-game chat check. Smart glasses are labeled **roadmap**.

### Nothing links straight to /signup

**Every "Start Family free" CTA on the site goes to `founding/index.html`, the coded
Founding Families landing page, and that page hands off to the portal.** A bare
`?promo=` appended to the signup URL does not reliably reach the wizard, so a direct
signup link silently drops the discount. The landing page is the fix: it states the
code on the page, and its own CTAs carry `?promo=FOUNDINGFAMILY-0926-496` plus any
`?ref=` partner code, `utm_*` and `fbclid` from the arriving URL.

Adding a link to `family.privacypal.ai/signup` anywhere else in this repo
re-introduces the bug. Guard: nothing outside `family/founding/index.html` should
contain the string `family.privacypal.ai/signup`.

**Settled, do not re-raise:** the Stripe coupon runs 13 months while the site and the
ads say 12. That extra month is deliberate. Marketing stays at 12 months.

### One download

One PrivacyPal, one download: there is no separate Family download. Page code never
hardcodes a build URL: download buttons on /family/ pages are the same as everywhere else,
`data-cta="download"` with `href="../download.html"` as the no-JS fallback, and
`assets/v3.js` opens the one shared download modal with the same builds. The Family pack
switches on inside that app. Download URLs live only in the `DOWNLOADS` config in
v3.js. Parent HQ sign-in (`family.privacypal.ai/login`)
needs no code and is linked directly.

## Pages

| Page | Job |
|---|---|
| `index.html` | Family home: hero, AI shelf with Roblox, why now, 3 steps, 4 pillars, twin demo, Roblox highlight, Parent HQ mock, wellbeing and Answer Guard (early access), age ladder, devices, real screenshots, the Family pack card with the three packs (Personal, Family, Max), FAQ (including your own AI and stacking Max), CTA with the penguin sign-off |
| `roblox.html` | Roblox protection: Roblox-dark hero with a chat mock showing a held message, AI shelf with Roblox beside it, why Roblox, the four protections, the Parent HQ Roblox panel (design preview), the separate setup step, the plain-words coverage block (held / your call / flagged), six promises kept in Roblox, the kid's view, FAQ. Styles live in `../assets/roblox.css`. |
| `parents.html` | Parent HQ deep dive: realtime controls, Sunday digest phone mock, engine proof |
| `kids.html` | Speaks to kids and teens: transparency table ("the deal"), armor framing, stage ladder, CTA with the penguin sign-off |
| `promise.html` | The Family Promise: 5 numbered promises, each naming its mechanism |
| `guidebook.html` | The Guidebook: the research behind raising AI-native kids. Four cited vulnerabilities, the frameworks PrivacyPal is designed to align with, the wellbeing mechanism (mood weather, safety signals, Deep Insights), the trust architecture, the parent playbook with stage variants, crisis behavior, and full numbered sources from the research registry (v1.0.0) |
| `early-access.html` | **Phone install invitations: PrivacyPal on iPhone, iPad and Android, protected today with Family or Max, installed by invitation** (the URL is kept). For households (Family pack) and teams on Max (the Max pack). The form value for the team option is `Team (Max pack)`; the script keys on the `Team` prefix. Hero with the invitation request form, how the invitation works (TestFlight / Google Play testing), the two doors, Parent HQ on a phone (design preview), FAQ. `?for=team` (or `#team`) preselects the team form. Linked from the Family home (steps, devices row, FAQ). Submits via FormSubmit.co to **hi@privacypal.ai** (hidden-iframe POST, honeypot, `_next` success detection, same mechanism as the careers form); the subject keeps the `Early access list:` prefix. Fields: Invite for, First name, Email, Devices, Kids ages (household) or Company and Team size (team), What matters most. Fields for the other audience are disabled, so they are never posted. NOTE: FormSubmit requires one-time activation per address. |
| `founding/index.html` | **Campaign landing page** (`/family/founding/`) for paid ads and organic social, indexable, canonical set, in `sitemap.xml`. Loads no `v3.js`: its own minimal header (penguin logo + Family chip) and legal-only footer with a link back to `/family/`. Every CTA points at `https://family.privacypal.ai/signup?promo=FOUNDINGFAMILY-0926-496`; the inline script adds `?ref=`, `utm_*` and `fbclid`. Meta Pixel fires `ViewContent` on load and `InitiateCheckout` on CTA click. States the Founding Families offer: 50% off the $9.99 plan for the first 12 months. Edits here are limited to naming, logo, head and claims; the promo flow, referral script, ratings wording and testimonial cards stay as they are. |

## The look

- **Line:** "Their world is full of AI. You hold the keys." Brand feel: effortless
  safety, warm confidence, kids excel.
- **Voice:** the Operator, warmed up. Simple words, big feelings; kids as heroes;
  mechanism-first (every claim names its mechanism). Short sentence-case headlines,
  imperative CTAs, affirmative copy, no em dashes.
- **Color:** the PrivacyPal core (Deep Navy `#01204E` ink, Signal Teal `#028391`
  actions, Penguin Gold `#ffac33` accent) with sage trust and ivory washes. Gold is
  a slight accent (about 10% of a surface): eyebrow dots, the highlighter mark
  (`.hl-tang` / `.mark-gold`), one icon tile or number per section, the gold CTA on
  navy (`.btn-sun` / `.btn-gold`, always navy text). Never gold text on light
  (use `--gold-ink`), never gold with coral in one element. Primary actions on
  light grounds stay teal (`.btn-key`). The old tangerine class names now render
  gold.
- **Type:** Fredoka (rounded display) inside Family content, Overused Grotesk (body),
  IBM Plex Mono eyebrows. Chunky pill buttons with pressed edges, big radii,
  squircle photo masks, the five-color band divider (teal, sage, amber, gold,
  navy).
- **The Privacy Penguin:** the logo is the Twemoji penguin emoji, unaltered
  (CC BY 4.0). It comes from the chrome, and v3.js adds the credit line to the
  footer; `founding/` has its own footer, so it carries the credit itself.
  `assets/brand/penguin-guide*.svg` is the same emoji and appears only as a
  sign-off on a navy CTA (`.fcta.has-guide`) or in an empty or success state. One
  penguin per view.
- **Naming system:** Guardrails · Privacy Twins · Family Memory · Pal Agents
  (Wellbeing Signal, Answer Guard). Age stages: Explorer 5–9 · Navigator 10–13 ·
  Pilot 14–17. Parent dashboard: **Parent HQ**. Ethics spine: "Guardrails, not
  surveillance" and "Signals, not transcripts."

## Claims discipline (read before editing copy)

- Shipping today (safe to state as fact): Privacy Twins swap on the device, before
  anything is sent, "in milliseconds" or "a fraction of a second" (never a number);
  ChatGPT, Claude, Gemini, Grok and Perplexity coverage, plus the OpenAI and xAI
  APIs for parents; Mac and Windows;
  up to 5 family members; $9.99 a month; 5-day trial; 30-day money-back;
  approve / block / redirect; memory viewer and crypto-shred erase.
- Microsoft Copilot and Claude Code are Max, never Family: they stay off every
  Family shelf, card and list.
- Where identity is concerned, write "never reaches the AI provider" (or "never
  reached ChatGPT"), never that it "never leaves" the house or the device.
- Proof line, exact: "The same technology that protects 140+ companies."
  Never a vaguer company count, never a latency figure.
- Private Memory claims: mechanisms and "internal benchmark" phrasing only, **no
  bare accuracy percentages**, no vendor comparisons.
- **Social media sharing protection is deferred:** do not add social-sharing claims.
- No invented testimonials, star ratings, or user counts.

### Roblox

Roblox is an **addition** to the Family pack, not its center. AI stays the lead
story on every page: Roblox appears as a NEW card on the AI shelf, a hero news box,
one highlight on the Family home, a strip on `parents.html`, three rows in the kids'
deal table, and its own page, `roblox.html`.

- **Copy stays affirmative:** say what PrivacyPal does, never what it doesn't. State
  the scope positively ("on the family Mac today, Windows next", "through Roblox's
  own settings", "early access"). The only negative wording kept is the legal
  trademark line and the kids' deal-table "Never" column, which is a privacy
  promise.
- Presented as shipping: on the family **Mac**, messages, profile text and group
  posts are checked on the device against the never-share list and **held** before
  they send, never rewritten, with the kid told why and nothing stored. Per-child
  switches in Parent HQ: play on; chat, friend requests, voice and spending start
  off; the kid can ask. Guided setup in Roblox's own parent settings, then alerts if
  they drift. Roblox protection is part of the Family pack.
- Labeled **early access**: danger alerts (grooming patterns, secrecy pressure,
  pushes to move to another app or meet up) and the in-game chat check.
- Platform line, used everywhere: "Roblox protection runs on the family Mac today.
  Windows is next."
- **Never say:** "we watch / monitor your child's Roblox chat"; "we stop them
  sharing personal information in a game"; anything implying we see Roblox on
  phones, tablets or consoles; "no alerts means nothing happened"; anything about
  recording other players' voice. Roblox text is never twinned, so Roblox stays out
  of every Privacy Twins / "identity swapped" line, including Promise 2.
- Keep the trademark line ("Roblox is a trademark of Roblox Corporation.
  PrivacyPal is not affiliated with ...") wherever Roblox is featured. The chat and
  avatar art is hand-built SVG/CSS in Roblox's palette, not Roblox screenshots or
  official artwork.
- Palette (from roblox.com's Foundation CSS, theme-roblox dark): `#121215`
  `#191a1f` `#202227` `#272930`, blue `#335fff`, green `#39c582`, yellow
  `#f2ba2a`, red `#df281f`. Tokens are `--rbx-*` in `assets/roblox.css`.

## Assets

- `assets/photos/`: Unsplash photography (Unsplash License: free for commercial use,
  no attribution required). Casting rule (Jason Melo, 2026-11-17): Family imagery
  shows moms with children aged 7 to 17, and no babies, toddlers or preschoolers.
  `couch-tablet.jpg`, `hero-dad-kids.jpg`, `paint-girl.jpg`, `family-beach.jpg` and
  `teens-friends.jpg` (young adults, no mother) are not used on these pages. Until new photos land, `homework-boy.jpg`,
  `study-together.jpg`, `classroom.jpg` and `teens-sunset.jpg` stand in; each stand-in
  carries `data-standin="<new file>"`, so a search for `data-standin` lists every swap.
- `assets/product/`: actual product screenshots copied from the main site, plus the
  legacy logo file (kept for old references; page code uses `assets/brand/`). The
  Parent HQ dashboard and phone mocks are hand-built HTML (design previews),
  labeled as such on the page.

## Open items

- Confirm hi@privacypal.ai has completed FormSubmit.co activation before relying on
  the invitation request form.
- The Meta Pixel is not on the family portal, so signup conversions are not
  attributed today.
- Re-verify Private Memory claims against the claims guidance.
