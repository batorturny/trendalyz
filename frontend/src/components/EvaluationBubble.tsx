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

export function EvaluationBubble({ companyId, platform, month }: EvaluationBubbleProps) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [reactingEmoji, setReactingEmoji] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchEvaluation = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/evaluations?companyId=${companyId}&platform=${platform}&month=${month}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.id && data.adminMessage) {
        setEvaluation(data);
      }
    } catch {
      // silent fail — bubble just won't show
    }
  }, [companyId, platform, month]);

  useEffect(() => {
    fetchEvaluation();
  }, [fetchEvaluation]);

  // Mark as read when panel opens
  useEffect(() => {
    if (!open || !evaluation?.id || evaluation.clientReadAt) return;

    fetch(`/api/evaluations/${evaluation.id}/read`, { method: 'PATCH' })
      .then((res) => {
        if (res.ok) {
          setEvaluation((prev) => (prev ? { ...prev, clientReadAt: new Date().toISOString() } : prev));
        }
      })
      .catch(() => {});
  }, [open, evaluation?.id, evaluation?.clientReadAt]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleReaction = async (emoji: string) => {
    if (!evaluation?.id) return;
    const isDeselect = evaluation.clientReaction === emoji;
    const newEmoji = isDeselect ? null : emoji;

    setReactingEmoji(emoji);
    // Optimistic update
    setEvaluation((prev) => (prev ? { ...prev, clientReaction: newEmoji } : prev));

    try {
      const res = await fetch(`/api/evaluations/${evaluation.id}/react`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: newEmoji }),
      });
      if (!res.ok) {
        // Revert on error
        setEvaluation((prev) => (prev ? { ...prev, clientReaction: isDeselect ? emoji : null } : prev));
      }
    } catch {
      setEvaluation((prev) => (prev ? { ...prev, clientReaction: isDeselect ? emoji : null } : prev));
    } finally {
      setReactingEmoji(null);
    }
  };

  const handleReply = async () => {
    if (!evaluation?.id || !replyText.trim()) return;
    setSending(true);

    try {
      const res = await fetch(`/api/evaluations/${evaluation.id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEvaluation(updated);
        setReplyText('');
      }
    } catch {
      // keep text in textarea so user can retry
    } finally {
      setSending(false);
    }
  };

  // Don't render if no evaluation or no admin message
  if (!evaluation?.adminMessage) return null;

  const isUnread = !evaluation.clientReadAt;
  const hasReply = !!evaluation.clientReply;

  return (
    <div ref={panelRef}>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-lg hover:brightness-110 transition-all duration-200 flex items-center justify-center"
        aria-label="Havi értékelés megnyitása"
      >
        <MessageCircle className="w-5 h-5" />
        {isUnread && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            1
          </span>
        )}
      </button>

      {/* Slide-up panel */}
      <div
        className={`fixed bottom-20 right-6 w-80 max-h-[70vh] z-50 rounded-2xl shadow-2xl border border-[var(--border)] bg-[var(--surface-raised)] flex flex-col overflow-hidden transition-all duration-300 ${
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Havi értékelés
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-[var(--surface)] transition-colors text-[var(--text-secondary)]"
            aria-label="Bezárás"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Admin message card */}
          <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] mb-1.5">
              Admin üzenet
              {evaluation.adminMessageAt && (
                <span className="ml-1">
                  &middot;{' '}
                  {new Date(evaluation.adminMessageAt).toLocaleDateString('hu-HU', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </p>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
              {evaluation.adminMessage}
            </p>
          </div>

          {/* Emoji reactions */}
          <div className="flex items-center gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                disabled={reactingEmoji !== null}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all duration-150 ${
                  evaluation.clientReaction === emoji
                    ? 'bg-[var(--accent)]/15 ring-2 ring-[var(--accent)] scale-110'
                    : 'bg-[var(--surface)] hover:bg-[var(--border)]'
                }`}
                aria-label={`Reakció: ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Existing reply (read-only) */}
          {hasReply && (
            <div className="bg-[var(--accent)]/10 rounded-xl p-3 border border-[var(--accent)]/20">
              <p className="text-xs text-[var(--text-secondary)] mb-1.5">
                Válaszod
                {evaluation.clientReplyAt && (
                  <span className="ml-1">
                    &middot;{' '}
                    {new Date(evaluation.clientReplyAt).toLocaleDateString('hu-HU', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </p>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                {evaluation.clientReply}
              </p>
            </div>
          )}

          {/* Reply input (only if not yet replied) */}
          {!hasReply && (
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Válasz írása..."
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl resize-none outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              <button
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
                className="w-full px-4 py-2 text-sm font-bold text-white bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Küldés
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
