import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { NextResponse } from 'next/server';
import { chartCatalog, validateChartKeys } from '@/lib/chartCatalog';
import ChartGenerator from '@/lib/chartGenerator';

const WINDSOR_BASE = 'https://connectors.windsor.ai';

// Each platform's fields are split into groups — each group becomes a separate
// Windsor API call.  This prevents mixing incompatible dimension types (daily
// account metrics vs per-video rows vs demographic breakdowns) in one request.
interface FieldGroup {
  /** Human-readable label for logging */
  name: string;
  fields: string[];
  /** If true, failure of this group won't fail the whole platform */
  optional?: boolean;
}

interface PlatformConfig {
  endpoint: string;
  fieldGroups: FieldGroup[];
  secondaryEndpoint?: string;
  secondaryFields?: string[];
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  TIKTOK_ORGANIC: {
    endpoint: 'tiktok_organic',
    fieldGroups: [
      // Daily account-level metrics (verified against Windsor API)
      {
        name: 'daily',
        fields: [
          'date', 'followers_count', 'total_followers_count', 'profile_views',
          'likes', 'comments', 'shares', 'bio_link_clicks', 'email_clicks',
          'engaged_audience', 'daily_lost_followers', 'phone_number_clicks',
        ],
      },
      // Per-video metrics
      {
        name: 'videos',
        fields: [
          'video_id', 'video_caption', 'video_create_datetime', 'video_embed_url',
          'video_views_count', 'video_reach', 'video_likes', 'video_comments',
          'video_shares', 'video_new_followers', 'video_full_watched_rate',
          'video_average_time_watched', 'video_total_time_watched', 'video_duration',
        ],
      },
      // Audience activity (hourly breakdown — separate dimension)
      {
        name: 'activity',
        fields: ['audience_activity_hour', 'audience_activity_count'],
        optional: true,
      },
      // Traffic / impression sources (separate dimension)
      {
        name: 'sources',
        fields: ['video_impression_sources_impression_source', 'video_impression_sources_percentage'],
        optional: true,
      },
      // Demographics — each is a separate dimension
      { name: 'demo_age', fields: ['audience_ages_age', 'audience_ages_percentage', 'date'], optional: true },
      { name: 'demo_gender', fields: ['video_audience_genders_gender', 'video_audience_genders_percentage', 'date'], optional: true },
      { name: 'demo_country', fields: ['audience_country', 'audience_country_percentage', 'date'], optional: true },
      { name: 'demo_city', fields: ['audience_cities_city', 'audience_cities_percentage', 'date'], optional: true },
    ],
  },
  TIKTOK_ADS: {
    endpoint: 'tiktok',
    fieldGroups: [
      // Core ad metrics (daily)
      {
        name: 'daily',
        fields: [
          'date', 'impressions', 'clicks', 'spend', 'cpc', 'cpm', 'ctr',
          'conversions', 'cost_per_conversion',
          'video_play_actions', 'video_watched_2s', 'video_watched_6s',
          'cost_per_1000_reached', 'average_video_play', 'average_video_play_per_user',
          'app_install', 'cost_per_app_install',
          'complete_payment', 'complete_payment_roas',
          'registration', 'cost_per_registration',
          'billed_cost', 'reach',
        ],
      },
      // Campaign breakdown (separate dimension)
      {
        name: 'campaigns',
        fields: ['campaign_name', 'impressions', 'clicks', 'spend', 'cpc', 'ctr', 'conversions'],
        optional: true,
      },
      // Adgroup breakdown (separate dimension)
      {
        name: 'adgroups',
        fields: ['adgroup_name', 'impressions', 'clicks', 'spend', 'cpc', 'ctr', 'conversions'],
        optional: true,
      },
    ],
  },
  FACEBOOK_ORGANIC: {
    endpoint: 'facebook_organic',
    fieldGroups: [
      // Daily page metrics
      {
        name: 'daily',
        fields: [
          'date', 'impressions', 'reach', 'engaged_users', 'page_fans', 'page_views_total',
          'reactions', 'comments', 'shares',
          'page_follows', 'page_daily_follows', 'page_daily_unfollows',
          'page_video_views', 'page_video_view_time',
          'page_total_actions', 'page_post_engagements',
          'blue_reels_play_count', 'fb_reels_total_plays',
        ],
      },
      // Per-post data
      {
        name: 'posts',
        fields: [
          'post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach',
          'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink',
          'post_video_views',
        ],
      },
      // Reaction breakdown per post (separate dimension)
      {
        name: 'reactions',
        fields: [
          'date', 'post_reactions_like_total', 'post_reactions_love_total',
          'post_reactions_wow_total', 'post_reactions_haha_total',
          'post_reactions_sorry_total', 'post_reactions_anger_total',
        ],
        optional: true,
      },
      // Post click types (separate dimension)
      {
        name: 'click_types',
        fields: ['date', 'post_clicks_by_type_photo_view', 'post_clicks_by_type_video_play'],
        optional: true,
      },
      // Demographics
      { name: 'fans_country', fields: ['page_fans_country_name', 'page_fans_country_value'], optional: true },
      { name: 'fans_city', fields: ['page_fans_city_name', 'page_fans_city_value'], optional: true },
    ],
  },
  INSTAGRAM_ORGANIC: {
    endpoint: 'instagram',
    fieldGroups: [
      // Daily account metrics
      {
        name: 'daily',
        fields: [
          'date', 'impressions', 'reach', 'follower_count', 'profile_views', 'website_clicks',
          'likes', 'comments', 'shares', 'saved',
          'follower_count_1d',
          'clicks', 'email_contacts_1d', 'phone_call_clicks_1d', 'website_clicks_1d',
          'get_directions_clicks_1d', 'text_message_clicks_1d',
        ],
      },
      // Per-media data
      {
        name: 'media',
        fields: [
          'media_id', 'caption', 'timestamp', 'impressions', 'reach', 'likes', 'comments', 'shares', 'saved',
          'media_url', 'permalink',
          'media_engagement', 'media_reach', 'media_saved', 'media_shares',
          'media_all_plays', 'media_plays', 'media_video_views',
        ],
      },
      // Reel metrics
      {
        name: 'reels',
        fields: ['date', 'media_reel_video_views', 'media_reel_avg_watch_time'],
        optional: true,
      },
      // Story metrics
      {
        name: 'stories',
        fields: [
          'date', 'story_reach', 'story_views', 'story_exits',
          'story_interactions', 'story_replies', 'story_shares',
          'story_taps_forward', 'story_taps_back', 'story_swipe_forward',
        ],
        optional: true,
      },
      // Demographics — each is a separate dimension
      { name: 'demo_age', fields: ['audience_age_name', 'audience_age_size', 'date'], optional: true },
      { name: 'demo_gender', fields: ['audience_gender_name', 'audience_gender_size', 'date'], optional: true },
      { name: 'demo_country', fields: ['audience_country_name', 'audience_country_size', 'date'], optional: true },
      { name: 'demo_city', fields: ['city', 'audience_city_size', 'date'], optional: true },
    ],
    secondaryEndpoint: 'instagram_public',
    secondaryFields: [
      'date', 'profile_followers_count', 'profile_follows_count', 'profile_media_count', 'profile_username',
      'media_id', 'media_caption', 'media_like_count', 'media_comments_count',
      'media_type', 'media_permalink', 'media_timestamp',
      'likes_per_post', 'comments_per_post',
    ],
  },
  INSTAGRAM: {
    endpoint: 'instagram',
    fieldGroups: [
      {
        name: 'daily',
        fields: [
          'date', 'impressions', 'reach', 'follower_count', 'profile_views', 'website_clicks',
          'likes', 'comments', 'shares', 'saved',
        ],
      },
      {
        name: 'media',
        fields: [
          'media_id', 'caption', 'timestamp', 'likes', 'comments', 'shares', 'saved',
          'media_url', 'permalink',
        ],
      },
    ],
  },
  FACEBOOK: {
    endpoint: 'facebook',
    fieldGroups: [
      {
        name: 'daily',
        fields: [
          'date', 'impressions', 'reach', 'engaged_users', 'page_fans', 'page_views_total',
          'reactions', 'comments', 'shares',
        ],
      },
      {
        name: 'posts',
        fields: [
          'post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach',
          'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink',
        ],
      },
    ],
  },
  YOUTUBE: {
    endpoint: 'youtube',
    fieldGroups: [
      // Daily channel metrics
      {
        name: 'daily',
        fields: [
          'date', 'views', 'likes', 'comments', 'shares',
          'subscribers_gained', 'subscribers_lost', 'subscriber_count',
          'estimated_minutes_watched', 'estimated_red_minutes_watched',
          'videos_added_to_playlists', 'videos_removed_from_playlists',
          'red_views', 'dislikes', 'videos_published',
          'card_clicks', 'card_impressions', 'card_click_rate',
        ],
      },
      // Per-video data
      {
        name: 'videos',
        fields: [
          'video_id', 'video_title', 'video_published_at',
          'views', 'likes', 'comments', 'shares',
          'average_view_duration', 'average_view_percentage',
        ],
      },
    ],
  },
};

