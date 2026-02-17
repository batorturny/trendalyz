import { proxyToExpress } from '@/lib/proxy';

export async function GET(req: Request) {
  return proxyToExpress(req, '/api/billing/usage', { requireAuth: true, requireAdmin: true });
}
