# PrivacyPal Website

The website at https://privacypal.ai. One product, **PrivacyPal**, with the Personal
(free), Family and Max packs, and one download. Plain static HTML on GitHub Pages.

## Site structure

- **Repository root**: the live site. This is what GitHub Pages serves.

> `v2.archive/` (the previous site) and `v3/` (redirect stubs for pre-launch `/v3/…`
> links) were deleted on 2026-09-09: crawlers were picking them up despite the
> `robots.txt` disallow, which only asks politely and does not stop indexing of
> pages linked from elsewhere. Both are recoverable from git history. Note that
> `/v3/lp-ciso.html`, the stub behind the pre-launch LinkedIn CISO campaign URL,
> now 404s; if that campaign is still live, restore that one file.

## Site architecture

- Plain static HTML. `assets/v3.css` is the entire design system; see `STYLE-GUIDE.md`
  for the component reference, the brand rules and the page-building rules, and the
  brand guidelines page `brand/index.html` (https://privacypal.ai/brand/) for the
  visual reference.
- `assets/v3.js` injects the announcement bar, nav (mega menus, mobile menu), footer
  and the shared modals (the one download modal and the demo modal) into the
  `#site-nav-slot` / `#site-footer-slot` placeholders on every page; it also handles
  dropdowns, reveal-on-scroll, copy buttons and CTA bindings (`data-cta="demo"`,
  `data-cta="download"`, `data-cta="family-download"`).
- The footer `v3.js` injects carries the Twemoji credit line (`p.footer-credit`), which
  the penguin's CC BY 4.0 license requires; keep it. `v3.js` also renders every typed
  🐧 on a page as the logo's penguin (`assets/brand/penguin.svg`), except inside form
  fields, `code`, `pre`, scripts and anything marked `data-raw-emoji`.
- **Downloads:** build URLs live in exactly one place, the `DOWNLOADS` config at the
  top of `assets/v3.js`. Pages never hardcode a build URL; they use
  `data-cta="download"` or link to `download.html`, the canonical download page
  (`install.html` and `desktop.html` point to it). The config's comment explains a
  release bump. There is no separate Family download: every page gets the same builds.
- `assets/family-chrome.css` mirrors the chrome sections of `v3.css` for the `/family/`
  sub-site; change both in the same commit.
- `assets/blog.js`, `news.js`, `careers.js`, `events.js` render their pages from
  `blog/blog.json`, `news/news.json`, `careers/jobs.json`, `events/events.json`.
- Campaign landing pages (`lp-banking.html`, `lp-ciso.html`, via `assets/landing.css`)
  are standalone funnels, marked `noindex`, not wired into the main nav.

## Brand assets

The November 2026 rebrand: the Privacy Penguin and One PrivacyPal. The logo mark is the
penguin emoji itself, **Twemoji 🐧 (U+1F427) v17.0.3, unaltered**, Copyright Twitter,
Inc. and other contributors, licensed under CC BY 4.0. The credit appears in the site
footer (`assets/v3.js`), on the brand guide and in the brand pack README; see
`STYLE-GUIDE.md` (The logo and the penguin) for the rules. Every brand file is generated
from committed sources by the scripts in `scripts/brand/`. Edit the sources, run the
builds, commit the outputs.

| Where | What |
|---|---|
| `assets/brand/src/` | Sources: `twemoji-1f427.svg` (the emoji as Twemoji publishes it) and its copies on a 512 canvas, and the wordmark outlined from Overused Grotesk 600 (`scripts/brand/outline-wordmark.py`). `src/README.md` records the provenance. |
| `assets/brand/*.svg` | The logo lockups, `penguin.svg` (the mark), `app-icon.svg` (the white tile) and `favicon.svg`. What pages reference. `penguin-flat`, `penguin-dark` and `penguin-guide*` are the same emoji under earlier names. There are no one-ink versions: the mark is the emoji unaltered, never recolored. |
| `assets/brand/png/` | PNG exports of the logos, penguin and app icon. |
| `assets/brand/og/` | Open Graph share cards, 1200x630. |
| `assets/brand/social/` | Profile pictures, LinkedIn, X and YouTube banners, square post examples. |
| Repo root and `assets/` | Favicons under their historical names (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-*.png`, `assets/favicon.ico`, `assets/favicon-32x32.png`). |
| Legacy logo PNGs | `assets/logo-color.png`, `assets/logo-light.png`, `privacypal-logo.png`, `privacypal-logo-color.png`, `privacypal-logo-light.png`, `family/assets/product/logo-color.png`. They hold the new lockup and stay only because emails, the RSS feed, JSON-LD and third parties hotlink them. Page code never uses them. |
| `brand/index.html` | The brand guidelines page (`noindex,nofollow`, not in the sitemap), with `brand/assets/guide.css`, `guide.js` (reads `logo.svg` to draw the lockup diagrams) and the brand pack ZIP `brand/assets/PrivacyPal-brand-assets.zip`. |
| `brand/collateral/` | Print collateral as HTML (one-pagers, brochure) and their PDFs in `brand/collateral/pdf/`. |
| `brand/og-templates/`, `brand/social-templates/`, `brand/slides/` | HTML templates for the share cards, social images and the 16:9 slide template. |
| `brand/email-signature.html` | The email signature. |

**Build** (puppeteer 21 needs Node 20 and the system Chrome on this machine; Python 3 with
Pillow builds the `.ico` files and compresses PNGs; the collateral build uses macOS `sips`
to downsize photos; the brand pack uses `zip`). The npm scripts run `node` from the PATH,
so put Node 20 first:

```bash
export PATH=~/.nvm/versions/node/v20.20.2/bin:$PATH
npm run brand              # build-brand.js, then legacy-logos.js: penguin files, logos, app icon,
                           #   favicons, PNGs, legacy logo PNGs, the brand pack ZIP
npm run brand:og           # build-og.js: share cards, social images, slide template PDF
npm run brand:collateral   # build-collateral.js: brand/collateral/*.html to PDF (+ first-page PNG)
npm run brand:all          # build-brand.js, build-og.js, build-collateral.js, the partner link PDFs
                           #   (scripts/generate-partner-pdf.js), then legacy-logos.js last
```

The brand pack ZIP includes the social images. `brand:all` builds it last, after
`build-og.js`, so it already holds the current ones. The refresh below is needed only
after a standalone `brand:og`:

```bash
node scripts/brand/legacy-logos.js --pack-only
```

Single steps, with their options:

```bash
node scripts/brand/build-og.js og           # one group: og | social | slides, or one output: og-home
node scripts/brand/build-collateral.js brochure one-pager-family   # some documents only
node scripts/brand/legacy-logos.js --logos-only                   # or --pack-only
```

- **The penguin:** the mark is Twemoji's 1f427 drawing, used unaltered. Taking a later
  Twemoji release means replacing `assets/brand/src/twemoji-1f427.svg` and its canvas
  copies, updating the version here, in `assets/brand/src/README.md` and in
  `scripts/brand/legacy-logos.js` (`TWEMOJI`), and running all the builds; every page,
  card, document and the ZIP pick it up, because everything references the files by
  path. Keep the credit line in the footer whatever the version.
- **Legacy logos:** `legacy-logos.js` renders the color lockup into `assets/logo-color.png`,
  `privacypal-logo-color.png`, `privacypal-logo.png` and `family/assets/product/logo-color.png`,
  and the white lockup into `assets/logo-light.png` and `privacypal-logo-light.png`: 4000px
  wide, transparent, on the historical 4000x1108 canvas so a hotlink that hardcodes the old
  width and height never stretches the new logo.
- **Final photography:** placeholder photos carry `data-standin="<final file path>"`. Drop
  the final file at that path; the collateral and OG builds use it automatically, and a
  search for `data-standin` lists every page `src` to switch. Family images follow the
  casting rule in `STYLE-GUIDE.md` (Photography): mothers with children aged 7 to 17.
- **Homepage photos:** `index.html` serves graded, cropped derivatives from `assets/home/`,
  not the raw photos. `scripts/home/home_images.py` (desktop and tablet scenes, panels,
  thumbnails, the Families photo) and `scripts/home/home_mobile.py` (phone bands) build
  them, from the photo list and shared grade in `scripts/home/home_common.py`. They need
  Python 3 with Pillow and NumPy, OpenCV for one stand-in, and `cwebp`. Preview with
  `--out <folder>` before writing into `assets/home/`; the header of `home_common.py`
  explains how to swap in a final photo.
- **Homepage customer stories:** the 3-up under the logo marquee and its video modal
  (`.tm-*` in `assets/home/home.css`, behavior in `assets/home/stories.js`). Each story is
  one `.tm-card` in `index.html` whose `data-*` attributes (name, title, company, video,
  poster, duration) drive the modal too. `scripts/home/home_stories.py` builds the files in
  `assets/testimonials/` from one folder per person (default `~/Desktop/testimonials`): the
  720x1280 video, its poster, a silent 4:5 hover loop and the 4:5 cover crops (which start
  below the retired logo on the October covers). It needs `ffmpeg` and Pillow. A story told
  in several reels (Vivek's and Keyonna's, three each) is joined into one video in playing
  order; the script prints each reel's start time for the card's `data-chapters`, which
  drives the part list in the modal and the marks on its progress bar. A link to
  `https://privacypal.ai/?testimonial=<slug>` opens that story on arrival and plays it
  (muted with "Tap for sound" where the browser refuses sound without a tap); the slugs are
  `vivek-laungani`, `jordan-serlin` and `keyonna-taylor`, in page order.

## GitHub Pages setup

This site is configured for GitHub Pages with custom domain:
- **Primary domain**: https://privacypal.ai
- **Alternate domain**: https://www.privacypal.ai

**Publish source**: Deploy from branch → main (or master) → **/ (root)**. The root contains `index.html`, `CNAME`, and all pages and assets.

## Key files (at repo root)

- `index.html`: home page
- `download.html`: the one download page (Mac, Windows, Linux, iPhone and iPad, Android)
- `pricing.html`, `business.html`: the packs, and PrivacyPal for business (the Max pack)
- `about.html`, `contact.html`, `developers.html`: main pages
- `privacy-policy.html`, `terms-of-service.html`: legal
- `404.html`: custom 404 page
- `webinars/`: the standing live demo series and the shared live room, confirm and cancel pages (`webinars/README.md`)
- `live/`: PrivacyPal Live event pages (`/live/?e=<id>`) for ad-hoc webinars, in-person and hybrid events. Link-only and `noindex`; events are created in the Studio at webinar.privacypal.ai, which is not part of this repository
- `brand/`: brand guidelines, collateral and templates (internal, `noindex`)
- `CNAME`: custom domain (privacypal.ai) for GitHub Pages
- `robots.txt`: SEO
- `sitemap.xml`: sitemap for privacypal.ai (internal pages stay out of it)

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
`python3 -m http.server 8000` or `npx serve .`. Video playback in Safari needs a server
that supports HTTP Range requests.

Then visit:
- Home: http://localhost:8000/
- Brand guidelines: http://localhost:8000/brand/
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
