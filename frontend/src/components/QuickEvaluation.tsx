'use client';

import { useState, useCallback } from 'react';

interface Props {
  companyId: string;
  platformKey: string;
  month: string;
}

export function QuickEvaluation({ companyId, platformKey, month }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ companyId, platform: platformKey, month, adminMessage: text.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setSent(true);
      setText('');
      setTimeout(() => { setSent(false); setOpen(false); }, 1500);
    } catch (err) {
      console.error('[QuickEvaluation] handleSend', err);
    } finally {
      setSending(false);
    }
  }, [companyId, platformKey, month, text]);

  return (
    <div className="mt-4">
      <button
        onClick={() => { setOpen(!open); setSent(false); }}
        className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Gyors értékelés küldése</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {sent ? (
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Elküldve!</p>
          ) : (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Írd ide az értékelést..."
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y"
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="text-sm font-bold px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {sending ? 'Küldés...' : 'Küldés'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
