#!/usr/bin/env node
/*
  PrivacyPal legacy logo files and brand guide download pack (2026-11 rebrand).

  1. Legacy logo PNGs. These filenames predate the Privacy Penguin and stay
     because emails, the RSS feed (blog/rss.xml channel image), JSON-LD
     (contact.html "logo"), old social cards and third parties hotlink them by
     URL. Page code never uses them: pages reference assets/brand/*.svg.

       color lockup (assets/brand/logo.svg)        -> assets/logo-color.png
                                                       privacypal-logo-color.png
                                                       privacypal-logo.png
                                                       family/assets/product/logo-color.png
       white lockup  (assets/brand/logo-white.svg)  -> assets/logo-light.png
                                                       privacypal-logo-light.png

     Each is 4000px wide with a transparent background. The canvas keeps the
     legacy 4000x1108 frame (3.61:1): the new lockup fills the width and sits
     centered in the height. A hotlink that hardcodes the old width and height
     therefore shows the new logo at its true proportions instead of stretching
     it.

  2. The brand pack behind the brand guide's download button (brand/index.html):
       brand/assets/PrivacyPal-brand-assets.zip
     It zips the current files: the logos, the penguin and the app icon from
     build-brand.js (assets/brand/, assets/brand/png/), Twemoji's own source
     file (assets/brand/src/twemoji-1f427.svg), and the profile picture and
     social banners from build-og.js (assets/brand/social/), plus a README with
     the rules and the Twemoji credit (CC BY 4.0 requires it).
     The penguin is the Twemoji penguin emoji, unaltered, so the pack carries one
     drawing: penguin-flat, penguin-dark and penguin-guide are the same file under
     earlier names and stay out. There are no one-ink files: the mark is the emoji
     unaltered. The white tile is the only tile (the app icon and the avatar): on
     gold the beak and feet vanish, and on navy the dark body does.

  Run whenever the penguin or the lockup changes, after build-brand.js
  (puppeteer 21 needs Node 20 and system Chrome on this machine):
    ~/.nvm/versions/node/v20.20.2/bin/node scripts/brand/legacy-logos.js
  npm run brand:all runs this last, after build-og.js, so the pack already
  holds the current social images. After a standalone build-og.js run
  (npm run brand:og), refresh the pack with --pack-only.
  Flags: --logos-only skips step 2; --pack-only skips step 1.
*/
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');

const ROOT = process.env.BRAND_ROOT || path.resolve(__dirname, '..', '..');
const BRAND = path.join(ROOT, 'assets', 'brand');
const PNG = path.join(BRAND, 'png');
const SOCIAL = path.join(BRAND, 'social');
const GUIDE = path.join(ROOT, 'brand', 'assets');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const LEGACY_W = 4000;
const LEGACY_H = 1108; // the historical frame; see the header note
const LEGACY_INSET = 16; // horizontal breathing room so the P and the l never touch the edge

// The Twemoji credit, worded as the site footer words it (assets/v3.js).
const TWEMOJI = {
  version: 'v17.0.3',
  source: 'https://github.com/jdecked/twemoji',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  credit: 'Penguin emoji graphic from Twemoji, © Twitter, Inc. and other contributors, licensed under CC BY 4.0.',
};

// Files left out of the pack: earlier names for the same penguin, plus guards
// for files the build no longer makes (gold and navy tiles and avatars). The
// mark is the emoji unaltered, so a one-ink file (logo-mono-*, penguin-mono-*)
// must never ship either; the -mono branch is a guard in case one reappears.
const RETIRED = /^(app-icon-(gold|navy)|avatar-(gold|navy)|penguin-(flat|dark|guide)|(logo|penguin)-mono)/;

const LEGACY = [
  { src: 'logo.svg', out: ['assets/logo-color.png', 'privacypal-logo-color.png', 'privacypal-logo.png', 'family/assets/product/logo-color.png'] },
  { src: 'logo-white.svg', out: ['assets/logo-light.png', 'privacypal-logo-light.png'] },
];

const args = new Set(process.argv.slice(2));
const doLogos = !args.has('--pack-only');
const doPack = !args.has('--logos-only');

const read = (f) => fs.readFileSync(f, 'utf8');
const mkdirp = (d) => fs.mkdirSync(d, { recursive: true });

