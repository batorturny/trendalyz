'use client';

import { useMemo, useState, useCallback } from 'react';

interface ActivityHeatmapProps {
  /** Daily data points: { date: 'YYYY-MM-DD', value: number }[] */
  data: { date: string; value: number }[];
  /** Title displayed above the heatmap */
  title?: string;
  /** Color for the heatmap cells (CSS color, will be used with opacity) */
  color?: string;
}

const DAY_LABELS = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún',
  'Júl', 'Aug', 'Sze', 'Okt', 'Nov', 'Dec',
];

const CELL_SIZE = 12;
const GAP = 2;

function getLevel(value: number, max: number): 0 | 1 | 2 | 3 {
  if (!value || value <= 0) return 0;
  if (max <= 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.6) return 2;
  return 3;
}

function getOpacity(level: 0 | 1 | 2 | 3): number {
  switch (level) {
    case 0: return 0;
    case 1: return 0.3;
    case 2: return 0.6;
    case 3: return 1;
  }
}

/** Convert YYYY-MM-DD to JS day index where Monday = 0 */
function getMondayBasedDay(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  const jsDay = d.getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1; // Mon=0 ... Sun=6
}

interface CellData {
  date: string;
  value: number;
  level: 0 | 1 | 2 | 3;
  dayIndex: number; // 0=Mon ... 6=Sun
  weekIndex: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('hu-HU');
}

export function ActivityHeatmap({ data, title, color = '#22c55e' }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

  const { cells, weeks, monthMarkers } = useMemo(() => {
    if (!data.length) return { cells: [], weeks: 0, monthMarkers: [] };

    // Build lookup
    const lookup = new Map<string, number>();
    data.forEach(d => lookup.set(d.date, d.value));

    // Sort dates to find range
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const startStr = sorted[0].date;
    const endStr = sorted[sorted.length - 1].date;

    // Extend start to previous Monday
    const startDate = new Date(startStr + 'T00:00:00');
    const startDow = getMondayBasedDay(startStr);
    startDate.setDate(startDate.getDate() - startDow);

    // Extend end to next Sunday
    const endDate = new Date(endStr + 'T00:00:00');
    const endDow = getMondayBasedDay(endStr);
    if (endDow < 6) {
      endDate.setDate(endDate.getDate() + (6 - endDow));
    }

    // Find max value for level calculation
    const maxVal = Math.max(...data.map(d => d.value), 0);

    // Generate all cells
    const allCells: CellData[] = [];
    const markers: { weekIndex: number; label: string }[] = [];
    let currentDate = new Date(startDate);
    let weekIdx = 0;
    let lastMonth = -1;

    while (currentDate <= endDate) {
      const iso = currentDate.toISOString().split('T')[0];
      const dayIdx = getMondayBasedDay(iso);
      const val = lookup.get(iso) || 0;

      // Month marker on first Monday of a new month
      const month = currentDate.getMonth();
      if (month !== lastMonth && dayIdx === 0) {
        markers.push({ weekIndex: weekIdx, label: MONTH_LABELS[month] });
        lastMonth = month;
      }

      allCells.push({
        date: iso,
        value: val,
        level: getLevel(val, maxVal),
        dayIndex: dayIdx,
        weekIndex: weekIdx,
      });

      currentDate.setDate(currentDate.getDate() + 1);
      // If we just placed Sunday, move to next week
      if (dayIdx === 6) weekIdx++;
    }

    return { cells: allCells, weeks: weekIdx, monthMarkers: markers };
  }, [data]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<SVGRectElement>, cell: CellData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.closest('.heatmap-container')?.getBoundingClientRect();
    if (parent) {
      setTooltip({
        x: rect.left - parent.left + CELL_SIZE / 2,
        y: rect.top - parent.top - 8,
        date: cell.date,
        value: cell.value,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (!cells.length) return null;

  const labelWidth = 20;
  const svgWidth = labelWidth + weeks * (CELL_SIZE + GAP);
  const headerHeight = 16;
  const svgHeight = headerHeight + 7 * (CELL_SIZE + GAP);

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
      {title && (
        <h4 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-3">{title}</h4>
      )}
      <div className="heatmap-container relative overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block"
          aria-label={title || 'Activity heatmap'}
          role="img"
        >
          {/* Month labels */}
          {monthMarkers.map((m, i) => (
            <text
              key={`month-${i}`}
              x={labelWidth + m.weekIndex * (CELL_SIZE + GAP)}
              y={10}
              className="fill-[var(--text-secondary)]"
              fontSize={9}
              fontWeight={500}
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) => (
            i % 2 === 0 ? (
              <text
                key={`day-${i}`}
                x={0}
                y={headerHeight + i * (CELL_SIZE + GAP) + CELL_SIZE - 2}
                className="fill-[var(--text-secondary)]"
                fontSize={9}
                fontWeight={500}
              >
                {label}
              </text>
            ) : null
          ))}

          {/* Cells */}
          {cells.map((cell) => {
            const x = labelWidth + cell.weekIndex * (CELL_SIZE + GAP);
            const y = headerHeight + cell.dayIndex * (CELL_SIZE + GAP);
            const opacity = getOpacity(cell.level);

            return (
              <rect
                key={cell.date}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                ry={2}
                fill={cell.level === 0 ? 'var(--surface)' : color}
                fillOpacity={cell.level === 0 ? 1 : opacity}
                stroke={cell.level === 0 ? 'var(--border)' : 'none'}
                strokeWidth={cell.level === 0 ? 0.5 : 0}
                className="cursor-pointer transition-opacity duration-100"
                onMouseEnter={(e) => handleMouseEnter(e, cell)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 shadow-lg text-xs -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="font-semibold text-[var(--text-primary)]">{formatValue(tooltip.value)}</div>
            <div className="text-[var(--text-secondary)]">{formatDate(tooltip.date)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
