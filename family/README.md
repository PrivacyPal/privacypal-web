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

**URL:** `https://privacypal.ai/family/` (note the trailing slash; `/family`
without a slash resolves to the older one-pager `family.html`).

## Pages

| Page | Job |
|---|---|
| `index.html` | Flagship landing: hero, why-now, 3 steps, 4 pillars, twin demo, Parent HQ mock, wellbeing + sharing (early access), age ladder, devices, real screenshots, pricing, FAQ, CTA |
| `parents.html` | Parent HQ deep dive: realtime controls, Sunday digest phone mock, engine proof |
| `kids.html` | Speaks to kids/teens: transparency table ("the deal"), armor framing, stage ladder |
| `promise.html` | The Family Promise: 5 numbered promises, each naming its mechanism |
| `early-access.html` | Parent-focused waitlist landing: friendly form (name, email, devices, kids' ages, priority), "opens in the next 2 weeks" promise, what-happens-next timeline. All "Get early access" CTAs point here. Submits via FormSubmit.co to **hi@privacypal.ai**, same mechanism as the careers application form (hidden-iframe POST, honeypot, `_next` success detection). NOTE: FormSubmit requires one-time activation per address; the first submission triggers an activation email to hi@privacypal.ai that must be confirmed before deliveries flow. |

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

## Launch checklist (when Jason says go)

1. Remove `noindex,nofollow` meta from all four pages.
2. Remove the "team preview · not public" pill from the nav (`.preview-pill`).
3. Add `/family/` pages to `sitemap.xml` and link from main-site nav/footer
   (`assets/v3.js`), replacing or redirecting the legacy `family.html`.
4. Confirm hi@privacypal.ai has completed FormSubmit.co activation (submit the
   form once and click the activation link that lands in that inbox), and confirm
   the "opens in the next 2 weeks" date before anyone external sees it.
5. Update the og meta (currently none by design, to stay uncrawlable) and add
   social cards.
6. Re-verify Private Memory claims against the Brain guidance at launch time.
