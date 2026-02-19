// Feature gating utility for frontend tier checks

const TIER_ORDER = ['FREE', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'] as const;
export type PlanTier = (typeof TIER_ORDER)[number];

const FEATURE_MAP: Record<string, PlanTier> = {
  pdf_export: 'GROWTH',
  email_reports: 'GROWTH',
  monthly_email_reports: 'GROWTH',
  api_access: 'PROFESSIONAL',
  custom_integration: 'ENTERPRISE',
};

export function canUseFeature(tier: string | undefined | null, feature: string): boolean {
  const currentTier = (tier || 'FREE') as PlanTier;
  const requiredTier = FEATURE_MAP[feature];
  if (!requiredTier) return true; // unknown feature = not gated

  const currentIdx = TIER_ORDER.indexOf(currentTier);
  const requiredIdx = TIER_ORDER.indexOf(requiredTier);
  return currentIdx >= requiredIdx;
}

export function minimumTierForFeature(feature: string): PlanTier | null {
  return FEATURE_MAP[feature] || null;
}

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  GROWTH: 'Growth',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

export function tierLabel(tier: string): string {
  return TIER_LABELS[tier] || tier;
}
