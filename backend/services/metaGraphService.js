// ============================================
// META GRAPH API SERVICE
// Facebook & Instagram organic + Ads (Marketing API)
// ============================================

const axios = require('axios');

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

// ---- HELPERS ----

async function fetchAllPages(url, params) {
  const results = [];
  let nextUrl = url;
  let nextParams = params;
  while (nextUrl) {
    const response = await axios.get(nextUrl, { params: nextParams, timeout: 20000 });
    const data = response.data?.data || [];
    results.push(...data);
    nextUrl = response.data?.paging?.next || null;
    nextParams = null; // next URL already contains params
  }
  return results;
}

// ---- TOKEN MANAGEMENT ----

/**
 * Exchange a short-lived user token for a long-lived one (~60 days).
 * Call this immediately after OAuth code exchange.
 */
async function exchangeLongLivedToken(shortLivedToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    },
    timeout: 15000,
  });
  return {
    access_token: response.data.access_token,
    expires_in: response.data.expires_in || 5184000, // default 60 days
  };
}

/**
 * Get a Page-specific access token from a user access token.
 * Page tokens derived from long-lived user tokens never expire.
 */
async function getPageAccessToken(userAccessToken, pageId) {
  const response = await axios.get(`${GRAPH_API_BASE}/${pageId}`, {
    params: {
      access_token: userAccessToken,
      fields: 'access_token',
    },
    timeout: 10000,
  });
  return response.data.access_token;
}

// ---- DISCOVERY ----

/**
 * Discover Facebook Pages the user manages.
 * Requires: pages_show_list
 */
async function discoverFacebookPages(accessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
    params: {
      access_token: accessToken,
      fields: 'id,name,category,access_token',
      limit: 100,
    },
    timeout: 15000,
  });

  const pages = response.data?.data || [];
  return pages.map((page) => ({
    accountId: page.id,
    accountName: page.name,
    category: page.category || null,
    pageAccessToken: page.access_token || null,
  }));
}

/**
 * Discover Instagram Business accounts linked to the user's Facebook Pages.
 * Requires: instagram_basic, pages_show_list
 */
async function discoverInstagramAccounts(accessToken) {
  const pages = await discoverFacebookPages(accessToken);
  const igAccounts = [];

  for (const page of pages) {
    try {
      const response = await axios.get(`${GRAPH_API_BASE}/${page.accountId}`, {
        params: {
          access_token: accessToken,
          fields: 'instagram_business_account{id,name,username,profile_picture_url}',
        },
        timeout: 10000,
      });

      const igAccount = response.data?.instagram_business_account;
      if (igAccount) {
        igAccounts.push({
          accountId: igAccount.id,
          accountName: igAccount.name || igAccount.username || page.accountName,
          username: igAccount.username || null,
          pageId: page.accountId,
        });
      }
    } catch (err) {
      console.warn(`No IG business account for page ${page.accountId}: ${err.message}`);
    }
  }

  return igAccounts;
}

/**
 * Discover Facebook Ad Accounts the user has access to.
 * Requires: ads_read
 */
async function discoverAdAccounts(accessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/me/adaccounts`, {
    params: {
      access_token: accessToken,
      fields: 'id,name,account_status,currency,timezone_name',
      limit: 100,
    },
    timeout: 15000,
  });

  const accounts = response.data?.data || [];
  return accounts
    .filter((acc) => acc.account_status === 1) // 1 = active
    .map((acc) => ({
      accountId: acc.id, // format: act_XXXXXXXXX
      accountName: acc.name,
      currency: acc.currency,
      timezone: acc.timezone_name,
    }));
}

/**
 * Get the authenticated user's basic info.
 */
async function getMe(accessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/me`, {
    params: {
      access_token: accessToken,
      fields: 'id,name',
    },
    timeout: 10000,
  });

  return {
    userId: response.data.id,
    name: response.data.name,
  };
}

// ---- FACEBOOK PAGE ORGANIC ----

/**
 * Daily page-level insights.
 * Returns [{date, page_impressions, page_impressions_unique, page_views_total, page_fans, ...}]
 */
