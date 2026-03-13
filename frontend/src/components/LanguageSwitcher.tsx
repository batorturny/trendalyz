'use client';

import { useI18n } from '@/lib/i18n';

function FlagHU({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.67)} viewBox="0 0 24 16" fill="none">
      <rect width="24" height="5.33" fill="#CE2939" />
      <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
      <rect y="10.67" width="24" height="5.33" fill="#477050" />
    </svg>
  );
}

function FlagGB({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.67)} viewBox="0 0 60 40" fill="none">
      <rect width="60" height="40" fill="#00247D" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="6" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#CF142B" strokeWidth="2" />
      <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0V40M0 20H60" stroke="#CF142B" strokeWidth="6" />
    </svg>
  );
}

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === 'hu' ? 'en' : 'hu')}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all hover:brightness-110 ${className}`}
      style={{
        background: 'var(--surface-raised)',
        borderColor: 'var(--border)',
        color: 'var(--text-secondary)',
      }}
      title={lang === 'hu' ? 'Switch to English' : 'Valtas magyarra'}
    >
      {lang === 'hu' ? <FlagHU size={16} /> : <FlagGB size={16} />}
      {lang === 'hu' ? 'EN' : 'HU'}
    </button>
  );
}
