// API client for backend communication
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Company {
    id: string;
    name: string;
}

export interface ReportRequest {
    companyId: string;
    month: string; // YYYY-MM format
}

export interface DailyTotals {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalProfileViews: number;
    totalNewFollowers: number;
    currentFollowers: number;
    startFollowers: number;
    likesChange: number | null;
    commentsChange: number | null;
    sharesChange: number | null;
    profileViewsChange: number | null;
    newFollowersChange: number | null;
}

export interface Video {
    datetime: string;
    embedUrl: string;
    views: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    newFollowers: number;
    engagementRate: number;
    fullWatchRate: number;
    watchTimeFormatted: string;
    avgWatchTimeFormatted: string;
}

export interface VideoTotals {
    totalViews: number;
    totalReach: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalNewFollowers: number;
    totalWatchTimeFormatted: string;
    videoCount: number;
    avgEngagement: number;
    avgFullWatchRate: number;
    viewsChange: number | null;
    reachChange: number | null;
    videoCountChange: number | null;
}

export interface Demographics {
    gender: { female: number; male: number; other: number };
    age: Record<string, number>;
    activity: number[];
    activityLabels: string[];
}

export interface ReportData {
    daily: {
        chartLabels: string[];
        likesData: number[];
        commentsData: number[];
        sharesData: number[];
        profileViewsData: number[];
        totalFollowersData: number[];
        totals: DailyTotals;
        dateRange: { from: string; to: string };
    };
    video: {
        videos: Video[];
        top3: Video[];
        totals: VideoTotals;
    };
    demographics: Demographics;
}

export interface ReportResponse {
    company: { id: string; name: string };
    month: { year: number; month: number; label: string };
    dateRange: { from: string; to: string };
    data: ReportData;
}

export async function getCompanies(): Promise<Company[]> {
    const res = await fetch(`${API_URL}/api/companies`);
    if (!res.ok) throw new Error('Failed to fetch companies');
    return res.json();
}

export async function generateReport(request: ReportRequest): Promise<ReportResponse> {
    const res = await fetch(`${API_URL}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to generate report');
    }
    return res.json();
}
