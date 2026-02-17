'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlatformIcon } from '@/components/PlatformIcon';
import { LayoutDashboard, Building2, BarChart3, Settings, CreditCard, Menu, X } from 'lucide-react';
import { TrendalyzLogo } from '@/components/TrendalyzLogo';
import { useState, useEffect } from 'react';

const navItems: { href: string; label: string; icon: typeof LayoutDashboard; disabled?: boolean }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Cégek', icon: Building2 },
  { href: '/admin/charts', label: 'Chartok', icon: BarChart3 },
  { href: '/admin/settings', label: 'Beállítások', icon: Settings },
  { href: '/admin/billing', label: 'Számlázás', icon: CreditCard },
];

const platformItems = [
  { href: '/admin/reports/tiktok', label: 'TikTok Organic', platform: 'tiktok' as const, color: 'var(--platform-tiktok)' },
  { href: '/admin/reports/facebook', label: 'Facebook', platform: 'facebook' as const, color: 'var(--platform-facebook)', disabled: true },
  { href: '/admin/reports/instagram', label: 'Instagram', platform: 'instagram' as const, color: 'var(--platform-instagram)', disabled: true },
  { href: '/admin/reports/youtube', label: 'YouTube', platform: 'youtube' as const, color: 'var(--platform-youtube)', disabled: true },
  { href: '/admin/reports/tiktok-ads', label: 'TikTok Ads', platform: 'tiktok' as const, color: 'var(--platform-tiktok)', disabled: true },
  { href: '/admin/reports/instagram-public', label: 'IG Public', platform: 'instagram' as const, color: 'var(--platform-instagram)' },
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
          if (item.disabled) {
            return (
              <span
                key={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] opacity-40 cursor-not-allowed group relative"
                title="Hamarosan érkezik"
              >
                <item.icon className="w-4 h-4" strokeWidth={2} />
                {item.label}
                <span className="ml-auto text-[9px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--text-primary)] text-[var(--surface)] px-1.5 py-0.5 rounded">HAMAROSAN</span>
              </span>
            );
          }

          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
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
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] opacity-40 cursor-not-allowed group relative"
                  title="Fejlesztés alatt"
                >
                  <PlatformIcon platform={item.platform} className="w-4 h-4 grayscale" />
                  {item.label}
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">WIP</span>
                </span>
              );
            }

            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
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
      <div className="mobile-only fixed top-0 left-0 right-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
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
      <div className="mobile-only h-[60px] shrink-0" />

      {/* Desktop sidebar */}
      <aside className="desktop-only w-64 shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full">
        <SidebarContent userName={userName} />
      </aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-72 bg-[var(--surface)] border-r border-[var(--border)] z-50 flex flex-col animate-slide-in-left">
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
