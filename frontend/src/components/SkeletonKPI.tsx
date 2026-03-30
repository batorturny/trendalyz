// SkeletonKPI.tsx — shimmer placeholder matching KPICard dimensions
export function SkeletonKPI() {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3 md:p-5 min-h-[88px] md:min-h-[100px] flex flex-col items-center justify-center gap-2 animate-pulse">
      <div className="h-7 w-20 bg-[var(--border)] rounded-md" />
      <div className="h-3 w-16 bg-[var(--border)] rounded-md" />
    </div>
  );
}
