'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Company, getCompanies, getChartCatalog, generateCharts, ChartDefinition, ChartData, ChartsResponse } from '@/lib/api';
import { extractKPIs, aggregateMonthlyKPIs, generateMonthRanges, KPI } from '@/lib/chartHelpers';
import { ChartLazy as Chart } from '@/components/ChartLazy';
import { VideoTable } from '@/components/VideoTable';
import { CompanyPicker, ALL_COMPANIES_ID } from '@/components/CompanyPicker';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';
import { KPICard as PlatformKPICard } from '@/components/KPICard';
import { CalendarDays, ChevronDown, ChevronRight, Check, BarChart3, Eye, Heart, MessageCircle, Share2, Video, Users, TrendingUp } from 'lucide-react';
import { WindsorKeyGuard } from '@/components/WindsorKeyGuard';

// ============================================
// PLATFORM METRICS CONFIG
// ============================================

interface MetricItem {
  key: string;
  label: string;
  /** Chart keys needed to compute this metric */
  chartKeys: string[];
}

interface PlatformMetricConfig {
  label: string;
  color: string;
  platform: 'tiktok' | 'facebook' | 'instagram' | 'youtube';
  kpis: MetricItem[];
  daily: MetricItem[];
  distributions: MetricItem[];
}

const PLATFORM_METRICS: Record<string, PlatformMetricConfig> = {
  TIKTOK_ORGANIC: {
    label: 'TikTok Organic',
    color: 'var(--platform-tiktok)',
    platform: 'tiktok',
    kpis: [
      // Alap metrikák
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
      // Arány metrikák
      { key: 'tt_like_per_view', label: 'Like / megtekintés', chartKeys: ['all_videos'] },
      { key: 'tt_comment_per_view', label: 'Komment / megtekintés', chartKeys: ['all_videos'] },
      { key: 'tt_share_per_view', label: 'Megosztás / megtekintés', chartKeys: ['all_videos'] },
      { key: 'tt_interactions_total', label: 'Összes interakció', chartKeys: ['daily_likes', 'daily_comments', 'daily_shares'] },
      // Átlag videó KPI-ok
      { key: 'tt_avg_views', label: 'Átl. megtekintés/videó', chartKeys: ['all_videos'] },
      { key: 'tt_avg_likes', label: 'Átl. like/videó', chartKeys: ['all_videos'] },
      { key: 'tt_avg_comments', label: 'Átl. komment/videó', chartKeys: ['all_videos'] },
      { key: 'tt_avg_shares', label: 'Átl. megosztás/videó', chartKeys: ['all_videos'] },
      // tt_avg_er removed as redundant with tt_er
      { key: 'tt_avg_watch_time', label: 'Átl. nézési idő (mp)', chartKeys: ['all_videos'] },
      { key: 'tt_avg_full_watch', label: 'Átl. végignézés%', chartKeys: ['all_videos'] },
      { key: 'tt_avg_new_followers', label: 'Átl. új követő/videó', chartKeys: ['all_videos'] },
      { key: 'tt_total_reach', label: 'Össz. elérés', chartKeys: ['all_videos'] },
    ],
    daily: [
      { key: 'followers_growth', label: 'Napi követők trend', chartKeys: ['followers_growth'] },
      { key: 'tt_total_followers', label: 'Összes követő trend', chartKeys: ['tt_total_followers'] },
      { key: 'profile_views', label: 'Profilnézetek', chartKeys: ['profile_views'] },
      { key: 'daily_likes', label: 'Napi like-ok', chartKeys: ['daily_likes'] },
      { key: 'daily_comments', label: 'Napi kommentek', chartKeys: ['daily_comments'] },
      { key: 'daily_shares', label: 'Napi megosztások', chartKeys: ['daily_shares'] },
      { key: 'tt_bio_link_clicks', label: 'Bio link kattintás', chartKeys: ['tt_bio_link_clicks'] },
    ],
    distributions: [
      { key: 'engagement_by_day', label: 'Engagement napok szerint', chartKeys: ['engagement_by_day'] },
      { key: 'engagement_by_hour', label: 'Engagement órák szerint', chartKeys: ['engagement_by_hour'] },
      { key: 'tt_traffic_sources', label: 'Forgalmi források', chartKeys: ['tt_traffic_sources'] },
      { key: 'tt_audience_demographics', label: 'Életkori megoszlás', chartKeys: ['tt_audience_demographics'] },
      { key: 'tt_gender_demographics', label: 'Nemek megoszlása', chartKeys: ['tt_gender_demographics'] },
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
      // Arány metrikák
      { key: 'ttads_roas', label: 'ROAS', chartKeys: ['ttads_spend_trend', 'ttads_conversions'] },
      { key: 'ttads_conv_rate', label: 'Konverziós arány%', chartKeys: ['ttads_impressions_clicks', 'ttads_conversions'] },
      { key: 'ttads_spend_per_click', label: 'Költés/kattintás', chartKeys: ['ttads_spend_trend', 'ttads_impressions_clicks'] },
    ],
    daily: [
      { key: 'ttads_spend_trend', label: 'Költés trend', chartKeys: ['ttads_spend_trend'] },
      { key: 'ttads_impressions_clicks', label: 'Impressziók & kattintások', chartKeys: ['ttads_impressions_clicks'] },
      { key: 'ttads_ctr_trend', label: 'CTR trend', chartKeys: ['ttads_ctr_trend'] },
      { key: 'ttads_cpc_cpm', label: 'CPC & CPM', chartKeys: ['ttads_cpc_cpm'] },
      { key: 'ttads_conversions', label: 'Konverziók', chartKeys: ['ttads_conversions'] },
      { key: 'ttads_cost_per_conversion', label: 'Költség/konverzió', chartKeys: ['ttads_cost_per_conversion'] },
      { key: 'ttads_video_engagement', label: 'Videó engagement', chartKeys: ['ttads_video_engagement'] },
    ],
    distributions: [
      { key: 'ttads_campaign_perf', label: 'Kampány teljesítmény', chartKeys: ['ttads_campaign_perf'] },
    ],
  },
  FACEBOOK_ORGANIC: {
    label: 'Facebook',
    color: 'var(--platform-facebook)',
    platform: 'facebook',
    kpis: [
      // Alap metrikák
      { key: 'fb_followers', label: 'Követők', chartKeys: ['fb_page_fans'] },
      { key: 'fb_reach', label: 'Elérés', chartKeys: ['fb_page_reach'] },
      { key: 'fb_impressions', label: 'Impressziók', chartKeys: ['fb_page_reach'] },
      { key: 'fb_reactions', label: 'Reakciók', chartKeys: ['fb_engagement'] },
      { key: 'fb_comments', label: 'Kommentek', chartKeys: ['fb_engagement'] },
      { key: 'fb_shares', label: 'Megosztások', chartKeys: ['fb_engagement'] },
      { key: 'fb_posts', label: 'Posztok', chartKeys: ['fb_all_posts'] },
      { key: 'fb_new_follows', label: 'Napi új követők', chartKeys: ['fb_follows_trend'] },
      { key: 'fb_video_views', label: 'Videó nézések', chartKeys: ['fb_video_views'] },
      // Arány metrikák
      { key: 'fb_interactions_total', label: 'Összes interakció', chartKeys: ['fb_engagement'] },
      { key: 'fb_reaction_per_reach', label: 'Reakció / elérés', chartKeys: ['fb_engagement', 'fb_page_reach'] },
      { key: 'fb_er', label: 'Engagement rate%', chartKeys: ['fb_engagement', 'fb_page_reach'] },
      // Átlag poszt KPI-ok
      { key: 'fb_avg_reach_post', label: 'Átl. elérés/poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_avg_reactions_post', label: 'Átl. reakció/poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_avg_comments_post', label: 'Átl. komment/poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_avg_shares_post', label: 'Átl. megosztás/poszt', chartKeys: ['fb_all_posts'] },
    ],
    daily: [
      { key: 'fb_page_reach', label: 'Oldal elérés', chartKeys: ['fb_page_reach'] },
      { key: 'fb_page_fans', label: 'Követők trend', chartKeys: ['fb_page_fans'] },
      { key: 'fb_engagement', label: 'Engagement', chartKeys: ['fb_engagement'] },
      { key: 'fb_post_engagement', label: 'Poszt engagement', chartKeys: ['fb_post_engagement'] },
      { key: 'fb_video_views', label: 'Videó nézések', chartKeys: ['fb_video_views'] },
      { key: 'fb_follows_trend', label: 'Követők változás', chartKeys: ['fb_follows_trend'] },
      { key: 'fb_page_video_time', label: 'Videó nézési idő', chartKeys: ['fb_page_video_time'] },
    ],
    distributions: [
      { key: 'fb_reaction_breakdown', label: 'Reakció megoszlás', chartKeys: ['fb_reaction_breakdown'] },
      { key: 'fb_all_posts', label: 'Összes poszt', chartKeys: ['fb_all_posts'] },
      { key: 'fb_top_3_posts', label: 'Top 3 poszt', chartKeys: ['fb_top_3_posts'] },
      { key: 'fb_reel_performance', label: 'Reel teljesítmény', chartKeys: ['fb_reel_performance'] },
    ],
  },
  INSTAGRAM_ORGANIC: {
    label: 'Instagram',
    color: 'var(--platform-instagram)',
    platform: 'instagram',
    kpis: [
      // Alap metrikák
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
      // Arány metrikák
      { key: 'ig_interactions_total', label: 'Összes interakció', chartKeys: ['ig_engagement'] },
      { key: 'ig_like_per_reach', label: 'Like / elérés', chartKeys: ['ig_engagement', 'ig_reach'] },
      { key: 'ig_er', label: 'Engagement rate%', chartKeys: ['ig_engagement', 'ig_reach'] },
      // Átlag tartalom KPI-ok
      { key: 'ig_avg_reach_media', label: 'Átl. elérés/tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_avg_likes_media', label: 'Átl. like/tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_avg_comments_media', label: 'Átl. komment/tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_avg_saves_media', label: 'Átl. mentés/tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_avg_shares_media', label: 'Átl. megosztás/tartalom', chartKeys: ['ig_all_media'] },
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
    ],
    distributions: [
      { key: 'ig_media_type_breakdown', label: 'Tartalom típus megoszlás', chartKeys: ['ig_media_type_breakdown'] },
      { key: 'ig_all_media', label: 'Összes tartalom', chartKeys: ['ig_all_media'] },
      { key: 'ig_top_3_media', label: 'Top 3 tartalom', chartKeys: ['ig_top_3_media'] },
    ],
  },
  INSTAGRAM_PUBLIC: {
    label: 'IG Public',
    color: 'var(--platform-instagram)',
    platform: 'instagram',
    kpis: [
      { key: 'igpub_likes', label: 'Like-ok', chartKeys: ['igpub_engagement_overview'] },
      { key: 'igpub_comments', label: 'Kommentek', chartKeys: ['igpub_engagement_overview'] },
      { key: 'igpub_avg_likes', label: 'Átl. like/poszt', chartKeys: ['igpub_avg_engagement'] },
      { key: 'igpub_avg_comments', label: 'Átl. komment/poszt', chartKeys: ['igpub_avg_engagement'] },
      { key: 'igpub_media', label: 'Tartalmak', chartKeys: ['igpub_all_media'] },
      { key: 'igpub_interactions', label: 'Összes interakció', chartKeys: ['igpub_engagement_overview'] },
      { key: 'igpub_avg_interaction', label: 'Átl. interakció/poszt', chartKeys: ['igpub_avg_engagement'] },
    ],
    daily: [
      { key: 'igpub_engagement_overview', label: 'Engagement áttekintés', chartKeys: ['igpub_engagement_overview'] },
      { key: 'igpub_avg_engagement', label: 'Átlag engagement', chartKeys: ['igpub_avg_engagement'] },
    ],
    distributions: [
      { key: 'igpub_all_media', label: 'Összes tartalom', chartKeys: ['igpub_all_media'] },
      { key: 'igpub_top_3_media', label: 'Top 3 tartalom', chartKeys: ['igpub_top_3_media'] },
    ],
  },
  YOUTUBE: {
    label: 'YouTube',
    color: 'var(--platform-youtube)',
    platform: 'youtube',
    kpis: [
      // Alap metrikák
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
      // Arány metrikák
      { key: 'yt_like_per_view', label: 'Like / megtekintés', chartKeys: ['yt_daily_engagement', 'yt_views_trend'] },
      { key: 'yt_comment_per_view', label: 'Komment / megtekintés', chartKeys: ['yt_daily_engagement', 'yt_views_trend'] },
      { key: 'yt_interactions_total', label: 'Összes interakció', chartKeys: ['yt_daily_engagement'] },
      // Átlag videó KPI-ok
      { key: 'yt_avg_views_video', label: 'Átl. megtekintés/videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_avg_likes_video', label: 'Átl. like/videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_avg_comments_video', label: 'Átl. komment/videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_avg_watch_time_video', label: 'Átl. nézési idő/videó', chartKeys: ['yt_all_videos'] },
      { key: 'yt_avg_er_video', label: 'Átl. ER%/videó', chartKeys: ['yt_all_videos'] },
    ],
    daily: [
      { key: 'yt_subscribers_growth', label: 'Feliratkozók trend', chartKeys: ['yt_subscribers_growth'] },
      { key: 'yt_views_trend', label: 'Megtekintések', chartKeys: ['yt_views_trend'] },
      { key: 'yt_watch_time', label: 'Nézési idő', chartKeys: ['yt_watch_time'] },
      { key: 'yt_daily_engagement', label: 'Napi engagement', chartKeys: ['yt_daily_engagement'] },
      { key: 'yt_engagement_rate', label: 'Engagement rate', chartKeys: ['yt_engagement_rate'] },
      { key: 'yt_playlist_adds', label: 'Playlist hozzáadás', chartKeys: ['yt_playlist_adds'] },
      { key: 'yt_premium_views', label: 'Premium nézések', chartKeys: ['yt_premium_views'] },
      { key: 'yt_likes_dislikes', label: 'Like-ok & dislike-ok', chartKeys: ['yt_likes_dislikes'] },
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

const PLATFORM_ORDER = ['TIKTOK_ORGANIC', 'TIKTOK_ADS', 'FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC', 'INSTAGRAM_PUBLIC', 'YOUTUBE'];
const DISABLED_PLATFORMS = new Set(['TIKTOK_ADS', 'INSTAGRAM_ORGANIC']);

// ============================================
// HELPER FUNCTIONS
// ============================================

// ... (omitted)

// ============================================
// PLATFORM SECTION COMPONENT
// ============================================

interface PlatformSectionProps {
  platformKey: string;
  config: PlatformMetricConfig;
  selectedKPIs: Set<string>;
  selectedDaily: Set<string>;
  selectedDist: Set<string>;
  onToggleKPI: (key: string) => void;
  onToggleDaily: (key: string) => void;
  onToggleDist: (key: string) => void;
  onSelectAllKPI: () => void;
  onClearKPI: () => void;
  onSelectAllDaily: () => void;
  onClearDaily: () => void;
  onSelectAllDist: () => void;
  onClearDist: () => void;
  onSelectAllPlatform: () => void;
  onClearPlatform: () => void;
  disabled?: boolean;
}

function PlatformSection({
  platformKey, config,
  selectedKPIs, selectedDaily, selectedDist,
  onToggleKPI, onToggleDaily, onToggleDist,
  onSelectAllKPI, onClearKPI,
  onSelectAllDaily, onClearDaily,
  onSelectAllDist, onClearDist,
  onSelectAllPlatform, onClearPlatform,
  disabled
}: PlatformSectionProps) {
  const [collapsed, setCollapsed] = useState(true);

  const totalSelected =
    config.kpis.filter(i => selectedKPIs.has(i.key)).length +
    config.daily.filter(i => selectedDaily.has(i.key)).length +
    config.distributions.filter(i => selectedDist.has(i.key)).length;

  const totalItems = config.kpis.length + config.daily.length + config.distributions.length;

  return (
    <div className={`bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl overflow-hidden transition-opacity ${disabled ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
      <button
        type="button"
        onClick={() => !disabled && setCollapsed(!collapsed)}
        disabled={disabled}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent-subtle)] transition-colors disabled:cursor-not-allowed"
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        }
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
        <PlatformIcon platform={config.platform} className="w-4 h-4" />
        <span className="font-bold text-sm text-[var(--text-primary)]">{config.label}</span>
        {disabled && <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] border border-[var(--border)] px-1.5 py-0.5 rounded">Hamarosan</span>}
        <span className="ml-auto flex items-center gap-2">
          {totalSelected > 0 && !disabled && (
            <>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                style={{ backgroundColor: config.color }}
              >
                {totalSelected}/{totalItems}
              </span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onClearPlatform(); }}
                className="text-xs w-5 h-5 rounded-full bg-[var(--error)] text-white flex items-center justify-center font-bold hover:brightness-110 transition-all cursor-pointer"
                title="Összes törlése"
              >
                ×
              </span>
            </>
          )}
        </span>
      </button>

      {!collapsed && !disabled && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onSelectAllPlatform(); }}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Összes kijelölése
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClearPlatform(); }}
              className="text-xs font-semibold text-[var(--error)] hover:underline"
            >
              Összes törlése
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MultiSelectDropdown
              label="KPI-ok"
              items={config.kpis}
              selected={selectedKPIs}
              onToggle={onToggleKPI}
              onSelectAll={onSelectAllKPI}
              onClear={onClearKPI}
              color={config.color}
            />
            <MultiSelectDropdown
              label="Napi diagramok"
              items={config.daily}
              selected={selectedDaily}
              onToggle={onToggleDaily}
              onSelectAll={onSelectAllDaily}
              onClear={onClearDaily}
              color={config.color}
            />
            <MultiSelectDropdown
              label="Megoszlások"
              items={config.distributions}
              selected={selectedDist}
              onToggle={onToggleDist}
              onSelectAll={onSelectAllDist}
              onClear={onClearDist}
              color={config.color}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ... existing code ...

{
  PLATFORM_ORDER.map(platKey => {
    const config = PLATFORM_METRICS[platKey];
    const sel = selections[platKey];
    if (!config || !sel) return null;
    return (
      <PlatformSection
        key={platKey}
        platformKey={platKey}
        config={config}
        selectedKPIs={sel.kpis}
        selectedDaily={sel.daily}
        selectedDist={sel.dist}
        onToggleKPI={(key) => toggleInSet(platKey, 'kpis', key)}
        onToggleDaily={(key) => toggleInSet(platKey, 'daily', key)}
        onToggleDist={(key) => toggleInSet(platKey, 'dist', key)}
        onSelectAllKPI={() => selectAllInCategory(platKey, 'kpis')}
        onClearKPI={() => clearCategory(platKey, 'kpis')}
        onSelectAllDaily={() => selectAllInCategory(platKey, 'daily')}
        onClearDaily={() => clearCategory(platKey, 'daily')}
        onSelectAllDist={() => selectAllInCategory(platKey, 'dist')}
        onClearDist={() => clearCategory(platKey, 'dist')}
        onSelectAllPlatform={() => selectAllPlatform(platKey)}
        onClearPlatform={() => clearPlatform(platKey)}
        disabled={DISABLED_PLATFORMS.has(platKey)}
      />
    );
  })
}

function toMonthStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthToStartDate(m: string): string {
  return `${m}-01`;
}

function monthToEndDate(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  const last = new Date(y, mo, 0);
  return last.toISOString().split('T')[0];
}

function formatMonthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  return `${y}. ${MONTHS[mo - 1]}`;
}

function getMonthOptions(count: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(toMonthStr(d));
  }
  return result;
}

type Preset = { label: string; months: number };
const PRESETS: Preset[] = [
  { label: 'Elmúlt hónap', months: 1 },
  { label: 'Elmúlt 3 hónap', months: 3 },
  { label: 'Elmúlt 6 hónap', months: 6 },
];

// ============================================
// KPI AGGREGATION (all companies mode)
// ============================================

interface AggregateKPIs {
  companyCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalVideos: number;
  totalFollowers: number;
  avgEngagementRate: number;
  likesPerVideo: number;
  interactionsPerVideo: number;
  viewsPerVideo: number;
  perCompany: {
    name: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    videos: number;
    engagementRate: number;
  }[];
}

function kpiNum(kpis: KPI[], key: string): number {
  const k = kpis.find(k => k.key === key);
  if (!k) return 0;
  if (typeof k.value === 'number') return k.value;
  const n = parseFloat(String(k.value).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function aggregateFromResponses(responses: { name: string; res: ChartsResponse }[]): AggregateKPIs {
  const perCompany: AggregateKPIs['perCompany'] = [];
  let totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0;
  let totalVideos = 0, totalFollowers = 0;

  for (const { name, res } of responses) {
    // Use extractKPIs — same logic as individual company chart view
    const tt = extractKPIs('TIKTOK_ORGANIC', res.charts);
    const fb = extractKPIs('FACEBOOK_ORGANIC', res.charts);
    const ig = extractKPIs('INSTAGRAM_ORGANIC', res.charts);
    const yt = extractKPIs('YOUTUBE', res.charts);

    const companyViews = kpiNum(tt, 'tt_profile_views') + kpiNum(fb, 'fb_reach') + kpiNum(ig, 'ig_reach_kpi') + kpiNum(yt, 'yt_views_kpi');
    const companyLikes = kpiNum(tt, 'tt_likes') + kpiNum(fb, 'fb_reactions') + kpiNum(ig, 'ig_likes') + kpiNum(yt, 'yt_likes_kpi');
    const companyComments = kpiNum(tt, 'tt_comments') + kpiNum(fb, 'fb_comments') + kpiNum(ig, 'ig_comments') + kpiNum(yt, 'yt_comments_kpi');
    const companyShares = kpiNum(tt, 'tt_shares') + kpiNum(fb, 'fb_shares') + kpiNum(ig, 'ig_shares') + kpiNum(yt, 'yt_shares_kpi');
    const companyVideos = kpiNum(tt, 'tt_videos') + kpiNum(fb, 'fb_posts') + kpiNum(ig, 'ig_media_count') + kpiNum(yt, 'yt_video_count');
    const companyFollowers = kpiNum(tt, 'tt_total_followers') + kpiNum(fb, 'fb_followers') + kpiNum(ig, 'ig_followers') + kpiNum(yt, 'yt_subs');

    const companyInteractions = companyLikes + companyComments + companyShares;
    const companyER = companyViews > 0 ? Math.min(companyInteractions / companyViews * 100, 100) : 0;

    totalViews += companyViews;
    totalLikes += companyLikes;
    totalComments += companyComments;
    totalShares += companyShares;
    totalVideos += companyVideos;
    totalFollowers += companyFollowers;

    perCompany.push({ name, views: companyViews, likes: companyLikes, comments: companyComments, shares: companyShares, videos: companyVideos, engagementRate: companyER });
  }

  const totalInteractions = totalLikes + totalComments + totalShares;
  const avgER = totalViews > 0 ? Math.min(totalInteractions / totalViews * 100, 100) : 0;
  return {
    companyCount: responses.length, totalViews, totalLikes, totalComments, totalShares,
    totalVideos, totalFollowers, avgEngagementRate: avgER,
    likesPerVideo: totalVideos > 0 ? totalLikes / totalVideos : 0,
    interactionsPerVideo: totalVideos > 0 ? totalInteractions / totalVideos : 0,
    viewsPerVideo: totalVideos > 0 ? totalViews / totalVideos : 0,
    perCompany,
  };
}

const KPI_CHART_KEYS = [
  'followers_growth', 'daily_likes', 'daily_comments', 'daily_shares', 'engagement_rate',
  'all_videos',
  'fb_page_reach', 'fb_engagement', 'fb_page_fans', 'fb_all_posts', 'fb_follows_trend', 'fb_video_views',
  'ig_reach', 'ig_engagement', 'ig_follower_growth', 'ig_all_media', 'ig_daily_followers', 'ig_save_rate', 'ig_story_overview', 'ig_profile_activity',
  'yt_views_trend', 'yt_daily_engagement', 'yt_subscribers_growth', 'yt_watch_time', 'yt_engagement_rate', 'yt_all_videos', 'yt_avg_view_pct', 'yt_playlist_adds',
  'igpub_engagement_overview', 'igpub_avg_engagement', 'igpub_all_media',
  'ttads_spend_trend', 'ttads_impressions_clicks', 'ttads_ctr_trend', 'ttads_cpc_cpm', 'ttads_conversions', 'ttads_cost_per_conversion',
  'tt_bio_link_clicks', 'tt_total_followers',
];

// ============================================
// MULTI-SELECT DROPDOWN COMPONENT
// ============================================

interface MultiSelectDropdownProps {
  label: string;
  items: MetricItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  color?: string;
}

function MultiSelectDropdown({ label, items, selected, onToggle, onSelectAll, onClear, color }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const selectedCount = items.filter(i => selected.has(i.key)).length;

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
      >
        <span className="truncate">{label}</span>
        <span className="flex items-center gap-1.5 shrink-0">
          {selectedCount > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
              style={{ backgroundColor: color || 'var(--accent)' }}
            >
              {selectedCount}/{items.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-raised)]">
            <button
              onClick={onSelectAll}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Mind kijelöl
            </button>
            <button
              onClick={onClear}
              className="text-xs font-semibold text-[var(--error)] hover:underline"
            >
              Törlés
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {items.map(item => {
              const isSelected = selected.has(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggle(item.key)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${isSelected
                    ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected
                    ? 'border-transparent text-white'
                    : 'border-[var(--border)]'
                    }`}
                    style={isSelected ? { backgroundColor: color || 'var(--accent)' } : undefined}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Styled month picker dropdown (matches dark theme)
function MonthPicker({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold flex items-center justify-between gap-2 hover:border-[var(--accent)] transition-colors cursor-pointer"
      >
        <span className="truncate">{formatMonthLabel(value)}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {options.map(m => {
            const selected = m === value;
            return (
              <button
                key={m}
                type="button"
                onClick={() => { onChange(m); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${selected
                  ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'
                  }`}
              >
                <span>{formatMonthLabel(m)}</span>
                {selected && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// PLATFORM SECTION COMPONENT
// ============================================

interface PlatformSectionProps {
  platformKey: string;
  config: PlatformMetricConfig;
  selectedKPIs: Set<string>;
  selectedDaily: Set<string>;
  selectedDist: Set<string>;
  onToggleKPI: (key: string) => void;
  onToggleDaily: (key: string) => void;
  onToggleDist: (key: string) => void;
  onSelectAllKPI: () => void;
  onClearKPI: () => void;
  onSelectAllDaily: () => void;
  onClearDaily: () => void;
  onSelectAllDist: () => void;
  onClearDist: () => void;
  onSelectAllPlatform: () => void;
  onClearPlatform: () => void;
}

function PlatformSection({
  platformKey, config,
  selectedKPIs, selectedDaily, selectedDist,
  onToggleKPI, onToggleDaily, onToggleDist,
  onSelectAllKPI, onClearKPI,
  onSelectAllDaily, onClearDaily,
  onSelectAllDist, onClearDist,
  onSelectAllPlatform, onClearPlatform,
}: PlatformSectionProps) {
  const [collapsed, setCollapsed] = useState(true);

  const totalSelected =
    config.kpis.filter(i => selectedKPIs.has(i.key)).length +
    config.daily.filter(i => selectedDaily.has(i.key)).length +
    config.distributions.filter(i => selectedDist.has(i.key)).length;

  const totalItems = config.kpis.length + config.daily.length + config.distributions.length;

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent-subtle)] transition-colors"
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        }
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
        <PlatformIcon platform={config.platform} className="w-4 h-4" />
        <span className="font-bold text-sm text-[var(--text-primary)]">{config.label}</span>
        <span className="ml-auto flex items-center gap-2">
          {totalSelected > 0 && (
            <>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                style={{ backgroundColor: config.color }}
              >
                {totalSelected}/{totalItems}
              </span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onClearPlatform(); }}
                className="text-xs w-5 h-5 rounded-full bg-[var(--error)] text-white flex items-center justify-center font-bold hover:brightness-110 transition-all cursor-pointer"
                title="Összes törlése"
              >
                ×
              </span>
            </>
          )}
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onSelectAllPlatform(); }}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Összes kijelölése
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClearPlatform(); }}
              className="text-xs font-semibold text-[var(--error)] hover:underline"
            >
              Összes törlése
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MultiSelectDropdown
              label="KPI-ok"
              items={config.kpis}
              selected={selectedKPIs}
              onToggle={onToggleKPI}
              onSelectAll={onSelectAllKPI}
              onClear={onClearKPI}
              color={config.color}
            />
            <MultiSelectDropdown
              label="Napi diagramok"
              items={config.daily}
              selected={selectedDaily}
              onToggle={onToggleDaily}
              onSelectAll={onSelectAllDaily}
              onClear={onClearDaily}
              color={config.color}
            />
            <MultiSelectDropdown
              label="Megoszlások"
              items={config.distributions}
              selected={selectedDist}
              onToggle={onToggleDist}
              onSelectAll={onSelectAllDist}
              onClear={onClearDist}
              color={config.color}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// AGGREGATE KPI DASHBOARD (all companies)
// ============================================

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString('hu-HU');
}

function AggregateKPIDashboard({ kpis }: { kpis: AggregateKPIs }) {
  return (
    <div className="mb-8 space-y-6">
      <h2 className="text-2xl font-bold border-l-4 border-[var(--accent)] pl-3">
        Összesített KPI-ok
        <span className="text-sm font-normal text-[var(--text-secondary)] ml-3">{kpis.companyCount} cég adatai alapján</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <AggKPICard icon={<Eye className="w-4 h-4" />} label="Összes megtekintés" value={formatNum(kpis.totalViews)} />
        <AggKPICard icon={<Heart className="w-4 h-4" />} label="Összes like" value={formatNum(kpis.totalLikes)} />
        <AggKPICard icon={<MessageCircle className="w-4 h-4" />} label="Összes komment" value={formatNum(kpis.totalComments)} />
        <AggKPICard icon={<Share2 className="w-4 h-4" />} label="Összes megosztás" value={formatNum(kpis.totalShares)} />
        <AggKPICard icon={<Video className="w-4 h-4" />} label="Összes videó/poszt" value={formatNum(kpis.totalVideos)} />
        <AggKPICard icon={<Users className="w-4 h-4" />} label="Összes követő" value={formatNum(kpis.totalFollowers)} />
        <AggKPICard icon={<TrendingUp className="w-4 h-4" />} label="Átlag ER%" value={kpis.avgEngagementRate.toFixed(2) + '%'} />
        <AggKPICard icon={<Heart className="w-4 h-4" />} label="Like / videó" value={formatNum(kpis.likesPerVideo)} />
        <AggKPICard icon={<BarChart3 className="w-4 h-4" />} label="Interakció / videó" value={formatNum(kpis.interactionsPerVideo)} />
        <AggKPICard icon={<Eye className="w-4 h-4" />} label="Megtekintés / videó" value={formatNum(kpis.viewsPerVideo)} />
      </div>
      {kpis.perCompany.length > 1 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="px-4 md:px-6 py-3 bg-[var(--surface-raised)] border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Cégenkénti bontás</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                  <th className="px-6 py-3">Cég</th>
                  <th className="px-4 py-3 text-right">Megtekintés</th>
                  <th className="px-4 py-3 text-right">Like</th>
                  <th className="px-4 py-3 text-right">Komment</th>
                  <th className="px-4 py-3 text-right">Megosztás</th>
                  <th className="px-4 py-3 text-right">Videó/poszt</th>
                  <th className="px-4 py-3 text-right">ER%</th>
                </tr>
              </thead>
              <tbody>
                {kpis.perCompany.sort((a, b) => b.views - a.views).map((c, i) => (
                  <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--accent-subtle)]">
                    <td className="px-6 py-3 font-semibold text-[var(--text-primary)]">{c.name}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.views)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.likes)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.comments)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.shares)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.videos)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={c.engagementRate > 0 ? 'text-emerald-500 font-bold' : 'text-[var(--text-secondary)]'}>
                        {c.engagementRate > 0 ? c.engagementRate.toFixed(2) + '%' : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AggKPICard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
      <div className="text-[var(--text-secondary)] mb-2">{icon}</div>
      <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{label}</div>
    </div>
  );
}

// ============================================
// RENDER CHART RESULT
// ============================================

function RenderChart({ chart }: { chart: ChartData }) {
  if (chart.error) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
        <h3 className="font-bold text-[var(--error)]">{chart.key}</h3>
        <p className="text-[var(--error)] text-sm opacity-80">{chart.error}</p>
      </div>
    );
  }
  if (chart.empty || !chart.data) {
    return (
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="font-bold text-[var(--text-secondary)]">{chart.title || chart.key}</h3>
        <p className="text-[var(--text-secondary)] text-sm opacity-60">Nincs adat</p>
      </div>
    );
  }
  if (chart.type === 'table') {
    return (
      <VideoTable
        chartVideos={chart.data.series?.[0]?.data as any || []}
        title={chart.title}
        color={chart.color}
      />
    );
  }
  return (
    <Chart
      type={chart.type as 'line' | 'bar'}
      labels={chart.data.labels || []}
      data={(chart.data.series?.[0]?.data || []) as number[]}
      label={chart.data.series?.[0]?.name || chart.title}
      color={chart.color}
      title={chart.title}
    />
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminChartsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [catalog, setCatalog] = useState<ChartDefinition[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');

  const now = new Date();
  const currentMonth = toMonthStr(now);
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endMonth, setEndMonth] = useState(currentMonth);

  // Per-platform selections: { platformKey: { kpis: Set, daily: Set, dist: Set } }
  const [selections, setSelections] = useState<Record<string, { kpis: Set<string>; daily: Set<string>; dist: Set<string> }>>({});

  const [results, setResults] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aggregate KPIs state (all companies mode)
  const [aggregateKPIs, setAggregateKPIs] = useState<AggregateKPIs | null>(null);
  const [aggregateProgress, setAggregateProgress] = useState({ done: 0, total: 0 });

  // Per-platform KPIs (single company)
  const [platformKPIs, setPlatformKPIs] = useState<Record<string, KPI[]>>({});
  const [multiMonthCount, setMultiMonthCount] = useState(0);

  const isAllCompanies = selectedCompany === ALL_COMPANIES_ID;
  const monthOptions = useMemo(() => getMonthOptions(24), []);

  // Calculate period months
  const periodMonths = useMemo(() => {
    const [sy, sm] = startMonth.split('-').map(Number);
    const [ey, em] = endMonth.split('-').map(Number);
    return (ey - sy) * 12 + (em - sm) + 1;
  }, [startMonth, endMonth]);
  const isMultiMonth = periodMonths > 1;

  // Initialize selections with all items selected
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [companiesData, catalogData] = await Promise.all([
        getCompanies(),
        getChartCatalog()
      ]);
      setCompanies(companiesData);
      setCatalog(catalogData.charts);
      if (companiesData.length > 0) setSelectedCompany(companiesData[0].id);

      // Initialize all platform selections with everything selected
      const initial: Record<string, { kpis: Set<string>; daily: Set<string>; dist: Set<string> }> = {};
      for (const [platKey, config] of Object.entries(PLATFORM_METRICS)) {
        initial[platKey] = {
          kpis: new Set(config.kpis.map(i => i.key)),
          daily: new Set(config.daily.map(i => i.key)),
          dist: new Set(config.distributions.map(i => i.key)),
        };
      }
      setSelections(initial);
    } catch {
      setError('Nem sikerült betölteni az adatokat');
    }
  }

  function applyPreset(months: number) {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);
    setStartMonth(toMonthStr(start));
    setEndMonth(toMonthStr(end));
  }

  const activePreset = useMemo(() => {
    for (const p of PRESETS) {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - p.months + 1, 1);
      if (toMonthStr(start) === startMonth && toMonthStr(end) === endMonth) return p.months;
    }
    return null;
  }, [startMonth, endMonth]);

  const startDate = monthToStartDate(startMonth);
  const endDate = monthToEndDate(endMonth);

  // Collect all needed chart keys from selections
  const allSelectedChartKeys = useMemo(() => {
    const keys = new Set<string>();
    const catalogKeys = new Set(catalog.map(c => c.key));
    for (const [platKey, sel] of Object.entries(selections)) {
      const config = PLATFORM_METRICS[platKey];
      if (!config) continue;
      // KPI chart keys
      for (const kpi of config.kpis) {
        if (sel.kpis.has(kpi.key)) {
          kpi.chartKeys.forEach(k => { if (catalogKeys.size === 0 || catalogKeys.has(k)) keys.add(k); });
        }
      }
      // Daily chart keys
      for (const daily of config.daily) {
        if (sel.daily.has(daily.key)) {
          daily.chartKeys.forEach(k => { if (catalogKeys.size === 0 || catalogKeys.has(k)) keys.add(k); });
        }
      }
      // Distribution chart keys
      for (const dist of config.distributions) {
        if (sel.dist.has(dist.key)) {
          dist.chartKeys.forEach(k => { if (catalogKeys.size === 0 || catalogKeys.has(k)) keys.add(k); });
        }
      }
    }
    return keys;
  }, [selections, catalog]);

  const totalSelectedCount = useMemo(() => {
    let count = 0;
    for (const sel of Object.values(selections)) {
      count += sel.kpis.size + sel.daily.size + sel.dist.size;
    }
    return count;
  }, [selections]);

  // Selection helpers
  function toggleInSet(platformKey: string, category: 'kpis' | 'daily' | 'dist', key: string) {
    setSelections(prev => {
      const platSel = prev[platformKey];
      if (!platSel) return prev;
      const newSet = new Set(platSel[category]);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return { ...prev, [platformKey]: { ...platSel, [category]: newSet } };
    });
  }

  function selectAllInCategory(platformKey: string, category: 'kpis' | 'daily' | 'dist') {
    const config = PLATFORM_METRICS[platformKey];
    if (!config) return;
    const items = category === 'kpis' ? config.kpis : category === 'daily' ? config.daily : config.distributions;
    setSelections(prev => {
      const platSel = prev[platformKey];
      if (!platSel) return prev;
      return { ...prev, [platformKey]: { ...platSel, [category]: new Set(items.map(i => i.key)) } };
    });
  }

  function clearCategory(platformKey: string, category: 'kpis' | 'daily' | 'dist') {
    setSelections(prev => {
      const platSel = prev[platformKey];
      if (!platSel) return prev;
      return { ...prev, [platformKey]: { ...platSel, [category]: new Set<string>() } };
    });
  }

  function selectAllPlatform(platformKey: string) {
    const config = PLATFORM_METRICS[platformKey];
    if (!config) return;
    setSelections(prev => ({
      ...prev,
      [platformKey]: {
        kpis: new Set(config.kpis.map(i => i.key)),
        daily: new Set(config.daily.map(i => i.key)),
        dist: new Set(config.distributions.map(i => i.key)),
      },
    }));
  }

  function clearPlatform(platformKey: string) {
    setSelections(prev => ({
      ...prev,
      [platformKey]: {
        kpis: new Set<string>(),
        daily: new Set<string>(),
        dist: new Set<string>(),
      },
    }));
  }

  async function handleGenerate() {
    if (allSelectedChartKeys.size === 0) {
      setError('Válassz legalább egy elemet!');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setAggregateKPIs(null);
    setPlatformKPIs({});
    setMultiMonthCount(0);

    try {
      const chartKeysArray = [...allSelectedChartKeys];

      if (isAllCompanies) {
        // Aggregate mode
        setAggregateProgress({ done: 0, total: companies.length });
        const allKeys = [...new Set([...KPI_CHART_KEYS, ...chartKeysArray])];
        const chartRequests = allKeys.map(key => ({ key }));
        const companyResponses: { name: string; res: ChartsResponse }[] = [];
        const BATCH_SIZE = 3;
        for (let i = 0; i < companies.length; i += BATCH_SIZE) {
          const batch = companies.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(c => generateCharts({ accountId: c.id, startDate, endDate, charts: chartRequests }))
          );
          for (let j = 0; j < batch.length; j++) {
            const result = batchResults[j];
            if (result.status === 'fulfilled') {
              companyResponses.push({ name: batch[j].name, res: result.value });
            }
          }
          setAggregateProgress({ done: Math.min(i + BATCH_SIZE, companies.length), total: companies.length });
        }
        const kpis = aggregateFromResponses(companyResponses);
        setAggregateKPIs(kpis);
        const selectedSet = allSelectedChartKeys;
        const mergedCharts: ChartData[] = [];
        for (const { res } of companyResponses) {
          for (const chart of res.charts) {
            if (selectedSet.has(chart.key) && !chart.empty && !chart.error) {
              mergedCharts.push(chart);
            }
          }
        }
        setResults(mergedCharts);
      } else if (isMultiMonth) {
        // Multi-month single company
        const monthRanges = generateMonthRanges(endMonth, periodMonths);
        const chartRequests = chartKeysArray.map(key => ({ key }));
        const platformMonthKPIs: Record<string, KPI[][]> = {};
        let lastMonthCharts: ChartData[] = [];
        let successCount = 0;

        for (const range of monthRanges) {
          try {
            const response = await generateCharts({
              accountId: selectedCompany,
              startDate: range.startDate,
              endDate: range.endDate,
              charts: chartRequests,
            });
            // Extract KPIs per platform
            for (const platKey of PLATFORM_ORDER) {
              const sel = selections[platKey];
              if (!sel || sel.kpis.size === 0) continue;
              const platCharts = response.charts.filter(c => {
                const def = catalog.find(d => d.key === c.key);
                return def?.platform === platKey;
              });
              if (platCharts.length > 0) {
                const monthKpis = extractKPIs(platKey, platCharts);
                if (monthKpis.length > 0) {
                  if (!platformMonthKPIs[platKey]) platformMonthKPIs[platKey] = [];
                  platformMonthKPIs[platKey].push(monthKpis);
                }
              }
            }
            lastMonthCharts = response.charts;
            successCount++;
          } catch {
            // Skip failed months
          }
        }

        if (successCount === 0) {
          setError('Nem sikerült adatot lekérni a megadott időszakra');
        } else {
          const aggregated: Record<string, KPI[]> = {};
          for (const [plat, monthKpis] of Object.entries(platformMonthKPIs)) {
            const allAgg = aggregateMonthlyKPIs(monthKpis);
            // Filter to only selected KPIs
            const sel = selections[plat];
            aggregated[plat] = sel ? allAgg.filter(k => sel.kpis.has(k.key)) : allAgg;
          }
          setPlatformKPIs(aggregated);
          setMultiMonthCount(successCount);
          setResults(lastMonthCharts);
        }
      } else {
        // Single company, single month
        const response = await generateCharts({
          accountId: selectedCompany,
          startDate,
          endDate,
          charts: chartKeysArray.map(key => ({ key }))
        });
        setResults(response.charts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  // Per-platform KPIs for single company, single month
  const singleMonthPlatformKPIs = useMemo(() => {
    if (isAllCompanies || isMultiMonth || results.length === 0) return {};
    const kpiMap: Record<string, KPI[]> = {};
    for (const platKey of PLATFORM_ORDER) {
      const sel = selections[platKey];
      if (!sel || sel.kpis.size === 0) continue;
      const platCharts = results.filter(c => {
        const def = catalog.find(d => d.key === c.key);
        return def?.platform === platKey;
      });
      if (platCharts.length > 0) {
        const allKpis = extractKPIs(platKey, platCharts);
        // Filter to only show KPIs selected by user
        const filtered = allKpis
          .filter(k => sel.kpis.has(k.key))
          .filter(k => {
            const v = k.value;
            if (typeof v === 'number') return v !== 0;
            if (typeof v === 'string') return v !== '0' && v !== '0.00%' && v !== '0.0' && v !== '0%';
            return true;
          });
        if (filtered.length > 0) {
          kpiMap[platKey] = filtered;
        }
      }
    }
    return kpiMap;
  }, [results, catalog, selections, isAllCompanies, isMultiMonth]);

  // Group results by platform for rendering
  const resultsByPlatform = useMemo(() => {
    // If multi-month selected, hide all charts except KPIs
    if (isMultiMonth) return {};
    const grouped: Record<string, { daily: ChartData[]; distributions: ChartData[] }> = {};
    for (const platKey of PLATFORM_ORDER) {
      const sel = selections[platKey];
      if (!sel) continue;
      const config = PLATFORM_METRICS[platKey];
      if (!config) continue;

      const selectedDailyKeys = new Set(config.daily.filter(i => sel.daily.has(i.key)).flatMap(i => i.chartKeys));
      const selectedDistKeys = new Set(config.distributions.filter(i => sel.dist.has(i.key)).flatMap(i => i.chartKeys));

      const daily: ChartData[] = [];
      const distributions: ChartData[] = [];

      for (const chart of results) {
        if (chart.empty || chart.error) continue;
        const def = catalog.find(d => d.key === chart.key);
        if (def?.platform !== platKey) continue;

        if (selectedDailyKeys.has(chart.key)) daily.push(chart);
        else if (selectedDistKeys.has(chart.key)) distributions.push(chart);
      }

      if (daily.length > 0 || distributions.length > 0) {
        grouped[platKey] = { daily, distributions };
      }
    }
    return grouped;
  }, [results, catalog, selections]);

  const selectClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors appearance-none cursor-pointer";

  return (
    <WindsorKeyGuard>
      <div className="p-4 md:p-8">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Összesített riport</h1>
          <p className="text-[var(--text-secondary)] mt-1">Multi-platform chart generálás platformonkénti beállításokkal</p>
        </header>

        {/* Controls */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-6 mb-6 md:mb-8 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-end mb-5">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Cég</label>
              <CompanyPicker
                companies={companies}
                value={selectedCompany}
                onChange={setSelectedCompany}
                showAll
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Időszak</label>
              <div className="flex items-center gap-2">
                <MonthPicker options={monthOptions} value={startMonth} onChange={setStartMonth} />
                <span className="text-[var(--text-secondary)] font-bold px-1">&mdash;</span>
                <MonthPicker options={monthOptions.filter(m => m >= startMonth)} value={endMonth} onChange={setEndMonth} />
              </div>
            </div>

            <div>
              <button
                onClick={handleGenerate}
                disabled={loading || allSelectedChartKeys.size === 0}
                className="w-full bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                {loading
                  ? isAllCompanies
                    ? `Betöltés... (${aggregateProgress.done}/${aggregateProgress.total})`
                    : 'Generálás...'
                  : `Generálás (${totalSelectedCount})`
                }
              </button>
            </div>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase mr-1">Gyors:</span>
            {PRESETS.map(p => (
              <button
                key={p.months}
                onClick={() => applyPreset(p.months)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activePreset === p.months
                  ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                  : 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Platform Sections */}
          <div className="border-t border-[var(--border)] pt-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase">Platform beállítások</h3>
            </div>
            {PLATFORM_ORDER.map(platKey => {
              const config = PLATFORM_METRICS[platKey];
              const sel = selections[platKey];
              if (!config || !sel) return null;
              return (
                <PlatformSection
                  key={platKey}
                  platformKey={platKey}
                  config={config}
                  selectedKPIs={sel.kpis}
                  selectedDaily={sel.daily}
                  selectedDist={sel.dist}
                  onToggleKPI={(key) => toggleInSet(platKey, 'kpis', key)}
                  onToggleDaily={(key) => toggleInSet(platKey, 'daily', key)}
                  onToggleDist={(key) => toggleInSet(platKey, 'dist', key)}
                  onSelectAllKPI={() => selectAllInCategory(platKey, 'kpis')}
                  onClearKPI={() => clearCategory(platKey, 'kpis')}
                  onSelectAllDaily={() => selectAllInCategory(platKey, 'daily')}
                  onClearDaily={() => clearCategory(platKey, 'daily')}
                  onSelectAllDist={() => selectAllInCategory(platKey, 'dist')}
                  onClearDist={() => clearCategory(platKey, 'dist')}
                  onSelectAllPlatform={() => selectAllPlatform(platKey)}
                  onClearPlatform={() => clearPlatform(platKey)}
                />
              );
            })}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Aggregate KPI Dashboard (all companies mode) */}
        {aggregateKPIs && <AggregateKPIDashboard kpis={aggregateKPIs} />}

        {/* Multi-month per-platform KPIs */}
        {Object.keys(platformKPIs).length > 0 && (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold border-l-4 border-[var(--accent)] pl-3">
              Összesített KPI-ok
              <span className="text-sm font-normal text-[var(--text-secondary)] ml-3">{multiMonthCount} hónap</span>
            </h2>
            {PLATFORM_ORDER.map(platKey => {
              const kpiList = platformKPIs[platKey];
              if (!kpiList || kpiList.length === 0) return null;
              const config = PLATFORM_METRICS[platKey];
              return (
                <div key={platKey} className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <PlatformIcon platform={config.platform} className="w-4 h-4" />
                    {config.label}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {kpiList.map((kpi) => (
                      <PlatformKPICard key={kpi.label} label={kpi.label} value={kpi.value} description={kpi.description} />
                    ))}
                  </div>
                </div>
              );
            })}
            {results.length > 0 && (
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Az utolsó hónap chartjai</p>
            )}
          </div>
        )}

        {/* Single-month per-platform KPIs */}
        {Object.keys(singleMonthPlatformKPIs).length > 0 && (
          <div className="mb-8 space-y-4">
            {PLATFORM_ORDER.map(platKey => {
              const kpiList = singleMonthPlatformKPIs[platKey];
              if (!kpiList || kpiList.length === 0) return null;
              const config = PLATFORM_METRICS[platKey];
              return (
                <div key={platKey} className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <PlatformIcon platform={config.platform} className="w-4 h-4" />
                    {config.label}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {kpiList.map((kpi) => (
                      <PlatformKPICard key={kpi.label} label={kpi.label} value={kpi.value} description={kpi.description} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Per-platform chart results */}
        {Object.keys(resultsByPlatform).length > 0 ? (
          <div className="space-y-8">
            {PLATFORM_ORDER.map(platKey => {
              const group = resultsByPlatform[platKey];
              if (!group) return null;
              const config = PLATFORM_METRICS[platKey];
              return (
                <div key={platKey}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                    <PlatformIcon platform={config.platform} className="w-5 h-5" />
                    {config.label}
                  </h2>

                  {/* Daily charts - 2 col grid */}
                  {group.daily.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase mb-3">Napi diagramok</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {group.daily.map((chart, i) => (
                          <div key={`${chart.key}-${i}`}>
                            <RenderChart chart={chart} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Distribution charts */}
                  {group.distributions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase mb-3">Megoszlások</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {group.distributions.map((chart, i) => (
                          <div key={`${chart.key}-${i}`} className={chart.type === 'table' ? 'lg:col-span-2' : ''}>
                            <RenderChart chart={chart} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : !loading && results.length === 0 && !aggregateKPIs && Object.keys(platformKPIs).length === 0 ? (
          <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Válaszd ki a chartokat</h2>
            <p className="text-[var(--text-secondary)]">Állítsd be a platformonkénti beállításokat és kattints a Generálás gombra</p>
          </div>
        ) : null}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        )}
      </div>
    </WindsorKeyGuard>
  );
}
