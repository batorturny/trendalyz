'use client';

import { ReactNode } from 'react';
import { canUseFeature, minimumTierForFeature, tierLabel } from '@/lib/featureGate';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  feature: string;
  tier: string | undefined | null;
  children: ReactNode;
  /** Display mode: 'hide' removes entirely, 'lock' shows locked overlay (default) */
  mode?: 'hide' | 'lock';
}

export function FeatureGate({ feature, tier, children, mode = 'lock' }: FeatureGateProps) {
  const allowed = canUseFeature(tier, feature);

  if (allowed) return <>{children}</>;
  if (mode === 'hide') return null;

  const requiredTier = minimumTierForFeature(feature);
  const label = requiredTier ? tierLabel(requiredTier) : '';

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none blur-[1px]">
        {children}
      </div>
      <Link
        href="/admin/billing"
        className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface)]/60 backdrop-blur-sm rounded-xl cursor-pointer group"
      >
        <Lock className="w-5 h-5 text-[var(--text-secondary)] mb-1 group-hover:text-[var(--accent)] transition-colors" />
        <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">
          Elérhető a {label} csomagtól
        </span>
      </Link>
    </div>
  );
}
