// ============================================
// WINDSOR MULTI-PLATFORM SERVICE
// Platform-agnostic Windsor AI data fetching
// ============================================

const axios = require('axios');
const https = require('https');

const WINDSOR_BASE = 'https://connectors.windsor.ai';

// Force IPv4 + keep-alive to avoid Hetzner dual-stack routing issues
const httpsAgent = new https.Agent({ family: 4, keepAlive: true });

const PLATFORM_CONFIG = {
  TIKTOK_ORGANIC: {
    endpoint: 'tiktok_organic',
    dailyFields: [
      'date', 'likes', 'comments', 'shares', 'followers_count', 'profile_views',
      'total_followers_count', 'daily_lost_followers', 'daily_total_followers',
      'unique_video_views', 'total_likes', 'video_views',
      'bio_link_clicks', 'email_clicks', 'address_clicks', 'phone_number_clicks',
      'app_download_clicks', 'lead_submissions',
    ],
    contentFields: [
      'date', 'video_id', 'video_caption', 'video_create_datetime',
      'video_views_count', 'video_likes', 'video_comments', 'video_shares',
      'video_reach', 'video_embed_url', 'video_new_followers', 'video_full_watched_rate',
      'video_favorites', 'video_duration', 'video_average_time_watched', 'video_total_time_watched',
      'video_profile_views', 'video_share_url', 'video_thumbnail_url',
      'video_website_clicks', 'video_email_clicks', 'video_address_clicks',
      'video_app_download_clicks', 'video_phone_number_clicks', 'video_lead_submissions',
    ],
    audienceFields: ['date', 'audience_activity_count', 'audience_activity_hour'],
    demographicFields: {
      age: ['audience_ages_age', 'audience_ages_percentage', 'date'],
      gender: ['video_audience_genders_gender', 'video_audience_genders_percentage', 'date'],
      country: ['audience_countries_country', 'audience_countries_percentage', 'date'],
      city: ['audience_cities_city_name', 'audience_cities_percentage', 'date'],
    },
    // Split into separate API calls to avoid Windsor mixing different data dimensions
    separateChartCalls: {
      daily: [
        'date', 'likes', 'comments', 'shares', 'followers_count', 'profile_views',
        'total_followers_count', 'daily_lost_followers', 'daily_total_followers',
        'unique_video_views', 'total_likes', 'video_views',
        'bio_link_clicks', 'email_clicks', 'address_clicks', 'phone_number_clicks',
        'app_download_clicks', 'lead_submissions',
      ],
      content: [
        'date', 'video_id', 'video_caption', 'video_create_datetime', 'video_embed_url',
        'video_views_count', 'video_reach', 'video_likes', 'video_comments',
        'video_shares', 'video_new_followers', 'video_full_watched_rate',
        'video_favorites', 'video_duration', 'video_average_time_watched', 'video_total_time_watched',
        'video_profile_views', 'video_share_url', 'video_thumbnail_url',
        'video_website_clicks', 'video_email_clicks', 'video_address_clicks',
        'video_app_download_clicks', 'video_phone_number_clicks', 'video_lead_submissions',
        'video_impression_sources_impression_source', 'video_impression_sources_percentage',
      ],
      audience_activity: [
        'date', 'audience_activity_hour', 'audience_activity_count',
      ],
      audience_age: ['audience_ages_age', 'audience_ages_percentage', 'date'],
      audience_gender: ['video_audience_genders_gender', 'video_audience_genders_percentage', 'date'],
      audience_country: ['audience_countries_country', 'audience_countries_percentage', 'date'],
      audience_city: ['audience_cities_city_name', 'audience_cities_percentage', 'date'],
    },
    allChartFields: [
      'date', 'followers_count', 'total_followers_count', 'profile_views', 'likes', 'comments', 'shares',
      'daily_lost_followers', 'daily_total_followers', 'unique_video_views', 'total_likes', 'video_views',
      'video_id', 'video_caption', 'video_create_datetime', 'video_embed_url',
      'video_views_count', 'video_reach', 'video_likes', 'video_comments',
      'video_shares', 'video_new_followers', 'video_full_watched_rate',
      'video_favorites', 'video_duration', 'video_average_time_watched', 'video_total_time_watched',
      'video_profile_views', 'video_share_url', 'video_thumbnail_url',
      'video_website_clicks', 'video_email_clicks', 'video_address_clicks',
      'video_app_download_clicks', 'video_phone_number_clicks', 'video_lead_submissions',
      'audience_activity_hour', 'audience_activity_count',
      'bio_link_clicks', 'email_clicks',
      'address_clicks', 'phone_number_clicks', 'app_download_clicks', 'lead_submissions',
      'video_impression_sources_impression_source', 'video_impression_sources_percentage',
    ],
  },
  TIKTOK_ADS: {
    endpoint: 'tiktok',
    discoverFields: ['account_id', 'account_name', 'date', 'impressions'],
    dailyFields: [
      'date', 'impressions', 'clicks', 'spend', 'cpc', 'cpm', 'ctr',
      'conversions', 'cost_per_conversion', 'cost_per_result',
      'reach', 'cost_per_1000_reached', 'frequency',
      'likes', 'comments', 'shares', 'follows', 'profile_visits',
    ],
    contentFields: [
      'date', 'campaign_name', 'campaign_id', 'ad_group_name', 'ad_group_id',
      'ad_name', 'ad_id', 'ad_text',
      'impressions', 'clicks', 'spend', 'cpc', 'cpm', 'ctr',
      'conversions', 'cost_per_conversion',
      'video_play_actions', 'video_watched_2s', 'video_watched_6s',
      'average_video_play', 'average_video_play_per_user',
      'reach', 'cost_per_1000_reached',
    ],
    audienceFields: ['date', 'age', 'gender', 'country'],
    demographicFields: null,
    separateChartCalls: {
      daily: [
        'date', 'impressions', 'clicks', 'spend', 'cpc', 'cpm', 'ctr',
        'conversions', 'cost_per_conversion', 'cost_per_result',
        'reach', 'cost_per_1000_reached',
        'likes', 'comments', 'shares', 'follows', 'profile_visits',
      ],
      campaigns: [
        'date', 'campaign_name', 'campaign_id', 'campaign_budget',
        'impressions', 'clicks', 'spend', 'cpc', 'cpm', 'ctr',
        'conversions', 'cost_per_conversion', 'reach',
        'video_play_actions', 'video_watched_2s', 'video_watched_6s',
        'average_video_play',
      ],
      ads: [
        'date', 'ad_group_name', 'ad_group_id', 'ad_name', 'ad_id', 'ad_text',
        'impressions', 'clicks', 'spend', 'cpc', 'ctr',
        'conversions', 'cost_per_conversion',
        'video_play_actions', 'average_video_play',
      ],
      audience: [
        'date', 'age', 'gender', 'country',
        'impressions', 'clicks', 'spend', 'conversions',
      ],
    },
    allChartFields: [
      'date', 'impressions', 'clicks', 'spend', 'cpc', 'cpm', 'ctr',
      'conversions', 'cost_per_conversion', 'cost_per_result',
      'reach', 'cost_per_1000_reached',
      'likes', 'comments', 'shares', 'follows', 'profile_visits',
      'campaign_name', 'campaign_id', 'campaign_budget',
      'ad_group_name', 'ad_group_id', 'ad_name', 'ad_id', 'ad_text',
      'video_play_actions', 'video_watched_2s', 'video_watched_6s',
      'average_video_play', 'average_video_play_per_user',
      'complete_payment', 'complete_payment_roas',
      'app_install', 'cost_per_app_install',
      'clicks_on_music_disc', 'clicks_on_hashtag_challenge',
    ],
  },
  FACEBOOK_ORGANIC: {
    endpoint: 'facebook_organic',
    accountIdField: 'page_id',
    accountNameField: 'page_name',
    discoverFields: ['page_id', 'page_name', 'date'],
    dailyFields: ['date', 'impressions', 'reach', 'engaged_users', 'page_fans', 'page_views_total', 'reactions', 'comments', 'shares'],
    contentFields: ['date', 'post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach', 'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink'],
    audienceFields: ['date', 'page_fans_city', 'page_fans_country', 'page_fans_gender_age'],
    demographicFields: null,
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
    dailyFields: ['date', 'impressions', 'reach', 'profile_views', 'follower_count', 'follower_count_1d', 'website_clicks_1d'],
    contentFields: ['date', 'media_id', 'media_caption', 'timestamp', 'media_reach', 'media_like_count', 'media_comments_count', 'media_shares', 'media_saved', 'media_url', 'media_permalink'],
    audienceFields: ['date', 'audience_city', 'audience_country', 'audience_gender_age'],
    // Split into separate API calls to avoid Windsor mixing different data dimensions
    separateChartCalls: {
      daily: [
        'date', 'impressions', 'reach', 'profile_views',
        'follower_count', 'follower_count_1d', 'website_clicks_1d',
        'email_contacts_1d', 'phone_call_clicks_1d', 'get_directions_clicks_1d', 'text_message_clicks_1d',
      ],
      content: [
        'date', 'media_id', 'media_caption', 'timestamp', 'media_reach',
        'media_like_count', 'media_comments_count', 'media_shares', 'media_saved',
        'media_url', 'media_permalink',
        'media_engagement', 'media_views',
        'media_reel_video_views', 'media_reel_avg_watch_time', 'media_reel_total_interactions',
      ],
      story: [
        'date', 'story_reach', 'story_views', 'story_exits',
        'story_interactions', 'story_replies', 'story_shares',
        'story_taps_forward', 'story_taps_back', 'story_swipe_forward',
      ],
      audience_age: ['audience_age_name', 'audience_age_size'],
      audience_gender: ['audience_gender_name', 'audience_gender_size'],
      audience_country: ['audience_country_name', 'audience_country_size'],
      audience_city: ['city', 'audience_city_size'],
    },
    demographicFields: null,
    allChartFields: [
      'date', 'impressions', 'reach', 'profile_views',
      'follower_count', 'follower_count_1d', 'website_clicks_1d',
      'media_id', 'media_caption', 'timestamp', 'media_like_count', 'media_comments_count',
      'media_shares', 'media_saved', 'media_url', 'media_permalink',
      'media_engagement', 'media_reach', 'media_views',
      'media_reel_video_views', 'media_reel_avg_watch_time',
      'story_reach', 'story_views', 'story_exits',
      'email_contacts_1d', 'phone_call_clicks_1d', 'get_directions_clicks_1d', 'text_message_clicks_1d',
    ],
  },
  INSTAGRAM: {
    endpoint: 'instagram',
    dailyFields: ['date', 'impressions', 'reach', 'follower_count', 'profile_views', 'website_clicks'],
    contentFields: ['date', 'media_id', 'caption', 'timestamp', 'impressions', 'reach', 'likes', 'comments', 'shares', 'saved', 'media_url', 'permalink'],
    audienceFields: ['date', 'audience_city', 'audience_country', 'audience_gender_age'],
    demographicFields: null,
    allChartFields: [
      'date', 'impressions', 'reach', 'follower_count', 'profile_views', 'website_clicks',
      'media_id', 'caption', 'timestamp', 'likes', 'comments', 'shares', 'saved',
      'media_url', 'permalink',
    ],
  },
  FACEBOOK: {
    endpoint: 'facebook',
    dailyFields: ['date', 'impressions', 'reach', 'engaged_users', 'page_fans', 'page_views_total', 'reactions', 'comments', 'shares'],
    contentFields: ['date', 'post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach', 'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink'],
    audienceFields: ['date', 'page_fans_city', 'page_fans_country', 'page_fans_gender_age'],
    demographicFields: null,
    allChartFields: [
      'date', 'impressions', 'reach', 'engaged_users', 'page_fans', 'page_views_total',
      'reactions', 'comments', 'shares',
      'post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach',
      'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink',
    ],
  },
  YOUTUBE: {
    endpoint: 'youtube',
    dailyFields: ['date', 'views', 'likes', 'comments', 'shares', 'subscribers_gained', 'subscribers_lost', 'estimated_minutes_watched', 'average_view_percentage', 'dislikes'],
    contentFields: ['date', 'video', 'views', 'likes', 'comments'],
    audienceFields: ['date', 'viewer_percentage', 'country'],
    demographicFields: null,
    separateChartCalls: {
      daily: [
        'date', 'views', 'likes', 'comments', 'shares', 'subscribers_gained', 'subscribers_lost',
        'estimated_minutes_watched', 'average_view_percentage', 'dislikes',
      ],
      content: ['date', 'video', 'views', 'likes', 'comments'],
    },
    allChartFields: [
      'date', 'views', 'likes', 'comments', 'shares', 'subscribers_gained', 'subscribers_lost',
      'estimated_minutes_watched', 'video',
      'average_view_percentage', 'dislikes',
    ],
  },
};

