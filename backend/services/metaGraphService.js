// ============================================
// META GRAPH API SERVICE - Facebook & Instagram account discovery
// ============================================

const axios = require('axios');

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

/**
 * Discover Facebook pages the user manages.
 * Requires: pages_show_list scope
 * Returns: [{ accountId, accountName, category, pageAccessToken }]
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
 * Discover Instagram Business accounts linked to the user's Facebook pages.
 * Requires: instagram_basic, pages_show_list scopes
 * Returns: [{ accountId, accountName, username, pageId }]
 */
async function discoverInstagramAccounts(accessToken) {
  // First get pages, then query each for linked IG business account
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
      // Page might not have IG business account linked — skip
      console.warn(`No IG business account for page ${page.accountId}: ${err.message}`);
    }
  }

  return igAccounts;
}

/**
 * Get the authenticated user's basic info.
 * Returns: { userId, name }
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

module.exports = {
  discoverFacebookPages,
  discoverInstagramAccounts,
  getMe,
};
