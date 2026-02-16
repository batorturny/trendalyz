import { proxyToExpress } from '@/lib/proxy';

export async function GET(req: Request) {
  return proxyToExpress(req, '/api/charts/catalog');
}
