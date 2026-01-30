export interface TikTokReport {
    companyName: string;
    dateRange: {
        from: string;
        to: string;
        label: string;
    };
    daily: {
        chartLabels: string[];
        likesData: number[];
        commentsData: number[];
        sharesData: number[];
        profileViewsData: number[];
        totalFollowersData: number[];
        totals: {
            totalLikes: number;
            totalComments: number;
            totalShares: number;
            totalProfileViews: number;
            totalNewFollowers: number;
            currentFollowers: number;
            likesChange: number;
            commentsChange: number;
            sharesChange: number;
            profileViewsChange: number;
            newFollowersChange: number;
        };
    };
    video: {
        videos: VideoData[];
        top3: VideoData[];
        totals: {
            totalViews: number;
            totalReach: number;
            totalLikes: number;
            totalComments: number;
            totalShares: number;
            videoCount: number;
            avgEngagement: number;
            viewsChange: number;
            reachChange: number;
        };
    };
    demographics: {
        gender: {
            female: number;
            male: number;
            other: number;
        };
        age: Record<string, number>;
        activity: number[];
        activityLabels: string[];
    };
}

export interface VideoData {
    datetime: string;
    embedUrl: string;
    views: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    newFollowers: number;
    engagementRate: number;
    watchTimeFormatted: string;
    fullWatchRate: number;
}

export interface Company {
    id: string;
    name: string;
    tiktokAccountId: string;
    email: string;
    active: boolean;
}
