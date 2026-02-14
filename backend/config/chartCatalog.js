// ============================================
// CHART CATALOG - Available charts with metadata
// ============================================

const CHART_CATEGORIES = {
    TREND: 'trend',
    ENGAGEMENT: 'engagement',
    TIMING: 'timing',
    VIDEO: 'video',
    POST: 'post',
    MEDIA: 'media',
    AUDIENCE: 'audience'
};

// Core charts - only line/bar that are proven to work
const chartCatalog = [
    // ========== TIKTOK CHARTS ==========
    // TREND CHARTS
    {
        key: 'followers_growth',
        title: 'Követők növekedése',
        description: 'Napi követőszám trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['followers_count', 'date']
    },
    {
        key: 'profile_views',
        title: 'Profil megtekintések',
        description: 'Profil látogatások trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['profile_views', 'date']
    },

    // ENGAGEMENT CHARTS
    {
        key: 'daily_likes',
        title: 'Napi like-ok',
        description: 'Naponta kapott like-ok száma',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#bc6aff',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['likes', 'date']
    },
    {
        key: 'daily_comments',
        title: 'Kommentek',
        description: 'Naponta kapott kommentek',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#ffce44',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['comments', 'date']
    },
    {
        key: 'daily_shares',
        title: 'Megosztások',
        description: 'Naponta kapott megosztások',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#4d96ff',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['shares', 'date']
    },
    {
        key: 'engagement_rate',
        title: 'Engagement rate trend',
        description: '(Likes + Comments + Shares) / Views %',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#ff6b9d',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_likes', 'video_comments', 'video_shares', 'video_views_count', 'date'],
        calculated: true
    },

    // TIMING CHARTS
    {
        key: 'engagement_by_day',
        title: 'Engagement napok szerint',
        description: 'Melyik napon a legjobb a teljesítmény',
        category: CHART_CATEGORIES.TIMING,
        type: 'bar',
        color: '#00d4aa',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['audience_activity_count', 'audience_activity_hour']
    },
    {
        key: 'engagement_by_hour',
        title: 'Engagement órák szerint',
        description: 'Aktivitás napszak szerint (0-23)',
        category: CHART_CATEGORIES.TIMING,
        type: 'bar',
        color: '#9d4edd',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['audience_activity_count', 'audience_activity_hour']
    },

    // VIDEO CHARTS
    {
        key: 'all_videos',
        title: 'Összes videó',
        description: 'Teljes videó lista az időszakban',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#00d4ff',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_id', 'video_caption', 'video_create_datetime', 'video_views_count', 'video_likes', 'video_comments', 'video_shares', 'video_embed_url']
    },
    {
        key: 'top_3_videos',
        title: 'Top 3 videó',
        description: 'Legtöbb megtekintésű videók',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#00ff95',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_id', 'video_caption', 'video_create_datetime', 'video_views_count', 'video_likes', 'video_comments', 'video_shares', 'video_embed_url']
    },
    {
        key: 'worst_3_videos',
        title: 'Legrosszabb 3 videó',
        description: 'Legkevesebb megtekintésű videók',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#ff6b6b',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_id', 'video_caption', 'video_create_datetime', 'video_views_count', 'video_likes', 'video_comments', 'video_shares', 'video_embed_url']
    },

    // ========== FACEBOOK CHARTS ==========
    {
        key: 'fb_page_reach',
        title: 'Facebook oldal elérés',
        description: 'Napi elérés és impressziók trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['reach', 'impressions', 'date']
    },
    {
        key: 'fb_page_fans',
        title: 'Facebook követők',
        description: 'Oldal követők számának alakulása',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_fans', 'date']
    },
    {
        key: 'fb_engagement',
        title: 'Facebook engagement',
        description: 'Reakciók, kommentek és megosztások',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#bc6aff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['reactions', 'comments', 'shares', 'date']
    },
    {
        key: 'fb_post_engagement',
        title: 'Facebook poszt engagement',
        description: 'Posztok teljesítménye',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#ffce44',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'date']
    },
    {
        key: 'fb_all_posts',
        title: 'Facebook összes poszt',
        description: 'Teljes poszt lista az időszakban',
        category: CHART_CATEGORIES.POST,
        type: 'table',
        color: '#00d4ff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach', 'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink']
    },
    {
        key: 'fb_top_3_posts',
        title: 'Facebook Top 3 poszt',
        description: 'Legjobban teljesítő posztok',
        category: CHART_CATEGORIES.POST,
        type: 'table',
        color: '#00ff95',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach', 'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink']
    },

    // ========== INSTAGRAM CHARTS ==========
    {
        key: 'ig_reach',
        title: 'Instagram elérés',
        description: 'Napi elérés és impressziók',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#e040fb',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['reach', 'impressions', 'date']
    },
    {
        key: 'ig_follower_growth',
        title: 'Instagram követők',
        description: 'Követők számának alakulása',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['follower_count', 'date']
    },
    {
        key: 'ig_engagement',
        title: 'Instagram engagement',
        description: 'Like-ok, kommentek, megosztások, mentések',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#bc6aff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['likes', 'comments', 'shares', 'saved', 'date']
    },
    {
        key: 'ig_profile_activity',
        title: 'Instagram profil aktivitás',
        description: 'Profil látogatások és weboldal kattintások',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#ffce44',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['profile_views', 'website_clicks', 'date']
    },
    {
        key: 'ig_all_media',
        title: 'Instagram összes tartalom',
        description: 'Teljes tartalom lista az időszakban',
        category: CHART_CATEGORIES.MEDIA,
        type: 'table',
        color: '#00d4ff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'caption', 'timestamp', 'impressions', 'reach', 'likes', 'comments', 'shares', 'saved', 'permalink']
    },
    {
        key: 'ig_top_3_media',
        title: 'Instagram Top 3 tartalom',
        description: 'Legjobban teljesítő tartalmak',
        category: CHART_CATEGORIES.MEDIA,
        type: 'table',
        color: '#00ff95',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'caption', 'timestamp', 'impressions', 'reach', 'likes', 'comments', 'shares', 'saved', 'permalink']
    },

    // ========== YOUTUBE CHARTS ==========
    // TREND
    {
        key: 'yt_subscribers_growth',
        title: 'YouTube feliratkozók',
        description: 'Napi feliratkozók növekedése',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ff0000',
        platform: 'YOUTUBE',
        windsorFields: ['subscribers_gained', 'subscribers_lost', 'date'],
        calculated: true
    },
    {
        key: 'yt_views_trend',
        title: 'YouTube megtekintések',
        description: 'Napi megtekintések trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'YOUTUBE',
        windsorFields: ['views', 'date']
    },
    {
        key: 'yt_watch_time',
        title: 'YouTube nézési idő',
        description: 'Becsült nézési idő (perc)',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'YOUTUBE',
        windsorFields: ['estimated_minutes_watched', 'date']
    },

    // ENGAGEMENT
    {
        key: 'yt_daily_engagement',
        title: 'YouTube engagement',
        description: 'Like-ok, kommentek és megosztások',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#bc6aff',
        platform: 'YOUTUBE',
        windsorFields: ['likes', 'comments', 'shares', 'date']
    },
    {
        key: 'yt_engagement_rate',
        title: 'YouTube engagement rate',
        description: '(Likes + Comments) / Views %',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#ff6b9d',
        platform: 'YOUTUBE',
        windsorFields: ['likes', 'comments', 'views', 'date'],
        calculated: true
    },

    // VIDEO
    {
        key: 'yt_top_5_videos',
        title: 'YouTube Top 5 videó',
        description: 'Legtöbb megtekintésű videók',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#00ff95',
        platform: 'YOUTUBE',
        windsorFields: ['video_id', 'video_title', 'video_published_at', 'views', 'likes', 'comments', 'shares', 'average_view_duration']
    },
    {
        key: 'yt_worst_5_videos',
        title: 'YouTube legrosszabb 5 videó',
        description: 'Legkevesebb megtekintésű videók',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#ff6b6b',
        platform: 'YOUTUBE',
        windsorFields: ['video_id', 'video_title', 'video_published_at', 'views', 'likes', 'comments', 'shares', 'average_view_duration']
    },
    {
        key: 'yt_all_videos',
        title: 'YouTube összes videó',
        description: 'Teljes videó lista az időszakban',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#00d4ff',
        platform: 'YOUTUBE',
        windsorFields: ['video_id', 'video_title', 'video_published_at', 'views', 'likes', 'comments', 'shares', 'average_view_duration']
    },

    // AUDIENCE
    {
        key: 'yt_top_countries',
        title: 'YouTube top országok',
        description: 'Nézők megoszlása országonként',
        category: CHART_CATEGORIES.AUDIENCE,
        type: 'bar',
        color: '#ffce44',
        platform: 'YOUTUBE',
        windsorFields: ['viewer_percentage', 'country']
    },
];

