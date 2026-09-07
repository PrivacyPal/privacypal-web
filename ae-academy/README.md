# PrivacyPal AE Certification Academy

Private, unlisted enablement and certification portal for **commission-only Account Executive
candidates**. Deep link only: **https://privacypal.ai/ae-academy/**

## How it is hidden

| Mechanism | State |
|---|---|
| Linked from site nav, footer, mobile menu | No. `assets/v3.js` and `assets/site.js` are untouched. |
| Listed in `sitemap.xml` | No. |
| `robots.txt` | Deliberately **not** listed. A `Disallow` line advertises the path; `noindex` is stronger and silent. |
| `<meta name="robots">` | `noindex,nofollow,noarchive` on all four pages. |
| Referrer | `no-referrer` on all four pages, so the URL is not leaked to outbound clicks. |

To change the URL, rename the folder. Nothing outside it refers to the path by name.

## Flow

```
index.html       enrollment + NDA, signature gated on scrolling the agreement
   |             POST #1 to Formspree: the executed NDA record
   v
curriculum.html  7 click-through modules, ~25 min, progress saved to localStorage
   v
exam.html        6 sections, 30 objective + 5 long-form, ~30 min, scored in browser
   |             POST #2 to Formspree: full results + transcript + NDA record
   v
complete.html    certification receipt, pending review
```

**Total sitting: about an hour.** Measured, not guessed: 2,257 words of prose at 220 wpm plus 4,609
words of tables, lists and callouts at a scanning rate, giving roughly 21 minutes of curriculum, plus
about 30 minutes of exam and a few minutes on enrollment.

State lives in `localStorage` under `pp_ae_academy_v1` (candidate + progress) and
`pp_ae_exam_answers_v1` (in-progress answers). It is device-scoped: a candidate must finish on the
machine they start on, which the enrollment page says plainly.

Access guards: `curriculum.html` and `exam.html` bounce to `index.html` without a signed NDA;
`exam.html` bounces to `curriculum.html` until all seven modules are marked done, and to
`complete.html` once an exam has been submitted; `complete.html` refuses without a submission.

## Running it locally

```bash
cd ~/dev/PrivacyPal/privacypal-web
npm run serve                 # http://localhost:8000
```

Then open **http://localhost:8000/ae-academy/**. Opening the files as `file://` will not work: the
pages load `../assets/v3.css` and their own JS, and the fonts need a real origin.

### The dev toolbar

On `localhost` (and only on localhost) a small dark toolbar appears at the bottom left. It is
rendered by `assets/academy.js` behind an `isLocal()` check and never appears on privacypal.ai.

| Button | What it does |
|---|---|
| **DRY RUN / SENDING LIVE** | Toggles whether submissions actually post to Formspree. **Defaults to DRY on localhost.** In dry mode the full payload is printed to the browser console and nothing is sent. |
| **reset** | Wipes candidate state and saved answers, back to enrollment |
| **skip to exam** | Fakes a signed NDA and nine finished modules, jumps to the exam |
| **last payload** | Opens the exact JSON of the most recent submission in a new tab, including the full transcript ops would receive |
| **fill form** | (enrollment page) Fills the candidate fields, scrolls the NDA, signs it |
| **answer all** | (exam page) Answers all 68 objective questions correctly and pads every long-form answer past its minimum |

You can also force the mode by URL: `?dry=1` or `?live=1`. The choice sticks in `localStorage`.

### A 60-second smoke test

1. `npm run serve`, open `http://localhost:8000/ae-academy/`
2. Dev bar: **fill form**, then click **Sign and start Module 01**
3. Click through a module or two, then dev bar: **skip to exam**
4. Dev bar: **answer all**, then **Next section** six times
5. Tick the attestation, **Submit**. In DRY mode nothing is sent; open the console, or hit
   **last payload**, to read exactly what ops would have received.
6. To send a real one, flip the toolbar to **SENDING LIVE** and submit again.

Reset between runs, because state persists in `localStorage` and a submitted exam redirects to the
receipt page.

## Files

| File | What it is |
|---|---|
| `index.html` | Enrollment form and the NDA |
| `curriculum.html` | All seven modules in one document, paginated by JS |
| `exam.html` | Exam shell, renderer, scorer and submitter |
| `complete.html` | Confirmation and certificate card |
| `assets/academy.css` | Portal chrome, lesson and exam styles. Layers on `/assets/v3.css` |
| `assets/academy.js` | State, chrome, progress, guards |
| `assets/exam.js` | **Generated.** Question bank with the hashed answer key |

The portal deliberately does **not** load `assets/v3.js`: no public nav, no announcement bar, no
demo or download modals. It links `/assets/v3.css` for brand tokens, type and buttons, so it stays
in step with the site automatically.

## The answer key

Correct answers in `assets/exam.js` are stored as FNV-1a hashes of `salt + question id + "|" +
option text`, not as plain values. This stops a candidate reading the key out of view-source. It is
**obscurity, not security**: the page is static, so anyone who understands the scheme can hash the
four options themselves. Treat the score as a screening signal that a human confirms on the
follow-up call, which is how the flow is written.

To change questions, edit the generator and re-run it. Rotate the salt if the bank is ever reused
for a second cohort.

## Submission delivery

**Two independent channels, both carrying the complete record**, so either email on its own is enough
to review a candidate.