class WindsorMultiPlatform {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  getConfig(provider) {
    const config = PLATFORM_CONFIG[provider];
    if (!config) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    return config;
  }

  async fetchData(provider, accountId, dateFrom, dateTo, fields) {
    const config = this.getConfig(provider);
    const fieldStr = Array.isArray(fields) ? fields.join(',') : fields;
    const url = `${WINDSOR_BASE}/${config.endpoint}?api_key=${this.apiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=${fieldStr}&select_accounts=${accountId}`;

    try {
      const response = await axios.get(url, { timeout: 120000, httpsAgent });
      const data = response.data;

      if (Array.isArray(data)) {
        return data[0]?.data || [];
      }
      return data?.data || [];
    } catch (error) {
      console.error(`Windsor API error (${provider}):`, error.message);
      throw error;
    }
  }

  async fetchDailyMetrics(provider, accountId, dateFrom, dateTo) {
    const config = this.getConfig(provider);
    return this.fetchData(provider, accountId, dateFrom, dateTo, config.dailyFields);
  }

  async fetchContent(provider, accountId, dateFrom, dateTo) {
    const config = this.getConfig(provider);
    return this.fetchData(provider, accountId, dateFrom, dateTo, config.contentFields);
  }

  async fetchAudience(provider, accountId, dateFrom, dateTo) {
    const config = this.getConfig(provider);
    return this.fetchData(provider, accountId, dateFrom, dateTo, config.audienceFields);
  }