async function getFacebookDailyInsights(pageId, pageAccessToken, dateFrom, dateTo) {
  const metric = [
    'page_impressions',
    'page_impressions_unique',
    'page_views_total',
    'page_fans',
    'page_daily_follows',
    'page_daily_unfollows',
    'page_post_engagements',
    'page_video_views',
  ].join(',');

  const response = await axios.get(`${GRAPH_API_BASE}/${pageId}/insights`, {
    params: {
      access_token: pageAccessToken,
      metric,
      period: 'day',
      since: dateFrom,
      until: dateTo,
    },
    timeout: 20000,
  });

  const byDate = {};
  for (const item of response.data?.data || []) {
    for (const v of item.values || []) {
      const date = v.end_time?.slice(0, 10);
      if (!date) continue;
      if (!byDate[date]) byDate[date] = { date };
      byDate[date][item.name] = v.value;
    }
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Posts with lifetime insights (impressions, reach, reactions, clicks, shares).
 * Returns [{post_id, post_message, post_created_time, post_impressions, post_reach, ...}]
 */
async function getFacebookPostInsights(pageId, pageAccessToken, dateFrom, dateTo) {
  const fields = [
    'id',
    'message',
    'story',
    'created_time',
    'full_picture',
    'permalink_url',
    'insights.metric(post_impressions,post_impressions_unique,post_clicks,post_reactions_by_type_total,post_shares).period(lifetime)',
  ].join(',');

  const posts = await fetchAllPages(`${GRAPH_API_BASE}/${pageId}/published_posts`, {
    access_token: pageAccessToken,
    fields,
    since: dateFrom,
    until: dateTo,
    limit: 100,
  });

  return posts.map((post) => {
    const insights = {};
    for (const item of post.insights?.data || []) {
      insights[item.name] = item.values?.[0]?.value ?? null;
    }
    const reactionsObj = insights.post_reactions_by_type_total || {};
    return {
      post_id: post.id,
      post_message: post.message || post.story || null,
      post_created_time: post.created_time,
      post_permalink: post.permalink_url || null,
      post_picture: post.full_picture || null,
      post_impressions: insights.post_impressions ?? null,
      post_reach: insights.post_impressions_unique ?? null,
      post_clicks: insights.post_clicks ?? null,
      post_shares: insights.post_shares?.count ?? null,
      post_reactions: Object.values(reactionsObj).reduce((a, b) => a + b, 0),
      post_reactions_detail: reactionsObj,
    };
  });
}

/**
 * Audience demographics: gender/age, city, country.
 * Returns { page_fans_gender_age, page_fans_city, page_fans_country }
 */
async function getFacebookDemographics(pageId, pageAccessToken) {
  const metric = ['page_fans_gender_age', 'page_fans_city', 'page_fans_country'].join(',');
  const response = await axios.get(`${GRAPH_API_BASE}/${pageId}/insights`, {
    params: {
      access_token: pageAccessToken,
      metric,
      period: 'lifetime',
    },
    timeout: 15000,
  });

  const result = {};
  for (const item of response.data?.data || []) {
    result[item.name] = item.values?.[0]?.value || {};
  }
  return result;
}

// ---- INSTAGRAM ORGANIC ----

/**
 * Daily Instagram account insights.
 * Returns [{date, impressions, reach, profile_views, follower_count, ...}]
 */
async function getInstagramDailyInsights(igUserId, userAccessToken, dateFrom, dateTo) {
  const metric = [
    'impressions',
    'reach',
    'profile_views',
    'follower_count',
    'email_contacts',
    'website_clicks',
    'phone_call_clicks',
    'text_message_clicks',
    'get_directions_clicks',
  ].join(',');

  const response = await axios.get(`${GRAPH_API_BASE}/${igUserId}/insights`, {
    params: {
      access_token: userAccessToken,
      metric,
      period: 'day',
      since: dateFrom,
      until: dateTo,
    },
    timeout: 20000,
  });

  const byDate = {};
  for (const item of response.data?.data || []) {
    for (const v of item.values || []) {
      const date = v.end_time?.slice(0, 10);
      if (!date) continue;
      if (!byDate[date]) byDate[date] = { date };
      byDate[date][item.name] = v.value;
    }
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Instagram media (posts, reels) with per-item insights.
 * Returns [{media_id, media_caption, timestamp, media_type, impressions, reach, saved, ...}]
 */
async function getInstagramMediaInsights(igUserId, userAccessToken, dateFrom, dateTo) {
  const mediaList = await fetchAllPages(`${GRAPH_API_BASE}/${igUserId}/media`, {
    access_token: userAccessToken,
    fields: 'id,caption,timestamp,media_type,thumbnail_url,media_url,permalink,like_count,comments_count',
    since: dateFrom,
    until: dateTo,
    limit: 50,
  });

  const results = [];
  for (const media of mediaList) {
    try {
      const isVideo = media.media_type === 'VIDEO' || media.media_type === 'REEL';
      const metrics = ['impressions', 'reach', 'saved', 'shares', ...(isVideo ? ['plays', 'video_views'] : [])];

      const insightRes = await axios.get(`${GRAPH_API_BASE}/${media.id}/insights`, {
        params: {
          access_token: userAccessToken,
          metric: metrics.join(','),
        },
        timeout: 10000,
      });

      const insights = {};
      for (const item of insightRes.data?.data || []) {
        insights[item.name] = item.values?.[0]?.value ?? null;
      }

      results.push({
        media_id: media.id,
        media_caption: media.caption || null,
        timestamp: media.timestamp,
        media_type: media.media_type,
        media_url: media.media_url || media.thumbnail_url || null,
        media_permalink: media.permalink || null,
        media_like_count: media.like_count || 0,
        media_comments_count: media.comments_count || 0,
        media_impressions: insights.impressions ?? null,
        media_reach: insights.reach ?? null,
        media_saved: insights.saved ?? null,
        media_shares: insights.shares ?? null,
        media_plays: insights.plays || insights.video_views || null,
      });
    } catch (err) {
      console.warn(`No insights for media ${media.id}: ${err.message}`);
    }
  }
  return results;
}

/**
 * Instagram audience demographics: gender/age, city, country.
 */
async function getInstagramDemographics(igUserId, userAccessToken) {
  const metric = ['audience_gender_age', 'audience_city', 'audience_country'].join(',');
  const response = await axios.get(`${GRAPH_API_BASE}/${igUserId}/insights`, {
    params: {
      access_token: userAccessToken,
      metric,
      period: 'lifetime',
    },
    timeout: 15000,
  });

  const result = {};
  for (const item of response.data?.data || []) {
    result[item.name] = item.values?.[0]?.value || {};
  }
  return result;
}

// ---- FACEBOOK ADS (MARKETING API) ----

/**
 * Ad account insights broken down by campaign / adset / ad.
 * level: 'campaign' | 'adset' | 'ad'
 * Returns [{campaign_name, impressions, reach, spend, clicks, cpc, cpm, ctr, conversions, ...}]
 */
async function getAdInsights(adAccountId, userAccessToken, dateFrom, dateTo, level = 'campaign') {
  const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const fields = [
    'campaign_name',
    'adset_name',
    'ad_name',
    'impressions',
    'reach',
    'frequency',
    'spend',
    'clicks',
    'cpc',
    'cpm',
    'ctr',
    'actions',
    'cost_per_action_type',
  ].join(',');

  const response = await axios.get(`${GRAPH_API_BASE}/${accountId}/insights`, {
    params: {
      access_token: userAccessToken,
      fields,
      level,
      time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
      limit: 500,
    },
    timeout: 30000,
  });

  return (response.data?.data || []).map((row) => {
    const actions = row.actions || [];
    const costPerAction = row.cost_per_action_type || [];
    const conversions =
      actions.find((a) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0;
    const costPerConversion =
      costPerAction.find((a) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || null;

    return {
      campaign_name: row.campaign_name || null,
      adset_name: row.adset_name || null,
      ad_name: row.ad_name || null,
      impressions: parseInt(row.impressions || 0),
      reach: parseInt(row.reach || 0),
      frequency: parseFloat(row.frequency || 0),
      spend: parseFloat(row.spend || 0),
      clicks: parseInt(row.clicks || 0),
      cpc: parseFloat(row.cpc || 0),
      cpm: parseFloat(row.cpm || 0),
      ctr: parseFloat(row.ctr || 0),
      conversions: parseInt(conversions),
      cost_per_conversion: costPerConversion ? parseFloat(costPerConversion) : null,
    };
  });
}

module.exports = {
  // Token management
  exchangeLongLivedToken,
  getPageAccessToken,
  // Discovery
  discoverFacebookPages,
  discoverInstagramAccounts,
  discoverAdAccounts,
  getMe,
  // Facebook organic
  getFacebookDailyInsights,
  getFacebookPostInsights,
  getFacebookDemographics,
  // Instagram organic
  getInstagramDailyInsights,
  getInstagramMediaInsights,
  getInstagramDemographics,
  // Facebook Ads
  getAdInsights,
};
