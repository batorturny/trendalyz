export type ConnectionProvider = 'TIKTOK_ORGANIC' | 'FACEBOOK_ORGANIC' | 'INSTAGRAM_ORGANIC';
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
    icon: '🎵',
    color: 'from-pink-500 to-red-500',
    windsorEndpoint: 'tiktok_organic',
    description: 'TikTok organikus tartalom és követők',
  },
  {
    key: 'FACEBOOK_ORGANIC' as const,
    label: 'Facebook',
    icon: '📘',
    color: 'from-blue-600 to-blue-400',
    windsorEndpoint: 'facebook_organic',
    description: 'Facebook oldal és posztok',
  },
  {
    key: 'INSTAGRAM_ORGANIC' as const,
    label: 'Instagram',
    icon: '📸',
    color: 'from-purple-500 to-pink-500',
    windsorEndpoint: 'instagram_organic',
    description: 'Instagram üzleti fiók és tartalom',
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
