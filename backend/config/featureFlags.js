// ============================================
// FEATURE FLAGS - Non-breaking feature toggles
// ============================================

module.exports = {
    // Enable new chart API endpoints
    ENABLE_CHART_API: process.env.ENABLE_CHART_API !== 'false',

    // Enable account management endpoints
    ENABLE_ACCOUNT_MANAGEMENT: process.env.ENABLE_ACCOUNT_MANAGEMENT !== 'false'
};
