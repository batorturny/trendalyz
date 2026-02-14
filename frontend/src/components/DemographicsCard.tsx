import { Demographics } from '@/lib/api';

interface DemographicsCardProps {
    demographics: Demographics;
}

export function DemographicsCard({ demographics }: DemographicsCardProps) {
    // Activity chart
    const activityChart = {
        type: 'line',
        data: {
            labels: demographics.activityLabels,
            datasets: [{
                label: 'Aktivitás',
                data: demographics.activity,
                borderColor: '#00f2ff',
                fill: false,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } }, datalabels: { display: false } },
            scales: {
                x: { ticks: { color: '#fff', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, beginAtZero: true }
            }
        }
    };
    const activityUrl = `https://quickchart.io/chart?w=800&h=280&bkg=transparent&c=${encodeURIComponent(JSON.stringify(activityChart))}`;

    return (
        <div className="space-y-4">
            {/* Gender */}
            <div className="bg-slate-900 border border-white/15 rounded-2xl p-4">
                <div className="text-cyan-400 text-xs font-bold uppercase mb-3">Nemek szerinti megoszlás</div>
                <table className="w-full text-sm">
                    <thead className="text-left text-xs font-bold text-cyan-400 uppercase bg-cyan-500/10">
                        <tr>
                            <th className="px-3 py-2">Nem</th>
                            <th className="px-3 py-2 text-right">Havi átlag</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-white/5">
                            <td className="px-3 py-2 text-slate-300"><span className="inline-block w-2 h-2 rounded-full bg-cyan-400 mr-2"></span>Nő</td>
                            <td className="px-3 py-2 text-right font-bold text-white">{demographics.gender.female.toFixed(2)}%</td>
                        </tr>
                        <tr className="border-t border-white/5">
                            <td className="px-3 py-2 text-slate-300"><span className="inline-block w-2 h-2 rounded-full bg-pink-400 mr-2"></span>Férfi</td>
                            <td className="px-3 py-2 text-right font-bold text-white">{demographics.gender.male.toFixed(2)}%</td>
                        </tr>
                        <tr className="border-t border-white/5">
                            <td className="px-3 py-2 text-slate-300"><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>Egyéb</td>
                            <td className="px-3 py-2 text-right font-bold text-white">{demographics.gender.other.toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Age */}
            <div className="bg-slate-900 border border-white/15 rounded-2xl p-4">
                <div className="text-cyan-400 text-xs font-bold uppercase mb-3">Korosztályos megoszlás</div>
                <table className="w-full text-sm">
                    <thead className="text-left text-xs font-bold text-cyan-400 uppercase bg-cyan-500/10">
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
                            <tr key={bucket} className="border-t border-white/5">
                                <td className="px-3 py-2 text-slate-300 font-semibold">{bucket}</td>
                                <td className="px-3 py-2 text-right font-bold text-white">{value.toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Activity */}
            <div className="bg-slate-900 border border-white/15 rounded-2xl p-4">
                <div className="text-cyan-400 text-xs font-bold uppercase mb-3">Aktivitás napszak szerint</div>
                <img src={activityUrl} alt="Activity chart" className="w-full h-auto" />
            </div>
        </div>
    );
}
