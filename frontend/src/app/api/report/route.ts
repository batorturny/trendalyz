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

    // Fetch from Windsor (separate daily + video calls, matching backend WindsorService)
    const dailyFields = 'comments,date,followers_count,likes,profile_views,shares,total_followers_count';
    const videoFields = 'video_comments,video_create_datetime,video_embed_url,video_full_watched_rate,video_likes,video_new_followers,video_reach,video_shares,video_total_time_watched,video_views_count,video_average_time_watched_non_aggregated';

    async function fetchWindsor(from: string, to: string, fields: string) {
      const url = `${WINDSOR_BASE}/tiktok_organic?api_key=${windsorApiKey}&date_from=${from}&date_to=${to}&fields=${fields}&select_accounts=${tiktokAccountId}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`Windsor ${res.status} for fields=${fields.slice(0, 40)}:`, text.slice(0, 200));
        throw new Error(`Windsor API error: ${res.status}`);
      }
      const raw = await res.json();
      return Array.isArray(raw) ? (raw[0]?.data || []) : (raw?.data || []);
    }

    const [currentDaily, prevDaily, currentVideo, prevVideo] = await Promise.all([
      fetchWindsor(dateFrom, dateTo, dailyFields),
      fetchWindsor(prevDateFrom, prevDateTo, dailyFields),
      fetchWindsor(dateFrom, dateTo, videoFields),
      fetchWindsor(prevDateFrom, prevDateTo, videoFields),
    ]);

    const currentData = { daily: currentDaily, video: currentVideo };
    const prevData = { daily: prevDaily, video: prevVideo };

    // Process report data (matching backend processReport)
    const reportData = processReportData(currentData, prevData);

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
// REPORT PROCESSING (exact port of backend/services/report.js)
// ============================================

/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const nonNeg = (v: any) => Math.max(0, num(v));
const sum = (arr: number[]) => arr.reduce((a, b) => a + num(b), 0);
const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function formatDateLabel(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`;
}

function formatWatchTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}ó ${mins}p`;
  if (mins > 0) return `${mins}p ${secs}mp`;
  return `${secs}mp`;
}

function calcChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function aggregateDaily(data: any[]) {
  const byDate: Record<string, any> = {};
  for (const row of data) {
    if (!row.date) continue;
    const d = row.date.substring(0, 10);
    if (!byDate[d]) {
      byDate[d] = { date: d, likes: 0, comments: 0, shares: 0, profile_views: 0, followers_count: 0, total_followers_count: 0, _tfcValues: [] as number[] };
    }
    byDate[d].likes += nonNeg(row.likes);
    byDate[d].comments += nonNeg(row.comments);
    byDate[d].shares += nonNeg(row.shares);
    byDate[d].profile_views += nonNeg(row.profile_views);
    byDate[d].followers_count += nonNeg(row.followers_count);
    const tfc = nonNeg(row.total_followers_count);
    if (tfc > 0) byDate[d]._tfcValues.push(tfc);
  }
  for (const d in byDate) {
    const tfcArr = byDate[d]._tfcValues;
    byDate[d].total_followers_count = tfcArr.length > 0 ? Math.max(...tfcArr) : 0;
    delete byDate[d]._tfcValues;
  }
  return Object.values(byDate).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function processVideos(data: any[]) {
  const byUrl: Record<string, any> = {};
  for (const r of data) {
    if (!r.video_embed_url) continue;
    const url = r.video_embed_url;
    if (!byUrl[url]) {
      byUrl[url] = { datetime: r.video_create_datetime, embedUrl: url, views: 0, reach: 0, likes: 0, comments: 0, shares: 0, newFollowers: 0, fullWatchRate: 0, watchTimeSeconds: 0, avgWatchTime: 0 };
    }
    const v = byUrl[url];
    v.views = Math.max(v.views, nonNeg(r.video_views_count));
    v.reach = Math.max(v.reach, nonNeg(r.video_reach));
    v.likes = Math.max(v.likes, nonNeg(r.video_likes));
    v.comments = Math.max(v.comments, nonNeg(r.video_comments));
    v.shares = Math.max(v.shares, nonNeg(r.video_shares));
    v.newFollowers = Math.max(v.newFollowers, nonNeg(r.video_new_followers));
    v.fullWatchRate = Math.max(v.fullWatchRate, num(r.video_full_watched_rate) * 100);
    v.watchTimeSeconds = Math.max(v.watchTimeSeconds, num(r.video_total_time_watched));
    v.avgWatchTime = Math.max(v.avgWatchTime, num(r.video_average_time_watched_non_aggregated));
  }
  return Object.values(byUrl).map((v: any) => {
    const er = v.reach > 0 ? ((v.likes + v.comments + v.shares) / v.reach) * 100 : 0;
    return { ...v, engagementRate: er, watchTimeFormatted: formatWatchTime(v.watchTimeSeconds), avgWatchTimeFormatted: formatWatchTime(v.avgWatchTime) };
  }).sort((a: any, b: any) => new Date(a.datetime || 0).getTime() - new Date(b.datetime || 0).getTime());
}

function processReportData(rawData: { daily: any[]; video: any[] }, prevData: { daily: any[]; video: any[] }) {
  const dailySorted = aggregateDaily(rawData.daily);
  const prevDailySorted = aggregateDaily(prevData.daily);

  const dailyChartLabels = dailySorted.map((r: any) => formatDateLabel(r.date));
  const likesData = dailySorted.map((r: any) => r.likes);
  const commentsData = dailySorted.map((r: any) => r.comments);
  const sharesData = dailySorted.map((r: any) => r.shares);
  const profileViewsData = dailySorted.map((r: any) => r.profile_views);

  let totalFollowersData = dailySorted.map((r: any) => r.total_followers_count);
  let lastValidValue = totalFollowersData.find((v: number) => v > 0) || 0;
  totalFollowersData = totalFollowersData.map((v: number) => { if (v > 0) { lastValidValue = v; return v; } return lastValidValue; });

  const firstDayTotal = totalFollowersData.find((v: number) => v > 0) || 0;
  const lastDayTotal = [...totalFollowersData].reverse().find((v: number) => v > 0) || 0;
  const newFollowersThisMonth = lastDayTotal - firstDayTotal;

  const prevTotals = prevDailySorted.length > 0 ? {
    totalLikes: sum(prevDailySorted.map((r: any) => r.likes)),
    totalComments: sum(prevDailySorted.map((r: any) => r.comments)),
    totalShares: sum(prevDailySorted.map((r: any) => r.shares)),
    totalProfileViews: sum(prevDailySorted.map((r: any) => r.profile_views)),
    totalNewFollowers: (() => {
      const pf = prevDailySorted.find((r: any) => r.total_followers_count > 0)?.total_followers_count || 0;
      const pl = [...prevDailySorted].reverse().find((r: any) => r.total_followers_count > 0)?.total_followers_count || 0;
      return pl - pf;
    })(),
  } : null;

  const dailyTotals = {
    totalLikes: sum(likesData), totalComments: sum(commentsData), totalShares: sum(sharesData),
    totalProfileViews: sum(profileViewsData), totalNewFollowers: newFollowersThisMonth,
    currentFollowers: lastDayTotal, startFollowers: firstDayTotal,
    likesChange: prevTotals ? calcChange(sum(likesData), prevTotals.totalLikes) : null,
    commentsChange: prevTotals ? calcChange(sum(commentsData), prevTotals.totalComments) : null,
    sharesChange: prevTotals ? calcChange(sum(sharesData), prevTotals.totalShares) : null,
    profileViewsChange: prevTotals ? calcChange(sum(profileViewsData), prevTotals.totalProfileViews) : null,
    newFollowersChange: prevTotals ? calcChange(newFollowersThisMonth, prevTotals.totalNewFollowers) : null,
  };

  const videos = processVideos(rawData.video);
  const prevVideos = processVideos(prevData.video);

  const videoTotals = {
    totalViews: sum(videos.map((v: any) => v.views)),
    totalReach: sum(videos.map((v: any) => v.reach)),
    totalLikes: sum(videos.map((v: any) => v.likes)),
    totalComments: sum(videos.map((v: any) => v.comments)),
    totalShares: sum(videos.map((v: any) => v.shares)),
    totalNewFollowers: sum(videos.map((v: any) => v.newFollowers)),
    totalWatchTimeFormatted: formatWatchTime(sum(videos.map((v: any) => v.watchTimeSeconds))),
    videoCount: videos.length,
    avgEngagement: videos.length > 0 ? sum(videos.map((v: any) => v.engagementRate)) / videos.length : 0,
    avgFullWatchRate: videos.length > 0 ? sum(videos.map((v: any) => v.fullWatchRate)) / videos.length : 0,
    viewsChange: prevVideos.length > 0 ? calcChange(sum(videos.map((v: any) => v.views)), sum(prevVideos.map((v: any) => v.views))) : null,
    reachChange: prevVideos.length > 0 ? calcChange(sum(videos.map((v: any) => v.reach)), sum(prevVideos.map((v: any) => v.reach))) : null,
    videoCountChange: prevVideos.length > 0 ? calcChange(videos.length, prevVideos.length) : null,
  };

  const top3Videos = videos.slice().sort((a: any, b: any) => b.views - a.views).slice(0, 3);

  return {
    daily: {
      chartLabels: dailyChartLabels, likesData, commentsData, sharesData, profileViewsData, totalFollowersData,
      totals: dailyTotals,
      dateRange: { from: (dailySorted[0] as any)?.date || '', to: (dailySorted[dailySorted.length - 1] as any)?.date || '' },
    },
    video: { videos, top3: top3Videos, totals: videoTotals },
  };
}
