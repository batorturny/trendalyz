import { proxyToExpress } from '@/lib/proxy';

export async function POST(req: Request) {
  return proxyToExpress(req, '/api/billing/portal', { requireAuth: true, requireAdmin: true });
}
