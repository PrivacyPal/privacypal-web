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
curriculum.html  9 click-through modules, progress saved to localStorage
   v
exam.html        8 sections, 68 objective + 12 long-form, scored in browser
   |             POST #2 to Formspree: full results + transcript + NDA record
   v
complete.html    certification receipt, pending review
```

State lives in `localStorage` under `pp_ae_academy_v1` (candidate + progress) and
`pp_ae_exam_answers_v1` (in-progress answers). It is device-scoped: a candidate must finish on the
machine they start on, which the enrollment page says plainly.

Access guards: `curriculum.html` and `exam.html` bounce to `index.html` without a signed NDA;
`exam.html` bounces to `curriculum.html` until all nine modules are marked done, and to
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
4. Dev bar: **answer all**, then **Next section** eight times
5. Tick the attestation, **Submit**. In DRY mode nothing is sent; open the console, or hit
   **last payload**, to read exactly what ops would have received.
6. To send a real one, flip the toolbar to **SENDING LIVE** and submit again.

Reset between runs, because state persists in `localStorage` and a submitted exam redirects to the
receipt page.

## Files

| File | What it is |
|---|---|
| `index.html` | Enrollment form and the NDA |
| `curriculum.html` | All nine modules in one document, paginated by JS |
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

## Grounding

Every product, pricing, buyer, motion and competitor fact came from the PrivacyPal Brain
(`~/PrivacyPal-Brain`) on 2026-09-06. The market statistics are sourced to Harmonic Security's 2025
AI Usage Index, cited in the module text. Nothing was invented. Claims discipline (the not-built
list, file-upload coverage, Private Memory, customer naming) is taught explicitly, because the
sharpest risk with a commission-only rep is an overclaim in a security review.
