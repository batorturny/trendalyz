import { Video } from '@/lib/api';
import { Eye, Heart, MessageCircle, Repeat2, Clock, MonitorPlay } from 'lucide-react';

interface TopVideoCardProps {
    video: Video;
    rank: number;
}

export function TopVideoCard({ video, rank }: TopVideoCardProps) {
    const date = video.datetime
        ? new Date(video.datetime).toLocaleDateString('hu-HU')
        : 'N/A';

    return (
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4 hover:shadow-[var(--shadow-md)] transition-all shadow-[var(--shadow-card)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white dark:text-[var(--surface)] flex items-center justify-center font-bold text-lg">
                #{rank}
            </div>

            <div className="flex-1">
                <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">{date}</div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {(video.views ?? 0).toLocaleString('hu-HU')}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {(video.likes ?? 0).toLocaleString('hu-HU')}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {(video.comments ?? 0).toLocaleString('hu-HU')}</span>
                    <span className="flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" /> {(video.shares ?? 0).toLocaleString('hu-HU')}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold text-[var(--text-secondary)] mt-1 opacity-70">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {video.watchTimeFormatted}</span>
                    <span className="flex items-center gap-1"><MonitorPlay className="w-3.5 h-3.5" /> {video.fullWatchRate.toFixed(1)}% végignézés</span>
                </div>
            </div>

            <a
                href={video.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[var(--accent)] text-white dark:text-[var(--surface)] text-xs font-bold rounded-xl hover:opacity-80 transition-colors"
            >
                Megnyitás
            </a>
        </div>
    );
}
