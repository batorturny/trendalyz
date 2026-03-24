'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, ChevronDown } from 'lucide-react';
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
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0] || 'TIKTOK_ORGANIC');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEvaluations = useCallback(async () => {
    try {
      const res = await fetch(`/api/evaluations?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data);
      }
    } catch (e) {
      console.error('Failed to fetch evaluations:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchEvaluations(); }, [fetchEvaluations]);

  const currentEval = evaluations.find(e => e.platform === selectedPlatform && e.month === selectedMonth);

  useEffect(() => {
    setMessage(currentEval?.adminMessage || '');
  }, [currentEval?.id, currentEval?.adminMessage]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          platform: selectedPlatform,
          month: selectedMonth,
          adminMessage: message,
        }),
      });
      if (res.ok) {
        await fetchEvaluations();
      }
    } catch (e) {
      console.error('Failed to save evaluation:', e);
    } finally {
      setSaving(false);
    }
  }

  // Status badge
  function getStatus(ev: Evaluation | undefined) {
    if (!ev?.adminMessage) return null;
    if (ev.clientReply) return { label: 'Válaszolt', color: 'bg-green-500' };
    if (ev.clientReadAt) return { label: 'Olvasva', color: 'bg-blue-500' };
    return { label: 'Elküldve', color: 'bg-yellow-500' };
  }

  // Generate last 6 months
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const status = getStatus(currentEval);

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-5 h-5 text-[var(--accent)]" />
        <h2 className="text-lg font-bold">{t('Értékelések')}</h2>
      </div>

      {/* Platform + Month selector */}
      <div className="flex gap-3 mb-4">
        <select
          value={selectedPlatform}
          onChange={e => setSelectedPlatform(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-semibold"
        >
          {platforms.map(p => (
            <option key={p} value={p}>{PLATFORM_LABELS[p] || p}</option>
          ))}
        </select>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-semibold"
        >
          {months.map(m => (
            <option key={m} value={m}>{formatMonth(m)}</option>
          ))}
        </select>
        {status && (
          <span className={`${status.color} text-white text-xs font-bold px-3 py-1 rounded-full self-center`}>
            {status.label}
          </span>
        )}
      </div>

      {/* Admin message editor */}
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Írd ide a havi értékelést az ügyfélnek..."
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-sm min-h-[100px] resize-y mb-3"
      />
      <button
        onClick={handleSave}
        disabled={saving || !message.trim()}
        className="btn-press px-4 py-2 rounded-xl bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        {saving ? 'Mentés...' : currentEval?.adminMessage ? 'Frissítés' : 'Küldés'}
      </button>

      {/* Client response */}
      {currentEval?.clientReaction && (
        <div className="mt-4 p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Ügyfél reakciója</p>
          <span className="text-2xl">{currentEval.clientReaction}</span>
        </div>
      )}
      {currentEval?.clientReply && (
        <div className="mt-3 p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Ügyfél válasza</p>
          <p className="text-sm text-[var(--text-primary)]">{currentEval.clientReply}</p>
          {currentEval.clientReplyAt && (
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {new Date(currentEval.clientReplyAt).toLocaleString('hu-HU')}
            </p>
          )}
        </div>
      )}

      {/* History list */}
      {evaluations.filter(e => e.adminMessage).length > 0 && (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">Korábbi értékelések</p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {evaluations
              .filter(e => e.adminMessage)
              .sort((a, b) => b.month.localeCompare(a.month))
              .map(ev => {
                const st = getStatus(ev);
                return (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedPlatform(ev.platform); setSelectedMonth(ev.month); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-[var(--accent-subtle)] transition ${ev.platform === selectedPlatform && ev.month === selectedMonth ? 'bg-[var(--accent-subtle)]' : ''}`}
                  >
                    <span className="font-semibold">{PLATFORM_LABELS[ev.platform]} — {formatMonth(ev.month)}</span>
                    <div className="flex items-center gap-2">
                      {ev.clientReaction && <span>{ev.clientReaction}</span>}
                      {st && <span className={`${st.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>{st.label}</span>}
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