// Renders an SVG file into a w x h PNG. object-fit: contain keeps the drawing's
// proportions inside the frame (less a horizontal inset); bg null leaves the
// background transparent.
async function render(page, svgFile, outFile, w, h, bg, inset = 0) {
  const svg = read(svgFile);
  const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><body style="margin:0;background:${bg || 'transparent'}">` +
    `<img src="${dataUri}" style="display:block;width:${w - 2 * inset}px;height:${h}px;margin:0 ${inset}px;object-fit:contain"></body></html>`
  );
  await page.waitForSelector('img');
  await page.evaluate(() => document.querySelector('img').decode());
  mkdirp(path.dirname(outFile));
  await page.screenshot({ path: outFile, omitBackground: !bg, clip: { x: 0, y: 0, width: w, height: h } });
}

function lockupAspect(svgFile) {
  const m = read(svgFile).match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
  if (!m) throw new Error(`no viewBox in ${svgFile}`);
  return Number(m[3]) / Number(m[4]);
}

function buildPack() {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-brand-pack-'));
  const top = path.join(stage, 'PrivacyPal-brand-assets');
  const put = (from, toDir) => {
    if (!fs.existsSync(from)) { console.warn(`  skipped (missing): ${path.relative(ROOT, from)}`); return; }
    mkdirp(path.join(top, toDir));
    fs.copyFileSync(from, path.join(top, toDir, path.basename(from)));
  };
  const keep = (f) => f.endsWith('.png') && !RETIRED.test(f);
  const pngs = fs.readdirSync(PNG).filter(keep);

  for (const f of ['logo.svg', 'logo-white.svg']) put(path.join(BRAND, f), 'logo/svg');
  for (const f of pngs.filter((f) => f.startsWith('logo'))) put(path.join(PNG, f), 'logo/png');
  for (const f of ['penguin.svg']) put(path.join(BRAND, f), 'penguin/svg');
  for (const f of pngs.filter((f) => f.startsWith('penguin'))) put(path.join(PNG, f), 'penguin/png');
  put(path.join(BRAND, 'src', 'twemoji-1f427.svg'), 'penguin/source');
  for (const f of ['app-icon.svg', 'favicon.svg']) put(path.join(BRAND, f), 'app-icon/svg');
  for (const f of pngs.filter((f) => f.startsWith('app-icon') || f.startsWith('favicon'))) put(path.join(PNG, f), 'app-icon/png');
  if (fs.existsSync(SOCIAL)) {
    for (const f of fs.readdirSync(SOCIAL).filter(keep)) put(path.join(SOCIAL, f), 'social');
  } else {
    console.warn('  skipped social/: run scripts/brand/build-og.js first');
  }

  fs.writeFileSync(path.join(top, 'README.txt'), [
    'PrivacyPal brand assets',
    '',
    'Full guidelines: https://privacypal.ai/brand/',
    '',
    'logo/      the lockup: logo (light grounds) and logo-white (navy and dark photos), SVG and PNG',
    'penguin/   the logo mark on its own: the Twemoji penguin emoji, unaltered (SVG, PNG 64 to 2048),',
    '           and Twemoji\'s own source file (source/)',
    'app-icon/  the penguin on the white rounded tile (app icon, avatars) and the favicon',
    'social/    the profile picture (platforms crop it to a circle), LinkedIn, X and YouTube banners,',
    '           square post examples',
    '',
    'The penguin and its credit',
    `The mark is the penguin emoji (U+1F427) from Twemoji ${TWEMOJI.version}, Copyright Twitter, Inc. and`,
    `other contributors, licensed under CC BY 4.0 (${TWEMOJI.license}).`,
    `Source: ${TWEMOJI.source}`,
    'Credit it wherever you publish it, in a way that fits the medium: this line in the small print,',
    'or a link to https://privacypal.ai/brand/, which carries it.',
    `  ${TWEMOJI.credit}`,
    'The penguin artwork is not exclusive to PrivacyPal. The PrivacyPal marks are the',
    '"\u{1F427} PrivacyPal" lockup and the PrivacyPal word mark.',
    '',
    'Rules in short',
    '1. Use the files. Never redraw, recolor, flip, outline or restyle the penguin, and never use',
    '   Apple\'s or another vendor\'s emoji artwork.',
    '2. Clear space around the logo equals the height of the penguin, on every side.',
    '3. Below 120px wide on screen, use the penguin alone (penguin.svg) or the app icon.',
    '4. On navy or dark photography use logo-white: the penguin keeps its colors, the wordmark turns',
    '   white. Never whiten the logo with a filter. No gold tile.',
    '5. Colors: Deep Navy #01204E, Signal Teal #028391, Penguin Gold #FFAC33.',
    '6. Packs: Personal (free), Family and Max. The product is PrivacyPal.',
    '',
    'Questions: press@privacypal.ai',
    '',
  ].join('\n'));

  const zipFile = path.join(GUIDE, 'PrivacyPal-brand-assets.zip');
  mkdirp(GUIDE);
  if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
  execFileSync('zip', ['-r', '-X', '-q', zipFile, 'PrivacyPal-brand-assets'], { cwd: stage, stdio: 'inherit' });
  fs.rmSync(stage, { recursive: true, force: true });
  return zipFile;
}

async function main() {
  if (doLogos) {
    const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME });
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    for (const { src, out } of LEGACY) {
      const svgFile = path.join(BRAND, src);
      const aspect = lockupAspect(svgFile);
      const first = path.join(ROOT, out[0]);
      await render(page, svgFile, first, LEGACY_W, LEGACY_H, null, LEGACY_INSET);
      for (const o of out.slice(1)) { mkdirp(path.dirname(path.join(ROOT, o))); fs.copyFileSync(first, path.join(ROOT, o)); }
      const inkW = LEGACY_W - 2 * LEGACY_INSET;
      console.log(`${src} -> ${out.join(', ')} (${LEGACY_W}x${LEGACY_H}, lockup ${inkW}x${Math.round(inkW / aspect)})`);
    }
    await browser.close();
  }

  if (doPack) {
    const zip = buildPack();
    console.log(`pack -> ${path.relative(ROOT, zip)} (${Math.round(fs.statSync(zip).size / 1024)} KB)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
