// Shared platform metrics configuration
// Used by admin charts page and dashboard config

export interface MetricItem {
  key: string;
  label: string;
  /** Chart keys needed to compute this metric */
  chartKeys: string[];
}

export interface PlatformMetricConfig {
  label: string;
  color: string;
  platform: 'tiktok' | 'facebook' | 'instagram' | 'youtube';
  kpis: MetricItem[];
  daily: MetricItem[];
  distributions: MetricItem[];
}

export const PLATFORM_METRICS: Record<string, PlatformMetricConfig> = {
  TIKTOK_ORGANIC: {
    label: 'TikTok Organic',
    color: 'var(--platform-tiktok)',
    platform: 'tiktok',
    kpis: [
      { key: 'tt_followers', label: 'Össz. követőnövekedés', chartKeys: ['followers_growth'] },
      { key: 'tt_total_followers', label: 'Összes követő', chartKeys: ['tt_total_followers'] },
      { key: 'tt_total_views', label: 'Össz. megtekintés', chartKeys: ['all_videos'] },
      { key: 'tt_profile_views', label: 'Profilnézetek', chartKeys: ['profile_views'] },
      { key: 'tt_likes', label: 'Like-ok', chartKeys: ['daily_likes'] },
      { key: 'tt_comments', label: 'Kommentek', chartKeys: ['daily_comments'] },
      { key: 'tt_shares', label: 'Megosztások', chartKeys: ['daily_shares'] },
      { key: 'tt_er', label: 'ER%', chartKeys: ['all_videos'] },
      { key: 'tt_videos', label: 'Videók száma', chartKeys: ['all_videos'] },
      { key: 'tt_bio_clicks', label: 'Bio link kattintás', chartKeys: ['tt_bio_link_clicks'] },
      { key: 'tt_like_per_view', label: 'Like / megtekintés', chartKeys: ['all_videos'] },
      { key: 'tt_comment_per_view', label: 'Komment / megtekintés', chartKeys: ['all_videos'] },
      { key: 'tt_share_per_view', label: 'Megosztás / megtekintés', chartKeys: ['all_videos'] },
      { key: 'tt_interactions_total', label: 'Összes interakció', chartKeys: ['daily_likes', 'daily_comments', 'daily_shares'] },
      { key: 'tt_avg_views', label: 'Átl. megtekintés/videó', chartKeys: ['all_videos'] },
      { key: 'tt_avg_likes', label: 'Átl. like/videó', chartKeys: ['all_videos'] },
      { key: 'tt_avg_comments', label: 'Átl. komment/videó', chartKeys: ['all_videos'] },
      { key: 'tt_avg_shares', label: 'Átl. megosztás/videó', chartKeys: ['all_videos'] },
      { key: 'tt_avg_watch_time', label: 'Átl. nézési idő (mp)', chartKeys: ['all_videos'] },
      { key: 'tt_avg_full_watch', label: 'Átl. végignézés%', chartKeys: ['all_videos'] },
      { key: 'tt_avg_new_followers', label: 'Átl. új követő/videó', chartKeys: ['all_videos'] },
      { key: 'tt_total_reach', label: 'Össz. elérés', chartKeys: ['all_videos'] },
      { key: 'tt_daily_reached_total', label: 'Napi elért közönség', chartKeys: ['tt_daily_reached'] },
      { key: 'tt_engaged_total', label: 'Elkötelezett közönség', chartKeys: ['tt_engaged_audience'] },
      { key: 'tt_email_clicks_total', label: 'Email kattintások', chartKeys: ['tt_email_clicks'] },
      { key: 'tt_phone_clicks_total', label: 'Telefonszám kattintások', chartKeys: ['tt_phone_clicks'] },
    ],
    daily: [
      { key: 'followers_growth', label: 'Napi követők trend', chartKeys: ['followers_growth'] },
      { key: 'tt_total_followers', label: 'Összes követő trend', chartKeys: ['tt_total_followers'] },
      { key: 'profile_views', label: 'Profilnézetek', chartKeys: ['profile_views'] },
      { key: 'daily_likes', label: 'Napi like-ok', chartKeys: ['daily_likes'] },
      { key: 'daily_comments', label: 'Napi kommentek', chartKeys: ['daily_comments'] },
      { key: 'daily_shares', label: 'Napi megosztások', chartKeys: ['daily_shares'] },
      { key: 'tt_bio_link_clicks', label: 'Bio link kattintás', chartKeys: ['tt_bio_link_clicks'] },
      { key: 'tt_daily_reached', label: 'Napi elért közönség', chartKeys: ['tt_daily_reached'] },
      { key: 'tt_engaged_audience', label: 'Elkötelezett közönség', chartKeys: ['tt_engaged_audience'] },
      { key: 'tt_follower_change', label: 'Követő változás ±', chartKeys: ['tt_follower_change'] },
      { key: 'tt_email_clicks', label: 'Email kattintások', chartKeys: ['tt_email_clicks'] },
      { key: 'tt_phone_clicks', label: 'Telefonszám kattintások', chartKeys: ['tt_phone_clicks'] },
    ],
    distributions: [
      { key: 'engagement_by_day', label: 'Engagement napok szerint', chartKeys: ['engagement_by_day'] },
      { key: 'engagement_by_hour', label: 'Engagement órák szerint', chartKeys: ['engagement_by_hour'] },
      { key: 'tt_traffic_sources', label: 'Forgalmi források', chartKeys: ['tt_traffic_sources'] },
      { key: 'tt_audience_demographics', label: 'Életkori megoszlás', chartKeys: ['tt_audience_demographics'] },
      { key: 'tt_gender_demographics', label: 'Nemek megoszlása', chartKeys: ['tt_gender_demographics'] },
      { key: 'tt_audience_countries', label: 'Közönség országok', chartKeys: ['tt_audience_countries'] },
      { key: 'tt_audience_cities', label: 'Közönség városok', chartKeys: ['tt_audience_cities'] },
      { key: 'all_videos', label: 'Összes videó', chartKeys: ['all_videos'] },
      { key: 'top_3_videos', label: 'Top 3 videó', chartKeys: ['top_3_videos'] },
      { key: 'worst_3_videos', label: 'Leggyengébb 3 videó', chartKeys: ['worst_3_videos'] },
    ],
  },
  TIKTOK_ADS: {
    label: 'TikTok Ads',
    color: 'var(--platform-tiktok)',
    platform: 'tiktok',
    kpis: [
      { key: 'ttads_spend', label: 'Költés', chartKeys: ['ttads_spend_trend'] },
      { key: 'ttads_impressions', label: 'Impressziók', chartKeys: ['ttads_impressions_clicks'] },
      { key: 'ttads_clicks', label: 'Kattintások', chartKeys: ['ttads_impressions_clicks'] },
      { key: 'ttads_ctr', label: 'CTR%', chartKeys: ['ttads_ctr_trend'] },
      { key: 'ttads_cpc', label: 'CPC', chartKeys: ['ttads_cpc_cpm'] },
      { key: 'ttads_cpm', label: 'CPM', chartKeys: ['ttads_cpc_cpm'] },
      { key: 'ttads_conv', label: 'Konverziók', chartKeys: ['ttads_conversions'] },
      { key: 'ttads_cost_conv', label: 'Költség/konverzió', chartKeys: ['ttads_cost_per_conversion'] },
      { key: 'ttads_roas', label: 'ROAS', chartKeys: ['ttads_spend_trend', 'ttads_conversions'] },
      { key: 'ttads_conv_rate', label: 'Konverziós arány%', chartKeys: ['ttads_impressions_clicks', 'ttads_conversions'] },
      { key: 'ttads_spend_per_click', label: 'Költés/kattintás', chartKeys: ['ttads_spend_trend', 'ttads_impressions_clicks'] },
      { key: 'ttads_cpr', label: 'CPR (1000 elérés)', chartKeys: ['ttads_reach_cost'] },
      { key: 'ttads_app_installs', label: 'App telepítések', chartKeys: ['ttads_app_install'] },
      { key: 'ttads_payments', label: 'Fizetés konverziók', chartKeys: ['ttads_payment_trend'] },
      { key: 'ttads_registrations', label: 'Regisztrációk', chartKeys: ['ttads_registration'] },
      { key: 'ttads_reach_total', label: 'Elérés', chartKeys: ['ttads_reach_cost'] },
    ],
    daily: [
      { key: 'ttads_spend_trend', label: 'Költés trend', chartKeys: ['ttads_spend_trend'] },
      { key: 'ttads_impressions_clicks', label: 'Impressziók & kattintások', chartKeys: ['ttads_impressions_clicks'] },
      { key: 'ttads_ctr_trend', label: 'CTR trend', chartKeys: ['ttads_ctr_trend'] },
      { key: 'ttads_cpc_cpm', label: 'CPC & CPM', chartKeys: ['ttads_cpc_cpm'] },
      { key: 'ttads_conversions', label: 'Konverziók', chartKeys: ['ttads_conversions'] },
      { key: 'ttads_cost_per_conversion', label: 'Költség/konverzió', chartKeys: ['ttads_cost_per_conversion'] },
      { key: 'ttads_video_engagement', label: 'Videó engagement', chartKeys: ['ttads_video_engagement'] },
      { key: 'ttads_reach_cost', label: 'Elérési költség (CPR)', chartKeys: ['ttads_reach_cost'] },
      { key: 'ttads_video_play_time', label: 'Átl. videó lejátszás', chartKeys: ['ttads_video_play_time'] },
      { key: 'ttads_app_install', label: 'App telepítések', chartKeys: ['ttads_app_install'] },
      { key: 'ttads_payment_trend', label: 'Fizetés konverziók', chartKeys: ['ttads_payment_trend'] },
      { key: 'ttads_registration', label: 'Regisztrációk', chartKeys: ['ttads_registration'] },
    ],
    distributions: [
      { key: 'ttads_campaign_perf', label: 'Kampány teljesítmény', chartKeys: ['ttads_campaign_perf'] },
      { key: 'ttads_adgroup_perf', label: 'Hirdetéscsoport teljesítmény', chartKeys: ['ttads_adgroup_perf'] },
    ],
  },
  FACEBOOK_ORGANIC: {
    label: 'Facebook',
    color: 'var(--platform-facebook)',
    platform: 'facebook',
    kpis: [
      { key: 'fb_followers', label: 'Követők', chartKeys: ['fb_page_fans'] },
      { key: 'fb_reach', label: 'Elérés', chartKeys: ['fb_page_reach'] },
      { key: 'fb_impressions', label: 'Impressziók', chartKeys: ['fb_page_reach'] },
      { key: 'fb_reactions', label: 'Reakciók', chartKeys: ['fb_engagement'] },
      { key: 'fb_comments', label: 'Kommentek', chartKeys: ['fb_engagement'] },
      { key: 'fb_shares', label: 'Megosztások', chartKeys: ['fb_engagement'] },
      { key: 'fb_posts', label: 'Posztok', chartKeys: ['fb_all_posts'] },
      { key: 'fb_new_follows', label: 'Napi új követők', chartKeys: ['fb_follows_trend'] },
      { key: 'fb_video_views', label: 'Videó nézések', chartKeys: ['fb_video_views'] },
      { key: 'fb_engaged_users', label: 'Elkötelezett felhasználók', chartKeys: ['fb_engaged_users'] },
      { key: 'fb_page_views', label: 'Oldal megtekintések', chartKeys: ['fb_page_views'] },
      { key: 'fb_interactions_total', label: 'Összes interakció', chartKeys: ['fb_engagement'] },
      { key: 'fb_reaction_per_reach', label: 'Reakció / elérés', chartKeys: ['fb_engagement', 'fb_page_reach'] },
      { key: 'fb_er', label: 'Engagement rate%', chartKeys: ['fb_engagement', 'fb_page_reach'] },
      { key: 'fb_avg_reach_post', label: 'Átl. elérés/poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_avg_reactions_post', label: 'Átl. reakció/poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_avg_comments_post', label: 'Átl. komment/poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_avg_shares_post', label: 'Átl. megosztás/poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_avg_clicks_post', label: 'Átl. kattintás/poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_organic_impressions', label: 'Organikus impressziók', chartKeys: ['fb_impressions_breakdown'] },
      { key: 'fb_paid_impressions', label: 'Fizetett impressziók', chartKeys: ['fb_impressions_breakdown'] },
      { key: 'fb_page_actions_total', label: 'Oldal akciók', chartKeys: ['fb_page_actions'] },
      { key: 'fb_reels_plays_total', label: 'Reels lejátszások', chartKeys: ['fb_reels_plays'] },
    ],
    daily: [
      { key: 'fb_page_reach', label: 'Oldal elérés', chartKeys: ['fb_page_reach'] },
      { key: 'fb_page_fans', label: 'Követők trend', chartKeys: ['fb_page_fans'] },
      { key: 'fb_engagement', label: 'Engagement', chartKeys: ['fb_engagement'] },
      { key: 'fb_post_engagement', label: 'Poszt engagement', chartKeys: ['fb_post_engagement'] },
      { key: 'fb_video_views', label: 'Videó nézések', chartKeys: ['fb_video_views'] },
      { key: 'fb_follows_trend', label: 'Követők változás', chartKeys: ['fb_follows_trend'] },
      { key: 'fb_page_video_time', label: 'Videó nézési idő', chartKeys: ['fb_page_video_time'] },
      { key: 'fb_engaged_users', label: 'Elkötelezett felhasználók', chartKeys: ['fb_engaged_users'] },
      { key: 'fb_page_views', label: 'Oldal megtekintések', chartKeys: ['fb_page_views'] },
      { key: 'fb_impressions_breakdown', label: 'Organikus vs fizetett', chartKeys: ['fb_impressions_breakdown'] },
      { key: 'fb_post_clicks_breakdown', label: 'Kattintás típusok', chartKeys: ['fb_post_clicks_breakdown'] },
      { key: 'fb_page_actions', label: 'Oldal akciók', chartKeys: ['fb_page_actions'] },
      { key: 'fb_reels_plays', label: 'Reels lejátszások', chartKeys: ['fb_reels_plays'] },
    ],
    distributions: [
      { key: 'fb_reaction_breakdown', label: 'Reakció megoszlás', chartKeys: ['fb_reaction_breakdown'] },
      { key: 'fb_fans_country', label: 'Követők országonként', chartKeys: ['fb_fans_country'] },
      { key: 'fb_fans_city', label: 'Követők városonként', chartKeys: ['fb_fans_city'] },
      { key: 'fb_all_posts', label: 'Összes poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_top_3_posts', label: 'Top 3 poszt', chartKeys: ['fb_top_3_posts'] },
      { key: 'fb_worst_3_posts', label: 'Leggyengébb 3 poszt', chartKeys: ['fb_worst_3_posts'] },
      { key: 'fb_reel_performance', label: 'Reel teljesítmény', chartKeys: ['fb_reel_performance'] },
    ],
  },
  INSTAGRAM_ORGANIC: {
    label: 'Instagram',
    color: 'var(--platform-instagram)',
    platform: 'instagram',
    kpis: [
      { key: 'ig_followers', label: 'Követők', chartKeys: ['ig_follower_growth'] },
      { key: 'ig_reach_kpi', label: 'Elérés', chartKeys: ['ig_reach'] },
      { key: 'ig_impressions', label: 'Impressziók', chartKeys: ['ig_reach'] },
      { key: 'ig_likes', label: 'Like-ok', chartKeys: ['ig_engagement'] },
      { key: 'ig_comments', label: 'Kommentek', chartKeys: ['ig_engagement'] },
      { key: 'ig_shares', label: 'Megosztások', chartKeys: ['ig_engagement'] },
      { key: 'ig_saves', label: 'Mentések', chartKeys: ['ig_engagement'] },
      { key: 'ig_profile_views', label: 'Profilnézetek', chartKeys: ['ig_profile_activity'] },
      { key: 'ig_media_count', label: 'Tartalmak', chartKeys: ['ig_all_media'] },
      { key: 'ig_new_followers', label: 'Napi új követők', chartKeys: ['ig_daily_followers'] },
      { key: 'ig_save_rate_kpi', label: 'Mentési arány', chartKeys: ['ig_save_rate'] },
      { key: 'ig_story_reach', label: 'Story elérés', chartKeys: ['ig_story_overview'] },
      { key: 'ig_interactions_total', label: 'Összes interakció', chartKeys: ['ig_engagement'] },
      { key: 'ig_like_per_reach', label: 'Like / elérés', chartKeys: ['ig_engagement', 'ig_reach'] },
      { key: 'ig_er', label: 'Engagement rate%', chartKeys: ['ig_engagement', 'ig_reach'] },
      { key: 'ig_avg_reach_media', label: 'Átl. elérés/tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_avg_likes_media', label: 'Átl. like/tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_avg_comments_media', label: 'Átl. komment/tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_avg_saves_media', label: 'Átl. mentés/tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_avg_shares_media', label: 'Átl. megosztás/tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_website_clicks_total', label: 'Weboldal kattintások', chartKeys: ['ig_website_clicks_trend'] },
      { key: 'ig_total_clicks', label: 'Összes profil kattintás', chartKeys: ['ig_clicks'] },
    ],
    daily: [
      { key: 'ig_reach', label: 'Elérés & impressziók', chartKeys: ['ig_reach'] },
      { key: 'ig_follower_growth', label: 'Követők trend', chartKeys: ['ig_follower_growth'] },
      { key: 'ig_engagement', label: 'Engagement', chartKeys: ['ig_engagement'] },
      { key: 'ig_profile_activity', label: 'Profil aktivitás', chartKeys: ['ig_profile_activity'] },
      { key: 'ig_daily_followers', label: 'Napi új követők', chartKeys: ['ig_daily_followers'] },
      { key: 'ig_save_rate', label: 'Mentési arány', chartKeys: ['ig_save_rate'] },
      { key: 'ig_reel_performance', label: 'Reel teljesítmény', chartKeys: ['ig_reel_performance'] },
      { key: 'ig_story_overview', label: 'Story áttekintés', chartKeys: ['ig_story_overview'] },
      { key: 'ig_website_clicks_trend', label: 'Weboldal kattintások', chartKeys: ['ig_website_clicks_trend'] },
      { key: 'ig_story_interactions', label: 'Story interakciók', chartKeys: ['ig_story_interactions'] },
      { key: 'ig_story_navigation', label: 'Story navigáció', chartKeys: ['ig_story_navigation'] },
      { key: 'ig_clicks', label: 'Profil kattintások', chartKeys: ['ig_clicks'] },
    ],
    distributions: [
      { key: 'ig_media_type_breakdown', label: 'Tartalom típus megoszlás', chartKeys: ['ig_media_type_breakdown'] },
      { key: 'ig_audience_age', label: 'Életkori megoszlás', chartKeys: ['ig_audience_age'] },
      { key: 'ig_audience_gender', label: 'Nemek megoszlása', chartKeys: ['ig_audience_gender'] },
      { key: 'ig_audience_country', label: 'Közönség országok', chartKeys: ['ig_audience_country'] },
      { key: 'ig_audience_city', label: 'Közönség városok', chartKeys: ['ig_audience_city'] },
      { key: 'ig_all_media', label: 'Összes tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_top_3_media', label: 'Top 3 tartalom', chartKeys: ['ig_top_3_media'] },
      { key: 'igpub_all_media', label: 'Publikus tartalmak', chartKeys: ['igpub_all_media'] },
      { key: 'igpub_top_3_media', label: 'Top 3 publikus tartalom', chartKeys: ['igpub_top_3_media'] },
      { key: 'igpub_worst_3_media', label: 'Leggyengébb 3 publikus tartalom', chartKeys: ['igpub_worst_3_media'] },
    ],
  },
  YOUTUBE: {
    label: 'YouTube',
    color: 'var(--platform-youtube)',
    platform: 'youtube',
    kpis: [
      { key: 'yt_subs', label: 'Új feliratkozók', chartKeys: ['yt_subscribers_growth'] },
      { key: 'yt_views_kpi', label: 'Megtekintések', chartKeys: ['yt_views_trend'] },
      { key: 'yt_watch', label: 'Nézési idő', chartKeys: ['yt_watch_time'] },
      { key: 'yt_likes_kpi', label: 'Like-ok', chartKeys: ['yt_daily_engagement'] },
      { key: 'yt_comments_kpi', label: 'Kommentek', chartKeys: ['yt_daily_engagement'] },
      { key: 'yt_shares_kpi', label: 'Megosztások', chartKeys: ['yt_daily_engagement'] },
      { key: 'yt_er', label: 'ER%', chartKeys: ['yt_engagement_rate'] },
      { key: 'yt_video_count', label: 'Videók', chartKeys: ['yt_all_videos'] },
      { key: 'yt_avg_view', label: 'Átl. nézési %', chartKeys: ['yt_avg_view_pct'] },
      { key: 'yt_playlist', label: 'Playlist hozzáadás', chartKeys: ['yt_playlist_adds'] },
      { key: 'yt_like_per_view', label: 'Like / megtekintés', chartKeys: ['yt_daily_engagement', 'yt_views_trend'] },
      { key: 'yt_comment_per_view', label: 'Komment / megtekintés', chartKeys: ['yt_daily_engagement', 'yt_views_trend'] },
      { key: 'yt_interactions_total', label: 'Összes interakció', chartKeys: ['yt_daily_engagement'] },
      { key: 'yt_avg_views_video', label: 'Átl. megtekintés/videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_avg_likes_video', label: 'Átl. like/videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_avg_comments_video', label: 'Átl. komment/videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_avg_watch_time_video', label: 'Átl. nézési idő/videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_avg_er_video', label: 'Átl. ER%/videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_total_subs', label: 'Összes feliratkozó', chartKeys: ['yt_subscriber_count'] },
      { key: 'yt_card_clicks_kpi', label: 'Kártya kattintások', chartKeys: ['yt_card_performance'] },
      { key: 'yt_card_ctr_kpi', label: 'Kártya CTR%', chartKeys: ['yt_card_ctr'] },
      { key: 'yt_red_watch', label: 'Premium nézési idő', chartKeys: ['yt_red_watch_time'] },
    ],
    daily: [
      { key: 'yt_subscribers_growth', label: 'Feliratkozók trend', chartKeys: ['yt_subscribers_growth'] },
      { key: 'yt_subscriber_count', label: 'Összes feliratkozó', chartKeys: ['yt_subscriber_count'] },
      { key: 'yt_views_trend', label: 'Megtekintések', chartKeys: ['yt_views_trend'] },
      { key: 'yt_watch_time', label: 'Nézési idő', chartKeys: ['yt_watch_time'] },
      { key: 'yt_daily_engagement', label: 'Napi engagement', chartKeys: ['yt_daily_engagement'] },
      { key: 'yt_engagement_rate', label: 'Engagement rate', chartKeys: ['yt_engagement_rate'] },
      { key: 'yt_playlist_adds', label: 'Playlist hozzáadás', chartKeys: ['yt_playlist_adds'] },
      { key: 'yt_premium_views', label: 'Premium nézések', chartKeys: ['yt_premium_views'] },
      { key: 'yt_likes_dislikes', label: 'Like-ok & dislike-ok', chartKeys: ['yt_likes_dislikes'] },
      { key: 'yt_card_performance', label: 'Kártya teljesítmény', chartKeys: ['yt_card_performance'] },
      { key: 'yt_red_watch_time', label: 'Premium nézési idő', chartKeys: ['yt_red_watch_time'] },
      { key: 'yt_videos_published', label: 'Közzétett videók', chartKeys: ['yt_videos_published'] },
      { key: 'yt_playlist_removes', label: 'Playlist eltávolítás', chartKeys: ['yt_playlist_removes'] },
      { key: 'yt_card_ctr', label: 'Kártya CTR', chartKeys: ['yt_card_ctr'] },
    ],
    distributions: [
      { key: 'yt_top_countries', label: 'Top országok', chartKeys: ['yt_top_countries'] },
      { key: 'yt_avg_view_pct', label: 'Átl. nézési %', chartKeys: ['yt_avg_view_pct'] },
      { key: 'yt_all_videos', label: 'Összes videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_top_5_videos', label: 'Top 5 videó', chartKeys: ['yt_top_5_videos'] },
      { key: 'yt_worst_5_videos', label: 'Leggyengébb 5 videó', chartKeys: ['yt_worst_5_videos'] },
    ],
  },
};

