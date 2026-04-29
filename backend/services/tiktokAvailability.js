// ============================================
// TIKTOK VIDEO AVAILABILITY CHECK
// Decides whether a TikTok video URL is still publicly available
// (i.e. not deleted, not private, not region-locked into oblivion).
// Uses TikTok's public oEmbed endpoint with an in-memory TTL cache.
// ============================================

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT_MS = 8000;
const cache = new Map(); // shareUrl -> { available: boolean, ts: number }

function buildShareUrl(video) {
    const direct = video.video_share_url || video.video_embed_url;
    if (direct && /^https?:\/\//.test(direct)) return direct;
    if (video.video_id) {
        // Fallback — works as oEmbed input even without username when TikTok resolves it
        return `https://www.tiktok.com/video/${video.video_id}`;
    }
    return null;
}

async function checkOne(url) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.available;
    }

    let available = false;
    try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: { 'User-Agent': 'Trendalyz/1.0 (+report-tooling)' },
        });
        if (res.ok) {
            const json = await res.json().catch(() => null);
            // oEmbed returns 200 with HTML/title for live videos.
            // For deleted/private posts TikTok returns 404 OR 200 with status_code !== 0.
            available = !!(json && (json.status_code === 0 || json.title || json.html));
        }
    } catch {
        available = false;
    }

    cache.set(url, { available, ts: Date.now() });
    return available;
}

/**
 * Filter a video list down to currently-available TikTok videos.
 * Non-TikTok rows (no share/embed url, no video_id) pass through unchanged.
 * Runs availability checks in parallel.
 */
async function filterAvailableTikTokVideos(videos) {
    if (!Array.isArray(videos) || videos.length === 0) return videos;

    const checks = videos.map(async (v) => {
        const url = buildShareUrl(v);
        if (!url) return { v, keep: true }; // unknown source — keep
        const available = await checkOne(url);
        return { v, keep: available };
    });

    const results = await Promise.all(checks);
    return results.filter(r => r.keep).map(r => r.v);
}

module.exports = { filterAvailableTikTokVideos, checkOne, buildShareUrl };
