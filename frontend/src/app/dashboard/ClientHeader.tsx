'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function ClientHeader({ companyName, userEmail }: { companyName: string; userEmail: string }) {
  const pathname = usePathname();

  return (
    <header className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">TikTok Report</h1>
            {companyName && <p className="text-cyan-400 font-semibold text-sm mt-1">{companyName}</p>}
          </div>

          <div className="flex items-center gap-6">
            {/* Navigation */}
            <nav className="flex gap-1">
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/dashboard'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Riport
              </Link>
              <Link
                href="/dashboard/charts"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/dashboard/charts'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chartok
              </Link>
            </nav>

            {/* User info */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{userEmail}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-red-400 hover:text-red-300 font-semibold"
              >
                Kijelentkezés
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
