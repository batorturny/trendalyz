// ============================================
// SUBSCRIPTION PLANS CONFIGURATION
// ============================================

const PLANS = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    companyLimit: 1,
    prices: { eur: 0, huf: 0 },
    stripePriceIds: { eur: null, huf: null },
    gatedFeatures: [],
    features: [
      '1 cég kezelése',
      'Alap riportok',
    ],
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Starter',
    companyLimit: 5,
    prices: { eur: 55, huf: 22000 },
    stripePriceIds: {
      eur: process.env.STRIPE_PRICE_STARTER_EUR || null,
      huf: process.env.STRIPE_PRICE_STARTER_HUF || null,
    },
    gatedFeatures: [],
    features: [
      'Max 5 cég kezelése',
      'Összes platform riport',
      'PDF export',
      'Email riport küldés',
    ],
  },
  GROWTH: {
    tier: 'GROWTH',
    name: 'Growth',
    companyLimit: 10,
    popular: true,
    prices: { eur: 99, huf: 39000 },
    stripePriceIds: {
      eur: process.env.STRIPE_PRICE_GROWTH_EUR || null,
      huf: process.env.STRIPE_PRICE_GROWTH_HUF || null,
    },
    gatedFeatures: ['pdf_export', 'email_reports', 'monthly_email_reports'],
    features: [
      'Max 10 cég kezelése',
      'Összes platform riport',
      'PDF export',
      'Email riport küldés',
      'Kiemelt support',
    ],
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    companyLimit: 25,
    prices: { eur: 249, huf: 99000 },
    stripePriceIds: {
      eur: process.env.STRIPE_PRICE_PROFESSIONAL_EUR || null,
      huf: process.env.STRIPE_PRICE_PROFESSIONAL_HUF || null,
    },
    gatedFeatures: ['pdf_export', 'email_reports', 'monthly_email_reports', 'api_access'],
    features: [
      'Max 25 cég kezelése',
      'Összes platform riport',
      'PDF export',
      'Email riport küldés',
      'Kiemelt support',
      'API hozzáférés',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    companyLimit: 999,
    prices: { eur: null, huf: null },
    stripePriceIds: { eur: null, huf: null },
    gatedFeatures: ['pdf_export', 'email_reports', 'monthly_email_reports', 'api_access', 'custom_integration'],
    features: [
      'Korlátlan cég kezelése',
      'Összes platform riport',
      'PDF export',
      'Email riport küldés',
      'Dedikált support',
      'API hozzáférés',
      'Egyedi integráció',
    ],
  },
};

function getPlanByTier(tier) {
  return PLANS[tier] || PLANS.FREE;
}

function getPlanByPriceId(priceId) {
  if (!priceId) return null;
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceIds.eur === priceId || plan.stripePriceIds.huf === priceId) {
      return plan;
    }
  }
  return null;
}

// Tier ordering for comparison
const TIER_ORDER = ['FREE', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];

function canUseFeature(tier, feature) {
  const plan = PLANS[tier] || PLANS.FREE;
  return plan.gatedFeatures.includes(feature);
}

function minimumTierForFeature(feature) {
  for (const tierName of TIER_ORDER) {
    if (PLANS[tierName].gatedFeatures.includes(feature)) {
      return tierName;
    }
  }
  return null; // feature not gated to any tier
}

module.exports = { PLANS, getPlanByTier, getPlanByPriceId, canUseFeature, minimumTierForFeature, TIER_ORDER };
