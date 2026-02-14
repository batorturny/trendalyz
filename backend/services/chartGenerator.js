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
            this.video = windsorData; // Added missing assignment
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

    // ===== VIDEO CHARTS =====

    generate_all_videos() {
        return this.generateVideoTable(this.video);
    }

    generate_top_3_videos() {
        const sorted = [...this.video].sort((a, b) =>
            (parseInt(b.video_views_count) || 0) - (parseInt(a.video_views_count) || 0)
        );
        return this.generateVideoTable(sorted.slice(0, 3));
    }

    generate_worst_3_videos() {
        const sorted = [...this.video]
            .filter(v => parseInt(v.video_views_count) > 0)
            .sort((a, b) => (parseInt(a.video_views_count) || 0) - (parseInt(b.video_views_count) || 0));
        return this.generateVideoTable(sorted.slice(0, 3));
    }

    generateVideoTable(videos) {
        // Prepare data for Table component (array of objects)
        // Format: { id, caption, date, views, likes, comments, shares, link }
        const tableData = videos.map(v => ({
            id: v.video_id,
            caption: v.video_caption || '-',
            date: v.video_create_datetime ? v.video_create_datetime.substring(0, 10) : '-',
            views: parseInt(v.video_views_count) || 0,
            likes: parseInt(v.video_likes) || 0,
            comments: parseInt(v.video_comments) || 0,
            shares: parseInt(v.video_shares) || 0,
            link: v.video_embed_url || '#'
        }));

        // For "table" type charts, we return the array directly as "series" data?
        // Or standardized format: labels (headers), series (rows)
        return {
            labels: ['Dátum', 'Caption', 'Views', 'Likes', 'Comments', 'Shares', 'Link'],
            series: [{ name: 'Videos', data: tableData }]
        };
    }

    // ===== FACEBOOK CHARTS =====

    generate_fb_page_reach() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const reach = labels.map(date => this.sumField(grouped[date], 'reach'));
        const impressions = labels.map(date => this.sumField(grouped[date], 'impressions'));

        return {
            labels,
            series: [
                { name: 'Elérés', data: reach },
                { name: 'Impressziók', data: impressions }
            ]
        };
    }

    generate_fb_page_fans() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            return Math.max(...items.map(d => parseInt(d.page_fans) || 0));
        });

        return {
            labels,
            series: [{ name: 'Követők', data }]
        };
    }

    generate_fb_engagement() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const reactions = labels.map(date => this.sumField(grouped[date], 'reactions'));
        const comments = labels.map(date => this.sumField(grouped[date], 'comments'));
        const shares = labels.map(date => this.sumField(grouped[date], 'shares'));

        return {
            labels,
            series: [
                { name: 'Reakciók', data: reactions },
                { name: 'Kommentek', data: comments },
                { name: 'Megosztások', data: shares }
            ]
        };
    }

    generate_fb_post_engagement() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const reactions = labels.map(date => this.sumField(grouped[date], 'post_reactions'));
        const comments = labels.map(date => this.sumField(grouped[date], 'post_comments'));
        const shares = labels.map(date => this.sumField(grouped[date], 'post_shares'));
        const clicks = labels.map(date => this.sumField(grouped[date], 'post_clicks'));

        return {
            labels,
            series: [
                { name: 'Reakciók', data: reactions },
                { name: 'Kommentek', data: comments },
                { name: 'Megosztások', data: shares },
                { name: 'Kattintások', data: clicks }
            ]
        };
    }

    generate_fb_all_posts() {
        return this.generateFacebookPostTable(this.video);
    }

    generate_fb_top_3_posts() {
        const sorted = [...this.video].sort((a, b) =>
            (parseInt(b.post_reach) || 0) - (parseInt(a.post_reach) || 0)
        );
        return this.generateFacebookPostTable(sorted.slice(0, 3));
    }

    generateFacebookPostTable(posts) {
        const tableData = posts.map(p => ({
            id: p.post_id,
            caption: p.post_message || '-',
            date: p.post_created_time ? p.post_created_time.substring(0, 10) : '-',
            impressions: parseInt(p.post_impressions) || 0,
            reach: parseInt(p.post_reach) || 0,
            reactions: parseInt(p.post_reactions) || 0,
            comments: parseInt(p.post_comments) || 0,
            shares: parseInt(p.post_shares) || 0,
            clicks: parseInt(p.post_clicks) || 0,
            link: p.post_permalink || '#'
        }));

        return {
            labels: ['Dátum', 'Üzenet', 'Impressziók', 'Elérés', 'Reakciók', 'Kommentek', 'Megosztások', 'Kattintások', 'Link'],
            series: [{ name: 'Posts', data: tableData }]
        };
    }

    // ===== INSTAGRAM CHARTS =====

    generate_ig_reach() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const reach = labels.map(date => this.sumField(grouped[date], 'reach'));
        const impressions = labels.map(date => this.sumField(grouped[date], 'impressions'));

        return {
            labels,
            series: [
                { name: 'Elérés', data: reach },
                { name: 'Impressziók', data: impressions }
            ]
        };
    }

    generate_ig_follower_growth() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            return Math.max(...items.map(d => parseInt(d.follower_count) || 0));
        });

        return {
            labels,
            series: [{ name: 'Követők', data }]
        };
    }

    generate_ig_engagement() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const likes = labels.map(date => this.sumField(grouped[date], 'likes'));
        const comments = labels.map(date => this.sumField(grouped[date], 'comments'));
        const shares = labels.map(date => this.sumField(grouped[date], 'shares'));
        const saved = labels.map(date => this.sumField(grouped[date], 'saved'));

        return {
            labels,
            series: [
                { name: 'Like-ok', data: likes },
                { name: 'Kommentek', data: comments },
                { name: 'Megosztások', data: shares },
                { name: 'Mentések', data: saved }
            ]
        };
    }

    generate_ig_profile_activity() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const profileViews = labels.map(date => this.sumField(grouped[date], 'profile_views'));
        const websiteClicks = labels.map(date => this.sumField(grouped[date], 'website_clicks'));

        return {
            labels,
            series: [
                { name: 'Profilnézetek', data: profileViews },
                { name: 'Weboldal kattintások', data: websiteClicks }
            ]
        };
    }

    generate_ig_all_media() {
        return this.generateInstagramMediaTable(this.video);
    }

    generate_ig_top_3_media() {
        const sorted = [...this.video].sort((a, b) =>
            (parseInt(b.reach) || 0) - (parseInt(a.reach) || 0)
        );
        return this.generateInstagramMediaTable(sorted.slice(0, 3));
    }

    generateInstagramMediaTable(media) {
        const tableData = media.map(m => ({
            id: m.media_id,
            caption: m.caption || '-',
            date: m.timestamp ? m.timestamp.substring(0, 10) : '-',
            impressions: parseInt(m.impressions) || 0,
            reach: parseInt(m.reach) || 0,
            likes: parseInt(m.likes) || 0,
            comments: parseInt(m.comments) || 0,
            shares: parseInt(m.shares) || 0,
            saved: parseInt(m.saved) || 0,
            link: m.permalink || '#'
        }));

        return {
            labels: ['Dátum', 'Caption', 'Impressziók', 'Elérés', 'Like-ok', 'Kommentek', 'Megosztások', 'Mentések', 'Link'],
            series: [{ name: 'Media', data: tableData }]
        };
    }

    // ===== YOUTUBE TREND CHARTS =====

    generate_yt_subscribers_growth() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const gained = this.sumField(items, 'subscribers_gained');
            const lost = this.sumField(items, 'subscribers_lost');
            return gained - lost;
        });

        return {
            labels,
            series: [{ name: 'Nettó feliratkozók', data }]
        };
    }

    generate_yt_views_trend() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'views'));

        return {
            labels,
            series: [{ name: 'Megtekintések', data }]
        };
    }

    generate_yt_watch_time() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'estimated_minutes_watched'));

        return {
            labels,
            series: [{ name: 'Nézési idő (perc)', data }]
        };
    }

    // ===== YOUTUBE ENGAGEMENT CHARTS =====

    generate_yt_daily_engagement() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const likes = labels.map(date => this.sumField(grouped[date], 'likes'));
        const comments = labels.map(date => this.sumField(grouped[date], 'comments'));
        const shares = labels.map(date => this.sumField(grouped[date], 'shares'));

        return {
            labels,
            series: [
                { name: 'Like-ok', data: likes },
                { name: 'Kommentek', data: comments },
                { name: 'Megosztások', data: shares }
            ]
        };
    }

    generate_yt_engagement_rate() {
        const grouped = this.groupByDate(this.data, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const likes = this.sumField(items, 'likes');
            const comments = this.sumField(items, 'comments');
            const views = this.sumField(items, 'views') || 1;
            const er = ((likes + comments) / views) * 100;
            return parseFloat(er.toFixed(2));
        });

        return {
            labels,
            series: [{ name: 'ER %', data }]
        };
    }

    // ===== YOUTUBE VIDEO CHARTS =====

    generate_yt_top_5_videos() {
        const sorted = [...this.video].sort((a, b) =>
            (parseInt(b.views) || 0) - (parseInt(a.views) || 0)
        );
        return this.generateYouTubeVideoTable(sorted.slice(0, 5));
    }

    generate_yt_worst_5_videos() {
        const sorted = [...this.video]
            .filter(v => parseInt(v.views) > 0)
            .sort((a, b) => (parseInt(a.views) || 0) - (parseInt(b.views) || 0));
        return this.generateYouTubeVideoTable(sorted.slice(0, 5));
    }

    generate_yt_all_videos() {
        return this.generateYouTubeVideoTable(this.video);
    }

    generateYouTubeVideoTable(videos) {
        const tableData = videos.map(v => ({
            id: v.video_id,
            title: v.video_title || '-',
            date: v.video_published_at ? v.video_published_at.substring(0, 10) : '-',
            views: parseInt(v.views) || 0,
            likes: parseInt(v.likes) || 0,
            comments: parseInt(v.comments) || 0,
            shares: parseInt(v.shares) || 0,
            avgViewDuration: parseInt(v.average_view_duration) || 0,
            link: v.video_id ? `https://youtube.com/watch?v=${v.video_id}` : '#'
        }));

        return {
            labels: ['Dátum', 'Cím', 'Views', 'Likes', 'Comments', 'Shares', 'Átl. nézési idő', 'Link'],
            series: [{ name: 'Videos', data: tableData }]
        };
    }

    // ===== YOUTUBE AUDIENCE CHARTS =====

    generate_yt_top_countries() {
        const countryMap = {};
        this.data.forEach(item => {
            const country = item.country;
            if (!country) return;
            const pct = parseFloat(item.viewer_percentage) || 0;
            if (!countryMap[country]) countryMap[country] = 0;
            countryMap[country] += pct;
        });

        const sorted = Object.entries(countryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            labels: sorted.map(([country]) => country),
            series: [{ name: 'Nézők %', data: sorted.map(([, pct]) => parseFloat(pct.toFixed(2))) }]
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
