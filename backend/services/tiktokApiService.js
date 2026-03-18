// ============================================
// TIKTOK API SERVICE
// Direct TikTok API v2 calls for video list & user info
// ============================================

const axios = require('axios');

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

/**
 * Refresh an expired TikTok access token using the refresh token.
 * Returns { access_token, refresh_token, expires_in, open_id }.
 */
async function refreshAccessToken(refreshToken) {
  const response = await axios.post(`${TIKTOK_API_BASE}/oauth/token/`, {
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  const data = response.data?.data || response.data;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in || null,
    open_id: data.open_id || null,
  };
}

/**
 * Get user info (display name, avatar, follower count, etc.).
 * Requires scopes: user.info.basic + user.info.stats
 *
 * user.info.basic → display_name, avatar_url
 * user.info.stats → follower_count, following_count, likes_count, video_count
 */
async function getUserInfo(accessToken) {
  const response = await axios.get(`${TIKTOK_API_BASE}/user/info/`, {
    params: {
      fields: 'display_name,avatar_url,follower_count,following_count,likes_count,video_count',
    },
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });

  const data = response.data?.data?.user || response.data?.data || {};
  return data;
}

/**
 * List user's videos with metrics.
 * Requires scope: video.list
 * Returns all pages of results.
 *
 * Each video includes: id, title, video_description, duration, cover_image_url,
 * embed_link, create_time, like_count, comment_count, share_count, view_count
 */
async function listVideos(accessToken, maxCount = 200) {
  const allVideos = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore && allVideos.length < maxCount) {
    const body = {
      max_count: 20,
    };
    if (cursor) {
      body.cursor = cursor;
    }

    const response = await axios.post(`${TIKTOK_API_BASE}/video/list/`, body, {
      params: {
        fields: 'id,title,video_description,duration,cover_image_url,embed_link,create_time,like_count,comment_count,share_count,view_count',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const data = response.data?.data || {};
    const videos = data.videos || [];
    allVideos.push(...videos);

    hasMore = data.has_more === true;
    cursor = data.cursor || null;

    if (videos.length === 0) break;
  }

  return allVideos;
}

module.exports = {
  refreshAccessToken,
  getUserInfo,
  listVideos,
};
