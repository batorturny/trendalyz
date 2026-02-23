import { Video } from '@/lib/api';

interface ChartVideo {
    id: string | null;
    caption: string;
    date: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    link: string;
}

interface VideoTableProps {
    videos?: Video[];
    chartVideos?: ChartVideo[];
    title?: string;
    color?: string;
}

export function VideoTable({ videos, chartVideos, title, color }: VideoTableProps) {
    // Chart table mode - video data from chart API
    if (chartVideos !== undefined) {
        const filtered = chartVideos.filter(v => v.views > 0 || v.caption !== '-');

        return (
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 lg:col-span-2 shadow-[var(--shadow-card)]">
                {title && (
                    <div className="text-xs font-bold uppercase mb-3" style={{ color: color || '#6b7280' }}>{title}</div>
                )}
                {filtered.length === 0 ? (
                    <p className="text-[var(--text-secondary)] text-sm text-center py-4">Nincs videó adat</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                                    <th className="px-3 py-2">Dátum</th>
                                    <th className="px-3 py-2 max-w-[300px]">Caption</th>
                                    <th className="px-3 py-2 text-right">Megtekintés</th>
                                    <th className="px-3 py-2 text-right">Like</th>
                                    <th className="px-3 py-2 text-right">Komment</th>
                                    <th className="px-3 py-2 text-right">Megosztás</th>
                                    <th className="px-3 py-2">Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((video, idx) => (
                                    <tr key={idx} className="border-t border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)]">
                                        <td className="px-3 py-2 whitespace-nowrap">{video.date}</td>
                                        <td className="px-3 py-2 max-w-[300px] truncate" title={video.caption}>
                                            {video.caption}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-[var(--text-primary)]">{(video.views ?? 0).toLocaleString('hu-HU')}</td>
                                        <td className="px-3 py-2 text-right">{(video.likes ?? 0).toLocaleString('hu-HU')}</td>
                                        <td className="px-3 py-2 text-right">{(video.comments ?? 0).toLocaleString('hu-HU')}</td>
                                        <td className="px-3 py-2 text-right">{(video.shares ?? 0).toLocaleString('hu-HU')}</td>
                                        <td className="px-3 py-2">
                                            {video.link && video.link !== '#' ? (
                                                <a
                                                    href={video.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2 py-1 bg-[var(--accent)] text-white dark:text-[var(--surface)] text-xs font-bold rounded-lg hover:opacity-80"
                                                >
                                                    Link
                                                </a>
                                            ) : (
                                                <span className="text-[var(--text-secondary)] text-xs opacity-50">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    // Standard video table mode (from report)
    if (!videos || videos.length === 0) {
        return (
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-6 text-center text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
                Nincs videó ebben a hónapban
            </div>
        );
    }

    return (
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 overflow-x-auto shadow-[var(--shadow-card)]">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                        <th className="px-3 py-2">Dátum</th>
                        <th className="px-3 py-2">Megtekintés</th>
                        <th className="px-3 py-2">Elérés</th>
                        <th className="px-3 py-2">Like</th>
                        <th className="px-3 py-2">Komment</th>
                        <th className="px-3 py-2">Megosztás</th>
                        <th className="px-3 py-2">Követő</th>
                        <th className="px-3 py-2">ER%</th>
                        <th className="px-3 py-2">Link</th>
                    </tr>
                </thead>
                <tbody>
                    {videos.map((video, idx) => {
                        const date = video.datetime
                            ? new Date(video.datetime).toLocaleDateString('hu-HU')
                            : '';
                        return (
                            <tr key={idx} className="border-t border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)]">
                                <td className="px-3 py-2">{date}</td>
                                <td className="px-3 py-2">{(video.views ?? 0).toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{(video.reach ?? 0).toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{(video.likes ?? 0).toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{(video.comments ?? 0).toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{(video.shares ?? 0).toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">+{(video.newFollowers ?? 0).toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{video.engagementRate.toFixed(2)}%</td>
                                <td className="px-3 py-2">
                                    <a
                                        href={video.embedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 bg-[var(--accent)] text-white dark:text-[var(--surface)] text-xs font-bold rounded-lg hover:opacity-80"
                                    >
                                        Link
                                    </a>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
