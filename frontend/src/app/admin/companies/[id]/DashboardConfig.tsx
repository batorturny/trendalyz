'use client';

import { useState, useTransition } from 'react';
import { PLATFORM_METRICS, type PlatformMetricConfig } from '@/lib/platformMetrics';
import { PlatformIcon } from '@/components/PlatformIcon';
import { updateDashboardConfig } from '../actions';
import { ChevronDown, ChevronRight, Check, Save, Loader2 } from 'lucide-react';

interface DashboardConfigProps {
  companyId: string;
  connections: { provider: string }[];
  dashboardConfig: Record<string, { kpis: string[]; charts: string[] }> | null;
}

type PlatformSelection = {
  kpis: Set<string>;
  charts: Set<string>; // daily + distributions merged
};

function initSelections(
  connections: { provider: string }[],
  config: Record<string, { kpis: string[]; charts: string[] }> | null
): Record<string, PlatformSelection> {
  const result: Record<string, PlatformSelection> = {};
  const connectedProviders = new Set(connections.map(c => c.provider));

  for (const provider of connectedProviders) {
    if (!PLATFORM_METRICS[provider]) continue;
    const saved = config?.[provider];
    result[provider] = {
      kpis: new Set(saved?.kpis || []),
      charts: new Set(saved?.charts || []),
    };
  }
  return result;
}

function PlatformConfigSection({
  platformKey,
  config,
  selection,
  onToggleKpi,
  onToggleChart,
  onSelectAll,
  onClearAll,
}: {
  platformKey: string;
  config: PlatformMetricConfig;
  selection: PlatformSelection;
  onToggleKpi: (key: string) => void;
  onToggleChart: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const totalSelected = selection.kpis.size + selection.charts.size;
  const totalItems = config.kpis.length + config.daily.length + config.distributions.length;

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent-subtle)] transition-colors"
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        }
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
        <PlatformIcon platform={config.platform} className="w-4 h-4" />
        <span className="font-bold text-sm text-[var(--text-primary)]">{config.label}</span>
        <span className="ml-auto flex items-center gap-2">
          {totalSelected > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
              style={{ backgroundColor: config.color }}
            >
              {totalSelected}/{totalItems}
            </span>
          )}
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 pt-1 space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Összes kijelölése
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-semibold text-[var(--error)] hover:underline"
            >
              Összes törlése
            </button>
          </div>

          {/* KPIs */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">KPI-ok</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {config.kpis.map(item => (
                <CheckboxItem
                  key={item.key}
                  label={item.label}
                  checked={selection.kpis.has(item.key)}
                  onChange={() => onToggleKpi(item.key)}
                  color={config.color}
                />
              ))}
            </div>
          </div>

          {/* Daily Charts */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Napi diagramok</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {config.daily.map(item => (
                <CheckboxItem
                  key={item.key}
                  label={item.label}
                  checked={selection.charts.has(item.key)}
                  onChange={() => onToggleChart(item.key)}
                  color={config.color}
                />
              ))}
            </div>
          </div>

          {/* Distributions */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Megoszlások</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {config.distributions.map(item => (
                <CheckboxItem
                  key={item.key}
                  label={item.label}
                  checked={selection.charts.has(item.key)}
                  onChange={() => onToggleChart(item.key)}
                  color={config.color}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckboxItem({ label, checked, onChange, color }: {
  label: string;
  checked: boolean;
  onChange: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 rounded-lg transition-colors ${
        checked
          ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'
      }`}
    >
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
          checked ? 'border-transparent text-white' : 'border-[var(--border)]'
        }`}
        style={checked ? { backgroundColor: color } : undefined}
      >
        {checked && <Check className="w-3 h-3" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function DashboardConfig({ companyId, connections, dashboardConfig }: DashboardConfigProps) {
  const [selections, setSelections] = useState(() => initSelections(connections, dashboardConfig));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const connectedProviders = [...new Set(connections.map(c => c.provider))].filter(p => PLATFORM_METRICS[p]);

  if (connectedProviders.length === 0) return null;

  function toggleKpi(platform: string, key: string) {
    setSaved(false);
    setSelections(prev => {
      const sel = prev[platform];
      if (!sel) return prev;
      const newKpis = new Set(sel.kpis);
      if (newKpis.has(key)) newKpis.delete(key); else newKpis.add(key);
      return { ...prev, [platform]: { ...sel, kpis: newKpis } };
    });
  }

  function toggleChart(platform: string, key: string) {
    setSaved(false);
    setSelections(prev => {
      const sel = prev[platform];
      if (!sel) return prev;
      const newCharts = new Set(sel.charts);
      if (newCharts.has(key)) newCharts.delete(key); else newCharts.add(key);
      return { ...prev, [platform]: { ...sel, charts: newCharts } };
    });
  }

  function selectAll(platform: string) {
    setSaved(false);
    const config = PLATFORM_METRICS[platform];
    if (!config) return;
    setSelections(prev => ({
      ...prev,
      [platform]: {
        kpis: new Set(config.kpis.map(i => i.key)),
        charts: new Set([...config.daily.map(i => i.key), ...config.distributions.map(i => i.key)]),
      },
    }));
  }

  function clearAll(platform: string) {
    setSaved(false);
    setSelections(prev => ({
      ...prev,
      [platform]: { kpis: new Set(), charts: new Set() },
    }));
  }

  function handleSave() {
    const config: Record<string, { kpis: string[]; charts: string[] }> = {};
    for (const [platform, sel] of Object.entries(selections)) {
      config[platform] = {
        kpis: [...sel.kpis],
        charts: [...sel.charts],
      };
    }
    startTransition(async () => {
      await updateDashboardConfig(companyId, config);
      setSaved(true);
    });
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Dashboard konfiguráció</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Válaszd ki, mely KPI-kat és chartokat lássák az ügyfelek
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold py-2 px-4 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'Mentve' : 'Mentés'}
        </button>
      </div>

      <div className="space-y-3">
        {connectedProviders.map(provider => {
          const config = PLATFORM_METRICS[provider];
          const sel = selections[provider];
          if (!config || !sel) return null;
          return (
            <PlatformConfigSection
              key={provider}
              platformKey={provider}
              config={config}
              selection={sel}
              onToggleKpi={(key) => toggleKpi(provider, key)}
              onToggleChart={(key) => toggleChart(provider, key)}
              onSelectAll={() => selectAll(provider)}
              onClearAll={() => clearAll(provider)}
            />
          );
        })}
      </div>
    </div>
  );
}
