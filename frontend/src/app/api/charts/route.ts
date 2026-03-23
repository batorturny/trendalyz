import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { NextResponse } from 'next/server';
import { chartCatalog, validateChartKeys } from '@/lib/chartCatalog';
import ChartGenerator from '@/lib/chartGenerator';

const WINDSOR_BASE = 'https://connectors.windsor.ai';
const WINDSOR_TIMEOUT = 30000; // 30s per API call

// Each platform's fields are split into groups — each group becomes a separate
// Windsor API call so incompatible dimensions don't mix.
interface FieldGroup {
  name: string;
  fields: string[];
}

interface PlatformConfig {
  endpoint: string;
  fieldGroups: FieldGroup[];
  skipSelectAccounts?: boolean;
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  TIKTOK_ORGANIC: {
    endpoint: 'tiktok_organic',
    fieldGroups: [
      {
        name: 'daily',
        fields: [
          'date', 'followers_count', 'total_followers_count', 'profile_views',
          'likes', 'comments', 'shares', 'bio_link_clicks', 'email_clicks',
          'daily_lost_followers', 'phone_number_clicks',
        ],
      },
      {
        name: 'videos',
        fields: [
          'video_id', 'video_caption', 'video_create_datetime', 'video_embed_url',
          'video_views_count', 'video_reach', 'video_likes', 'video_comments',
          'video_shares', 'video_new_followers', 'video_full_watched_rate',
          'video_average_time_watched_non_aggregated', 'video_total_time_watched',
        ],
      },
      { name: 'activity', fields: ['audience_activity_hour', 'audience_activity_count'] },
      { name: 'sources', fields: ['video_impression_sources_impression_source', 'video_impression_sources_percentage'] },
      { name: 'demo_age', fields: ['audience_ages_age', 'audience_ages_percentage', 'date'] },
      { name: 'demo_gender', fields: ['video_audience_genders_gender', 'video_audience_genders_percentage', 'date'] },
      { name: 'demo_country', fields: ['audience_country', 'audience_country_percentage', 'date'] },
      { name: 'demo_city', fields: ['audience_cities_city', 'audience_cities_percentage', 'date'] },
    ],
  },
  TIKTOK_ADS: {
    endpoint: 'tiktok',
    fieldGroups: [
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
      { name: 'campaigns', fields: ['campaign_name', 'impressions', 'clicks', 'spend', 'cpc', 'ctr', 'conversions'] },
      { name: 'adgroups', fields: ['adgroup_name', 'impressions', 'clicks', 'spend', 'cpc', 'ctr', 'conversions'] },
    ],
  },
  FACEBOOK_ORGANIC: {
    endpoint: 'facebook_organic',
    fieldGroups: [
      {
        name: 'daily',
        fields: [
          'date', 'page_impressions', 'page_impressions_unique', 'page_fans', 'page_views_total',
          'page_follows', 'page_daily_follows', 'page_daily_unfollows',
          'page_video_views', 'page_video_view_time',
          'page_post_engagements',
          'blue_reels_play_count', 'fb_reels_total_plays',
        ],
      },
      {
        name: 'posts',
        fields: [
          'post_id', 'post_message', 'post_created_time',
          'post_activity_by_action_type_like', 'post_activity_by_action_type_comment', 'post_activity_by_action_type_share',
          'post_impressions', 'post_impressions_unique', 'post_impressions_fan', 'post_impressions_organic',
          'post_video_views', 'post_video_views_autoplayed', 'post_video_views_clicked_to_play', 'post_video_views_organic', 'post_video_views_unique',
          'post_clicks', 'post_clicks_by_type_other_clicks', 'post_clicks_by_type_photo_view', 'post_clicks_by_type_video_play', 'post_clicks_by_type_link_clicks',
        ],
      },
      {
        name: 'reactions',
        fields: [
          'date', 'post_reactions_like_total', 'post_reactions_love_total',
          'post_reactions_wow_total', 'post_reactions_haha_total',
          'post_reactions_sorry_total', 'post_reactions_anger_total',
        ],
      },
    ],
  },
  INSTAGRAM_ORGANIC: {
    endpoint: 'instagram',
    fieldGroups: [
      {
        name: 'daily',
        fields: [
          'date', 'impressions', 'reach', 'profile_views',
          'website_clicks_1d',
          'media_like_count', 'media_comments_count', 'media_shares', 'media_saved',
          'media_reach', 'media_engagement',
          'email_contacts_1d', 'phone_call_clicks_1d',
          'get_directions_clicks_1d', 'text_message_clicks_1d',
        ],
      },
      // follower_count only supports last 30 days in Windsor API
      { name: 'followers', fields: ['date', 'follower_count_1d'] },
      {
        name: 'media',
        fields: [
          'date', 'media_id', 'media_caption', 'timestamp', 'media_type',
          'media_reach', 'media_like_count', 'media_comments_count',
          'media_shares', 'media_saved',
          'media_url', 'media_permalink',
          'media_engagement', 'media_views',
        ],
      },
      {
        name: 'stories',
        fields: [
          'date', 'story_reach', 'story_views', 'story_exits',
          'story_interactions', 'story_replies', 'story_shares',
          'story_taps_forward', 'story_taps_back', 'story_swipe_forward',
        ],
      },
      { name: 'demo_age', fields: ['audience_age_name', 'audience_age_size', 'date'] },
      { name: 'demo_gender', fields: ['audience_gender_name', 'audience_gender_size', 'date'] },
      { name: 'demo_country', fields: ['audience_country_name', 'audience_country_size', 'date'] },
      { name: 'demo_city', fields: ['city', 'audience_city_size', 'date'] },
    ],
  },
  YOUTUBE: {
    endpoint: 'youtube',
    skipSelectAccounts: true,
    fieldGroups: [
      {
        name: 'daily',
        fields: [
          'date', 'views', 'likes', 'comments', 'shares',
          'subscribers_gained', 'subscribers_lost', 'subscriber_count',
          'estimated_minutes_watched', 'average_view_percentage',
        ],
      },
      {
        name: 'videos',
        fields: ['published_at', 'video', 'video_title', 'views', 'likes', 'comments', 'shares', 'estimated_minutes_watched'],
      },
      {
        name: 'extras',
        fields: ['date', 'dislikes', 'card_clicks', 'card_impressions', 'videos_added_to_playlists'],
      },
      {
        name: 'premium',
        fields: ['date', 'red_views'],
      },
    ],
  },
};

