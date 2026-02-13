'use client';

import { ReportResponse } from '@/lib/api';
import { KPICard } from './KPICard';
import { Chart } from './Chart';
import { TopVideoCard } from './TopVideoCard';
import { VideoTable } from './VideoTable';
import { DemographicsCard } from './DemographicsCard';

interface Props {
  report: ReportResponse;
}

export function ReportDashboard({ report }: Props) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/15 border border-white/20 rounded-3xl p-6">
        <h2 className="text-3xl font-black">{report.company.name}</h2>
        <p className="text-cyan-400 font-semibold mt-1">
          {report.dateRange.from} — {report.dateRange.to} &bull; {report.month.label}
        </p>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
          <KPICard label="Like" value={report.data.daily.totals.totalLikes} change={report.data.daily.totals.likesChange} />
          <KPICard label="Komment" value={report.data.daily.totals.totalComments} change={report.data.daily.totals.commentsChange} />
          <KPICard label="Megosztás" value={report.data.daily.totals.totalShares} change={report.data.daily.totals.sharesChange} />
          <KPICard label="Profilnézet" value={report.data.daily.totals.totalProfileViews} change={report.data.daily.totals.profileViewsChange} />
          <KPICard
            label="Új követők"
            value={`${report.data.daily.totals.totalNewFollowers >= 0 ? '+' : ''}${report.data.daily.totals.totalNewFollowers}`}
            change={report.data.daily.totals.newFollowersChange}
          />
          <KPICard label="Videók" value={report.data.video.totals.videoCount} change={report.data.video.totals.videoCountChange} />
          <KPICard label="Megtekintés" value={report.data.video.totals.totalViews} change={report.data.video.totals.viewsChange} />
          <KPICard label="Elérés" value={report.data.video.totals.totalReach} change={report.data.video.totals.reachChange} />
          <KPICard label="ER%" value={`${report.data.video.totals.avgEngagement.toFixed(2)}%`} />
          <KPICard label="Követők" value={report.data.daily.totals.currentFollowers} />
        </div>
      </div>

      {/* Charts Section */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">Napi trendek</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Chart type="bar" labels={report.data.daily.chartLabels} data={report.data.daily.likesData} label="Napi like-ok" color="#bc6aff" />
          <Chart type="line" labels={report.data.daily.chartLabels} data={report.data.daily.totalFollowersData} label="Követők száma" color="#00ff95" />
          <Chart type="bar" labels={report.data.daily.chartLabels} data={report.data.daily.commentsData} label="Kommentek" color="#ffce44" height={250} />
          <Chart type="bar" labels={report.data.daily.chartLabels} data={report.data.daily.sharesData} label="Megosztások" color="#4d96ff" height={250} />
        </div>
      </section>

      {/* Top 3 Videos */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">Top 3 videó</h3>
        <div className="space-y-3">
          {report.data.video.top3.length > 0 ? (
            report.data.video.top3.map((video, idx) => (
              <TopVideoCard key={idx} video={video} rank={idx + 1} />
            ))
          ) : (
            <p className="text-slate-400">Nincs videó ebben a hónapban</p>
          )}
        </div>
      </section>

      {/* Video Table */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">Videó lista</h3>
        <VideoTable videos={report.data.video.videos} />
      </section>

      {/* Demographics */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">Közönség megoszlása</h3>
        <DemographicsCard demographics={report.data.demographics} />
      </section>
    </div>
  );
}
