'use client';
// Force rebuild for deployment sync

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlatformIcon } from '@/components/PlatformIcon';
import { TrendalyzLogo } from '@/components/TrendalyzLogo';
import { Settings, Menu, X } from 'lucide-react';

const platformTabs = [
  { href: '/dashboard/tiktok', label: 'TikTok', platform: 'tiktok' as const, color: 'var(--platform-tiktok)', providers: ['TIKTOK_ORGANIC'] },
  { href: '/dashboard/facebook', label: 'Facebook', platform: 'facebook' as const, color: 'var(--platform-facebook)', providers: ['FACEBOOK_ORGANIC', 'FACEBOOK'] },
  { href: '/dashboard/instagram', label: 'Instagram', platform: 'instagram' as const, color: 'var(--platform-instagram)', providers: ['INSTAGRAM_ORGANIC', 'INSTAGRAM'] },
  { href: '/dashboard/youtube', label: 'YouTube', platform: 'youtube' as const, color: 'var(--platform-youtube)', providers: ['YOUTUBE'] },
  { href: '/dashboard/tiktok-ads', label: 'TikTok Ads', platform: 'tiktok' as const, color: 'var(--platform-tiktok)', providers: ['TIKTOK_ADS'] },
];

interface Props {
  companyName: string;
  userEmail: string;
  connectedProviders: string[];
}

export function ClientHeader({ companyName, userEmail, connectedProviders }: Props) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <TrendalyzLogo size="sm" />
            {companyName && <p className="text-[var(--text-secondary)] font-semibold text-xs mt-1">{companyName}</p>}
          </div>

          {/* Desktop Navigation */}
          <div className="desktop-only items-center gap-6">
            <nav className="flex gap-1">
              {platformTabs.map(tab => {
                const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

                const isEnabled = tab.providers.some(p => connectedProviders.includes(p));

                if (!isEnabled) {
                  return (
                    <span
                      key={tab.href}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text-secondary)] opacity-40 cursor-not-allowed"
                      title="Nem konfigurált"
                    >
                      <PlatformIcon platform={tab.platform} className="w-4 h-4 grayscale" />
                      {tab.label}
                    </span>
                  );
                }

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive
                      ? 'text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
                      }`}
                    style={isActive ? { backgroundColor: tab.color } : undefined}
                  >
                    <PlatformIcon platform={tab.platform} className="w-4 h-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-xs text-[var(--text-secondary)]">{userEmail}</span>
              <Link href="/dashboard/settings" className="p-1.5 rounded-lg hover:bg-[var(--accent-subtle)] transition" title="Beállítások">
                <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-[var(--error)] hover:opacity-80 font-semibold"
              >
                Kijelentkezés
              </button>
            </div>
          </div>

          {/* Mobile hamburger button */}
          <button
            className="mobile-only p-2 rounded-lg hover:bg-[var(--accent-subtle)] transition min-h-[44px] min-w-[44px] items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-[var(--text-primary)]" />
            ) : (
              <Menu className="w-5 h-5 text-[var(--text-primary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile slide-out drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-72 bg-[var(--surface)] border-l border-[var(--border)] z-50 overflow-y-auto animate-slide-in-right">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)] truncate">{userEmail}</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--accent-subtle)] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Menü bezárása"
              >
                <X className="w-5 h-5 text-[var(--text-primary)]" />
              </button>
            </div>

            {/* Platform tabs */}
            <nav className="p-4 space-y-1">
              <p className="px-3 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Platformok</p>
              {platformTabs.map(tab => {
                const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
                const isEnabled = tab.providers.some(p => connectedProviders.includes(p));

                if (!isEnabled) {
                  return (
                    <span
                      key={tab.href}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] opacity-40"
                    >
                      <PlatformIcon platform={tab.platform} className="w-4 h-4" />
                      {tab.label}
                    </span>
                  );
                }

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                      ? 'text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
                      }`}
                    style={isActive ? { backgroundColor: tab.color } : undefined}
                  >
                    <PlatformIcon platform={tab.platform} className="w-4 h-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

            {/* Settings + Logout */}
            <div className="p-4 border-t border-[var(--border)] space-y-1">
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)] transition"
              >
                <Settings className="w-4 h-4" />
                Beállítások
              </Link>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-[var(--text-secondary)]">Téma</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[var(--error)] hover:bg-red-500/10 transition"
              >
                Kijelentkezés
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
