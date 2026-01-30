interface KPICardProps {
    label: string;
    value: string | number;
    change?: number | null;
    icon?: string;
}

export function KPICard({ label, value, change, icon }: KPICardProps) {
    const formattedValue = typeof value === 'number'
        ? value.toLocaleString('hu-HU')
        : value;

    return (
        <div className="relative bg-white/5 border border-white/20 rounded-2xl p-5 text-center backdrop-blur-sm hover:bg-white/10 transition-all">
            {change !== null && change !== undefined && (
                <div className={`absolute top-2 right-3 text-xs font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change >= 0 ? '↑' : '↓'}{Math.abs(change).toFixed(1)}%
                </div>
            )}
            <div className="text-3xl font-black text-white mb-1">
                {icon && <span className="mr-1">{icon}</span>}
                {formattedValue}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {label}
            </div>
        </div>
    );
}
