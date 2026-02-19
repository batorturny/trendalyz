// ============================================
// WINDSOR AI SERVICE - TikTok Data Fetching
// ============================================

const axios = require('axios');
const https = require('https');

// Use Vercel proxy to avoid Hetzner→Windsor timeout, fallback to direct
const WINDSOR_PROXY = process.env.WINDSOR_PROXY_URL || 'https://connectors.windsor.ai';
const BASE_URL = `${WINDSOR_PROXY}/tiktok_organic`;

// Force IPv4 + keep-alive (used when calling directly, not via proxy)
const httpsAgent = new https.Agent({ family: 4, keepAlive: true });

class WindsorService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async fetchData(tiktokAccountId, dateFrom, dateTo, fields) {
        const url = `${BASE_URL}?api_key=${this.apiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=${fields}&select_accounts=${tiktokAccountId}`;

        try {
            const response = await axios.get(url, { timeout: 120000, httpsAgent });
            const data = response.data;

            // Handle wrapped response [{ data: [] }]
            if (Array.isArray(data)) {
                return data[0]?.data || [];
            }
            return data?.data || [];
        } catch (error) {
            console.error('Windsor API error:', error.message);
            throw error;
        }
    }

    async fetchDaily(tiktokAccountId, dateFrom, dateTo) {
        return this.fetchData(
            tiktokAccountId,
            dateFrom,
            dateTo,
            'comments,date,followers_count,likes,profile_views,shares,total_followers_count'
        );
    }

    async fetchVideo(tiktokAccountId, dateFrom, dateTo) {
        return this.fetchData(
            tiktokAccountId,
            dateFrom,
            dateTo,
            'video_comments,video_create_datetime,video_embed_url,video_full_watched_rate,video_likes,video_new_followers,video_reach,video_shares,video_total_time_watched,video_views_count,video_average_time_watched_non_aggregated'
        );
    }

    async fetchActivity(tiktokAccountId, dateFrom, dateTo) {
        return this.fetchData(
            tiktokAccountId,
            dateFrom,
            dateTo,
            'audience_activity_count,audience_activity_hour,date'
        );
    }

    async fetchAge(tiktokAccountId, dateFrom, dateTo) {
        return this.fetchData(
            tiktokAccountId,
            dateFrom,
            dateTo,
            'audience_ages_age,audience_ages_percentage,date'
        );
    }

    async fetchGender(tiktokAccountId, dateFrom, dateTo) {
        return this.fetchData(
            tiktokAccountId,
            dateFrom,
            dateTo,
            'date,video_audience_genders_gender,video_audience_genders_percentage'
        );
    }

    async fetchAllData(tiktokAccountId, dateFrom, dateTo) {
        const [daily, video, activity, age, gender] = await Promise.all([
            this.fetchDaily(tiktokAccountId, dateFrom, dateTo),
            this.fetchVideo(tiktokAccountId, dateFrom, dateTo),
            this.fetchActivity(tiktokAccountId, dateFrom, dateTo),
            this.fetchAge(tiktokAccountId, dateFrom, dateTo),
            this.fetchGender(tiktokAccountId, dateFrom, dateTo)
        ]);

        return { daily, video, activity, age, gender };
    }

    // Fetch all data needed for charts in one comprehensive request
    async fetchAllChartData(tiktokAccountId, dateFrom, dateTo) {
        const fields = [
            // Daily data
            'date', 'followers_count', 'total_followers_count', 'profile_views', 'likes', 'comments', 'shares',
            // Video data
            'video_id', 'video_caption', 'video_create_datetime', 'video_embed_url',
            'video_views_count', 'video_reach', 'video_likes', 'video_comments',
            'video_shares', 'video_new_followers', 'video_full_watched_rate',
            'video_average_time_watched_non_aggregated',
            // Activity data
            'audience_activity_hour', 'audience_activity_count',
            // Demographics
            'audience_ages_age', 'audience_ages_percentage',
            'video_audience_genders_gender', 'video_audience_genders_percentage',
            // Traffic sources
            'video_impression_sources_impression_source', 'video_impression_sources_percentage'
        ].join(',');

        return this.fetchData(tiktokAccountId, dateFrom, dateTo, fields);
    }
}

module.exports = WindsorService;
