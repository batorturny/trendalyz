#!/usr/bin/env node
// ============================================
// SEND A REAL REPORT EMAIL WITH LIVE DATA
// Usage: node scripts/sendRealReport.js <companyName> <month> <email>
// Example: node scripts/sendRealReport.js "CAP. Marketing" 2026-01 bator.turny@gmail.com
// ============================================

require('dotenv').config();

const prisma = require('../lib/prisma');
const WindsorService = require('../services/windsor');
const { processReport } = require('../services/report');
const { generateReportPdf, closeBrowser } = require('../services/pdfService');
const { buildReportHtml } = require('../services/reportTemplate');
const { sendEmailWithAttachment } = require('../services/emailService');

const companySearch = process.argv[2];
const month = process.argv[3];
const email = process.argv[4];

if (!companySearch || !month || !email) {
  console.error('Usage: node scripts/sendRealReport.js <companyName> <month> <email>');
  console.error('Example: node scripts/sendRealReport.js "CAP" 2026-01 bator.turny@gmail.com');
  process.exit(1);
}

async function main() {
  // 1. Find company
  const company = await prisma.company.findFirst({
    where: { name: { contains: companySearch, mode: 'insensitive' } },
    include: {
      connections: { select: { provider: true, externalAccountId: true } },
    },
  });

  if (!company) {
    console.error(`Company not found: "${companySearch}"`);
    process.exit(1);
  }

  console.log(`Company: ${company.name} (${company.id})`);
  console.log(`Connections: ${company.connections.map(c => `${c.provider}: ${c.externalAccountId}`).join(', ')}`);

  // 2. Get TikTok account ID
  const tiktokConn = company.connections.find(c => c.provider === 'TIKTOK_ORGANIC');
  const tiktokAccountId = tiktokConn?.externalAccountId || company.tiktokAccountId;

  if (!tiktokAccountId) {
    console.error('No TikTok account ID found for this company');
    process.exit(1);
  }

  // 3. Calculate date range
  const [year, monthNum] = month.split('-').map(Number);
  const dateFrom = `${year}-${String(monthNum).padStart(2, '0')}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const dateTo = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`;

  // Previous month
  const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
  const prevYear = monthNum === 1 ? year - 1 : year;
  const prevDateFrom = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevDateTo = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${prevLastDay}`;

  console.log(`\nFetching data: ${dateFrom} → ${dateTo}`);

  // 4. Fetch data from Windsor
  const windsor = new WindsorService(process.env.WINDSOR_API_KEY);

  const [currentData, prevData] = await Promise.all([
    windsor.fetchAllData(tiktokAccountId, dateFrom, dateTo),
    windsor.fetchAllData(tiktokAccountId, prevDateFrom, prevDateTo),
  ]);

  console.log(`Current month: ${currentData.daily?.length || 0} daily rows, ${currentData.video?.length || 0} video rows`);
  console.log(`Previous month: ${prevData.daily?.length || 0} daily rows, ${prevData.video?.length || 0} video rows`);

  // 5. Process report
  const reportData = processReport(currentData, prevData);

  // 6. Extract KPIs for PDF
  const dt = reportData.daily.totals;
  const vt = reportData.video.totals;

  const kpis = [
    { label: 'Követők', value: dt.currentFollowers },
    { label: 'Új követők', value: dt.totalNewFollowers },
    { label: 'Megtekintések', value: vt.totalViews },
    { label: 'Elérés', value: vt.totalReach },
    { label: 'Like-ok', value: dt.totalLikes },
    { label: 'Kommentek', value: dt.totalComments },
    { label: 'Megosztások', value: dt.totalShares },
    { label: 'Profilnézetek', value: dt.totalProfileViews },
    { label: 'Videók száma', value: vt.videoCount },
    { label: 'Átl. ER%', value: `${vt.avgEngagement.toFixed(2)}%` },
    { label: 'Átl. teljes nézés%', value: `${vt.avgFullWatchRate.toFixed(1)}%` },
    { label: 'Össz. nézési idő', value: vt.totalWatchTimeFormatted },
  ];

  console.log('\nKPIs:');
  kpis.forEach(k => console.log(`  ${k.label}: ${k.value}`));

  // 7. Extract top videos for PDF
  const topVideos = reportData.video.videos
    .slice()
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .map(v => ({
      title: v.embedUrl ? v.embedUrl.split('/').pop()?.split('?')[0] || `Videó` : 'Videó',
      views: v.views,
      likes: v.likes,
    }));

  // 8. Build daily metrics for PDF
  const dailyMetrics = reportData.daily.chartLabels.map((label, i) => ({
    date: label,
    'Like': reportData.daily.likesData[i] || 0,
    'Komment': reportData.daily.commentsData[i] || 0,
    'Megosztás': reportData.daily.sharesData[i] || 0,
    'Profilnézet': reportData.daily.profileViewsData[i] || 0,
  }));

  // 9. Generate PDF
  console.log('\nGenerating PDF...');
  const html = buildReportHtml({
    companyName: company.name,
    month,
    platformLabel: 'TikTok',
    kpis,
    dailyMetrics,
    topVideos,
  });

  const pdfBuffer = await generateReportPdf(html);
  console.log(`PDF generated: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  // 10. Send email
  const MONTH_NAMES = ['január', 'február', 'március', 'április', 'május', 'június',
    'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  const monthLabel = `${year}. ${MONTH_NAMES[monthNum - 1]}`;

  console.log(`Sending to ${email}...`);
  const result = await sendEmailWithAttachment({
    to: email,
    subject: `TikTok havi riport — ${company.name} — ${monthLabel}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Trendalyz</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 8px 0;">${company.name}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0;">TikTok havi riport — ${monthLabel}</p>
          <p style="color: #334155; font-size: 15px;">Mellékletben találod a részletes PDF riportot.</p>
          <p style="color: #334155; font-size: 15px; margin-top: 12px;">Ha részletesebben szeretnéd megnézni a riportot, lépj fel az oldalunkra, ahol a többi hónapodat is meg tudod nézni interaktív chartokkal.</p>
          <div style="text-align: center; margin: 28px 0 8px 0;">
            <a href="https://trendalyz.hu/dashboard" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #22c55e); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">Részletes riport megtekintése</a>
          </div>
        </div>
        <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            Trendalyz &copy; ${new Date().getFullYear()}
          </p>
        </div>
      </div>
    `,
    attachments: [{
      filename: `${company.name}-TikTok-${month}.pdf`,
      content: pdfBuffer,
    }],
  });

  if (result.success) {
    console.log('\nEmail sent successfully!');
  } else {
    console.error('\nEmail failed:', result.error);
  }

  await closeBrowser();
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
