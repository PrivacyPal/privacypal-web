# Live demos (`/webinars/`)

Two standing series of free live group demos: **PrivacyPal for business: live group demo** (Tuesdays and Thursdays, noon ET) and **PrivacyPal for families: live demo** (Tuesdays and Thursdays, 1 PM ET). One product, PrivacyPal, with packs: the business series shows Personal (free) and the Max pack, the family series shows the Family pack. The pages hold the copy; dates, schedule text, duration and hosts come from the "PrivacyPal Webinars" Google Sheet through n8n at automate.privacypal.ai. Workflows, sheet layout and the operator runbook: `PrivacyPal-GTM-System/WEBINARS/README.md`.

| Page | URL | Purpose |
|---|---|---|
| `index.html` | `/webinars/` | Hub: both series with their next session |
| `business/index.html` | `/webinars/business/` | PrivacyPal for business series: date picker and registration. Copy from `business.html` |
| `family/index.html` | `/webinars/family/` | PrivacyPal for families series: date picker and registration. Copy from `family/index.html`; `body.wb-family` adds a warmer hero wash and Penguin Gold accents inside the corporate system |
| `watch.html` | `/webinars/watch.html?s=<session>&r=<token>` | Live room: YouTube embed and live chat, the series next step, the next date. An unconfirmed token is asked to confirm first |
| `cancel.html` | `/webinars/cancel.html?r=<token>` | Cancel a registration (button press, so link scanners cannot cancel) and pick another date |
| `verify.html` | `/webinars/verify.html?r=<token>` | Confirm the email address of a sign-up (button press, so link scanners cannot confirm). Only then does the calendar invite go out |

**Email confirmation (double opt-in, since 2026-11-21).** A sign-up from the form is saved as `pending` and gets one confirmation email (branded: the penguin tile on a Penguin Gold wash, "Confirm my seat"). The form's answer is `{ ok, check: 'verify', session }` and never carries the registration token, so a bot with a fake address gets nothing it can use: no invite, no reminders, no live room. Pressing Confirm on `verify.html` turns the row `registered` and sends the invite. The same address again gets the confirmation email again (at most every 10 minutes); an address that is already confirmed for that date gets its invite again (`check: 'invite'`). A one-click rebook (`?r=` from our own emails) from a confirmed registration skips the step. The email and the logic live in `PrivacyPal-GTM-System/WEBINARS` (`webinar-lib.js`, `composeEmail('verify')`).

- Series pages take `?s=<session id>` to preselect a date and `?r=<token>` for the one-click rebook from follow-up and cancellation emails.
- `webinars.js` drives every page (`<body data-wb="hub|series|watch|cancel" data-series="..." data-wb-base="...">`) and renders API data with `textContent` only. `webinars.css` loads after `assets/v3.css` and uses its tokens.
- Series and session titles shown in the live room, calendar invites and emails come from the Series rows of the sheet, so a rename happens there as well as in these pages.
- The shared chrome links here: the Company menu, the mobile Company section and the footer Resources column ("Live demos", to the hub), and a line in the "Book a demo" modal (to `/webinars/business/`). Visitors reach both series pages from the hub. The Company menu caption and the modal line state the schedule; change them if the Series rows change.
- Conversion events on registration: GA4 `sign_up` (method `webinar`, with series, session id and `check`) and Meta Pixel `CompleteRegistration`, both when the form is accepted, as before. GA4 `webinar_verified` fires when a sign-up confirms on `verify.html` (often in a different browser, from the mail app), so the share of sign-ups that confirm is `webinar_verified` over `sign_up`.
- The hub and both series pages are indexable and in `sitemap.xml`; `watch.html`, `cancel.html` and `verify.html` stay `noindex,nofollow`.
- Local testing calls the live n8n endpoints (CORS allows `http://localhost:8000`), so a registration made locally is a real registration.
