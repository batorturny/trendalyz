'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Plus } from 'lucide-react';

interface ChatMessage { role: 'admin' | 'client'; text: string; at: string; name?: string; reaction?: string; }
interface Evaluation {
  id: string; companyId: string; platform: string; month: string;
  adminMessage: string | null; clientReaction: string | null;
  clientReply: string | null; clientReadAt: string | null;
  adminMessageAt?: string | null; clientReplyAt?: string | null;
  messages?: ChatMessage[];
}

interface Props { companyId: string; platform: string; month: string; }

const EMOJIS = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F525}', '\u{1F914}'];

function fmtDate(at: string): string {
  if (!at) return '';
  const d = new Date(at);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function EvaluationBubble({ companyId }: Props) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [emojiPickerIdx, setEmojiPickerIdx] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchEvaluations = useCallback(async () => {
    try {
      const res = await fetch(`/api/evaluations?companyId=${companyId}`);
      if (!res.ok) return;
      const data = await res.json();
      setEvaluations(Array.isArray(data) ? data.filter((e: Evaluation) => e.adminMessage) : []);
    } catch {}
  }, [companyId]);

  useEffect(() => { fetchEvaluations(); }, [fetchEvaluations]);

  // Build unified chat
  const allMessages: ChatMessage[] = evaluations.flatMap(e => {
    const msgs = (e.messages as ChatMessage[] || []);
    if (msgs.length > 0) return msgs;
    const legacy: ChatMessage[] = [];
    if (e.adminMessage) legacy.push({ role: 'admin', text: e.adminMessage, at: (e as any).adminMessageAt || '' });
    if (e.clientReply) legacy.push({ role: 'client', text: e.clientReply, at: (e as any).clientReplyAt || '' });
    return legacy;
  });
  const seen = new Set<string>();
  const chatMessages = allMessages.filter(m => {
    const key = `${m.role}:${m.text}:${m.at}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  // Find last read timestamp
  const lastReadAt = evaluations.reduce((latest, e) => {
    if (e.clientReadAt && (!latest || e.clientReadAt > latest)) return e.clientReadAt;
    return latest;
  }, '' as string);

  useEffect(() => { if (open) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [open, chatMessages.length]);

  // Mark as read on open
  useEffect(() => {
    if (!open) return;
    evaluations.filter(e => !e.clientReadAt && e.adminMessage).forEach(ev => {
      fetch(`/api/evaluations/${ev.id}/read`, { method: 'PATCH' }).catch(() => {});
    });
  }, [open, evaluations]);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) { setOpen(false); setEmojiPickerIdx(null); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reply
  const handleReply = async () => {
    if (!replyText.trim()) return;
    // Reply to the evaluation with the most recent admin message
    const ev = [...evaluations].sort((a, b) => {
      const aAt = (a as any).adminMessageAt || '';
      const bAt = (b as any).adminMessageAt || '';
      return bAt.localeCompare(aAt);
    })[0];
    if (!ev) return;
    setSending(true);
    try {
      const res = await fetch(`/api/evaluations/${ev.id}/reply`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (res.ok) { setReplyText(''); await fetchEvaluations(); }
    } catch {} finally { setSending(false); }
  };

  // Per-message emoji reaction (stored in messages JSON)
  const handleMessageReaction = async (msgIdx: number, emoji: string) => {
    const targetMsg = chatMessages[msgIdx];
    if (!targetMsg) return;
    setEmojiPickerIdx(null);

    // Find which evaluation contains this message and update it
    for (const ev of evaluations) {
      const msgs = (ev.messages as ChatMessage[] || []);
      const idx = msgs.findIndex(m => m.text === targetMsg.text && m.at === targetMsg.at && m.role === targetMsg.role);
      if (idx === -1) continue;

      const updated = [...msgs];
      updated[idx] = { ...updated[idx], reaction: updated[idx].reaction === emoji ? undefined : emoji };

      // Optimistic update
      setEvaluations(prev => prev.map(e => e.id === ev.id ? { ...e, messages: updated } : e));

      // Save to server
      try {
        await fetch(`/api/evaluations/${ev.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: updated }),
        });
      } catch {}
      break;
    }
  };

  if (evaluations.length === 0) return null;

  // Show red dot on bubble if the last message is from admin (user hasn't responded yet)
  const lastMsg = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
  const hasUnresponded = lastMsg?.role === 'admin';

  return (
    <div ref={panelRef}>
      {/* Bubble */}
      <button onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-lg hover:brightness-110 transition-all flex items-center justify-center">
        <MessageCircle className="w-5 h-5" />
        {hasUnresponded && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full" />}
      </button>

      {/* Panel */}
      <div className={`fixed bottom-20 right-6 w-96 z-50 rounded-2xl shadow-2xl border border-[var(--border)] bg-[var(--surface-raised)] flex flex-col overflow-hidden transition-all duration-300 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{ height: '560px' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-bold">Értékelés</h3>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)]"><X className="w-4 h-4" /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'admin' ? 'justify-start' : 'justify-end'}`}>
                <div className={`relative max-w-[85%] rounded-xl px-3 py-2 mb-1 ${
                  msg.role === 'admin'
                    ? 'bg-[var(--surface)] border border-[var(--border)] rounded-bl-md'
                    : 'bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-br-md'
                }`}>
                  <p className={`text-[10px] font-bold mb-0.5 ${msg.role === 'admin' ? 'text-[var(--text-secondary)]' : 'text-[var(--accent)]'}`}>
                    {msg.name || (msg.role === 'admin' ? 'Admin' : 'Te')}
                  </p>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center justify-between mt-1">
                    {fmtDate(msg.at) ? <p className="text-[9px] text-[var(--text-secondary)]">{fmtDate(msg.at)}</p> : <span />}
                    {/* Reaction button — only on admin messages, inline */}
                    {msg.role === 'admin' && (
                      <button onClick={() => setEmojiPickerIdx(emojiPickerIdx === i ? null : i)}
                        className="text-sm hover:scale-110 transition-transform ml-2">
                        {msg.reaction || <Plus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
                      </button>
                    )}
                  </div>
                  {/* Emoji picker */}
                  {emojiPickerIdx === i && (
                    <div className="flex gap-1 mt-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-full px-1.5 py-0.5">
                      {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleMessageReaction(i, emoji)}
                          className={`w-7 h-7 rounded-full text-base flex items-center justify-center hover:scale-125 transition-transform ${msg.reaction === emoji ? 'bg-[var(--accent)]/20' : ''}`}
                        >{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Compose */}
        <div className="px-3 py-2 border-t border-[var(--border)]">
          <div className="flex gap-2">
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
              placeholder="Válasz..." rows={1} maxLength={2000}
              className="flex-1 px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl resize-none outline-none focus:border-[var(--accent)] text-[var(--text-primary)]" />
            <button onClick={handleReply} disabled={sending || !replyText.trim()}
              className="px-3 py-2 text-sm font-bold text-white bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 rounded-xl flex items-center">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
