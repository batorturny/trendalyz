import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { NextResponse } from 'next/server';
import { chartCatalog, validateChartKeys } from '@/lib/chartCatalog';
import ChartGenerator from '@/lib/chartGenerator';

const WINDSOR_BASE = 'https://connectors.windsor.ai';

const PLATFORM_CONFIG: Record<string, { endpoint: string; allChartFields: string[] }> = {
  TIKTOK_ORGANIC: {
    endpoint: 'tiktok_organic',
    allChartFields: [
      'date', 'followers_count', 'total_followers_count', 'profile_views', 'likes', 'comments', 'shares',
      'video_id', 'video_caption', 'video_create_datetime', 'video_embed_url',
      'video_views_count', 'video_reach', 'video_likes', 'video_comments',
      'video_shares', 'video_new_followers', 'video_full_watched_rate',
      'audience_activity_hour', 'audience_activity_count',
      'audience_ages_age', 'audience_ages_percentage',
      'video_audience_genders_gender', 'video_audience_genders_percentage',
      'bio_link_clicks', 'email_clicks', 'engaged_audience',
      'video_average_time_watched', 'video_total_time_watched', 'video_duration',
      'video_impression_sources_impression_source', 'video_impression_sources_percentage',
    ],
  },
  TIKTOK_ADS: {
    endpoint: 'tiktok',
    allChartFields: [
      'date', 'impressions', 'clicks', 'spend', 'cpc', 'cpm', 'ctr',
      'conversions', 'cost_per_conversion', 'campaign_name', 'adgroup_name', 'ad_name',
      'video_play_actions', 'video_watched_2s', 'video_watched_6s',
    ],
  },
  FACEBOOK_ORGANIC: {
    endpoint: 'facebook_organic',
    allChartFields: [
      'date', 'impressions', 'reach', 'engaged_users', 'page_fans', 'page_views_total',
      'reactions', 'comments', 'shares',
      'post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach',
      'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink',
      'page_follows', 'page_daily_follows', 'page_daily_unfollows',
      'page_video_views', 'page_video_view_time',
      'post_video_views', 'post_reactions_like_total', 'post_reactions_love_total',
      'post_reactions_wow_total', 'post_reactions_haha_total',
      'post_reactions_sad_total', 'post_reactions_angry_total',
    ],
  },
  INSTAGRAM_ORGANIC: {
    endpoint: 'instagram',
    allChartFields: [
      'date', 'impressions', 'reach', 'follower_count', 'profile_views', 'website_clicks',
      'media_id', 'caption', 'timestamp', 'likes', 'comments', 'shares', 'saved',
      'media_url', 'permalink',
      'follower_count_1d', 'media_engagement', 'media_reach', 'media_saved', 'media_shares',
      'media_reel_video_views', 'media_reel_avg_watch_time',
      'story_reach', 'story_views', 'story_exits',
    ],
  },
  INSTAGRAM: {
    endpoint: 'instagram',
    allChartFields: [
      'date', 'impressions', 'reach', 'follower_count', 'profile_views', 'website_clicks',
      'media_id', 'caption', 'timestamp', 'likes', 'comments', 'shares', 'saved',
      'media_url', 'permalink',
    ],
  },
  INSTAGRAM_PUBLIC: {
    endpoint: 'instagram_public',
    allChartFields: [
      'date', 'profile_followers_count', 'profile_follows_count', 'profile_media_count', 'profile_username',
      'media_id', 'media_caption', 'media_like_count', 'media_comments_count',
      'media_type', 'media_permalink', 'media_timestamp',
      'likes_per_post', 'comments_per_post',
    ],
  },
  FACEBOOK: {
    endpoint: 'facebook',
    allChartFields: [
      'date', 'impressions', 'reach', 'engaged_users', 'page_fans', 'page_views_total',
      'reactions', 'comments', 'shares',
      'post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach',
      'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink',
    ],
  },
  YOUTUBE: {
    endpoint: 'youtube',
    allChartFields: [
      'date', 'views', 'likes', 'comments', 'shares', 'subscribers_gained', 'subscribers_lost',
      'estimated_minutes_watched', 'video_id', 'video_title', 'video_published_at',
      'average_view_duration',
      'average_view_percentage', 'videos_added_to_playlists', 'red_views', 'dislikes',
    ],
  },
};

