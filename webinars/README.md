# Webinars (`/webinars/`)

Consumer webinar pages. The pages hold no session content: everything comes from the "PrivacyPal Webinars" Google Sheet through n8n at automate.privacypal.ai. The workflows, the sheet layout and the operator runbook live in `PrivacyPal-GTM-System/WEBINARS/README.md`.

| Page | URL | Purpose |
|---|---|---|
| `index.html` | `/webinars/?w=<id>` (no id: next listed session) | Session page and registration form |
| `watch.html` | `/webinars/watch.html?w=<id>&r=<token>` | Live room: YouTube embed and live chat, opened from the personal link in each calendar invite |
| `cancel.html` | `/webinars/cancel.html?r=<token>` | Cancel a registration (button press, so link scanners cannot cancel) |

- `webinars.js` drives all three pages (`<body data-wb="landing|watch|cancel">`) and renders API data with `textContent` only.
- `webinars.css` loads after `../assets/v3.css` and uses only its tokens. The shared nav and footer come from `../assets/v3.js` as on every page.
- Conversion events on a successful registration: GA4 `sign_up` (method `webinar`) and Meta Pixel `CompleteRegistration`.
- `index.html` is `noindex` until the first public session is listed, and the folder is not in the nav or `sitemap.xml`. `watch.html` and `cancel.html` stay `noindex,nofollow`.
- The live room's Family block reuses approved copy from the Family pages; change it in `watch.html`.
- Local testing calls the live n8n endpoints (CORS allows `http://localhost:8000`), so a registration made locally is a real registration.
