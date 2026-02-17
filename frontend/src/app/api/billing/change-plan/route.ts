import { proxyToExpress } from '@/lib/proxy';

export async function POST(req: Request) {
  return proxyToExpress(req, '/api/billing/change-plan', { requireAuth: true, requireAdmin: true });
}
