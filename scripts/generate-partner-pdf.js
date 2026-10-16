/**
 * Render the partner one-pagers in partners/ to PDF.
 *
 *   npm run partner-pdf
 *
 * Same approach as generate-pdf.js: headless Chrome prints the page, so what
 * ships is what the design system renders, with no separate layout engine to
 * keep in sync.
 *
 * Each source page sets its own @page size and carries its own padding, so
 * printing uses margin:0. printBackground is on because the whole look is
 * background washes, tinted panels and photography.
 *
 * Fonts: Fredoka and IBM Plex Mono come from Google Fonts and Overused
 * Grotesk is loaded from assets/fonts. The run waits for document.fonts.ready
 * before printing, otherwise a cold cache prints the fallback stack.
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

const DOCS = [
  {
    html: 'partners/affiliate-links.html',
    pdf: 'partners/PrivacyPal-Family-Partner-Links.pdf',
    width: '8.5in',
    height: '11in'
  }
];

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // The system browser. Puppeteer's bundled Chromium is not installed here.
    executablePath: process.env.CHROME_PATH
      || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  try {
    for (const doc of DOCS) {
      const src = path.join(ROOT, doc.html);
      const out = path.join(ROOT, doc.pdf);
      if (!fs.existsSync(src)) throw new Error(`missing source: ${doc.html}`);

      const page = await browser.newPage();
      page.on('console', (m) => {
        if (m.type() === 'error') console.warn(`  page error: ${m.text()}`);
      });

      await page.goto(`file://${src}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);

      // A one-pager that silently became two pages is the failure this catches.
      const overflow = await page.evaluate(() => {
        const el = document.querySelector('.page');
        return el ? el.scrollHeight - el.clientHeight : 0;
      });
      if (overflow > 1) {
        console.warn(`  WARNING: content overflows the page by ${overflow}px`);
      }

      await page.pdf({
        path: out,
        width: doc.width,
        height: doc.height,
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        preferCSSPageSize: true
      });

      await page.close();
      const kb = Math.round(fs.statSync(out).size / 1024);
      console.log(`${doc.pdf}  (${kb} KB)`);
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
