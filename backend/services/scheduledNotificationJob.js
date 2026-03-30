// ============================================
// SCHEDULED REPORT NOTIFICATION JOB
// Lightweight cron: sends "your report is ready" emails
// No PDF generation, no Windsor API calls
// Runs hourly, matches company emailDay/emailHour (UTC)
// ============================================

const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { buildScheduledReportEmail, sendReportNotification } = require('./scheduledEmailService');

/**
 * Get previous month in YYYY-MM format.
 */
function getPreviousMonth() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Run the scheduled notification check.
 * Finds companies whose emailDay/emailHour match the current UTC time
 * and sends notification emails to all CLIENT users.
 */
async function runScheduledNotifications({ currentDay, currentHour } = {}) {
  const now = new Date();
  const day = currentDay ?? now.getUTCDate();
  const hour = currentHour ?? now.getUTCHours();
  const month = getPreviousMonth();

  console.log(`[ScheduledNotify] Checking: day=${day}, hour=${hour}, month=${month}`);

  const companies = await prisma.company.findMany({
    where: {
      status: 'ACTIVE',
      emailDay: day,
      emailHour: hour,
    },
    include: {
      users: {
        where: { role: 'CLIENT' },
        select: { email: true, name: true },
      },
      connections: {
        where: { status: 'CONNECTED' },
        select: { provider: true },
      },
    },
  });

  if (companies.length === 0) {
    console.log('[ScheduledNotify] No companies matched schedule');
    return { sent: 0, errors: 0 };
  }

  console.log(`[ScheduledNotify] ${companies.length} companies matched`);

  let sent = 0;
  let errors = 0;

  for (const company of companies) {
    // Deduplicate providers (a company may have multiple accounts on same platform)
    const platforms = [...new Set(company.connections.map(c => c.provider))];
    if (platforms.length === 0) continue;

    const html = buildScheduledReportEmail(company.name, month, platforms);
    const subject = `\u{1F4CA} ${company.name} — Havi riportod elkészült`;

    for (const user of company.users) {
      if (!user.email) continue;

      try {
        const result = await sendReportNotification({
          to: user.email,
          subject,
          html,
        });

        if (result.success) {
          sent++;
          console.log(`[ScheduledNotify] Sent to ${user.email} (${company.name})`);
        } else {
          errors++;
          console.error(`[ScheduledNotify] Failed: ${user.email}: ${result.error}`);
        }
      } catch (err) {
        errors++;
        console.error(`[ScheduledNotify] Error sending to ${user.email}:`, err.message);
      }
    }
  }

  console.log(`[ScheduledNotify] Done. Sent: ${sent}, Errors: ${errors}`);
  return { sent, errors };
}

/**
 * Register the hourly cron job.
 */
function startScheduledNotificationJob() {
  cron.schedule('0 * * * *', async () => {
    try {
      await runScheduledNotifications();
    } catch (err) {
      console.error('[ScheduledNotify] Job failed:', err);
    }
  });

  console.log('[ScheduledNotify] Cron job registered (hourly, per-company schedule)');
}

module.exports = { startScheduledNotificationJob, runScheduledNotifications };
