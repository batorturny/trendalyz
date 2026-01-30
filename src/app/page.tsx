"use client";

import { useState, useEffect } from "react";
import { defaultCompanies, getMonthOptions, CompanyData } from "@/lib/config";

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

// Company Management Modal
function CompanyModal({
  isOpen,
  onClose,
  companies,
  onAddCompany,
  onRemoveCompany,
}: {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyData[];
  onAddCompany: (company: CompanyData) => void;
  onRemoveCompany: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!name.trim() || !accountId.trim()) return;
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    onAddCompany({ id, name: name.trim(), tiktokAccountId: accountId.trim() });
    setName("");
    setAccountId("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card max-h-[80vh] w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-bold">⚙️ Cégek kezelése</h2>
          <button onClick={onClose} className="text-2xl hover:text-[#00f2ff]">✕</button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-6">
          {/* Add New Company */}
          <div className="mb-6 rounded-xl bg-white/5 p-4">
            <h3 className="mb-3 font-bold text-[#00f2ff]">➕ Új cég hozzáadása</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Cég neve"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-lg border border-white/20 bg-white/5 px-3 text-sm focus:border-[#00f2ff] focus:outline-none"
              />
              <input
                type="text"
                placeholder="TikTok Account ID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="h-10 rounded-lg border border-white/20 bg-white/5 px-3 font-mono text-sm focus:border-[#00f2ff] focus:outline-none"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !accountId.trim()}
              className="btn-primary mt-3 w-full disabled:opacity-50"
            >
              Hozzáadás
            </button>
          </div>

          {/* Company List */}
          <h3 className="mb-3 font-bold text-[#bc6aff]">📋 Cégek listája ({companies.length})</h3>
          <div className="space-y-2">
            {companies.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{c.name}</div>
                  <div className="truncate font-mono text-xs text-gray-400">{c.tiktokAccountId}</div>
                </div>
                <button
                  onClick={() => onRemoveCompany(c.id)}
                  className="rounded-lg bg-red-500/20 px-3 py-1 text-sm font-bold text-red-400 hover:bg-red-500/40"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <button onClick={onClose} className="w-full rounded-xl bg-white/10 py-3 font-bold hover:bg-white/20">
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "tiktok-report-companies";

export default function Home() {
  const [companies, setCompanies] = useState<CompanyData[]>(defaultCompanies);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[1]?.value || monthOptions[0].value);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load companies from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompanies(parsed);
        }
      } catch { }
    }
  }, []);

  // Set default company after companies load
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0].id);
    }
  }, [companies, selectedCompany]);

  // Save companies to localStorage
  const saveCompanies = (newCompanies: CompanyData[]) => {
    setCompanies(newCompanies);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCompanies));
  };

  const addCompany = (company: CompanyData) => {
    if (companies.some((c) => c.id === company.id)) return;
    saveCompanies([...companies, company]);
  };

  const removeCompany = (id: string) => {
    const newCompanies = companies.filter((c) => c.id !== id);
    saveCompanies(newCompanies);
    if (selectedCompany === id && newCompanies.length > 0) {
      setSelectedCompany(newCompanies[0].id);
    }
  };

  const fetchReport = async () => {
    if (!selectedCompany) return;
    setLoading(true);
    setError(null);

    const monthData = monthOptions.find((m) => m.value === selectedMonth);
    const company = companies.find((c) => c.id === selectedCompany);
    if (!monthData || !company) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/report?companyId=${selectedCompany}&dateFrom=${monthData.dateFrom}&dateTo=${monthData.dateTo}&accountId=${encodeURIComponent(company.tiktokAccountId)}&companyName=${encodeURIComponent(company.name)}`
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
    if (selectedCompany && selectedMonth) {
      fetchReport();
    }
  }, [selectedCompany, selectedMonth]);

  return (
    <div className="min-h-screen p-6 lg:p-10">
      {/* Company Modal */}
      <CompanyModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        companies={companies}
        onAddCompany={addCompany}
        onRemoveCompany={removeCompany}
      />

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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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

            <button
              onClick={() => setShowCompanyModal(true)}
              className="h-12 rounded-xl bg-[#bc6aff]/20 px-4 font-bold text-[#bc6aff] hover:bg-[#bc6aff]/40"
            >
              ⚙️ Cégek
            </button>
          </div>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00f2ff] border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="glass-card mb-8 border-red-500/50 p-6 text-center text-red-400">{error}</div>
      )}

      {report && !loading && (
        <>
          {/* Stats Grid */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">📊 Összefoglaló</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <StatCard icon="❤️" label="Like-ok" value={report.daily.totals.totalLikes} change={report.daily.totals.likesChange} />
              <StatCard icon="💬" label="Kommentek" value={report.daily.totals.totalComments} change={report.daily.totals.commentsChange} />
              <StatCard icon="🔁" label="Megosztások" value={report.daily.totals.totalShares} change={report.daily.totals.sharesChange} />
              <StatCard icon="👁️" label="Profilnézetek" value={report.daily.totals.totalProfileViews} change={report.daily.totals.profileViewsChange} />
              <StatCard icon="👥" label="Új követők" value={`${report.daily.totals.totalNewFollowers >= 0 ? "+" : ""}${formatNumber(report.daily.totals.totalNewFollowers)}`} change={report.daily.totals.newFollowersChange} />
            </div>
          </section>

          {/* Video Stats */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">🎬 Videó statisztika</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon="📹" label="Videók száma" value={report.video.totals.videoCount} />
              <StatCard icon="👀" label="Össz megtekintés" value={report.video.totals.totalViews} change={report.video.totals.viewsChange} />
              <StatCard icon="📢" label="Össz elérés" value={report.video.totals.totalReach} change={report.video.totals.reachChange} />
              <StatCard icon="📈" label="Átlag ER%" value={formatPercent(report.video.totals.avgEngagement)} />
            </div>
          </section>

          {/* Top 3 Videos */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">🏆 Top 3 videó</h2>
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
              <div className="glass-card p-6">
                <h3 className="mb-4 text-lg font-bold text-[#00f2ff]">Nemek</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>👩 Nő</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                        <div className="h-full bg-[#00f2ff]" style={{ width: `${Math.min(100, report.demographics.gender.female)}%` }} />
                      </div>
                      <span className="font-bold">{formatPercent(report.demographics.gender.female)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>👨 Férfi</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                        <div className="h-full bg-[#bc6aff]" style={{ width: `${Math.min(100, report.demographics.gender.male)}%` }} />
                      </div>
                      <span className="font-bold">{formatPercent(report.demographics.gender.male)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🧑 Egyéb</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                        <div className="h-full bg-[#ffce44]" style={{ width: `${Math.min(100, report.demographics.gender.other)}%` }} />
                      </div>
                      <span className="font-bold">{formatPercent(report.demographics.gender.other)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="mb-4 text-lg font-bold text-[#00f2ff]">Korosztály</h3>
                <div className="space-y-3">
                  {Object.entries(report.demographics.age).map(([age, percent]) => (
                    <div key={age} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{age}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                          <div className="h-full bg-gradient-to-r from-[#00f2ff] to-[#bc6aff]" style={{ width: `${Math.min(100, percent)}%` }} />
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

          {/* Daily Likes Chart */}
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
