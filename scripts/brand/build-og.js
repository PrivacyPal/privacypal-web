#!/usr/bin/env node
/*
  PrivacyPal digital kit build: Open Graph cards, social images and the slide template PDF.

  Sources (HTML templates, committed):
    brand/og-templates/*.html       Open Graph cards, 1200x630, shared styles in kit.css
    brand/social-templates/*.html   social banners, avatar and the square post
    brand/slides/index.html         16:9 slide template (1920x1080 per slide)

  Outputs:
    assets/brand/og/og-{default,home,personal,family,business,pricing,download}.png   (each under 300 KB)
    assets/brand/social/linkedin-banner-1128x191.png (and linkedin-banner-2256x382.png, the same at 2x)
    assets/brand/social/x-header-1500x500.png
    assets/brand/social/youtube-banner-2560x1440.png
    assets/brand/social/avatar-400.png (the white tile, the one avatar; the gold and navy tiles are retired)
    assets/brand/social/post-square-1080.png, post-square-light-1080.png (examples of the post template)
    brand/slides/pdf/PrivacyPal-Slide-Template.pdf      (one 1920x1080 page per slide)

  Run (puppeteer 21 needs Node 20 and system Chrome on this machine):
    ~/.nvm/versions/node/v20.20.2/bin/node scripts/brand/build-og.js            # everything
    ~/.nvm/versions/node/v20.20.2/bin/node scripts/brand/build-og.js og         # one group: og | social | slides
    ~/.nvm/versions/node/v20.20.2/bin/node scripts/brand/build-og.js og-home    # one output by name

  Regenerating after new art lands: the templates reference the brand files by path
  (assets/brand/*.svg, the Twemoji penguin and the lockups built from it), so a change to the
  logo or the app icon is picked up on the next run.
  Retired outputs (RETIRED below) are deleted when their group runs, so a stale file never lingers.
  New photography: every stand-in photo carries data-standin="<new file>"; when that
  file exists in the repo, this build renders it instead of the stand-in.

  Compression: a PNG over its budget is re-encoded with Pillow (python3), first lossless,
  then palette-quantized with Floyd-Steinberg dithering. No other dependencies beyond the
  repo's puppeteer and pdf-lib.
*/
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

const ROOT = process.env.BRAND_ROOT || path.resolve(__dirname, '..', '..');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OG = 'assets/brand/og';
const SOCIAL = 'assets/brand/social';
const KB = 1024;

// name, template (repo-relative), output (repo-relative), width, height, byte budget
const JOBS = [
  { group: 'og', name: 'og-default', tpl: 'brand/og-templates/og-default.html', out: `${OG}/og-default.png`, w: 1200, h: 630, budget: 295 * KB },
  { group: 'og', name: 'og-home', tpl: 'brand/og-templates/og-home.html', out: `${OG}/og-home.png`, w: 1200, h: 630, budget: 295 * KB },
  { group: 'og', name: 'og-personal', tpl: 'brand/og-templates/og-personal.html', out: `${OG}/og-personal.png`, w: 1200, h: 630, budget: 295 * KB },
  { group: 'og', name: 'og-family', tpl: 'brand/og-templates/og-family.html', out: `${OG}/og-family.png`, w: 1200, h: 630, budget: 295 * KB },
  { group: 'og', name: 'og-business', tpl: 'brand/og-templates/og-business.html', out: `${OG}/og-business.png`, w: 1200, h: 630, budget: 295 * KB },
  { group: 'og', name: 'og-pricing', tpl: 'brand/og-templates/og-pricing.html', out: `${OG}/og-pricing.png`, w: 1200, h: 630, budget: 295 * KB },
  { group: 'og', name: 'og-download', tpl: 'brand/og-templates/og-download.html', out: `${OG}/og-download.png`, w: 1200, h: 630, budget: 295 * KB },

  { group: 'social', name: 'linkedin-banner', tpl: 'brand/social-templates/linkedin-banner.html', out: `${SOCIAL}/linkedin-banner-1128x191.png`, w: 1128, h: 191, budget: 2048 * KB, scale: 2, outScale: 1 },
  { group: 'social', name: 'linkedin-banner-2x', tpl: 'brand/social-templates/linkedin-banner.html', out: `${SOCIAL}/linkedin-banner-2256x382.png`, w: 1128, h: 191, budget: 2048 * KB, scale: 2 },
  { group: 'social', name: 'x-header', tpl: 'brand/social-templates/x-header.html', out: `${SOCIAL}/x-header-1500x500.png`, w: 1500, h: 500, budget: 1900 * KB },
  { group: 'social', name: 'youtube-banner', tpl: 'brand/social-templates/youtube-banner.html', out: `${SOCIAL}/youtube-banner-2560x1440.png`, w: 2560, h: 1440, budget: 5800 * KB },
  { group: 'social', name: 'avatar', tpl: 'brand/social-templates/avatar.html', out: `${SOCIAL}/avatar-400.png`, w: 400, h: 400, budget: 300 * KB },
  { group: 'social', name: 'post-square', tpl: 'brand/social-templates/post-square.html', out: `${SOCIAL}/post-square-1080.png`, w: 1080, h: 1080, budget: 1500 * KB },
  { group: 'social', name: 'post-square-light', tpl: 'brand/social-templates/post-square.html?ground=light&eyebrow=Personal&title=Free%20protection%20for%20your%20%5BAI%20chats%5D.&body=ChatGPT%2C%20Claude%2C%20Gemini%2C%20Grok%20and%20Perplexity%2C%20attachments%20included.%20No%20card%2C%20no%20trial%20clock%2C%20no%20expiry.', out: `${SOCIAL}/post-square-light-1080.png`, w: 1080, h: 1080, budget: 1500 * KB },

  { group: 'slides', name: 'slides', tpl: 'brand/slides/index.html', out: 'brand/slides/pdf/PrivacyPal-Slide-Template.pdf', pdf: true },
];

