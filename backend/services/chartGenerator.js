// ============================================
// CHART GENERATOR - Creates charts from Windsor data
// ============================================

const { chartCatalog } = require('../config/chartCatalog');

class ChartGenerator {
    constructor(windsorData) {
        // Handle both flat array and object format
        if (Array.isArray(windsorData)) {
            this.data = windsorData;
            this.daily = windsorData;
            this.activity = windsorData;
        } else {
            this.daily = windsorData.daily || [];
            this.video = windsorData.video || [];
            this.activity = windsorData.activity || [];
            this.data = [...this.daily, ...this.video];
        }
    }

    // Main entry - generate chart by key
    generate(chartKey, params = {}) {
        const chartDef = chartCatalog.find(c => c.key === chartKey);
        if (!chartDef) {
            throw new Error(`Unknown chart: ${chartKey}`);
        }

        const methodName = `generate_${chartKey}`;
        if (typeof this[methodName] !== 'function') {
            // Fallback to generic generator
            return this.generateGeneric(chartDef, params);
        }

        const chartData = this[methodName](params);

        return {
            key: chartKey,
            title: chartDef.title,
            description: chartDef.description,
            type: chartDef.type,
            color: chartDef.color,
            data: chartData,
            source: 'windsor',
            generatedAt: new Date().toISOString(),
            empty: this.isEmpty(chartData)
        };
    }

    // Check if chart data is empty
    isEmpty(data) {
        if (!data) return true;
        if (data.labels && data.labels.length === 0) return true;
        if (data.series && data.series.length === 0) return true;
        if (data.series?.[0]?.data?.every(v => v === 0)) return true;
        return false;
    }

    // Generic generator for simple field-to-chart mapping
    generateGeneric(chartDef, params) {
        return {
            labels: [],
            series: [{ name: chartDef.title, data: [] }]
        };
    }

    // ===== TREND CHARTS =====

    generate_followers_growth() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            return Math.max(...items.map(d => parseInt(d.followers_count) || 0));
        });

        return {
            labels,
            series: [{ name: 'Követők', data }]
        };
    }

    generate_profile_views() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            return this.sumField(items, 'profile_views');
        });

        return {
            labels,
            series: [{ name: 'Profil nézetek', data }]
        };
    }

    // ===== ENGAGEMENT CHARTS =====

    generate_daily_likes() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'likes'));

        return {
            labels,
            series: [{ name: 'Like-ok', data }]
        };
    }

    generate_daily_comments() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'comments'));

        return {
            labels,
            series: [{ name: 'Kommentek', data }]
        };
    }

    generate_daily_shares() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'shares'));

        return {
            labels,
            series: [{ name: 'Megosztások', data }]
        };
    }

    generate_engagement_rate() {
        const grouped = this.groupByDate(this.data, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const likes = this.sumField(items, 'video_likes') || this.sumField(items, 'likes');
            const comments = this.sumField(items, 'video_comments') || this.sumField(items, 'comments');
            const shares = this.sumField(items, 'video_shares') || this.sumField(items, 'shares');
            const views = this.sumField(items, 'video_views_count') || 1;

            const er = ((likes + comments + shares) / views) * 100;
            return parseFloat(er.toFixed(2));
        });

        return {
            labels,
            series: [{ name: 'ER %', data }]
        };
    }

    // ===== TIMING CHARTS =====

    generate_engagement_by_day() {
        const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
        const dayData = new Array(7).fill(0);
        const dayCounts = new Array(7).fill(0);

        this.activity.forEach(item => {
            const hour = parseInt(item.audience_activity_hour);
            const count = parseInt(item.audience_activity_count) || 0;
            // Map hour to day (simplified - using hour ranges)
            const dayIndex = hour % 7;
            dayData[dayIndex] += count;
            dayCounts[dayIndex]++;
        });

        const avgData = dayData.map((sum, i) =>
            dayCounts[i] > 0 ? Math.round(sum / dayCounts[i]) : 0
        );

        return {
            labels: dayNames,
            series: [{ name: 'Átl. aktivitás', data: avgData }]
        };
    }

    generate_engagement_by_hour() {
        const hourData = new Array(24).fill(0);

        this.activity.forEach(item => {
            const hour = parseInt(item.audience_activity_hour);
            const count = parseInt(item.audience_activity_count) || 0;
            if (hour >= 0 && hour < 24) {
                hourData[hour] += count;
            }
        });

        return {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            series: [{ name: 'Aktivitás', data: hourData }]
        };
    }

    // ===== UTILITY METHODS =====

    groupByDate(items, dateField) {
        const groups = {};
        if (!Array.isArray(items)) return groups;

        items.forEach(item => {
            const date = item[dateField];
            if (!date) return;
            const key = date.substring(0, 10); // YYYY-MM-DD
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }

    sumField(items, field) {
        if (!Array.isArray(items)) return 0;
        return items.reduce((sum, item) => sum + (parseInt(item[field]) || 0), 0);
    }
}

module.exports = ChartGenerator;
