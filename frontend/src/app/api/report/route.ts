import { proxyToExpress } from '@/lib/proxy';

export async function POST(req: Request) {
  return proxyToExpress(req, '/api/report', {
    requireAuth: true,
    companyIdFromBody: 'companyId',
  });
}
