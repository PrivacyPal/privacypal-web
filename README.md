# PrivacyPal Website

Landing page for PrivacyPal - AI Without Compromise

## Site structure

- **Repository root** – Live site (the v3 redesign, promoted to root). This is what GitHub Pages serves.

> `v2.archive/` (the previous site) and `v3/` (redirect stubs for pre-launch `/v3/…`
> links) were deleted on 2026-09-09: crawlers were picking them up despite the
> `robots.txt` disallow, which only asks politely and does not stop indexing of
> pages linked from elsewhere. Both are recoverable from git history. Note that
> `/v3/lp-ciso.html`, the stub behind the pre-launch LinkedIn CISO campaign URL,
> now 404s; if that campaign is still live, restore that one file.

## Site architecture

- Plain static HTML. `assets/v3.css` is the entire design system; see `STYLE-GUIDE.md`
  for the component reference and page-building rules.
- `assets/v3.js` injects the announcement bar, nav (mega menus, mobile menu), footer
  and the shared demo/download modals into the `#site-nav-slot` / `#site-footer-slot`
  placeholders on every page; also handles dropdowns, reveal-on-scroll, copy buttons
  and CTA bindings (`data-cta="demo"` / `data-cta="download"`).
- `assets/blog.js`, `news.js`, `careers.js`, `events.js` render their pages from
  `blog/blog.json`, `news/news.json`, `careers/jobs.json`, `events/events.json`.
- Campaign landing pages (`lp-banking.html`, `lp-ciso.html`, via `assets/landing.css`)
  are standalone funnels, marked `noindex`, not wired into the main nav.

## GitHub Pages setup

This site is configured for GitHub Pages with custom domain:
- **Primary domain**: https://privacypal.ai
- **Alternate domain**: https://www.privacypal.ai

**Publish source**: Deploy from branch → main (or master) → **/ (root)**. The root contains `index.html`, `CNAME`, and all pages and assets.

## Key files (at repo root)

- `index.html` – Home page
- `about.html`, `contact.html`, `developers.html`, `install.html` – Main pages
- `privacy-policy.html`, `terms-of-service.html` – Legal
- `404.html` – Custom 404 page
- `CNAME` – Custom domain (privacypal.ai) for GitHub Pages
- `robots.txt` – SEO
- `sitemap.xml` – Sitemap for privacypal.ai

## Local Development

**Use a local web server. Do not open the `.html` files directly (`file://`).**
Data-driven pages (the Privacy Log and the Newsroom) load their content with
`fetch()`, which browsers block on `file://`. Serve over HTTP instead:

```bash
npm run serve            # → http://localhost:8000
npm run serve -- 3000    # custom port
```

`npm run serve` (aliases: `npm run dev`, `npm start`) runs a tiny zero-dependency
static server (`scripts/serve.js`). Any static server works too, e.g.
`python3 -m http.server 8000` or `npx serve .`.

Then visit:
- Home: http://localhost:8000/
- The Privacy Log: http://localhost:8000/blog.html
- RSS feed: http://localhost:8000/blog/rss.xml

## Partner Program page (`partners/program.html`)

The North America partner recruiting page. **Unlisted by design**: `noindex,nofollow`,
absent from `sitemap.xml`, and linked from no nav anywhere on the site. The URL is sent
straight to a prospective partner. It carries its own header, footer and design system
and deliberately does **not** load `assets/v3.css` or `assets/v3.js`.

Both forms on it (`#pilot` and `#apply`) deliver to **partners@privacypal.ai** over two
independent channels, the same redundancy pattern as `ae-academy/assets/academy.js`:

| Channel | Endpoint | Notes |
| --- | --- | --- |
| partners@ direct | `formsubmit.co/ajax/partners@privacypal.ai` | No dashboard config. **Needs one-time activation.** |
| Redundancy | `formspree.io/f/mykbaere` | The endpoint the rest of the site uses. Carries `route_to=partners@privacypal.ai`. Verified delivering 2026-10-22. |

Delivery resolves on the **first** channel to confirm, so one slow endpoint never makes a
partner watch a spinner. If both fail the page says so plainly and offers a `mailto:` with
the answers prefilled, rather than claiming a submission that never landed. Without
JavaScript the `<form action>` posts natively to Formspree and returns to `?sent=pilot` /
`?sent=apply`, which the page renders as the success panel.

> **Pending setup:** FormSubmit emailed an activation link to partners@privacypal.ai on
> 2026-10-22. Until somebody clicks it, the partners@ direct channel delivers nothing and
> reports `needs-activation` in the console; submissions still arrive via Formspree, so the
> forms work today. Click the link to turn the direct channel on.

Local testing: forms are **dry run** on localhost (they log the record and send nothing).
Append `?live=1` to send for real, `?dry=1` to go back.

## The Privacy Log (blog)

PrivacyPal's blog, built the same way as the Newsroom: one JSON file is the
source of truth for the pages **and** the RSS feed.

- `blog.html` / `blog-article.html`: listing + article pages (client-rendered)
- `blog/blog.json`: authors + posts (title, author, date, tags, excerpt, body blocks)
- `blog/images/`: hero / thumbnail photography
- `assets/blog.css`, `assets/blog.js`: styles + rendering, search, and the
  author / month / tag filters
- `blog/rss.xml`: the published RSS 2.0 feed

**Adding or editing a post:** edit `blog/blog.json` (add an entry to `articles`,
drop its hero image in `blog/images/`), then regenerate the feed:

```bash
npm run rss              # rebuilds blog/rss.xml from blog/blog.json
```

Also bump the post in `sitemap.xml` if you want it indexed.

## Deployment

This site automatically deploys to GitHub Pages when pushed to the main branch. The custom domain is configured via the `CNAME` file.

## Domain Configuration

The domain `privacypal.ai` should be configured with the following DNS settings:
- CNAME record pointing to your GitHub Pages URL
- GitHub Pages should be enabled in repository settings with custom domain set to `privacypal.ai`