'use client';

import Link from 'next/link';

export function CompanyLimitBanner({ current, limit }: { current: number; limit: number }) {
  if (current < limit) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20">
      <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
        Elérted a csomagod cég limitjét ({current}/{limit})
      </p>
      <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
        Új cég hozzáadásához válts magasabb csomagra.
      </p>
      <Link
        href="/admin/billing"
        className="inline-block mt-3 px-4 py-2 text-sm font-bold bg-yellow-500 text-white rounded-xl hover:brightness-110 transition-all"
      >
        Csomag váltás
      </Link>
    </div>
  );
}
