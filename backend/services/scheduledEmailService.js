// ============================================
// SCHEDULED REPORT NOTIFICATION EMAIL
// Branded HTML template — no PDF, just dashboard link
// Mirrors frontend/src/lib/email.ts design system
// ============================================

const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'noreply@trendalyz.hu';
const BASE_URL = process.env.NEXTAUTH_URL || 'https://trendalyz.hu';

// Brand colors (synced with frontend email.ts)
const BRAND = {
  navy: '#0d3b5e',
  teal: '#1a6b8a',
  lightBlue: '#8ec8d8',
  paleBlue: '#b8dce8',
  bg: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  white: '#ffffff',
};

const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="108" height="108" rx="8" fill="${BRAND.paleBlue}"/><rect x="18" y="62" width="24" height="40" rx="2" fill="${BRAND.lightBlue}"/><rect x="48" y="40" width="24" height="62" rx="2" fill="${BRAND.teal}"/><rect x="78" y="16" width="24" height="86" rx="2" fill="${BRAND.navy}"/><line x1="14" y1="98" x2="94" y2="22" stroke="white" stroke-width="7" stroke-linecap="round"/><polyline points="76,18 94,22 90,40" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;

const MONTH_NAMES = [
  'január', 'február', 'március', 'április', 'május', 'június',
  'július', 'augusztus', 'szeptember', 'október', 'november', 'december',
];

const PLATFORM_LABELS = {
  TIKTOK_ORGANIC: 'TikTok',
  FACEBOOK_ORGANIC: 'Facebook',
  INSTAGRAM_ORGANIC: 'Instagram',
  YOUTUBE: 'YouTube',
  TIKTOK_ADS: 'TikTok Ads',
};

/**
 * Format YYYY-MM to Hungarian month label (e.g. "2026. február").
 */
function fmtMonth(ym) {
  const [y, m] = ym.split('-');
  return `${y}. ${MONTH_NAMES[parseInt(m) - 1]}`;
}

/**
 * Wrap content in the branded Trendalyz email layout.
 */
function layout(content, preheader = '') {
  return `<!DOCTYPE html>
<html lang="hu">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:${BRAND.white};border-radius:16px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,${BRAND.teal},${BRAND.navy});padding:28px 32px;text-align:center;">
    <div style="display:inline-block;vertical-align:middle;">
      ${LOGO_SVG}
    </div>
    <span style="display:inline-block;vertical-align:middle;margin-left:12px;">
      <span style="color:${BRAND.white};font-size:26px;font-weight:800;letter-spacing:-0.5px;">TREND</span><span style="color:${BRAND.lightBlue};font-size:26px;font-weight:800;letter-spacing:-0.5px;">ALYZ</span>
    </span>
    <p style="color:${BRAND.paleBlue};font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin:6px 0 0 0;">Data Analytics Solutions</p>
  </div>

  <!-- Content -->
  <div style="padding:32px;">
    ${content}
  </div>

  <!-- Footer -->
  <div style="padding:20px 32px;background:${BRAND.bg};border-top:1px solid ${BRAND.border};text-align:center;">
    <p style="color:${BRAND.textMuted};font-size:11px;margin:0 0 4px 0;">
      Ez az email a Trendalyz rendszerből érkezett.
    </p>
    <p style="color:${BRAND.textMuted};font-size:11px;margin:0;">
      &copy; ${new Date().getFullYear()} Trendalyz — Data Analytics Solutions
    </p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Build the scheduled report notification email HTML.
 * @param {string} companyName
 * @param {string} month - YYYY-MM format
 * @param {string[]} platforms - e.g. ['TIKTOK_ORGANIC', 'YOUTUBE']
 * @returns {string} Full HTML email
 */
function buildScheduledReportEmail(companyName, month, platforms) {
  const monthLabel = fmtMonth(month);

  const platformList = platforms
    .map(p => `<li style="color:${BRAND.textSecondary};font-size:14px;padding:4px 0;">&#128202; ${PLATFORM_LABELS[p] || p}</li>`)
    .join('');

  const dashboardUrl = `${BASE_URL}/dashboard`;

  const content = `
    <h2 style="color:${BRAND.text};font-size:22px;font-weight:700;margin:0 0 8px 0;">Elkészült a ${monthLabel} riportod!</h2>
    <p style="color:${BRAND.textSecondary};font-size:15px;line-height:1.6;margin:0 0 16px 0;">Kedves <strong>${companyName}</strong>,</p>
    <p style="color:${BRAND.textSecondary};font-size:15px;line-height:1.6;margin:0 0 16px 0;">A(z) <strong>${monthLabel}</strong> havi social media riportod elkészült és megtekinthető a Trendalyz dashboardon.</p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:12px;padding:20px;margin:20px 0;">
      <p style="color:${BRAND.text};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px 0;">Elérhető platformok</p>
      <ul style="list-style:none;padding:0;margin:0;">
        ${platformList}
      </ul>
    </div>

    <p style="color:${BRAND.textSecondary};font-size:15px;line-height:1.6;margin:0 0 16px 0;">Nézd meg a részletes chartokat, KPI-okat és videó teljesítményt:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.teal},${BRAND.navy});color:${BRAND.white};padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px;">Riport megtekintése</a>
    </div>

    <hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;">
    <p style="color:${BRAND.textMuted};font-size:12px;text-align:center;">
      Ez az automatikus értesítés a havi riport elkészültéről szól.<br>
      Ha kérdésed van, keress minket a dashboardon az értékelés felületen.
    </p>`;

  return layout(content, `${monthLabel} riportod elkészült — Trendalyz`);
}

/**
 * Send a plain email (no attachment) via Resend.
 * Falls back to console.log in dev mode (no RESEND_API_KEY).
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendReportNotification({ to, subject, html }) {
  if (!resend) {
    console.log(`\n[DEV EMAIL] → ${to}: ${subject}`);
    return { success: true };
  }

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Email küldés sikertelen';
    console.error('[SCHEDULED-EMAIL]', msg);
    return { success: false, error: msg };
  }
}

module.exports = { buildScheduledReportEmail, sendReportNotification };
