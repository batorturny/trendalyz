'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface SubscriptionOverlayProps {
  companyCount: number;
  companyLimit: number;
  tier: string;
  isOverLimit: boolean;
  hasInactiveSubscription: boolean;
}

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  GROWTH: 'Growth',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

export function SubscriptionOverlay({
  companyCount,
  companyLimit,
  tier,
  isOverLimit,
  hasInactiveSubscription,
}: SubscriptionOverlayProps) {
  const title = hasInactiveSubscription
    ? 'Az előfizetésed lejárt vagy inaktív!'
    : `Túl sok cég van hozzáadva! (${companyCount}/${companyLimit})`;

  const description = hasInactiveSubscription
    ? 'Az előfizetésed nem aktív. A cégek kezeléséhez újítsd meg az előfizetésed.'
    : `A jelenlegi ${TIER_LABELS[tier] || tier} csomagod maximum ${companyLimit} cég kezelését teszi lehetővé. Jelenleg ${companyCount} cég van hozzáadva.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md mx-4 shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          {title}
        </h2>

        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {description}
        </p>

        <div className="space-y-3">
          <Link
            href="/admin/billing"
            className="block w-full px-6 py-3 bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold rounded-xl hover:brightness-110 transition-all text-center"
          >
            Előfizetés váltása
          </Link>

          {isOverLimit && (
            <p className="text-xs text-[var(--text-secondary)]">
              Vagy törölj ki cégeket amíg {companyLimit} alá nem csökken a számuk.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