  async fetchDemographics(provider, accountId, dateFrom, dateTo, type) {
    const config = this.getConfig(provider);
    if (!config.demographicFields || !config.demographicFields[type]) {
      return [];
    }
    return this.fetchData(provider, accountId, dateFrom, dateTo, config.demographicFields[type]);
  }

  async fetchAllData(provider, accountId, dateFrom, dateTo) {
    const config = this.getConfig(provider);

    const promises = [
      this.fetchDailyMetrics(provider, accountId, dateFrom, dateTo),
      this.fetchContent(provider, accountId, dateFrom, dateTo),
      this.fetchAudience(provider, accountId, dateFrom, dateTo),
    ];

    if (config.demographicFields) {
      promises.push(this.fetchDemographics(provider, accountId, dateFrom, dateTo, 'age'));
      promises.push(this.fetchDemographics(provider, accountId, dateFrom, dateTo, 'gender'));
    }

    const results = await Promise.all(promises);

    const data = {
      daily: results[0],
      content: results[1],
      audience: results[2],
    };

    if (config.demographicFields) {
      data.age = results[3];
      data.gender = results[4];
    }

    return data;
  }

  async fetchAllChartData(provider, accountId, dateFrom, dateTo) {
    const config = this.getConfig(provider);

    // If the platform has separateChartCalls, make individual API calls per data category
    // to prevent Windsor from mixing different data dimensions (daily vs media vs story vs demographics)
    if (config.separateChartCalls) {
      const calls = config.separateChartCalls;
      const callNames = Object.keys(calls);
      console.log(`[Windsor] ${provider}: making ${callNames.length} separate API calls: ${callNames.join(', ')}`);

      const promises = callNames.map(name =>
        this.fetchData(provider, accountId, dateFrom, dateTo, calls[name]).catch(err => {
          console.warn(`[Windsor] ${provider} ${name} fetch failed:`, err.message);
          return [];
        })
      );

      const results = await Promise.all(promises);
      // Tag each row with its source category for debugging
      results.forEach((rows, idx) => {
        const name = callNames[idx];
        console.log(`[Windsor] ${provider} ${name}: ${rows.length} rows`);
      });

      return results.flat();
    }

    // Demographics fields are a separate Windsor dimension — must be fetched
    // in individual API calls and merged into the main dataset.
    const demographicFieldSet = new Set();
    if (config.demographicFields) {
      for (const fields of Object.values(config.demographicFields)) {
        for (const f of fields) {
          if (f !== 'date') demographicFieldSet.add(f);
        }
      }
    }

    const mainFields = config.allChartFields.filter(f => !demographicFieldSet.has(f));

    const promises = [
      this.fetchData(provider, accountId, dateFrom, dateTo, mainFields),
    ];

    if (config.demographicFields) {
      promises.push(
        this.fetchDemographics(provider, accountId, dateFrom, dateTo, 'age').catch(err => {
          console.warn(`[Windsor] Demographics age fetch failed for ${provider}:`, err.message);
          return [];
        })
      );
      promises.push(
        this.fetchDemographics(provider, accountId, dateFrom, dateTo, 'gender').catch(err => {
          console.warn(`[Windsor] Demographics gender fetch failed for ${provider}:`, err.message);
          return [];
        })
      );
    }

    const results = await Promise.all(promises);
    return results.flat();
  }

