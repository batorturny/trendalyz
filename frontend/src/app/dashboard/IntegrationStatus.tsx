'use client';

import { type IntegrationConnection, PROVIDERS } from '@/types/integration';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';

interface Props {
  connections: IntegrationConnection[];
}

export function IntegrationStatus({ connections }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
      {PROVIDERS.map((provider) => {
        const conn = connections.find(c => c.provider === provider.key);

        return (
          <div
            key={provider.key}
            className={`bg-[var(--surface)] border rounded-xl p-4 shadow-[var(--shadow-card)] ${
              conn ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: provider.key.includes('TIKTOK') ? 'var(--platform-tiktok)' : provider.key.includes('FACEBOOK') ? 'var(--platform-facebook)' : provider.key.includes('INSTAGRAM') ? 'var(--platform-instagram)' : 'var(--platform-youtube)' }}
              >
                <PlatformIcon platform={getPlatformFromProvider(provider.key)} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--text-primary)] text-sm">{provider.label}</div>
                {conn ? (
                  <>
                    <div className="text-xs text-[var(--success)]">Kapcsolódva</div>
                    {conn.externalAccountName && (
                      <div className="text-xs text-[var(--text-secondary)] truncate">{conn.externalAccountName}</div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-[var(--text-secondary)]">Nem konfigurált</div>
                )}
              </div>
              {conn && (
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--success)' }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
