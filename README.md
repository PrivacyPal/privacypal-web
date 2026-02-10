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

To run locally, simply open `index.html` in a web browser or serve it with a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve .
```

## Deployment

This site automatically deploys to GitHub Pages when pushed to the main branch. The custom domain is configured via the `CNAME` file.

## Domain Configuration

The domain `privacypal.ai` should be configured with the following DNS settings:
- CNAME record pointing to your GitHub Pages URL
- GitHub Pages should be enabled in repository settings with custom domain set to `privacypal.ai`