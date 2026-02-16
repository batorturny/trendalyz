'use client';

import { useState } from 'react';
import { Mail, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  companyId: string;
  companyName: string;
  platform: string;
  month: string;
  onClose: () => void;
}

export function SendReportModal({ companyId, companyName, platform, month, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/reports/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyId,
          companyName,
          platform,
          month,
          recipientEmail: email.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ ok: true, message: `Riport elküldve: ${data.sentTo}` });
      } else {
        setResult({ ok: false, message: data.error || 'Hiba történt' });
      }
    } catch {
      setResult({ ok: false, message: 'Hálózati hiba' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Riport küldés emailben</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--accent-subtle)] transition">
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="p-5 space-y-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              A(z) <strong className="text-[var(--text-primary)]">{companyName}</strong> riportja ({month}) KPI összefoglalóval kerül kiküldésre.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">
              Címzett email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="kliens@ceg.hu"
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
              disabled={sending || result?.ok === true}
            />
          </div>

          {/* Result message */}
          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
              result.ok
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300'
            }`}>
              {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {result.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] bg-[var(--surface-raised)] border border-[var(--border)] hover:bg-[var(--accent-subtle)] transition"
            >
              {result?.ok ? 'Bezárás' : 'Mégse'}
            </button>
            {!result?.ok && (
              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Küldés...</> : <><Mail className="w-4 h-4" /> Küldés</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