/** Fetch a single field group from Windsor. Always resolves (returns [] on error). */
async function fetchWindsorGroup(apiKey: string, endpoint: string, accountId: string, dateFrom: string, dateTo: string, fields: string, groupName: string, skipSelectAccounts = false): Promise<any[]> {
  const accountFilter = skipSelectAccounts ? '' : `&select_accounts=${accountId}`;
  const url = `${WINDSOR_BASE}/${endpoint}?api_key=${apiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=${fields}${accountFilter}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(WINDSOR_TIMEOUT) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[Windsor] Group "${groupName}" failed (${res.status}):`, text.slice(0, 150));
      return [];
    }
    const raw = await res.json();
    return Array.isArray(raw) ? (raw[0]?.data || []) : (raw?.data || []);
  } catch (err: any) {
    console.warn(`[Windsor] Group "${groupName}" error:`, err.message);
    return [];
  }
}

/** Merge rows by key field (e.g. post_id) — later non-empty values overwrite earlier ones */
function mergeRowsByKey(data: any[], keyField: string): any[] {
  const keyed = new Map<string, any>();
  const other: any[] = [];

  for (const row of data) {
    const key = row[keyField];
    if (!key) { other.push(row); continue; }
    if (!keyed.has(key)) { keyed.set(key, { ...row }); continue; }
    const existing = keyed.get(key);
    for (const [k, v] of Object.entries(row)) {
      if (v != null && v !== '') existing[k] = v;
    }
  }
  return [...other, ...Array.from(keyed.values())];
}

async function fetchWindsorChartData(apiKey: string, platform: string, accountId: string, dateFrom: string, dateTo: string) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) throw new Error(`Unknown platform: ${platform}`);

  // All groups fetched in parallel — each one is fault-tolerant
  const skip = config.skipSelectAccounts ?? false;
  const results = await Promise.all(
    config.fieldGroups.map(group =>
      fetchWindsorGroup(apiKey, config.endpoint, accountId, dateFrom, dateTo, group.fields.join(','), group.name, skip)
    )
  );

  let merged = results.flat();

  if (platform === 'FACEBOOK_ORGANIC') {
    merged = mergeRowsByKey(merged, 'post_id');
  }

  return merged;
}

