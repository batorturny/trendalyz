import { proxyToExpress } from '@/lib/proxy';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider') || '';
  return proxyToExpress(
    req,
    `/api/windsor/discover-accounts?provider=${encodeURIComponent(provider)}`,
    { requireAuth: true, requireAdmin: true }
  );
}
