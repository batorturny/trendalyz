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
  previousMonth: { prevFrom: string; prevTo: string; label: string };
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
      prevLikes: number;
      prevComments: number;
      prevShares: number;
      prevProfileViews: number;
      prevNewFollowers: number;
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
      videoCountChange: number;
      prevTotalViews: number;
      prevTotalReach: number;
      prevVideoCount: number;
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

function ChangeBadge({ value, onClick }: { value: number; onClick?: () => void }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <button
      onClick={onClick}
      className={`absolute right-3 top-3 rounded-lg px-2 py-1 text-xs font-bold transition-all hover:scale-110 ${isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        }`}
    >
      {isPositive ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
    </button>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
  prevValue,
  prevLabel,
}: {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
  prevValue?: number;
  prevLabel?: string;
}) {
  const [showPrev, setShowPrev] = useState(false);

  return (
    <div
      className="glass-card stat-card relative cursor-pointer p-6 transition-all hover:scale-[1.02]"
      onClick={() => setShowPrev(!showPrev)}
    >
      {change !== undefined && change !== 0 && (
        <ChangeBadge value={change} onClick={() => setShowPrev(!showPrev)} />
      )}
      <div className="flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-black">{typeof value === "number" ? formatNumber(value) : value}</div>
        <div className="mt-1 text-sm font-semibold uppercase tracking-wider text-gray-400">{label}</div>

        {/* Previous month popup */}
        {showPrev && prevValue !== undefined && (
          <div className="mt-3 rounded-lg bg-white/10 p-3 text-sm">
            <div className="text-xs font-bold text-[#00f2ff]">{prevLabel || "Előző hónap"}</div>
            <div className="mt-1 font-bold">{formatNumber(prevValue)}</div>
          </div>
        )}
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
      className="glass-card group block p-5 transition-all hover:border-[#00f2ff]/50 cursor-pointer"
    >
      <div className="flex items-center gap-5">
        {/* Rank badge */}
        {rank && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00f2ff] to-[#bc6aff] text-2xl font-black text-[#020617] shadow-lg shadow-[#00f2ff]/20">
            #{rank}
          </div>
        )}

        {/* Date */}
        <div className="shrink-0 rounded-xl bg-[#00f2ff]/10 px-4 py-2 text-center">
          <div className="text-lg font-bold text-[#00f2ff]">{dateStr}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#00f2ff]/60">Feltöltve</div>
        </div>

        {/* Stats grid - labeled */}
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="text-center">
            <div className="text-xl font-black">{formatNumber(video.views)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Megtekintés</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-[#bc6aff]">{formatNumber(video.reach)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Elérés</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-red-400">{formatNumber(video.likes)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Like</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-blue-400">{formatNumber(video.comments)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Komment</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-green-400">{formatNumber(video.shares)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Megosztás</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-yellow-400">+{formatNumber(video.newFollowers)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Új követő</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-[#00f2ff]">{formatPercent(video.engagementRate)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Eng. Rate</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-orange-400">{formatPercent(video.fullWatchRate)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Végignézés</div>
          </div>
        </div>

        {/* Play button */}
        <div className="shrink-0 rounded-full bg-gradient-to-br from-[#00f2ff] to-[#bc6aff] p-3 text-xl opacity-70 shadow-lg transition-all group-hover:opacity-100 group-hover:scale-110">
          ▶️
        </div>
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

  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0].id);
    }
  }, [companies, selectedCompany]);

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

  const prevLabel = report?.previousMonth?.label || "Előző hónap";

  return (
    <div className="min-h-screen p-6 lg:p-10">
      <CompanyModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        companies={companies}
        onAddCompany={addCompany}
        onRemoveCompany={removeCompany}
      />

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
              className="h-12 rounded-xl bg-[#bc6aff]/20 px-4 font-bold text-[#bc6aff] hover:bg-[#bc6aff]/40 print:hidden"
            >
              ⚙️ Cégek
            </button>

            <button
              onClick={() => window.print()}
              disabled={!report}
              className="h-12 rounded-xl bg-[#00f2ff]/20 px-4 font-bold text-[#00f2ff] hover:bg-[#00f2ff]/40 disabled:opacity-50 print:hidden"
            >
              📄 PDF Letöltés
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
          {/* Info banner */}
          <div className="mb-6 rounded-xl bg-[#00f2ff]/10 p-4 text-center text-sm text-[#00f2ff]">
            💡 Kattints a kártyákra az előző hónap ({prevLabel}) értékeinek megtekintéséhez
          </div>

          {/* Stats Grid */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">📊 Összefoglaló</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <StatCard
                icon="❤️"
                label="Like-ok"
                value={report.daily.totals.totalLikes}
                change={report.daily.totals.likesChange}
                prevValue={report.daily.totals.prevLikes}
                prevLabel={prevLabel}
              />
              <StatCard
                icon="💬"
                label="Kommentek"
                value={report.daily.totals.totalComments}
                change={report.daily.totals.commentsChange}
                prevValue={report.daily.totals.prevComments}
                prevLabel={prevLabel}
              />
              <StatCard
                icon="🔁"
                label="Megosztások"
                value={report.daily.totals.totalShares}
                change={report.daily.totals.sharesChange}
                prevValue={report.daily.totals.prevShares}
                prevLabel={prevLabel}
              />
              <StatCard
                icon="👁️"
                label="Profilnézetek"
                value={report.daily.totals.totalProfileViews}
                change={report.daily.totals.profileViewsChange}
                prevValue={report.daily.totals.prevProfileViews}
                prevLabel={prevLabel}
              />
              <StatCard
                icon="👥"
                label="Új követők"
                value={`${report.daily.totals.totalNewFollowers >= 0 ? "+" : ""}${formatNumber(report.daily.totals.totalNewFollowers)}`}
                change={report.daily.totals.newFollowersChange}
                prevValue={report.daily.totals.prevNewFollowers}
                prevLabel={prevLabel}
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
                value={report.video.totals.videoCount}
                change={report.video.totals.videoCountChange}
                prevValue={report.video.totals.prevVideoCount}
                prevLabel={prevLabel}
              />
              <StatCard
                icon="👀"
                label="Össz megtekintés"
                value={report.video.totals.totalViews}
                change={report.video.totals.viewsChange}
                prevValue={report.video.totals.prevTotalViews}
                prevLabel={prevLabel}
              />
              <StatCard
                icon="📢"
                label="Össz elérés"
                value={report.video.totals.totalReach}
                change={report.video.totals.reachChange}
                prevValue={report.video.totals.prevTotalReach}
                prevLabel={prevLabel}
              />
              <StatCard
                icon="📈"
                label="Átlag ER%"
                value={formatPercent(report.video.totals.avgEngagement)}
              />
            </div>
          </section>

          {/* Top 3 Videos */}
          <section className="mb-8 px-8 lg:px-16">
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
          <section className="mb-8 px-8 lg:px-16">
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
            {(() => {
              const maxVal = Math.max(...report.demographics.activity, 1);
              const peakHour = report.demographics.activity.indexOf(maxVal);
              return (
                <div className="chart-container">
                  <div className="flex h-40 items-end justify-between gap-[2px]">
                    {report.demographics.activity.map((value, i) => {
                      const isPeak = i === peakHour && value > 0;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-t transition-all hover:opacity-80 ${isPeak
                              ? "bg-gradient-to-t from-[#ff4df8] to-[#ffce44] ring-2 ring-[#ffce44]"
                              : "bg-gradient-to-t from-[#00f2ff] to-[#bc6aff]"
                            }`}
                          style={{ height: `${(value / maxVal) * 100}%`, minHeight: value > 0 ? "4px" : "0" }}
                          title={`${report.demographics.activityLabels[i]}: ${value}`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between overflow-x-auto text-[10px] text-gray-500">
                    {report.demographics.activityLabels.map((label, i) => (
                      <span key={i} className="flex-shrink-0 text-center" style={{ minWidth: "18px" }}>
                        {label.replace(":00", "")}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#ffce44]/10 p-3 text-sm">
                    <span className="text-xl">🏆</span>
                    <span className="font-bold text-[#ffce44]">
                      Legnépszerűbb időpont: {report.demographics.activityLabels[peakHour]}
                    </span>
                  </div>
                </div>
              );
            })()}
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
              <div className="mt-2 flex justify-between overflow-x-auto text-xs text-gray-500">
                {report.daily.chartLabels.map((label, i) => (
                  <span key={i} className="min-w-0 flex-shrink-0">{label}</span>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>TikTok Report Dashboard • CAP Marketing</p>
      </footer>
    </div>
  );
}
