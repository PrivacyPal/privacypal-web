#!/usr/bin/env node
/*
  PrivacyPal print collateral build (2026-11 rebrand).

  Renders every brand/collateral/*.html (files starting with "_" are skipped)
  to brand/collateral/pdf/<name>.pdf, plus brand/collateral/pdf/<name>.png, a
  PNG of the first page (1632 x 2112, US Letter at 192 dpi) for thumbnails,
  LinkedIn Featured uploads and quick review.

  Run (puppeteer 21 needs Node 20 and the system Chrome on this machine):
    ~/.nvm/versions/node/v20.20.2/bin/node scripts/brand/build-collateral.js
    ... build-collateral.js brochure one-pager-family   only these documents
    ... build-collateral.js --review <dir>              also writes every page as PNG
    ... build-collateral.js --no-optimize               embed photos untouched

  How it works
  - A small static server serves the repo, so pages load exactly as on the
    site (relative paths, fonts, SVG). Google Fonts (IBM Plex Mono) needs a
    network connection; the build fails if a brand font did not load.
  - Large raster photos (the hero-shot PNGs are 5 to 6 MB each) are served as
    JPEG, longest side 2400 px, quality 84, and oversized transparent PNGs
    (logo lockups) are scaled to 2400 px, through macOS `sips`, so a PDF
    stays small enough to email. Without sips the original file is used.
  - Final photography: every stand-in photo carries data-standin="<path>"
    (see the internal photo brief). When the final file exists at that path,
    the build swaps it in, so dropping the new photo and rebuilding is enough.
    A layer that only tames a stand-in (img.soft, the blur over readable
    screens) carries data-standin-only="<path>" and is dropped at the same time.
  - Checks, per document: brand fonts loaded; one PDF page per .sheet; no
    element crosses the 0.5 in safe margin; no em dash, retired product or
    pack name ("Pro", "Business pack"), absolute claim or banned figure in
    the text; no phones as "early access" and no evaluation codes; no phone
    on the Personal one-pager; no retired photo (couch-tablet, hero-dad-kids,
    paint-girl, family-beach, teens-friends) and no photo twice on a page or a
    spread; the Twemoji CC BY 4.0 credit wherever the penguin appears. A
    failed check exits non-zero.
  - PDF metadata (title, subject, author) comes from <title> and the meta
    description.
*/
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'brand', 'collateral');
const OUT = path.join(SRC, 'pdf');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CACHE = path.join(os.tmpdir(), 'privacypal-collateral-img');

const PX_PER_IN = 96;
const SAFE_PX = 0.5 * PX_PER_IN;
const OPTIMIZE_OVER_BYTES = 700 * 1024; // opaque photos above this become JPEG
const CONSIDER_OVER_BYTES = 200 * 1024;  // smaller files are served untouched
const MAX_PX = 2400;

// Copy rules (REBRAND-SPEC sections 4, 7, 15 and 16). Checked against the rendered text.
// Packs are Personal (free), Family and Max; "Business" is the audience, never a pack.
const BANNED = [
  [/\u2014/, 'em dash'],
  [/PrivacyPal (Pro|Max|Family)\b/, 'retired product name'],
  [/\b(Pro|Max) plan\b/i, 'retired plan name'],
  [/\bPro\b/, '"Pro" as a plan word (the free pack is Personal)'],
  [/\bBusiness pack\b|\bGet Business\b|\bBuy Business\b/i, 'retired pack name (say the Max pack, Get Max)'],
  [/\b(never|nothing) leaves\b|\bstays? with you\b|100% on-device/i, 'absolute claim (say "never reaches the AI provider")'],
  [/\blicence\b/i, 'UK spelling (license)'],
  [/340\s?ms|third of a second|faster than a keystroke/i, 'stale latency metric'],
  [/47 (data )?types/i, 'stale data-type count'],
  [/10M\+|2\.4M/i, 'retired volume figure'],
  [/hundreds of companies|100s of companies/i, 'superseded company count'],
  [/\bpatented\b/i, '"patented" (say patent-pending)'],
  [/\bhonest(ly)?\b|load-bearing/i, 'banned framing word'],
  [/x402|data payment/i, 'payments'],
  [/SOC ?2/i, 'SOC 2 claim'],
  [/Cursor\b/, 'Cursor coverage'],
  // 18.3: phones are protected today with Family or Max, installed by invitation.
  // Within one sentence (a label on the line above counts, as on a platform tile).
  [/early access[^.]{0,60}\b(iPhone|iPad|Android|phones?)\b|\b(iPhone|iPad|Android|phones?)\b[^.]{0,60}early access/i,
    'phones as early access (say "Protected today on iPhone, iPad and Android with Family or Max. Install by invitation.")'],
  // 18.2: evaluation codes are issued privately by an Account Executive, never offered in print.
  [/evaluation (code|path|program)|company[- ]wide evaluation|trial code/i, 'evaluation code or company-wide evaluation'],
];

