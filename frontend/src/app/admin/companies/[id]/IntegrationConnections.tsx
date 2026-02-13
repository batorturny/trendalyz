'use client';

import { type IntegrationConnection } from '@/types/integration';
import { ConnectionCard } from './ConnectionCard';
import { AddConnectionWizard } from './AddConnectionWizard';

interface Props {
  companyId: string;
  connections: IntegrationConnection[];
}

export function IntegrationConnections({ companyId, connections }: Props) {
  const existingProviders = connections.map(c => c.provider);
  const existingAccountIds = connections.map(c => c.externalAccountId);

  return (
    <div className="bg-white/5 border border-white/15 rounded-2xl p-6">
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
          <div className="text-4xl mb-2">🔌</div>
          <p className="text-sm text-slate-400">Nincs konfigurált integráció</p>
          <p className="text-xs text-slate-500 mt-1">Adj hozzá egy platformot a fenti gombbal</p>
        </div>
      )}
    </div>
  );
}
