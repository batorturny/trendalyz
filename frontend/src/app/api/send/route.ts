import { EmailTemplate } from '@/components/email-template';
import { Resend } from 'resend';

export async function POST() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Trendalyz <noreply@trendalyz.hu>',
      to: ['bator.turny@gmail.com'],
      subject: 'Teszt email - Trendalyz',
      react: EmailTemplate({ firstName: 'Bátor' }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
