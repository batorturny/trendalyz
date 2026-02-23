// @ts-nocheck
// ============================================
// CHART GENERATOR - Creates charts from Windsor data
// ============================================

import { chartCatalog } from './chartCatalog';

export default class ChartGenerator {
    constructor(windsorData, startDate = null, endDate = null) {
        this.startDate = startDate;
        this.endDate = endDate;

        if (Array.isArray(windsorData)) {
            // Separate daily aggregate rows from per-content rows to avoid double-counting
            const daily = [];
            const video = [];
            for (const row of windsorData) {
                if (row.video_id || row.post_id || row.media_id) {
                    video.push(row);
                } else {
                    daily.push(row);
                }
            }
            this.daily = daily;
            this.video = video;
            this.activity = windsorData;
            this.data = windsorData;
        } else {
            this.daily = windsorData.daily || [];
            this.video = windsorData.video || [];
            this.activity = windsorData.activity || [];
            this.data = [...this.daily, ...this.video];
        }
    }

    generate(chartKey, params = {}) {
        const chartDef = chartCatalog.find(c => c.key === chartKey);
        if (!chartDef) throw new Error(`Unknown chart: ${chartKey}`);

        const methodName = `generate_${chartKey}`;
        if (typeof this[methodName] !== 'function') {
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

    isEmpty(data) {
        if (!data) return true;
        if (data.labels && data.labels.length === 0) return true;
        if (data.series && data.series.length === 0) return true;
        if (data.series?.[0]?.data?.every(v => v === 0)) return true;
        return false;
    }

    generateGeneric(chartDef) {
        return { labels: [], series: [{ name: chartDef.title, data: [] }] };
    }

    // ===== HELPER GENERATORS =====

    /** Single daily sum metric line chart */
    dailyMetric(source, field, name) {
        const grouped = this.groupByDate(source, 'date');
        const labels = Object.keys(grouped).sort();
        return { labels, series: [{ name, data: labels.map(d => this.sumField(grouped[d], field)) }] };
    }

    /** Daily max value (for cumulative metrics like followers) */
    dailyMax(source, field, name) {
        const grouped = this.groupByDate(source, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(d => Math.max(...grouped[d].map(i => parseInt(i[field]) || 0)));
        return { labels, series: [{ name, data }] };
    }

    /** Multiple daily sum metrics multi-series chart */
    dailyMultiMetric(source, fields) {
        const grouped = this.groupByDate(source, 'date');
        const labels = Object.keys(grouped).sort();
        return {
            labels,
            series: fields.map(([field, name]) => ({
                name, data: labels.map(d => this.sumField(grouped[d], field))
            }))
        };
    }

    /** Daily average of a float field */
    dailyAvg(source, field, name) {
        const grouped = this.groupByDate(source, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(d => {
            const items = grouped[d];
            const avg = items.reduce((s, i) => s + (parseFloat(i[field]) || 0), 0) / (items.length || 1);
            return parseFloat(avg.toFixed(2));
        });
        return { labels, series: [{ name, data }] };
    }

    /** Daily float sum (for spend-like metrics) */
    dailyFloatSum(source, field, name) {
        const grouped = this.groupByDate(source, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(d =>
            parseFloat(grouped[d].reduce((s, i) => s + (parseFloat(i[field]) || 0), 0).toFixed(2))
        );
        return { labels, series: [{ name, data }] };
    }

    /** Sorted table from video/content data */
    sortedTable(items, sortField, limit, mapper, headers) {
        const sorted = [...items]
            .filter(v => limit > 0 ? parseInt(v[sortField]) > 0 : true)
            .sort((a, b) => (parseInt(b[sortField]) || 0) - (parseInt(a[sortField]) || 0));
        const sliced = limit ? sorted.slice(0, Math.abs(limit)) : sorted;
        const finalItems = limit < 0 ? sliced.reverse() : sliced;
        return { labels: headers, series: [{ name: 'Items', data: finalItems.map(mapper) }] };
    }

    // ===== TIKTOK ORGANIC CHARTS =====

    generate_followers_growth() { return this.dailyMax(this.daily, 'followers_count', 'K\u00f6vet\u0151k'); }
    generate_profile_views() { return this.dailyMetric(this.daily, 'profile_views', 'Profil n\u00e9zetek'); }
    generate_daily_likes() { return this.dailyMetric(this.daily, 'likes', 'Like-ok'); }
    generate_daily_comments() { return this.dailyMetric(this.daily, 'comments', 'Kommentek'); }
    generate_daily_shares() { return this.dailyMetric(this.daily, 'shares', 'Megoszt\u00e1sok'); }

    generate_engagement_rate() {
        const grouped = this.groupByDate(this.video.length > 0 ? this.video : this.data, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const likes = this.sumField(items, 'video_likes') || this.sumField(items, 'likes');
            const comments = this.sumField(items, 'video_comments') || this.sumField(items, 'comments');
            const shares = this.sumField(items, 'video_shares') || this.sumField(items, 'shares');
            const views = this.sumField(items, 'video_views_count');
            return views > 0 ? this.engagementRate(likes, comments, shares, views) : 0;
        });
        return { labels, series: [{ name: 'ER %', data }] };
    }

    generate_tt_bio_link_clicks() { return this.dailyMetric(this.daily, 'bio_link_clicks', 'Bio link kattint\u00e1sok'); }

    generate_tt_video_watch_time() {
        const videos = this.video.filter(v => v.video_average_time_watched);
        return {
            labels: videos.map(v => (v.video_caption || '').substring(0, 30) || v.video_id || '-'),
            series: [{ name: '\u00c1tl. n\u00e9z\u00e9si id\u0151 (mp)', data: videos.map(v => parseFloat(v.video_average_time_watched) || 0) }]
        };
    }

    generate_tt_video_retention() {
        const grouped = this.groupByDate(this.data, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date].filter(i => i.video_full_watched_rate);
            if (items.length === 0) return 0;
            return parseFloat((items.reduce((s, i) => s + (parseFloat(i.video_full_watched_rate) || 0), 0) / items.length).toFixed(2));
        });
        return { labels, series: [{ name: 'V\u00e9gign\u00e9z\u00e9si ar\u00e1ny %', data }] };
    }

    generate_tt_traffic_sources() {
        return this._aggregateByField(this.data, 'video_impression_sources_impression_source', 'video_impression_sources_percentage', 'Ar\u00e1ny %', false, 0, 1, true);
    }

    generate_tt_audience_demographics() {
        return this._aggregateByField(this.data, 'audience_ages_age', 'audience_ages_percentage', 'Ar\u00e1ny %', true, 0, 1, true);
    }

    generate_tt_gender_demographics() {
        const genderMap = {};
        this.data.forEach(item => {
            const g = item.video_audience_genders_gender;
            const p = parseFloat(item.video_audience_genders_percentage) || 0;
            if (!g || p < 0) return;
            if (!genderMap[g]) genderMap[g] = [];
            genderMap[g].push(p);
        });

        const labels = [];
        const data = [];
        const nameMap = { 'female_vv': 'N\u0151', 'male_vv': 'F\u00e9rfi', 'other_vv': 'Egy\u00e9b' };
        const order = ['male_vv', 'female_vv', 'other_vv'];

        order.forEach(key => {
            if (genderMap[key]) {
                const values = genderMap[key];
                const avg = values.reduce((s, v) => s + v, 0) / values.length;
                labels.push(nameMap[key] || key);
                data.push(parseFloat((avg * 100).toFixed(1)));
            }
        });

        return { labels, series: [{ name: 'Ar\u00e1ny %', data }] };
    }

    generate_tt_total_followers() {
        return this.dailyMax(this.daily, 'total_followers_count', '\u00d6sszes k\u00f6vet\u0151');
    }

    generate_tt_engaged_audience() { return this.dailyMetric(this.daily, 'engaged_audience', 'Elk\u00f6telezett k\u00f6z\u00f6ns\u00e9g'); }
    generate_tt_daily_reached() { return this.dailyMetric(this.daily, 'engaged_audience', 'Elk\u00f6telezett k\u00f6z\u00f6ns\u00e9g'); }
    generate_tt_email_clicks() { return this.dailyMetric(this.daily, 'email_clicks', 'Email kattint\u00e1sok'); }
    generate_tt_phone_clicks() { return this.dailyMetric(this.daily, 'phone_number_clicks', 'Telefonsz\u00e1m kattint\u00e1sok'); }
    generate_tt_follower_change() {
        return this.dailyMultiMetric(this.daily, [['daily_lost_followers', 'Elvesztett k\u00f6vet\u0151k']]);
    }
    generate_tt_audience_countries() {
        return this._aggregateByField(this.data, 'audience_country', 'audience_country_percentage', 'Ar\u00e1ny %', false, 10, 1, true);
    }
    generate_tt_audience_cities() {
        return this._aggregateByField(this.data, 'audience_cities_city', 'audience_cities_percentage', 'Ar\u00e1ny %', false, 10, 1, true);
    }

    // ===== TIMING CHARTS =====

    generate_engagement_by_day() {
        const dayNames = ['H\u00e9tf\u0151', 'Kedd', 'Szerda', 'Cs\u00fct\u00f6rt\u00f6k', 'P\u00e9ntek', 'Szombat', 'Vas\u00e1rnap'];
        const dayData = new Array(7).fill(0);
        const dayCounts = new Array(7).fill(0);

        this.activity.forEach(item => {
            const hour = parseInt(item.audience_activity_hour);
            const count = parseInt(item.audience_activity_count) || 0;
            const dayIndex = hour % 7;
            dayData[dayIndex] += count;
            dayCounts[dayIndex]++;
        });

        return {
            labels: dayNames,
            series: [{ name: '\u00c1tl. aktivit\u00e1s', data: dayData.map((sum, i) => dayCounts[i] > 0 ? Math.round(sum / dayCounts[i]) : 0) }]
        };
    }

    generate_engagement_by_hour() {
        const hourData = new Array(24).fill(0);
        this.activity.forEach(item => {
            const hour = parseInt(item.audience_activity_hour);
            const count = parseInt(item.audience_activity_count) || 0;
            if (hour >= 0 && hour < 24) hourData[hour] += count;
        });
        return { labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), series: [{ name: 'Aktivit\u00e1s', data: hourData }] };
    }

    // ===== VIDEO TABLES =====

    generate_all_videos() { return this.generateVideoTable(this.video); }
    generate_top_3_videos() {
        const deduped = this._dedupeVideos(this.video);
        const sorted = [...deduped].sort((a, b) => b._maxViews - a._maxViews);
        return this._buildVideoTable(sorted.slice(0, 3));
    }
    generate_worst_3_videos() {
        const deduped = this._dedupeVideos(this.video).filter(v => v._maxViews > 0);
        const sorted = [...deduped].sort((a, b) => a._maxViews - b._maxViews);
        return this._buildVideoTable(sorted.slice(0, 3));
    }

    /** Deduplicate video rows by video_id, taking max for cumulative metrics and avg for rate metrics */
    _dedupeVideos(videos) {
        const map = {};
        videos.forEach(v => {
            const id = v.video_id;
            if (!id) return;
            if (!map[id]) {
                map[id] = { rows: [], id };
            }
            map[id].rows.push(v);
        });
        return Object.values(map).map(({ rows, id }) => {
            const maxInt = (field) => Math.max(...rows.map(r => parseInt(r[field]) || 0));
            const avgFloat = (field) => {
                const vals = rows.map(r => parseFloat(r[field]) || 0).filter(v => v > 0);
                return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
            };
            const first = rows[0];
            return {
                video_id: id,
                video_caption: first.video_caption,
                video_create_datetime: first.video_create_datetime,
                video_embed_url: first.video_embed_url,
                _maxViews: maxInt('video_views_count'),
                _maxReach: maxInt('video_reach'),
                _maxLikes: maxInt('video_likes'),
                _maxComments: maxInt('video_comments'),
                _maxShares: maxInt('video_shares'),
                _maxNewFollowers: maxInt('video_new_followers'),
                _avgFullWatchRate: avgFloat('video_full_watched_rate'),
                _avgWatchTime: avgFloat('video_average_time_watched_non_aggregated'),
            };
        });
    }

    _buildVideoTable(deduped) {
        const tableData = deduped.map(v => {
            const views = v._maxViews;
            const reach = v._maxReach;
            const likes = v._maxLikes;
            const comments = v._maxComments;
            const shares = v._maxShares;
            const newFollowers = v._maxNewFollowers;
            const fullWatchRate = v._avgFullWatchRate;
            const avgWatchTime = v._avgWatchTime;
            const er = this.engagementRate(likes, comments, shares, reach);
            return {
                id: v.video_id, caption: v.video_caption || '-',
                date: v.video_create_datetime ? v.video_create_datetime.substring(0, 10) : '-',
                views, likes, comments, shares, reach, newFollowers,
                fullWatchRate: parseFloat((fullWatchRate * 100).toFixed(2)),
                avgWatchTime: parseFloat(avgWatchTime.toFixed(1)),
                engagementRate: er,
                link: v.video_embed_url || '#'
            };
        });
        return { labels: ['D\u00e1tum', 'Caption', 'Views', 'Likes', 'Comments', 'Shares', 'El\u00e9r\u00e9s', '\u00daj k\u00f6vet\u0151k', 'V\u00e9gign\u00e9z\u00e9s%', '\u00c1tl. n\u00e9z\u00e9si id\u0151', 'ER%', 'Link'], series: [{ name: 'Videos', data: tableData }] };
    }

    generateVideoTable(videos) {
        const deduped = this._dedupeVideos(videos);
        return this._buildVideoTable(deduped);
    }

    // ===== FACEBOOK CHARTS =====

    generate_fb_page_reach() { return this.dailyMultiMetric(this.daily, [['page_impressions_unique', 'El\u00e9r\u00e9s'], ['page_impressions', 'Impresszi\u00f3k']]); }
    generate_fb_page_fans() { return this.dailyMax(this.daily, 'page_fans', 'K\u00f6vet\u0151k'); }
    generate_fb_engagement() { return this.dailyMultiMetric(this.daily, [['page_post_engagements', 'Engagement']]); }
    generate_fb_post_engagement() { return this.dailyMultiMetric(this.daily, [['post_reactions', 'Reakci\u00f3k'], ['post_comments', 'Kommentek'], ['post_shares', 'Megoszt\u00e1sok'], ['post_clicks', 'Kattint\u00e1sok']]); }
    generate_fb_video_views() { return this.dailyMetric(this.daily, 'page_video_views', 'Vide\u00f3 megtekint\u00e9sek'); }
    generate_fb_follows_trend() { return this.dailyMultiMetric(this.daily, [['page_daily_follows', '\u00daj k\u00f6vet\u0151k'], ['page_daily_unfollows', 'K\u00f6vet\u00e9st\u00f6rl\u00e9s']]); }
    generate_fb_reaction_breakdown() { return this.dailyMultiMetric(this.daily, [['post_reactions_like_total', 'Like'], ['post_reactions_love_total', 'Love'], ['post_reactions_wow_total', 'Wow'], ['post_reactions_haha_total', 'Haha']]); }
    generate_fb_page_video_time() { return this.dailyMetric(this.daily, 'page_video_view_time', 'N\u00e9z\u00e9si id\u0151'); }

    generate_fb_all_posts() { return this.generateFacebookPostTable(this.video); }
    generate_fb_top_3_posts() {
        const sorted = [...this.video].sort((a, b) => (parseInt(b.post_impressions) || 0) - (parseInt(a.post_impressions) || 0));
        return this.generateFacebookPostTable(sorted.slice(0, 3));
    }

    generateFacebookPostTable(posts) {
        const tableData = posts.map(p => ({
            id: p.post_id, caption: p.post_message || '-',
            date: p.post_created_time ? p.post_created_time.substring(0, 10) : '-',
            views: parseInt(p.post_impressions) || 0,
            reach: parseInt(p.post_impressions_unique) || 0,
            likes: parseInt(p.post_activity_by_action_type_like) || 0,
            comments: parseInt(p.post_activity_by_action_type_comment) || 0,
            shares: parseInt(p.post_activity_by_action_type_share) || 0,
            clicks: parseInt(p.post_clicks) || 0,
            videoViews: parseInt(p.post_video_views) || 0,
            link: this._fbPostLink(p.post_id)
        }));
        return { labels: ['Dátum', 'Üzenet', 'Impresszió', 'Elérés', 'Reakció', 'Komment', 'Megosztás', 'Kattintás', 'Videó nézés', 'Link'], series: [{ name: 'Posts', data: tableData }] };
    }

    generateFacebookReelTable(posts) {
        const reels = posts.filter(p => (parseInt(p.post_video_views) || 0) > 0);
        const sorted = [...reels].sort((a, b) => (parseInt(b.post_video_views) || 0) - (parseInt(a.post_video_views) || 0));
        const tableData = sorted.map(p => ({
            id: p.post_id, caption: p.post_message || '-',
            date: p.post_created_time ? p.post_created_time.substring(0, 10) : '-',
            views: parseInt(p.post_video_views) || 0,
            autoplay: parseInt(p.post_video_views_autoplayed) || 0,
            clickToPlay: parseInt(p.post_video_views_clicked_to_play) || 0,
            organic: parseInt(p.post_video_views_organic) || 0,
            unique: parseInt(p.post_video_views_unique) || 0,
            likes: parseInt(p.post_activity_by_action_type_like) || 0,
            comments: parseInt(p.post_activity_by_action_type_comment) || 0,
            shares: parseInt(p.post_activity_by_action_type_share) || 0,
            link: this._fbPostLink(p.post_id)
        }));
        return { labels: ['Dátum', 'Üzenet', 'Videó nézés', 'Autoplay', 'Kattintásra', 'Organikus', 'Egyedi', 'Reakció', 'Komment', 'Megosztás', 'Link'], series: [{ name: 'Reels', data: tableData }] };
    }

    /** Build Facebook post URL from post_id (format: pageId_postId) */
    _fbPostLink(postId) {
        if (!postId) return '#';
        const parts = postId.split('_');
        if (parts.length === 2) return `https://www.facebook.com/${parts[0]}/posts/${parts[1]}`;
        return `https://www.facebook.com/${postId}`;
    }

    generate_fb_worst_3_posts() {
        const sorted = [...this.video].filter(p => parseInt(p.post_impressions) > 0)
            .sort((a, b) => (parseInt(a.post_impressions) || 0) - (parseInt(b.post_impressions) || 0));
        return this.generateFacebookPostTable(sorted.slice(0, 3));
    }

    generate_fb_engaged_users() { return this.dailyMetric(this.daily, 'page_post_engagements', 'Poszt engagement'); }
    generate_fb_page_views() { return this.dailyMetric(this.daily, 'page_views_total', 'Oldal megtekint\u00e9sek'); }

    generate_fb_engagement_rate() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const engagement = this.sumField(items, 'page_post_engagements');
            const reach = this.sumField(items, 'page_impressions_unique') || 1;
            return parseFloat(((engagement / reach) * 100).toFixed(2));
        });
        return { labels, series: [{ name: 'ER %', data }] };
    }

    // New Facebook charts
    generate_fb_impressions_breakdown() { return this.dailyMultiMetric(this.daily, [['page_impressions', 'Impressziók']]); }
    generate_fb_page_actions() { return this.dailyMultiMetric(this.daily, [['page_post_engagements', 'Poszt engagement']]); }
    generate_fb_reels_plays() { return this.dailyMultiMetric(this.daily, [['blue_reels_play_count', 'Reels lej\u00e1tsz\u00e1s'], ['fb_reels_total_plays', '\u00d6sszes Reels']]); }
    generate_fb_post_clicks_breakdown() { return this.dailyMultiMetric(this.daily, [['post_clicks_by_type_photo_view', 'Fot\u00f3'], ['post_clicks_by_type_video_play', 'Vide\u00f3']]); }
    generate_fb_fans_country() { return this._aggregateByField(this.data, 'page_fans_country_name', 'page_fans_country_value', 'K\u00f6vet\u0151k', false, 10); }
    generate_fb_fans_city() { return this._aggregateByField(this.data, 'page_fans_city_name', 'page_fans_city_value', 'K\u00f6vet\u0151k', false, 10); }

    generate_fb_reel_performance() {
        return this.generateFacebookReelTable(this.video);
    }

    // ===== INSTAGRAM CHARTS =====

    generate_ig_reach() { return this.dailyMultiMetric(this.daily, [['reach', 'El\u00e9r\u00e9s'], ['impressions', 'Impresszi\u00f3k']]); }
    generate_ig_follower_growth() { return this.dailyMax(this.daily, 'follower_count', 'K\u00f6vet\u0151k'); }
    generate_ig_engagement() { return this.dailyMultiMetric(this.daily, [['likes', 'Like-ok'], ['comments', 'Kommentek'], ['shares', 'Megoszt\u00e1sok'], ['saved', 'Ment\u00e9sek']]); }
    generate_ig_profile_activity() { return this.dailyMultiMetric(this.daily, [['profile_views', 'Profiln\u00e9zetek'], ['website_clicks', 'Weboldal kattint\u00e1sok']]); }
    generate_ig_daily_followers() { return this.dailyMetric(this.daily, 'follower_count_1d', 'Napi \u00faj k\u00f6vet\u0151k'); }

    generate_ig_save_rate() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const saved = this.sumField(items, 'media_saved');
            const reach = this.sumField(items, 'media_reach');
            return reach > 0 ? parseFloat(((saved / reach) * 100).toFixed(2)) : 0;
        });
        return { labels, series: [{ name: 'Ment\u00e9si ar\u00e1ny %', data }] };
    }

    generate_ig_story_overview() { return this.dailyMultiMetric(this.daily, [['story_reach', 'El\u00e9r\u00e9s'], ['story_views', 'Megtekint\u00e9sek'], ['story_exits', 'Kil\u00e9p\u00e9sek']]); }
    generate_ig_website_clicks_trend() { return this.dailyMetric(this.daily, 'website_clicks_1d', 'Weboldal kattint\u00e1sok'); }
    generate_ig_story_interactions() { return this.dailyMultiMetric(this.daily, [['story_interactions', 'Interakci\u00f3k'], ['story_replies', 'V\u00e1laszok'], ['story_shares', 'Megoszt\u00e1sok']]); }
    generate_ig_story_navigation() { return this.dailyMultiMetric(this.daily, [['story_taps_forward', 'El\u0151re'], ['story_taps_back', 'H\u00e1tra'], ['story_swipe_forward', 'Sw\u00e1jp']]); }
    generate_ig_clicks() { return this.dailyMultiMetric(this.daily, [['email_contacts_1d', 'Email'], ['phone_call_clicks_1d', 'Telefon'], ['get_directions_clicks_1d', '\u00datvonal'], ['text_message_clicks_1d', '\u00dczenet']]); }
    generate_ig_audience_age() { return this._aggregateByField(this.data, 'audience_age_name', 'audience_age_size', 'K\u00f6z\u00f6ns\u00e9g', true); }
    generate_ig_audience_gender() { return this._aggregateByField(this.data, 'audience_gender_name', 'audience_gender_size', 'K\u00f6z\u00f6ns\u00e9g'); }
    generate_ig_audience_country() { return this._aggregateByField(this.data, 'audience_country_name', 'audience_country_size', 'K\u00f6z\u00f6ns\u00e9g', false, 10); }
    generate_ig_audience_city() { return this._aggregateByField(this.data, 'city', 'audience_city_size', 'K\u00f6z\u00f6ns\u00e9g', false, 10); }

    generate_ig_media_type_breakdown() {
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
        return { labels, series: [{ name: 'Reel n\u00e9z\u00e9sek', data: views }, { name: '\u00c1tl. n\u00e9z\u00e9si id\u0151', data: watchTime }] };
    }

    generate_ig_all_media() { return this.generateInstagramMediaTable(this.video); }
    generate_ig_top_3_media() {
        const sorted = [...this.video].sort((a, b) => (parseInt(b.reach) || 0) - (parseInt(a.reach) || 0));
        return this.generateInstagramMediaTable(sorted.slice(0, 3));
    }

    generateInstagramMediaTable(media) {
        const tableData = media.map(m => ({
            id: m.media_id, caption: m.caption || '-',
            date: m.timestamp ? m.timestamp.substring(0, 10) : '-',
            impressions: parseInt(m.impressions) || 0, reach: parseInt(m.reach) || 0,
            likes: parseInt(m.likes) || 0, comments: parseInt(m.comments) || 0,
            shares: parseInt(m.shares) || 0, saved: parseInt(m.saved) || 0,
            link: m.permalink || '#'
        }));
        return { labels: ['D\u00e1tum', 'Caption', 'Impresszi\u00f3k', 'El\u00e9r\u00e9s', 'Like-ok', 'Kommentek', 'Megoszt\u00e1sok', 'Ment\u00e9sek', 'Link'], series: [{ name: 'Media', data: tableData }] };
    }

    // ===== INSTAGRAM PUBLIC =====

    generate_igpub_engagement_overview() { return this.dailyMultiMetric(this.data, [['media_like_count', 'Like-ok'], ['media_comments_count', 'Kommentek']]); }

    generate_igpub_avg_engagement() {
        const grouped = this.groupByDate(this.data, 'date');
        const labels = Object.keys(grouped).sort();
        const avgField = (items, field) => {
            const avg = items.reduce((s, i) => s + (parseFloat(i[field]) || 0), 0) / (items.length || 1);
            return parseFloat(avg.toFixed(2));
        };
        return {
            labels,
            series: [
                { name: '\u00c1tl. like/poszt', data: labels.map(d => avgField(grouped[d], 'likes_per_post')) },
                { name: '\u00c1tl. komment/poszt', data: labels.map(d => avgField(grouped[d], 'comments_per_post')) }
            ]
        };
    }

    generate_igpub_followers_trend() { return this.dailyMax(this.daily, 'profile_followers_count', 'K\u00f6vet\u0151k'); }

    generate_igpub_engagement_rate() {
        const grouped = this.groupByDate(this.data, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const likes = this.sumField(items, 'media_like_count');
            const comments = this.sumField(items, 'media_comments_count');
            const followers = Math.max(...items.map(i => parseInt(i.profile_followers_count) || 0));
            return followers > 0 ? parseFloat(((likes + comments) / followers * 100).toFixed(2)) : 0;
        });
        return { labels, series: [{ name: 'ER %', data }] };
    }

    generate_igpub_all_media() { return this.generateIGPublicMediaTable(this.video); }
    generate_igpub_top_3_media() {
        const sorted = [...this.video].sort((a, b) => (parseInt(b.media_like_count) || 0) - (parseInt(a.media_like_count) || 0));
        return this.generateIGPublicMediaTable(sorted.slice(0, 3));
    }
    generate_igpub_worst_3_media() {
        const sorted = [...this.video].filter(m => parseInt(m.media_like_count) > 0)
            .sort((a, b) => (parseInt(a.media_like_count) || 0) - (parseInt(b.media_like_count) || 0));
        return this.generateIGPublicMediaTable(sorted.slice(0, 3));
    }

    generateIGPublicMediaTable(media) {
        const tableData = media.map(m => ({
            id: m.media_id, caption: m.media_caption || '-',
            date: m.media_timestamp ? m.media_timestamp.substring(0, 10) : '-',
            likes: parseInt(m.media_like_count) || 0, comments: parseInt(m.media_comments_count) || 0,
            type: m.media_type || '-', link: m.media_permalink || '#'
        }));
        return { labels: ['D\u00e1tum', 'Caption', 'Like-ok', 'Kommentek', 'T\u00edpus', 'Link'], series: [{ name: 'Media', data: tableData }] };
    }

    // ===== YOUTUBE CHARTS =====

    generate_yt_subscribers_growth() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => this.sumField(grouped[date], 'subscribers_gained') - this.sumField(grouped[date], 'subscribers_lost'));
        return { labels, series: [{ name: 'Nett\u00f3 feliratkoz\u00f3k', data }] };
    }

    generate_yt_views_trend() { return this.dailyMetric(this.daily, 'views', 'Megtekint\u00e9sek'); }
    generate_yt_watch_time() { return this.dailyMetric(this.daily, 'estimated_minutes_watched', 'N\u00e9z\u00e9si id\u0151 (perc)'); }
    generate_yt_daily_engagement() { return this.dailyMultiMetric(this.daily, [['likes', 'Like-ok'], ['comments', 'Kommentek'], ['shares', 'Megoszt\u00e1sok']]); }

    generate_yt_engagement_rate() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const data = labels.map(date => {
            const items = grouped[date];
            const likes = this.sumField(items, 'likes');
            const comments = this.sumField(items, 'comments');
            const views = this.sumField(items, 'views');
            return views > 0 ? this.engagementRate(likes, comments, 0, views) : 0;
        });
        return { labels, series: [{ name: 'ER %', data }] };
    }

    generate_yt_top_countries() {
        return this._aggregateByField(this.data, 'country', 'viewer_percentage', 'N\u00e9z\u0151k %', false, 10);
    }

    generate_yt_avg_view_pct() {
        const videos = this.video.filter(v => v.average_view_percentage);
        return {
            labels: videos.map(v => (v.video_title || '').substring(0, 30) || v.video_id || '-'),
            series: [{ name: 'N\u00e9z\u00e9si %', data: videos.map(v => parseFloat((parseFloat(v.average_view_percentage) || 0).toFixed(2))) }]
        };
    }

    generate_yt_playlist_adds() { return this.dailyMetric(this.daily, 'videos_added_to_playlists', 'Playlisthez adva'); }
    generate_yt_premium_views() { return this.dailyMetric(this.daily, 'red_views', 'Premium n\u00e9z\u00e9sek'); }
    generate_yt_likes_dislikes() { return this.dailyMultiMetric(this.daily, [['likes', 'Like-ok'], ['dislikes', 'Dislike-ok']]); }
    generate_yt_subscriber_count() { return this.dailyMax(this.daily, 'subscriber_count', 'Feliratkoz\u00f3k'); }
    generate_yt_card_performance() { return this.dailyMultiMetric(this.daily, [['card_clicks', 'Kattint\u00e1sok'], ['card_impressions', 'Megjelen\u00e9sek']]); }
    generate_yt_card_ctr() { return this.dailyAvg(this.daily, 'card_click_rate', 'CTR %'); }
    generate_yt_red_watch_time() { return this.dailyMetric(this.daily, 'estimated_red_minutes_watched', 'Premium n\u00e9z\u00e9si id\u0151 (perc)'); }
    generate_yt_playlist_removes() { return this.dailyMetric(this.daily, 'videos_removed_from_playlists', 'Elt\u00e1vol\u00edtva'); }
    generate_yt_videos_published() { return this.dailyMetric(this.daily, 'videos_published', 'K\u00f6zz\u00e9t\u00e9ve'); }

    generate_yt_top_5_videos() {
        const sorted = [...this.video].sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
        return this.generateYouTubeVideoTable(sorted.slice(0, 5));
    }
    generate_yt_worst_5_videos() {
        const sorted = [...this.video].filter(v => parseInt(v.views) > 0)
            .sort((a, b) => (parseInt(a.views) || 0) - (parseInt(b.views) || 0));
        return this.generateYouTubeVideoTable(sorted.slice(0, 5));
    }
    generate_yt_all_videos() { return this.generateYouTubeVideoTable(this.video); }

    generateYouTubeVideoTable(videos) {
        const tableData = videos.map(v => {
            const views = parseInt(v.views) || 0;
            const likes = parseInt(v.likes) || 0;
            const comments = parseInt(v.comments) || 0;
            const shares = parseInt(v.shares) || 0;
            const er = this.engagementRate(likes, comments, shares, views);
            return {
                id: v.video_id, title: v.video_title || '-',
                date: v.video_published_at ? v.video_published_at.substring(0, 10) : '-',
                views, likes, comments, shares,
                avgViewDuration: parseInt(v.average_view_duration) || 0,
                avgViewPercentage: parseFloat(v.average_view_percentage) || 0,
                engagementRate: er,
                link: v.video_id ? `https://youtube.com/watch?v=${v.video_id}` : '#'
            };
        });
        return { labels: ['D\u00e1tum', 'C\u00edm', 'Views', 'Likes', 'Comments', 'Shares', '\u00c1tl. n\u00e9z\u00e9si id\u0151', 'N\u00e9z\u00e9si%', 'ER%', 'Link'], series: [{ name: 'Videos', data: tableData }] };
    }

    // ===== TIKTOK ADS =====

    generate_ttads_spend_trend() { return this.dailyFloatSum(this.daily, 'spend', 'K\u00f6lt\u00e9s'); }
    generate_ttads_impressions_clicks() { return this.dailyMultiMetric(this.daily, [['impressions', 'Impresszi\u00f3k'], ['clicks', 'Kattint\u00e1sok']]); }
    generate_ttads_ctr_trend() { return this.dailyAvg(this.daily, 'ctr', 'CTR %'); }
    generate_ttads_cpc_cpm() {
        const grouped = this.groupByDate(this.daily, 'date');
        const labels = Object.keys(grouped).sort();
        const avgField = (items, field) => {
            const avg = items.reduce((s, i) => s + (parseFloat(i[field]) || 0), 0) / (items.length || 1);
            return parseFloat(avg.toFixed(2));
        };
        return {
            labels,
            series: [
                { name: 'CPC', data: labels.map(d => avgField(grouped[d], 'cpc')) },
                { name: 'CPM', data: labels.map(d => avgField(grouped[d], 'cpm')) }
            ]
        };
    }
    generate_ttads_conversions() { return this.dailyMetric(this.daily, 'conversions', 'Konverzi\u00f3k'); }
    generate_ttads_cost_per_conversion() { return this.dailyAvg(this.daily, 'cost_per_conversion', 'K\u00f6lts\u00e9g/konverzi\u00f3'); }
    generate_ttads_video_engagement() { return this.dailyMultiMetric(this.daily, [['video_play_actions', 'Lej\u00e1tsz\u00e1sok'], ['video_watched_2s', '2s n\u00e9z\u00e9s'], ['video_watched_6s', '6s n\u00e9z\u00e9s']]); }
    generate_ttads_reach_cost() { return this.dailyAvg(this.daily, 'cost_per_1000_reached', 'CPR'); }
    generate_ttads_video_play_time() { return this.dailyMultiMetric(this.daily, [['average_video_play', '\u00c1tl. lej\u00e1tsz\u00e1s'], ['average_video_play_per_user', '\u00c1tl./felhaszn\u00e1l\u00f3']]); }
    generate_ttads_app_install() { return this.dailyMultiMetric(this.daily, [['app_install', 'Telep\u00edt\u00e9sek'], ['cost_per_app_install', 'K\u00f6lts\u00e9g/telep\u00edt\u00e9s']]); }
    generate_ttads_payment_trend() { return this.dailyMultiMetric(this.daily, [['complete_payment', 'Fizet\u00e9sek'], ['complete_payment_roas', 'ROAS']]); }
    generate_ttads_registration() { return this.dailyMultiMetric(this.daily, [['registration', 'Regisztr\u00e1ci\u00f3k'], ['cost_per_registration', 'K\u00f6lts\u00e9g/reg.']]); }

    generate_ttads_adgroup_perf() {
        const adgroupMap = {};
        this.data.forEach(item => {
            const name = item.adgroup_name;
            if (!name) return;
            if (!adgroupMap[name]) adgroupMap[name] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
            adgroupMap[name].impressions += parseInt(item.impressions) || 0;
            adgroupMap[name].clicks += parseInt(item.clicks) || 0;
            adgroupMap[name].spend += parseFloat(item.spend) || 0;
            adgroupMap[name].conversions += parseInt(item.conversions) || 0;
        });
        const tableData = Object.entries(adgroupMap).map(([name, s]) => ({
            adgroup: name, impressions: s.impressions, clicks: s.clicks,
            spend: parseFloat(s.spend.toFixed(2)),
            cpc: s.clicks > 0 ? parseFloat((s.spend / s.clicks).toFixed(2)) : 0,
            ctr: s.impressions > 0 ? parseFloat(((s.clicks / s.impressions) * 100).toFixed(2)) : 0,
            conversions: s.conversions,
        }));
        return { labels: ['Csoport', 'Impresszi\u00f3k', 'Kattint\u00e1sok', 'K\u00f6lt\u00e9s', 'CPC', 'CTR%', 'Konverzi\u00f3k'], series: [{ name: 'Adgroups', data: tableData }] };
    }

    generate_ttads_campaign_perf() {
        const campaignMap = {};
        this.data.forEach(item => {
            const name = item.campaign_name;
            if (!name) return;
            if (!campaignMap[name]) campaignMap[name] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
            campaignMap[name].impressions += parseInt(item.impressions) || 0;
            campaignMap[name].clicks += parseInt(item.clicks) || 0;
            campaignMap[name].spend += parseFloat(item.spend) || 0;
            campaignMap[name].conversions += parseInt(item.conversions) || 0;
        });
        const tableData = Object.entries(campaignMap).map(([name, s]) => ({
            campaign: name, impressions: s.impressions, clicks: s.clicks,
            spend: parseFloat(s.spend.toFixed(2)),
            cpc: s.clicks > 0 ? parseFloat((s.spend / s.clicks).toFixed(2)) : 0,
            ctr: s.impressions > 0 ? parseFloat(((s.clicks / s.impressions) * 100).toFixed(2)) : 0,
            conversions: s.conversions,
        }));
        return { labels: ['Kamp\u00e1ny', 'Impresszi\u00f3k', 'Kattint\u00e1sok', 'K\u00f6lt\u00e9s', 'CPC', 'CTR%', 'Konverzi\u00f3k'], series: [{ name: 'Campaigns', data: tableData }] };
    }

    // ===== UTILITY METHODS =====

    // ===== UTILITY METHODS =====

    /** Aggregate by a categorical field, sum a percentage field */
    _aggregateByField(source, keyField, valueField, seriesName, sortAlpha = false, limit = 0, multiplier = 1, normalize = false) {
        const map = {};
        source.forEach(item => {
            const key = item[keyField];
            if (!key) return;
            const val = parseFloat(item[valueField]) || 0;
            if (!map[key]) map[key] = 0;
            map[key] += val;
        });

        // Calculate total for normalization
        const total = Object.values(map).reduce((a, b) => a + b, 0);

        let sorted = Object.entries(map);
        if (sortAlpha) sorted.sort((a, b) => a[0].localeCompare(b[0]));
        else sorted.sort((a, b) => b[1] - a[1]);

        if (limit > 0) sorted = sorted.slice(0, limit);

        return {
            labels: sorted.map(([k]) => k),
            series: [{
                name: seriesName,
                data: sorted.map(([, v]) => {
                    if (normalize && total > 0) {
                        return parseFloat(((v / total) * 100).toFixed(2));
                    }
                    return parseFloat((v * multiplier).toFixed(2));
                })
            }]
        };
    }

    groupByDate(items, dateField) {
        const groups = {};
        if (!Array.isArray(items)) return groups;

        // Use filtered date range if provided in constructor, otherwise default to no filtering
        const start = this.startDate ? new Date(this.startDate) : null;
        const end = this.endDate ? new Date(this.endDate) : null;

        items.forEach(item => {
            const dateStr = item[dateField];
            if (!dateStr) return;

            // Validate date range
            if (start || end) {
                const d = new Date(dateStr);
                if (start && d < start) return;
                if (end && d > end) return;
            }

            const key = dateStr.substring(0, 10);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }

    sumField(items, field) {
        if (!Array.isArray(items)) return 0;
        return items.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
    }

    /** Calculate engagement rate: (likes + comments + shares) / divisor * 100 */
    engagementRate(likes, comments, shares, divisor) {
        if (!divisor) return 0;
        return parseFloat(((likes + comments + shares) / divisor * 100).toFixed(2));
    }
}
