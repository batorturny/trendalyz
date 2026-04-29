// ============================================
// TIKTOK VIDEO AVAILABILITY CHECK
// Filters out deleted / private TikTok videos via the public oEmbed endpoint.
// In-memory TTL cache shared per Node.js process.
// ============================================

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

const cache = new Map<string, { available: boolean; ts: number }>();

interface VideoLike {
  video_id?: string;
  video_share_url?: string;
  video_embed_url?: string;
  [key: string]: unknown;
}

function buildShareUrl(video: VideoLike): string | null {
  const direct = (video.video_share_url || video.video_embed_url) as string | undefined;
  if (direct && /^https?:\/\//.test(direct)) return direct;
  if (video.video_id) return `https://www.tiktok.com/video/${video.video_id}`;
  return null;
}

async function checkOne(url: string): Promise<boolean> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.available;

  let available = false;
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': 'Trendalyz/1.0 (+report-tooling)' },
    });
    if (res.ok) {
      const json = await res.json().catch(() => null) as { status_code?: number; title?: string; html?: string } | null;
      available = !!(json && (json.status_code === 0 || json.title || json.html));
    }
  } catch {
    available = false;
  }

  cache.set(url, { available, ts: Date.now() });
  return available;
}

export async function filterAvailableTikTokVideos<T extends VideoLike>(videos: T[]): Promise<T[]> {
  if (!Array.isArray(videos) || videos.length === 0) return videos;
  const checks = videos.map(async (v) => {
    const url = buildShareUrl(v);
    if (!url) return { v, keep: true };
    const keep = await checkOne(url);
    return { v, keep };
  });
  const results = await Promise.all(checks);
  return results.filter(r => r.keep).map(r => r.v);
}
