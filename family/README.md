# PrivacyPal Family — LIVE sub-site, integrated with the main site chrome

A re-imagined PrivacyPal Family: Pro-grade Safety, Privacy and Private Memory,
plus Max-derived Privacy Agents ("Pal Agents"), packaged as a consumer brand for
parents. Lives at `/family/` with its own content design system (`family.css` +
`family.js`) but shares the corporate header, footer and modals with the main
site:

- Every page loads `../assets/v3.js`, which injects the shared announcement bar,
  nav, footer and install/demo modals into `#site-nav-slot` / `#site-footer-slot`
  (v3.js auto-detects the `../` prefix from its script src).
- The chrome is styled by `assets/family-chrome.css` — a **scoped mirror** of the
  Announcement/Nav/Footer/Modal sections of `assets/v3.css`. If those sections
  change in v3.css, update family-chrome.css to match. Scoping keeps corporate
  tokens inside the chrome and Family tokens out of it.
- "PrivacyPal Family" is a top-level item (dropdown + footer column + mobile
  section) in the shared nav on every page of the site, defined in `assets/v3.js`.
- Pages are indexed (no more `noindex`) and listed in `sitemap.xml`.

**URL:** `https://privacypal.ai/family/` (note the trailing slash).

## Launch state (2026-09-09)

PrivacyPal Family is **live**. Everything the site says "get early access" about is
now either shipping or genuinely still early access, and the two are kept apart:

- **Shipping:** Mac and Windows, up to 5 family members, $9.99/mo, 5-day trial.
- **Still early access:** iOS/iPadOS, Android, Wellbeing Signal, Answer Guard.
  `early-access.html` is now the list for *those*, not for the product.

### Nothing links straight to /signup

**Every "start your free trial" CTA on the site goes to `founding/index.html`, the
coded Founding Families landing page, and that page hands off to the portal.** A
bare `?promo=` appended to the signup URL does not reliably reach the wizard, so a
direct signup link silently drops the discount. The landing page is the fix: it
states the code on the page, and its own CTAs carry
`?promo=FOUNDINGFAMILY-0926-496` plus any `utm_*` and `fbclid` from the arriving
URL.

Adding a link to `family.privacypal.ai/signup` anywhere else in this repo
re-introduces the bug. There is a guard for this: nothing outside
`family/founding/index.html` should contain the string
`family.privacypal.ai/signup`.

The site-wide announcement bar also points at the landing page, so the launch
banner on every page of privacypal.ai lands on the coded offer.

The links are defined once, at the top of `assets/v3.js`:

| Constant | URL | What it does |
|---|---|---|
| `FAMILY_OFFER` | `family/founding/index.html` | The coded landing page. Site-relative so `rel()` can prefix it for pages in subdirectories. This is what every trial CTA and the announcement bar point at. |
| `FAMILY_DOWNLOAD` | `family.privacypal.ai/download` | Sniffs the OS and 302s to the current **Family** build, read live from the auto-update manifest. Never hardcode a version. Needs no code, so it links direct. |
| `FAMILY_LOGIN` | `family.privacypal.ai/login` | Parent HQ. Needs no code, so it links direct. |

**The Family desktop app is a different build from Pro.** Pro is
`PrivacyPal-Setup-<v>.exe` / `PrivacyPal-<v>-arm64.dmg` on the `/proxy` feed
(1.9.33 at time of writing); Family is `PrivacyPal-Family-Setup-<v>.exe` /
`PrivacyPal-Family-<v>-{arm64,x64}.dmg` on the `/family` feed (1.0.3). The
`data-cta="download"` modal in `v3.js` is the **Pro** installer. Never point a
Family link at it, and never point a Family link at a hardcoded artifact URL:
use `/download` so a new Family release updates every link with no site deploy.

**Settled, do not re-raise:** the Stripe coupon runs 13 months while the site and
the ads say 12. That extra month is deliberate. Marketing stays at 12 months.

## Pages

