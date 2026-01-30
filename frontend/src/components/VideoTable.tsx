import { Video } from '@/lib/api';

interface VideoTableProps {
    videos: Video[];
}

export function VideoTable({ videos }: VideoTableProps) {
    if (videos.length === 0) {
        return (
            <div className="bg-slate-900 border border-white/15 rounded-2xl p-6 text-center text-slate-400">
                Nincs videó ebben a hónapban
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-white/15 rounded-2xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs font-bold text-slate-400 uppercase">
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
                            <tr key={idx} className="border-t border-white/5 text-slate-300 hover:bg-white/5">
                                <td className="px-3 py-2">{date}</td>
                                <td className="px-3 py-2">{video.views.toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{video.reach.toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{video.likes.toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{video.comments.toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{video.shares.toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">+{video.newFollowers.toLocaleString('hu-HU')}</td>
                                <td className="px-3 py-2">{video.engagementRate.toFixed(2)}%</td>
                                <td className="px-3 py-2">
                                    <a
                                        href={video.embedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 bg-cyan-500 text-slate-900 text-xs font-bold rounded-lg hover:bg-cyan-400"
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
