// ============================================
// CHART CATALOG - Available charts with metadata
// ============================================

const CHART_CATEGORIES = {
    TREND: 'trend',
    ENGAGEMENT: 'engagement',
    TIMING: 'timing'
};

// Core charts - only line/bar that are proven to work
const chartCatalog = [
    // TREND CHARTS
    {
        key: 'followers_growth',
        title: 'Követők növekedése',
        description: 'Napi követőszám trend',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#00ff95',
        windsorFields: ['followers_count', 'date']
    },
    {
        key: 'profile_views',
        title: 'Profil megtekintések',
        description: 'Profil látogatások trendje',
        category: CHART_CATEGORIES.TREND,
        type: 'line',
        color: '#4d96ff',
        windsorFields: ['profile_views', 'date']
    },

    // ENGAGEMENT CHARTS
    {
        key: 'daily_likes',
        title: 'Napi like-ok',
        description: 'Naponta kapott like-ok száma',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#bc6aff',
        windsorFields: ['likes', 'date']
    },
    {
        key: 'daily_comments',
        title: 'Kommentek',
        description: 'Naponta kapott kommentek',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#ffce44',
        windsorFields: ['comments', 'date']
    },
    {
        key: 'daily_shares',
        title: 'Megosztások',
        description: 'Naponta kapott megosztások',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'bar',
        color: '#4d96ff',
        windsorFields: ['shares', 'date']
    },
    {
        key: 'engagement_rate',
        title: 'Engagement rate trend',
        description: '(Likes + Comments + Shares) / Views %',
        category: CHART_CATEGORIES.ENGAGEMENT,
        type: 'line',
        color: '#ff6b9d',
        windsorFields: ['video_likes', 'video_comments', 'video_shares', 'video_views_count', 'date'],
        calculated: true
    },

    // TIMING CHARTS
    {
        key: 'engagement_by_day',
        title: 'Engagement napok szerint',
        description: 'Melyik napon a legjobb a teljesítmény',
        category: CHART_CATEGORIES.TIMING,
        type: 'bar',
        color: '#00d4aa',
        windsorFields: ['audience_activity_count', 'audience_activity_hour']
    },
    {
        key: 'engagement_by_hour',
        title: 'Engagement órák szerint',
        description: 'Aktivitás napszak szerint (0-23)',
        category: CHART_CATEGORIES.TIMING,
        type: 'bar',
        color: '#9d4edd',
        windsorFields: ['audience_activity_count', 'audience_activity_hour']
    }
];

// Get all required Windsor fields for a set of charts
function getRequiredFields(chartKeys) {
    const fieldsSet = new Set();
    chartKeys.forEach(key => {
        const chart = chartCatalog.find(c => c.key === key);
        if (chart) {
            chart.windsorFields.forEach(f => fieldsSet.add(f));
        }
    });
    return Array.from(fieldsSet);
}

// Validate chart keys
function validateChartKeys(keys) {
    const validKeys = chartCatalog.map(c => c.key);
    const invalid = keys.filter(k => !validKeys.includes(k));
    return {
        valid: invalid.length === 0,
        invalidKeys: invalid
    };
}

// Get catalog grouped by category
function getCatalogByCategory() {
    const grouped = {};
    chartCatalog.forEach(chart => {
        if (!grouped[chart.category]) {
            grouped[chart.category] = [];
        }
        grouped[chart.category].push(chart);
    });
    return grouped;
}

module.exports = {
    chartCatalog,
    CHART_CATEGORIES,
    getRequiredFields,
    validateChartKeys,
    getCatalogByCategory
};
