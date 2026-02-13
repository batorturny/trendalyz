'use client';

import { ChartData } from '@/lib/api';
import { Chart } from './Chart';
import { VideoTable as VideoTableComponent } from './VideoTable';

interface Props {
  results: ChartData[];
  loading: boolean;
}

export function ChartDashboard({ results, loading }: Props) {
  if (results.length > 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-l-4 border-purple-500 pl-3">Generált chartok</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map(chart => (
            <div key={chart.key}>
              {chart.error ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                  <h3 className="font-bold text-red-400">{chart.key}</h3>
                  <p className="text-red-300 text-sm">{chart.error}</p>
                </div>
              ) : chart.empty ? (
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-400">{chart.title}</h3>
                  <p className="text-slate-500 text-sm">Nincs adat</p>
                </div>
              ) : chart.type === 'table' ? (
                <VideoTableComponent
                  data={chart.data.series[0]?.data || []}
                  title={chart.title}
                  color={chart.color}
                />
              ) : (
                <Chart
                  type={chart.type as 'line' | 'bar'}
                  labels={chart.data.labels}
                  data={chart.data.series[0]?.data || []}
                  label={chart.data.series[0]?.name || chart.title}
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
      <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-white mb-2">Válaszd ki a chartokat</h2>
        <p className="text-slate-400">Jelöld be a kívánt chartokat és kattints a Generálás gombra</p>
      </div>
    );
  }

  return null;
}
