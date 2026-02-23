// @ts-nocheck
// ============================================
// CHART CATALOG - Available charts with metadata
// ============================================

export const CHART_CATEGORIES = {
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
export const chartCatalog = [
    // ========== TIKTOK CHARTS ==========
    // TREND CHARTS
    {
        key: 'followers_growth',
        title: 'K\u00f6vet\u0151k n\u00f6veked\u00e9se',
        description: 'Napi k\u00f6vet\u0151sz\u00e1m trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['followers_count', 'date']
    },
    {
        key: 'profile_views',
        title: 'Profil megtekint\u00e9sek',
        description: 'Profil l\u00e1togat\u00e1sok trendje',
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
        description: 'Naponta kapott like-ok sz\u00e1ma',
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
        title: 'Megoszt\u00e1sok',
        description: 'Naponta kapott megoszt\u00e1sok',
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
        description: 'Melyik napon a legjobb a teljes\u00edtm\u00e9ny',
        category: CHART_CATEGORIES.TIMING,
        type: 'bar',
        color: '#00d4aa',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['audience_activity_count', 'audience_activity_hour']
    },
    {
        key: 'engagement_by_hour',
        title: 'Engagement \u00f3r\u00e1k szerint',
        description: 'Aktivit\u00e1s napszak szerint (0-23)',
        category: CHART_CATEGORIES.TIMING,
        type: 'bar',
        color: '#9d4edd',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['audience_activity_count', 'audience_activity_hour']
    },

    // VIDEO CHARTS
    {
        key: 'all_videos',
        title: '\u00d6sszes vide\u00f3',
        description: 'Teljes vide\u00f3 lista az id\u0151szakban',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#00d4ff',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_id', 'video_caption', 'video_create_datetime', 'video_views_count', 'video_likes', 'video_comments', 'video_shares', 'video_embed_url']
    },
    {
        key: 'top_3_videos',
        title: 'Top 3 vide\u00f3',
        description: 'Legt\u00f6bb megtekint\u00e9s\u0171 vide\u00f3k',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#00ff95',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_id', 'video_caption', 'video_create_datetime', 'video_views_count', 'video_likes', 'video_comments', 'video_shares', 'video_embed_url']
    },
    {
        key: 'worst_3_videos',
        title: 'Legrosszabb 3 vide\u00f3',
        description: 'Legkevesebb megtekint\u00e9s\u0171 vide\u00f3k',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#ff6b6b',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_id', 'video_caption', 'video_create_datetime', 'video_views_count', 'video_likes', 'video_comments', 'video_shares', 'video_embed_url']
    },

    // ========== FACEBOOK CHARTS ==========
    {
        key: 'fb_page_reach',
        title: 'Facebook oldal el\u00e9r\u00e9s',
        description: 'Napi el\u00e9r\u00e9s \u00e9s impresszi\u00f3k trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['reach', 'impressions', 'date']
    },
    {
        key: 'fb_page_fans',
        title: 'Facebook k\u00f6vet\u0151k',
        description: 'Oldal k\u00f6vet\u0151k sz\u00e1m\u00e1nak alakul\u00e1sa',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_fans', 'date']
    },
    {
        key: 'fb_engagement',
        title: 'Facebook engagement',
        description: 'Reakci\u00f3k, kommentek \u00e9s megoszt\u00e1sok',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#bc6aff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['reactions', 'comments', 'shares', 'date']
    },
    {
        key: 'fb_post_engagement',
        title: 'Facebook poszt engagement',
        description: 'Posztok teljes\u00edtm\u00e9nye',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#ffce44',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'date']
    },
    {
        key: 'fb_all_posts',
        title: 'Facebook \u00f6sszes poszt',
        description: 'Teljes poszt lista az id\u0151szakban',
        category: CHART_CATEGORIES.POST,
        type: 'table',
        color: '#00d4ff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach', 'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink']
    },
    {
        key: 'fb_top_3_posts',
        title: 'Facebook Top 3 poszt',
        description: 'Legjobban teljes\u00edt\u0151 posztok',
        category: CHART_CATEGORIES.POST,
        type: 'table',
        color: '#00ff95',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach', 'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink']
    },

    // ========== INSTAGRAM CHARTS ==========
    {
        key: 'ig_reach',
        title: 'Instagram el\u00e9r\u00e9s',
        description: 'Napi el\u00e9r\u00e9s \u00e9s impresszi\u00f3k',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#e040fb',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['reach', 'impressions', 'date']
    },
    {
        key: 'ig_follower_growth',
        title: 'Instagram k\u00f6vet\u0151k',
        description: 'K\u00f6vet\u0151k sz\u00e1m\u00e1nak alakul\u00e1sa',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['follower_count', 'date']
    },
    {
        key: 'ig_engagement',
        title: 'Instagram engagement',
        description: 'Like-ok, kommentek, megoszt\u00e1sok, ment\u00e9sek',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#bc6aff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['likes', 'comments', 'shares', 'saved', 'date']
    },
    {
        key: 'ig_profile_activity',
        title: 'Instagram profil aktivit\u00e1s',
        description: 'Profil l\u00e1togat\u00e1sok \u00e9s weboldal kattint\u00e1sok',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#ffce44',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['profile_views', 'website_clicks', 'date']
    },
    {
        key: 'ig_all_media',
        title: 'Instagram \u00f6sszes tartalom',
        description: 'Teljes tartalom lista az id\u0151szakban',
        category: CHART_CATEGORIES.MEDIA,
        type: 'table',
        color: '#00d4ff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'caption', 'timestamp', 'impressions', 'reach', 'likes', 'comments', 'shares', 'saved', 'permalink']
    },
    {
        key: 'ig_top_3_media',
        title: 'Instagram Top 3 tartalom',
        description: 'Legjobban teljes\u00edt\u0151 tartalmak',
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
        title: 'YouTube feliratkoz\u00f3k',
        description: 'Napi feliratkoz\u00f3k n\u00f6veked\u00e9se',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ff0000',
        platform: 'YOUTUBE',
        windsorFields: ['subscribers_gained', 'subscribers_lost', 'date'],
        calculated: true
    },
    {
        key: 'yt_views_trend',
        title: 'YouTube megtekint\u00e9sek',
        description: 'Napi megtekint\u00e9sek trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'YOUTUBE',
        windsorFields: ['views', 'date']
    },
    {
        key: 'yt_watch_time',
        title: 'YouTube n\u00e9z\u00e9si id\u0151',
        description: 'Becs\u00fclt n\u00e9z\u00e9si id\u0151 (perc)',
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
        description: 'Like-ok, kommentek \u00e9s megoszt\u00e1sok',
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
        title: 'YouTube Top 5 vide\u00f3',
        description: 'Legt\u00f6bb megtekint\u00e9s\u0171 vide\u00f3k',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#00ff95',
        platform: 'YOUTUBE',
        windsorFields: ['video_id', 'video_title', 'video_published_at', 'views', 'likes', 'comments', 'shares', 'average_view_duration']
    },
    {
        key: 'yt_worst_5_videos',
        title: 'YouTube legrosszabb 5 vide\u00f3',
        description: 'Legkevesebb megtekint\u00e9s\u0171 vide\u00f3k',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#ff6b6b',
        platform: 'YOUTUBE',
        windsorFields: ['video_id', 'video_title', 'video_published_at', 'views', 'likes', 'comments', 'shares', 'average_view_duration']
    },
    {
        key: 'yt_all_videos',
        title: 'YouTube \u00f6sszes vide\u00f3',
        description: 'Teljes vide\u00f3 lista az id\u0151szakban',
        category: CHART_CATEGORIES.VIDEO,
        type: 'table',
        color: '#00d4ff',
        platform: 'YOUTUBE',
        windsorFields: ['video_id', 'video_title', 'video_published_at', 'views', 'likes', 'comments', 'shares', 'average_view_duration']
    },

    // AUDIENCE
    {
        key: 'yt_top_countries',
        title: 'YouTube top orsz\u00e1gok',
        description: 'N\u00e9z\u0151k megoszl\u00e1sa orsz\u00e1gonk\u00e9nt',
        category: CHART_CATEGORIES.AUDIENCE,
        type: 'bar',
        color: '#ffce44',
        platform: 'YOUTUBE',
        windsorFields: ['viewer_percentage', 'country']
    },

    // ========== TIKTOK ORGANIC (NEW) ==========
    {
        key: 'tt_bio_link_clicks',
        title: 'Bio link kattint\u00e1sok',
        description: 'Bio link kattint\u00e1sok trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00d4aa',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['bio_link_clicks', 'date']
    },
    {
        key: 'tt_video_watch_time',
        title: '\u00c1tlagos n\u00e9z\u00e9si id\u0151',
        description: '\u00c1tlagos n\u00e9z\u00e9si id\u0151 vide\u00f3nk\u00e9nt',
        category: CHART_CATEGORIES.VIDEO,
        type: 'bar',
        color: '#4d96ff',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_average_time_watched', 'video_caption', 'date']
    },
    {
        key: 'tt_video_retention',
        title: 'Teljes megn\u00e9z\u00e9si ar\u00e1ny',
        description: 'Teljes megn\u00e9z\u00e9si ar\u00e1ny trend',
        category: CHART_CATEGORIES.VIDEO,
        type: 'line',
        color: '#ff6b9d',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_full_watched_rate', 'date']
    },
    {
        key: 'tt_traffic_sources',
        title: 'Forgalmi forr\u00e1sok',
        description: 'Forgalmi forr\u00e1sok (For You, Following, stb.)',
        category: CHART_CATEGORIES.AUDIENCE,
        type: 'bar',
        color: '#9d4edd',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_impression_sources_impression_source', 'video_impression_sources_percentage']
    },
    {
        key: 'tt_audience_demographics',
        title: '\u00c9letkori megoszl\u00e1s',
        description: 'K\u00f6z\u00f6ns\u00e9g \u00e9letkori megoszl\u00e1sa',
        category: CHART_CATEGORIES.AUDIENCE,
        type: 'bar',
        color: '#ffce44',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['audience_ages_age', 'audience_ages_percentage']
    },
    {
        key: 'tt_gender_demographics',
        title: 'Nemek megoszl\u00e1sa',
        description: 'K\u00f6z\u00f6ns\u00e9g nemi megoszl\u00e1sa',
        category: CHART_CATEGORIES.AUDIENCE,
        type: 'bar',
        color: '#f472b6',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['video_audience_genders_gender', 'video_audience_genders_percentage']
    },
    {
        key: 'tt_total_followers',
        title: '\u00d6sszes k\u00f6vet\u0151',
        description: '\u00d6sszes k\u00f6vet\u0151 sz\u00e1m trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#22d3ee',
        platform: 'TIKTOK_ORGANIC',
        windsorFields: ['total_followers_count']
    },

    // ========== TIKTOK ADS ==========
    {
        key: 'ttads_spend_trend',
        title: 'Napi k\u00f6lt\u00e9s',
        description: 'Napi hirdet\u00e9si k\u00f6lt\u00e9s trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ff6b9d',
        platform: 'TIKTOK_ADS',
        windsorFields: ['spend', 'date']
    },
    {
        key: 'ttads_impressions_clicks',
        title: 'Impresszi\u00f3k \u00e9s kattint\u00e1sok',
        description: 'Napi impresszi\u00f3k \u00e9s kattint\u00e1sok',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'TIKTOK_ADS',
        windsorFields: ['impressions', 'clicks', 'date']
    },
    {
        key: 'ttads_ctr_trend',
        title: 'CTR trend',
        description: '\u00c1tkattint\u00e1si ar\u00e1ny trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'TIKTOK_ADS',
        windsorFields: ['ctr', 'date']
    },
    {
        key: 'ttads_cpc_cpm',
        title: 'CPC \u00e9s CPM',
        description: 'Kattint\u00e1sonk\u00e9nti \u00e9s ezres megjelen\u00e9senk\u00e9nti k\u00f6lts\u00e9g',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#bc6aff',
        platform: 'TIKTOK_ADS',
        windsorFields: ['cpc', 'cpm', 'date']
    },
    {
        key: 'ttads_conversions',
        title: 'Konverzi\u00f3k',
        description: 'Napi konverzi\u00f3k sz\u00e1ma',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#00d4aa',
        platform: 'TIKTOK_ADS',
        windsorFields: ['conversions', 'date']
    },
    {
        key: 'ttads_cost_per_conversion',
        title: 'K\u00f6lts\u00e9g/konverzi\u00f3',
        description: 'Konverzi\u00f3nk\u00e9nti k\u00f6lts\u00e9g trend',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#ffce44',
        platform: 'TIKTOK_ADS',
        windsorFields: ['cost_per_conversion', 'date']
    },
    {
        key: 'ttads_campaign_perf',
        title: 'Kamp\u00e1ny teljes\u00edtm\u00e9ny',
        description: 'Kamp\u00e1nyok r\u00e9szletes teljes\u00edtm\u00e9nye',
        category: CHART_CATEGORIES.ADS,
        type: 'table',
        color: '#00d4ff',
        platform: 'TIKTOK_ADS',
        windsorFields: ['campaign_name', 'impressions', 'clicks', 'spend', 'cpc', 'ctr', 'conversions']
    },
    {
        key: 'ttads_video_engagement',
        title: 'Vide\u00f3 lej\u00e1tsz\u00e1sok',
        description: 'Vide\u00f3 lej\u00e1tsz\u00e1sok hirdet\u00e9sekben',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#ff6b6b',
        platform: 'TIKTOK_ADS',
        windsorFields: ['video_play_actions', 'video_watched_2s', 'video_watched_6s', 'date']
    },

    // ========== FACEBOOK (NEW) ==========
    {
        key: 'fb_video_views',
        title: 'Oldal vide\u00f3 megtekint\u00e9sek',
        description: 'Oldal vide\u00f3 megtekint\u00e9sek trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_video_views', 'date']
    },
    {
        key: 'fb_follows_trend',
        title: 'K\u00f6vet\u0151 v\u00e1ltoz\u00e1s',
        description: 'K\u00f6vet\u0151/k\u00f6vet\u00e9st\u00f6rl\u00e9s napi trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_daily_follows', 'page_daily_unfollows', 'date']
    },
    {
        key: 'fb_reaction_breakdown',
        title: 'Reakci\u00f3 t\u00edpusok',
        description: 'Reakci\u00f3 t\u00edpus eloszl\u00e1s (like/love/wow/haha)',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#bc6aff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_reactions_like_total', 'post_reactions_love_total', 'post_reactions_wow_total', 'post_reactions_haha_total', 'date']
    },
    {
        key: 'fb_page_video_time',
        title: 'Vide\u00f3 n\u00e9z\u00e9si id\u0151',
        description: 'Oldal vide\u00f3 n\u00e9z\u00e9si id\u0151 trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ffce44',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_video_view_time', 'date']
    },
    {
        key: 'fb_reel_performance',
        title: 'Reel teljes\u00edtm\u00e9ny',
        description: 'Facebook Reel tartalmak teljes\u00edtm\u00e9nye',
        category: CHART_CATEGORIES.POST,
        type: 'table',
        color: '#00d4ff',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_id', 'post_message', 'post_created_time', 'post_video_views', 'post_reactions', 'post_comments', 'post_shares', 'post_permalink']
    },

    // ========== INSTAGRAM BUSINESS (NEW) ==========
    {
        key: 'ig_media_type_breakdown',
        title: 'Tartalom t\u00edpus mix',
        description: 'Tartalom t\u00edpus eloszl\u00e1s (IMAGE/VIDEO/REEL/CAROUSEL)',
        category: CHART_CATEGORIES.MEDIA,
        type: 'bar',
        color: '#e040fb',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'caption', 'timestamp', 'impressions', 'reach', 'likes', 'comments']
    },
    {
        key: 'ig_reel_performance',
        title: 'Reel megtekint\u00e9sek',
        description: 'Reel megtekint\u00e9sek \u00e9s interakci\u00f3k',
        category: CHART_CATEGORIES.MEDIA,
        type: 'bar',
        color: '#bc6aff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_reel_video_views', 'media_reel_avg_watch_time', 'date']
    },
    {
        key: 'ig_story_overview',
        title: 'Story \u00e1ttekint\u00e9s',
        description: 'Story el\u00e9r\u00e9s, megtekint\u00e9sek, kil\u00e9p\u00e9sek',
        category: CHART_CATEGORIES.MEDIA,
        type: 'bar',
        color: '#ff6b9d',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['story_reach', 'story_views', 'story_exits', 'date']
    },
    {
        key: 'ig_save_rate',
        title: 'Ment\u00e9si ar\u00e1ny',
        description: 'Ment\u00e9si ar\u00e1ny trend',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#00d4aa',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_saved', 'media_reach', 'date'],
        calculated: true
    },
    {
        key: 'ig_daily_followers',
        title: 'Napi \u00faj k\u00f6vet\u0151k',
        description: 'Napi k\u00f6vet\u0151sz\u00e1m v\u00e1ltoz\u00e1s',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['follower_count_1d', 'date']
    },

    // ========== INSTAGRAM PUBLIC ==========
    {
        key: 'igpub_engagement_overview',
        title: 'Engagement \u00e1ttekint\u00e9s',
        description: 'Like-ok \u00e9s kommentek \u00f6sszes\u00edtve',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#e040fb',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_like_count', 'media_comments_count', 'date']
    },
    {
        key: 'igpub_avg_engagement',
        title: '\u00c1tlag engagement/poszt',
        description: '\u00c1tlagos like \u00e9s komment posztonk\u00e9nt',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#bc6aff',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['likes_per_post', 'comments_per_post', 'date'],
        calculated: true
    },
    {
        key: 'igpub_all_media',
        title: '\u00d6sszes tartalom',
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
        description: 'Legt\u00f6bb like-ot kapott tartalmak',
        category: CHART_CATEGORIES.MEDIA,
        type: 'table',
        color: '#00ff95',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'media_caption', 'media_like_count', 'media_comments_count', 'media_type', 'media_permalink', 'media_timestamp']
    },

    // ========== FACEBOOK (MORE) ==========
    {
        key: 'fb_worst_3_posts',
        title: 'Facebook leggyeng\u00e9bb 3 poszt',
        description: 'Legkevesebb el\u00e9r\u00e9s\u0171 posztok',
        category: CHART_CATEGORIES.POST,
        type: 'table',
        color: '#ff6b6b',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['post_id', 'post_message', 'post_created_time', 'post_impressions', 'post_reach', 'post_reactions', 'post_comments', 'post_shares', 'post_clicks', 'post_permalink']
    },
    {
        key: 'fb_engaged_users',
        title: 'Elk\u00f6telezett felhaszn\u00e1l\u00f3k',
        description: 'Napi elk\u00f6telezett felhaszn\u00e1l\u00f3k trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ff6b9d',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['engaged_users', 'date']
    },
    {
        key: 'fb_page_views',
        title: 'Oldal megtekint\u00e9sek',
        description: 'Napi oldal megtekint\u00e9sek trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#9d4edd',
        platform: 'FACEBOOK_ORGANIC',
        windsorFields: ['page_views_total', 'date']
    },
    {
        key: 'fb_engagement_rate',
        title: 'Facebook engagement rate',
        description: '(Reakci\u00f3k + Kommentek + Megoszt\u00e1sok) / El\u00e9r\u00e9s %',
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
        title: 'Leggyeng\u00e9bb 3 tartalom',
        description: 'Legkevesebb like-ot kapott tartalmak',
        category: CHART_CATEGORIES.MEDIA,
        type: 'table',
        color: '#ff6b6b',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['media_id', 'media_caption', 'media_like_count', 'media_comments_count', 'media_type', 'media_permalink', 'media_timestamp']
    },
    {
        key: 'igpub_followers_trend',
        title: 'K\u00f6vet\u0151k trend',
        description: 'K\u00f6vet\u0151sz\u00e1m alakul\u00e1sa az id\u0151szakban',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        platform: 'INSTAGRAM_ORGANIC',
        windsorFields: ['profile_followers_count', 'date']
    },
    {
        key: 'igpub_engagement_rate',
        title: 'IG Public engagement rate',
        description: '(Like-ok + Kommentek) / K\u00f6vet\u0151k %',
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
        title: '\u00c1tlagos n\u00e9z\u00e9si %',
        description: '\u00c1tlagos n\u00e9z\u00e9si sz\u00e1zal\u00e9k vide\u00f3nk\u00e9nt',
        category: CHART_CATEGORIES.VIDEO,
        type: 'bar',
        color: '#ffce44',
        platform: 'YOUTUBE',
        windsorFields: ['average_view_percentage', 'video_title', 'video_id']
    },
    {
        key: 'yt_playlist_adds',
        title: 'Playlisthez ad\u00e1s',
        description: 'Playlisthez ad\u00e1s trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00d4aa',
        platform: 'YOUTUBE',
        windsorFields: ['videos_added_to_playlists', 'date']
    },
    {
        key: 'yt_premium_views',
        title: 'YouTube Premium n\u00e9z\u00e9sek',
        description: 'YouTube Premium megtekint\u00e9sek',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#ff0000',
        platform: 'YOUTUBE',
        windsorFields: ['red_views', 'date']
    },
    {
        key: 'yt_likes_dislikes',
        title: 'Like/Dislike ar\u00e1ny',
        description: 'Like \u00e9s dislike ar\u00e1ny trend',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#4d96ff',
        platform: 'YOUTUBE',
        windsorFields: ['likes', 'dislikes', 'date']
    },
];

// Get all required Windsor fields for a set of charts
export function getRequiredFields(chartKeys) {
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
export function validateChartKeys(keys) {
    const validKeys = chartCatalog.map(c => c.key);
    const invalid = keys.filter(k => !validKeys.includes(k));
    return {
        valid: invalid.length === 0,
        invalidKeys: invalid
    };
}

// Get catalog grouped by category
export function getCatalogByCategory() {
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
export function getCatalogByPlatform(platform) {
    if (!platform) return chartCatalog;
    return chartCatalog.filter(c => c.platform === platform);
}