async function fetchWindsorRaw(apiKey: string, endpoint: string, accountId: string, dateFrom: string, dateTo: string, fields: string) {
  const url = `${WINDSOR_BASE}/${endpoint}?api_key=${apiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=${fields}&select_accounts=${accountId}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`Windsor ${res.status} for ${endpoint}:`, text.slice(0, 200));
    throw new Error(`Windsor API error: ${res.status}`);
  }
  const raw = await res.json();
  return Array.isArray(raw) ? (raw[0]?.data || []) : (raw?.data || []);
}

async function fetchWindsorChartData(apiKey: string, platform: string, accountId: string, dateFrom: string, dateTo: string) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) throw new Error(`Unknown platform: ${platform}`);

  // Fetch each field group as a separate API call
  const promises: Promise<any[]>[] = config.fieldGroups.map(group => {
    const p = fetchWindsorRaw(apiKey, config.endpoint, accountId, dateFrom, dateTo, group.fields.join(','));
    if (group.optional) {
      return p.catch(err => {
        console.warn(`[Windsor] Optional group "${group.name}" failed for ${platform}:`, err.message);
        return [];
      });
    }
    return p;
  });

  // Fetch secondary endpoint data (e.g. instagram_public for INSTAGRAM_ORGANIC)
  if (config.secondaryEndpoint && config.secondaryFields) {
    promises.push(
      fetchWindsorRaw(apiKey, config.secondaryEndpoint, accountId, dateFrom, dateTo, config.secondaryFields.join(',')).catch(err => {
        console.warn(`[Windsor] Secondary endpoint fetch failed for ${platform}:`, err.message);
        return [];
      })
    );
  }

  const results = await Promise.all(promises);
  // Merge all result arrays into one dataset
  return results.flat();
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

    // Get Windsor API key (admin's own key OR central WINDSOR_API_KEY fallback)
    const adminId = session.user.role === 'ADMIN' ? session.user.id : company.adminId;
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId! },
      select: { windsorApiKeyEnc: true },
    });

    let windsorApiKey: string;
    if (adminUser?.windsorApiKeyEnc) {
      windsorApiKey = decrypt(adminUser.windsorApiKeyEnc);
    } else if (process.env.WINDSOR_API_KEY) {
      windsorApiKey = process.env.WINDSOR_API_KEY;
    } else {
      return NextResponse.json({ error: 'Windsor API key not configured' }, { status: 400 });
    }

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
