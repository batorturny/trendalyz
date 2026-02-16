'use client';

import { type IntegrationConnection, getProviderMeta } from '@/types/integration';
import { deleteConnection, testConnection } from '../actions';
import { useState } from 'react';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Props {
  connection: IntegrationConnection;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  CONNECTED: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'Kapcsolódva' },
  DISCONNECTED: { bg: 'bg-gray-100 dark:bg-slate-500/20', text: 'text-gray-600 dark:text-slate-400', label: 'Leválasztva' },
  ERROR: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', label: 'Hiba' },
  PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Függőben' },
};

export function ConnectionCard({ connection }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; windsorOnboardUrl?: string; needsWindsorSetup?: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const provider = getProviderMeta(connection.provider);
  const status = STATUS_STYLES[connection.status] || STATUS_STYLES.PENDING;

  const handleDelete = async () => {
    setConfirmDelete(false);
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

  const providerColor = connection.provider.includes('TIKTOK') ? 'var(--platform-tiktok)' : connection.provider.includes('FACEBOOK') ? 'var(--platform-facebook)' : connection.provider.includes('INSTAGRAM') ? 'var(--platform-instagram)' : 'var(--platform-youtube)';

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg text-white"
            style={{ backgroundColor: providerColor }}
          >
            <PlatformIcon platform={getPlatformFromProvider(connection.provider)} className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-[var(--text-primary)] text-sm">{provider.label}</div>
            {connection.externalAccountName && (
              <div className="text-xs text-[var(--text-secondary)]">{connection.externalAccountName}</div>
            )}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {connection.lastSyncAt && (
          <div className="text-xs text-[var(--text-secondary)]">
            Utolsó szinkronizáció: {new Date(connection.lastSyncAt).toLocaleString('hu-HU')}
          </div>
        )}
        {connection.errorMessage && (
          <div className="text-xs text-[var(--error)] mt-1">{connection.errorMessage}</div>
        )}
      </div>

      {testResult && testResult.message !== connection.errorMessage && (
        <div className={`text-xs p-2 rounded-lg mb-3 ${testResult.success ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
          <div>{testResult.message}</div>
          {testResult.windsorOnboardUrl && testResult.needsWindsorSetup && (
            <a
              href={testResult.windsorOnboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1.5 px-3 py-1 bg-[var(--accent-subtle)] text-[var(--accent)] hover:opacity-80 rounded-lg font-semibold transition-colors"
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
          className="text-xs font-semibold text-[var(--accent)] hover:opacity-70 disabled:opacity-50"
        >
          {testing ? 'Tesztelés...' : 'Kapcsolat tesztelése'}
        </button>
        <span className="text-[var(--border)]">|</span>
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-xs font-semibold text-[var(--error)] hover:opacity-70"
        >
          Törlés
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Integráció törlése"
        message={`Biztosan törlöd a(z) ${provider.label} integrációt?`}
        confirmLabel="Törlés"
        cancelLabel="Mégse"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
