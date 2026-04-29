'use client';

import { useEffect, useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { generateCharts } from '@/lib/api';
import { getConnectionExcludedVideoIds, setConnectionExcludedVideoIds } from '../actions';
import { useT } from '@/lib/i18n';
import type { IntegrationConnection } from '@/types/integration';

interface VideoRow {
  id: string;
  caption: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

interface Props {
  connection: IntegrationConnection;
  onClose: () => void;
}

const LOOKBACK_DAYS = 365;

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function VideoVisibilityDialog({ connection, onClose }: Props) {
  const t = useT();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const end = new Date();
        const start = new Date(); start.setDate(start.getDate() - LOOKBACK_DAYS);
        const [excludedList, response] = await Promise.all([
          getConnectionExcludedVideoIds(connection.id, connection.companyId),
          generateCharts({
            accountId: connection.companyId,
            externalAccountId: connection.externalAccountId,
            provider: connection.provider,
            startDate: toIsoDate(start),
            endDate: toIsoDate(end),
            charts: [{ key: 'all_videos' }],
          }),
        ]);
        if (cancelled) return;

        const allVideosChart = response.charts.find(c => c.key === 'all_videos');
        const rawRows = (allVideosChart?.data?.series?.[0]?.data || []) as VideoRow[];
        const sorted = [...rawRows]
          .filter(v => v.id)
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setVideos(sorted);
        setExcluded(new Set(excludedList));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('Hiba történt'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [connection.id, connection.companyId, connection.externalAccountId, connection.provider, t]);

  const toggle = (id: string) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const showAll = () => setExcluded(new Set());
  const hideAll = () => setExcluded(new Set(videos.map(v => v.id)));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await setConnectionExcludedVideoIds(connection.id, connection.companyId, [...excluded]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Mentés sikertelen'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = search.trim()
    ? videos.filter(v => (v.caption || '').toLowerCase().includes(search.toLowerCase()))
    : videos;
  const visibleCount = videos.length - excluded.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t('Videók láthatósága')}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {connection.externalAccountName || connection.externalAccountId}
              {!loading && (
                <> &middot; {visibleCount}/{videos.length} {t('látható')}</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)] transition-colors"
            aria-label={t('Bezárás')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Keresés a feliratban...')}
            className="flex-1 min-w-[200px] bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            onClick={showAll}
            className="text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            {t('Mindet mutat')}
          </button>
          <button
            onClick={hideAll}
            className="text-xs font-semibold text-[var(--error)] hover:underline"
          >
            {t('Mindet rejt')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[var(--text-secondary)]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {t('Videók betöltése...')}
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-[var(--error)]">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-12 text-sm text-[var(--text-secondary)] text-center">
              {videos.length === 0
                ? t('Nem találtunk videót az utóbbi évben')
                : t('Nincs találat')}
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((v) => {
                const hidden = excluded.has(v.id);
                return (
                  <li
                    key={v.id}
                    className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      hidden
                        ? 'bg-[var(--surface-raised)] opacity-60 hover:opacity-80'
                        : 'hover:bg-[var(--accent-subtle)]'
                    }`}
                    onClick={() => toggle(v.id)}
                  >
                    <span
                      className={`mt-1 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        hidden
                          ? 'border-[var(--border)] bg-[var(--surface)]'
                          : 'border-transparent bg-[var(--accent)] text-white'
                      }`}
                    >
                      {!hidden && <Check className="w-3 h-3" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--text-primary)] line-clamp-2">
                        {v.caption || <span className="text-[var(--text-secondary)] italic">{t('Nincs felirat')}</span>}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-3 flex-wrap">
                        <span>{v.date}</span>
                        <span>{v.views?.toLocaleString('hu-HU') ?? 0} {t('megtekintés')}</span>
                        <span>{v.likes?.toLocaleString('hu-HU') ?? 0} like</span>
                        <span className="font-mono opacity-60" title={v.id}>{v.id.slice(-12)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-raised)]">
          <button
            onClick={onClose}
            disabled={saving}
            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-lg disabled:opacity-50"
          >
            {t('Mégse')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="text-sm font-bold text-white dark:text-[var(--surface)] bg-[var(--accent)] hover:opacity-90 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? t('Mentés...') : t('Mentés')}
          </button>
        </div>
      </div>
    </div>
  );
}
