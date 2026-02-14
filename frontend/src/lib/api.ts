// API client for backend communication
// All calls go through Next.js API proxy routes (same origin)

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
    const res = await fetch('/api/companies', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch companies');
    return res.json();
}

export async function generateReport(params: { companyId: string; month: string }): Promise<ReportResponse> {
    const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
    }

    return response.json();
}

// ============================================
// CHART API
// ============================================

export interface ChartDefinition {
    key: string;
    title: string;
    description: string;
    type: 'line' | 'bar' | 'table';
    category: string;
    color: string;
    platform?: string;
}

export interface ChartCatalogResponse {
    total: number;
    categories: string[];
    charts: ChartDefinition[];
    byCategory: Record<string, ChartDefinition[]>;
}

export interface ChartData {
    key: string;
    title: string;
    description: string;
    type: string;
    color: string;
    data: {
        labels: string[];
        series: { name: string; data: unknown[] }[];
    };
    source: string;
    generatedAt: string;
    empty: boolean;
    error?: string;
}

export interface ChartsResponse {
    account: { id: string; name: string };
    dateRange: { from: string; to: string };
    chartsRequested: number;
    chartsGenerated: number;
    charts: ChartData[];
}

export async function getChartCatalog(): Promise<ChartCatalogResponse> {
    const response = await fetch('/api/charts/catalog', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch chart catalog');
    return response.json();
}

export async function generateCharts(params: {
    accountId: string;
    startDate: string;
    endDate: string;
    charts: { key: string; params?: Record<string, unknown> }[];
}): Promise<ChartsResponse> {
    const response = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate charts');
    }

    return response.json();
}
