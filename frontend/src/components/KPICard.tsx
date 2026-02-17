'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';

interface KPICardProps {
    label: string;
    value: string | number;
    change?: number | null;
    icon?: string;
    description?: {
        title: string;
        text: string;
        tip: string;
    };
}

export function KPICard({ label, value, change, icon, description }: KPICardProps) {
    const [open, setOpen] = useState(false);

    const formattedValue = typeof value === 'number'
        ? value >= 1_000_000
            ? `${(value / 1_000_000).toFixed(1)}M`
            : value >= 10_000
                ? `${(value / 1_000).toFixed(1)}K`
                : value.toLocaleString('hu-HU')
        : value;

    // Auto-size: shrink text for long values
    const valueLen = String(formattedValue).length;
    const textSize = valueLen > 10 ? 'text-lg' : valueLen > 7 ? 'text-xl' : 'text-3xl';

    return (
        <>
            <div
                onClick={() => description && setOpen(true)}
                className={`relative bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-5 text-center shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-md)] transition-all min-h-[100px] flex flex-col items-center justify-center ${description ? 'cursor-pointer group' : ''
                    }`}
            >
                {change !== null && change !== undefined && (
                    <div className={`absolute top-2 right-3 text-xs font-bold ${change >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                        {change >= 0 ? '↑' : '↓'}{Math.abs(change).toFixed(1)}%
                    </div>
                )}
                <div className={`${textSize} font-bold text-[var(--text-primary)] mb-1 break-all leading-tight`}>
                    {icon && <span className="mr-1">{icon}</span>}
                    {formattedValue}
                </div>
                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {label}
                </div>
                {description && (
                    <div className="absolute bottom-2 right-3 text-[10px] text-[var(--text-secondary)] opacity-40 group-hover:opacity-70 transition-opacity">
                        ?
                    </div>
                )}
            </div>

            {/* Explanation Modal */}
            {open && description && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setOpen(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50" />

                    {/* Modal */}
                    <div
                        className="relative w-full max-w-md animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-lg)]">
                            {/* Close button */}
                            <button
                                onClick={() => setOpen(false)}
                                className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-lg"
                            >
                                ✕
                            </button>

                            {/* Value highlight */}
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-6 py-3">
                                    <span className="text-3xl font-bold text-[var(--text-primary)]">{formattedValue}</span>
                                    {change !== null && change !== undefined && (
                                        <span className={`text-sm font-bold ${change >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                                            {change >= 0 ? '↑' : '↓'}{Math.abs(change).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                                {description.title}
                            </h3>

                            {/* Description */}
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5">
                                {description.text}
                            </p>

                            {/* Tip box */}
                            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-[var(--text-secondary)] mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Tipp</div>
                                        <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                                            {description.tip}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
