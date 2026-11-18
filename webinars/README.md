# Live demos (`/webinars/`)

Two standing series of free live group demos: **PrivacyPal for business: live group demo** (Tuesdays and Thursdays, noon ET) and **PrivacyPal for families: live demo** (Tuesdays and Thursdays, 1 PM ET). One product, PrivacyPal, with packs: the business series shows Personal (free) and the Max pack, the family series shows the Family pack. The pages hold the copy; dates, schedule text, duration and hosts come from the "PrivacyPal Webinars" Google Sheet through n8n at automate.privacypal.ai. Workflows, sheet layout and the operator runbook: `PrivacyPal-GTM-System/WEBINARS/README.md`.

| Page | URL | Purpose |
|---|---|---|
| `index.html` | `/webinars/` | Hub: both series with their next session |
| `business/index.html` | `/webinars/business/` | PrivacyPal for business series: date picker and registration. Copy from `business.html` |
| `family/index.html` | `/webinars/family/` | PrivacyPal for families series: date picker and registration. Copy from `family/index.html`; `body.wb-family` adds a warmer hero wash and Penguin Gold accents inside the corporate system |
| `watch.html` | `/webinars/watch.html?s=<session>&r=<token>` | Live room: YouTube embed and live chat, the series next step, the next date |
| `cancel.html` | `/webinars/cancel.html?r=<token>` | Cancel a registration (button press, so link scanners cannot cancel) and pick another date |

- Series pages take `?s=<session id>` to preselect a date and `?r=<token>` for the one-click rebook from follow-up and cancellation emails.
- `webinars.js` drives every page (`<body data-wb="hub|series|watch|cancel" data-series="..." data-wb-base="...">`) and renders API data with `textContent` only. `webinars.css` loads after `assets/v3.css` and uses its tokens.
- Series and session titles shown in the live room, calendar invites and emails come from the Series rows of the sheet, so a rename happens there as well as in these pages.
- The shared chrome links here: the Company menu, the mobile Company section and the footer Resources column ("Live demos", to the hub), and a line in the "Book a demo" modal (to `/webinars/business/`). Visitors reach both series pages from the hub. The Company menu caption and the modal line state the schedule; change them if the Series rows change.
- Conversion events on registration: GA4 `sign_up` (method `webinar`, with series and session id) and Meta Pixel `CompleteRegistration`.
- The hub and both series pages are indexable and in `sitemap.xml`; `watch.html` and `cancel.html` stay `noindex,nofollow`.
- Local testing calls the live n8n endpoints (CORS allows `http://localhost:8000`), so a registration made locally is a real registration.
