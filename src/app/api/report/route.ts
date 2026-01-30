import { NextRequest, NextResponse } from "next/server";
import { companies, buildWindsorUrls } from "@/lib/config";

// Helper functions from n8n workflow
const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const nonNeg = (v: unknown): number => Math.max(0, num(v));
const sum = (arr: number[]): number => arr.reduce((a, b) => a + num(b), 0);

function formatDateLabel(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.`;
}

function formatWatchTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}ó ${mins}p`;
    if (mins > 0) return `${mins}p ${secs}mp`;
    return `${secs}mp`;
}

function calcChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

interface DailyRow {
    date?: string;
    likes?: number;
    comments?: number;
    shares?: number;
    profile_views?: number;
    followers_count?: number;
    total_followers_count?: number;
}

interface VideoRow {
    video_embed_url?: string;
    video_create_datetime?: string;
    video_views_count?: number;
    video_reach?: number;
    video_likes?: number;
    video_comments?: number;
    video_shares?: number;
    video_new_followers?: number;
    video_full_watched_rate?: number;
    video_total_time_watched?: number;
    video_average_time_watched_non_aggregated?: number;
}

function aggregateDaily(data: DailyRow[]) {
    const byDate: Record<string, {
        date: string;
        likes: number;
        comments: number;
        shares: number;
        profile_views: number;
        followers_count: number;
        total_followers_count: number;
        _tfcValues: number[];
    }> = {};

    for (const row of data) {
        if (!row.date) continue;
        const d = row.date.substring(0, 10);
        if (!byDate[d]) {
            byDate[d] = {
                date: d,
                likes: 0,
                comments: 0,
                shares: 0,
                profile_views: 0,
                followers_count: 0,
                total_followers_count: 0,
                _tfcValues: [],
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
    }

    return Object.values(byDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function processVideos(data: VideoRow[]) {
    const byUrl: Record<string, {
        datetime: string;
        embedUrl: string;
        views: number;
        reach: number;
        likes: number;
        comments: number;
        shares: number;
        newFollowers: number;
        fullWatchRate: number;
        watchTimeSeconds: number;
        avgWatchTime: number;
    }> = {};

    for (const r of data) {
        if (!r.video_embed_url) continue;
        const url = r.video_embed_url;
        if (!byUrl[url]) {
            byUrl[url] = {
                datetime: r.video_create_datetime || "",
                embedUrl: url,
                views: 0,
                reach: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                newFollowers: 0,
                fullWatchRate: 0,
                watchTimeSeconds: 0,
                avgWatchTime: 0,
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

    return Object.values(byUrl).map((v) => {
        const er = v.reach > 0 ? ((v.likes + v.comments + v.shares) / v.reach) * 100 : 0;
        return {
            ...v,
            engagementRate: er,
            watchTimeHours: v.watchTimeSeconds / 3600,
            watchTimeFormatted: formatWatchTime(v.watchTimeSeconds),
            avgWatchTimeFormatted: formatWatchTime(v.avgWatchTime),
        };
    }).sort((a, b) => new Date(b.datetime || 0).getTime() - new Date(a.datetime || 0).getTime());
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Support dynamic companies via query params
    const accountIdParam = searchParams.get("accountId");
    const companyNameParam = searchParams.get("companyName");

    if (!companyId || !dateFrom || !dateTo) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Use query params if provided, otherwise look up from default companies
    let tiktokAccountId = accountIdParam;
    let companyName = companyNameParam;

    if (!tiktokAccountId || !companyName) {
        const company = companies.find((c) => c.id === companyId);
        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }
        tiktokAccountId = company.tiktokAccountId;
        companyName = company.name;
    }

    try {
        const urls = buildWindsorUrls(tiktokAccountId, dateFrom, dateTo);


        // Fetch all data in parallel
        const [dailyRes, videoRes, activityRes, ageRes, genderRes] = await Promise.all([
            fetch(urls.daily),
            fetch(urls.video),
            fetch(urls.activity),
            fetch(urls.age),
            fetch(urls.gender),
        ]);

        const [dailyJson, videoJson, activityJson, ageJson, genderJson] = await Promise.all([
            dailyRes.json(),
            videoRes.json(),
            activityRes.json(),
            ageRes.json(),
            genderRes.json(),
        ]);

        const dailyData = dailyJson.data || [];
        const videoData = videoJson.data || [];
        const activityData = activityJson.data || [];
        const ageData = Array.isArray(ageJson) ? (ageJson[0]?.data || []) : (ageJson.data || []);
        const genderData = genderJson.data || [];

        // Process daily data
        const dailySorted = aggregateDaily(dailyData);
        const dailyChartLabels = dailySorted.map((r) => formatDateLabel(r.date));
        const likesData = dailySorted.map((r) => r.likes);
        const commentsData = dailySorted.map((r) => r.comments);
        const sharesData = dailySorted.map((r) => r.shares);
        const profileViewsData = dailySorted.map((r) => r.profile_views);

        let totalFollowersData = dailySorted.map((r) => r.total_followers_count);
        let lastValidValue = totalFollowersData.find((v) => v > 0) || 0;
        totalFollowersData = totalFollowersData.map((v) => {
            if (v > 0) {
                lastValidValue = v;
                return v;
            }
            return lastValidValue;
        });

        const firstDayTotal = totalFollowersData.find((v) => v > 0) || 0;
        const lastDayTotal = [...totalFollowersData].reverse().find((v) => v > 0) || 0;
        const newFollowersThisMonth = lastDayTotal - firstDayTotal;

        const dailyTotals = {
            totalLikes: sum(likesData),
            totalComments: sum(commentsData),
            totalShares: sum(sharesData),
            totalProfileViews: sum(profileViewsData),
            totalNewFollowers: newFollowersThisMonth,
            currentFollowers: lastDayTotal,
            startFollowers: firstDayTotal,
            likesChange: 0,
            commentsChange: 0,
            sharesChange: 0,
            profileViewsChange: 0,
            newFollowersChange: 0,
        };

        // Process videos
        const videos = processVideos(videoData);
        const top3Videos = [...videos].sort((a, b) => b.views - a.views).slice(0, 3);

        const videoTotals = {
            totalViews: sum(videos.map((v) => v.views)),
            totalReach: sum(videos.map((v) => v.reach)),
            totalLikes: sum(videos.map((v) => v.likes)),
            totalComments: sum(videos.map((v) => v.comments)),
            totalShares: sum(videos.map((v) => v.shares)),
            totalNewFollowers: sum(videos.map((v) => v.newFollowers)),
            totalWatchTimeSeconds: sum(videos.map((v) => v.watchTimeSeconds)),
            totalWatchTimeFormatted: formatWatchTime(sum(videos.map((v) => v.watchTimeSeconds))),
            videoCount: videos.length,
            avgReachPerVideo: videos.length > 0 ? sum(videos.map((v) => v.reach)) / videos.length : 0,
            avgEngagement: videos.length > 0 ? sum(videos.map((v) => v.engagementRate)) / videos.length : 0,
            avgFullWatchRate: videos.length > 0 ? sum(videos.map((v) => v.fullWatchRate)) / videos.length : 0,
            viewsChange: 0,
            reachChange: 0,
            videoCountChange: 0,
        };

        // Demographics
        const genderMap: Record<string, number[]> = {};
        for (const r of genderData) {
            const g = r.video_audience_genders_gender;
            const p = num(r.video_audience_genders_percentage);
            if (!genderMap[g]) genderMap[g] = [];
            genderMap[g].push(p);
        }
        const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
        const genderAvg = {
            female: avg(genderMap["female_vv"] || []) * 100,
            male: avg(genderMap["male_vv"] || []) * 100,
            other: avg(genderMap["other_vv"] || []) * 100,
        };

        const ageMap: Record<string, number[]> = {};
        for (const r of ageData) {
            let a = r.audience_ages_age || "";
            const p = num(r.audience_ages_percentage);
            if (a.includes("18") && a.includes("24")) a = "18-24";
            else if (a.includes("25") && a.includes("34")) a = "25-34";
            else if (a.includes("35") && a.includes("44")) a = "35-44";
            else if (a.includes("45") && a.includes("54")) a = "45-54";
            else if (a.includes("55") || a.includes("65") || a === "55+" || a === "55-64" || a === "65+") a = "55+";
            else if (a.includes("13") && a.includes("17")) a = "13-17";
            if (!ageMap[a]) ageMap[a] = [];
            ageMap[a].push(p);
        }
        const ageBuckets = ["13-17", "18-24", "25-34", "35-44", "45-54", "55+"];
        const ageAvg: Record<string, number> = {};
        for (const bucket of ageBuckets) {
            ageAvg[bucket] = avg(ageMap[bucket] || []) * 100;
        }
        if (ageAvg["13-17"] === 0) delete ageAvg["13-17"];

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

        return NextResponse.json({
            companyName: companyName,
            dateRange: { from: dateFrom, to: dateTo },
            daily: {
                chartLabels: dailyChartLabels,
                likesData,
                commentsData,
                sharesData,
                profileViewsData,
                totalFollowersData,
                totals: dailyTotals,
            },
            video: {
                videos,
                top3: top3Videos,
                totals: videoTotals,
            },
            demographics: {
                gender: genderAvg,
                age: ageAvg,
                activity: activityAvg,
                activityLabels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`),
            },
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
