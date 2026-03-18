// ============================================
// TIKTOK DATA ADAPTER
// Fetches data from TikTok API v2 and transforms
// it to Windsor-compatible row format so ChartGenerator
// can consume it without any changes.
//
// TikTok API v2 provides (video.list + user.info.stats):
//   - Per-video: id, title, description, create_time, view_count, like_count,
//     comment_count, share_count, duration, cover_image_url, embed_link
//   - User stats: follower_count, following_count, likes_count, video_count
//
// Windsor provides additionally:
//   - Daily: profile_views, bio_link_clicks, email_clicks, engaged_audience
//   - Per-video extras: reach, new_followers, full_watched_rate, avg/total time watched
//   - Audience: activity_hour/count, ages, genders, impression_sources
//
// Strategy: fetch TikTok API for fresh video metrics + user stats,
// then merge with Windsor data for audience/daily-only fields.
// ============================================

const { decrypt } = require('../utils/encryption');
const tiktokApiService = require('./tiktokApiService');

/**
 * Attempt to get a valid access token, refreshing if expired.
 * Returns { accessToken, refreshed, newTokens } or null on failure.
 */
async function resolveAccessToken(meta) {
  if (!meta?.encryptedAccessToken) return null;

  const accessToken = decrypt(meta.encryptedAccessToken);

  // Try a lightweight call to verify token
  try {
    await tiktokApiService.getUserInfo(accessToken);
    return { accessToken, refreshed: false };
  } catch (err) {
    if (err.response?.status !== 401 || !meta.encryptedRefreshToken) {
      console.warn('[TikTok API] Token check failed:', err.response?.status || err.message);
      return null;
    }
  }

  // Token expired — try refresh
  try {
    console.log('[TikTok API] Token expired, refreshing...');
    const refreshToken = decrypt(meta.encryptedRefreshToken);
    const newTokens = await tiktokApiService.refreshAccessToken(refreshToken);
    console.log('[TikTok API] Token refreshed OK');
    return { accessToken: newTokens.access_token, refreshed: true, newTokens };
  } catch (refreshErr) {
    console.error('[TikTok API] Refresh failed:', refreshErr.message);
    return null;
  }
}

/**
 * Fetch TikTok data via direct API and return Windsor-compatible rows.
 * Returns video-level rows + a daily aggregate row with user stats.
 */
async function fetchTiktokData(connection, dateFrom, dateTo) {
  const meta = connection.metadata;
  const tokenResult = await resolveAccessToken(meta);
  if (!tokenResult) return null;

  const { accessToken } = tokenResult;

  let userInfo, videos;
  try {
    [userInfo, videos] = await Promise.all([
      tiktokApiService.getUserInfo(accessToken).catch(() => null),
      tiktokApiService.listVideos(accessToken),
    ]);
  } catch (err) {
    console.error('[TikTok API] Fetch failed:', err.message);
    return null;
  }

  if (!videos || videos.length === 0) {
    console.log('[TikTok API] No videos returned');
    return null;
  }

  const rows = [];
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  // Include the full end date
  endDate.setHours(23, 59, 59, 999);

  // Filter videos within date range and convert to Windsor format
  for (const video of videos) {
    const createTime = video.create_time
      ? new Date(video.create_time * 1000) // TikTok uses unix timestamp
      : null;

    if (!createTime) continue;
    if (createTime < startDate || createTime > endDate) continue;

    const dateStr = createTime.toISOString().slice(0, 10);

    rows.push({
      date: dateStr,
      video_id: video.id,
      video_caption: video.title || video.video_description || '',
      video_create_datetime: createTime.toISOString(),
      video_views_count: video.view_count ?? 0,
      video_likes: video.like_count ?? 0,
      video_comments: video.comment_count ?? 0,
      video_shares: video.share_count ?? 0,
      video_reach: video.view_count ?? 0,
      video_embed_url: video.embed_link || null,
      video_duration: video.duration ?? null,
      // Not available from TikTok API v2
      video_new_followers: null,
      video_full_watched_rate: null,
      video_average_time_watched: null,
      video_total_time_watched: null,
    });
  }

  // Aggregate daily totals from video data
  const dailyMap = new Map();
  for (const row of rows) {
    if (!dailyMap.has(row.date)) {
      dailyMap.set(row.date, { date: row.date, likes: 0, comments: 0, shares: 0 });
    }
    const day = dailyMap.get(row.date);
    day.likes += row.video_likes || 0;
    day.comments += row.video_comments || 0;
    day.shares += row.video_shares || 0;
  }

  // Add daily aggregate rows with user stats (follower_count from user.info.stats scope)
  for (const day of dailyMap.values()) {
    rows.push({
      date: day.date,
      likes: day.likes,
      comments: day.comments,
      shares: day.shares,
      followers_count: 0,
      total_followers_count: userInfo?.follower_count ?? 0,
      profile_views: 0, // only available via Windsor
    });
  }

  console.log(`[TikTok API] ${videos.length} total videos, ${rows.length} Windsor-compat rows (${dateFrom} → ${dateTo})`);
  return rows;
}

