'use client';

import { useState, useTransition } from 'react';
import { Ticket } from 'lucide-react';
import { redeemCoupon } from './actions';

export function CouponCode() {
  const [code, setCode] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleRedeem() {
    if (!code.trim()) return;
    setMessage(null);

    startTransition(async () => {
      const result = await redeemCoupon(code.trim());

      if (result.success) {
        setMessage({ type: 'success', text: `Sikeres beváltás! Új csomag: ${result.tier} (${result.companyLimit} cég)` });
        setCode('');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Hiba történt' });
      }
    });
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
          disabled={isPending || !code.trim()}
          className="btn-press px-6 py-2.5 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white dark:text-[var(--surface)] font-bold text-sm rounded-xl hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Beváltás...' : 'Beváltás'}
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