// Outputs this build no longer makes (2026-11-17). The gold avatar went with the gold app tile:
// the emoji's beak and feet are Penguin Gold and disappear on a gold ground. The navy avatar went
// too: the emoji's dark body (#292F33) sits at about 1.2:1 on Deep Navy, so at avatar size the
// penguin reads as a white egg with a beak. The white tile is the avatar.
const RETIRED = [
  { group: 'social', out: `${SOCIAL}/avatar-gold-400.png` },
  { group: 'social', out: `${SOCIAL}/avatar-navy-400.png` },
];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.json': 'application/json', '.mp4': 'video/mp4',
};

// A small static server over the repo root, so templates load the real fonts and brand files.
function serve() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.normalize(path.join(ROOT, urlPath));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Every data-standin path in a template that already exists in the repo (new photo delivered).
function deliveredStandins(tplFile) {
  const html = fs.readFileSync(tplFile, 'utf8');
  return [...html.matchAll(/data-standin(?:-only)?="([^"]+)"/g)].map((m) => m[1]).filter((p) => fs.existsSync(path.join(ROOT, p)));
}

async function prepare(page, standins) {
  await page.evaluate(async (delivered) => {
    document.querySelectorAll('img[data-standin]').forEach((img) => {
      const p = img.getAttribute('data-standin');
      if (delivered.includes(p)) img.src = '/' + p;
    });
    // Treatments that exist only to tame a stand-in (data-standin-only) go once the new photo is in.
    document.querySelectorAll('[data-standin-only]').forEach((el) => {
      if (delivered.includes(el.getAttribute('data-standin-only'))) el.remove();
    });
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete && img.naturalWidth
      ? img.decode().catch(() => {})
      : new Promise((r) => { img.onload = img.onerror = () => r(); }))));
  }, standins);
}

// For PDFs: re-encode each raster photo at twice its placed size as JPEG, so a 6 MB stand-in
// PNG does not ride into the PDF at full resolution. Any CSS filter (the warm grade) is baked
// into the JPEG and removed from the element: Chrome otherwise prints a filtered image as a
// large lossless bitmap. SVG art is left as vector.
async function downscalePhotos(page, factor = 2, quality = 0.86) {
  return page.evaluate(async (factor, quality) => {
    let saved = 0;
    for (const img of [...document.images]) {
      if (/\.svg(\?|$)/i.test(img.currentSrc || img.src) || !img.naturalWidth) continue;
      const bw = img.offsetWidth, bh = img.offsetHeight;
      if (!bw || !bh) continue;
      const filter = getComputedStyle(img).filter;
      const k = Math.min(1, Math.max((bw * factor) / img.naturalWidth, (bh * factor) / img.naturalHeight));
      if (k >= 1 && (!filter || filter === 'none')) continue;
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      if (filter && filter !== 'none') ctx.filter = filter;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      img.style.filter = 'none';
      img.src = c.toDataURL('image/jpeg', quality);
      await img.decode().catch(() => {});
      saved++;
    }
    return saved;
  }, factor, quality);
}

