"use client";

import { useState, useEffect } from "react";
import { companies, getMonthOptions } from "@/lib/config";

interface VideoData {
  datetime: string;
  embedUrl: string;
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  newFollowers: number;
  engagementRate: number;
  watchTimeFormatted: string;
  fullWatchRate: number;
}

interface ReportData {
  companyName: string;
  dateRange: { from: string; to: string };
  daily: {
    chartLabels: string[];
    likesData: number[];
    commentsData: number[];
    sharesData: number[];
    profileViewsData: number[];
    totalFollowersData: number[];
    totals: {
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      totalProfileViews: number;
      totalNewFollowers: number;
      currentFollowers: number;
      likesChange: number;
      commentsChange: number;
      sharesChange: number;
      profileViewsChange: number;
      newFollowersChange: number;
    };
  };
  video: {
    videos: VideoData[];
    top3: VideoData[];
    totals: {
      totalViews: number;
      totalReach: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      videoCount: number;
      avgEngagement: number;
      viewsChange: number;
      reachChange: number;
    };
  };
  demographics: {
    gender: { female: number; male: number; other: number };
    age: Record<string, number>;
    activity: number[];
    activityLabels: string[];
  };
}

function formatNumber(n: number): string {
  return n.toLocaleString("hu-HU");
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function ChangeBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`badge ${isPositive ? "badge-success" : "badge-danger"}`}>
      {isPositive ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
}) {
  return (
    <div className="glass-card stat-card p-6">
      <div className="flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
        {change !== undefined && <ChangeBadge value={change} />}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-black">{typeof value === "number" ? formatNumber(value) : value}</div>
        <div className="mt-1 text-sm font-semibold uppercase tracking-wider text-gray-400">{label}</div>
      </div>
    </div>
  );
}

