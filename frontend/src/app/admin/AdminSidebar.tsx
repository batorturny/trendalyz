'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlatformIcon } from '@/components/PlatformIcon';
import { LayoutDashboard, Building2, BarChart3, Settings } from 'lucide-react';
import { TrendalyzLogo } from '@/components/TrendalyzLogo';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Cégek', icon: Building2 },
  { href: '/admin/charts', label: 'Chartok', icon: BarChart3 },
  { href: '/admin/settings', label: 'Beállítások', icon: Settings },
];

const platformItems = [
  { href: '/admin/reports/tiktok', label: 'TikTok Organic', platform: 'tiktok' as const, color: 'var(--platform-tiktok)' },
  { href: '/admin/reports/tiktok-ads', label: 'TikTok Ads', platform: 'tiktok' as const, color: 'var(--platform-tiktok)' },
  { href: '/admin/reports/facebook', label: 'Facebook', platform: 'facebook' as const, color: 'var(--platform-facebook)' },
  { href: '/admin/reports/instagram', label: 'Instagram', platform: 'instagram' as const, color: 'var(--platform-instagram)' },
  { href: '/admin/reports/instagram-public', label: 'IG Public', platform: 'instagram' as const, color: 'var(--platform-instagram)' },
  { href: '/admin/reports/youtube', label: 'YouTube', platform: 'youtube' as const, color: 'var(--platform-youtube)' },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border)]">
        <TrendalyzLogo size="sm" />
        <p className="text-[10px] text-[var(--text-secondary)] font-semibold mt-1.5 uppercase tracking-wider">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
              }`}
            >
              <item.icon className="w-4 h-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}

        {/* Platform Reports */}
        <div className="pt-4 mt-4 border-t border-[var(--border)]">
          <p className="px-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Riportok</p>
          {platformItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--surface-raised)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
                }`}
              >
                {isActive && (
                  <span className="w-0.5 h-5 rounded-full absolute left-4" style={{ backgroundColor: item.color }} />
                )}
                <PlatformIcon platform={item.platform} className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer: Theme toggle + User info + logout */}
      <div className="p-4 border-t border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-[var(--text-secondary)] truncate">{userName}</div>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--error)] hover:bg-red-500/10 rounded-xl transition-all"
        >
          Kijelentkezés
        </button>
      </div>
    </aside>
  );
}
