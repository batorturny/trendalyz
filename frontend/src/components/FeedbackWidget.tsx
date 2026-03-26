'use client';

import { useState, useEffect } from 'react';
import { MessageSquarePlus, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [firstOpen, setFirstOpen] = useState(true);
  const pathname = usePathname();

  // Reset sent state when closing
  useEffect(() => {
    if (!open) { setSent(false); setFirstOpen(true); }
  }, [open]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          page: pathname,
          url: window.location.href,
        }),
      });
      setSent(true);
      setText('');
      setTimeout(() => setOpen(false), 2000);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button — bottom left */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 left-6 z-50 w-10 h-10 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] shadow-lg hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all flex items-center justify-center"
        title="Fejlesztési javaslat"
      >
        <MessageSquarePlus className="w-4 h-4" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-18 left-6 w-80 z-50 rounded-2xl shadow-2xl border border-[var(--border)] bg-[var(--surface-raised)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">💡 Fejlesztési javaslat</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[var(--border)] text-[var(--text-secondary)]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            {/* Explanation — only on first open */}
            {firstOpen && !sent && (
              <div className="mb-3 p-3 bg-[var(--accent)]/5 border border-[var(--accent)]/15 rounded-xl">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Találtál hibát vagy van ötleted? Írd le itt és közvetlenül a fejlesztőhöz kerül.
                  Az aktuális oldal automatikusan csatolva lesz.
                </p>
              </div>
            )}

            {sent ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <p className="text-sm font-bold text-green-600 dark:text-green-400">Köszönjük, elküldtük!</p>
              </div>
            ) : (
              <>
                {/* Current page indicator */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] text-[var(--text-secondary)]">📍</span>
                  <span className="text-[10px] text-[var(--text-secondary)] truncate">{pathname}</span>
                </div>

                <textarea
                  value={text}
                  onChange={e => { setText(e.target.value); setFirstOpen(false); }}
                  placeholder="Mi lehetne jobb? Hol akadtál el?"
                  rows={4}
                  maxLength={2000}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-sm resize-none outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                  autoFocus
                />

                <button
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  className="w-full mt-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] hover:brightness-110 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Javaslat küldése
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