function VideoCard({ video, rank }: { video: VideoData; rank?: number }) {
  const dt = video.datetime ? new Date(video.datetime) : null;
  const dateStr = dt ? dt.toLocaleDateString("hu-HU") : "N/A";

  return (
    <a
      href={video.embedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card block p-4 transition-all hover:scale-[1.02] hover:border-[#00f2ff] cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {rank && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00f2ff] to-[#bc6aff] font-black text-[#020617]">
            #{rank}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>📅 {dateStr}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <span className="text-gray-400">👁️</span> <span className="font-bold">{formatNumber(video.views)}</span>
            </div>
            <div>
              <span className="text-gray-400">📢</span> <span className="font-bold">{formatNumber(video.reach)}</span>
            </div>
            <div>
              <span className="text-gray-400">❤️</span> <span className="font-bold">{formatNumber(video.likes)}</span>
            </div>
            <div>
              <span className="text-gray-400">💬</span> <span className="font-bold">{formatNumber(video.comments)}</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
            <span>🔁 {formatNumber(video.shares)}</span>
            <span>👥 +{formatNumber(video.newFollowers)}</span>
            <span>📈 {formatPercent(video.engagementRate)} ER</span>
            <span>⏱️ {video.watchTimeFormatted}</span>
            <span>📺 {formatPercent(video.fullWatchRate)} végignézés</span>
          </div>
        </div>
        <div className="text-2xl">▶️</div>
      </div>
    </a>
  );
}

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState(companies[0].id);
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[1]?.value || monthOptions[0].value); // Previous month by default
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    const monthData = monthOptions.find((m) => m.value === selectedMonth);
    if (!monthData) return;

    try {
      const res = await fetch(
        `/api/report?companyId=${selectedCompany}&dateFrom=${monthData.dateFrom}&dateTo=${monthData.dateTo}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError("Hiba történt az adatok lekérésekor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedCompany, selectedMonth]);

  return (
    <div className="min-h-screen p-6 lg:p-10">
      {/* Header with Selectors */}
      <header className="glass-card mb-8 overflow-hidden p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="gradient-text text-4xl font-black tracking-tight lg:text-5xl">TikTok Report</h1>
            {report && (
              <>
                <p className="mt-2 text-lg font-semibold text-[#bc6aff]">{report.companyName}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {report.dateRange.from} — {report.dateRange.to}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-400">Cég</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="h-12 w-full min-w-[200px] rounded-xl border border-white/20 bg-white/5 px-4 font-semibold text-white backdrop-blur-md focus:border-[#00f2ff] focus:outline-none"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#020617]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-400">Hónap</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-12 w-full min-w-[150px] rounded-xl border border-white/20 bg-white/5 px-4 font-semibold text-white backdrop-blur-md focus:border-[#00f2ff] focus:outline-none"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value} className="bg-[#020617]">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00f2ff] border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="glass-card mb-8 border-red-500/50 p-6 text-center text-red-400">
          {error}
        </div>
      )}

      {report && !loading && (
        <>
          {/* Stats Grid */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">📊 Összefoglaló</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <StatCard
                icon="❤️"
                label="Like-ok"
                value={report.daily.totals.totalLikes}
                change={report.daily.totals.likesChange}
              />
              <StatCard
                icon="💬"
                label="Kommentek"
                value={report.daily.totals.totalComments}
                change={report.daily.totals.commentsChange}
              />
              <StatCard
                icon="🔁"
                label="Megosztások"
                value={report.daily.totals.totalShares}
                change={report.daily.totals.sharesChange}
              />
              <StatCard
                icon="👁️"
                label="Profilnézetek"
                value={report.daily.totals.totalProfileViews}
                change={report.daily.totals.profileViewsChange}
              />
              <StatCard
                icon="👥"
                label="Új követők"
                value={`${report.daily.totals.totalNewFollowers >= 0 ? "+" : ""}${formatNumber(report.daily.totals.totalNewFollowers)}`}
                change={report.daily.totals.newFollowersChange}
              />
            </div>
          </section>

          {/* Video Stats */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">🎬 Videó statisztika</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon="📹" label="Videók száma" value={report.video.totals.videoCount} />
              <StatCard
                icon="👀"
                label="Össz megtekintés"
                value={report.video.totals.totalViews}
                change={report.video.totals.viewsChange}
              />
              <StatCard
                icon="📢"
                label="Össz elérés"
                value={report.video.totals.totalReach}
                change={report.video.totals.reachChange}
              />
              <StatCard icon="📈" label="Átlag ER%" value={formatPercent(report.video.totals.avgEngagement)} />
            </div>
          </section>

          {/* Top 3 Videos */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">🏆 Top 3 videó (megtekintés alapján)</h2>
            <div className="grid gap-4">
              {report.video.top3.length > 0 ? (
                report.video.top3.map((v, i) => <VideoCard key={v.embedUrl} video={v} rank={i + 1} />)
              ) : (
                <p className="text-gray-400">Nincs videó ebben a hónapban</p>
              )}
            </div>
          </section>

          {/* All Videos */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">📋 Összes videó ({report.video.videos.length} db)</h2>
            <div className="grid gap-3">
              {report.video.videos.length > 0 ? (
                report.video.videos.map((v) => <VideoCard key={v.embedUrl} video={v} />)
              ) : (
                <p className="text-gray-400">Nincs videó ebben a hónapban</p>
              )}
            </div>
          </section>

          {/* Demographics */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">👥 Demográfia</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Gender */}
              <div className="glass-card p-6">
                <h3 className="mb-4 text-lg font-bold text-[#00f2ff]">Nemek</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>👩 Nő</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                        <div
                          className="h-full bg-[#00f2ff]"
                          style={{ width: `${Math.min(100, report.demographics.gender.female)}%` }}
                        />
                      </div>
                      <span className="font-bold">{formatPercent(report.demographics.gender.female)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>👨 Férfi</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                        <div
                          className="h-full bg-[#bc6aff]"
                          style={{ width: `${Math.min(100, report.demographics.gender.male)}%` }}
                        />
                      </div>
                      <span className="font-bold">{formatPercent(report.demographics.gender.male)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🧑 Egyéb</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                        <div
                          className="h-full bg-[#ffce44]"
                          style={{ width: `${Math.min(100, report.demographics.gender.other)}%` }}
                        />
                      </div>
                      <span className="font-bold">{formatPercent(report.demographics.gender.other)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Age */}
              <div className="glass-card p-6">
                <h3 className="mb-4 text-lg font-bold text-[#00f2ff]">Korosztály</h3>
                <div className="space-y-3">
                  {Object.entries(report.demographics.age).map(([age, percent]) => (
                    <div key={age} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{age}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                          <div
                            className="h-full bg-gradient-to-r from-[#00f2ff] to-[#bc6aff]"
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <span className="font-bold">{formatPercent(percent)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Activity Chart */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">⏰ Aktivitás napszak szerint</h2>
            <div className="chart-container">
              <div className="flex h-40 items-end justify-between gap-1">
                {report.demographics.activity.map((value, i) => {
                  const maxVal = Math.max(...report.demographics.activity, 1);
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-[#00f2ff] to-[#bc6aff] transition-all hover:opacity-80"
                      style={{ height: `${(value / maxVal) * 100}%` }}
                      title={`${report.demographics.activityLabels[i]}: ${value}`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </div>
          </section>

          {/* Charts - Daily Likes */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">📈 Napi like-ok</h2>
            <div className="chart-container">
              <div className="flex h-48 items-end justify-between gap-1">
                {report.daily.likesData.map((value, i) => {
                  const maxVal = Math.max(...report.daily.likesData, 1);
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-[#bc6aff] transition-all hover:bg-[#d88fff]"
                      style={{ height: `${(value / maxVal) * 100}%` }}
                      title={`${report.daily.chartLabels[i]}: ${formatNumber(value)} like`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                {report.daily.chartLabels.filter((_, i) => i % 5 === 0).map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>TikTok Report Dashboard • CAP Marketing</p>
      </footer>
    </div>
  );
}
