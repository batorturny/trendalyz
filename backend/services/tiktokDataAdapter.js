// ============================================
// TIKTOK DATA ADAPTER
// Fetches data from TikTok API v2 and transforms
// it to Windsor-compatible row format so ChartGenerator
// can consume it without any changes.
// ============================================

const { decrypt } = require('../utils/encryption');
const tiktokApiService = require('./tiktokApiService');

/**
 * Fetch TikTok data via direct API and return Windsor-compatible rows.
 *
 * Windsor TIKTOK_ORGANIC row shape:
 *   Daily: { date, likes, comments, shares, followers_count, profile_views, total_followers_count }
 *   Videos: { date, video_id, video_caption, video_create_datetime, video_views_count,
 *             video_likes, video_comments, video_shares, video_reach, video_embed_url,
 *             video_new_followers, video_full_watched_rate }
 */
async function fetchTiktokData(connection, dateFrom, dateTo) {
  const meta = connection.metadata;
  if (!meta?.encryptedAccessToken) return null; // no direct token → fall back to Windsor

  let accessToken = decrypt(meta.encryptedAccessToken);

  // Try to get user info + video list
  let userInfo;
  let videos;

  try {
    [userInfo, videos] = await Promise.all([
      tiktokApiService.getUserInfo(accessToken).catch(err => {
        console.warn('[TikTok API] getUserInfo failed:', err.message);
        return null;
      }),
      tiktokApiService.listVideos(accessToken),
    ]);
  } catch (err) {
    // If token expired, try refresh
    if (err.response?.status === 401 && meta.encryptedRefreshToken) {
      console.log('[TikTok API] Token expired, attempting refresh...');
      try {
        const refreshToken = decrypt(meta.encryptedRefreshToken);
        const newTokens = await tiktokApiService.refreshAccessToken(refreshToken);
        accessToken = newTokens.access_token;

        // Retry with refreshed token
        [userInfo, videos] = await Promise.all([
          tiktokApiService.getUserInfo(accessToken).catch(() => null),
          tiktokApiService.listVideos(accessToken),
        ]);

        // Note: token update in DB should be handled by caller if needed
        console.log('[TikTok API] Token refreshed successfully');
      } catch (refreshErr) {
        console.error('[TikTok API] Token refresh failed:', refreshErr.message);
        return null; // fall back to Windsor
      }
    } else {
      console.error('[TikTok API] Fetch failed:', err.message);
      return null; // fall back to Windsor
    }
  }

  if (!videos || videos.length === 0) {
    console.log('[TikTok API] No videos returned, falling back to Windsor');
    return null;
  }

  const rows = [];
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  // Filter videos within date range and convert to Windsor format
  for (const video of videos) {
    const createTime = video.create_time
      ? new Date(video.create_time * 1000) // TikTok uses unix timestamp
      : null;

    if (!createTime) continue;

    // Only include videos within the requested date range
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
      video_reach: video.view_count ?? 0, // TikTok API doesn't give reach separately
      video_embed_url: video.embed_link || null,
      video_duration: video.duration ?? null,
      // Fields not available from TikTok API v2 video.list
      video_new_followers: null,
      video_full_watched_rate: null,
      video_average_time_watched: null,
      video_total_time_watched: null,
    });
  }

  // Aggregate daily rows from video data
  const dailyMap = new Map();
  for (const row of rows) {
    if (!dailyMap.has(row.date)) {
      dailyMap.set(row.date, {
        date: row.date,
        likes: 0,
        comments: 0,
        shares: 0,
        followers_count: 0,
        total_followers_count: userInfo?.follower_count ?? 0,
        profile_views: 0,
      });
    }
    const day = dailyMap.get(row.date);
    day.likes += row.video_likes || 0;
    day.comments += row.video_comments || 0;
    day.shares += row.video_shares || 0;
  }

  // Add daily aggregate rows
  const dailyRows = Array.from(dailyMap.values());
  rows.push(...dailyRows);

  console.log(`[TikTok API] Fetched ${videos.length} videos, ${rows.length} Windsor-compat rows (${dateFrom} → ${dateTo})`);

  return rows;
}

/**
 * Main entry point.
 * Returns Windsor-compatible rows for TIKTOK_ORGANIC,
 * or null if the connection has no direct token (should fall back to Windsor).
 */
async function fetchTiktokChartData(provider, connection, dateFrom, dateTo) {
  if (provider === 'TIKTOK_ORGANIC') {
    return fetchTiktokData(connection, dateFrom, dateTo);
  }
  return null;
}

module.exports = { fetchTiktokChartData };
