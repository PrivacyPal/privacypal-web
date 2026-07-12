# PrivacyPal Website

Landing page for PrivacyPal - AI Without Compromise

## Site structure

- **Repository root** – Live site (current design). This is what GitHub Pages serves.
- **site-v1/** – Archived previous site.
- **site-v2/** – Archived; content was promoted to root. Edit files in the root, not here.

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

**Use a local web server — do not open the `.html` files directly (`file://`).**
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
- Home — http://localhost:8000/
- The Privacy Log — http://localhost:8000/blog.html
- RSS feed — http://localhost:8000/blog/rss.xml

## The Privacy Log (blog)

PrivacyPal's blog, built the same way as the Newsroom — one JSON file is the
source of truth for the pages **and** the RSS feed.

- `blog.html` / `blog-article.html` — listing + article pages (client-rendered)
- `blog/blog.json` — authors + posts (title, author, date, tags, excerpt, body blocks)
- `blog/images/` — hero / thumbnail photography
- `assets/blog.css`, `assets/blog.js` — styles + rendering, search, and the
  author / month / tag filters
- `blog/rss.xml` — the published RSS 2.0 feed

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