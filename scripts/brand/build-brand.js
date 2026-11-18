#!/usr/bin/env node
/*
  PrivacyPal brand build (2026-11 rebrand). The logo mark is the penguin emoji (U+1F427) from
  Twemoji v17.0.3, Copyright Twitter, Inc. and other contributors, CC BY 4.0, used unaltered so the
  logo and a typed 🐧 match. See assets/brand/src/README.md.

  Sources (committed):
    assets/brand/src/twemoji-1f427.svg the emoji as published by Twemoji
    assets/brand/src/penguin.svg       the emoji placed on a 512 canvas (drawing unchanged)
    assets/brand/src/penguin-flat.svg  same as penguin.svg (the emoji is already flat)
    assets/brand/src/penguin-dark.svg  same as penguin.svg (the emoji is used as-is on dark grounds)
    assets/brand/src/wordmark.svg      "PrivacyPal" outlined from Overused Grotesk 600
                                        (scripts/brand/outline-wordmark.py), font units,
                                        baseline at y=0, data-cap-height on the root

  Outputs:
    assets/brand/penguin.svg, penguin-flat.svg, penguin-dark.svg, penguin-guide.svg, penguin-guide-dark.svg
    assets/brand/logo.svg, logo-white.svg (no one-ink versions: the mark is never recolored)
    assets/brand/app-icon.svg (the white tile, the only tile: on a gold tile the emoji's beak and
                                        feet vanish, and on a navy tile its dark body does)
    assets/brand/favicon.svg (the Twemoji drawing cropped to a square; no redrawn pixel grids)
    assets/brand/png/*.png (penguin, logos, app icon, avatar, favicon-48 at several sizes)
    favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png,
    android-chrome-192x192.png, android-chrome-512x512.png (repo root), all rendered from
    favicon.svg or app-icon.svg
    assets/favicon.ico, assets/favicon-32x32.png

  Run (puppeteer 21 needs Node 20 and system Chrome on this machine):
    ~/.nvm/versions/node/v20.20.2/bin/node scripts/brand/build-brand.js
  The .ico files are assembled by scripts/brand/make-ico.py (Pillow), which this calls.
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');

const ROOT = process.env.BRAND_ROOT || path.resolve(__dirname, '..', '..');
const BRAND = path.join(ROOT, 'assets', 'brand');
const SRC = path.join(BRAND, 'src');
const PNG = path.join(BRAND, 'png');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const NAVY = '#01204E';
const WHITE = '#FFFFFF';
const GOLD = '#FFAC33'; // the emoji's own beak and feet

// Lockup geometry, in wordmark font units (cap height 1300).
// The mark is the penguin emoji itself, so the lockup is set the way "🐧 PrivacyPal" sits in text:
// the emoji a little taller than the capitals, dipping slightly below the baseline, one space before the P.
const LOCK = {
  markHeightCaps: 1.6,   // penguin ink height as a multiple of cap height
  overshootCaps: 0.14,   // how far the feet sit below the baseline (an emoji's descent)
  gapMark: 0.22,         // space between penguin ink and the "P", as a share of the penguin height
  padCaps: 0.0,          // outer padding inside the viewBox (clear space is a usage rule, not baked in)
};

const read = (f) => fs.readFileSync(f, 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };

function inner(svg) {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}
function prefixIds(markup, prefix) {
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  let out = markup;
  for (const id of ids) {
    const re = new RegExp(`(id="|url\\(#|href="#)${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([")])`, 'g');
    out = out.replace(re, `$1${prefix}${id}$2`);
  }
  return out;
}
const fmt = (n) => Number(n.toFixed(2));

async function main() {
  const penguin = read(path.join(SRC, 'penguin.svg'));
  const flat = read(path.join(SRC, 'penguin-flat.svg'));
  const dark = read(path.join(SRC, 'penguin-dark.svg'));
  const wordmark = read(path.join(SRC, 'wordmark.svg'));
  const capH = Number((wordmark.match(/data-cap-height="(\d+)"/) || [])[1] || 1300);
  const wmPath = (wordmark.match(/<path[^>]*\sd="([^"]+)"/) || [])[1];
  const wmBox = wordmark.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/).slice(1).map(Number);
  const [wmX, wmY, wmW, wmH] = wmBox;

  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

  // 1. Ink bounding box of the penguin (all three variants share the drawing).
  async function bbox(svg) {
    await page.setContent(`<html><body style="margin:0">${svg.replace('<svg', '<svg id="m" width="512" height="512"')}</body></html>`);
    return page.evaluate(() => {
      const s = document.getElementById('m');
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      s.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach((el) => {
        if (el.closest('defs,clipPath,mask')) return;
        const b = el.getBBox();
        const m = el.getCTM();
        const sm = s.getScreenCTM().inverse().multiply(m);
        [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].forEach(([x, y]) => {
          const p = new DOMPoint(x, y).matrixTransform(sm);
          x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
        });
      });
      return [x0, y0, x1 - x0, y1 - y0];
    });
  }
  const [bx, by, bw, bh] = await bbox(penguin);

  // 2. Mascot variants.
  const viewBox = 'viewBox="0 0 512 512"';
  const wrap = (body, title) => `<svg xmlns="http://www.w3.org/2000/svg" ${viewBox} role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
  write(path.join(BRAND, 'penguin.svg'), wrap(inner(penguin), 'PrivacyPal penguin'));
  write(path.join(BRAND, 'penguin-flat.svg'), wrap(inner(flat), 'PrivacyPal penguin'));
  write(path.join(BRAND, 'penguin-dark.svg'), wrap(inner(dark), 'PrivacyPal penguin'));
  // The guide-moment files (404, empty states, sign-offs) are the same emoji: one penguin everywhere.
  write(path.join(BRAND, 'penguin-guide.svg'), wrap(inner(penguin), 'PrivacyPal penguin'));
  write(path.join(BRAND, 'penguin-guide-dark.svg'), wrap(inner(dark), 'PrivacyPal penguin'));

  // 3. Lockups: penguin cropped to its ink box, scaled to markHeightCaps x cap height.
  const markH = LOCK.markHeightCaps * capH;
  const markW = markH * (bw / bh);
  const markY = LOCK.overshootCaps * capH - markH;
  const gap = LOCK.gapMark * markH;
  const wmShift = markW + gap - wmX; // wordmark ink starts right after the gap
  const top = Math.min(markY, wmY);
  const bottom = Math.max(markY + markH, wmY + wmH);
  const pad = LOCK.padCaps * capH;
  const totalW = markW + gap + wmW;
  const vb = `${fmt(-pad)} ${fmt(top - pad)} ${fmt(totalW + 2 * pad)} ${fmt(bottom - top + 2 * pad)}`;

  function lockup(markMarkup, wordColor, title, pfx) {
    const mark = `<svg x="0" y="${fmt(markY)}" width="${fmt(markW)}" height="${fmt(markH)}" viewBox="${fmt(bx)} ${fmt(by)} ${fmt(bw)} ${fmt(bh)}" overflow="visible">${prefixIds(markMarkup, pfx)}</svg>`;
    const word = `<path fill="${wordColor}" transform="translate(${fmt(wmShift)} 0)" d="${wmPath}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${mark}${word}</svg>\n`;
  }
  const logos = {
    'logo.svg': lockup(inner(penguin), NAVY, 'PrivacyPal', 'lg-'),
    'logo-white.svg': lockup(inner(dark), WHITE, 'PrivacyPal', 'lw-'),
  };
  for (const [f, s] of Object.entries(logos)) write(path.join(BRAND, f), s);

  // 4. App icon: the whole penguin centered on the white rounded-square tile.
  //    White is the only tile (see the header note).
  const tile = (bg, markup, pfx) => {
    const size = 1024, r = 0.225 * size;
    const s = Number(((0.7 * size) / Math.max(bw, bh)).toFixed(4)); // the whole penguin, centered
    const tx = (size - bw * s) / 2 - bx * s;
    const ty = (size - bh * s) / 2 - by * s;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="PrivacyPal"><title>PrivacyPal</title><defs><clipPath id="${pfx}tile"><rect width="${size}" height="${size}" rx="${r}"/></clipPath></defs><rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/><g clip-path="url(#${pfx}tile)"><g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${s})">${prefixIds(markup, pfx)}</g></g></svg>\n`;
  };
  write(path.join(BRAND, 'app-icon.svg'), tile(WHITE, inner(penguin), 'ai-'));

  // 5. favicon.svg: the Twemoji drawing, unaltered, cropped to a square centered on the penguin.
  //    The penguin-flat (light chrome) and penguin-dark (dark chrome) sources are the same emoji, so
  //    both color schemes show the same penguin. Never add a redrawn or pixel-hinted penguin here.
  const side = Math.max(bw, bh) * 1.04; // square centered on the penguin
  const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(bx + bw / 2 - side / 2)} ${fmt(by + bh / 2 - side / 2)} ${fmt(side)} ${fmt(side)}"><style>.fd{display:none}@media (prefers-color-scheme:dark){.fl{display:none}.fd{display:inline}}</style><g class="fl">${prefixIds(inner(flat), 'fl-')}</g><g class="fd">${prefixIds(inner(dark), 'fd-')}</g></svg>\n`;
  write(path.join(BRAND, 'favicon.svg'), fav);

  // 6. PNG exports.
  async function png(svgFile, outFile, w, h, bg) {
    const svg = read(svgFile);
    const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:${bg || 'transparent'}"><img src="${dataUri}" style="display:block;width:${w}px;height:${h}px;object-fit:contain"></body></html>`);
    await page.waitForSelector('img');
    await page.evaluate(() => document.querySelector('img').decode());
    write(outFile, '');
    await page.screenshot({ path: outFile, omitBackground: !bg, clip: { x: 0, y: 0, width: w, height: h } });
  }
  const lockAspect = (totalW + 2 * pad) / (bottom - top + 2 * pad);
  for (const s of [64, 128, 256, 512, 1024, 2048]) await png(path.join(BRAND, 'penguin.svg'), path.join(PNG, `penguin-${s}.png`), s, s);
  for (const s of [32, 64, 128]) await png(path.join(BRAND, 'penguin-flat.svg'), path.join(PNG, `penguin-flat-${s}.png`), s, s);
  for (const s of [256, 512, 1024]) await png(path.join(BRAND, 'penguin-dark.svg'), path.join(PNG, `penguin-dark-${s}.png`), s, s);
  for (const w of [600, 1200, 2400]) {
    const h = Math.round(w / lockAspect);
    await png(path.join(BRAND, 'logo.svg'), path.join(PNG, `logo-${w}.png`), w, h);
    await png(path.join(BRAND, 'logo-white.svg'), path.join(PNG, `logo-white-${w}.png`), w, h);
  }
  await png(path.join(BRAND, 'app-icon.svg'), path.join(PNG, 'app-icon-1024.png'), 1024, 1024);
  // Social avatars: full-bleed square (platforms crop to a circle).
  await png(path.join(BRAND, 'app-icon.svg'), path.join(PNG, 'avatar-400.png'), 400, 400, '#ffffff');

  // 7. Favicons and touch icons (repo root keeps its historical filenames).
  const sq = async (file, out, s, bg) => png(file, out, s, s, bg);
  // 16 and 32px: favicon.svg (the emoji crop) rendered at size.
  await sq(path.join(BRAND, 'favicon.svg'), path.join(ROOT, 'favicon-16x16.png'), 16);
  await sq(path.join(BRAND, 'favicon.svg'), path.join(ROOT, 'favicon-32x32.png'), 32);
  // 48px (inside the .ico): the same square crop as favicon.svg, without the color-scheme switch.
  const big = path.join(require('os').tmpdir(), 'pp-favicon-48.svg');
  write(big, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(bx + bw / 2 - bh * 0.52)} ${fmt(by - bh * 0.02)} ${fmt(bh * 1.04)} ${fmt(bh * 1.04)}">${prefixIds(inner(flat), 'f48-')}</svg>`);
  await sq(big, path.join(BRAND, 'png', 'favicon-48.png'), 48);
  await sq(path.join(BRAND, 'app-icon.svg'), path.join(ROOT, 'apple-touch-icon.png'), 180, '#ffffff');
  await sq(path.join(BRAND, 'app-icon.svg'), path.join(ROOT, 'android-chrome-192x192.png'), 192);
  await sq(path.join(BRAND, 'app-icon.svg'), path.join(ROOT, 'android-chrome-512x512.png'), 512);
  fs.copyFileSync(path.join(ROOT, 'favicon-32x32.png'), path.join(ROOT, 'assets', 'favicon-32x32.png'));

  await browser.close();

  execFileSync('python3', [path.join(__dirname, 'make-ico.py'),
    path.join(ROOT, 'favicon-16x16.png'), path.join(ROOT, 'favicon-32x32.png'), path.join(BRAND, 'png', 'favicon-48.png'),
    path.join(ROOT, 'favicon.ico')], { stdio: 'inherit' });
  fs.copyFileSync(path.join(ROOT, 'favicon.ico'), path.join(ROOT, 'assets', 'favicon.ico'));

  console.log(`penguin ink box ${[bx, by, bw, bh].map(fmt).join(' ')}; lockup aspect ${lockAspect.toFixed(3)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
