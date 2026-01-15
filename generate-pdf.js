const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function generatePDFs() {
    console.log('Starting PDF generation...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Set viewport to landscape (1920x1080 for 16:9 aspect ratio)
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 2
        });

        // Get the absolute path to the HTML file
        const htmlPath = path.resolve(__dirname, 'presentations', 'pitch-deck.html');
        const fileUrl = `file://${htmlPath}`;
        
        console.log(`Loading HTML from: ${fileUrl}`);
        await page.goto(fileUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for all slides to be loaded
        await page.waitForSelector('.slide', { timeout: 10000 });
        
        // Get total number of slides
        const totalSlides = await page.evaluate(() => {
            return document.querySelectorAll('.slide').length;
        });
        console.log(`Found ${totalSlides} slides`);

        // Function to prepare page for PDF generation
        async function preparePageForPDF(applyGrayscale = false) {
            // Inject CSS to hide navigation and animations, and optimize for PDF
            await page.addStyleTag({
                content: `
                    .slide-nav, .slide-counter, .keyboard-hint {
                        display: none !important;
                    }
                    .bg-mesh, #velocity-lines {
                        display: none !important;
                    }
                    /* Reduce padding for PDF to fit more content */
                    .slide {
                        padding: 50px 80px !important;
                    }
                    /* Reduce margins and spacing for dense slides */
                    .slide h2 {
                        margin-bottom: 30px !important;
                        font-size: clamp(2rem, 4vw, 3.5rem) !important;
                    }
                    .slide h3 {
                        margin-bottom: 15px !important;
                        font-size: clamp(1.3rem, 2.5vw, 1.8rem) !important;
                    }
                    .slide p, .slide li {
                        margin-bottom: 12px !important;
                        font-size: clamp(1rem, 1.8vw, 1.3rem) !important;
                    }
                    /* Optimize process-flow for slide 6 */
                    .process-flow {
                        margin-top: 30px !important;
                        gap: 30px !important;
                    }
                    .process-step {
                        padding: 25px !important;
                        min-height: 220px !important;
                    }
                    /* Optimize market circles for slide 7 */
                    .market-circles {
                        margin-top: 30px !important;
                        gap: 15px !important;
                    }
                    .market-circle {
                        width: 160px !important;
                        height: 160px !important;
                    }
                    .market-circle.tam {
                        width: 300px !important;
                        height: 300px !important;
                    }
                    .market-circle.sam {
                        width: 190px !important;
                        height: 190px !important;
                    }
                    .market-circle.som {
                        width: 140px !important;
                        height: 140px !important;
                    }
                    /* Optimize opportunity points for slide 10 */
                    .opportunity-highlight {
                        padding: 35px !important;
                        margin: 30px 0 !important;
                    }
                    .opportunity-points {
                        gap: 20px !important;
                        margin-top: 30px !important;
                    }
                    .opportunity-point {
                        padding: 20px !important;
                        font-size: clamp(1rem, 1.8vw, 1.3rem) !important;
                    }
                    /* Optimize ask content for slide 11 */
                    .ask-content > div[style*="margin-top: 60px"] {
                        margin-top: 40px !important;
                    }
                    .ask-content p[style*="font-size: 1.8rem"] {
                        font-size: 1.4rem !important;
                        margin-bottom: 15px !important;
                    }
                    .positioning-statement {
                        padding: 30px !important;
                        margin: 30px 0 !important;
                    }
                    .positioning-statement p {
                        font-size: clamp(1.1rem, 1.9vw, 1.4rem) !important;
                    }
                    .ask-content h3 {
                        margin-top: 30px !important;
                        margin-bottom: 25px !important;
                    }
                    .funds-breakdown {
                        margin-top: 30px !important;
                        gap: 20px !important;
                    }
                    .fund-item {
                        padding: 25px !important;
                    }
                    ${applyGrayscale ? `
                    body, body * {
                        filter: grayscale(100%) !important;
                        -webkit-filter: grayscale(100%) !important;
                    }
                    ` : ''}
                `
            });

            // Just hide navigation elements, don't modify layout
            await page.evaluate(() => {
                const navElements = document.querySelectorAll('.slide-nav, .slide-counter, .keyboard-hint');
                navElements.forEach(el => el.style.display = 'none');
                
                const bgMesh = document.querySelector('.bg-mesh');
                const velocityLines = document.getElementById('velocity-lines');
                if (bgMesh) bgMesh.style.display = 'none';
                if (velocityLines) velocityLines.style.display = 'none';
            });

            await page.waitForTimeout(300);
        }

        // Function to generate PDF for a specific slide
        async function generateSlidePDF(slideIndex, applyGrayscale = false) {
            // Navigate to the specific slide
            await page.evaluate((index) => {
                const slides = document.querySelectorAll('.slide');
                const totalSlides = slides.length;
                
                if (index < 0 || index >= totalSlides) return;
                
                const wrapper = document.getElementById('slidesWrapper');
                if (wrapper) {
                    wrapper.style.transform = `translateX(-${index * 100}vw)`;
                }
                
                // Update active slide
                slides.forEach((slide, i) => {
                    if (i === index) {
                        slide.classList.add('active');
                        slide.style.opacity = '1';
                        slide.style.transform = 'translateX(0)';
                        
                        // Apply slide-specific optimizations for dense slides
                        const content = slide.querySelector('.slide-content');
                        if (content) {
                            // Slide 6 (index 5): Process flow
                            if (index === 5) {
                                const processFlow = content.querySelector('.process-flow');
                                if (processFlow) {
                                    processFlow.style.marginTop = '20px';
                                    processFlow.style.gap = '20px';
                                }
                                const processSteps = content.querySelectorAll('.process-step');
                                processSteps.forEach(step => {
                                    step.style.padding = '20px';
                                    step.style.minHeight = '180px';
                                });
                            }
                            // Slide 7 (index 6): Market circles
                            if (index === 6) {
                                const marketCircles = content.querySelector('.market-circles');
                                if (marketCircles) {
                                    marketCircles.style.marginTop = '20px';
                                    marketCircles.style.gap = '12px';
                                }
                                const paragraphs = content.querySelectorAll('p[style*="font-size: 1.5rem"]');
                                paragraphs.forEach(p => {
                                    p.style.fontSize = '1.2rem';
                                    p.style.marginBottom = '25px';
                                });
                                const bottomP = content.querySelector('p[style*="text-align: center"]');
                                if (bottomP && bottomP.textContent.includes('Prize')) {
                                    bottomP.style.marginTop = '25px';
                                    bottomP.style.fontSize = '1.1rem';
                                }
                            }
                            // Slide 10 (index 9): Opportunity points
                            if (index === 9) {
                                const highlight = content.querySelector('.opportunity-highlight');
                                if (highlight) {
                                    highlight.style.padding = '25px';
                                    highlight.style.margin = '20px 0';
                                }
                                const points = content.querySelectorAll('.opportunity-point');
                                points.forEach(point => {
                                    point.style.padding = '18px';
                                    point.style.fontSize = '1.1rem';
                                });
                            }
                            // Slide 11 (index 10): Ask content
                            if (index === 10) {
                                const topDiv = content.querySelector('div[style*="margin-top: 60px"]');
                                if (topDiv) {
                                    topDiv.style.marginTop = '30px';
                                }
                                const largePs = content.querySelectorAll('p[style*="font-size: 1.8rem"]');
                                largePs.forEach(p => {
                                    p.style.fontSize = '1.3rem';
                                    p.style.marginBottom = '12px';
                                });
                                const positioning = content.querySelector('.positioning-statement');
                                if (positioning) {
                                    positioning.style.padding = '25px';
                                    positioning.style.margin = '20px 0';
                                }
                                const h3 = content.querySelector('h3[style*="margin-top: 40px"]');
                                if (h3) {
                                    h3.style.marginTop = '25px';
                                    h3.style.marginBottom = '20px';
                                }
                                const fundsBreakdown = content.querySelector('.funds-breakdown');
                                if (fundsBreakdown) {
                                    fundsBreakdown.style.marginTop = '20px';
                                    fundsBreakdown.style.gap = '15px';
                                }
                            }
                        }
                    } else {
                        slide.classList.remove('active');
                    }
                });
            }, slideIndex);

            await page.waitForTimeout(600);

            // Verify which slide is actually visible
            const visibleSlideInfo = await page.evaluate(() => {
                const slides = document.querySelectorAll('.slide');
                const container = document.querySelector('.slide-container');
                const containerRect = container.getBoundingClientRect();
                
                for (let i = 0; i < slides.length; i++) {
                    const slide = slides[i];
                    const rect = slide.getBoundingClientRect();
                    // Check if slide is mostly visible in the viewport
                    if (rect.left >= containerRect.left - 50 && 
                        rect.left < containerRect.right + 50 &&
                        rect.width > containerRect.width * 0.9) {
                        // Get a snippet of the slide content to verify
                        const h2 = slide.querySelector('h2');
                        const h1 = slide.querySelector('h1');
                        const title = h2 ? h2.textContent : (h1 ? h1.textContent : '');
                        return { index: i, title: title.substring(0, 50) };
                    }
                }
                return { index: -1, title: 'none' };
            });

            if (visibleSlideInfo.index !== slideIndex) {
                console.warn(`  Warning: Expected slide ${slideIndex + 1}, but slide ${visibleSlideInfo.index + 1} is visible (${visibleSlideInfo.title})`);
            } else {
                console.log(`  Capturing: ${visibleSlideInfo.title || `Slide ${slideIndex + 1}`}`);
            }

            // Check if content fits, and apply CSS transform scale if needed
            const needsScaling = await page.evaluate(() => {
                const slide = document.querySelector('.slide.active');
                if (!slide) return { needsScale: false, scale: 1 };
                const content = slide.querySelector('.slide-content');
                if (!content) return { needsScale: false, scale: 1 };
                
                // Get the actual rendered height of the content
                const rect = content.getBoundingClientRect();
                const contentHeight = rect.height;
                const viewportHeight = 1080;
                const maxContentHeight = 950; // Leave breathing room (65px top + 65px bottom)
                
                if (contentHeight > maxContentHeight) {
                    const scale = Math.max(0.70, maxContentHeight / contentHeight);
                    // Apply CSS transform to scale the content
                    content.style.transform = `scale(${scale})`;
                    content.style.transformOrigin = 'top center';
                    // Adjust container to center scaled content vertically
                    const slideEl = slide;
                    slideEl.style.display = 'flex';
                    slideEl.style.alignItems = 'center';
                    slideEl.style.justifyContent = 'center';
                    return { needsScale: true, scale: scale, height: contentHeight };
                }
                return { needsScale: false, scale: 1, height: contentHeight };
            });

            if (needsScaling.needsScale) {
                console.log(`  Content height: ${Math.round(needsScaling.height)}px, applying ${(needsScaling.scale * 100).toFixed(1)}% scale`);
                await page.waitForTimeout(400); // Wait for transform to apply
            } else {
                await page.waitForTimeout(200);
            }

            // Generate PDF buffer for this slide
            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: {
                    top: '0',
                    right: '0',
                    bottom: '0',
                    left: '0'
                },
                preferCSSPageSize: false,
                width: '11.69in',
                height: '8.27in',
                displayHeaderFooter: false,
                scale: 1
            });

            // Reset transform for next slide
            await page.evaluate(() => {
                const content = document.querySelector('.slide.active .slide-content');
                if (content) {
                    content.style.transform = '';
                    content.style.transformOrigin = '';
                }
                const slide = document.querySelector('.slide.active');
                if (slide) {
                    slide.style.display = '';
                    slide.style.alignItems = '';
                    slide.style.justifyContent = '';
                }
            });

            return pdfBuffer;
        }

        // Generate color PDF
        console.log('Generating color PDF...');
        await preparePageForPDF(false);
        
        const colorPdfDoc = await PDFDocument.create();
        const colorPages = [];

        for (let i = 0; i < totalSlides; i++) {
            console.log(`  Processing slide ${i + 1}/${totalSlides}...`);
            const slidePdfBuffer = await generateSlidePDF(i, false);
            const slidePdf = await PDFDocument.load(slidePdfBuffer);
            const [slidePage] = await colorPdfDoc.copyPages(slidePdf, [0]);
            colorPdfDoc.addPage(slidePage);
        }

        const colorPdfBytes = await colorPdfDoc.save();
        const colorPdfPath = path.resolve(__dirname, 'presentations', 'pitch-deck-color.pdf');
        fs.writeFileSync(colorPdfPath, colorPdfBytes);
        console.log(`Color PDF generated: ${colorPdfPath} (${totalSlides} pages)`);

        // Reload page for grayscale version
        await page.goto(fileUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        await page.waitForSelector('.slide', { timeout: 10000 });

        // Generate grayscale PDF
        console.log('Generating grayscale PDF...');
        await preparePageForPDF(true);
        
        const grayscalePdfDoc = await PDFDocument.create();
        const grayscalePages = [];

        for (let i = 0; i < totalSlides; i++) {
            console.log(`  Processing slide ${i + 1}/${totalSlides}...`);
            const slidePdfBuffer = await generateSlidePDF(i, true);
            const slidePdf = await PDFDocument.load(slidePdfBuffer);
            const [slidePage] = await grayscalePdfDoc.copyPages(slidePdf, [0]);
            grayscalePdfDoc.addPage(slidePage);
        }

        const grayscalePdfBytes = await grayscalePdfDoc.save();
        const grayscalePdfPath = path.resolve(__dirname, 'presentations', 'pitch-deck-grayscale.pdf');
        fs.writeFileSync(grayscalePdfPath, grayscalePdfBytes);
        console.log(`Grayscale PDF generated: ${grayscalePdfPath} (${totalSlides} pages)`);

        console.log('\nPDF generation complete!');
        console.log(`\nGenerated files:`);
        console.log(`  - Color: ${colorPdfPath} (${totalSlides} pages)`);
        console.log(`  - Grayscale: ${grayscalePdfPath} (${totalSlides} pages)`);

    } catch (error) {
        console.error('Error generating PDFs:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the generator
generatePDFs().catch(console.error);
