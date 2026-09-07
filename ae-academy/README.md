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

**Verified working on 2026-09-06.** Both submissions post to `https://formspree.io/f/mykbaere`, the
same form the live `unsubscribe.html` uses, so it is already active. Two test submissions were sent
and both returned `{"next":"/thanks","ok":true}` with HTTP 200: one with an `Origin` of
`https://privacypal.ai`, one with `http://localhost:8000`. The form is not origin-restricted, so
local live-testing works too.

The endpoint is defined once, as `FORM_ENDPOINT` at the top of `assets/academy.js`. Change it there
and both pages follow.

Formspree delivers to the recipients configured on the form, and a free-plan form cannot be
re-routed from the page (`_cc` is a paid feature). So:

- Every submission carries `route_to: ops@privacypal.ai` in the body and a distinguishing subject
  (`AE Academy · NDA executed: <name>` and `AE Academy EXAM: <name> (90% objective, PASS)`), and
  sets the candidate as reply-to.
- **Two test messages titled "AE Academy · TEST ... please ignore" were sent to that form.** Whoever
  received them is the form's current recipient. If that is not ops@privacypal.ai, add ops@ as a
  recipient on form `mykbaere` in the Formspree dashboard, which takes about thirty seconds and needs
  no code change. Alternatively create a dedicated form and change the one `FORM_ENDPOINT` line.

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
