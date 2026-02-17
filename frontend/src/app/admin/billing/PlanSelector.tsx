'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface Plan {
  tier: string;
  name: string;
  companyLimit: number;
  prices: { eur: number | null; huf: number | null };
  features: string[];
  popular: boolean;
}

const PLANS: Plan[] = [
  {
    tier: 'STARTER',
    name: 'Starter',
    companyLimit: 5,
    prices: { eur: 55, huf: 22000 },
    features: ['Max 5 cég kezelése', 'Összes platform riport', 'PDF export', 'Email riport küldés'],
    popular: false,
  },
  {
    tier: 'GROWTH',
    name: 'Growth',
    companyLimit: 10,
    prices: { eur: 99, huf: 39000 },
    features: ['Max 10 cég kezelése', 'Összes platform riport', 'PDF export', 'Email riport küldés', 'Kiemelt support'],
    popular: true,
  },
  {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    companyLimit: 25,
    prices: { eur: 249, huf: 99000 },
    features: ['Max 25 cég kezelése', 'Összes platform riport', 'PDF export', 'Email riport küldés', 'Kiemelt support', 'API hozzáférés'],
    popular: false,
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    companyLimit: 999,
    prices: { eur: null, huf: null },
    features: ['Korlátlan cég kezelése', 'Összes platform riport', 'PDF export', 'Email riport küldés', 'Dedikált support', 'API hozzáférés', 'Egyedi integráció'],
    popular: false,
  },
];

export function PlanSelector({
  currentTier,
  currentCurrency,
  hasSubscription,
}: {
  currentTier: string;
  currentCurrency: string;
  hasSubscription: boolean;
}) {
  const [currency, setCurrency] = useState<'eur' | 'huf'>(currentCurrency as 'eur' | 'huf');
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelectPlan(tier: string) {
    if (tier === 'ENTERPRISE') {
      window.location.href = 'mailto:turnybator@makeden.hu?subject=Enterprise%20csomag%20érdeklődés';
      return;
    }

    setLoading(tier);
    try {
      if (hasSubscription && currentTier !== 'FREE') {
        // Change plan (upgrade/downgrade)
        const res = await fetch('/api/billing/change-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, currency }),
        });
        const data = await res.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert(data.error || 'Hiba történt a csomag váltásakor');
        }
      } else {
        // New checkout
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier,
            currency,
            successUrl: `${window.location.origin}/admin/billing?success=true`,
            cancelUrl: `${window.location.origin}/admin/billing?canceled=true`,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert(data.error || 'Hiba történt');
        }
      }
    } catch (err) {
      console.error('Plan selection error:', err);
      alert('Hiba történt');
    } finally {
      setLoading(null);
    }
  }

  function formatPrice(price: number | null) {
    if (price === null) return null;
    if (currency === 'huf') {
      return `${price.toLocaleString('hu-HU')} Ft`;
    }
    return `${price}€`;
  }

  const tierOrder = ['FREE', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = tierOrder.indexOf(currentTier);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Csomagok</h2>

        {/* Currency toggle */}
        <div className="flex bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-0.5">
          <button
            onClick={() => setCurrency('eur')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${currency === 'eur'
                ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            EUR
          </button>
          <button
            onClick={() => setCurrency('huf')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${currency === 'huf'
                ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            HUF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const planIndex = tierOrder.indexOf(plan.tier);
          const isUpgrade = planIndex > currentIndex;
          const isDowngrade = planIndex < currentIndex;
          const price = formatPrice(plan.prices[currency]);

          return (
            <div
              key={plan.tier}
              className={`relative bg-[var(--surface)] border rounded-2xl p-5 flex flex-col shadow-[var(--shadow-card)] transition-all ${plan.popular
                  ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
                  : 'border-[var(--border)]'
                } ${isCurrent ? 'opacity-80' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[var(--accent)] text-white dark:text-[var(--surface)] text-xs font-bold rounded-full">
                  Népszerű
                </div>
              )}

              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Max {plan.companyLimit === 999 ? '50+' : plan.companyLimit} cég
              </p>

              <div className="mb-4">
                {price !== null ? (
                  <>
                    <span className="text-3xl font-bold">{price}</span>
                    <span className="text-sm text-[var(--text-secondary)]"> /hó</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-[var(--text-secondary)]">Egyedi árazás</span>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-[var(--text-secondary)]">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="px-4 py-2.5 text-sm font-semibold text-center text-[var(--text-secondary)] bg-[var(--surface-raised)] rounded-xl">
                  Jelenlegi csomag
                </div>
              ) : plan.tier === 'ENTERPRISE' ? (
                <button
                  onClick={() => handleSelectPlan(plan.tier)}
                  className="px-4 py-2.5 text-sm font-semibold bg-[var(--surface-raised)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] transition-all"
                >
                  Kapcsolatfelvétel
                </button>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan.tier)}
                  disabled={loading === plan.tier}
                  className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50 ${plan.popular
                      ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)] hover:brightness-110'
                      : 'bg-[var(--surface-raised)] text-[var(--text-primary)] hover:bg-[var(--border)]'
                    }`}
                >
                  {loading === plan.tier
                    ? 'Feldolgozás...'
                    : isUpgrade
                      ? 'Csomag váltás'
                      : isDowngrade
                        ? 'Visszalépés'
                        : 'Kiválasztás'
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
