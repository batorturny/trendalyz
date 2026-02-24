import { Video } from '@/lib/api';

// Maps column labels (Hungarian + English) to data object property names
const LABEL_TO_KEY: Record<string, string> = {
    // Hungarian labels
    'Dátum': 'date',
    'Üzenet': 'caption',
    'Cím': 'title',
    'Impresszió': 'views',
    'Impressziók': 'impressions',
    'Megtekintés': 'views',
    'Elérés': 'reach',
    'Reakció': 'likes',
    'Like': 'likes',
    'Komment': 'comments',
    'Megosztás': 'shares',
    'Kattintás': 'clicks',
    'Videó nézés': 'videoViews',
    'Autoplay': 'views',
    'Kattintásra': 'clickToPlay',
    'Organikus': 'organic',
    'Egyedi': 'unique',
    'Új követők': 'newFollowers',
    'Végignézés%': 'fullWatchRate',
    'Átl. nézési idő': 'avgWatchTime',
    'ER%': 'engagementRate',
    'Nézési%': 'avgViewPercentage',
    'Mentések': 'saved',
    'Típus': 'type',
    'Like-ok': 'likes',
    'Kommentek': 'comments',
    'Megosztások': 'shares',
    // English labels (from TikTok/YouTube video tables)
    'Caption': 'caption',
    'Views': 'views',
    'Likes': 'likes',
    'Comments': 'comments',
    'Shares': 'shares',
    'Link': 'link',
    // TikTok Ads table labels
    'Kampány': 'campaign',
    'Csoport': 'adgroup',
    'Konverziók': 'conversions',
    'CPC': 'cpc',
    'CTR%': 'ctr',
    'Költés': 'spend',
};

const TEXT_COLUMNS = new Set(['date', 'caption', 'link', 'type', 'title']);

interface VideoTableProps {
    videos?: Video[];
    chartVideos?: any[];
    chartLabels?: string[];
    title?: string;
    color?: string;
}

export function VideoTable({ videos, chartVideos, chartLabels, title, color }: VideoTableProps) {
    // Chart table mode - video data from chart API
    if (chartVideos !== undefined) {
        const filtered = chartVideos.filter(v =>
            (v.views ?? 0) > 0 || (v.reach ?? 0) > 0 || (v.likes ?? 0) > 0 ||
            (v.impressions ?? 0) > 0 || (v.caption && v.caption !== '-') || (v.title && v.title !== '-')
        );

        // Build columns from labels if provided, otherwise use defaults
        const columns = chartLabels
            ? chartLabels.map(label => ({ label, key: LABEL_TO_KEY[label] || label.toLowerCase() }))
            : [
                { label: 'Dátum', key: 'date' },
                { label: 'Caption', key: 'caption' },
                { label: 'Megtekintés', key: 'views' },
                { label: 'Like', key: 'likes' },
                { label: 'Komment', key: 'comments' },
                { label: 'Megosztás', key: 'shares' },
                { label: 'Link', key: 'link' },
            ];

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
                                    {columns.map(col => (
                                        <th
                                            key={col.key}
                                            className={`px-3 py-2 ${col.key === 'caption' || col.key === 'title' ? 'max-w-[300px]' : ''} ${!TEXT_COLUMNS.has(col.key) ? 'text-right' : ''}`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((video, idx) => (
                                    <tr key={idx} className="border-t border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)]">
                                        {columns.map(col => {
                                            if (col.key === 'link') {
                                                return (
                                                    <td key={col.key} className="px-3 py-2">
                                                        {video.link && video.link !== '#' ? (
                                                            <a href={video.link} target="_blank" rel="noopener noreferrer"
                                                                className="px-2 py-1 bg-[var(--accent)] text-white dark:text-[var(--surface)] text-xs font-bold rounded-lg hover:opacity-80">
                                                                Link
                                                            </a>
                                                        ) : (
                                                            <span className="text-[var(--text-secondary)] text-xs opacity-50">-</span>
                                                        )}
                                                    </td>
                                                );
                                            }
                                            if (col.key === 'caption' || col.key === 'title') {
                                                const text = video[col.key] || '-';
                                                return (
                                                    <td key={col.key} className="px-3 py-2 max-w-[300px] truncate" title={text}>
                                                        {text}
                                                    </td>
                                                );
                                            }
                                            if (col.key === 'date') {
                                                return <td key={col.key} className="px-3 py-2 whitespace-nowrap">{video.date}</td>;
                                            }
                                            // Numeric column
                                            const val = video[col.key] ?? 0;
                                            const isMainMetric = col.key === 'views';
                                            return (
                                                <td key={col.key} className={`px-3 py-2 text-right ${isMainMetric ? 'font-semibold text-[var(--text-primary)]' : ''}`}>
                                                    {(typeof val === 'number' ? val : 0).toLocaleString('hu-HU')}
                                                </td>
                                            );
                                        })}
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