| Page | Job |
|---|---|
| `index.html` | Flagship landing: hero, why-now, 3 steps, 4 pillars, twin demo, Parent HQ mock, wellbeing + sharing (early access), age ladder, devices, real screenshots, pricing, FAQ, CTA |
| `parents.html` | Parent HQ deep dive: realtime controls, Sunday digest phone mock, engine proof |
| `kids.html` | Speaks to kids/teens: transparency table ("the deal"), armor framing, stage ladder |
| `promise.html` | The Family Promise: 5 numbered promises, each naming its mechanism |
| `guidebook.html` | The Guidebook: the research behind raising AI-native kids. Four cited vulnerabilities, the frameworks Family is designed to align with, the wellbeing mechanism (mood weather, safety signals, Deep Insights), the trust architecture, the T1-T4 parent playbook with stage variants, crisis behavior, and full numbered sources from the research registry (v1.0.0) |
| `early-access.html` | **Post-launch: the mobile & Pal Agents early access list**, not the product waitlist. Mac and Windows ship today and need no invite, so the hero leads with "start your free trial" and "download", and the form now decides who gets an iOS/iPadOS/Android build and the Pal Agents first. Friendly form (name, email, devices, kids' ages, priority). No longer linked from any CTA: the nav, footer and every page button now go to signup instead. Submits via FormSubmit.co to **hi@privacypal.ai**, same mechanism as the careers application form (hidden-iframe POST, honeypot, `_next` success detection). NOTE: FormSubmit requires one-time activation per address; the first submission triggers an activation email to hi@privacypal.ai that must be confirmed before deliveries flow. |
| `founding/index.html` | **Campaign landing page** (`/family/founding/`) for paid ads and organic social. **Indexable since 2026-09-09** (robots meta dropped, canonical added, listed in `sitemap.xml`) and linked from the shared nav, footer, mobile menu, the family home and the early-access page. It still loads no `v3.js`: its own minimal header and legal-only footer, with a footer link back to `/family/` so it is not a dead end. Every CTA points at `https://family.privacypal.ai/signup?promo=FOUNDINGFAMILY-0926-496`; the inline script also forwards any `utm_*` and `fbclid` from the landing URL. Meta pixel fires `ViewContent` on load and `InitiateCheckout` on CTA click. States the Founding Families offer: 50% off the $9.99 plan for the first 12 months. The family-portal signup accepts `?promo=` in production, so the code is applied automatically; it is still shown on-page as a fallback. |

## The sub-brand (summary)

- **Line:** "You hold the keys. They get the future." Brand feel: effortless
  safety, warm confidence, kids excel.
- **Voice:** the Operator warmed up. Duolingo's "simple words, big feelings"
  and cheerleader energy; LEGO Education's kids-as-heroes aspiration; PrivacyPal's
  mechanism-first honesty (every claim names its mechanism). TL;DR-first, short
  sentence-case headlines, imperative CTAs, no em dashes.
- **Design:** PrivacyPal AirOps palette rotated warm. Navy ink `#01204E`, teal
  action `#028391`, tangerine joy `#F0914D`, sage trust `#4DA394`, coral risk
  `#D54751`, amber/ivory washes. Type: Fredoka (rounded display) + Overused
  Grotesk (body) + IBM Plex Mono eyebrows (PrivacyPal DNA). Chunky pill buttons
  with Duolingo-style pressed edges, big radii, squircle photo masks, LEGO-ish
  five-color band divider.
- **Naming system:** Guardrails · Privacy Twins · Family Memory · Pal Agents
  (Wellbeing Signal, Answer Guard). Age stages: Explorer 5–9 · Navigator 10–13 ·
  Pilot 14–17. Parent dashboard: **Parent HQ**. Ethics spine: "Guardrails, not
  surveillance" and "signals, not transcripts."

## Claims discipline (read before editing copy)

- Shipping today (safe to state as fact): Privacy Twins swap on-device, ~340ms
  interception, ChatGPT/Claude/Gemini/Copilot/Grok coverage, Mac + Windows, 5 family members,
  $9.99/mo, 5-day trial, 30-day money-back, approve/block/redirect, memory viewer
  + crypto-shred erase.
- Private Memory claims follow `GTM/Frameworks/Private Memory Claims Guidance`
  in the Brain: mechanisms and "internal benchmark" phrasing only, **no bare
  accuracy percentages**, no vendor comparisons.
- Labeled **early access** on the site (do not present as shipped): iOS/Android,
  Wellbeing Signal (sentiment), Answer Guard (age-right answers + prompt-injection
  defense). Smart glasses are labeled **roadmap**.
- **Social media sharing protection is deferred** (Jason, 2026-08-10): the focus
  is AI protection; Sharing Guard was removed from the site and must not be
  marketed until it's back on the roadmap. Do not add social-sharing claims.
- No invented testimonials, star ratings, or user counts. Social proof borrows
  from the company ("hundreds of companies") until real family quotes exist.

## Assets

- `assets/photos/` — Unsplash photography (Unsplash License: free for commercial
  use, no attribution required; courtesy credit kept in the footer). Swap for
  owned photography before launch if desired.
- `assets/product/` — actual product screenshots copied from the main site, plus
  the logo. The Parent HQ dashboard and phone digest are hand-built HTML mocks
  (design previews), labeled as such on-page.

## Launch checklist

Done (2026-09-09):

1. ~~Remove `noindex,nofollow`~~ and the preview pill. Pages are indexed and in
   `sitemap.xml`.
2. ~~Link from the main-site nav/footer.~~ The shared nav's Family dropdown now
   carries a second "Get started" group (create an account, the Founding
   Families offer, download, plans, Parent HQ sign-in) and its feature card is
   the signup. Same links in the footer column and the mobile menu.
3. ~~Point the CTAs at something real.~~ Every "get early access" button on
   `index`, `parents`, `kids`, `promise` and `guidebook` is now
   "start your free trial" → the coded landing page, which carries the promo
   code into the portal.
4. The site-wide announcement bar is the Family launch (it was the Pro 1.9.33
   release note).
5. `index.html` has a Family CTA banner; `pricing.html` has a Family plan band
   at `#family`.
6. `founding/index.html` is linked from the nav, footer, mobile menu, the family
   home hero and plan card, and the early-access page, and its footer now links
   back to `/family/` so it is not a dead end.

7. `founding/index.html` is public: robots meta dropped, canonical added, listed
   in `sitemap.xml`.

Still open:

- Confirm hi@privacypal.ai has completed FormSubmit.co activation before relying
  on the early-access list.
- Meta pixel on the family portal is still not added (Jason's call, given the
  Family privacy promise), so signup conversions are not attributed today.
- Re-verify Private Memory claims against the Brain guidance.
