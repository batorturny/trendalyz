'use client';

import { useState } from 'react';
import { MessageCircle, Send, ChevronRight } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  platforms: string[];
}

interface Evaluation {
  id: string;
  companyId: string;
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
function formatMonth(ym: string) { const [y, m] = ym.split('-').map(Number); return `${y}. ${MONTH_NAMES[m - 1]}`; }

interface Props {
  companies: Company[];
  evaluations: Evaluation[];
}

export function EvaluationsOverview({ companies, evaluations: initialEvals }: Props) {
  const [evaluations, setEvaluations] = useState(initialEvals);
  const [selectedCompany, setSelectedCompany] = useState(companies[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const company = companies.find(c => c.id === selectedCompany);
  const monthEvals = evaluations.filter(e => e.companyId === selectedCompany && e.month === selectedMonth);
  const targetEvals = selectedPlatform === 'ALL' ? monthEvals : monthEvals.filter(e => e.platform === selectedPlatform);
  const existingMessage = targetEvals.find(e => e.adminMessage)?.adminMessage || '';

  // Sync message when selection changes
  const [lastKey, setLastKey] = useState('');
  const key = `${selectedCompany}-${selectedMonth}`;
  if (key !== lastKey) {
    setLastKey(key);
    setMessage(existingMessage);
    setSaved(false);
  }

  async function handleSend() {
    if (!message.trim() || !company) return;
    setSaving(true);
    const targetPlatforms = selectedPlatform === 'ALL' ? company.platforms : [selectedPlatform];
    try {
      await Promise.all(
        targetPlatforms.map(platform =>
          fetch('/api/evaluations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId: selectedCompany, platform, month: selectedMonth, adminMessage: message }),
          })
        )
      );
      // Refetch
      const res = await fetch(`/api/evaluations?companyId=${selectedCompany}`);
      if (res.ok) {
        const fresh = await res.json();
        setEvaluations(prev => [...prev.filter(e => e.companyId !== selectedCompany), ...fresh]);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  // Last 6 months
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  // Companies with unread replies
  const companiesWithReplies = companies.map(c => {
    const replies = evaluations.filter(e => e.companyId === c.id && e.clientReply);
    const unread = evaluations.filter(e => e.companyId === c.id && e.clientReply && !e.clientReadAt);
    return { ...c, replyCount: replies.length, unreadCount: unread.length };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Company list */}
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-4">
        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">Cégek</p>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {companiesWithReplies.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCompany(c.id)}
              className={`w-full text-left px-3 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition ${c.id === selectedCompany ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)]'}`}
            >
              <span className="truncate">{c.name}</span>
              <div className="flex items-center gap-2">
                {c.replyCount > 0 && (
                  <span className="text-xs text-[var(--text-secondary)]">💬 {c.replyCount}</span>
                )}
                {c.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{c.unreadCount}</span>
                )}
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Editor + Responses */}
      <div className="lg:col-span-2 space-y-4">
        {/* Editor */}
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-bold">{company?.name || 'Válassz céget'}</h2>
          </div>

          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-semibold"
            >
              {months.map(m => (
                <option key={m} value={m}>{formatMonth(m)}</option>
              ))}
            </select>
            {company && (
              <select
                value={selectedPlatform}
                onChange={e => setSelectedPlatform(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-semibold"
              >
                <option value="ALL">Összes platform</option>
                {company.platforms.map(p => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p] || p}</option>
                ))}
              </select>
            )}
            {saved && (
              <span className="text-green-500 text-xs font-bold animate-pulse">Elküldve!</span>
            )}
          </div>

          <textarea
            value={message}
            onChange={e => { setMessage(e.target.value); setSaved(false); }}
            placeholder="Írd ide a havi értékelést az ügyfélnek..."
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-sm min-h-[120px] resize-y mb-3"
          />
          <button
            onClick={handleSend}
            disabled={saving || !message.trim() || !company}
            className="btn-press px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {saving ? 'Küldés...' : existingMessage ? 'Frissítés' : 'Küldés'}
          </button>
        </div>

        {/* Client responses for this company+month */}
        {monthEvals.filter(e => e.clientReaction || e.clientReply).length > 0 && (
          <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">
              Ügyfél válaszai — {formatMonth(selectedMonth)}
            </p>
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

        {/* All evaluations history for this company */}
        {evaluations.filter(e => e.companyId === selectedCompany && e.adminMessage).length > 0 && (
          <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">Korábbi hónapok</p>
            <div className="space-y-1">
              {[...new Set(evaluations.filter(e => e.companyId === selectedCompany && e.adminMessage).map(e => e.month))]
                .sort((a, b) => b.localeCompare(a))
                .map(month => {
                  const evs = evaluations.filter(e => e.companyId === selectedCompany && e.month === month);
                  const hasReply = evs.some(e => e.clientReply);
                  const allRead = evs.every(e => e.clientReadAt);
                  const reactions = [...new Set(evs.filter(e => e.clientReaction).map(e => e.clientReaction))];
                  return (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-[var(--accent-subtle)] transition ${month === selectedMonth ? 'bg-[var(--accent-subtle)]' : ''}`}
                    >
                      <span className="font-semibold">{formatMonth(month)}</span>
                      <div className="flex items-center gap-2">
                        {reactions.length > 0 && <span>{reactions.join('')}</span>}
                        <span className={`${hasReply ? 'bg-green-500' : allRead ? 'bg-blue-500' : 'bg-yellow-500'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                          {hasReply ? 'Válaszolt' : allRead ? 'Olvasva' : 'Elküldve'}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