// Photos retired from every surface (REBRAND-SPEC section 17 and the round 3 brief):
// babies, toddlers and preschoolers, the beach group shot, and teens-friends
// (young adults with no mother, outside the Family casting band of 7 to 17).
const RETIRED_PHOTOS = /(couch-tablet|hero-dad-kids|paint-girl|family-beach|teens-friends)\.jpg/;

// Rules for one document only (REBRAND-SPEC section 15).
const DOC_BANNED = {
  // Phones come with the Family and Max packs; Personal is Mac and Windows.
  'one-pager-personal': [[/iPhone|iPad|Android|Linux/, 'a phone or Linux listed on Personal (say "Phones come with the Family and Max packs")']],
  // Copilot and Claude Code are Max only; Family names them only as part of Max.
  'one-pager-family': [[/(?<!\bMax\b[^.]*)(Copilot|Claude Code)(?![^.]*\bMax\b)/, 'Copilot or Claude Code named outside a Max sentence']],
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json',
};

function hasSips() {
  try { execFileSync('/usr/bin/sips', ['--help'], { stdio: 'ignore' }); return true; } catch { return false; }
}

// Serve a large raster at print weight (cached by path, size and mtime):
// opaque photos become JPEG (quality 84, longest side 2400 px); transparent
// PNGs (logos) keep their alpha and are only scaled down to 2400 px.
function optimized(file, stat) {
  const key = crypto.createHash('sha1').update(`${file}:${stat.size}:${stat.mtimeMs}`).digest('hex');
  try {
    const props = execFileSync('/usr/bin/sips', ['-g', 'hasAlpha', '-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
    const alpha = /hasAlpha:\s*yes/.test(props) && path.extname(file).toLowerCase() === '.png';
    const w = Number((props.match(/pixelWidth:\s*(\d+)/) || [])[1] || 0);
    const h = Number((props.match(/pixelHeight:\s*(\d+)/) || [])[1] || 0);
    const big = Math.max(w, h) > MAX_PX;
    if (alpha && !big) return null;
    if (!alpha && !big && stat.size <= OPTIMIZE_OVER_BYTES) return null;
    const out = path.join(CACHE, `${key}.${alpha ? 'png' : 'jpg'}`);
    if (fs.existsSync(out)) return out;
    fs.mkdirSync(CACHE, { recursive: true });
    const fmt = alpha ? ['-s', 'format', 'png'] : ['-s', 'format', 'jpeg', '-s', 'formatOptions', '84'];
    execFileSync('/usr/bin/sips', [...fmt, '-Z', String(MAX_PX), file, '--out', out], { stdio: 'ignore' });
    return fs.existsSync(out) ? out : null;
  } catch {
    return null;
  }
}

function startServer(optimize) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.normalize(path.join(ROOT, url));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const stat = fs.statSync(file);
    const ext = path.extname(file).toLowerCase();
    let body = file;
    let type = MIME[ext] || 'application/octet-stream';
    if (optimize && ['.png', '.jpg', '.jpeg'].includes(ext) && stat.size > CONSIDER_OVER_BYTES) {
      const small = optimized(file, stat);
      if (small) { body = small; type = small.endsWith('.png') ? 'image/png' : 'image/jpeg'; }
    }
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    fs.createReadStream(body).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function parseArgs(argv) {
  const opts = { only: [], review: null, optimize: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--review') opts.review = path.resolve(argv[++i]);
    else if (a === '--no-optimize') opts.optimize = false;
    else opts.only.push(a.replace(/\.html$/, ''));
  }
  return opts;
}

async function buildOne(browser, base, name, opts) {
  const problems = [];
  const notes = [];
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });

  await page.setViewport({ width: 8.5 * PX_PER_IN, height: 11 * PX_PER_IN, deviceScaleFactor: 2 });
  await page.emulateMediaType('print');
  await page.goto(`${base}/brand/collateral/${name}.html`, { waitUntil: 'networkidle0', timeout: 60000 });

  // Final photography replaces its stand-in when the file exists, and the layers
  // that only tame that stand-in (data-standin-only) go with it.
  const standins = await page.$$eval('[data-standin],[data-standin-only]',
    (els) => els.map((e) => e.getAttribute('data-standin') || e.getAttribute('data-standin-only')));
  const ready = [...new Set(standins)].filter((p) => fs.existsSync(path.join(ROOT, p)));
  if (ready.length) {
    await page.evaluate((list) => {
      document.querySelectorAll('img[data-standin]').forEach((img) => {
        const p = img.getAttribute('data-standin');
        if (list.includes(p)) img.src = '/' + p;
      });
      document.querySelectorAll('[data-standin-only]').forEach((el) => {
        if (list.includes(el.getAttribute('data-standin-only'))) el.remove();
      });
    }, ready);
    notes.push(`final photo used: ${ready.join(', ')}`);
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete && img.naturalWidth ? null : img.decode().catch(() => null))));
  });

  const fonts = await page.evaluate(() => ({
    grotesk: document.fonts.check('500 12px "Overused Grotesk"'),
    mono: document.fonts.check('500 12px "IBM Plex Mono"'),
  }));
  if (!fonts.grotesk) problems.push('font not loaded: Overused Grotesk');
  if (!fonts.mono) problems.push('font not loaded: IBM Plex Mono (needs a network connection to Google Fonts)');

  const info = await page.evaluate((safe) => {
    const out = { sheets: 0, overflow: [], images: [], photos: [], text: '', title: document.title, desc: '', penguin: false };
    out.penguin = [...document.images].some((i) => /assets\/brand\//.test(i.getAttribute('src') || ''));
    const m = document.querySelector('meta[name="description"]');
    out.desc = m ? m.content : '';
    out.text = [document.title, out.desc, document.body.innerText,
      ...[...document.querySelectorAll('img[alt]')].map((i) => i.alt)].join('\n');
    const sheets = [...document.querySelectorAll('.sheet')];
    out.sheets = sheets.length;
    sheets.forEach((sheet, idx) => {
      const s = sheet.getBoundingClientRect();
      const live = { l: s.left + safe - 0.5, t: s.top + safe - 0.5, r: s.right - safe + 0.5, b: s.bottom - safe + 0.5 };
      sheet.querySelectorAll('*').forEach((el) => {
        // Inside a clipping box the box itself is what gets measured.
        for (let a = el.parentElement; a && a !== sheet; a = a.parentElement) {
          if (getComputedStyle(a).overflow !== 'visible') return;
        }
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        if (r.left < live.l || r.top < live.t || r.right > live.r || r.bottom > live.b) {
          const id = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : el.tagName.toLowerCase();
          out.overflow.push(`page ${idx + 1}: <${el.tagName.toLowerCase()}${id.startsWith('.') ? ' ' + id : ''}> crosses the safe margin (${Math.round(r.left - s.left)},${Math.round(r.top - s.top)} to ${Math.round(r.right - s.left)},${Math.round(r.bottom - s.top)} px)`);
        }
      });
      sheet.querySelectorAll('img').forEach((img) => {
        if (!img.naturalWidth) out.images.push(`page ${idx + 1}: image did not load: ${img.getAttribute('src')}`);
      });
      // Photographs on this page (the blur layers repeat their photo by design).
      sheet.querySelectorAll('.photo > img:not(.soft)').forEach((img) => {
        out.photos.push({ page: idx + 1, src: new URL(img.currentSrc || img.src, location.href).pathname });
      });
    });
    return out;
  }, SAFE_PX);

  // Retired photos never appear; a photo appears once per view. A one-pager is
  // one view; a printed brochure opens as spreads: the cover, 2-3, 4-5, 6-7, the back.
  info.photos.forEach((p) => {
    if (RETIRED_PHOTOS.test(p.src)) problems.push(`photo: retired photo on page ${p.page}: ${p.src}`);
  });
  const seen = new Map();
  info.photos.forEach((p) => {
    const key = `${Math.floor(p.page / 2)}|${p.src}`;
    if (seen.has(key) && seen.get(key) !== p.page) problems.push(`photo: ${p.src} appears on pages ${seen.get(key)} and ${p.page}, which face each other`);
    else if (seen.has(key)) problems.push(`photo: ${p.src} appears twice on page ${p.page}`);
    else seen.set(key, p.page);
  });

  problems.push(...info.overflow.slice(0, 12));
  if (info.overflow.length > 12) problems.push(`... and ${info.overflow.length - 12} more safe-margin crossings`);
  problems.push(...info.images);
  for (const [re, what] of [...BANNED, ...(DOC_BANNED[name] || [])]) {
    const hit = info.text.match(re);
    if (hit) problems.push(`copy rule: ${what} ("${info.text.substr(Math.max(0, hit.index - 30), 70).replace(/\s+/g, ' ')}")`);
  }
  // The logo mark is the Twemoji penguin (CC BY 4.0): every document that shows it carries the credit.
  if (info.penguin && !(/Twemoji/.test(info.text) && /CC\sBY\s4\.0/.test(info.text))) {
    problems.push('license: the penguin is shown but the Twemoji CC BY 4.0 credit is missing from the fine print');
  }

  const pdfBytes = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
    width: '8.5in',
    height: '11in',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPageCount();
  if (pages !== info.sheets) problems.push(`page count: ${pages} PDF pages for ${info.sheets} sheets`);
  doc.setTitle(info.title, { showInWindowTitleBar: true });
  doc.setSubject(info.desc);
  doc.setAuthor('PrivacyPal');
  doc.setCreator('PrivacyPal print collateral (scripts/brand/build-collateral.js)');
  doc.setProducer('PrivacyPal');
  doc.setKeywords(['PrivacyPal', 'Privacy Twins', 'AI privacy']);
  doc.setLanguage('en-US');
  const now = new Date();
  doc.setCreationDate(now);
  doc.setModificationDate(now);
  const pdfPath = path.join(OUT, `${name}.pdf`);
  fs.writeFileSync(pdfPath, await doc.save());

  const sheets = await page.$$('.sheet');
  await sheets[0].screenshot({ path: path.join(OUT, `${name}.png`) });
  if (opts.review) {
    fs.mkdirSync(opts.review, { recursive: true });
    for (let i = 0; i < sheets.length; i++) {
      await sheets[i].screenshot({ path: path.join(opts.review, `${name}-p${String(i + 1).padStart(2, '0')}.png`) });
    }
  }
  await page.close();
  return { name, pages, kb: Math.round(fs.statSync(pdfPath).size / 1024), problems, notes };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.optimize && !hasSips()) {
    console.warn('sips not found: photos are embedded at full size');
    opts.optimize = false;
  }
  const names = fs.readdirSync(SRC)
    .filter((f) => f.endsWith('.html') && !f.startsWith('_'))
    .map((f) => f.replace(/\.html$/, ''))
    .filter((n) => !opts.only.length || opts.only.includes(n))
    .sort();
  if (!names.length) throw new Error('no documents to build');
  fs.mkdirSync(OUT, { recursive: true });

  const server = await startServer(opts.optimize);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME });
  let failed = 0;
  try {
    for (const name of names) {
      const r = await buildOne(browser, base, name, opts);
      const status = r.problems.length ? 'CHECK' : 'ok';
      console.log(`${status.padEnd(5)} brand/collateral/pdf/${name}.pdf  ${r.pages} page${r.pages > 1 ? 's' : ''}, ${r.kb} KB`);
      r.notes.forEach((n) => console.log(`      ${n}`));
      r.problems.forEach((p) => console.log(`      ! ${p}`));
      if (r.problems.length) failed++;
    }
  } finally {
    await browser.close();
    // Drop keep-alive and half-finished sockets too, or node waits on them and never exits.
    if (server.closeAllConnections) server.closeAllConnections();
    server.close();
  }
  if (failed) {
    console.error(`${failed} document(s) need attention`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
