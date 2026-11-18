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
 * The pages also carry an @media screen layer (a sheet on a desk, or a
 * stacked phone layout) for when the HTML link is opened in a browser. The
 * PDF is printed with print media, and the fit check below runs in print
 * media at Letter size too, so the screen layer never reaches the PDF.
 *
 * Fonts: IBM Plex Mono comes from Google Fonts and Overused Grotesk (the
 * brand typeface, the wordmark's face) is loaded from assets/fonts. The run
 * waits for document.fonts.ready before printing, otherwise a cold cache
 * prints the fallback stack. The logo is assets/brand/logo.svg (the Twemoji
 * penguin and the wordmark), so a logo change reaches the PDFs on the next
 * run with no edit here. Each page prints the Twemoji CC BY 4.0 credit under
 * its address line; keep it there.
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

// Output filenames are fixed: partners already hold links to these PDFs.
const DOCS = [
  {
    html: 'partners/affiliate-links.html',        // Family pack
    pdf: 'partners/PrivacyPal-Family-Partner-Links.pdf',
    width: '8.5in',
    height: '11in'
  },
  {
    html: 'partners/max-affiliate-links.html',    // Max pack
    pdf: 'partners/PrivacyPal-Max-Partner-Links.pdf',
    width: '8.5in',
    height: '11in'
  }
];

// Letter at 96 dpi, the size the page is laid out for.
const VIEWPORT = { width: 816, height: 1056 };

function pdfPageCount(file) {
  const text = fs.readFileSync(file).toString('latin1');
  return (text.match(/\/Type\s*\/Page(?!s)/g) || []).length;
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // The system browser. Puppeteer's bundled Chromium is not installed here.
    executablePath: process.env.CHROME_PATH
      || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  let problems = 0;
  try {
    for (const doc of DOCS) {
      const src = path.join(ROOT, doc.html);
      const out = path.join(ROOT, doc.pdf);
      if (!fs.existsSync(src)) throw new Error(`missing source: ${doc.html}`);

      const page = await browser.newPage();
      page.on('console', (m) => {
        if (m.type() === 'error') console.warn(`  page error: ${m.text()}`);
      });

      await page.setViewport(VIEWPORT);
      await page.goto(`file://${src}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await page.emulateMediaType('print');
      await page.evaluate(() => document.fonts.ready);

      // A one-pager that silently became two pages is the failure this catches.
      const overflow = await page.evaluate(() => {
        const el = document.querySelector('.page');
        return el ? el.scrollHeight - el.clientHeight : 0;
      });
      if (overflow > 1) {
        problems++;
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
      const pages = pdfPageCount(out);
      if (pages !== 1) {
        problems++;
        console.warn(`  WARNING: ${doc.pdf} has ${pages} pages, expected 1`);
      }
      console.log(`${doc.pdf}  (${kb} KB, ${pages} page${pages === 1 ? '' : 's'})`);
    }
  } finally {
    await browser.close();
  }
  if (problems) process.exitCode = 1;
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
