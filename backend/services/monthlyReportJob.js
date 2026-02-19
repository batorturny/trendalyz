// ============================================
// MONTHLY REPORT EMAIL JOB
// Sends PDF report emails to GROWTH+ users
// Runs on the 3rd of every month at 8:00 AM
// ============================================

const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { canUseFeature } = require('../config/plans');
const { generateReportPdf } = require('./pdfService');
const { buildReportHtml } = require('./reportTemplate');
const { sendEmailWithAttachment } = require('./emailService');
const { getWindsorApiKey } = require('./adminKeyService');
const WindsorService = require('./windsor');
const { WindsorMultiPlatform } = require('./windsorMultiPlatform');
const { processReport } = require('./report');

/**
 * Get previous month in YYYY-MM format.
 */
function getPreviousMonth() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Build a simple email body wrapping the PDF attachment.
 */
function buildEmailBody(companyName, platformLabel, monthLabel) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 24px 32px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Trendalyz</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 8px 0;">${companyName}</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0;">${platformLabel} havi riport — ${monthLabel}</p>
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
  `;
}

const MONTH_NAMES = [
  'január', 'február', 'március', 'április', 'május', 'június',
  'július', 'augusztus', 'szeptember', 'október', 'november', 'december',
];

/**
 * Calculate date range for a given YYYY-MM month string.
 */
function getMonthDateRange(month) {
  const [year, monthNum] = month.split('-').map(Number);
  const dateFrom = `${year}-${String(monthNum).padStart(2, '0')}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const dateTo = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
  return { dateFrom, dateTo, year, monthNum };
}

/**
 * Fetch Windsor data live and build KPIs for TikTok Organic.
 * Mirrors the logic in scripts/sendRealReport.js.
 */
