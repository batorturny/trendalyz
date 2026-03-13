'use client';

import { useI18n } from '@/lib/i18n';

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
      title={lang === 'hu' ? 'Switch to English' : 'Váltás magyarra'}
    >
      <span className="text-sm">{lang === 'hu' ? '🇭🇺' : '🇬🇧'}</span>
      {lang === 'hu' ? 'EN' : 'HU'}
    </button>
  );
}
