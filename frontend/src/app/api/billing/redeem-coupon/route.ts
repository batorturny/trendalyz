import { proxyToExpress } from '@/lib/proxy';

export async function POST(req: Request) {
  return proxyToExpress(req, '/api/billing/redeem-coupon', { requireAuth: true, requireAdmin: true });
}
