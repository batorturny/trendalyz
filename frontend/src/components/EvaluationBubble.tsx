'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

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

interface EvaluationBubbleProps {
  companyId: string;
  platform: string;
  month: string;
}

const EMOJIS = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F525}', '\u{1F914}'];

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK_ORGANIC: 'TikTok',
  FACEBOOK_ORGANIC: 'Facebook',
  INSTAGRAM_ORGANIC: 'Instagram',
  YOUTUBE: 'YouTube',
  TIKTOK_ADS: 'TikTok Ads',
};

const MONTH_NAMES = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];
function fmtMonth(ym: string) { const [y, m] = ym.split('-').map(Number); return `${y}. ${MONTH_NAMES[m - 1]}`; }

export function EvaluationBubble({ companyId, platform, month }: EvaluationBubbleProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [activeEval, setActiveEval] = useState<Evaluation | null>(null);
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [reactingEmoji, setReactingEmoji] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchEvaluations = useCallback(async () => {
    try {
      const res = await fetch(`/api/evaluations?companyId=${companyId}`);
      if (!res.ok) return;
      const data = await res.json();
      const withMessage = (Array.isArray(data) ? data : []).filter((e: Evaluation) => e.adminMessage);
      setEvaluations(withMessage);
      // Set active: prefer current platform+month, then latest unread, then latest
      const current = withMessage.find((e: Evaluation) => e.platform === platform && e.month === month);
      const unread = withMessage.find((e: Evaluation) => !e.clientReadAt);
      setActiveEval(current || unread || withMessage[0] || null);
    } catch { /* silent */ }
  }, [companyId, platform, month]);

  useEffect(() => { fetchEvaluations(); }, [fetchEvaluations]);

  // Mark as read when panel opens
  useEffect(() => {
    if (!open || !activeEval?.id || activeEval.clientReadAt) return;
    fetch(`/api/evaluations/${activeEval.id}/read`, { method: 'PATCH' })
      .then(res => { if (res.ok) setActiveEval(prev => prev ? { ...prev, clientReadAt: new Date().toISOString() } : prev); })
      .catch(() => {});
  }, [open, activeEval?.id, activeEval?.clientReadAt]);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleReaction = async (emoji: string) => {
    if (!activeEval?.id) return;
    const isDeselect = activeEval.clientReaction === emoji;
    const newEmoji = isDeselect ? null : emoji;
    setReactingEmoji(emoji);
    setActiveEval(prev => prev ? { ...prev, clientReaction: newEmoji } : prev);
    try {
      const res = await fetch(`/api/evaluations/${activeEval.id}/react`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: newEmoji }),
      });
      if (!res.ok) setActiveEval(prev => prev ? { ...prev, clientReaction: isDeselect ? emoji : null } : prev);
    } catch {
      setActiveEval(prev => prev ? { ...prev, clientReaction: isDeselect ? emoji : null } : prev);
    } finally { setReactingEmoji(null); }
  };

  const handleReply = async () => {
    if (!activeEval?.id || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/evaluations/${activeEval.id}/reply`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (res.ok) { const updated = await res.json(); setActiveEval(updated); setReplyText(''); }
    } catch { /* keep text */ } finally { setSending(false); }
  };

  if (evaluations.length === 0) return null;

  const unreadCount = evaluations.filter(e => !e.clientReadAt).length;

  return (
    <div ref={panelRef}>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-lg hover:brightness-110 transition-all flex items-center justify-center"
      >
        <MessageCircle className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{unreadCount}</span>
        )}
      </button>

      {/* Panel */}
      <div className={`fixed bottom-20 right-6 w-80 max-h-[75vh] z-50 rounded-2xl shadow-2xl border border-[var(--border)] bg-[var(--surface-raised)] flex flex-col overflow-hidden transition-all duration-300 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-bold">Havi értékelések</h3>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)]"><X className="w-4 h-4" /></button>
        </div>

        {/* Evaluation tabs (if multiple) */}
        {evaluations.length > 1 && (
          <div className="flex gap-1 px-3 pt-2 overflow-x-auto">
            {evaluations.map(ev => (
              <button
                key={ev.id}
                onClick={() => setActiveEval(ev)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap transition ${activeEval?.id === ev.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}
              >
                {PLATFORM_LABELS[ev.platform] || ev.platform} · {fmtMonth(ev.month)}
                {!ev.clientReadAt && <span className="ml-1 w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />}
              </button>
            ))}
          </div>
        )}

        {/* Active evaluation content */}
        {activeEval && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">
              {PLATFORM_LABELS[activeEval.platform]} — {fmtMonth(activeEval.month)}
            </p>

            <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)]">
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{activeEval.adminMessage}</p>
              {activeEval.adminMessageAt && (
                <p className="text-[10px] text-[var(--text-secondary)] mt-2">{new Date(activeEval.adminMessageAt).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}</p>
              )}
            </div>

            {/* Emoji reactions */}
            <div className="flex items-center gap-2">
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => handleReaction(emoji)} disabled={reactingEmoji !== null}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${activeEval.clientReaction === emoji ? 'bg-[var(--accent)]/15 ring-2 ring-[var(--accent)] scale-110' : 'bg-[var(--surface)] hover:bg-[var(--border)]'}`}
                >{emoji}</button>
              ))}
            </div>

            {/* Reply */}
            {activeEval.clientReply ? (
              <div className="bg-[var(--accent)]/10 rounded-xl p-3 border border-[var(--accent)]/20">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Válaszod</p>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{activeEval.clientReply}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Válasz írása..." rows={3} maxLength={2000}
                  className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl resize-none outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
                <button onClick={handleReply} disabled={sending || !replyText.trim()}
                  className="w-full px-4 py-2 text-sm font-bold text-white bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Posztolás
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
