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
// EMAIL TEMPLATES
// ============================================

function layout(content: string): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1a6b8a, #0d3b5e); padding: 24px 32px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">📈 Trendalyz</h1>
      </div>
      <div style="padding: 32px;">
        ${content}
      </div>
      <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">
          Ez az email a Trendalyz rendszerből érkezett. &copy; ${new Date().getFullYear()} Trendalyz
        </p>
      </div>
    </div>
  `;
}

function button(href: string, text: string): string {
  return `<a href="${href}" style="display: inline-block; background: linear-gradient(to right, #1a6b8a, #0d3b5e); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">${text}</a>`;
}

export function inviteEmailHtml(companyName: string, token: string): string {
  const url = `${BASE_URL}/set-password?token=${token}`;
  return layout(`
    <p style="color: #334155; font-size: 15px;">Meghívást kaptál a <strong>${companyName}</strong> cég riportjainak megtekintéséhez.</p>
    <p style="color: #334155; font-size: 15px;">Kattints az alábbi gombra a jelszavad beállításához:</p>
    <div style="text-align: center; margin: 24px 0;">
      ${button(url, 'Jelszó beállítása')}
    </div>
    <p style="color: #94a3b8; font-size: 12px;">Ez a link 24 órán belül lejár.</p>
  `);
}

export function resetPasswordEmailHtml(token: string): string {
  const url = `${BASE_URL}/set-password?token=${token}`;
  return layout(`
    <p style="color: #334155; font-size: 15px;">Jelszó-visszaállítási kérelmet kaptunk a fiókodhoz.</p>
    <p style="color: #334155; font-size: 15px;">Kattints az alábbi gombra az új jelszó beállításához:</p>
    <div style="text-align: center; margin: 24px 0;">
      ${button(url, 'Új jelszó beállítása')}
    </div>
    <p style="color: #94a3b8; font-size: 12px;">A link 1 órán belül lejár. Ha nem te kérted, nyugodtan figyelmen kívül hagyhatod.</p>
  `);
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
  const kpiRows = opts.kpis
    .filter(k => {
      const v = typeof k.value === 'number' ? k.value : parseFloat(String(k.value));
      return !isNaN(v) && v !== 0 || (typeof k.value === 'string' && k.value !== '0' && k.value !== 'NaN%');
    })
    .map(k => {
      const val = typeof k.value === 'number' ? k.value.toLocaleString('hu-HU') : k.value;
      return `
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">${k.label}</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${val}</td>
        </tr>
      `;
    })
    .join('');

  const dashUrl = opts.dashboardUrl || `${BASE_URL}/dashboard`;

  // Format month nicely (2026-01 → 2026 január)
  const [year, monthNum] = opts.month.split('-');
  const monthNames = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  const monthLabel = `${year}. ${monthNames[parseInt(monthNum) - 1]}`;

  return layout(`
    <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 4px 0;">${opts.companyName}</h2>
    <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">${opts.platformLabel} riport — ${monthLabel}</p>

    <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 12px; overflow: hidden;">
      <thead>
        <tr style="background: linear-gradient(135deg, #1a6b8a, #0d3b5e);">
          <th style="padding: 12px 16px; text-align: left; color: white; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Metrika</th>
          <th style="padding: 12px 16px; text-align: right; color: white; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Érték</th>
        </tr>
      </thead>
      <tbody>
        ${kpiRows}
      </tbody>
    </table>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      ${button(dashUrl, 'Teljes riport megtekintése')}
    </div>
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">A részletes chartok és videóelemzés a dashboardon érhető el.</p>
  `);
}