async function fetchWindsorChartData(apiKey: string, platform: string, accountId: string, dateFrom: string, dateTo: string) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) throw new Error(`Unknown platform: ${platform}`);

  const fields = config.allChartFields.join(',');
  const url = `${WINDSOR_BASE}/${config.endpoint}?api_key=${apiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=${fields}&select_accounts=${accountId}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`Windsor chart ${res.status} for ${platform}:`, text.slice(0, 200));
    throw new Error(`Windsor API error: ${res.status}`);
  }
  const raw = await res.json();
  return Array.isArray(raw) ? (raw[0]?.data || []) : (raw?.data || []);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { accountId, startDate, endDate, charts, forceRefresh } = await req.json();

    if (!accountId || !startDate || !endDate || !charts || !Array.isArray(charts)) {
      return NextResponse.json({ error: 'accountId, startDate, endDate, and charts array are required' }, { status: 400 });
    }

    // Validate chart keys — skip unknown ones
    const chartKeys = charts.map((c: any) => c.key);
    const validation = validateChartKeys(chartKeys);
    let validCharts = charts;
    if (!validation.valid) {
      console.warn('[CHART API] Skipping invalid chart keys:', validation.invalidKeys);
      const validKeySet = new Set(chartCatalog.map(c => c.key));
      validCharts = charts.filter((c: any) => validKeySet.has(c.key));
      if (validCharts.length === 0) {
        return NextResponse.json({
          error: 'No valid chart keys provided',
          invalidKeys: validation.invalidKeys,
        }, { status: 400 });
      }
    }

    // Access check
    if (session.user.role !== 'ADMIN' && session.user.companyId !== accountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const company = await prisma.company.findUnique({
      where: { id: accountId },
      select: { id: true, name: true, tiktokAccountId: true, adminId: true },
    });
    if (!company) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Resolve platform accounts
    const connections = await prisma.integrationConnection.findMany({
      where: { companyId: accountId },
      select: { provider: true, externalAccountId: true },
    });

    const platformAccounts = new Map<string, string>();
    for (const conn of connections) {
      platformAccounts.set(conn.provider, conn.externalAccountId);
    }
    // Legacy TikTok fallback
    if (!platformAccounts.has('TIKTOK_ORGANIC') && company.tiktokAccountId) {
      platformAccounts.set('TIKTOK_ORGANIC', company.tiktokAccountId);
    }

    // Group requested charts by platform
    const chartsByPlatform = new Map<string, any[]>();
    for (const chartReq of validCharts) {
      const def = chartCatalog.find(c => c.key === chartReq.key);
      const platform = def?.platform || 'TIKTOK_ORGANIC';
      if (!chartsByPlatform.has(platform)) chartsByPlatform.set(platform, []);
      chartsByPlatform.get(platform)!.push(chartReq);
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

    // Fetch data and generate charts per platform in parallel
    const platformPromises = Array.from(chartsByPlatform.entries()).map(async ([platform, platformCharts]) => {
      const platformAccountId = platformAccounts.get(platform);

      if (!platformAccountId) {
        return platformCharts.map((chartReq: any) => ({
          key: chartReq.key,
          empty: true,
          error: 'Nincs kapcsolat ehhez a platformhoz'
        }));
      }

      try {
        const windsorData = await fetchWindsorChartData(windsorApiKey, platform, platformAccountId, startDate, endDate);
        const generator = new ChartGenerator(windsorData, startDate, endDate);

        return platformCharts.map((chartReq: any) => {
          try {
            return generator.generate(chartReq.key, chartReq.params || {});
          } catch (error: any) {
            return { key: chartReq.key, error: error.message, empty: true };
          }
        });
      } catch (error: any) {
        console.error(`[CHART API] ${platform} fetch error:`, error.message);
        return platformCharts.map((chartReq: any) => ({
          key: chartReq.key,
          error: `Platform data fetch failed: ${error.message}`,
          empty: true
        }));
      }
    });

    const platformResults = await Promise.all(platformPromises);
    const results = platformResults.flat();

    return NextResponse.json({
      account: { id: company.id, name: company.name },
      dateRange: { from: startDate, to: endDate },
      chartsRequested: validCharts.length,
      chartsGenerated: results.filter((r: any) => !r.error).length,
      charts: results
    });

  } catch (error: any) {
    console.error('Chart generation error:', error);
    return NextResponse.json({ error: 'Failed to generate charts', details: error.message }, { status: 500 });
  }
}
