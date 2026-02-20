import type { PlatformConfig } from '@/app/admin/reports/PlatformChartsPage';

export interface AdminPlatformConfig extends PlatformConfig {}

export interface ClientPlatformConfig {
  platformKey: string;
  label: string;
  platformIcon: string;
  gradient: string;
  headerGradient: string;
  borderColor: string;
}

export const ADMIN_PLATFORM_CONFIGS: Record<string, AdminPlatformConfig> = {
  tiktok: {
    platformKey: 'TIKTOK_ORGANIC',
    label: 'TikTok',
    gradient: 'from-cyan-400 to-emerald-400',
    headerGradient: 'from-cyan-400/20 to-emerald-400/15',
    borderColor: 'var(--platform-tiktok)',
    description: 'TikTok organikus havi riport generálása',
  },
  facebook: {
    platformKey: 'FACEBOOK_ORGANIC',
    label: 'Facebook',
    gradient: 'from-blue-600 to-blue-400',
    headerGradient: 'from-blue-600/20 to-blue-400/15',
    borderColor: '#3b82f6',
    description: 'Facebook oldal havi riport generálása',
  },
  instagram: {
    platformKey: 'INSTAGRAM_ORGANIC',
    label: 'Instagram',
    gradient: 'from-purple-500 to-pink-500',
    headerGradient: 'from-purple-500/20 to-pink-500/15',
    borderColor: '#a855f7',
    description: 'Instagram havi riport generálása',
  },
  'instagram-public': {
    platformKey: 'INSTAGRAM_PUBLIC',
    label: 'Instagram Public',
    gradient: 'from-purple-500 to-pink-500',
    headerGradient: 'from-purple-500/20 to-pink-500/15',
    borderColor: 'var(--platform-instagram)',
    description: 'Instagram publikus profil elemzés (versenytárs)',
  },
  youtube: {
    platformKey: 'YOUTUBE',
    label: 'YouTube',
    gradient: 'from-red-600 to-red-400',
    headerGradient: 'from-red-600/20 to-red-400/15',
    borderColor: '#ef4444',
    description: 'YouTube csatorna havi riport generálása',
  },
  'tiktok-ads': {
    platformKey: 'TIKTOK_ADS',
    label: 'TikTok Ads',
    gradient: 'from-pink-500 to-red-500',
    headerGradient: 'from-pink-500/20 to-red-500/15',
    borderColor: 'var(--platform-tiktok)',
    description: 'TikTok fizetett hirdetési riport',
  },
};

export const CLIENT_PLATFORM_CONFIGS: Record<string, ClientPlatformConfig> = {
  tiktok: {
    platformKey: 'TIKTOK_ORGANIC',
    label: 'TikTok',
    platformIcon: 'tiktok',
    gradient: 'from-cyan-400 to-emerald-400',
    headerGradient: 'from-cyan-400/20 to-emerald-400/15',
    borderColor: 'var(--platform-tiktok)',
  },
  facebook: {
    platformKey: 'FACEBOOK_ORGANIC',
    label: 'Facebook',
    platformIcon: 'facebook',
    gradient: 'from-blue-600 to-blue-400',
    headerGradient: 'from-blue-600/20 to-blue-400/15',
    borderColor: '#3b82f6',
  },
  instagram: {
    platformKey: 'INSTAGRAM_ORGANIC',
    label: 'Instagram',
    platformIcon: 'instagram',
    gradient: 'from-purple-500 to-pink-500',
    headerGradient: 'from-purple-500/20 to-pink-500/15',
    borderColor: '#a855f7',
  },
  'instagram-public': {
    platformKey: 'INSTAGRAM_PUBLIC',
    label: 'Instagram Public',
    platformIcon: 'instagram',
    gradient: 'from-purple-500 to-pink-500',
    headerGradient: 'from-purple-500/20 to-pink-500/15',
    borderColor: '#e040fb',
  },
  youtube: {
    platformKey: 'YOUTUBE',
    label: 'YouTube',
    platformIcon: 'youtube',
    gradient: 'from-red-600 to-red-400',
    headerGradient: 'from-red-600/20 to-red-400/15',
    borderColor: '#ef4444',
  },
  'tiktok-ads': {
    platformKey: 'TIKTOK_ADS',
    label: 'TikTok Ads',
    platformIcon: 'tiktok',
    gradient: 'from-pink-500 to-red-500',
    headerGradient: 'from-pink-500/20 to-red-500/15',
    borderColor: '#ff2d55',
  },
};
