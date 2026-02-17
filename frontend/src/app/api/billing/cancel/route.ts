import { proxyToExpress } from '@/lib/proxy';

export async function POST(req: Request) {
  return proxyToExpress(req, '/api/billing/cancel', { requireAuth: true, requireAdmin: true });
}
