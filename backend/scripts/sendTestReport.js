#!/usr/bin/env node
// ============================================
// SEND A TEST PDF REPORT VIA EMAIL
// Usage: node scripts/sendTestReport.js <email>
// ============================================

require('dotenv').config();

const { generateReportPdf } = require('../services/pdfService');
const { buildReportHtml } = require('../services/reportTemplate');
const { sendEmailWithAttachment } = require('../services/emailService');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/sendTestReport.js <email>');
  process.exit(1);
}

async function main() {
  console.log(`Generating test PDF report...`);

  const html = buildReportHtml({
    companyName: 'Cap Marketing Kft.',
    month: '2026-01',
    platformLabel: 'Facebook',
    kpis: [
      { label: 'Követők', value: 12450 },
      { label: 'Elérés', value: 89320 },
      { label: 'Impressziók', value: 145600 },
      { label: 'Reakciók', value: 3240 },
      { label: 'Kommentek', value: 412 },
      { label: 'Megosztások', value: 187 },
      { label: 'Posztok', value: 24 },
      { label: 'Napi új követők', value: 156 },
      { label: 'Videó nézések', value: 23400 },
    ],
    topVideos: [
      { title: '5 tipp a hatékony social media marketinghez', views: 8400, likes: 320 },
      { title: 'Hogyan indíts sikeres Facebook kampányt?', views: 6200, likes: 245 },
      { title: 'Instagram vs TikTok: melyiket válaszd?', views: 5100, likes: 198 },
      { title: 'Content marketing alapok 2026-ban', views: 3800, likes: 156 },
      { title: 'Influencer együttműködések tapasztalatai', views: 2900, likes: 112 },
    ],
  });

  console.log('Rendering PDF with Puppeteer...');
  const pdfBuffer = await generateReportPdf(html);
  console.log(`PDF generated: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  console.log(`Sending to ${email}...`);
  const result = await sendEmailWithAttachment({
    to: email,
    subject: 'Trendalyz - Minta havi riport (Facebook — Cap Marketing Kft.)',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Trendalyz</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 8px 0;">Cap Marketing Kft.</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0;">Facebook havi riport — 2026. január</p>
          <p style="color: #334155; font-size: 15px;">Szia!</p>
          <p style="color: #334155; font-size: 15px;">Mellékletben találod a havi riportot PDF formátumban.</p>
          <p style="color: #334155; font-size: 15px; margin-top: 16px;">Ez az automatikus havi riport a <strong>Growth</strong> csomagtól érhető el. A küldés minden hónap 3-án reggel 8:00-kor történik automatikusan.</p>
          <div style="margin-top: 24px; padding: 16px; background: #f0f9ff; border-radius: 12px; border: 1px solid #bae6fd;">
            <p style="color: #0369a1; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">Beállítások:</p>
            <ul style="color: #0c4a6e; font-size: 13px; margin: 0; padding-left: 20px;">
              <li>Az automatikus havi email a <strong>Growth (€99/hó)</strong> csomagtól érhető el</li>
              <li>Minden hónap <strong>3-án reggel 8:00-kor</strong> küldi az előző havi riportot</li>
              <li>Minden aktív céghez és platformhoz külön PDF-et küld</li>
              <li>Az admin email címre érkezik (amellyel be vagy jelentkezve)</li>
              <li>A küldés ütemezése jelenleg fix — a <code>monthlyReportJob.js</code> fájlban módosítható</li>
            </ul>
          </div>
        </div>
        <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            Ez egy teszt email a Trendalyz rendszerből. &copy; 2026 Trendalyz
          </p>
        </div>
      </div>
    `,
    attachments: [{
      filename: 'Cap-Marketing-Facebook-2026-01.pdf',
      content: pdfBuffer,
    }],
  });

  if (result.success) {
    console.log('Email sent successfully!');
  } else {
    console.error('Email failed:', result.error);
  }

  // Close puppeteer
  const { closeBrowser } = require('../services/pdfService');
  await closeBrowser();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