async function fetchTikTokKpis(windsorApiKey, accountId, month) {
  const { dateFrom, dateTo, year, monthNum } = getMonthDateRange(month);

  // Previous month range
  const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
  const prevYear = monthNum === 1 ? year - 1 : year;
  const prevDateFrom = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevDateTo = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${prevLastDay}`;

  const windsor = new WindsorService(windsorApiKey);
  const [currentData, prevData] = await Promise.all([
    windsor.fetchAllData(accountId, dateFrom, dateTo),
    windsor.fetchAllData(accountId, prevDateFrom, prevDateTo),
  ]);

  const reportData = processReport(currentData, prevData);
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

  const topVideos = reportData.video.videos
    .slice()
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .map(v => ({
      title: v.embedUrl ? v.embedUrl.split('/').pop()?.split('?')[0] || 'Videó' : 'Videó',
      views: v.views,
      likes: v.likes,
    }));

  const dailyMetrics = reportData.daily.chartLabels.map((label, i) => ({
    date: label,
    'Like': reportData.daily.likesData[i] || 0,
    'Komment': reportData.daily.commentsData[i] || 0,
    'Megosztás': reportData.daily.sharesData[i] || 0,
    'Profilnézet': reportData.daily.profileViewsData[i] || 0,
  }));

  return { kpis, topVideos, dailyMetrics };
}

/**
 * Fetch Windsor data live and build generic KPIs for non-TikTok platforms.
 */
async function fetchGenericKpis(windsorApiKey, provider, accountId, month) {
  const { dateFrom, dateTo } = getMonthDateRange(month);
  const multi = new WindsorMultiPlatform(windsorApiKey);
  const daily = await multi.fetchDailyMetrics(provider, accountId, dateFrom, dateTo);

  if (!daily || daily.length === 0) return { kpis: [], topVideos: [], dailyMetrics: [] };

  // Sum up all numeric fields from the daily data as KPIs
  const sums = {};
  for (const row of daily) {
    for (const [key, val] of Object.entries(row)) {
      if (key === 'date') continue;
      const n = Number(val);
      if (Number.isFinite(n)) {
        sums[key] = (sums[key] || 0) + n;
      }
    }
  }

  const FIELD_LABELS = {
    impressions: 'Megjelenítések', reach: 'Elérés', engaged_users: 'Aktív felhasználók',
    page_fans: 'Oldal kedvelők', page_views_total: 'Oldal nézetek', reactions: 'Reakciók',
    comments: 'Kommentek', shares: 'Megosztások', follower_count: 'Követők',
    profile_views: 'Profilnézetek', website_clicks: 'Weboldal kattintások',
    views: 'Megtekintések', likes: 'Like-ok', subscribers_gained: 'Új feliratkozók',
    subscribers_lost: 'Feliratkozás lemondás', estimated_minutes_watched: 'Nézési idő (perc)',
    spend: 'Költés', clicks: 'Kattintások', conversions: 'Konverziók',
    profile_followers_count: 'Követők', profile_media_count: 'Posztok száma',
  };

  const kpis = Object.entries(sums)
    .filter(([key]) => FIELD_LABELS[key])
    .map(([key, value]) => ({ label: FIELD_LABELS[key], value: Math.round(value) }));

  return { kpis, topVideos: [], dailyMetrics: [] };
}

/**
 * Run the monthly report job for all eligible users.
 */
async function runMonthlyReports() {
  const month = getPreviousMonth();
  const [year, monthNum] = month.split('-');
  const monthLabel = `${year}. ${MONTH_NAMES[parseInt(monthNum) - 1]}`;

  console.log(`[MonthlyReport] Starting for month: ${month}`);

  // Find all admins with GROWTH+ subscriptions that are active
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ['ACTIVE', 'TRIALING'] },
      tier: { in: ['GROWTH', 'PROFESSIONAL', 'ENTERPRISE'] },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          ownedCompanies: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              name: true,
              connections: {
                select: { provider: true, externalAccountId: true },
              },
              users: {
                select: { email: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  console.log(`[MonthlyReport] Found ${subscriptions.length} eligible admins`);

  const PLATFORM_LABELS = {
    TIKTOK_ORGANIC: 'TikTok',
    FACEBOOK_ORGANIC: 'Facebook',
    INSTAGRAM_ORGANIC: 'Instagram',
    INSTAGRAM_PUBLIC: 'Instagram Public',
    YOUTUBE: 'YouTube',
  };

  let sent = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    const admin = sub.user;
    if (!admin || !admin.ownedCompanies?.length) continue;

    if (!canUseFeature(sub.tier, 'monthly_email_reports')) continue;

    // Resolve Windsor API key for this admin (once per admin)
    let windsorApiKey;
    try {
      windsorApiKey = await getWindsorApiKey(admin.id);
    } catch (keyErr) {
      console.warn(`[MonthlyReport] No Windsor API key for admin ${admin.email}, skipping`);
      continue;
    }

    for (const company of admin.ownedCompanies) {
      if (company.connections.length === 0) continue;

      // Collect all recipients: company users + admin
      const recipientEmails = new Set();
      for (const user of company.users) {
        if (user.email) recipientEmails.add(user.email);
      }
      recipientEmails.add(admin.email);

      if (recipientEmails.size === 0) continue;

      for (const conn of company.connections) {
        const provider = conn.provider;
        const accountId = conn.externalAccountId;
        if (!accountId) continue;

        try {
          const platformLabel = PLATFORM_LABELS[provider] || provider;

          // 1. Try cache first
          const cached = await prisma.reportCache.findUnique({
            where: {
              companyId_provider_month: {
                companyId: company.id,
                provider,
                month,
              },
            },
          });

          let kpis = [];
          let topVideos = [];
          let dailyMetrics = [];

          if (cached?.jsonData?.data?.kpis) {
            // Use cached KPIs
            for (const [label, value] of Object.entries(cached.jsonData.data.kpis)) {
              kpis.push({ label, value });
            }
            console.log(`[MonthlyReport] Using cache for ${company.name} / ${platformLabel}`);
          } else {
            // 2. No cache — fetch live from Windsor
            console.log(`[MonthlyReport] No cache, fetching live: ${company.name} / ${platformLabel} / ${accountId}`);
            try {
              if (provider === 'TIKTOK_ORGANIC') {
                const result = await fetchTikTokKpis(windsorApiKey, accountId, month);
                kpis = result.kpis;
                topVideos = result.topVideos;
                dailyMetrics = result.dailyMetrics;
              } else {
                const result = await fetchGenericKpis(windsorApiKey, provider, accountId, month);
                kpis = result.kpis;
              }
            } catch (fetchErr) {
              console.error(`[MonthlyReport] Windsor fetch failed for ${company.name} (${platformLabel}):`, fetchErr.message);
              // Continue with empty KPIs — still send email with what we have
            }
          }

          if (kpis.length === 0) {
            console.warn(`[MonthlyReport] No data for ${company.name} / ${platformLabel}, skipping`);
            continue;
          }

          // Build HTML and generate PDF
          const html = buildReportHtml({
            companyName: company.name,
            month,
            platformLabel,
            kpis,
            dailyMetrics: dailyMetrics.length > 0 ? dailyMetrics : undefined,
            topVideos: topVideos.length > 0 ? topVideos : undefined,
          });

          const pdfBuffer = await generateReportPdf(html);

          // Send to each recipient
          for (const email of recipientEmails) {
            try {
              const emailResult = await sendEmailWithAttachment({
                to: email,
                subject: `${platformLabel} havi riport — ${company.name} — ${monthLabel}`,
                html: buildEmailBody(company.name, platformLabel, monthLabel),
                attachments: [{
                  filename: `${company.name}-${platformLabel}-${month}.pdf`,
                  content: pdfBuffer,
                }],
              });

              if (emailResult.success) {
                sent++;
                console.log(`[MonthlyReport] Sent: ${email} / ${company.name} / ${platformLabel}`);
              } else {
                errors++;
                console.error(`[MonthlyReport] Failed: ${email} / ${company.name}: ${emailResult.error}`);
              }
            } catch (emailErr) {
              errors++;
              console.error(`[MonthlyReport] Email error for ${email}:`, emailErr.message);
            }
          }
        } catch (err) {
          errors++;
          console.error(`[MonthlyReport] Error for ${company.name} (${provider}):`, err.message);
        }
      }
    }
  }

  console.log(`[MonthlyReport] Complete. Sent: ${sent}, Errors: ${errors}`);
  return { sent, errors };
}

/**
 * Start the cron job: 3rd of every month at 8:00 AM.
 */
function startMonthlyReportJob() {
  cron.schedule('0 8 3 * *', async () => {
    console.log('[MonthlyReport] Cron triggered');
    try {
      await runMonthlyReports();
    } catch (err) {
      console.error('[MonthlyReport] Job failed:', err);
    }
  });

  console.log('Monthly report cron job registered (3rd of month, 8:00 AM)');
}

module.exports = { startMonthlyReportJob, runMonthlyReports };
