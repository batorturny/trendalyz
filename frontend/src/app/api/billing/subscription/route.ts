import { proxyToExpress } from '@/lib/proxy';

export async function GET(req: Request) {
  return proxyToExpress(req, '/api/billing/subscription', { requireAuth: true, requireAdmin: true });
}
