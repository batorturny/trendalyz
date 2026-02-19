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
                select: { provider: true },
              },
              // Users assigned to this company — they get the emails
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

    for (const company of admin.ownedCompanies) {
      const providers = company.connections.map(c => c.provider);
      if (providers.length === 0) continue;

      // Collect all recipients: company users + admin
      const recipientEmails = new Set();
      for (const user of company.users) {
        if (user.email) recipientEmails.add(user.email);
      }
      // Always include the admin too
      recipientEmails.add(admin.email);

      if (recipientEmails.size === 0) continue;

      for (const provider of providers) {
        try {
          // Try to get cached report data
          const cached = await prisma.reportCache.findUnique({
            where: {
              companyId_provider_month: {
                companyId: company.id,
                provider,
                month,
              },
            },
          });

          // Extract KPIs from cached data if available
          const kpis = [];
          if (cached?.jsonData?.data?.kpis) {
            for (const [label, value] of Object.entries(cached.jsonData.data.kpis)) {
              kpis.push({ label, value });
            }
          }

          const platformLabel = PLATFORM_LABELS[provider] || provider;

          // Build HTML and generate PDF (once per company/platform)
          const html = buildReportHtml({
            companyName: company.name,
            month,
            platformLabel,
            kpis,
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