  /**
   * Discover all connected accounts for a provider by querying Windsor without select_accounts.
   * Returns unique account identifiers found in the response data.
   */
  async discoverAccounts(provider) {
    const config = this.getConfig(provider);

    const now = new Date();
    const dateTo = now.toISOString().split('T')[0];
    const dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Use platform-specific account discovery fields (Facebook uses page_id/page_name)
    const idField = config.accountIdField || 'account_id';
    const nameField = config.accountNameField || 'account_name';
    const fields = config.discoverFields || [idField, nameField, ...config.dailyFields.slice(0, 3)];
    const url = `${WINDSOR_BASE}/${config.endpoint}?api_key=${this.apiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=${fields.join(',')}`;

    try {
      const response = await axios.get(url, { timeout: 120000, httpsAgent });
      const rawData = response.data;
      const rows = Array.isArray(rawData) ? (rawData[0]?.data || []) : (rawData?.data || []);

      // Extract unique accounts from the data
      const accountMap = new Map();
      for (const row of rows) {
        const id = row[idField];
        const name = row[nameField];
        if (!id) continue;
        if (!accountMap.has(id)) {
          accountMap.set(id, { accountName: name || id, rowCount: 0 });
        }
        accountMap.get(id).rowCount++;
      }

      return Array.from(accountMap.entries()).map(([id, info]) => ({
        accountId: id,
        accountName: info.accountName,
        provider,
        hasData: info.rowCount > 0,
      }));
    } catch (error) {
      console.error(`Windsor discover error (${provider}):`, error.message);
      throw error;
    }
  }

