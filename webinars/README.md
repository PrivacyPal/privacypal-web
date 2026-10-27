# Live demos (`/webinars/`)

Two standing series of free live group demos: PrivacyPal for Business (Tuesdays and Thursdays, noon ET) and PrivacyPal Family (Tuesdays and Thursdays, 1 PM ET). The pages hold the copy; dates, schedule text, duration and hosts come from the "PrivacyPal Webinars" Google Sheet through n8n at automate.privacypal.ai. Workflows, sheet layout and the operator runbook: `PrivacyPal-GTM-System/WEBINARS/README.md`.

| Page | URL | Purpose |
|---|---|---|
| `index.html` | `/webinars/` | Hub: both series with their next session |
| `business/index.html` | `/webinars/business/` | Business series: date picker and registration. Copy from `business.html` |
| `family/index.html` | `/webinars/family/` | Family series: date picker and registration. Copy from `family/index.html`; `body.wb-family` borrows Family DNA like the homepage |
| `watch.html` | `/webinars/watch.html?s=<session>&r=<token>` | Live room: YouTube embed and live chat, the series next step, the next date |
| `cancel.html` | `/webinars/cancel.html?r=<token>` | Cancel a registration (button press, so link scanners cannot cancel) and pick another date |

- Series pages take `?s=<session id>` to preselect a date and `?r=<token>` for the one-click rebook from follow-up and cancellation emails.
- `webinars.js` drives every page (`<body data-wb="hub|series|watch|cancel" data-series="..." data-wb-base="...">`) and renders API data with `textContent` only. `webinars.css` loads after `assets/v3.css` and uses its tokens.
- The shared chrome links here: Family menu "Live family demo", For Business menu "Live group demo", Company menu and footer "Live demos", and a line in the "Book a demo" modal. Those labels state the schedule; change them if the Series rows change.
- Conversion events on registration: GA4 `sign_up` (method `webinar`, with series and session id) and Meta Pixel `CompleteRegistration`.
- The hub and both series pages are indexable and in `sitemap.xml`; `watch.html` and `cancel.html` stay `noindex,nofollow`.
- Local testing calls the live n8n endpoints (CORS allows `http://localhost:8000`), so a registration made locally is a real registration.
