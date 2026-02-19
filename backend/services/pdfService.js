// ============================================
// SERVER-SIDE PDF GENERATION SERVICE
// Uses Puppeteer to render HTML → PDF
// ============================================

let browser = null;

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;

  const puppeteer = require('puppeteer');
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  return browser;
}

/**
 * Generate a PDF buffer from an HTML string.
 * @param {string} html - Full standalone HTML document
 * @returns {Promise<Buffer>} PDF as a Buffer
 */
async function generateReportPdf(html) {
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '12mm',
        bottom: '15mm',
        left: '12mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

/**
 * Cleanup: close the shared browser instance.
 */
async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Graceful shutdown
process.on('SIGTERM', closeBrowser);
process.on('SIGINT', closeBrowser);

module.exports = { generateReportPdf, closeBrowser };
