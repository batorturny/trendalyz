'use client';

import { ReportResponse } from '@/lib/api';
import { REPORT_KPIS } from '@/lib/reportKpis';
import { KPICard } from './KPICard';
import { ChartLazy as Chart } from './ChartLazy';
import { TopVideoCard } from './TopVideoCard';
import { VideoTable } from './VideoTable';
import { DemographicsCard } from './DemographicsCard';
import { ReportSummaryEditor } from './ReportSummaryEditor';

interface Props {
  report: ReportResponse;
}

export function ReportDashboard({ report }: Props) {
  const monthStr = `${report.month.year}-${String(report.month.month).padStart(2, '0')}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-3xl font-bold">{report.company.name}</h2>
        <p className="text-[var(--text-secondary)] font-semibold mt-1">
          {report.dateRange.from} — {report.dateRange.to} &bull; {report.month.label}
        </p>

        {/* Admin Summary */}
        <div className="mt-6 border-t border-[var(--border)] pt-6">
          <ReportSummaryEditor companyId={report.company.id} month={monthStr} />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
        {REPORT_KPIS.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.getValue(report)}
            change={kpi.getChange?.(report)}
            description={kpi.description}
          />
        ))}
      </div>

      {/* Top 3 Videos */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-[var(--platform-tiktok)] pl-3">Top 3 videó</h3>
        <div className="space-y-3">
          {report.data.video.top3.length > 0 ? (
            report.data.video.top3.map((video, idx) => (
              <TopVideoCard key={idx} video={video} rank={idx + 1} />
            ))
          ) : (
            <p className="text-[var(--text-secondary)]">Nincs videó ebben a hónapban</p>
          )}
        </div>
      </section>

      {/* Video Table */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-[var(--platform-tiktok)] pl-3">Videó lista</h3>
        <VideoTable videos={report.data.video.videos} />
      </section>

      {/* Demographics */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-[var(--platform-tiktok)] pl-3">Közönség megoszlása</h3>
        <DemographicsCard demographics={report.data.demographics} />
      </section>
    </div>
  );
}
