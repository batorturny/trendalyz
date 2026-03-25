'use client';

import { useMemo, useState, useCallback } from 'react';

interface ActivityHeatmapProps {
  data: { date: string; value: number }[];
  title?: string;
  color?: string;
}

const DAY_LABELS = ['Hé', 'Ke', 'Sze', 'Csü', 'Pé', 'Szo', 'Va'];
const MONTH_LABELS = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sze', 'Okt', 'Nov', 'Dec'];
const CELL = 16;
const GAP = 3;

function getLevel(v: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (!v || v <= 0 || max <= 0) return 0;
  const r = v / max;
  if (r <= 0.15) return 1;
  if (r <= 0.4) return 2;
  if (r <= 0.7) return 3;
  return 4;
}

const OPACITIES = [0, 0.2, 0.4, 0.7, 1];

function getMondayDay(s: string): number {
  const d = new Date(s + 'T00:00:00').getDay();
  return d === 0 ? 6 : d - 1;
}

function fmtDate(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtVal(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString('hu-HU');
}

export function ActivityHeatmap({ data, title, color = '#1a6b8a' }: ActivityHeatmapProps) {
  const [tip, setTip] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

  const { cells, weeks, markers, maxVal } = useMemo(() => {
    if (!data.length) return { cells: [] as any[], weeks: 0, markers: [] as any[], maxVal: 0 };

    const lookup = new Map<string, number>();
    data.forEach(d => { if (d.date && d.value != null) lookup.set(d.date, d.value); });

    const sorted = [...data].filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));
    if (!sorted.length) return { cells: [] as any[], weeks: 0, markers: [] as any[], maxVal: 0 };

    const start = new Date(sorted[0].date + 'T00:00:00');
    start.setDate(start.getDate() - getMondayDay(sorted[0].date));
    const end = new Date(sorted[sorted.length - 1].date + 'T00:00:00');
    const endDow = getMondayDay(sorted[sorted.length - 1].date);
    if (endDow < 6) end.setDate(end.getDate() + (6 - endDow));

    const mx = Math.max(...data.map(d => d.value), 0);
    const allCells: any[] = [];
    const mk: any[] = [];
    let cur = new Date(start);
    let wi = 0, lastMonth = -1;

    while (cur <= end) {
      const iso = cur.toISOString().split('T')[0];
      const di = getMondayDay(iso);
      const val = lookup.get(iso) || 0;
      const month = cur.getMonth();
      if (month !== lastMonth && di === 0) { mk.push({ wi, label: MONTH_LABELS[month] }); lastMonth = month; }
      allCells.push({ date: iso, value: val, level: getLevel(val, mx), di, wi });
      cur.setDate(cur.getDate() + 1);
      if (di === 6) wi++;
    }

    return { cells: allCells, weeks: wi, markers: mk, maxVal: mx };
  }, [data]);

  const onEnter = useCallback((e: React.MouseEvent<SVGRectElement>, c: any) => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = e.currentTarget.closest('.hm-wrap')?.getBoundingClientRect();
    if (p) setTip({ x: r.left - p.left + CELL / 2, y: r.top - p.top - 8, date: c.date, value: c.value });
  }, []);

  if (!cells.length || maxVal === 0) return null;

  const LW = 32;
  const HH = 20;
  const svgW = LW + weeks * (CELL + GAP) + 10;
  const svgH = HH + 7 * (CELL + GAP) + 4;

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 lg:col-span-2">
      {title && <h4 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-3">{title}</h4>}
      <div className="hm-wrap relative overflow-x-auto">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="block">
          {/* Month labels */}
          {markers.map((m: any, i: number) => (
            <text key={i} x={LW + m.wi * (CELL + GAP)} y={12} className="fill-[var(--text-secondary)]" fontSize={10} fontWeight={600}>{m.label}</text>
          ))}
          {/* Day labels — all 7 */}
          {DAY_LABELS.map((l, i) => (
            <text key={i} x={0} y={HH + i * (CELL + GAP) + CELL - 3} className="fill-[var(--text-secondary)]" fontSize={9} fontWeight={500}>{l}</text>
          ))}
          {/* Cells */}
          {cells.map((c: any) => (
            <rect key={c.date} x={LW + c.wi * (CELL + GAP)} y={HH + c.di * (CELL + GAP)}
              width={CELL} height={CELL} rx={3}
              fill={c.level === 0 ? 'var(--surface)' : color}
              fillOpacity={c.level === 0 ? 1 : OPACITIES[c.level]}
              stroke={c.level === 0 ? 'var(--border)' : 'none'} strokeWidth={c.level === 0 ? 0.5 : 0}
              className="cursor-pointer" onMouseEnter={e => onEnter(e, c)} onMouseLeave={() => setTip(null)} />
          ))}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-secondary)]">
          <span>Kevesebb</span>
          {[0, 1, 2, 3, 4].map(l => (
            <span key={l} style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: l === 0 ? 'var(--surface)' : color, opacity: OPACITIES[l], border: l === 0 ? '0.5px solid var(--border)' : 'none' }} />
          ))}
          <span>Több</span>
        </div>

        {tip && (
          <div className="absolute pointer-events-none z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-lg text-xs -translate-x-1/2 -translate-y-full"
            style={{ left: tip.x, top: tip.y }}>
            <div className="font-bold text-[var(--text-primary)]">{fmtVal(tip.value)}</div>
            <div className="text-[var(--text-secondary)]">{fmtDate(tip.date)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
