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

## Events: PrivacyPal Live and the Studio (since 2026-11-23)

Ad-hoc webinars, in-person and hybrid events, beside the two standing series. Admins create them in the **Studio at https://webinar.privacypal.ai**, which is not part of this site: its source is `~/dev/PrivacyPal/privacypal-web-properties/sites/webinar/` (private), served from S3 and CloudFront in the PrivacyPal AWS account. Each event gets its own page here, registration with email confirmation, calendar invites, reminders, a live room tied to its own YouTube stream, follow-ups, and on-demand access to the recording. **Nothing on this site links to events or the Studio**: event pages are shared by link, are `noindex,nofollow` and stay out of `sitemap.xml`.

| Page | URL | Purpose |
|---|---|---|
| `../live/index.html` | `/live/?e=<event id>` | The event page: hero photo, badges (format, audience, topic), countdown, details bar, about, take-aways, speakers, agenda, venue, FAQ written from the event's settings, and the sticky registration card. A hybrid event asks how each person joins (in person, online, or both) and asks only the questions the event set for that choice. `?preview=<id>` renders a Studio preview (kept two hours on the server, fetched from the Admin webhook). Share card: `assets/brand/og/og-live.png` |
| `../live/assets/` | | The emperor penguin hero (WebP 2000 and 1000, JPEG 1400) and the team's square headshots the Studio offers for speakers. The Studio's build copies them, so keep the paths |
| `watch.html` | as before | For an event: a dark theater stage, who is on stage, the agenda, the venue for people with a seat, the event's next step; the recording plays here after the end for registrants |
| `verify.html`, `cancel.html` | as before | Word the result for events: seat confirmed, waitlist, request received, recording ready; link back to the event page |

**Hybrid seats.** A seat in the room is given only when the person confirms their email, so a fake address never holds one. First come up to capacity, then a waitlist that moves up on its own when someone cancels or is declined; or "we approve each seat", decided in the Studio. People with a seat get a calendar entry at the venue from doors open to the end of the in-person program; people online get their live room. Guests per sign-up, doors open and the in-room program after the stream are per event.

`webinars.js` drives the event page too (`data-wb="event"`); `webinars.css` holds its styles and the theater room. The engine, the Studio's security and the operator runbook: `PrivacyPal-GTM-System/WEBINARS/README.md`. For local work, `PrivacyPal-GTM-System/WEBINARS/tools/local-api.js` serves this site and the Studio (at `/studio/`) and stands in for every webhook with an in-memory sheet and an outbox; on `localhost` only, `localStorage['pp-webinar-api']` points the pages at it.
