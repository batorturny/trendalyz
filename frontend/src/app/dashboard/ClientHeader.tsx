'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlatformIcon } from '@/components/PlatformIcon';
import { TrendalyzLogo } from '@/components/TrendalyzLogo';

const platformTabs = [
  { href: '/dashboard', label: 'TikTok', platform: 'tiktok' as const, color: 'var(--platform-tiktok)', providers: ['TIKTOK_ORGANIC'] },
  { href: '/dashboard/tiktok-ads', label: 'TikTok Ads', platform: 'tiktok' as const, color: 'var(--platform-tiktok)', providers: ['TIKTOK_ADS'] },
  { href: '/dashboard/facebook', label: 'Facebook', platform: 'facebook' as const, color: 'var(--platform-facebook)', providers: ['FACEBOOK_ORGANIC', 'FACEBOOK'] },
  { href: '/dashboard/instagram', label: 'Instagram', platform: 'instagram' as const, color: 'var(--platform-instagram)', providers: ['INSTAGRAM_ORGANIC', 'INSTAGRAM'] },
  { href: '/dashboard/instagram-public', label: 'IG Public', platform: 'instagram' as const, color: 'var(--platform-instagram)', providers: ['INSTAGRAM_PUBLIC'] },
  { href: '/dashboard/youtube', label: 'YouTube', platform: 'youtube' as const, color: 'var(--platform-youtube)', providers: ['YOUTUBE'] },
];

interface Props {
  companyName: string;
  userEmail: string;
  connectedProviders: string[];
}

export function ClientHeader({ companyName, userEmail, connectedProviders }: Props) {
  const pathname = usePathname();

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <TrendalyzLogo size="sm" />
            {companyName && <p className="text-[var(--text-secondary)] font-semibold text-xs mt-1">{companyName}</p>}
          </div>

          <div className="flex items-center gap-6">
            {/* Platform Navigation */}
            <nav className="flex gap-1">
              {platformTabs.map(tab => {
                const isActive = tab.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(tab.href);
                const isEnabled = tab.platform === 'tiktok' || tab.providers.some(p => connectedProviders.includes(p));

                if (!isEnabled) {
                  return (
                    <span
                      key={tab.href}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text-secondary)] opacity-40 cursor-not-allowed"
                      title="Nem konfigurált"
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
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
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

            {/* Theme toggle + User info */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-xs text-[var(--text-secondary)]">{userEmail}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-[var(--error)] hover:opacity-80 font-semibold"
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
