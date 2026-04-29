import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'noreply@trendalyz.hu';
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log(`\n📧 [DEV] Email → ${opts.to}: ${opts.subject}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Email küldés sikertelen';
    console.error('[EMAIL]', msg);
    return { success: false, error: msg };
  }
}

// ============================================
// BRAND DESIGN SYSTEM
// ============================================

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
  success: '#16a34a',
  white: '#ffffff',
};

// Inline SVG logo for email (base64 encoded)
const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="108" height="108" rx="8" fill="${BRAND.paleBlue}"/><rect x="18" y="62" width="24" height="40" rx="2" fill="${BRAND.lightBlue}"/><rect x="48" y="40" width="24" height="62" rx="2" fill="${BRAND.teal}"/><rect x="78" y="16" width="24" height="86" rx="2" fill="${BRAND.navy}"/><line x1="14" y1="98" x2="94" y2="22" stroke="white" stroke-width="7" stroke-linecap="round"/><polyline points="76,18 94,22 90,40" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;

function layout(content: string, preheader = ''): string {
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

function button(href: string, text: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.teal},${BRAND.navy});color:${BRAND.white};padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px;">${text}</a>
  </div>`;
}

function heading(text: string): string {
  return `<h2 style="color:${BRAND.text};font-size:22px;font-weight:700;margin:0 0 8px 0;">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="color:${BRAND.textSecondary};font-size:15px;line-height:1.6;margin:0 0 16px 0;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;">`;
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const names = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  return `${y}. ${names[parseInt(m) - 1]}`;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export function inviteWelcomeEmailHtml(companyName: string, email: string): string {
  const url = `${BASE_URL}/login`;
  return layout(`
    ${heading('Meghívást kaptál!')}
    ${paragraph(`A <strong>${escapeHtml(companyName)}</strong> cég meghívott, hogy a Trendalyz platformon megtekintsd a havi social media riportjaidat.`)}
    ${paragraph(`Az email címedhez (<strong>${escapeHtml(email)}</strong>) hozzá lett rendelve a fiókod. A belépéshez nem kell jelszót beállítanod — minden alkalommal egy egyszer használatos belépési linket küldünk az email címedre, amikor be akarsz lépni.`)}
    ${button(url, 'Belépés a Trendalyzbe')}
    <p style="color:${BRAND.textMuted};font-size:12px;text-align:center;">A belépő oldalon csak az email címedet kell megadni — utána egyetlen kattintással bent vagy.</p>
  `, `Meghívás a ${escapeHtml(companyName)} riportjaihoz — Trendalyz`);
}

export function resetPasswordEmailHtml(token: string): string {
  const url = `${BASE_URL}/set-password?token=${token}`;
  return layout(`
    ${heading('Jelszó visszaállítás')}
    ${paragraph('Jelszó-visszaállítási kérelmet kaptunk a Trendalyz fiókodhoz.')}
    ${paragraph('Kattints az alábbi gombra az új jelszó beállításához:')}
    ${button(url, 'Új jelszó beállítása')}
    <p style="color:${BRAND.textMuted};font-size:12px;text-align:center;">A link 1 órán belül lejár. Ha nem te kérted, nyugodtan figyelmen kívül hagyhatod.</p>
  `, 'Jelszó visszaállítás — Trendalyz');
}

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK_ORGANIC: 'TikTok',
  FACEBOOK_ORGANIC: 'Facebook',
  YOUTUBE: 'YouTube',
  TIKTOK_ADS: 'TikTok Ads',
  INSTAGRAM_ORGANIC: 'Instagram',
};

export function evaluationMessageEmailHtml(opts: {
  companyName: string;
  platform: string;
  month: string;
  message: string;
}): string {
  const monthLabel = fmtMonth(opts.month);
  const platformLabel = PLATFORM_LABELS[opts.platform] || opts.platform;
  const dashboardUrl = `${BASE_URL}/dashboard`;

  return layout(`
    ${heading('Új értékelést kaptál')}
    ${paragraph(`Az ügynökség írt egy új értékelést a(z) <strong>${escapeHtml(platformLabel)}</strong> teljesítményedről — ${monthLabel}.`)}

    <div style="background:${BRAND.bg};border-left:4px solid ${BRAND.teal};border-radius:8px;padding:20px;margin:20px 0;">
      <p style="color:${BRAND.text};font-size:15px;margin:0;white-space:pre-wrap;line-height:1.6;">${escapeHtml(opts.message)}</p>
    </div>

    ${paragraph('Reagálni az értékelésre, vagy a teljes riportot megnézni a felületen tudod:')}
    ${button(dashboardUrl, 'Megnyitás a Trendalyzben')}
    <p style="color:${BRAND.textMuted};font-size:12px;text-align:center;">Bejelentkezés után a megfelelő platform alatt találod az értékelést.</p>
  `, `Új értékelés — ${escapeHtml(opts.companyName)} — ${monthLabel}`);
}

