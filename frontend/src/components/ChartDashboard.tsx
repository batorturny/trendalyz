'use client';

import { ChartData } from '@/lib/api';
import { Chart } from './Chart';
import { VideoTable as VideoTableComponent } from './VideoTable';
import { BarChart3 } from 'lucide-react';

interface Props {
  results: ChartData[];
  loading: boolean;
}

export function ChartDashboard({ results, loading }: Props) {
  if (results.length > 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-l-4 border-[var(--accent)] pl-3">Generált chartok</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((chart, i) => (
            <div key={`${chart.key}-${i}`}>
              {chart.error ? (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
                  <h3 className="font-bold text-[var(--error)]">{chart.key}</h3>
                  <p className="text-[var(--error)] text-sm opacity-80">{chart.error}</p>
                </div>
              ) : chart.empty || !chart.data ? (
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-6">
                  <h3 className="font-bold text-[var(--text-secondary)]">{chart.title || chart.key}</h3>
                  <p className="text-[var(--text-secondary)] text-sm opacity-60">Nincs adat</p>
                </div>
              ) : chart.type === 'table' ? (
                <VideoTableComponent
                  chartVideos={chart.data.series?.[0]?.data as any || []}
                  title={chart.title}
                  color={chart.color}
                />
              ) : (
                <Chart
                  type={chart.type as 'line' | 'bar'}
                  labels={chart.data.labels || []}
                  data={(chart.data.series?.[0]?.data || []) as number[]}
                  label={chart.data.series?.[0]?.name || chart.title}
                  color={chart.color}
                  title={chart.title}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading) {
    return (
      <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Válaszd ki a chartokat</h2>
        <p className="text-[var(--text-secondary)]">Jelöld be a kívánt chartokat és kattints a Generálás gombra</p>
      </div>
    );
  }

  return null;
}
