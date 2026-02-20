import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { NextResponse } from 'next/server';

const REPORT_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const WINDSOR_BASE = 'https://connectors.windsor.ai';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { companyId, month, forceRefresh } = await req.json();

    if (!companyId || !month) {
      return NextResponse.json({ error: 'companyId and month are required' }, { status: 400 });
    }

    // Access check
    if (session.user.role !== 'ADMIN' && session.user.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, tiktokAccountId: true, adminId: true },
    });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check DB cache first
    if (!forceRefresh) {
      const cached = await prisma.reportCache.findUnique({
        where: {
          companyId_provider_month: {
            companyId,
            provider: 'TIKTOK_ORGANIC',
            month,
          },
        },
      });

      if (cached && (Date.now() - cached.cachedAt.getTime()) < REPORT_CACHE_MAX_AGE_MS) {
        return NextResponse.json({
          ...(cached.jsonData as object),
          cached: true,
          cachedAt: cached.cachedAt.toISOString(),
        });
      }
    }

    // No cache — fetch from Windsor directly
    // Resolve TikTok account ID
    let tiktokAccountId = company.tiktokAccountId;
    if (!tiktokAccountId) {
      const conn = await prisma.integrationConnection.findFirst({
        where: { companyId, provider: 'TIKTOK_ORGANIC' },
        select: { externalAccountId: true },
      });
      tiktokAccountId = conn?.externalAccountId || null;
    }

    if (!tiktokAccountId) {
      return NextResponse.json({ error: 'No TikTok account connected' }, { status: 400 });
    }

    // Get Windsor API key
    const adminId = session.user.role === 'ADMIN' ? session.user.id : company.adminId;
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId! },
      select: { windsorApiKeyEnc: true },
    });

    if (!adminUser?.windsorApiKeyEnc) {
      return NextResponse.json({ error: 'Windsor API key not configured' }, { status: 400 });
    }

    const windsorApiKey = decrypt(adminUser.windsorApiKeyEnc);

    // Calculate date ranges
    const [year, monthNum] = month.split('-').map(Number);
    const dateFrom = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const dateTo = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`;

    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? year - 1 : year;
    const prevDateFrom = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevDateTo = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${prevLastDay}`;

    // Fetch from Windsor
    const fields = 'date,followers_count,new_followers,profile_views,likes,comments,shares,video_views,video_id,video_title,video_duration,video_description,reach,full_video_watched_rate,total_time_watched,average_time_watched,embed_link';
    const selectAccounts = `&select_accounts=${tiktokAccountId}`;

    async function fetchWindsor(from: string, to: string) {
      const url = `${WINDSOR_BASE}/tiktok_organic?api_key=${windsorApiKey}&date_from=${from}&date_to=${to}&fields=${fields}${selectAccounts}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`Windsor API error: ${res.status}`);
      const raw = await res.json();
      return Array.isArray(raw) ? (raw[0]?.data || []) : (raw?.data || []);
    }

    const [currentRows, prevRows] = await Promise.all([
      fetchWindsor(dateFrom, dateTo),
      fetchWindsor(prevDateFrom, prevDateTo),
    ]);

    // Process report data (simplified version matching backend processReport)
    const reportData = processReportData(currentRows, prevRows);

    const responseData = {
      company: { id: company.id, name: company.name },
      month: { year, month: monthNum, label: `${year}. ${String(monthNum).padStart(2, '0')}.` },
      dateRange: { from: dateFrom, to: dateTo },
      data: reportData,
    };

    // Store in DB cache
    prisma.reportCache.upsert({
      where: {
        companyId_provider_month: { companyId, provider: 'TIKTOK_ORGANIC', month },
      },
      update: { jsonData: responseData, cachedAt: new Date() },
      create: { companyId, provider: 'TIKTOK_ORGANIC', month, jsonData: responseData },
    }).catch(err => console.error('[Cache] Failed to store:', err.message));

    return NextResponse.json({ ...responseData, cached: false });
  } catch (error) {
    console.error('Report generation error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate report', details: msg }, { status: 500 });
  }
}

// ============================================
// REPORT PROCESSING (mirrors backend/services/report.js)
// ============================================

interface WindsorRow {
  date?: string;
  followers_count?: number;
  new_followers?: number;
  profile_views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  video_views?: number;
  video_id?: string;
  video_title?: string;
  video_duration?: number;
  video_description?: string;
  reach?: number;
  full_video_watched_rate?: number;
  total_time_watched?: number;
  average_time_watched?: number;
  embed_link?: string;
}

function processReportData(currentRows: WindsorRow[], prevRows: WindsorRow[]) {
  // Separate daily rows (no video_id) from video rows
  const dailyRows = currentRows.filter(r => !r.video_id);
  const videoRows = currentRows.filter(r => r.video_id);
  const prevDailyRows = prevRows.filter(r => !r.video_id);

  // Daily totals
  const totalLikes = dailyRows.reduce((s, r) => s + (Number(r.likes) || 0), 0);
  const totalComments = dailyRows.reduce((s, r) => s + (Number(r.comments) || 0), 0);
  const totalShares = dailyRows.reduce((s, r) => s + (Number(r.shares) || 0), 0);
  const totalProfileViews = dailyRows.reduce((s, r) => s + (Number(r.profile_views) || 0), 0);
  const totalNewFollowers = dailyRows.reduce((s, r) => s + (Number(r.new_followers) || 0), 0);
  const currentFollowers = dailyRows.length > 0
    ? Math.max(...dailyRows.map(r => Number(r.followers_count) || 0))
    : 0;

  // Previous period totals for comparison
  const prevTotalLikes = prevDailyRows.reduce((s, r) => s + (Number(r.likes) || 0), 0);
  const prevTotalComments = prevDailyRows.reduce((s, r) => s + (Number(r.comments) || 0), 0);
  const prevTotalShares = prevDailyRows.reduce((s, r) => s + (Number(r.shares) || 0), 0);
  const prevTotalProfileViews = prevDailyRows.reduce((s, r) => s + (Number(r.profile_views) || 0), 0);
  const prevTotalNewFollowers = prevDailyRows.reduce((s, r) => s + (Number(r.new_followers) || 0), 0);

  // Chart data by date
  const dateSet = [...new Set(dailyRows.map(r => r.date).filter(Boolean))].sort() as string[];
  const chartLabels = dateSet.map(d => {
    const parts = d.split('-');
    return `${parts[1]}.${parts[2]}.`;
  });

  function sumByDate(rows: WindsorRow[], field: keyof WindsorRow) {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (!r.date) continue;
      map.set(r.date, (map.get(r.date) || 0) + (Number(r[field]) || 0));
    }
    return dateSet.map(d => map.get(d) || 0);
  }

  // Video metrics
  const uniqueVideos = new Map<string, WindsorRow>();
  for (const r of videoRows) {
    if (!r.video_id) continue;
    const existing = uniqueVideos.get(r.video_id);
    if (!existing || (Number(r.video_views) || 0) > (Number(existing.video_views) || 0)) {
      uniqueVideos.set(r.video_id, r);
    }
  }

  const videos = Array.from(uniqueVideos.values()).map(v => ({
    videoId: v.video_id,
    title: v.video_title || v.video_description?.slice(0, 60) || 'Videó',
    views: Number(v.video_views) || 0,
    likes: Number(v.likes) || 0,
    comments: Number(v.comments) || 0,
    shares: Number(v.shares) || 0,
    reach: Number(v.reach) || 0,
    duration: Number(v.video_duration) || 0,
    fullWatchRate: Number(v.full_video_watched_rate) || 0,
    totalWatchTime: Number(v.total_time_watched) || 0,
    avgWatchTime: Number(v.average_time_watched) || 0,
    embedUrl: v.embed_link || null,
  }));

  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const totalReach = videos.reduce((s, v) => s + v.reach, 0);
  const videoCount = videos.length;
  const avgEngagement = videoCount > 0
    ? videos.reduce((s, v) => s + (v.views > 0 ? ((v.likes + v.comments + v.shares) / v.views) * 100 : 0), 0) / videoCount
    : 0;
  const avgFullWatchRate = videoCount > 0
    ? videos.reduce((s, v) => s + v.fullWatchRate, 0) / videoCount
    : 0;
  const totalWatchTimeSec = videos.reduce((s, v) => s + v.totalWatchTime, 0);

  function formatWatchTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function pctChange(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  }

  return {
    daily: {
      chartLabels,
      likesData: sumByDate(dailyRows, 'likes'),
      commentsData: sumByDate(dailyRows, 'comments'),
      sharesData: sumByDate(dailyRows, 'shares'),
      profileViewsData: sumByDate(dailyRows, 'profile_views'),
      newFollowersData: sumByDate(dailyRows, 'new_followers'),
      followersData: sumByDate(dailyRows, 'followers_count'),
      totals: {
        currentFollowers,
        totalNewFollowers,
        totalLikes,
        totalComments,
        totalShares,
        totalProfileViews,
        changes: {
          likes: pctChange(totalLikes, prevTotalLikes),
          comments: pctChange(totalComments, prevTotalComments),
          shares: pctChange(totalShares, prevTotalShares),
          profileViews: pctChange(totalProfileViews, prevTotalProfileViews),
          newFollowers: pctChange(totalNewFollowers, prevTotalNewFollowers),
        },
      },
    },
    video: {
      videos: videos.sort((a, b) => b.views - a.views),
      totals: {
        totalViews,
        totalReach,
        videoCount,
        avgEngagement,
        avgFullWatchRate,
        totalWatchTimeFormatted: formatWatchTime(totalWatchTimeSec),
      },
    },
  };
}
