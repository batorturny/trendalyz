// ============================================
// FEATURE FLAGS - Non-breaking feature toggles
// ============================================

module.exports = {
    // Enable new chart API endpoints
    ENABLE_CHART_API: process.env.ENABLE_CHART_API !== 'false',

    // Enable account management endpoints
    ENABLE_ACCOUNT_MANAGEMENT: process.env.ENABLE_ACCOUNT_MANAGEMENT !== 'false',

    // Enable multi-platform integration (Facebook, Instagram alongside TikTok)
    ENABLE_MULTI_PLATFORM: process.env.ENABLE_MULTI_PLATFORM !== 'false',

    // Enable Stripe billing / subscription management
    ENABLE_BILLING: process.env.ENABLE_BILLING === 'true',
};
