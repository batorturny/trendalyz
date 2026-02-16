'use client';

import { useRef } from 'react';
import { useTheme } from './ThemeProvider';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

interface ChartProps {
  type: 'bar' | 'line';
  labels: string[];
  data: number[];
  label: string;
  color?: string;
  height?: number;
  title?: string;
  beginAtZero?: boolean;
}

export function Chart({ type, labels, data, label, color = '#bc6aff', height = 300, title, beginAtZero: beginAtZeroProp = true }: ChartProps) {
  const { theme } = useTheme();
  const chartRef = useRef<ChartJS<'bar' | 'line'>>(null);

  const textColor = theme === 'dark' ? '#e5e5e5' : '#374151';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const trimmedLabels = labels.slice(0, 31);
  const trimmedData = data.slice(0, 31);

  const chartData = {
    labels: trimmedLabels,
    datasets: [
      {
        label,
        data: trimmedData,
        ...(type === 'bar'
          ? {
              backgroundColor: color,
              hoverBackgroundColor: `color-mix(in srgb, ${color} 80%, white)`,
              borderRadius: 4,
              borderSkipped: 'bottom' as const,
            }
          : {
              borderColor: color,
              backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
              fill: true,
              borderWidth: 2.5,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 7,
              pointBackgroundColor: color,
              pointBorderColor: theme === 'dark' ? '#1a1a1e' : '#ffffff',
              pointBorderWidth: 2,
              pointHoverBorderWidth: 3,
              pointHoverBackgroundColor: color,
              pointHoverBorderColor: theme === 'dark' ? '#1a1a1e' : '#ffffff',
            }),
      },
    ],
  };

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: textColor,
          font: { size: 12, weight: 'bold' },
          usePointStyle: true,
          pointStyle: type === 'line' ? 'circle' : 'rectRounded',
          padding: 16,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: theme === 'dark' ? '#26262b' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e5e5' : '#111827',
        bodyColor: theme === 'dark' ? '#e5e5e5' : '#374151',
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 13, weight: 'bold' },
        displayColors: true,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y;
            const formatted = typeof val === 'number'
              ? val.toLocaleString('hu-HU')
              : val;
            return ` ${ctx.dataset.label}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: textColor, font: { size: 9 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 15 },
        grid: { color: gridColor },
      },
      y: {
        ticks: {
          color: textColor,
          font: { size: 9 },
          callback: (val) => typeof val === 'number' ? val.toLocaleString('hu-HU') : val,
        },
        grid: { color: gridColor },
        beginAtZero: beginAtZeroProp,
        ...(!beginAtZeroProp && trimmedData.length > 0 ? (() => {
          const minVal = Math.min(...trimmedData);
          const maxVal = Math.max(...trimmedData);
          const range = maxVal - minVal || 1;
          const padding = range * 0.15;
          return {
            suggestedMin: Math.floor(minVal - padding),
            suggestedMax: Math.ceil(maxVal + padding),
          };
        })() : {}),
      },
    },
  };

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-card)]">
      <div className="text-[var(--text-secondary)] text-xs font-bold uppercase mb-3">{title || label}</div>
      <div style={{ height }}>
        {type === 'bar' ? (
          <Bar ref={chartRef as any} data={chartData} options={options as ChartOptions<'bar'>} />
        ) : (
          <Line ref={chartRef as any} data={chartData} options={options as ChartOptions<'line'>} />
        )}
      </div>
    </div>
  );
}
