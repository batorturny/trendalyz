'use client';

import { useState } from 'react';
import { Ticket } from 'lucide-react';

export function CouponCode() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleRedeem() {
    if (!code.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/billing/redeem-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Hiba történt' });
        return;
      }

      setMessage({ type: 'success', text: `Sikeres beváltás! Új csomag: ${data.tier}` });
      setCode('');

      // Reload after short delay to reflect new tier
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setMessage({ type: 'error', text: 'Hálózati hiba' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
        <Ticket className="w-5 h-5" />
        Kuponkód beváltása
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Ha rendelkezel kuponkóddal, itt válthatod be.
      </p>

      <div className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Kuponkód"
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
        />
        <button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="btn-press px-6 py-2.5 bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold text-sm rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Beváltás...' : 'Beváltás'}
        </button>
      </div>

      {message && (
        <div className={`mt-3 text-sm font-medium ${
          message.type === 'success'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
