'use client';

import { Demographics } from '@/lib/api';
import { useTheme } from './ThemeProvider';

interface DemographicsCardProps {
    demographics: Demographics;
}

export function DemographicsCard({ demographics }: DemographicsCardProps) {
    const { theme } = useTheme();

    const textColor = theme === 'dark' ? '#fff' : '#374151';
    const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const bkg = theme === 'dark' ? 'transparent' : '#ffffff';

    // Activity chart
    const activityChart = {
        type: 'line',
        data: {
            labels: demographics.activityLabels,
            datasets: [{
                label: 'Aktivitás',
                data: demographics.activity,
                borderColor: '#6366f1',
                fill: false,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: textColor } }, datalabels: { display: false } },
            scales: {
                x: { ticks: { color: textColor, font: { size: 9 } }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
            }
        }
    };
    const activityUrl = `https://quickchart.io/chart?w=800&h=280&bkg=${encodeURIComponent(bkg)}&c=${encodeURIComponent(JSON.stringify(activityChart))}`;

    return (
        <div className="space-y-4">
            {/* Gender */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-card)]">
                <div className="text-[var(--text-secondary)] text-xs font-bold uppercase mb-3">Nemek szerinti megoszlás</div>
                <table className="w-full text-sm">
                    <thead className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase bg-[var(--surface-raised)]">
                        <tr>
                            <th className="px-3 py-2">Nem</th>
                            <th className="px-3 py-2 text-right">Havi átlag</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-[var(--border)]">
                            <td className="px-3 py-2 text-[var(--text-secondary)]"><span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-2"></span>Nő</td>
                            <td className="px-3 py-2 text-right font-bold text-[var(--text-primary)]">{demographics.gender.female.toFixed(2)}%</td>
                        </tr>
                        <tr className="border-t border-[var(--border)]">
                            <td className="px-3 py-2 text-[var(--text-secondary)]"><span className="inline-block w-2 h-2 rounded-full bg-pink-500 mr-2"></span>Férfi</td>
                            <td className="px-3 py-2 text-right font-bold text-[var(--text-primary)]">{demographics.gender.male.toFixed(2)}%</td>
                        </tr>
                        <tr className="border-t border-[var(--border)]">
                            <td className="px-3 py-2 text-[var(--text-secondary)]"><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>Egyéb</td>
                            <td className="px-3 py-2 text-right font-bold text-[var(--text-primary)]">{demographics.gender.other.toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Age */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-card)]">
                <div className="text-[var(--text-secondary)] text-xs font-bold uppercase mb-3">Korosztályos megoszlás</div>
                <table className="w-full text-sm">
                    <thead className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase bg-[var(--surface-raised)]">
                        <tr>
                            <th className="px-3 py-2">Korosztály</th>
                            <th className="px-3 py-2 text-right">Havi átlag</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(demographics.age)
                            .sort(([a], [b]) => {
                                const numA = parseInt(a.replace('+', '')) || 0;
                                const numB = parseInt(b.replace('+', '')) || 0;
                                return numA - numB;
                            })
                            .map(([bucket, value]) => (
                            <tr key={bucket} className="border-t border-[var(--border)]">
                                <td className="px-3 py-2 text-[var(--text-secondary)] font-semibold">{bucket}</td>
                                <td className="px-3 py-2 text-right font-bold text-[var(--text-primary)]">{value.toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Activity */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-card)]">
                <div className="text-[var(--text-secondary)] text-xs font-bold uppercase mb-3">Aktivitás napszak szerint</div>
                <img src={activityUrl} alt="Activity chart" className="w-full h-auto" />
            </div>
        </div>
    );
}
