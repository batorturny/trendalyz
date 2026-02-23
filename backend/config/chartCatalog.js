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
    AUDIENCE: 'audience',
    ADS: 'ads'
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

    // ========== TIKTOK ORGANIC (NEW) ==========
    {
        key: 'tt_bio_link_clicks',
        title: 'Bio link kattintások',
        description: 'Bio link kattintások trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00d4aa',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['bio_link_clicks', 'date']
    },
    {
        key: 'tt_video_watch_time',
        title: 'Átlagos nézési idő',
        description: 'Átlagos nézési idő videónként',
        category: CHART_CATEGORIES.VIDEO,
        type: 'bar',
        color: '#4d96ff',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_average_time_watched', 'video_caption', 'date']
    },
    {
        key: 'tt_video_retention',
        title: 'Teljes megnézési arány',
        description: 'Teljes megnézési arány trend',
        category: CHART_CATEGORIES.VIDEO,
        type: 'line',
        color: '#ff6b9d',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_full_watched_rate', 'date']
    },
    {
        key: 'tt_traffic_sources',
        title: 'Forgalmi források',
        description: 'Forgalmi források (For You, Following, stb.)',
        category: CHART_CATEGORIES.AUDIENCE,
        type: 'bar',
        color: '#9d4edd',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_impression_sources_impression_source', 'video_impression_sources_percentage']
    },
    {
        key: 'tt_audience_demographics',
        title: 'Életkori megoszlás',
        description: 'Közönség életkori megoszlása',
        category: CHART_CATEGORIES.AUDIENCE,
        type: 'bar',
        color: '#ffce44',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['audience_ages_age', 'audience_ages_percentage']
    },
    {
        key: 'tt_gender_demographics',
        title: 'Nemek megoszlása',
        description: 'Közönség nemi megoszlása',
        category: CHART_CATEGORIES.AUDIENCE,
        type: 'bar',
        color: '#f472b6',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_audience_genders_gender', 'video_audience_genders_percentage']
    },
    {
        key: 'tt_total_followers',
        title: 'Összes követő',
        description: 'Összes követő szám trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#22d3ee',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['total_followers_count']
    },

    // ========== TIKTOK ADS ==========
    {
        key: 'ttads_spend_trend',
        title: 'Napi költés',
        description: 'Napi hirdetési költés trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ff6b9d',
        platform: 'TIKTOK_ADS',
        windsorFields: ['spend', 'date']
    },
    {
        key: 'ttads_impressions_clicks',
        title: 'Impressziók és kattintások',
        description: 'Napi impressziók és kattintások',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'TIKTOK_ADS',
        windsorFields: ['impressions', 'clicks', 'date']
    },
    {
        key: 'ttads_ctr_trend',
        title: 'CTR trend',
        description: 'Átkattintási arány trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'TIKTOK_ADS',
        windsorFields: ['ctr', 'date']
    },
    {
        key: 'ttads_cpc_cpm',
        title: 'CPC és CPM',
        description: 'Kattintásonkénti és ezres megjelenésenkénti költség',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#bc6aff',
        platform: 'TIKTOK_ADS',
        windsorFields: ['cpc', 'cpm', 'date']
    },
    {
        key: 'ttads_conversions',
        title: 'Konverziók',
        description: 'Napi konverziók száma',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#00d4aa',
        platform: 'TIKTOK_ADS',
        windsorFields: ['conversions', 'date']
    },
    {
        key: 'ttads_cost_per_conversion',
        title: 'Költség/konverzió',
        description: 'Konverziónkénti költség trend',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#ffce44',
        platform: 'TIKTOK_ADS',
        windsorFields: ['cost_per_conversion', 'date']
    },
    {
        key: 'ttads_campaign_perf',
        title: 'Kampány teljesítmény',
        description: 'Kampányok részletes teljesítménye',
        category: CHART_CATEGORIES.ADS,
        type: 'table',
        color: '#00d4ff',
        platform: 'TIKTOK_ADS',
        windsorFields: ['campaign_name', 'impressions', 'clicks', 'spend', 'cpc', 'ctr', 'conversions']
    },
    {
        key: 'ttads_video_engagement',
        title: 'Videó lejátszások',
        description: 'Videó lejátszások hirdetésekben',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#ff6b6b',
        platform: 'TIKTOK_ADS',
        windsorFields: ['video_play_actions', 'video_watched_2s', 'video_watched_6s', 'date']
    },

    // ========== FACEBOOK (NEW) ==========
    {
        key: 'fb_video_views',
        title: 'Oldal videó megtekintések',
        description: 'Oldal videó megtekintések trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_video_views', 'date']
    },
    {
        key: 'fb_follows_trend',
        title: 'Követő változás',
        description: 'Követő/követéstörlés napi trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_daily_follows', 'page_daily_unfollows', 'date']
    },
    {
        key: 'fb_reaction_breakdown',
        title: 'Reakció típusok',
        description: 'Reakció típus eloszlás (like/love/wow/haha)',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#bc6aff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_reactions_like_total', 'post_reactions_love_total', 'post_reactions_wow_total', 'post_reactions_haha_total', 'date']
    },
    {
        key: 'fb_page_video_time',
        title: 'Videó nézési idő',
        description: 'Oldal videó nézési idő trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ffce44',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_video_view_time', 'date']
    },
    {
        key: 'fb_reel_performance',
        title: 'Reel teljesítmény',
        description: 'Facebook Reel tartalmak teljesítménye',
        category: CHART_CATEGORIES.POST,
        type: 'table',
        color: '#00d4ff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_id', 'post_message', 'post_created_time', 'post_video_views', 'post_reactions', 'post_comments', 'post_shares', 'post_permalink']
    },

    // ========== INSTAGRAM BUSINESS (NEW) ==========
    {
        key: 'ig_media_type_breakdown',
        title: 'Tartalom típus mix',
        description: 'Tartalom típus eloszlás (IMAGE/VIDEO/REEL/CAROUSEL)',
        category: CHART_CATEGORIES.MEDIA,
        type: 'bar',
        color: '#e040fb',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'caption', 'timestamp', 'impressions', 'reach', 'likes', 'comments']
    },
    {
        key: 'ig_reel_performance',
        title: 'Reel megtekintések',
        description: 'Reel megtekintések és interakciók',
        category: CHART_CATEGORIES.MEDIA,
        type: 'bar',
        color: '#bc6aff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_reel_video_views', 'media_reel_avg_watch_time', 'date']
    },
    {
        key: 'ig_story_overview',
        title: 'Story áttekintés',
        description: 'Story elérés, megtekintések, kilépések',
        category: CHART_CATEGORIES.MEDIA,
        type: 'bar',
        color: '#ff6b9d',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['story_reach', 'story_views', 'story_exits', 'date']
    },
    {
        key: 'ig_save_rate',
        title: 'Mentési arány',
        description: 'Mentési arány trend',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#00d4aa',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_saved', 'media_reach', 'date'],
        calculated: true
    },
    {
        key: 'ig_daily_followers',
        title: 'Napi új követők',
        description: 'Napi követőszám változás',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['follower_count_1d', 'date']
    },

    // ========== INSTAGRAM PUBLIC ==========
    {
        key: 'igpub_engagement_overview',
        title: 'Engagement áttekintés',
        description: 'Like-ok és kommentek összesítve',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#e040fb',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_like_count', 'media_comments_count', 'date']
    },
    {
        key: 'igpub_avg_engagement',
        title: 'Átlag engagement/poszt',
        description: 'Átlagos like és komment posztonként',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#bc6aff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['likes_per_post', 'comments_per_post', 'date'],
        calculated: true
    },
    {
        key: 'igpub_all_media',
        title: 'Összes tartalom',
        description: 'Teljes tartalom lista',
        category: CHART_CATEGORIES.MEDIA,
        type: 'table',
        color: '#00d4ff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'media_caption', 'media_like_count', 'media_comments_count', 'media_type', 'media_permalink', 'media_timestamp']
    },
    {
        key: 'igpub_top_3_media',
        title: 'Top 3 tartalom',
        description: 'Legtöbb like-ot kapott tartalmak',
        category: CHART_CATEGORIES.MEDIA,
        type: 'table',
        color: '#00ff95',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'media_caption', 'media_like_count', 'media_comments_count', 'media_type', 'media_permalink', 'media_timestamp']
    },

    // ========== FACEBOOK (MORE) ==========
    {
        key: 'fb_worst_3_posts',
        title: 'Facebook leggyengébb 3 poszt',
        description: 'Legkevesebb elérésű posztok',
        category: CHART_CATEGORIES.POST,
        type: 'table',
        color: '#ff6b6b',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach', 'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink']
    },
    {
        key: 'fb_engaged_users',
        title: 'Elkötelezett felhasználók',
        description: 'Napi elkötelezett felhasználók trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ff6b9d',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['engaged_users', 'date']
    },
    {
        key: 'fb_page_views',
        title: 'Oldal megtekintések',
        description: 'Napi oldal megtekintések trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#9d4edd',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_views_total', 'date']
    },
    {
        key: 'fb_engagement_rate',
        title: 'Facebook engagement rate',
        description: '(Reakciók + Kommentek + Megosztások) / Elérés %',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#ff6b9d',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['reactions', 'comments', 'shares', 'reach', 'date'],
        calculated: true
    },

    // ========== INSTAGRAM PUBLIC (MORE) ==========
    {
        key: 'igpub_worst_3_media',
        title: 'Leggyengébb 3 tartalom',
        description: 'Legkevesebb like-ot kapott tartalmak',
        category: CHART_CATEGORIES.MEDIA,
        type: 'table',
        color: '#ff6b6b',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'media_caption', 'media_like_count', 'media_comments_count', 'media_type', 'media_permalink', 'media_timestamp']
    },
    {
        key: 'igpub_followers_trend',
        title: 'Követők trend',
        description: 'Követőszám alakulása az időszakban',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['profile_followers_count', 'date']
    },
    {
        key: 'igpub_engagement_rate',
        title: 'IG Public engagement rate',
        description: '(Like-ok + Kommentek) / Követők %',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#ff6b9d',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_like_count', 'media_comments_count', 'profile_followers_count', 'date'],
        calculated: true
    },

    // ========== YOUTUBE (NEW) ==========
    {
        key: 'yt_avg_view_pct',
        title: 'Átlagos nézési %',
        description: 'Átlagos nézési százalék videónként',
        category: CHART_CATEGORIES.VIDEO,
        type: 'bar',
        color: '#ffce44',
        platform: 'YOUTUBE',
        windsorFields: ['average_view_percentage', 'video_title', 'video_id']
    },
    {
        key: 'yt_playlist_adds',
        title: 'Playlisthez adás',
        description: 'Playlisthez adás trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00d4aa',
        platform: 'YOUTUBE',
        windsorFields: ['videos_added_to_playlists', 'date']
    },
    {
        key: 'yt_premium_views',
        title: 'YouTube Premium nézések',
        description: 'YouTube Premium megtekintések',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ff0000',
        platform: 'YOUTUBE',
        windsorFields: ['red_views', 'date']
    },
    {
        key: 'yt_likes_dislikes',
        title: 'Like/Dislike arány',
        description: 'Like és dislike arány trend',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#4d96ff',
        platform: 'YOUTUBE',
        windsorFields: ['likes', 'dislikes', 'date']
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
