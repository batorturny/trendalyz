// ============================================
// META DATA ADAPTER
// Fetches data from Meta Graph API and transforms
// it to Windsor-compatible row format so ChartGenerator
// can consume it without any changes.
// ============================================

const { decrypt } = require('../utils/encryption');
const metaGraphService = require('./metaGraphService');

/**
 * Resolve page access token from connection metadata.
 * Prefers stored page token, falls back to deriving from user token.
 */
async function resolvePageToken(connection) {
  const meta = connection.metadata;
  if (!meta?.encryptedAccessToken) {
    throw new Error('No access token stored for this Facebook connection');
  }

  const userToken = decrypt(meta.encryptedAccessToken);

  if (meta.encryptedPageAccessToken) {
    return decrypt(meta.encryptedPageAccessToken);
  }

  // Derive page access token from user token (always works with long-lived token)
  const pageId = meta.pageId || connection.externalAccountId;
  try {
    return await metaGraphService.getPageAccessToken(userToken, pageId);
  } catch {
    return userToken; // last resort fallback
  }
}

/**
 * Fetch Facebook Page data and return Windsor-compatible rows.
 *
 * Windsor FACEBOOK_ORGANIC row shape:
 *   Daily: { date, impressions, reach, engaged_users, page_fans, page_views_total, reactions, comments, shares }
 *   Posts: { date, post_id, post_message, post_created_time, post_impressions, post_reach, post_reactions, post_comments, post_shares, post_clicks, post_permalink }
 */
async function fetchFacebookData(connection, dateFrom, dateTo) {
  const meta = connection.metadata;
  if (!meta?.encryptedAccessToken) return null; // no direct token → fall back to Windsor

  const pageToken = await resolvePageToken(connection);
  const pageId = connection.externalAccountId;

  const [daily, posts] = await Promise.all([
    metaGraphService.getFacebookDailyInsights(pageId, pageToken, dateFrom, dateTo),
    metaGraphService.getFacebookPostInsights(pageId, pageToken, dateFrom, dateTo),
  ]);

  const rows = [];

  // Daily aggregate rows
  for (const day of daily) {
    rows.push({
      date: day.date,
      impressions: day.page_impressions ?? 0,
      reach: day.page_impressions_unique ?? 0,
      engaged_users: day.page_post_engagements ?? 0,
      page_fans: day.page_fans ?? 0,
      page_views_total: day.page_views_total ?? 0,
      page_daily_follows: day.page_daily_follows ?? 0,
      page_daily_unfollows: day.page_daily_unfollows ?? 0,
      page_video_views: day.page_video_views ?? 0,
      // Windsor-compat aliases
      reactions: 0,
      comments: 0,
      shares: 0,
    });
  }

  // Post-level rows
  for (const post of posts) {
    const date = post.post_created_time?.slice(0, 10) || dateFrom;
    rows.push({
      date,
      post_id: post.post_id,
      post_message: post.post_message,
      post_created_time: post.post_created_time,
      post_impressions: post.post_impressions ?? null,
      post_reach: post.post_reach ?? null,
      post_reactions: post.post_reactions ?? null,
      post_comments: null,
      post_shares: post.post_shares ?? null,
      post_clicks: post.post_clicks ?? null,
      post_permalink: post.post_permalink ?? null,
    });
  }

  return rows;
}

/**
 * Fetch Instagram account data and return Windsor-compatible rows.
 *
 * Windsor INSTAGRAM_ORGANIC row shape:
 *   Daily: { date, impressions, reach, profile_views, follower_count, follower_count_1d, website_clicks_1d }
 *   Media: { date, media_id, media_caption, timestamp, media_reach, media_like_count, media_comments_count, media_shares, media_saved, media_url, media_permalink }
 */
async function fetchInstagramData(connection, dateFrom, dateTo) {
  const meta = connection.metadata;
  if (!meta?.encryptedAccessToken) return null;

  const userToken = decrypt(meta.encryptedAccessToken);
  const igUserId = connection.externalAccountId;

  const [daily, media] = await Promise.all([
    metaGraphService.getInstagramDailyInsights(igUserId, userToken, dateFrom, dateTo),
    metaGraphService.getInstagramMediaInsights(igUserId, userToken, dateFrom, dateTo),
  ]);

  const rows = [];

  // Daily aggregate rows
  for (const day of daily) {
    rows.push({
      date: day.date,
      impressions: day.impressions ?? 0,
      reach: day.reach ?? 0,
      profile_views: day.profile_views ?? 0,
      follower_count: day.follower_count ?? 0,
      follower_count_1d: day.follower_count ?? 0,
      website_clicks_1d: day.website_clicks ?? 0,
      email_contacts_1d: day.email_contacts ?? 0,
      phone_call_clicks_1d: day.phone_call_clicks ?? 0,
    });
  }

  // Media rows
  for (const item of media) {
    rows.push({
      date: item.timestamp?.slice(0, 10) || dateFrom,
      media_id: item.media_id,
      media_caption: item.media_caption,
      timestamp: item.timestamp,
      media_reach: item.media_reach ?? null,
      media_like_count: item.media_like_count ?? 0,
      media_comments_count: item.media_comments_count ?? 0,
      media_shares: item.media_shares ?? null,
      media_saved: item.media_saved ?? null,
      media_url: item.media_url ?? null,
      media_permalink: item.media_permalink ?? null,
      media_views: item.media_plays ?? null,
      media_reel_video_views: item.media_plays ?? null,
    });
  }

  return rows;
}

/**
 * Main entry point.
 * Returns Windsor-compatible rows for FACEBOOK_ORGANIC or INSTAGRAM_ORGANIC,
 * or null if the connection has no direct token (should fall back to Windsor).
 */
async function fetchMetaChartData(provider, connection, dateFrom, dateTo) {
  if (provider === 'FACEBOOK_ORGANIC') {
    return fetchFacebookData(connection, dateFrom, dateTo);
  }
  if (provider === 'INSTAGRAM_ORGANIC') {
    return fetchInstagramData(connection, dateFrom, dateTo);
  }
  return null;
}

module.exports = { fetchMetaChartData };
