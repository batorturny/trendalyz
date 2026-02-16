// ============================================
// YOUTUBE DATA API SERVICE - Channel discovery
// ============================================

const axios = require('axios');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Discover YouTube channels owned by the authenticated user.
 * Requires: youtube.readonly scope
 * Returns: [{ accountId, accountName, subscriberCount, thumbnailUrl }]
 */
async function discoverChannels(accessToken) {
  const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
    params: {
      part: 'snippet,statistics',
      mine: true,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    timeout: 15000,
  });

  const channels = response.data?.items || [];
  return channels.map((channel) => ({
    accountId: channel.id,
    accountName: channel.snippet?.title || null,
    subscriberCount: channel.statistics?.subscriberCount || null,
    thumbnailUrl: channel.snippet?.thumbnails?.default?.url || null,
  }));
}

module.exports = {
  discoverChannels,
};