// Get all required Windsor fields for a set of charts
function getRequiredFields(chartKeys) {
    const fieldsSet = new Set();
    chartKeys.forEach(key => {
        const chart = chartCatalog.find(c => c.key === key);
        if (chart) {
            chart.windsorFields.forEach(f => fieldsSet.add(f));
        }
    });
    return Array.from(fieldsSet);
}

// Validate chart keys
function validateChartKeys(keys) {
    const validKeys = chartCatalog.map(c => c.key);
    const invalid = keys.filter(k => !validKeys.includes(k));
    return {
        valid: invalid.length === 0,
        invalidKeys: invalid
    };
}

// Get catalog grouped by category
function getCatalogByCategory() {
    const grouped = {};
    chartCatalog.forEach(chart => {
        if (!grouped[chart.category]) {
            grouped[chart.category] = [];
        }
        grouped[chart.category].push(chart);
    });
    return grouped;
}

// Get catalog filtered by platform
function getCatalogByPlatform(platform) {
    if (!platform) return chartCatalog;
    return chartCatalog.filter(c => c.platform === platform);
}

module.exports = {
    chartCatalog,
    CHART_CATEGORIES,
    getRequiredFields,
    validateChartKeys,
    getCatalogByCategory,
    getCatalogByPlatform
};
