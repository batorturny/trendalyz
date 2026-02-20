'use client';

import { useState } from 'react';

interface SubscriptionData {
  tier: string;
  status: string;
  companyLimit: number;
  currency: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  GROWTH: 'Growth',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  TRIALING: { label: 'Próbaidő', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  ACTIVE: { label: 'Aktív', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  PAST_DUE: { label: 'Lejárt fizetés', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' },
  CANCELED: { label: 'Lemondva', className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  UNPAID: { label: 'Nem fizetve', className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  INCOMPLETE: { label: 'Hiányos', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' },
};

export function BillingOverview({
  subscription,
  companyCount,
}: {
  subscription: SubscriptionData | null;
  companyCount: number;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const tier = subscription?.tier || 'FREE';
  const status = subscription?.status || 'ACTIVE';
  const limit = subscription?.companyLimit || 1;
  const usagePercent = Math.min((companyCount / limit) * 100, 100);
  const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.ACTIVE;

  async function handlePortal() {
    setLoading('portal');
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm('Biztosan lemondod az előfizetésed? A jelenlegi időszak végéig még használhatod a szolgáltatást.')) return;
    setLoading('cancel');
    try {
      await fetch('/api/billing/cancel', { method: 'POST' });
      window.location.reload();
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setLoading(null);
    }
  }

  async function handleReactivate() {
    setLoading('reactivate');
    try {
      await fetch('/api/billing/reactivate', { method: 'POST' });
      window.location.reload();
    } catch (err) {
      console.error('Reactivate error:', err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
      {/* Trial banner */}
      {status === 'TRIALING' && subscription?.trialEndsAt && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-sm text-blue-700 dark:text-blue-400">
          Próbaidő aktív — lejár: {new Date(subscription.trialEndsAt).toLocaleDateString('hu-HU')}
        </div>
      )}

      {/* Past due warning */}
      {status === 'PAST_DUE' && (
        <div className="mb-4 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 text-sm text-yellow-700 dark:text-yellow-400">
          Fizetési probléma — kérjük, frissítsd a fizetési adataidat a szolgáltatás zavartalanságáért.
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{TIER_LABELS[tier] || tier}</h2>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
          {subscription?.currentPeriodEnd && status !== 'CANCELED' && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {subscription.cancelAtPeriodEnd
                ? `Lemondva — aktív eddig: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('hu-HU')}`
                : `Következő számlázás: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('hu-HU')}`
              }
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {subscription?.stripeCustomerId && (
            <button
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="px-4 py-2 text-sm font-semibold bg-[var(--accent-subtle)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] transition-all disabled:opacity-50"
            >
              {loading === 'portal' ? 'Betöltés...' : 'Fizetési módok'}
            </button>
          )}
          {subscription?.stripeSubscriptionId && !subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleCancel}
              disabled={loading === 'cancel'}
              className="px-4 py-2 text-sm font-semibold text-[var(--error)] hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
            >
              {loading === 'cancel' ? 'Feldolgozás...' : 'Lemondás'}
            </button>
          )}
          {subscription?.cancelAtPeriodEnd && (
            <button
              onClick={handleReactivate}
              disabled={loading === 'reactivate'}
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white dark:text-[var(--surface)] rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all disabled:opacity-50"
            >
              {loading === 'reactivate' ? 'Feldolgozás...' : 'Újraaktiválás'}
            </button>
          )}
        </div>
      </div>

      {/* Usage bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[var(--text-secondary)]">Cég használat</span>
          <span className="text-sm font-bold">
            {companyCount} / {limit}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-[var(--accent)]'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
