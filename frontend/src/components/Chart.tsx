interface ChartProps {
    type: 'bar' | 'line';
    labels: string[];
    data: number[];
    label: string;
    color?: string;
    height?: number;
    title?: string;
}

export function Chart({ type, labels, data, label, color = '#bc6aff', height = 300, title }: ChartProps) {
    const chart = {
        type,
        data: {
            labels: labels.slice(0, 31),
            datasets: [{
                label,
                data: data.slice(0, 31),
                ...(type === 'bar'
                    ? { backgroundColor: color }
                    : { borderColor: color, fill: false, borderWidth: 3, tension: 0.3 })
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, labels: { color: '#fff', font: { size: 12, weight: 'bold' } } },
                datalabels: { display: false }
            },
            scales: {
                x: { ticks: { color: '#fff', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: '#fff', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.1)' }, beginAtZero: true }
            }
        }
    };

    const chartUrl = `https://quickchart.io/chart?w=800&h=${height}&bkg=transparent&c=${encodeURIComponent(JSON.stringify(chart))}`;

    return (
        <div className="bg-slate-900 border border-white/15 rounded-2xl p-4">
            <div className="text-cyan-400 text-xs font-bold uppercase mb-3">{title || label}</div>
            <img src={chartUrl} alt={title || label} className="w-full h-auto" />
        </div>
    );
}
