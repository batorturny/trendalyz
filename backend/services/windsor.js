// ============================================
// WINDSOR AI SERVICE - TikTok Data Fetching
// ============================================

const axios = require('axios');

const BASE_URL = 'https://connectors.windsor.ai/tiktok_organic';

class WindsorService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async fetchData(tiktokAccountId, dateFrom, dateTo, fields) {
        const url = `${BASE_URL}?api_key=${this.apiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=${fields}&select_accounts=${tiktokAccountId}`;

        try {
            const response = await axios.get(url, { timeout: 30000 });
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
}

module.exports = WindsorService;
