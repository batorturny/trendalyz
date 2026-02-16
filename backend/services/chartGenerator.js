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

    // ===== TIKTOK ORGANIC (NEW) =====

    generate_tt_bio_link_clicks() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'bio_link_clicks'));

        return {
            labels,
            series: [{ name: 'Bio link kattintások', data }]
        };
    }

    generate_tt_video_watch_time() {
        const videos = this.video.filter(v => v.video_average_time_watched);
        const labels = videos.map(v => (v.video_caption || '').substring(0, 30) || v.video_id || '-');
        const data = videos.map(v => parseFloat(v.video_average_time_watched) || 0);

        return {
            labels,
            series: [{ name: 'Átl. nézési idő (mp)', data }]
        };
    }

    generate_tt_video_retention() {
        const grouped = this.groupByDate(this.data, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date].filter(i => i.video_full_watched_rate);
            if (items.length === 0) return 0;
            const avg = items.reduce((s, i) => s + (parseFloat(i.video_full_watched_rate) || 0), 0) / items.length;
            return parseFloat(avg.toFixed(2));
        });

        return {
            labels,
            series: [{ name: 'Végignézési arány %', data }]
        };
    }

    generate_tt_traffic_sources() {
        const sourceMap = {};
        this.data.forEach(item => {
            const source = item.video_impression_sources_impression_source;
            if (!source) return;
            const pct = parseFloat(item.video_impression_sources_percentage) || 0;
            if (!sourceMap[source]) sourceMap[source] = 0;
            sourceMap[source] += pct;
        });

        const sorted = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);
        return {
            labels: sorted.map(([source]) => source),
            series: [{ name: 'Arány %', data: sorted.map(([, pct]) => parseFloat(pct.toFixed(2))) }]
        };
    }

    generate_tt_audience_demographics() {
        const ageMap = {};
        this.data.forEach(item => {
            const age = item.audience_ages_age;
            if (!age) return;
            const pct = parseFloat(item.audience_ages_percentage) || 0;
            if (!ageMap[age]) ageMap[age] = 0;
            ageMap[age] += pct;
        });

        const sorted = Object.entries(ageMap).sort((a, b) => a[0].localeCompare(b[0]));
        return {
            labels: sorted.map(([age]) => age),
            series: [{ name: 'Arány %', data: sorted.map(([, pct]) => parseFloat(pct.toFixed(2))) }]
        };
    }

    // ===== TIKTOK ADS =====

    generate_ttads_spend_trend() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            return grouped[date].reduce((s, i) => s + (parseFloat(i.spend) || 0), 0);
        });

        return {
            labels,
            series: [{ name: 'Költés', data: data.map(v => parseFloat(v.toFixed(2))) }]
        };
    }

    generate_ttads_impressions_clicks() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const impressions = labels.map(date => this.sumField(grouped[date], 'impressions'));
        const clicks = labels.map(date => this.sumField(grouped[date], 'clicks'));

        return {
            labels,
            series: [
                { name: 'Impressziók', data: impressions },
                { name: 'Kattintások', data: clicks }
            ]
        };
    }

    generate_ttads_ctr_trend() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const avgCtr = items.reduce((s, i) => s + (parseFloat(i.ctr) || 0), 0) / (items.length || 1);
            return parseFloat(avgCtr.toFixed(2));
        });

        return {
            labels,
            series: [{ name: 'CTR %', data }]
        };
    }

    generate_ttads_cpc_cpm() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const cpc = labels.map(date => {
            const items = grouped[date];
            const avg = items.reduce((s, i) => s + (parseFloat(i.cpc) || 0), 0) / (items.length || 1);
            return parseFloat(avg.toFixed(2));
        });
        const cpm = labels.map(date => {
            const items = grouped[date];
            const avg = items.reduce((s, i) => s + (parseFloat(i.cpm) || 0), 0) / (items.length || 1);
            return parseFloat(avg.toFixed(2));
        });

        return {
            labels,
            series: [
                { name: 'CPC', data: cpc },
                { name: 'CPM', data: cpm }
            ]
        };
    }

    generate_ttads_conversions() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'conversions'));

        return {
            labels,
            series: [{ name: 'Konverziók', data }]
        };
    }

    generate_ttads_cost_per_conversion() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const avg = items.reduce((s, i) => s + (parseFloat(i.cost_per_conversion) || 0), 0) / (items.length || 1);
            return parseFloat(avg.toFixed(2));
        });

        return {
            labels,
            series: [{ name: 'Költség/konverzió', data }]
        };
    }

    generate_ttads_campaign_perf() {
        const campaignMap = {};
        this.data.forEach(item => {
            const name = item.campaign_name;
            if (!name) return;
            if (!campaignMap[name]) {
                campaignMap[name] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
            }
            campaignMap[name].impressions += parseInt(item.impressions) || 0;
            campaignMap[name].clicks += parseInt(item.clicks) || 0;
            campaignMap[name].spend += parseFloat(item.spend) || 0;
            campaignMap[name].conversions += parseInt(item.conversions) || 0;
        });

        const tableData = Object.entries(campaignMap).map(([name, stats]) => ({
            campaign: name,
            impressions: stats.impressions,
            clicks: stats.clicks,
            spend: parseFloat(stats.spend.toFixed(2)),
            cpc: stats.clicks > 0 ? parseFloat((stats.spend / stats.clicks).toFixed(2)) : 0,
            ctr: stats.impressions > 0 ? parseFloat(((stats.clicks / stats.impressions) * 100).toFixed(2)) : 0,
            conversions: stats.conversions,
        }));

        return {
            labels: ['Kampány', 'Impressziók', 'Kattintások', 'Költés', 'CPC', 'CTR%', 'Konverziók'],
            series: [{ name: 'Campaigns', data: tableData }]
        };
    }

    generate_ttads_video_engagement() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const plays = labels.map(date => this.sumField(grouped[date], 'video_play_actions'));
        const watched2s = labels.map(date => this.sumField(grouped[date], 'video_watched_2s'));
        const watched6s = labels.map(date => this.sumField(grouped[date], 'video_watched_6s'));

        return {
            labels,
            series: [
                { name: 'Lejátszások', data: plays },
                { name: '2s nézés', data: watched2s },
                { name: '6s nézés', data: watched6s }
            ]
        };
    }

    // ===== FACEBOOK (NEW) =====

    generate_fb_video_views() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'page_video_views'));

        return {
            labels,
            series: [{ name: 'Videó megtekintések', data }]
        };
    }

    generate_fb_follows_trend() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const follows = labels.map(date => this.sumField(grouped[date], 'page_daily_follows'));
        const unfollows = labels.map(date => this.sumField(grouped[date], 'page_daily_unfollows'));

        return {
            labels,
            series: [
                { name: 'Új követők', data: follows },
                { name: 'Követéstörlés', data: unfollows }
            ]
        };
    }

    generate_fb_reaction_breakdown() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const like = labels.map(date => this.sumField(grouped[date], 'post_reactions_like_total'));
        const love = labels.map(date => this.sumField(grouped[date], 'post_reactions_love_total'));
        const wow = labels.map(date => this.sumField(grouped[date], 'post_reactions_wow_total'));
        const haha = labels.map(date => this.sumField(grouped[date], 'post_reactions_haha_total'));

        return {
            labels,
            series: [
                { name: 'Like', data: like },
                { name: 'Love', data: love },
                { name: 'Wow', data: wow },
                { name: 'Haha', data: haha }
            ]
        };
    }

    generate_fb_page_video_time() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'page_video_view_time'));

        return {
            labels,
            series: [{ name: 'Nézési idő', data }]
        };
    }

    generate_fb_reel_performance() {
        const posts = this.video.filter(p => parseInt(p.post_video_views) > 0);
        const sorted = [...posts].sort((a, b) => (parseInt(b.post_video_views) || 0) - (parseInt(a.post_video_views) || 0));

        const tableData = sorted.map(p => ({
            id: p.post_id,
            caption: p.post_message || '-',
            date: p.post_created_time ? p.post_created_time.substring(0, 10) : '-',
            videoViews: parseInt(p.post_video_views) || 0,
            reactions: parseInt(p.post_reactions) || 0,
            comments: parseInt(p.post_comments) || 0,
            shares: parseInt(p.post_shares) || 0,
            link: p.post_permalink || '#'
        }));

        return {
            labels: ['Dátum', 'Üzenet', 'Videó nézések', 'Reakciók', 'Kommentek', 'Megosztások', 'Link'],
            series: [{ name: 'Reels', data: tableData }]
        };
    }

    // ===== INSTAGRAM BUSINESS (NEW) =====

    generate_ig_media_type_breakdown() {
        // Group media by type from content data
        const typeMap = {};
        this.video.forEach(m => {
            const type = m.media_type || 'OTHER';
            if (!typeMap[type]) typeMap[type] = { count: 0, likes: 0, comments: 0 };
            typeMap[type].count++;
            typeMap[type].likes += parseInt(m.likes) || 0;
            typeMap[type].comments += parseInt(m.comments) || 0;
        });

        const labels = Object.keys(typeMap);
        return {
            labels,
            series: [
                { name: 'Tartalmak', data: labels.map(t => typeMap[t].count) },
                { name: 'Like-ok', data: labels.map(t => typeMap[t].likes) },
                { name: 'Kommentek', data: labels.map(t => typeMap[t].comments) }
            ]
        };
    }

    generate_ig_reel_performance() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const views = labels.map(date => this.sumField(grouped[date], 'media_reel_video_views'));
        const watchTime = labels.map(date => {
            const items = grouped[date];
            const avg = items.reduce((s, i) => s + (parseFloat(i.media_reel_avg_watch_time) || 0), 0) / (items.length || 1);
            return parseFloat(avg.toFixed(2));
        });

        return {
            labels,
            series: [
                { name: 'Reel nézések', data: views },
                { name: 'Átl. nézési idő', data: watchTime }
            ]
        };
    }

    generate_ig_story_overview() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const reach = labels.map(date => this.sumField(grouped[date], 'story_reach'));
        const views = labels.map(date => this.sumField(grouped[date], 'story_views'));
        const exits = labels.map(date => this.sumField(grouped[date], 'story_exits'));

        return {
            labels,
            series: [
                { name: 'Elérés', data: reach },
                { name: 'Megtekintések', data: views },
                { name: 'Kilépések', data: exits }
            ]
        };
    }

    generate_ig_save_rate() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const saved = this.sumField(items, 'media_saved');
            const reach = this.sumField(items, 'media_reach') || 1;
            return parseFloat(((saved / reach) * 100).toFixed(2));
        });

        return {
            labels,
            series: [{ name: 'Mentési arány %', data }]
        };
    }

    generate_ig_daily_followers() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'follower_count_1d'));

        return {
            labels,
            series: [{ name: 'Napi új követők', data }]
        };
    }

    // ===== INSTAGRAM PUBLIC =====

    generate_igpub_engagement_overview() {
        const grouped = this.groupByDate(this.data, 'date');
        const labels = Object.keys(grouped).sort();
        const likes = labels.map(date => this.sumField(grouped[date], 'media_like_count'));
        const comments = labels.map(date => this.sumField(grouped[date], 'media_comments_count'));

        return {
            labels,
            series: [
                { name: 'Like-ok', data: likes },
                { name: 'Kommentek', data: comments }
            ]
        };
    }

    generate_igpub_avg_engagement() {
        const grouped = this.groupByDate(this.data, 'date');
        const labels = Object.keys(grouped).sort();
        const likesPerPost = labels.map(date => {
            const items = grouped[date];
            const avg = items.reduce((s, i) => s + (parseFloat(i.likes_per_post) || 0), 0) / (items.length || 1);
            return parseFloat(avg.toFixed(2));
        });
        const commentsPerPost = labels.map(date => {
            const items = grouped[date];
            const avg = items.reduce((s, i) => s + (parseFloat(i.comments_per_post) || 0), 0) / (items.length || 1);
            return parseFloat(avg.toFixed(2));
        });

        return {
            labels,
            series: [
                { name: 'Átl. like/poszt', data: likesPerPost },
                { name: 'Átl. komment/poszt', data: commentsPerPost }
            ]
        };
    }

    generate_igpub_all_media() {
        return this.generateIGPublicMediaTable(this.video);
    }

    generate_igpub_top_3_media() {
        const sorted = [...this.video].sort((a, b) =>
            (parseInt(b.media_like_count) || 0) - (parseInt(a.media_like_count) || 0)
        );
        return this.generateIGPublicMediaTable(sorted.slice(0, 3));
    }

    generateIGPublicMediaTable(media) {
        const tableData = media.map(m => ({
            id: m.media_id,
            caption: m.media_caption || '-',
            date: m.media_timestamp ? m.media_timestamp.substring(0, 10) : '-',
            likes: parseInt(m.media_like_count) || 0,
            comments: parseInt(m.media_comments_count) || 0,
            type: m.media_type || '-',
            link: m.media_permalink || '#'
        }));

        return {
            labels: ['Dátum', 'Caption', 'Like-ok', 'Kommentek', 'Típus', 'Link'],
            series: [{ name: 'Media', data: tableData }]
        };
    }

    // ===== YOUTUBE (NEW) =====

    generate_yt_avg_view_pct() {
        const videos = this.video.filter(v => v.average_view_percentage);
        const labels = videos.map(v => (v.video_title || '').substring(0, 30) || v.video_id || '-');
        const data = videos.map(v => parseFloat(v.average_view_percentage) || 0);

        return {
            labels,
            series: [{ name: 'Nézési %', data: data.map(v => parseFloat(v.toFixed(2))) }]
        };
    }

    generate_yt_playlist_adds() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'videos_added_to_playlists'));

        return {
            labels,
            series: [{ name: 'Playlisthez adva', data }]
        };
    }

    generate_yt_premium_views() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'red_views'));

        return {
            labels,
            series: [{ name: 'Premium nézések', data }]
        };
    }

    generate_yt_likes_dislikes() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const likes = labels.map(date => this.sumField(grouped[date], 'likes'));
        const dislikes = labels.map(date => this.sumField(grouped[date], 'dislikes'));

        return {
            labels,
            series: [
                { name: 'Like-ok', data: likes },
                { name: 'Dislike-ok', data: dislikes }
            ]
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
