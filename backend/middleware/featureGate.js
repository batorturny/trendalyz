// ============================================
// FEATURE GATE MIDDLEWARE
// Restricts endpoints based on subscription tier
// ============================================

const prisma = require('../lib/prisma');
const { canUseFeature, minimumTierForFeature, getPlanByTier } = require('../config/plans');

function requireFeature(feature) {
  return async (req, res, next) => {
    try {
      const userId = req.userContext?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Nincs bejelentkezve' });
      }

      const sub = await prisma.subscription.findUnique({
        where: { userId },
        select: { tier: true, status: true },
      });

      const tier = sub?.tier || 'FREE';
      const status = sub?.status || 'ACTIVE';

      // Only active/trialing subscriptions can use gated features
      if (!['ACTIVE', 'TRIALING'].includes(status)) {
        return res.status(403).json({
          error: 'Az előfizetésed lejárt vagy inaktív',
          code: 'SUBSCRIPTION_INACTIVE',
        });
      }

      if (!canUseFeature(tier, feature)) {
        const requiredTier = minimumTierForFeature(feature);
        const requiredPlan = getPlanByTier(requiredTier);
        return res.status(403).json({
          error: `Ez a funkció csak a ${requiredPlan?.name || requiredTier} csomagtól érhető el`,
          code: 'FEATURE_GATED',
          requiredTier,
          currentTier: tier,
        });
      }

      next();
    } catch (error) {
      console.error('[FeatureGate] Error:', error);
      res.status(500).json({ error: 'Hiba a jogosultság ellenőrzésnél' });
    }
  };
}

module.exports = { requireFeature };
