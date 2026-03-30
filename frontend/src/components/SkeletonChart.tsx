// SkeletonChart.tsx — shimmer placeholder matching Chart dimensions
export function SkeletonChart() {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-card)] animate-pulse">
      <div className="h-3 w-32 bg-[var(--border)] rounded-md mb-3" />
      <div className="h-[300px] flex items-end gap-2 px-4 pb-4">
        {[40, 65, 50, 80, 55, 70, 45, 75, 60, 85].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-[var(--border)] rounded-t-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