// Re-encode a PNG under its budget: lossless first, then a 256-color palette with dithering.
// Pillow's quantize() ignores its dither argument unless it is handed a palette, so the palette
// is built first (median cut refined by k-means) and the image is then remapped onto it with
// Floyd-Steinberg. Without that remap, skin and soft backgrounds in the photo cards band visibly.
// If the dithered file is over budget, the undithered palette (smaller) is the fallback.
function compress(file, budget) {
  const py = `
import sys, os
from PIL import Image
f, budget = sys.argv[1], int(sys.argv[2])
im = Image.open(f).convert('RGBA')
opaque = im.getextrema()[3][0] == 255
base = im.convert('RGB') if opaque else im
base.save(f, optimize=True)
if os.path.getsize(f) > budget:
    if opaque:
        pal = base.quantize(colors=256, method=Image.Quantize.MEDIANCUT, kmeans=3)
        base.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG).save(f, optimize=True)
        if os.path.getsize(f) > budget:
            pal.save(f, optimize=True)
    else:
        base.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(f, optimize=True)
print(os.path.getsize(f))
`;
  return Number(execFileSync('python3', ['-c', py, file, String(budget)]).toString().trim());
}

async function main() {
  const args = process.argv.slice(2);
  const jobs = args.length ? JOBS.filter((j) => args.includes(j.group) || args.includes(j.name)) : JOBS;
  if (!jobs.length) { console.error(`Nothing matches ${args.join(' ')}. Groups: og, social, slides. Names: ${JOBS.map((j) => j.name).join(', ')}`); process.exit(1); }

  const groups = new Set(jobs.map((j) => j.group));
  for (const r of RETIRED) {
    const f = path.join(ROOT, r.out);
    if (groups.has(r.group) && fs.existsSync(f)) { fs.unlinkSync(f); console.log(`${r.out}  removed (retired)`); }
  }

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME });
  const problems = [];

  try {
    for (const job of jobs) {
      const page = await browser.newPage();
      page.on('console', (m) => { if (m.type() === 'error') problems.push(`${job.name}: console: ${m.text()}`); });
      page.on('pageerror', (e) => problems.push(`${job.name}: page error: ${e.message}`));
      page.on('requestfailed', (r) => problems.push(`${job.name}: request failed: ${r.url()}`));
      page.on('response', (r) => { if (r.status() >= 400) problems.push(`${job.name}: HTTP ${r.status()} ${r.url()}`); });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

      const tplFile = path.join(ROOT, job.tpl.split('?')[0]);
      const outFile = path.join(ROOT, job.out);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });

      if (job.pdf) {
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
        await page.goto(base + job.tpl, { waitUntil: 'networkidle0', timeout: 60000 });
        await prepare(page, deliveredStandins(tplFile));
        await page.emulateMediaType('print');
        await downscalePhotos(page);
        const slides = await page.$$eval('.slide', (s) => s.length);
        const bytes = await page.pdf({ width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
        const doc = await PDFDocument.load(bytes);
        doc.setTitle('PrivacyPal slide template');
        doc.setAuthor('PrivacyPal');
        doc.setSubject('16:9 slide layouts for PrivacyPal presentations');
        doc.setCreator('scripts/brand/build-og.js');
        doc.setProducer('PrivacyPal');
        const out = await doc.save();
        fs.writeFileSync(outFile, out);
        const pages = doc.getPageCount();
        if (pages !== slides) problems.push(`${job.name}: ${slides} slides but ${pages} PDF pages`);
        console.log(`${job.out}  ${pages} pages  ${(out.length / KB).toFixed(0)} KB`);
      } else {
        const scale = job.scale || 1;
        await page.setViewport({ width: job.w, height: job.h, deviceScaleFactor: scale });
        await page.goto(base + job.tpl, { waitUntil: 'networkidle0', timeout: 60000 });
        await prepare(page, deliveredStandins(tplFile));
        await page.screenshot({ path: outFile, clip: { x: 0, y: 0, width: job.w, height: job.h } });
        if (scale !== 1 && job.outScale === 1) {
          // Supersampled render, downscaled to the platform size for crisper small type.
          execFileSync('python3', ['-c', `
import sys
from PIL import Image
f,w,h=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
Image.open(f).convert('RGB').resize((w,h), Image.LANCZOS).save(f)
`, outFile, String(job.w), String(job.h)]);
        }
        const size = compress(outFile, job.budget);
        if (size > job.budget) problems.push(`${job.name}: ${(size / KB).toFixed(0)} KB is over its ${(job.budget / KB).toFixed(0)} KB budget`);
        const px = job.outScale === 1 ? 1 : scale;
        console.log(`${job.out}  ${job.w * px}x${job.h * px}  ${(size / KB).toFixed(0)} KB`);
      }
      await page.close();
    }
  } finally {
    await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 5000))]);
    if (server.closeAllConnections) server.closeAllConnections(); // keep-alive sockets would hold the process open
    server.close();
  }

  if (problems.length) {
    console.error('\nProblems:\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  // Exit explicitly: a lingering Chrome pipe or socket must not keep the build open after the files are written.
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
