'use client';

import { type IntegrationConnection } from '@/types/integration';
import { ConnectionCard } from './ConnectionCard';
import { AddConnectionWizard } from './AddConnectionWizard';
import { Plug } from 'lucide-react';

interface Props {
  companyId: string;
  connections: IntegrationConnection[];
}

export function IntegrationConnections({ companyId, connections }: Props) {
  const existingProviders = connections.map(c => c.provider);
  const existingAccountIds = connections.map(c => c.externalAccountId);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Integrációk</h2>
        <AddConnectionWizard companyId={companyId} existingProviders={existingProviders} existingAccountIds={existingAccountIds} />
      </div>

      {connections.length > 0 ? (
        <div className="space-y-3">
          {connections.map((conn) => (
            <ConnectionCard key={conn.id} connection={conn} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Plug className="w-10 h-10 mx-auto mb-2 text-[var(--text-secondary)]" strokeWidth={1.5} />
          <p className="text-sm text-[var(--text-secondary)]">Nincs konfigurált integráció</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-70">Adj hozzá egy platformot a fenti gombbal</p>
        </div>
      )}
    </div>
  );
}
