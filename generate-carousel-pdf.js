const puppeteer = require('puppeteer');
const path = require('path');

// Renders presentations/linkedin-trust-gap.html to a 4-page square PDF
// sized for LinkedIn document carousels (1200x1200 per page).
async function generate() {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });

        const htmlPath = path.resolve(__dirname, 'presentations', 'linkedin-trust-gap.html');
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.evaluateHandle('document.fonts.ready');

        const outPath = path.resolve(__dirname, 'presentations', 'PrivacyPal-The-Impossible-Mandate.pdf');
        await page.pdf({
            path: outPath,
            width: '1200px',
            height: '1200px',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            preferCSSPageSize: true
        });
        console.log(`PDF generated: ${outPath}`);
    } finally {
        await browser.close();
    }
}

generate().catch(err => { console.error(err); process.exit(1); });