export const PLATFORM_ORDER = ['TIKTOK_ORGANIC', 'FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC', 'YOUTUBE', 'TIKTOK_ADS'];

export const DISABLED_PLATFORMS = new Set<string>([]);

/**
 * Collect all chart keys needed for a given set of KPI keys and chart keys.
 * Used by client dashboard to determine which Windsor API calls to make.
 */
export function collectChartKeysForConfig(
  platformKey: string,
  config: { kpis: string[]; charts: string[] }
): string[] {
  const pm = PLATFORM_METRICS[platformKey];
  if (!pm) return [];

  const keys = new Set<string>();

  // Collect chart keys needed for selected KPIs
  for (const kpiKey of config.kpis) {
    const kpi = pm.kpis.find(k => k.key === kpiKey);
    if (kpi) kpi.chartKeys.forEach(k => keys.add(k));
  }

  // Collect chart keys needed for selected charts (daily + distributions)
  for (const chartKey of config.charts) {
    const daily = pm.daily.find(d => d.key === chartKey);
    if (daily) { daily.chartKeys.forEach(k => keys.add(k)); continue; }
    const dist = pm.distributions.find(d => d.key === chartKey);
    if (dist) dist.chartKeys.forEach(k => keys.add(k));
  }

  return [...keys];
}
