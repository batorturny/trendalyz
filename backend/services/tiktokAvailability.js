// ============================================
// TIKTOK VIDEO AVAILABILITY CHECK
// Decides whether a TikTok video URL is still publicly available
// (i.e. not deleted, not private, not region-locked into oblivion).
// Uses TikTok's public oEmbed endpoint with an in-memory TTL cache.
// ============================================

const TTL_LIVE_MS = 24 * 60 * 60 * 1000;
const TTL_GONE_MS = 24 * 60 * 60 * 1000;
const TTL_UNKNOWN_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
const CONCURRENCY = 8;

const cache = new Map();

function buildShareUrl(video) {
    const direct = video.video_share_url || video.video_embed_url;
    if (direct && /^https?:\/\//.test(direct)) return direct;
    if (video.video_id) {
        return `https://www.tiktok.com/video/${video.video_id}`;
    }
    return null;
}

async function checkOne(url) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.ts < cached.ttl) {
        return cached.available;
    }

    let available = false;
    let ttl = TTL_GONE_MS;
    try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: { 'User-Agent': 'Trendalyz/1.0 (+report-tooling)' },
        });
        if (res.ok) {
            const json = await res.json().catch(() => null);
            available = !!(json && (json.status_code === 0 || json.title || json.html));
            ttl = available ? TTL_LIVE_MS : TTL_GONE_MS;
        } else if (res.status === 404 || res.status === 410) {
            available = false;
            ttl = TTL_GONE_MS;
        } else {
            // Throttling / transient — don't poison the cache for a day.
            ttl = TTL_UNKNOWN_MS;
            available = true; // fail-open during incidents so live videos don't disappear
        }
    } catch {
        ttl = TTL_UNKNOWN_MS;
        available = true;
    }

    cache.set(url, { available, ts: Date.now(), ttl });
    return available;
}

async function mapWithLimit(items, limit, fn) {
    const out = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (true) {
            const idx = next++;
            if (idx >= items.length) return;
            out[idx] = await fn(items[idx], idx);
        }
    });
    await Promise.all(workers);
    return out;
}

/**
 * Filter a video list down to currently-available TikTok videos.
 * Non-TikTok rows (no share/embed url, no video_id) pass through unchanged.
 */
async function filterAvailableTikTokVideos(videos) {
    if (!Array.isArray(videos) || videos.length === 0) return videos;

    const decisions = await mapWithLimit(videos, CONCURRENCY, async (v) => {
        const url = buildShareUrl(v);
        if (!url) return true;
        return await checkOne(url);
    });

    return videos.filter((_, i) => decisions[i]);
}

module.exports = { filterAvailableTikTokVideos, checkOne, buildShareUrl };