export function evaluationReplyEmailHtml(opts: {
  companyName: string;
  platformLabel: string;
  month: string;
  clientReply: string;
  clientReaction: string | null;
}): string {
  const monthLabel = fmtMonth(opts.month);
  const reaction = opts.clientReaction ? `<span style="font-size:28px;display:block;margin-bottom:8px;">${opts.clientReaction}</span>` : '';

  return layout(`
    ${heading('💬 Ügyfél válaszolt')}
    ${paragraph(`<strong>${escapeHtml(opts.companyName)}</strong> reagált a(z) ${escapeHtml(opts.platformLabel)} — ${monthLabel} értékelésre.`)}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:20px 0;">
      ${reaction}
      <p style="color:#166534;font-size:15px;margin:0;white-space:pre-wrap;line-height:1.5;">${escapeHtml(opts.clientReply)}</p>
    </div>

    ${button(`${BASE_URL}/admin/evaluations`, 'Válaszok megtekintése')}
  `, `${escapeHtml(opts.companyName)} válaszolt — Trendalyz`);
}

export function scheduledReportEmailHtml(opts: {
  companyName: string;
  month: string;
  platforms: string[];
}): string {
  const monthLabel = fmtMonth(opts.month);

  const platformLabels: Record<string, string> = {
    TIKTOK_ORGANIC: 'TikTok',
    FACEBOOK_ORGANIC: 'Facebook',
    YOUTUBE: 'YouTube',
    TIKTOK_ADS: 'TikTok Ads',
    INSTAGRAM_ORGANIC: 'Instagram',
  };

  const platformList = opts.platforms
    .map(p => `<li style="color:${BRAND.textSecondary};font-size:14px;padding:4px 0;">📊 ${platformLabels[p] || p}</li>`)
    .join('');

  return layout(`
    ${heading(`Elkészült a ${monthLabel} riportod!`)}
    ${paragraph(`Kedves <strong>${escapeHtml(opts.companyName)}</strong>,`)}
    ${paragraph(`A(z) <strong>${monthLabel}</strong> havi social media riportod elkészült és megtekinthető a Trendalyz dashboardon.`)}

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:12px;padding:20px;margin:20px 0;">
      <p style="color:${BRAND.text};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px 0;">Elérhető platformok</p>
      <ul style="list-style:none;padding:0;margin:0;">
        ${platformList}
      </ul>
    </div>

    ${paragraph('Nézd meg a részletes chartokat, KPI-okat és videó teljesítményt:')}
    ${button(`${BASE_URL}/dashboard`, 'Riport megtekintése')}

    ${divider()}
    <p style="color:${BRAND.textMuted};font-size:12px;text-align:center;">
      Ez az automatikus értesítés a havi riport elkészültéről szól.<br>
      Ha kérdésed van, keress minket a dashboardon az értékelés felületen.
    </p>
  `, `${monthLabel} riportod elkészült — Trendalyz`);
}

interface ReportKPI {
  label: string;
  value: string | number;
}

export function reportEmailHtml(opts: {
  companyName: string;
  platformLabel: string;
  month: string;
  kpis: ReportKPI[];
  dashboardUrl?: string;
}): string {
  const monthLabel = fmtMonth(opts.month);

  const kpiRows = opts.kpis
    .filter(k => {
      const v = typeof k.value === 'number' ? k.value : parseFloat(String(k.value));
      return !isNaN(v) && v !== 0 || (typeof k.value === 'string' && k.value !== '0' && k.value !== 'NaN%');
    })
    .map(k => {
      const val = typeof k.value === 'number' ? k.value.toLocaleString('hu-HU') : k.value;
      return `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textSecondary};font-size:14px;">${k.label}</td>
          <td style="padding:10px 16px;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;font-weight:600;text-align:right;">${val}</td>
        </tr>
      `;
    })
    .join('');

  const dashUrl = opts.dashboardUrl || `${BASE_URL}/dashboard`;

  return layout(`
    ${heading(escapeHtml(opts.companyName))}
    ${paragraph(`${escapeHtml(opts.platformLabel)} riport — ${monthLabel}`)}

    <table style="width:100%;border-collapse:collapse;background:${BRAND.bg};border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:linear-gradient(135deg,${BRAND.teal},${BRAND.navy});">
          <th style="padding:12px 16px;text-align:left;color:white;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Metrika</th>
          <th style="padding:12px 16px;text-align:right;color:white;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Érték</th>
        </tr>
      </thead>
      <tbody>
        ${kpiRows}
      </tbody>
    </table>

    ${button(dashUrl, 'Teljes riport megtekintése')}
    <p style="color:${BRAND.textMuted};font-size:12px;text-align:center;">A részletes chartok és videóelemzés a dashboardon érhető el.</p>
  `, `${escapeHtml(opts.companyName)} — ${escapeHtml(opts.platformLabel)} ${monthLabel} riport`);
}