/**
 * Merge TikTok API rows with Windsor rows.
 * TikTok API wins for video-level fields (fresher data),
 * Windsor wins for fields the API doesn't provide (audience, daily aggregates).
 */
function mergeTiktokAndWindsor(tiktokRows, windsorRows) {
  if (!tiktokRows || tiktokRows.length === 0) return windsorRows;
  if (!windsorRows || windsorRows.length === 0) return tiktokRows;

  // Index TikTok API video rows by video_id for fast lookup
  const tiktokVideoMap = new Map();
  const tiktokDailyRows = [];
  const tiktokOtherRows = [];

  for (const row of tiktokRows) {
    if (row.video_id) {
      tiktokVideoMap.set(row.video_id, row);
    } else if (row.likes !== undefined) {
      tiktokDailyRows.push(row);
    } else {
      tiktokOtherRows.push(row);
    }
  }

  const mergedRows = [];

  for (const wRow of windsorRows) {
    if (wRow.video_id && tiktokVideoMap.has(wRow.video_id)) {
      // Merge: TikTok API metrics override, Windsor fills gaps
      const tRow = tiktokVideoMap.get(wRow.video_id);
      tiktokVideoMap.delete(wRow.video_id);
      mergedRows.push({
        ...wRow,
        // TikTok API provides fresher engagement counts
        video_views_count: tRow.video_views_count ?? wRow.video_views_count,
        video_likes: tRow.video_likes ?? wRow.video_likes,
        video_comments: tRow.video_comments ?? wRow.video_comments,
        video_shares: tRow.video_shares ?? wRow.video_shares,
        video_embed_url: tRow.video_embed_url || wRow.video_embed_url,
        video_duration: tRow.video_duration ?? wRow.video_duration,
        // Windsor-only fields preserved
        video_reach: wRow.video_reach ?? tRow.video_reach,
        video_new_followers: wRow.video_new_followers,
        video_full_watched_rate: wRow.video_full_watched_rate,
        video_average_time_watched: wRow.video_average_time_watched,
        video_total_time_watched: wRow.video_total_time_watched,
      });
    } else {
      // Windsor-only row (audience, demographics, daily, etc.) — keep as-is
      mergedRows.push(wRow);
    }
  }

  // Add TikTok API videos not in Windsor (new videos uploaded since last Windsor sync)
  for (const tRow of tiktokVideoMap.values()) {
    mergedRows.push(tRow);
  }

  return mergedRows;
}

/**
 * Main entry point.
 * Returns TikTok API rows for TIKTOK_ORGANIC,
 * or null if no direct token (should fall back to Windsor).
 */
async function fetchTiktokChartData(provider, connection, dateFrom, dateTo) {
  if (provider === 'TIKTOK_ORGANIC') {
    return fetchTiktokData(connection, dateFrom, dateTo);
  }
  return null;
}

module.exports = { fetchTiktokChartData, mergeTiktokAndWindsor };
