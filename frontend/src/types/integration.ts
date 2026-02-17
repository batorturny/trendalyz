export type ConnectionProvider = 'TIKTOK_ORGANIC' | 'TIKTOK_ADS' | 'FACEBOOK_ORGANIC' | 'INSTAGRAM_ORGANIC' | 'INSTAGRAM' | 'INSTAGRAM_PUBLIC' | 'YOUTUBE' | 'FACEBOOK';
export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING';

export interface IntegrationConnection {
  id: string;
  companyId: string;
  provider: ConnectionProvider;
  status: ConnectionStatus;
  externalAccountId: string;
  externalAccountName: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PROVIDERS = [
  {
    key: 'TIKTOK_ORGANIC' as const,
    label: 'TikTok',
    color: 'from-pink-500 to-red-500',
    windsorEndpoint: 'tiktok_organic',
    description: 'TikTok organikus tartalom és követők',
    supportsOAuth: true,
  },
  {
    key: 'TIKTOK_ADS' as const,
    label: 'TikTok Ads',
    color: 'from-pink-500 to-red-500',
    windsorEndpoint: 'tiktok',
    description: 'TikTok fizetett hirdetések',
    supportsOAuth: true,
    isDev: true,
  },
  {
    key: 'INSTAGRAM_ORGANIC' as const,
    label: 'Instagram',
    color: 'from-purple-500 to-pink-500',
    windsorEndpoint: 'instagram',
    description: 'Instagram üzleti fiók és tartalom',
    supportsOAuth: true,
  },
  {
    key: 'FACEBOOK_ORGANIC' as const,
    label: 'Facebook Pages',
    color: 'from-blue-600 to-blue-400',
    windsorEndpoint: 'facebook_organic',
    description: 'Facebook oldal organikus tartalom',
    supportsOAuth: true,
  },
  {
    key: 'INSTAGRAM_PUBLIC' as const,
    label: 'Instagram Public',
    color: 'from-purple-500 to-pink-500',
    windsorEndpoint: 'instagram_public',
    description: 'Instagram publikus profil elemzés (versenytárs)',
    supportsOAuth: false, // Windsor doesn't support OAuth for this yet?
    isDev: true,
  },
  {
    key: 'YOUTUBE' as const,
    label: 'YouTube',
    color: 'from-red-600 to-red-400',
    windsorEndpoint: 'youtube',
    description: 'YouTube csatorna és videók',
    supportsOAuth: true,
  },
] as const;

export interface WindsorDiscoveredAccount {
  accountId: string;
  accountName: string;
  provider: ConnectionProvider;
  hasData: boolean;
}

export function getProviderMeta(provider: ConnectionProvider) {
  return PROVIDERS.find(p => p.key === provider) || PROVIDERS[0];
}
