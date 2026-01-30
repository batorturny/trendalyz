import { Video } from '@/lib/api';

interface TopVideoCardProps {
    video: Video;
    rank: number;
}

export function TopVideoCard({ video, rank }: TopVideoCardProps) {
    const date = video.datetime
        ? new Date(video.datetime).toLocaleDateString('hu-HU')
        : 'N/A';

    return (
        <div className="bg-white/5 border border-white/15 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-400 text-slate-900 flex items-center justify-center font-black text-lg">
                #{rank}
            </div>

            <div className="flex-1">
                <div className="text-xs font-bold text-slate-400 mb-1">{date}</div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-300">
                    <span>👁️ {video.views.toLocaleString('hu-HU')}</span>
                    <span>❤️ {video.likes.toLocaleString('hu-HU')}</span>
                    <span>💬 {video.comments.toLocaleString('hu-HU')}</span>
                    <span>🔁 {video.shares.toLocaleString('hu-HU')}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-400 mt-1">
                    <span>⏱️ {video.watchTimeFormatted}</span>
                    <span>📺 {video.fullWatchRate.toFixed(1)}% végignézés</span>
                </div>
            </div>

            <a
                href={video.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-500 text-white text-xs font-bold rounded-xl hover:bg-purple-400 transition-colors"
            >
                Megnyitás
            </a>
        </div>
    );
}
