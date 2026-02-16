'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlatformIcon } from '@/components/PlatformIcon';
import { LayoutDashboard, Building2, BarChart3, Settings, Menu, X } from 'lucide-react';
import { TrendalyzLogo } from '@/components/TrendalyzLogo';
import { useState, useEffect } from 'react';

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

function SidebarContent({ userName, onNavigate }: { userName: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
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
              onClick={onNavigate}
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
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
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

      {/* Footer */}
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
    </>
  );
}

export function AdminSidebar({ userName }: { userName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button - fixed top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--accent-subtle)] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Menü megnyitása"
        >
          <Menu className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
        <TrendalyzLogo size="sm" />
      </div>

      {/* Mobile spacer for fixed top bar */}
      <div className="md:hidden h-[60px] shrink-0" />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex-col h-full">
        <SidebarContent userName={userName} />
      </aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed top-0 left-0 h-full w-72 bg-[var(--surface)] border-r border-[var(--border)] z-50 flex flex-col animate-slide-in-left">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--accent-subtle)] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Menü bezárása"
              >
                <X className="w-5 h-5 text-[var(--text-primary)]" />
              </button>
            </div>
            <SidebarContent userName={userName} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
