'use client';

import { useState, useEffect } from 'react';
import { Company, getCompanies, getChartCatalog, generateCharts, ChartDefinition, ChartData } from '@/lib/api';
import { Chart } from '@/components/Chart';

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

    // Initialize dates and load data
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
            // Select all charts by default
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

    // Group catalog by category
    const byCategory: Record<string, ChartDefinition[]> = {};
    catalog.forEach(chart => {
        if (!byCategory[chart.category]) byCategory[chart.category] = [];
        byCategory[chart.category].push(chart);
    });

    const categoryNames: Record<string, string> = {
        'trend': '📈 Trend',
        'engagement': '💜 Engagement',
        'timing': '⏰ Időzítés'
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-4xl font-black">📊 TikTok Chart Dashboard</h1>
                    <p className="text-cyan-400 font-semibold mt-2">Válaszd ki a chartokat és generáld az elemzést</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Controls */}
                <div className="bg-white/5 border border-white/15 rounded-3xl p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Company Select */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cég</label>
                            <select
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                            >
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Kezdő dátum</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Záró dátum</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                            />
                        </div>

                        {/* Generate Button */}
                        <div className="flex items-end">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || selectedCharts.length === 0}
                                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? '⏳ Generálás...' : `🚀 Generálás (${selectedCharts.length})`}
                            </button>
                        </div>
                    </div>

                    {/* Chart Selector */}
                    <div className="border-t border-white/10 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase">Chartok kiválasztása</h3>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-xs px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30">
                                    Mind kijelöl
                                </button>
                                <button onClick={clearAll} className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                                    Törlés
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(byCategory).map(([category, charts]) => (
                                <div key={category} className="bg-slate-900/50 rounded-xl p-4">
                                    <h4 className="font-bold text-white mb-3">{categoryNames[category] || category}</h4>
                                    <div className="space-y-2">
                                        {charts.map(chart => (
                                            <label key={chart.key} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCharts.includes(chart.key)}
                                                    onChange={() => toggleChart(chart.key)}
                                                    className="w-4 h-4 rounded accent-purple-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-white">{chart.title}</div>
                                                    <div className="text-xs text-slate-400">{chart.description}</div>
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
                        <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300">
                            {error}
                        </div>
                    )}
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold border-l-4 border-purple-500 pl-3">📈 Generált chartok</h2>
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
                )}

                {/* Empty state */}
                {results.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Válaszd ki a chartokat</h2>
                        <p className="text-slate-400">Jelöld be a kívánt chartokat és kattints a Generálás gombra</p>
                    </div>
                )}
            </main>
        </div>
    );
}
