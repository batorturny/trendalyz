// ============================================
// REPORT SERVICE - Data Processing
// ============================================

const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const nonNeg = (v) => Math.max(0, num(v));
const sum = (arr) => arr.reduce((a, b) => a + num(b), 0);
const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function formatDateLabel(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`;
}

function formatWatchTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}ó ${mins}p`;
    if (mins > 0) return `${mins}p ${secs}mp`;
    return `${secs}mp`;
}

function calcChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

function aggregateDaily(data) {
    const byDate = {};
    for (const row of data) {
        if (!row.date) continue;
        const d = row.date.substring(0, 10);
        if (!byDate[d]) {
            byDate[d] = {
                date: d, likes: 0, comments: 0, shares: 0, profile_views: 0,
                followers_count: 0, total_followers_count: 0, _tfcValues: []
            };
        }
        byDate[d].likes += nonNeg(row.likes);
        byDate[d].comments += nonNeg(row.comments);
        byDate[d].shares += nonNeg(row.shares);
        byDate[d].profile_views += nonNeg(row.profile_views);
        byDate[d].followers_count += nonNeg(row.followers_count);
        const tfc = nonNeg(row.total_followers_count);
        if (tfc > 0) byDate[d]._tfcValues.push(tfc);
    }

    for (const d in byDate) {
        const tfcArr = byDate[d]._tfcValues;
        byDate[d].total_followers_count = tfcArr.length > 0 ? Math.max(...tfcArr) : 0;
        delete byDate[d]._tfcValues;
    }

    return Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function processVideos(data) {
    const byUrl = {};
    for (const r of data) {
        if (!r.video_embed_url) continue;
        const url = r.video_embed_url;
        if (!byUrl[url]) {
            byUrl[url] = {
                datetime: r.video_create_datetime, embedUrl: url,
                views: 0, reach: 0, likes: 0, comments: 0, shares: 0, newFollowers: 0,
                fullWatchRate: 0, watchTimeSeconds: 0, avgWatchTime: 0
            };
        }
        const v = byUrl[url];
        v.views = Math.max(v.views, nonNeg(r.video_views_count));
        v.reach = Math.max(v.reach, nonNeg(r.video_reach));
        v.likes = Math.max(v.likes, nonNeg(r.video_likes));
        v.comments = Math.max(v.comments, nonNeg(r.video_comments));
        v.shares = Math.max(v.shares, nonNeg(r.video_shares));
        v.newFollowers = Math.max(v.newFollowers, nonNeg(r.video_new_followers));
        v.fullWatchRate = Math.max(v.fullWatchRate, num(r.video_full_watched_rate) * 100);
        v.watchTimeSeconds = Math.max(v.watchTimeSeconds, num(r.video_total_time_watched));
        v.avgWatchTime = Math.max(v.avgWatchTime, num(r.video_average_time_watched_non_aggregated));
    }

    return Object.values(byUrl).map(v => {
        const er = v.reach > 0 ? ((v.likes + v.comments + v.shares) / v.reach) * 100 : 0;
        return {
            ...v,
            engagementRate: er,
            watchTimeFormatted: formatWatchTime(v.watchTimeSeconds),
            avgWatchTimeFormatted: formatWatchTime(v.avgWatchTime)
        };
    }).sort((a, b) => new Date(a.datetime || 0) - new Date(b.datetime || 0));
}

function processReport(rawData, prevData = null) {
    const { daily: dailyData, video: videoData, activity: activityData, age: ageData, gender: genderData } = rawData;

    // Process daily data
    const dailySorted = aggregateDaily(dailyData);
    const prevDailySorted = prevData ? aggregateDaily(prevData.daily) : [];

    const dailyChartLabels = dailySorted.map(r => formatDateLabel(r.date));
    const likesData = dailySorted.map(r => r.likes);
    const commentsData = dailySorted.map(r => r.comments);
    const sharesData = dailySorted.map(r => r.shares);
    const profileViewsData = dailySorted.map(r => r.profile_views);

    // Fix followers data - interpolate zeros
    let totalFollowersData = dailySorted.map(r => r.total_followers_count);
    let lastValidValue = totalFollowersData.find(v => v > 0) || 0;
    totalFollowersData = totalFollowersData.map(v => {
        if (v > 0) { lastValidValue = v; return v; }
        return lastValidValue;
    });

    const firstDayTotal = totalFollowersData.find(v => v > 0) || 0;
    const lastDayTotal = [...totalFollowersData].reverse().find(v => v > 0) || 0;
    const newFollowersThisMonth = lastDayTotal - firstDayTotal;

    // Previous month comparison
    const prevTotals = prevDailySorted.length > 0 ? {
        totalLikes: sum(prevDailySorted.map(r => r.likes)),
        totalComments: sum(prevDailySorted.map(r => r.comments)),
        totalShares: sum(prevDailySorted.map(r => r.shares)),
        totalProfileViews: sum(prevDailySorted.map(r => r.profile_views)),
        totalNewFollowers: (() => {
            const pf = prevDailySorted.find(r => r.total_followers_count > 0)?.total_followers_count || 0;
            const pl = [...prevDailySorted].reverse().find(r => r.total_followers_count > 0)?.total_followers_count || 0;
            return pl - pf;
        })()
    } : null;

    const dailyTotals = {
        totalLikes: sum(likesData),
        totalComments: sum(commentsData),
        totalShares: sum(sharesData),
        totalProfileViews: sum(profileViewsData),
        totalNewFollowers: newFollowersThisMonth,
        currentFollowers: lastDayTotal,
        startFollowers: firstDayTotal,
        likesChange: prevTotals ? calcChange(sum(likesData), prevTotals.totalLikes) : null,
        commentsChange: prevTotals ? calcChange(sum(commentsData), prevTotals.totalComments) : null,
        sharesChange: prevTotals ? calcChange(sum(sharesData), prevTotals.totalShares) : null,
        profileViewsChange: prevTotals ? calcChange(sum(profileViewsData), prevTotals.totalProfileViews) : null,
        newFollowersChange: prevTotals ? calcChange(newFollowersThisMonth, prevTotals.totalNewFollowers) : null
    };

    // Process videos
    const videos = processVideos(videoData);
    const prevVideos = prevData ? processVideos(prevData.video) : [];

    const videoTotals = {
        totalViews: sum(videos.map(v => v.views)),
        totalReach: sum(videos.map(v => v.reach)),
        totalLikes: sum(videos.map(v => v.likes)),
        totalComments: sum(videos.map(v => v.comments)),
        totalShares: sum(videos.map(v => v.shares)),
        totalNewFollowers: sum(videos.map(v => v.newFollowers)),
        totalWatchTimeFormatted: formatWatchTime(sum(videos.map(v => v.watchTimeSeconds))),
        videoCount: videos.length,
        avgEngagement: videos.length > 0 ? sum(videos.map(v => v.engagementRate)) / videos.length : 0,
        avgFullWatchRate: videos.length > 0 ? sum(videos.map(v => v.fullWatchRate)) / videos.length : 0,
        viewsChange: prevVideos.length > 0 ? calcChange(sum(videos.map(v => v.views)), sum(prevVideos.map(v => v.views))) : null,
        reachChange: prevVideos.length > 0 ? calcChange(sum(videos.map(v => v.reach)), sum(prevVideos.map(v => v.reach))) : null,
        videoCountChange: prevVideos.length > 0 ? calcChange(videos.length, prevVideos.length) : null
    };

    const top3Videos = videos.slice().sort((a, b) => b.views - a.views).slice(0, 3);

    // Process demographics
    const genderMap = {};
    for (const r of genderData) {
        const g = r.video_audience_genders_gender;
        const p = num(r.video_audience_genders_percentage);
        if (!genderMap[g]) genderMap[g] = [];
        genderMap[g].push(p);
    }
    const genderAvg = {
        female: avg(genderMap['female_vv'] || []) * 100,
        male: avg(genderMap['male_vv'] || []) * 100,
        other: avg(genderMap['other_vv'] || []) * 100
    };

    // Age - collect all unique age values
    const ageMap = {};
    for (const r of ageData) {
        const a = r.audience_ages_age;
        const p = num(r.audience_ages_percentage);
        if (!ageMap[a]) ageMap[a] = [];
        ageMap[a].push(p);
    }
    const ageAvg = {};
    for (const key of Object.keys(ageMap)) {
        if (key) {
            ageAvg[key] = avg(ageMap[key]) * 100;
        }
    }

    // Activity
    const activityByHour = Array(24).fill(0);
    const activityCounts = Array(24).fill(0);
    for (const r of activityData) {
        const h = num(r.audience_activity_hour);
        if (h >= 0 && h < 24) {
            activityByHour[h] += num(r.audience_activity_count);
            activityCounts[h]++;
        }
    }
    const activityAvg = activityByHour.map((total, i) =>
        activityCounts[i] > 0 ? Math.round(total / activityCounts[i]) : 0
    );

    return {
        daily: {
            chartLabels: dailyChartLabels,
            likesData,
            commentsData,
            sharesData,
            profileViewsData,
            totalFollowersData,
            totals: dailyTotals,
            dateRange: {
                from: dailySorted[0]?.date || '',
                to: dailySorted[dailySorted.length - 1]?.date || ''
            }
        },
        video: {
            videos,
            top3: top3Videos,
            totals: videoTotals
        },
        demographics: {
            gender: genderAvg,
            age: ageAvg,
            activity: activityAvg,
            activityLabels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
        }
    };
}

module.exports = { processReport };
