'use client';

import { useState } from 'react';
import { Mail, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { BaseModal } from './BaseModal';

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
    <BaseModal open={true} onClose={onClose} className="max-w-md">
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
            className="input-field text-sm"
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
            className="btn-secondary flex-1 py-3 text-sm"
          >
            {result?.ok ? 'Bezárás' : 'Mégse'}
          </button>
          {!result?.ok && (
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
            >
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Küldés...</> : <><Mail className="w-4 h-4" /> Küldés</>}
            </button>
          )}
        </div>
      </form>
    </BaseModal>
  );
}
