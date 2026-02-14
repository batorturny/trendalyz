'use client';

import { useState, useEffect, useMemo } from 'react';
import { Company, getCompanies, getChartCatalog, generateCharts, ChartDefinition, ChartData } from '@/lib/api';
import { ChartDashboard } from '@/components/ChartDashboard';
import { PlatformIcon } from '@/components/PlatformIcon';

const PLATFORM_TABS = [
  { key: 'ALL', label: 'Mind', color: 'var(--accent)' },
  { key: 'TIKTOK_ORGANIC', label: 'TikTok', color: 'var(--platform-tiktok)' },
  { key: 'FACEBOOK_ORGANIC', label: 'Facebook', color: 'var(--platform-facebook)' },
  { key: 'INSTAGRAM_ORGANIC', label: 'Instagram', color: 'var(--platform-instagram)' },
  { key: 'YOUTUBE', label: 'YouTube', color: 'var(--platform-youtube)' },
];

const CATEGORY_NAMES: Record<string, string> = {
  'trend': 'Trend',
  'engagement': 'Engagement',
  'timing': 'Időzítés',
  'video': 'Videók',
  'post': 'Posztok',
  'media': 'Tartalmak',
  'audience': 'Közönség',
};

const inputClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors";

export default function AdminChartsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [catalog, setCatalog] = useState<ChartDefinition[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [results, setResults] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState('ALL');

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);

    loadData();
  }, []);

  async function loadData() {
    try {
      const [companiesData, catalogData] = await Promise.all([
        getCompanies(),
        getChartCatalog()
      ]);
      setCompanies(companiesData);
      setCatalog(catalogData.charts);
      if (companiesData.length > 0) setSelectedCompany(companiesData[0].id);
      setSelectedCharts(catalogData.charts.map(c => c.key));
    } catch {
      setError('Nem sikerült betölteni az adatokat');
    }
  }

  const filteredCatalog = useMemo(() => {
    if (activePlatform === 'ALL') return catalog;
    return catalog.filter(c => c.platform === activePlatform);
  }, [catalog, activePlatform]);

  const byCategory = useMemo(() => {
    const grouped: Record<string, ChartDefinition[]> = {};
    filteredCatalog.forEach(chart => {
      if (!grouped[chart.category]) grouped[chart.category] = [];
      grouped[chart.category].push(chart);
    });
    return grouped;
  }, [filteredCatalog]);

  function toggleChart(key: string) {
    setSelectedCharts(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function selectAllVisible() {
    const visibleKeys = filteredCatalog.map(c => c.key);
    setSelectedCharts(prev => [...new Set([...prev, ...visibleKeys])]);
  }

  function clearVisible() {
    const visibleKeys = new Set(filteredCatalog.map(c => c.key));
    setSelectedCharts(prev => prev.filter(k => !visibleKeys.has(k)));
  }

  async function handleGenerate() {
    if (!selectedCompany || selectedCharts.length === 0) {
      setError('Válassz céget és legalább egy chartot!');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await generateCharts({
        accountId: selectedCompany,
        startDate,
        endDate,
        charts: selectedCharts.map(key => ({ key }))
      });
      setResults(response.charts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  const selectedCountByPlatform = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0 };
    catalog.forEach(c => {
      if (selectedCharts.includes(c.key)) {
        counts.ALL = (counts.ALL || 0) + 1;
        counts[c.platform || ''] = (counts[c.platform || ''] || 0) + 1;
      }
    });
    return counts;
  }, [catalog, selectedCharts]);

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Chartok</h1>
        <p className="text-[var(--text-secondary)] mt-1">Multi-platform chart generálás</p>
      </header>

      {/* Controls */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Cég</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className={inputClass}
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Kezdő dátum</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Záró dátum</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading || selectedCharts.length === 0}
              className="w-full bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {loading ? 'Generálás...' : `Generálás (${selectedCharts.length})`}
            </button>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="border-t border-[var(--border)] pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              {PLATFORM_TABS.map(tab => {
                const count = selectedCountByPlatform[tab.key] || 0;
                const isActive = activePlatform === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActivePlatform(tab.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'text-white'
                        : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
                    }`}
                    style={isActive ? { backgroundColor: tab.color } : undefined}
                  >
                    {tab.key !== 'ALL' && <PlatformIcon platform={tab.key === 'TIKTOK_ORGANIC' ? 'tiktok' : tab.key === 'FACEBOOK_ORGANIC' ? 'facebook' : tab.key === 'INSTAGRAM_ORGANIC' ? 'instagram' : 'youtube'} className="w-4 h-4 inline-block mr-1" />}{tab.label}
                    {count > 0 && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/30 text-white' : 'bg-[var(--surface)] text-[var(--text-primary)]'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={selectAllVisible} className="text-xs px-3 py-1 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--accent-subtle)]">
                Mind kijelöl
              </button>
              <button onClick={clearVisible} className="text-xs px-3 py-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-[var(--error)] rounded-lg hover:opacity-80">
                Törlés
              </button>
            </div>
          </div>

          {/* Chart Selector by Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(byCategory).map(([category, charts]) => (
              <div key={category} className="bg-[var(--surface-raised)] rounded-xl p-4">
                <h4 className="font-bold text-[var(--text-primary)] mb-3">{CATEGORY_NAMES[category] || category}</h4>
                <div className="space-y-2">
                  {charts.map(chart => (
                    <label key={chart.key} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--accent-subtle)] p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCharts.includes(chart.key)}
                        onChange={() => toggleChart(chart.key)}
                        className="w-4 h-4 rounded accent-[var(--accent)]"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{chart.title}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{chart.description}</div>
                      </div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chart.color }} />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <ChartDashboard results={results} loading={loading} />
    </div>
  );
}