| Channel | Endpoint | Status |
|---|---|---|
| **Formspree** | `formspree.io/f/mykbaere` (`FORM_ENDPOINT`) | Live. The form the rest of the site already uses. |
| **ops@ direct** | `formsubmit.co/ajax/ops@privacypal.ai` (`OPS_ENDPOINT`) | Live, activated 2026-09-07. Delivers straight to ops@ with no dashboard configuration. |

Both fire in parallel from `A.deliver()` in `assets/academy.js`, each receiving the same ~5KB payload:
candidate details, per-section scores, missed questions with the answer given, elapsed time, the NDA
record, and the full transcript of every long-form answer.

### Why two channels

An exam submission was lost on 2026-09-07: the NDA email arrived, the exam email never did. The
original design used one channel, and that gave no way to tell the difference between a submission
that was delivered and one that was accepted and then discarded, because both look identical from the
browser.

**The cause was never established.** The working theory at the time was that the large transcript was
being spam-filtered, but that was disproved: a full 30-field submission with a 4.4KB transcript was
sent afterwards and arrived. Whatever the cause, the lesson stands: a single channel with no delivery
signal can fail invisibly, and for a hiring pipeline that is unacceptable.

So `deliver()` reports exactly what landed, and the pages act on it:

- **Either channel lands** → the candidate goes to the receipt page, which states which routes carried it.
- **Neither lands** → the candidate is **not** told it worked. They stay on the exam page with the
  specific error from each channel and a **Copy my full submission** button so the answers can be
  emailed to ops@ by hand. Nothing is ever silently lost.
- The receipt page always offers **Copy my answers** and **Download as a text file**.

All four combinations are exercised by `delivery.js` in the build session's scratchpad: both succeed,
Formspree fails, ops@ needs activation, both fail.

### Hardening worth doing

FormSubmit issues a **hashed endpoint** (a random string) once a form is activated. Swapping
`OPS_ENDPOINT` to it keeps `ops@privacypal.ai` out of the page source, where scrapers can read it.
That is a one-line change.

### Two gotchas, both already handled

**1. Referrer.** These pages set `<meta name="referrer" content="no-referrer">` so the unlisted path
is never leaked to an outbound request. FormSubmit reads the `Referer` header and rejects a request
that has none, treating it as a `file://` page: *"Make sure you open this page through a web server."*
Both `fetch` calls therefore pass `referrerPolicy: 'origin'`, which sends `https://privacypal.ai/` and
never `/ae-academy/...`. Verified: neither endpoint receives the path. **Do not remove that option**,
and if you add a third channel, give it the same treatment.

**2. Local live-testing of the ops@ channel is unreliable.** FormSubmit scopes activation by referring
origin, so a localhost origin can come back as `needs Activation` even though production is activated.
Formspree is fine locally. The dev toolbar defaults to **DRY RUN** on localhost for this reason: both
payloads print to the console and nothing is sent. Flip it to **SENDING LIVE** to exercise the real
endpoints, and expect the ops@ leg to be the flaky one locally, not in production.

Test through `npm run serve` rather than opening the file directly.

### Verified end to end

On 2026-09-07, a full exam submitted through the real page with both channels live recorded
`{formspree: "ok", ops: "ok"}` and delivered a ~5KB payload with the complete transcript to both
inboxes.

## One thing still to settle

**The NDA needs a legal read.** `index.html` carries a standard unilateral NDA: five-year term with a
trade-secret tail, DTSA 18 U.S.C. 1833(b) immunity notice, protected-activity carve-out, and
deliberately no non-compete and no non-solicit. It names the party "PrivacyPal", matching
`terms-of-service.html`, because the Brain records no legal entity name (the same open item the
intern onboarding package carries). Counsel should insert the entity name and a governing-law state
before candidates sign it. Bump `NDA_VERSION` in `assets/academy.js` on any change: the version is
recorded with each signature.

## What this deliberately does not teach

The first cut of this program ran two to three hours and read like an internal wiki. It was cut back
on purpose, and these omissions are decisions, not oversights:

- **No enumerated gap list.** Reps are taught one rule instead: never invent a capability, and if you
  do not know, say you will confirm and come back. A list of things we cannot do goes stale faster
  than anyone maintains it, and it teaches a defensive posture.
- **No memorized statistics from our own site.** Third-party research (Harmonic's 2025 index) is
  taught with its source named. Our own marketing figures are not drilled.
- **No price recall.** Where a number is needed to answer an exam question, the band table is printed
  in the question. The test is whether a rep can use the price book, not recite it.
- **No roadmap or release detail.** No version numbers, no dates for unshipped work, no per-surface
  caveat tables. Those change faster than the curriculum can.
- **Connectors are never a "no".** If a deal turns on a system we do not already connect, the taught
  answer is to scope it and bring it in, because we build them.

If you add material here, check it against the one-hour budget first. `scripts/serve.js` plus the
timing measurement in the repo history is the way to re-check it.

## Grounding

Every product, pricing, buyer, motion and competitor fact came from the PrivacyPal Brain
(`~/PrivacyPal-Brain`). The market statistics are sourced to Harmonic Security's 2025 AI Usage Index
and cited in the module text. Nothing was invented.

Two facts here were set in session by Jason and are not yet in the Brain: **SOC 2 is in audit with
certification expected early Q4** (and a certification-sensitive prospect is a Cloud conversation),
and **connectors are built on demand for a deal worth having**, with NetSuite, Intuit and practice
management systems treated as supported.
