'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

interface CompanyLimitToastProps {
  companyCount: number;
  companyLimit: number;
}

export function CompanyLimitToast({ companyCount, companyLimit }: CompanyLimitToastProps) {
  const [visible, setVisible] = useState(false);

  const ratio = companyLimit > 0 ? companyCount / companyLimit : 0;
  const shouldShow = ratio >= 0.8 && companyCount < companyLimit;

  useEffect(() => {
    if (!shouldShow) return;

    const key = `companyLimitToast_${companyLimit}`;
    if (sessionStorage.getItem(key)) return;

    setVisible(true);
    sessionStorage.setItem(key, '1');
  }, [shouldShow, companyLimit]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-yellow-50 dark:bg-yellow-500/15 border border-yellow-200 dark:border-yellow-500/30 rounded-2xl p-4 shadow-lg flex gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
            Közelítesz a cég limitedhez ({companyCount}/{companyLimit})
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400/80 mb-2">
            Fontold meg a csomagváltást a további növekedéshez.
          </p>
          <Link
            href="/admin/billing"
            className="text-xs font-bold text-yellow-700 dark:text-yellow-300 underline underline-offset-2 hover:no-underline"
          >
            Csomagok megtekintése
          </Link>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-300 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
