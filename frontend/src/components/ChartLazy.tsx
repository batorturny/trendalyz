'use client';

import dynamic from 'next/dynamic';

// Lazy load Chart component — chart.js only loads when chart is rendered
export const ChartLazy = dynamic(
  () => import('./Chart').then(mod => ({ default: mod.Chart })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-card)]">
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--text-secondary)] rounded-full animate-spin" />
        </div>
      </div>
    ),
  }
);
