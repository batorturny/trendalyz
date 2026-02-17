import { NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:4000';

export async function POST(req: Request) {
  try {
    const body = await req.arrayBuffer();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const response = await fetch(`${EXPRESS_API_URL}/api/billing/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': sig,
      },
      body: Buffer.from(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Webhook proxy error:', error);
    return NextResponse.json({ error: 'Webhook proxy failed' }, { status: 502 });
  }
}
