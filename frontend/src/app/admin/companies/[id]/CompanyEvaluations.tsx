'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface Evaluation {
  id: string;
  platform: string;
  month: string;
  adminMessage: string | null;
  adminMessageAt: string | null;
  clientReaction: string | null;
  clientReply: string | null;
  clientReplyAt: string | null;
  clientReadAt: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK_ORGANIC: 'TikTok',
  FACEBOOK_ORGANIC: 'Facebook',
  INSTAGRAM_ORGANIC: 'Instagram',
  YOUTUBE: 'YouTube',
  TIKTOK_ADS: 'TikTok Ads',
};

const MONTH_NAMES = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${y}. ${MONTH_NAMES[m - 1]}`;
}

interface Props {
  companyId: string;
  platforms: string[];
}

export function CompanyEvaluations({ companyId, platforms }: Props) {
  const t = useT();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchEvaluations = useCallback(async () => {
    try {
      const res = await fetch(`/api/evaluations?companyId=${companyId}`);
      if (res.ok) setEvaluations(await res.json());
    } catch (e) {
      console.error('Failed to fetch evaluations:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchEvaluations(); }, [fetchEvaluations]);

  // Load existing message for selected month (from any platform — they're all the same)
  const monthEvals = evaluations.filter(e => e.month === selectedMonth);
  const existingMessage = monthEvals.find(e => e.adminMessage)?.adminMessage || '';

  useEffect(() => {
    setMessage(existingMessage);
    setSaved(false);
  }, [selectedMonth, existingMessage]);

  // Send to ALL platforms at once
  async function handleSend() {
    if (!message.trim()) return;
    setSaving(true);
    try {
      await Promise.all(
        platforms.map(platform =>
          fetch('/api/evaluations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId, platform, month: selectedMonth, adminMessage: message }),
          })
        )
      );
      await fetchEvaluations();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save evaluations:', e);
    } finally {
      setSaving(false);
    }
  }

  function getStatus(ev: Evaluation) {
    if (ev.clientReply) return { label: 'Válaszolt', color: 'bg-green-500' };
    if (ev.clientReadAt) return { label: 'Olvasva', color: 'bg-blue-500' };
    if (ev.adminMessage) return { label: 'Elküldve', color: 'bg-yellow-500' };
    return null;
  }

  // Last 6 months
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  // Aggregate status across platforms for selected month
  const hasReplies = monthEvals.some(e => e.clientReply);
  const allRead = monthEvals.length > 0 && monthEvals.every(e => e.clientReadAt);
  const hasSent = monthEvals.some(e => e.adminMessage);
  const overallStatus = hasReplies
    ? { label: 'Válaszolt', color: 'bg-green-500' }
    : allRead
    ? { label: 'Olvasva', color: 'bg-blue-500' }
    : hasSent
    ? { label: 'Elküldve', color: 'bg-yellow-500' }
    : null;

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-5 h-5 text-[var(--accent)]" />
        <h2 className="text-lg font-bold">{t('Értékelések')}</h2>
      </div>

      {/* Month selector */}
      <div className="flex gap-3 mb-4 items-center">
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-semibold"
        >
          {months.map(m => (
            <option key={m} value={m}>{formatMonth(m)}</option>
          ))}
        </select>
        {overallStatus && (
          <span className={`${overallStatus.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
            {overallStatus.label}
          </span>
        )}
        {saved && (
          <span className="text-green-500 text-xs font-bold animate-pulse">Elküldve minden platformra!</span>
        )}
      </div>

      <p className="text-xs text-[var(--text-secondary)] mb-2">
        Az üzenet egyszerre megy ki minden platformra ({platforms.map(p => PLATFORM_LABELS[p] || p).join(', ')})
      </p>

      {/* Message editor */}
      <textarea
        value={message}
        onChange={e => { setMessage(e.target.value); setSaved(false); }}
        placeholder="Írd ide a havi értékelést az ügyfélnek..."
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-sm min-h-[100px] resize-y mb-3"
      />
      <button
        onClick={handleSend}
        disabled={saving || !message.trim()}
        className="btn-press px-4 py-2 rounded-xl bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        {saving ? 'Küldés...' : existingMessage ? 'Frissítés' : 'Küldés'}
      </button>

      {/* Client responses per platform */}
      {monthEvals.filter(e => e.clientReaction || e.clientReply).length > 0 && (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">Ügyfél reakciók — {formatMonth(selectedMonth)}</p>
          <div className="space-y-3">
            {monthEvals.filter(e => e.clientReaction || e.clientReply).map(ev => (
              <div key={ev.id} className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">{PLATFORM_LABELS[ev.platform]}</span>
                  {ev.clientReaction && <span className="text-xl">{ev.clientReaction}</span>}
                </div>
                {ev.clientReply && (
                  <p className="text-sm text-[var(--text-primary)]">{ev.clientReply}</p>
                )}
                {ev.clientReplyAt && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{new Date(ev.clientReplyAt).toLocaleString('hu-HU')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {evaluations.filter(e => e.adminMessage).length > 0 && (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">Korábbi hónapok</p>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {[...new Set(evaluations.filter(e => e.adminMessage).map(e => e.month))]
              .sort((a, b) => b.localeCompare(a))
              .map(month => {
                const evs = evaluations.filter(e => e.month === month && e.adminMessage);
                const hasReply = evs.some(e => e.clientReply);
                const read = evs.every(e => e.clientReadAt);
                const reactions = evs.filter(e => e.clientReaction).map(e => e.clientReaction);
                return (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-[var(--accent-subtle)] transition ${month === selectedMonth ? 'bg-[var(--accent-subtle)]' : ''}`}
                  >
                    <span className="font-semibold">{formatMonth(month)}</span>
                    <div className="flex items-center gap-2">
                      {reactions.length > 0 && <span>{[...new Set(reactions)].join('')}</span>}
                      <span className={`${hasReply ? 'bg-green-500' : read ? 'bg-blue-500' : 'bg-yellow-500'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                        {hasReply ? 'Válaszolt' : read ? 'Olvasva' : 'Elküldve'}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