const META_GRAPH_BASE = 'https://graph.facebook.com/v19.0';
const META_DIRECT_PROVIDERS = new Set(['FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC']);
const YOUTUBE_ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2';
const YOUTUBE_DATA_BASE = 'https://www.googleapis.com/youtube/v3';

async function fetchMetaDirectData(provider: string, connection: { externalAccountId: string; metadata: any }, dateFrom: string, dateTo: string): Promise<any[] | null> {
  const meta = connection.metadata as any;
  if (!meta?.encryptedAccessToken) return null;
  const token = meta.encryptedPageAccessToken
    ? decrypt(meta.encryptedPageAccessToken as string)
    : decrypt(meta.encryptedAccessToken as string);
  if (provider === 'FACEBOOK_ORGANIC') return fetchFacebookDirectData(connection.externalAccountId, token, dateFrom, dateTo);
  if (provider === 'INSTAGRAM_ORGANIC') return fetchInstagramDirectData(connection.externalAccountId, token, dateFrom, dateTo);
  return null;
}

async function fetchFacebookDirectData(pageId: string, token: string, dateFrom: string, dateTo: string): Promise<any[]> {
  const rows: any[] = [];

  // 1. Daily page-level insights (Windsor-compatible field names)
  const dailyMetrics = [
    'page_impressions', 'page_impressions_unique', 'page_views_total',
    'page_post_engagements', 'page_daily_follows', 'page_daily_unfollows',
    'page_video_views', 'page_video_view_time',
  ].join(',');
  try {
    const url = `${META_GRAPH_BASE}/${pageId}/insights?metric=${dailyMetrics}&period=day&since=${dateFrom}&until=${dateTo}&access_token=${token}`;
    const json = await fetch(url, { signal: AbortSignal.timeout(30000) }).then(r => r.json()) as any;
    if (!json.error && Array.isArray(json.data)) {
      const byDate = new Map<string, any>();
      for (const m of json.data) {
        for (const pt of (m.values || [])) {
          const d = (pt.end_time as string).slice(0, 10);
          if (!byDate.has(d)) byDate.set(d, { date: d });
          byDate.get(d)![m.name] = pt.value ?? 0;
        }
      }
      // Fetch page_fans (lifetime metric — single current value)
      let fanCount = 0;
      try {
        const fansJson = await fetch(
          `${META_GRAPH_BASE}/${pageId}?fields=fan_count&access_token=${token}`,
          { signal: AbortSignal.timeout(10000) }
        ).then(r => r.json()) as any;
        if (!fansJson.error) fanCount = fansJson.fan_count ?? 0;
      } catch { /* ignore */ }

      for (const [, day] of byDate) {
        rows.push({
          date: day.date,
          page_impressions: day.page_impressions ?? 0,
          page_impressions_unique: day.page_impressions_unique ?? 0,
          page_post_engagements: day.page_post_engagements ?? 0,
          page_fans: fanCount,
          page_views_total: day.page_views_total ?? 0,
          page_daily_follows: day.page_daily_follows ?? 0,
          page_daily_unfollows: day.page_daily_unfollows ?? 0,
          page_video_views: day.page_video_views ?? 0,
          page_video_view_time: day.page_video_view_time ?? 0,
        });
      }
    }
  } catch (e: any) { console.warn('[Meta Direct] FB daily error:', e.message); }

  // 2. Post-level insights
  const postRows: any[] = [];
  try {
    const postsJson = await fetch(
      `${META_GRAPH_BASE}/${pageId}/posts?fields=id,message,created_time,permalink_url&since=${dateFrom}&until=${dateTo}&limit=100&access_token=${token}`,
      { signal: AbortSignal.timeout(30000) }
    ).then(r => r.json()) as any;
    if (!postsJson.error && Array.isArray(postsJson.data)) {
      const fetched = await Promise.all(postsJson.data.map(async (post: any) => {
        try {
          const insJson = await fetch(
            `${META_GRAPH_BASE}/${post.id}/insights?metric=post_impressions,post_impressions_unique,post_reactions_by_type_total,post_clicks,post_shares,post_stories_by_action_type&access_token=${token}`,
            { signal: AbortSignal.timeout(15000) }
          ).then(r => r.json()) as any;
          const m: any = {};
          if (!insJson.error && Array.isArray(insJson.data)) {
            for (const metric of insJson.data) m[metric.name] = metric.values?.[0]?.value ?? null;
          }
          const reactions = m.post_reactions_by_type_total || {};
          const stories = m.post_stories_by_action_type || {};
          const likeCount = reactions.LIKE ?? stories.like ?? 0;
          const commentCount = stories.comment ?? 0;
          const shareCount = typeof m.post_shares === 'object' ? (m.post_shares?.count ?? 0) : (m.post_shares ?? stories.share ?? 0);
          const totalReactions = Object.values(reactions).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
          return {
            date: (post.created_time as string).slice(0, 10),
            post_id: post.id,
            post_message: post.message || '',
            post_created_time: post.created_time,
            post_permalink: post.permalink_url ?? null,
            post_impressions: m.post_impressions ?? null,
            post_impressions_unique: m.post_impressions_unique ?? null,
            post_clicks: m.post_clicks ?? null,
            // Windsor-compatible individual reaction fields:
            post_reactions_like_total: reactions.LIKE ?? 0,
            post_reactions_love_total: reactions.LOVE ?? 0,
            post_reactions_wow_total: reactions.WOW ?? 0,
            post_reactions_haha_total: reactions.HAHA ?? 0,
            post_reactions_sorry_total: reactions.SORRY ?? reactions.SAD ?? 0,
            post_reactions_anger_total: reactions.ANGER ?? reactions.ANGRY ?? 0,
            // Windsor action-type fields (used by post table):
            post_activity_by_action_type_like: likeCount,
            post_activity_by_action_type_comment: commentCount,
            post_activity_by_action_type_share: shareCount,
            post_reactions: totalReactions,
            post_comments: commentCount,
            post_shares: shareCount,
            post_video_views: 0,
          };
        } catch { return null; }
      }));
      for (const p of fetched) { if (p) postRows.push(p); }
    }
  } catch (e: any) { console.warn('[Meta Direct] FB posts error:', e.message); }

  // Aggregate post reactions by date → add as daily rows for fb_reaction_breakdown chart
  const reactionsByDate = new Map<string, any>();
  for (const p of postRows) {
    if (!p.date) continue;
    if (!reactionsByDate.has(p.date)) reactionsByDate.set(p.date, { date: p.date, post_reactions_like_total: 0, post_reactions_love_total: 0, post_reactions_wow_total: 0, post_reactions_haha_total: 0 });
    const agg = reactionsByDate.get(p.date)!;
    agg.post_reactions_like_total += p.post_reactions_like_total ?? 0;
    agg.post_reactions_love_total += p.post_reactions_love_total ?? 0;
    agg.post_reactions_wow_total += p.post_reactions_wow_total ?? 0;
    agg.post_reactions_haha_total += p.post_reactions_haha_total ?? 0;
  }
  for (const [, agg] of reactionsByDate) rows.push(agg);
  for (const p of postRows) rows.push(p);

  // 3. Demographics (fans by country and city) — lifetime metrics
  try {
    const demoJson = await fetch(
      `${META_GRAPH_BASE}/${pageId}/insights?metric=page_fans_country,page_fans_city&period=lifetime&access_token=${token}`,
      { signal: AbortSignal.timeout(15000) }
    ).then(r => r.json()) as any;
    if (!demoJson.error && Array.isArray(demoJson.data)) {
      for (const metric of demoJson.data) {
        // Use most recent snapshot
        const value = metric.values?.[metric.values.length - 1]?.value ?? metric.values?.[0]?.value ?? {};
        const entries = Object.entries(value) as [string, any][];
        if (metric.name === 'page_fans_country') {
          for (const [name, val] of entries) rows.push({ page_fans_country_name: name, page_fans_country_value: Number(val) });
        } else if (metric.name === 'page_fans_city') {
          for (const [name, val] of entries) rows.push({ page_fans_city_name: name, page_fans_city_value: Number(val) });
        }
      }
    }
  } catch (e: any) { console.warn('[Meta Direct] FB demographics error:', e.message); }

  return rows;
}

