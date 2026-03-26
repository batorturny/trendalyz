import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

const DEV_EMAIL = 'bator@bildr.hu';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, page, url } = await req.json();

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  const userName = session.user.name || session.user.email || 'Admin';
  const userEmail = session.user.email || 'unknown';
  const timestamp = new Date().toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
  <div style="background:linear-gradient(135deg,#1a6b8a,#0d3b5e);padding:20px 24px;">
    <h1 style="color:#fff;font-size:18px;margin:0;">💡 Fejlesztési javaslat — Trendalyz</h1>
  </div>
  <div style="padding:24px;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:12px;font-weight:600;width:80px;">Feladó</td>
        <td style="padding:6px 12px;color:#0f172a;font-size:13px;">${escapeHtml(userName)} (${escapeHtml(userEmail)})</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:12px;font-weight:600;">Oldal</td>
        <td style="padding:6px 12px;color:#0f172a;font-size:13px;"><a href="${escapeHtml(url || '')}" style="color:#1a6b8a;">${escapeHtml(page || 'N/A')}</a></td>
      </tr>
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:12px;font-weight:600;">Idő</td>
        <td style="padding:6px 12px;color:#0f172a;font-size:13px;">${timestamp}</td>
      </tr>
    </table>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin-top:8px;">
      <p style="color:#0c4a6e;font-size:14px;margin:0;white-space:pre-wrap;line-height:1.6;">${escapeHtml(message.trim())}</p>
    </div>
  </div>
  <div style="padding:12px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="color:#94a3b8;font-size:10px;margin:0;">Trendalyz Admin Feedback</p>
  </div>
</div>
</body></html>`;

  await sendEmail({
    to: DEV_EMAIL,
    subject: `💡 Trendalyz feedback: ${escapeHtml(message.trim().slice(0, 60))}`,
    html,
  });

  return NextResponse.json({ ok: true });
}
