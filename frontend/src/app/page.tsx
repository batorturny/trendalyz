'use client';

import { useState, useEffect } from 'react';
import { getCompanies, generateReport, Company, ReportResponse } from '@/lib/api';
import { KPICard } from '@/components/KPICard';
import { Chart } from '@/components/Chart';
import { TopVideoCard } from '@/components/TopVideoCard';
import { VideoTable } from '@/components/VideoTable';
import { DemographicsCard } from '@/components/DemographicsCard';

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);

  // Load companies on mount
  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(err => setError('Nem sikerült betölteni a cégeket: ' + err.message));

    // Default month: previous month
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedCompany || !selectedMonth) {
      setError('Kérlek válassz céget és hónapot!');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await generateReport({ companyId: selectedCompany, month: selectedMonth });
      setReport(result);
    } catch (err: any) {
      setError('Hiba történt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-black">📊 TikTok Report Generator</h1>
          <p className="text-cyan-400 font-semibold mt-2">Stratégiai jelentés generátor</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Form */}
        <div className="bg-white/5 border border-white/15 rounded-3xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cég kiválasztása</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Válassz céget...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Hónap</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '⏳ Generálás...' : '🚀 Riport generálása'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Report Dashboard */}
        {report && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/15 border border-white/20 rounded-3xl p-6">
              <h2 className="text-3xl font-black">{report.company.name}</h2>
              <p className="text-cyan-400 font-semibold mt-1">
                {report.dateRange.from} — {report.dateRange.to} • {report.month.label}
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
              <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">📈 Napi trendek</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Chart type="bar" labels={report.data.daily.chartLabels} data={report.data.daily.likesData} label="Napi like-ok" color="#bc6aff" />
                <Chart type="line" labels={report.data.daily.chartLabels} data={report.data.daily.totalFollowersData} label="Követők száma" color="#00ff95" />
                <Chart type="bar" labels={report.data.daily.chartLabels} data={report.data.daily.commentsData} label="Kommentek" color="#ffce44" height={250} />
                <Chart type="bar" labels={report.data.daily.chartLabels} data={report.data.daily.sharesData} label="Megosztások" color="#4d96ff" height={250} />
              </div>
            </section>

            {/* Top 3 Videos */}
            <section>
              <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">🏆 Top 3 videó</h3>
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
              <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">📋 Videó lista</h3>
              <VideoTable videos={report.data.video.videos} />
            </section>

            {/* Demographics */}
            <section>
              <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">👥 Közönség megoszlása</h3>
              <DemographicsCard demographics={report.data.demographics} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
