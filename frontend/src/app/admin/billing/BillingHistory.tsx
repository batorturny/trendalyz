'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amount: number;
  currency: string;
  created: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  paid: { label: 'Fizetve', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  open: { label: 'Nyitott', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  draft: { label: 'Piszkozat', className: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' },
  void: { label: 'Érvénytelen', className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  uncollectible: { label: 'Behajthatalan', className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
};

function formatAmount(amount: number, currency: string) {
  const value = amount / 100;
  if (currency === 'huf') return `${Math.round(value).toLocaleString('hu-HU')} Ft`;
  return `${value.toFixed(2)}€`;
}

export function BillingHistory({ hasCustomer }: { hasCustomer: boolean }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasCustomer) {
      setLoading(false);
      return;
    }

    fetch('/api/billing/invoices')
      .then(res => res.json())
      .then(data => {
        setInvoices(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Error fetching invoices:', err);
      })
      .finally(() => setLoading(false));
  }, [hasCustomer]);

  if (!hasCustomer) return null;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Számlák</h2>

      {loading ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
          Betöltés...
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
          Még nincsenek számlák
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase bg-[var(--surface-raised)]">
                  <th className="px-6 py-4">Szám</th>
                  <th className="px-6 py-4">Dátum</th>
                  <th className="px-6 py-4">Összeg</th>
                  <th className="px-6 py-4">Státusz</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const statusInfo = STATUS_LABELS[inv.status] || STATUS_LABELS.draft;
                  return (
                    <tr key={inv.id} className="border-t border-[var(--border)]">
                      <td className="px-6 py-4 font-semibold">{inv.number || '-'}</td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">
                        {new Date(inv.created).toLocaleDateString('hu-HU')}
                      </td>
                      <td className="px-6 py-4 font-semibold">{formatAmount(inv.amount, inv.currency)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {inv.pdfUrl && (
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-[var(--accent-subtle)] transition inline-flex"
                            title="PDF letöltés"
                          >
                            <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {invoices.map((inv) => {
              const statusInfo = STATUS_LABELS[inv.status] || STATUS_LABELS.draft;
              return (
                <div
                  key={inv.id}
                  className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{inv.number || '-'}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(inv.created).toLocaleDateString('hu-HU')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{formatAmount(inv.amount, inv.currency)}</span>
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-[var(--accent-subtle)] transition"
                        >
                          <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