  /**
   * List all datasources configured in Windsor.
   * Uses the Windsor datasources API to get connected accounts directly.
   */
  async listDataSources() {
    const url = `${WINDSOR_BASE}/api/v1/datasources?api_key=${this.apiKey}`;

    try {
      const response = await axios.get(url, { timeout: 15000, httpsAgent });
      const sources = response.data;

      if (Array.isArray(sources)) {
        return sources.map(s => ({
          id: s.id || s.datasource_id,
          name: s.name || s.datasource_name || s.id,
          type: s.type || s.datasource_type || 'unknown',
        }));
      }

      return [];
    } catch (error) {
      console.error('Windsor datasources error:', error.message);
      // Return empty array instead of throwing — this is a best-effort fallback
      return [];
    }
  }

  async testConnection(provider, accountId) {
    const config = this.getConfig(provider);
    const onboardUrl = `https://onboard.windsor.ai?datasource=${config.endpoint}`;

    try {
      const now = new Date();
      const dateTo = now.toISOString().split('T')[0];
      const dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const testFields = config.dailyFields.slice(0, 3);
      const data = await this.fetchData(provider, accountId, dateFrom, dateTo, testFields);

      return {
        success: Array.isArray(data) && data.length > 0,
        rowCount: Array.isArray(data) ? data.length : 0,
        message: Array.isArray(data) && data.length > 0
          ? `Sikeres kapcsolat - ${data.length} sor adat az elmúlt 30 napban`
          : 'Nincs elérhető adat az elmúlt 30 napban',
      };
    } catch (error) {
      const status = error.response?.status;
      const windsorError = error.response?.data?.error || error.message;

      // Windsor returns specific error when datasource is not connected
      if (windsorError?.includes('No ') && windsorError?.includes('account')) {
        return {
          success: false,
          rowCount: 0,
          message: `Windsor-ban nincs ${config.endpoint} datasource konfigurálva. Egyszeri beállítás szükséges.`,
          windsorOnboardUrl: onboardUrl,
          needsWindsorSetup: true,
        };
      }

      return {
        success: false,
        rowCount: 0,
        message: `Windsor API hiba${status ? ` (${status})` : ''}: ${windsorError}`,
        windsorOnboardUrl: onboardUrl,
      };
    }
  }
}

module.exports = { WindsorMultiPlatform, PLATFORM_CONFIG };
