'use client';

import { type IntegrationConnection, getProviderMeta } from '@/types/integration';
import { deleteConnection, testConnection } from '../actions';
import { useState } from 'react';

interface Props {
  connection: IntegrationConnection;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  CONNECTED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Kapcsolódva' },
  DISCONNECTED: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Leválasztva' },
  ERROR: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Hiba' },
  PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Függőben' },
};

export function ConnectionCard({ connection }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; windsorOnboardUrl?: string; needsWindsorSetup?: boolean } | null>(null);

  const provider = getProviderMeta(connection.provider);
  const status = STATUS_STYLES[connection.status] || STATUS_STYLES.PENDING;

  const handleDelete = async () => {
    if (!confirm(`Biztosan törlöd a(z) ${provider.label} integrációt?`)) return;
    await deleteConnection(connection.id, connection.companyId);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(connection.id);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Teszt sikertelen' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center text-lg`}>
            {provider.icon}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{provider.label}</div>
            {connection.externalAccountName && (
              <div className="text-xs text-slate-400">{connection.externalAccountName}</div>
            )}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {connection.lastSyncAt && (
          <div className="text-xs text-slate-500">
            Utolsó szinkronizáció: {new Date(connection.lastSyncAt).toLocaleString('hu-HU')}
          </div>
        )}
        {connection.errorMessage && (
          <div className="text-xs text-red-400 mt-1">{connection.errorMessage}</div>
        )}
      </div>

      {testResult && testResult.message !== connection.errorMessage && (
        <div className={`text-xs p-2 rounded-lg mb-3 ${testResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          <div>{testResult.message}</div>
          {testResult.windsorOnboardUrl && testResult.needsWindsorSetup && (
            <a
              href={testResult.windsorOnboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg font-semibold transition-colors"
            >
              Windsor beállítás &rarr;
            </a>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
        >
          {testing ? 'Tesztelés...' : 'Kapcsolat tesztelése'}
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={handleDelete}
          className="text-xs font-semibold text-red-400 hover:text-red-300"
        >
          Törlés
        </button>
      </div>
    </div>
  );
}
