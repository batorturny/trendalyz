import { chartCatalog, getCatalogByCategory } from '@/lib/chartCatalog';
import { NextResponse } from 'next/server';

export async function GET() {
  const byCategory = getCatalogByCategory();
  return NextResponse.json({
    total: chartCatalog.length,
    categories: Object.keys(byCategory),
    charts: chartCatalog.map(c => ({
      key: c.key,
      title: c.title,
      description: c.description,
      type: c.type,
      category: c.category,
      color: c.color,
      platform: c.platform || 'TIKTOK_ORGANIC'
    })),
    byCategory
  });
}
