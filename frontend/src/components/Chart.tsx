'use client';

import { useTheme } from './ThemeProvider';

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
    const { theme } = useTheme();

    const textColor = theme === 'dark' ? '#fff' : '#374151';
    const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const bkg = theme === 'dark' ? 'transparent' : '#ffffff';

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
                legend: { display: true, labels: { color: textColor, font: { size: 12, weight: 'bold' } } },
                datalabels: { display: false }
            },
            scales: {
                x: { ticks: { color: textColor, font: { size: 9 } }, grid: { color: gridColor } },
                y: { ticks: { color: textColor, font: { size: 9 } }, grid: { color: gridColor }, beginAtZero: true }
            }
        }
    };

    const chartUrl = `https://quickchart.io/chart?w=800&h=${height}&bkg=${encodeURIComponent(bkg)}&c=${encodeURIComponent(JSON.stringify(chart))}`;

    return (
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-card)]">
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase mb-3">{title || label}</div>
            <img src={chartUrl} alt={title || label} className="w-full h-auto" />
        </div>
    );
}
