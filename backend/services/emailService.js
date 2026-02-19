// ============================================
// BACKEND EMAIL SERVICE (Resend)
// Supports attachments for PDF reports
// ============================================

const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'noreply@trendalyz.hu';

/**
 * Send an email with optional attachment.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {Array<{filename: string, content: Buffer}>} [opts.attachments]
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendEmailWithAttachment({ to, subject, html, attachments }) {
  if (!resend) {
    console.log(`\n[DEV EMAIL] → ${to}: ${subject}`);
    if (attachments?.length) {
      console.log(`  Attachments: ${attachments.map(a => a.filename).join(', ')}`);
    }
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Email küldés sikertelen';
    console.error('[EMAIL]', msg);
    return { success: false, error: msg };
  }
}

module.exports = { sendEmailWithAttachment };
