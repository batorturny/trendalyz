'use client';

import { type IntegrationConnection, getProviderMeta } from '@/types/integration';
import { deleteConnection, renameConnection, testConnection } from '../actions';
import { useState } from 'react';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { VideoVisibilityDialog } from './VideoVisibilityDialog';
import { useT } from '@/lib/i18n';

const VIDEO_VISIBILITY_PROVIDERS = new Set(['TIKTOK_ORGANIC', 'INSTAGRAM_ORGANIC', 'FACEBOOK_ORGANIC', 'YOUTUBE']);

interface Props {
  connection: IntegrationConnection;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  CONNECTED: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'Kapcsolódva' },
  DISCONNECTED: { bg: 'bg-gray-100 dark:bg-slate-500/20', text: 'text-gray-600 dark:text-slate-400', label: 'Leválasztva' },
  ERROR: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', label: 'Hiba' },
  PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Függőben' },
};

// Status labels are translated at render time via t() in the component

export function ConnectionCard({ connection }: Props) {
  const t = useT();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; windsorOnboardUrl?: string; needsWindsorSetup?: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(connection.externalAccountName ?? '');
  const [saving, setSaving] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [videosOpen, setVideosOpen] = useState(false);

  const provider = getProviderMeta(connection.provider);
  const status = STATUS_STYLES[connection.status] || STATUS_STYLES.PENDING;

  const handleDelete = async () => {
    setConfirmDelete(false);
    await deleteConnection(connection.id, connection.companyId);
  };

  const startEdit = () => {
    setName(connection.externalAccountName ?? '');
    setRenameError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setRenameError(null);
    setName(connection.externalAccountName ?? '');
  };

  const handleRename = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setRenameError(t('A név nem lehet üres'));
      return;
    }
    if (trimmed === (connection.externalAccountName ?? '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setRenameError(null);
    try {
      await renameConnection(connection.id, connection.companyId, trimmed);
      setEditing(false);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : t('Átnevezés sikertelen'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(connection.id);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: t('Teszt sikertelen') });
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
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[var(--text-primary)] text-sm">{provider.label}</div>
            {editing ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleRename(); }
                    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                  }}
                  autoFocus
                  disabled={saving}
                  maxLength={120}
                  placeholder={t('Megjelenített név')}
                  className="text-xs px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] w-56"
                />
                <button
                  onClick={handleRename}
                  disabled={saving}
                  className="text-xs font-semibold text-[var(--accent)] hover:opacity-70 disabled:opacity-50"
                >
                  {saving ? t('Mentés...') : t('Mentés')}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:opacity-70 disabled:opacity-50"
                >
                  {t('Mégse')}
                </button>
              </div>
            ) : (
              <div className="text-xs text-[var(--text-secondary)] truncate">
                {connection.externalAccountName || connection.externalAccountId}
              </div>
            )}
            {renameError && (
              <div className="text-xs text-[var(--error)] mt-1">{renameError}</div>
            )}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
          {t(status.label)}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {connection.lastSyncAt && (
          <div className="text-xs text-[var(--text-secondary)]">
            {t('Utolsó szinkronizáció')}: {new Date(connection.lastSyncAt).toLocaleString('hu-HU')}
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
              {t('Windsor beállítás')} &rarr;
            </a>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleTest}
          disabled={testing || editing}
          className="text-xs font-semibold text-[var(--accent)] hover:opacity-70 disabled:opacity-50"
        >
          {testing ? t('Tesztelés...') : t('Kapcsolat tesztelése')}
        </button>
        <span className="text-[var(--border)]">|</span>
        <button
          onClick={startEdit}
          disabled={editing}
          className="text-xs font-semibold text-[var(--accent)] hover:opacity-70 disabled:opacity-50"
        >
          {t('Átnevezés')}
        </button>
        {VIDEO_VISIBILITY_PROVIDERS.has(connection.provider) && (
          <>
            <span className="text-[var(--border)]">|</span>
            <button
              onClick={() => setVideosOpen(true)}
              disabled={editing}
              className="text-xs font-semibold text-[var(--accent)] hover:opacity-70 disabled:opacity-50"
            >
              {t('Videók láthatósága')}
            </button>
          </>
        )}
        <span className="text-[var(--border)]">|</span>
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={editing}
          className="text-xs font-semibold text-[var(--error)] hover:opacity-70 disabled:opacity-50"
        >
          {t('Törlés')}
        </button>
      </div>

      {videosOpen && (
        <VideoVisibilityDialog
          connection={connection}
          onClose={() => setVideosOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t('Integráció törlése')}
        message={`${t('Biztosan törlöd a(z)')} ${provider.label} ${t('integrációt?')}`}
        confirmLabel={t('Törlés')}
        cancelLabel={t('Mégse')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
