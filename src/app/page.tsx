"use client";

import { useState } from "react";
import { TikTokReport } from "@/types/report";

// Sample data for demonstration
const sampleReport: TikTokReport = {
  companyName: "Demo Company",
  dateRange: {
    from: "2026-01-01",
    to: "2026-01-31",
    label: "2026. január",
  },
  daily: {
    chartLabels: ["01.01", "01.02", "01.03", "01.04", "01.05"],
    likesData: [1200, 1500, 1800, 2100, 1900],
    commentsData: [120, 150, 180, 210, 190],
    sharesData: [60, 75, 90, 105, 95],
    profileViewsData: [2400, 3000, 3600, 4200, 3800],
    totalFollowersData: [10000, 10050, 10120, 10200, 10280],
    totals: {
      totalLikes: 8500,
      totalComments: 850,
      totalShares: 425,
      totalProfileViews: 17000,
      totalNewFollowers: 280,
      currentFollowers: 10280,
      likesChange: 15.5,
      commentsChange: 8.2,
      sharesChange: 12.1,
      profileViewsChange: -3.4,
      newFollowersChange: 22.0,
    },
  },
  video: {
    videos: [],
    top3: [],
    totals: {
      totalViews: 450000,
      totalReach: 380000,
      totalLikes: 22500,
      totalComments: 2250,
      totalShares: 1125,
      videoCount: 12,
      avgEngagement: 6.8,
      viewsChange: 18.5,
      reachChange: 15.2,
    },
  },
  demographics: {
    gender: { female: 62.5, male: 35.2, other: 2.3 },
    age: { "18-24": 35.0, "25-34": 40.0, "35-44": 15.0, "45-54": 7.0, "55+": 3.0 },
    activity: [5, 3, 2, 1, 1, 2, 8, 15, 25, 35, 40, 45, 50, 55, 52, 48, 55, 62, 70, 65, 55, 40, 25, 12],
    activityLabels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`),
  },
};

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

export default function Home() {
  const [report] = useState<TikTokReport>(sampleReport);
  const { daily, video, demographics } = report;

  return (
    <div className="min-h-screen p-6 lg:p-10">
      {/* Header */}
      <header className="glass-card mb-8 overflow-hidden p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="gradient-text text-4xl font-black tracking-tight lg:text-5xl">
              TikTok Report
            </h1>
            <p className="mt-2 text-lg font-semibold text-[#bc6aff]">{report.companyName}</p>
            <p className="mt-1 text-sm text-gray-400">
              {report.dateRange.from} — {report.dateRange.to}
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <span>📄</span>
            <span>PDF letöltés</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">📊 Összefoglaló</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <StatCard
            icon="❤️"
            label="Like-ok"
            value={daily.totals.totalLikes}
            change={daily.totals.likesChange}
          />
          <StatCard
            icon="💬"
            label="Kommentek"
            value={daily.totals.totalComments}
            change={daily.totals.commentsChange}
          />
          <StatCard
            icon="🔁"
            label="Megosztások"
            value={daily.totals.totalShares}
            change={daily.totals.sharesChange}
          />
          <StatCard
            icon="👁️"
            label="Profilnézetek"
            value={daily.totals.totalProfileViews}
            change={daily.totals.profileViewsChange}
          />
          <StatCard
            icon="👥"
            label="Új követők"
            value={`+${formatNumber(daily.totals.totalNewFollowers)}`}
            change={daily.totals.newFollowersChange}
          />
        </div>
      </section>

      {/* Video Stats */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">🎬 Videó statisztika</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="📹"
            label="Videók száma"
            value={video.totals.videoCount}
          />
          <StatCard
            icon="👀"
            label="Össz megtekintés"
            value={video.totals.totalViews}
            change={video.totals.viewsChange}
          />
          <StatCard
            icon="📢"
            label="Össz elérés"
            value={video.totals.totalReach}
            change={video.totals.reachChange}
          />
          <StatCard
            icon="📈"
            label="Átlag ER%"
            value={formatPercent(video.totals.avgEngagement)}
          />
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
                      style={{ width: `${demographics.gender.female}%` }}
                    />
                  </div>
                  <span className="font-bold">{formatPercent(demographics.gender.female)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>👨 Férfi</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-full bg-[#bc6aff]"
                      style={{ width: `${demographics.gender.male}%` }}
                    />
                  </div>
                  <span className="font-bold">{formatPercent(demographics.gender.male)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>🧑 Egyéb</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-full bg-[#ffce44]"
                      style={{ width: `${demographics.gender.other}%` }}
                    />
                  </div>
                  <span className="font-bold">{formatPercent(demographics.gender.other)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Age */}
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-bold text-[#00f2ff]">Korosztály</h3>
            <div className="space-y-3">
              {Object.entries(demographics.age).map(([age, percent]) => (
                <div key={age} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{age}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full bg-gradient-to-r from-[#00f2ff] to-[#bc6aff]"
                        style={{ width: `${percent}%` }}
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

      {/* Activity Chart Placeholder */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">⏰ Aktivitás napszak szerint</h2>
        <div className="chart-container">
          <div className="flex h-40 items-end justify-between gap-1">
            {demographics.activity.map((value, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-[#00f2ff] to-[#bc6aff] transition-all hover:opacity-80"
                style={{ height: `${(value / Math.max(...demographics.activity)) * 100}%` }}
                title={`${demographics.activityLabels[i]}: ${value}`}
              />
            ))}
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

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>TikTok Report Dashboard • CAP Marketing</p>
      </footer>
    </div>
  );
}