async function fetchInstagramDirectData(igUserId: string, token: string, dateFrom: string, dateTo: string): Promise<any[]> {
  const rows: any[] = [];
  const since = Math.floor(new Date(dateFrom).getTime() / 1000);
  const until = Math.floor(new Date(dateTo).getTime() / 1000) + 86400;

  // 1. Daily page-level insights
  const byDate = new Map<string, any>();
  try {
    const dailyMetrics = ['impressions', 'reach', 'profile_views', 'website_clicks', 'email_contacts', 'phone_call_clicks'].join(',');
    const json = await fetch(
      `${META_GRAPH_BASE}/${igUserId}/insights?metric=${dailyMetrics}&period=day&since=${since}&until=${until}&access_token=${token}`,
      { signal: AbortSignal.timeout(30000) }
    ).then(r => r.json()) as any;
    if (!json.error && Array.isArray(json.data)) {
      for (const m of json.data) {
        for (const pt of (m.values || [])) {
          const d = (pt.end_time as string).slice(0, 10);
          if (!byDate.has(d)) byDate.set(d, { date: d });
          byDate.get(d)![m.name] = pt.value ?? 0;
        }
      }
    }
  } catch (e: any) { console.warn('[Meta Direct] IG daily error:', e.message); }

  // 2. Follower count (total + daily new followers)
  let totalFollowers = 0;
  try {
    const [accountJson, newFollowersJson] = await Promise.all([
      fetch(`${META_GRAPH_BASE}/${igUserId}?fields=followers_count&access_token=${token}`, { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
      fetch(`${META_GRAPH_BASE}/${igUserId}/insights?metric=follower_count&period=day&since=${since}&until=${until}&access_token=${token}`, { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
    ]) as any[];
    if (!accountJson.error) totalFollowers = accountJson.followers_count ?? 0;
    if (!newFollowersJson.error && Array.isArray(newFollowersJson.data)) {
      for (const m of newFollowersJson.data) {
        for (const pt of (m.values || [])) {
          const d = (pt.end_time as string).slice(0, 10);
          if (!byDate.has(d)) byDate.set(d, { date: d });
          byDate.get(d)!['follower_count_1d'] = pt.value ?? 0;
        }
      }
    }
  } catch (e: any) { console.warn('[Meta Direct] IG followers error:', e.message); }

  for (const [, day] of byDate) {
    rows.push({
      date: day.date,
      impressions: day.impressions ?? 0,
      reach: day.reach ?? 0,
      profile_views: day.profile_views ?? 0,
      follower_count: totalFollowers,
      follower_count_1d: day.follower_count_1d ?? 0,
      website_clicks_1d: day.website_clicks ?? 0,
      email_contacts_1d: day.email_contacts ?? 0,
      phone_call_clicks_1d: day.phone_call_clicks ?? 0,
    });
  }

  // 3. Media insights
  try {
    const mediaJson = await fetch(
      `${META_GRAPH_BASE}/${igUserId}/media?fields=id,caption,timestamp,media_type,permalink,media_url&since=${since}&until=${until}&limit=50&access_token=${token}`,
      { signal: AbortSignal.timeout(30000) }
    ).then(r => r.json()) as any;
    if (!mediaJson.error && Array.isArray(mediaJson.data)) {
      const mediaRows = await Promise.all(mediaJson.data.map(async (item: any) => {
        try {
          const metricsForType = item.media_type === 'VIDEO' ? 'reach,likes,comments,shares,saved,plays' : 'reach,likes,comments,shares,saved,impressions';
          const insJson = await fetch(
            `${META_GRAPH_BASE}/${item.id}/insights?metric=${metricsForType}&access_token=${token}`,
            { signal: AbortSignal.timeout(15000) }
          ).then(r => r.json()) as any;
          const m: any = {};
          if (!insJson.error && Array.isArray(insJson.data)) {
            for (const metric of insJson.data) m[metric.name] = metric.values?.[0]?.value ?? null;
          }
          return {
            date: (item.timestamp as string).slice(0, 10),
            media_id: item.id,
            media_caption: item.caption || '',
            timestamp: item.timestamp,
            media_type: item.media_type ?? null,
            media_reach: m.reach ?? null,
            media_like_count: m.likes ?? 0,
            media_comments_count: m.comments ?? 0,
            media_shares: m.shares ?? null,
            media_saved: m.saved ?? null,
            media_url: item.media_url ?? null,
            media_permalink: item.permalink ?? null,
            media_views: m.plays ?? m.impressions ?? null,
            media_reel_video_views: m.plays ?? null,
          };
        } catch { return null; }
      }));
      for (const m of mediaRows) { if (m) rows.push(m); }
    }
  } catch (e: any) { console.warn('[Meta Direct] IG media error:', e.message); }

  // 4. Audience demographics (age, gender, country, city)
  try {
    const demoJson = await fetch(
      `${META_GRAPH_BASE}/${igUserId}/insights?metric=follower_demographics&period=lifetime&breakdown=age,gender,country,city&access_token=${token}`,
      { signal: AbortSignal.timeout(15000) }
    ).then(r => r.json()) as any;
    if (!demoJson.error && Array.isArray(demoJson.data)) {
      for (const item of demoJson.data) {
        const breakdowns = item.total_value?.breakdowns ?? [];
        for (const bd of breakdowns) {
          const dim = bd.dimension_keys?.[0];
          const results: any[] = bd.results ?? [];
          for (const r of results) {
            const val = r.dimension_values?.[0];
            const count = r.value ?? 0;
            if (dim === 'age') rows.push({ audience_age_name: val, audience_age_size: count });
            else if (dim === 'gender') rows.push({ audience_gender_name: val, audience_gender_size: count });
            else if (dim === 'country') rows.push({ audience_country_name: val, audience_country_size: count });
            else if (dim === 'city') rows.push({ city: val, audience_city_size: count });
          }
        }
      }
    }
  } catch (e: any) { console.warn('[Meta Direct] IG demographics error:', e.message); }

  return rows;
}

async function fetchYouTubeDirectData(channelId: string, token: string, dateFrom: string, dateTo: string): Promise<any[]> {
  const rows: any[] = [];
  const authHeader = { Authorization: `Bearer ${token}` };

  // 1. Daily channel analytics
  try {
    const metrics = [
      'views', 'likes', 'dislikes', 'comments', 'shares',
      'subscribersGained', 'subscribersLost', 'estimatedMinutesWatched',
      'cardClicks', 'cardImpressions', 'cardClickRate',
      'videosAddedToPlaylists', 'videosRemovedFromPlaylists',
    ].join(',');
    const url = `${YOUTUBE_ANALYTICS_BASE}/reports?ids=channel==${channelId}&startDate=${dateFrom}&endDate=${dateTo}&metrics=${metrics}&dimensions=day`;
    const json = await fetch(url, { headers: authHeader, signal: AbortSignal.timeout(30000) }).then(r => r.json()) as any;

    if (!json.error && Array.isArray(json.columnHeaders) && Array.isArray(json.rows)) {
      const cols = json.columnHeaders.map((h: any) => h.name as string);
      for (const row of json.rows) {
        const obj: any = {};
        cols.forEach((col: string, i: number) => { obj[col] = row[i]; });
        rows.push({
          date: obj.day,
          views: obj.views ?? 0,
          likes: obj.likes ?? 0,
          dislikes: obj.dislikes ?? 0,
          comments: obj.comments ?? 0,
          shares: obj.shares ?? 0,
          subscribers_gained: obj.subscribersGained ?? 0,
          subscribers_lost: obj.subscribersLost ?? 0,
          estimated_minutes_watched: obj.estimatedMinutesWatched ?? 0,
          card_clicks: obj.cardClicks ?? 0,
          card_impressions: obj.cardImpressions ?? 0,
          card_click_rate: obj.cardClickRate ?? 0,
          videos_added_to_playlists: obj.videosAddedToPlaylists ?? 0,
          videos_removed_from_playlists: obj.videosRemovedFromPlaylists ?? 0,
        });
      }
    }
  } catch (e: any) { console.warn('[YouTube Direct] Daily analytics error:', e.message); }

  // 2. Total subscriber count (current snapshot)
  try {
    const json = await fetch(
      `${YOUTUBE_DATA_BASE}/channels?part=statistics&id=${channelId}`,
      { headers: authHeader, signal: AbortSignal.timeout(10000) }
    ).then(r => r.json()) as any;
    const stats = json.items?.[0]?.statistics;
    if (stats) {
      const subscriberCount = parseInt(stats.subscriberCount) || 0;
      // Distribute subscriber_count to all daily rows
      for (const row of rows) { row.subscriber_count = subscriberCount; }
    }
  } catch (e: any) { console.warn('[YouTube Direct] Channel stats error:', e.message); }

  // 3. Per-video analytics for the period
  try {
    const videoMetrics = 'views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration,averageViewPercentage';
    const analyticsUrl = `${YOUTUBE_ANALYTICS_BASE}/reports?ids=channel==${channelId}&startDate=${dateFrom}&endDate=${dateTo}&metrics=${videoMetrics}&dimensions=video&maxResults=50&sort=-views`;
    const [analyticsJson, searchJson] = await Promise.all([
      fetch(analyticsUrl, { headers: authHeader, signal: AbortSignal.timeout(30000) }).then(r => r.json()),
      fetch(`${YOUTUBE_DATA_BASE}/search?part=snippet&channelId=${channelId}&type=video&maxResults=50&publishedAfter=${dateFrom}T00:00:00Z&publishedBefore=${dateTo}T23:59:59Z&order=date`, { headers: authHeader, signal: AbortSignal.timeout(20000) }).then(r => r.json()),
    ]) as any[];

    // Build title map from search results
    const titleMap = new Map<string, string>();
    if (!searchJson.error && Array.isArray(searchJson.items)) {
      for (const item of searchJson.items) {
        const vid = item.id?.videoId;
        if (vid) titleMap.set(vid, item.snippet?.title || vid);
      }
    }

    if (!analyticsJson.error && Array.isArray(analyticsJson.columnHeaders) && Array.isArray(analyticsJson.rows)) {
      const cols = analyticsJson.columnHeaders.map((h: any) => h.name as string);
      for (const row of analyticsJson.rows) {
        const obj: any = {};
        cols.forEach((col: string, i: number) => { obj[col] = row[i]; });
        rows.push({
          video_id: obj.video,
          video_title: titleMap.get(obj.video) || obj.video,
          views: obj.views ?? 0,
          likes: obj.likes ?? 0,
          comments: obj.comments ?? 0,
          shares: obj.shares ?? 0,
          estimated_minutes_watched: obj.estimatedMinutesWatched ?? 0,
          average_view_duration: obj.averageViewDuration ?? 0,
          average_view_percentage: obj.averageViewPercentage ?? 0,
        });
      }
    }
  } catch (e: any) { console.warn('[YouTube Direct] Video analytics error:', e.message); }

  return rows;
}

/**
 * Enrich YouTube video rows with titles & publish dates from YouTube Data API.
 * Uses the channel's OAuth token. Batches up to 50 IDs per request.
 */
async function enrichYouTubeVideoTitles(data: any[], token: string): Promise<any[]> {
  const videoIds = [...new Set(data.filter(r => r.video).map(r => r.video))] as string[];
  if (videoIds.length === 0) return data;

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${batch.join(',')}&fields=items(id,snippet(title,publishedAt))`;
      const json = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json()) as any;

      if (Array.isArray(json.items)) {
        for (const item of json.items) {
          for (const row of data) {
            if (row.video === item.id) {
              row.video_title = item.snippet.title;
              row.publish_date = item.snippet.publishedAt;
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('[YouTube] Video title enrichment failed:', e.message);
    }
  }

  return data;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { accountId, startDate, endDate, charts } = await req.json();

    if (!accountId || !startDate || !endDate || !charts || !Array.isArray(charts)) {
      return NextResponse.json({ error: 'accountId, startDate, endDate, and charts array are required' }, { status: 400 });
    }

    // Validate chart keys
    const validation = validateChartKeys(charts.map((c: any) => c.key));
    const validKeySet = new Set(chartCatalog.map(c => c.key));
    const validCharts = charts.filter((c: any) => validKeySet.has(c.key));
    if (validCharts.length === 0) {
      return NextResponse.json({ error: 'No valid chart keys', invalidKeys: validation.invalidKeys }, { status: 400 });
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

    // Resolve platform accounts — include Meta ERROR connections that have a stored token
    const connections = await prisma.integrationConnection.findMany({
      where: {
        companyId: accountId,
        OR: [
          { status: 'CONNECTED' },
          { status: 'ERROR', provider: { in: ['FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC'] } },
        ],
      },
      select: { provider: true, externalAccountId: true, metadata: true },
    });
    const platformConnections = new Map<string, { externalAccountId: string; metadata: any }>(
      connections.map(c => [c.provider, { externalAccountId: c.externalAccountId, metadata: c.metadata }])
    );
    if (!platformConnections.has('TIKTOK_ORGANIC') && company.tiktokAccountId) {
      platformConnections.set('TIKTOK_ORGANIC', { externalAccountId: company.tiktokAccountId, metadata: null });
    }
    // Keep backward-compat map for Windsor
    const platformAccounts = new Map<string, string>(
      Array.from(platformConnections.entries()).map(([p, c]) => [p, c.externalAccountId])
    );

    // Group charts by platform
    const chartsByPlatform = new Map<string, any[]>();
    for (const chartReq of validCharts) {
      const def = chartCatalog.find(c => c.key === chartReq.key);
      const plat = def?.platform || 'TIKTOK_ORGANIC';
      if (!chartsByPlatform.has(plat)) chartsByPlatform.set(plat, []);
      chartsByPlatform.get(plat)!.push(chartReq);
    }

    // Windsor API key (only needed for non-Meta platforms)
    const adminId = session.user.role === 'ADMIN' ? session.user.id : company.adminId;
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId! },
      select: { windsorApiKeyEnc: true },
    });
    const windsorApiKey = adminUser?.windsorApiKeyEnc
      ? decrypt(adminUser.windsorApiKeyEnc)
      : process.env.WINDSOR_API_KEY;

    // Fetch + generate charts per platform in parallel
    const platformResults = await Promise.all(
      Array.from(chartsByPlatform.entries()).map(async ([platform, platformCharts]) => {
        const connection = platformConnections.get(platform);
        if (!connection) {
          return platformCharts.map((c: any) => ({ key: c.key, empty: true, error: 'Nincs kapcsolat ehhez a platformhoz' }));
        }
        try {
          let data: any[];

          if (platform === 'YOUTUBE' && (connection.metadata as any)?.encryptedAccessToken) {
            // Try YouTube Analytics API directly, fall back to Windsor if it fails
            try {
              const token = decrypt((connection.metadata as any).encryptedAccessToken as string);
              console.log(`[Chart API] YouTube direct fetch for channel ${connection.externalAccountId}`);
              data = await fetchYouTubeDirectData(connection.externalAccountId, token, startDate, endDate);
              if (!data || data.length === 0) throw new Error('YouTube direct returned no data');
            } catch (ytErr: any) {
              console.warn(`[Chart API] YouTube direct failed (${ytErr.message}), falling back to Windsor`);
              if (!windsorApiKey) {
                return platformCharts.map((c: any) => ({ key: c.key, empty: true, error: 'Windsor API key not configured' }));
              }
              data = await fetchWindsorChartData(windsorApiKey, platform, connection.externalAccountId, startDate, endDate);
            }
          } else if (META_DIRECT_PROVIDERS.has(platform) && (connection.metadata as any)?.encryptedAccessToken) {
            // Use Meta Graph API directly
            console.log(`[Chart API] Meta direct fetch for ${platform}`);
            data = (await fetchMetaDirectData(platform, connection, startDate, endDate)) ?? [];
          } else {
            if (!windsorApiKey) {
              return platformCharts.map((c: any) => ({ key: c.key, empty: true, error: 'Windsor API key not configured' }));
            }
            console.log(`[Chart API] Windsor fetch for ${platform}`);
            data = await fetchWindsorChartData(windsorApiKey, platform, connection.externalAccountId, startDate, endDate);
          }

          // Enrich YouTube video data with titles from YouTube Data API
          if (platform === 'YOUTUBE' && (connection.metadata as any)?.encryptedAccessToken) {
            try {
              const token = decrypt((connection.metadata as any).encryptedAccessToken as string);
              data = await enrichYouTubeVideoTitles(data, token);
            } catch { /* title enrichment is best-effort */ }
          }

          const generator = new ChartGenerator(data, startDate, endDate);
          return platformCharts.map((c: any) => {
            try { return generator.generate(c.key, c.params || {}); }
            catch (e: any) { return { key: c.key, error: e.message, empty: true }; }
          });
        } catch (e: any) {
          console.error(`[CHART API] ${platform} error:`, e.message);
          return platformCharts.map((c: any) => ({ key: c.key, error: e.message, empty: true }));
        }
      })
    );

    const results = platformResults.flat();
    return NextResponse.json({
      account: { id: company.id, name: company.name },
      dateRange: { from: startDate, to: endDate },
      chartsRequested: validCharts.length,
      chartsGenerated: results.filter((r: any) => !r.error).length,
      charts: results,
    });
  } catch (error: any) {
    console.error('Chart generation error:', error);
    return NextResponse.json({ error: 'Failed to generate charts', details: error.message }, { status: 500 });
  }
}
