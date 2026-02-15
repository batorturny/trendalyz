'use client';

import { useState, useEffect } from 'react';
import { Company, getCompanies, getChartCatalog, generateCharts, ChartDefinition, ChartData } from '@/lib/api';
import { Chart } from '@/components/Chart';
import { VideoTable } from '@/components/VideoTable';
import { CompanyPicker } from '@/components/CompanyPicker';
import { BarChart3, TrendingUp, Heart, Clock, Film, Loader2, Rocket } from 'lucide-react';

export default function ChartsPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [catalog, setCatalog] = useState<ChartDefinition[]>([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
    const [results, setResults] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-emerald-500 focus:outline-none transition-colors";

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
        } catch (err) {
            setError('Nem sikerült betölteni az adatokat');
        }
    }

    function toggleChart(key: string) {
        setSelectedCharts(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }

    function selectAll() {
        setSelectedCharts(catalog.map(c => c.key));
    }

    function clearAll() {
        setSelectedCharts([]);
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

    const byCategory: Record<string, ChartDefinition[]> = {};
    catalog.forEach(chart => {
        if (!byCategory[chart.category]) byCategory[chart.category] = [];
        byCategory[chart.category].push(chart);
    });

    const categoryIcons: Record<string, React.ReactNode> = {
        'trend': <TrendingUp className="w-4 h-4 inline-block mr-1" />,
        'engagement': <Heart className="w-4 h-4 inline-block mr-1" />,
        'timing': <Clock className="w-4 h-4 inline-block mr-1" />,
        'video': <Film className="w-4 h-4 inline-block mr-1" />,
    };

    const categoryNames: Record<string, string> = {
        'trend': 'Trend',
        'engagement': 'Engagement',
        'timing': 'Időzítés',
        'video': 'Videók'
    };

    return (
        <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
                        <h1 className="text-4xl font-black text-[var(--text-primary)]">TikTok Chart Dashboard</h1>
                    </div>
                    <p className="text-emerald-500 font-semibold mt-2">Válaszd ki a chartokat és generáld az elemzést</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Controls */}
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Cég</label>
                            <CompanyPicker
                                companies={companies}
                                value={selectedCompany}
                                onChange={setSelectedCompany}
                            />
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
                                className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-white font-bold py-3 px-6 rounded-xl hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Generálás...</>
                                ) : (
                                    <><Rocket className="w-4 h-4" /> Generálás ({selectedCharts.length})</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Chart Selector */}
                    <div className="border-t border-[var(--border)] pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase">Chartok kiválasztása</h3>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20">
                                    Mind kijelöl
                                </button>
                                <button onClick={clearAll} className="text-xs px-3 py-1 bg-red-500/10 text-[var(--error)] rounded-lg hover:bg-red-500/20">
                                    Törlés
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(byCategory).map(([category, charts]) => (
                                <div key={category} className="bg-[var(--surface)] rounded-xl p-4">
                                    <h4 className="font-bold text-[var(--text-primary)] mb-3 flex items-center">
                                        {categoryIcons[category]}
                                        {categoryNames[category] || category}
                                    </h4>
                                    <div className="space-y-2">
                                        {charts.map(chart => (
                                            <label key={chart.key} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--accent-subtle)] p-2 rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCharts.includes(chart.key)}
                                                    onChange={() => toggleChart(chart.key)}
                                                    className="w-4 h-4 rounded accent-emerald-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-[var(--text-primary)]">{chart.title}</div>
                                                    <div className="text-xs text-[var(--text-secondary)]">{chart.description}</div>
                                                </div>
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: chart.color }}
                                                />
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

                {/* Results */}
                {results.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold border-l-4 border-emerald-500 pl-3 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6" /> Generált chartok
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {results.map(chart => (
                                <div key={chart.key}>
                                    {chart.error ? (
                                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-6">
                                            <h3 className="font-bold text-[var(--error)]">{chart.key}</h3>
                                            <p className="text-[var(--error)] text-sm opacity-80">{chart.error}</p>
                                        </div>
                                    ) : chart.empty ? (
                                        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
                                            <h3 className="font-bold text-[var(--text-secondary)]">{chart.title}</h3>
                                            <p className="text-[var(--text-secondary)] text-sm opacity-60">Nincs adat</p>
                                        </div>
                                    ) : chart.type === 'table' ? (
                                        <VideoTable
                                            chartVideos={(chart.data.series[0]?.data || []) as { id: string | null; caption: string; date: string; views: number; likes: number; comments: number; shares: number; link: string }[]}
                                            title={chart.title}
                                            color={chart.color}
                                        />
                                    ) : (
                                        <Chart
                                            type={chart.type as 'line' | 'bar'}
                                            labels={chart.data.labels}
                                            data={(chart.data.series[0]?.data || []) as number[]}
                                            label={chart.data.series[0]?.name || chart.title}
                                            color={chart.color}
                                            title={chart.title}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {results.length === 0 && !loading && (
                    <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Válaszd ki a chartokat</h2>
                        <p className="text-[var(--text-secondary)]">Jelöld be a kívánt chartokat és kattints a Generálás gombra</p>
                    </div>
                )}
            </main>
        </div>
    );
}
