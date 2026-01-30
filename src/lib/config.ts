// Company data from the user's list
export const companies = [
    { id: "dr-besth", name: "Dr. B-Esth Esztétikai Klinika", tiktokAccountId: "_000qZAcx0RdCb5A2qNQ-WmgbjYxbQq-dIPL" },
    { id: "topark", name: "Tópark Étterem Dunaharaszti", tiktokAccountId: "_000YVfMNF1pI7HB_hFvXurmjIHS79otUSjz" },
    { id: "nint", name: "Nint", tiktokAccountId: "_00072RTMsPFhEL10pmqxrP8iXYJexyvIAyO" },
    { id: "drultz", name: "DrulTZ", tiktokAccountId: "_0003zN8N5BV50TkS3DvTpFvJh7m5cM5Wr0I" },
    { id: "losmonos", name: "Losmonos Mexican", tiktokAccountId: "_000Y5wLJHEGpyqzM-XcbtIQ5tk6WyqQ5SZ3" },
    { id: "smokey", name: "Smokey Monkies BBQ", tiktokAccountId: "_000g67wQQwIxH9259tRnAAcrxOAq_xueSOP" },
    { id: "drinkstation", name: "Drink Station", tiktokAccountId: "_000LrXYRnU_QVr9NL3SYDWjts-MEPsikmUs" },
    { id: "trofea", name: "Trófea Grill Étterem", tiktokAccountId: "_000baZoN0pwFvd9TbI0eO6PCuocEsMx1l4I" },
    { id: "cap", name: "CAP Marketing", tiktokAccountId: "_000AsjG8AtBUD-14DwxeUet7n3HjUg1RiOJ" },
    { id: "todo", name: "TODO", tiktokAccountId: "_000XWJRA8c2xG8sY3h33TSWCL203M1TIr_D" },
    { id: "trofea-obuda", name: "Trófea Grill Étterem Óbuda", tiktokAccountId: "_000qh_-mCgU6cj5BpStqN15LWPU6udScBpj" },
] as const;

export type Company = typeof companies[number];

export const WINDSOR_API_KEY = "b61021f891826f56f62c84529e8d5f2e0c31";
export const WINDSOR_BASE_URL = "https://connectors.windsor.ai/tiktok_organic";

// Generate month options (last 12 months)
export function getMonthOptions() {
    const options = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        options.push({
            value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            label: `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}.`,
            dateFrom: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`,
            dateTo: `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`,
        });
    }

    return options;
}

export function buildWindsorUrls(tiktokAccountId: string, dateFrom: string, dateTo: string) {
    const dateParams = `date_from=${dateFrom}&date_to=${dateTo}`;

    return {
        daily: `${WINDSOR_BASE_URL}?api_key=${WINDSOR_API_KEY}&${dateParams}&fields=comments,date,followers_count,likes,profile_views,shares,total_followers_count&select_accounts=${tiktokAccountId}`,
        video: `${WINDSOR_BASE_URL}?api_key=${WINDSOR_API_KEY}&${dateParams}&fields=video_comments,video_create_datetime,video_embed_url,video_full_watched_rate,video_likes,video_new_followers,video_reach,video_shares,video_total_time_watched,video_views_count,video_average_time_watched_non_aggregated&select_accounts=${tiktokAccountId}`,
        activity: `${WINDSOR_BASE_URL}?api_key=${WINDSOR_API_KEY}&${dateParams}&fields=audience_activity_count,audience_activity_hour,date&select_accounts=${tiktokAccountId}`,
        age: `${WINDSOR_BASE_URL}?api_key=${WINDSOR_API_KEY}&${dateParams}&fields=audience_ages_age,audience_ages_percentage,date&select_accounts=${tiktokAccountId}`,
        gender: `${WINDSOR_BASE_URL}?api_key=${WINDSOR_API_KEY}&${dateParams}&fields=date,video_audience_genders_gender,video_audience_genders_percentage&select_accounts=${tiktokAccountId}`,
    };
}
