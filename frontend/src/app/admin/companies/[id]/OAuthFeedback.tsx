'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROVIDERS } from '@/types/integration';

interface Props {
  status: string;
  provider?: string;
  message?: string;
  windsorSetupUrl?: string;
}

export function OAuthFeedback({ status, provider, message, windsorSetupUrl }: Props) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  const providerMeta = provider ? PROVIDERS.find(p => p.key === provider) : null;

  useEffect(() => {
    // Don't auto-hide if Windsor setup is needed
    if (windsorSetupUrl) return;

    const timer = setTimeout(() => {
      setVisible(false);
      const url = new URL(window.location.href);
      url.searchParams.delete('oauth');
      url.searchParams.delete('provider');
      url.searchParams.delete('message');
      url.searchParams.delete('windsorSetup');
      router.replace(url.pathname);
    }, 6000);
    return () => clearTimeout(timer);
  }, [router, windsorSetupUrl]);

  if (!visible) return null;

  const isSuccess = status === 'success';
  const needsWindsor = isSuccess && windsorSetupUrl;

  return (
    <div
      className={`mb-6 p-4 rounded-xl border transition-all ${
        needsWindsor
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          : isSuccess
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{needsWindsor ? '\u26A0\uFE0F' : isSuccess ? '\u2705' : '\u274C'}</span>
        <div className="flex-1">
          <div className="font-semibold text-sm">
            {needsWindsor
              ? `${providerMeta?.label || 'Platform'} OAuth sikeres! Windsor adatkapcsolat beallitasa szukseges.`
              : isSuccess
                ? `${providerMeta?.label || 'Platform'} sikeresen csatlakoztatva!`
                : 'OAuth kapcsolodas sikertelen'}
          </div>
          {message && !needsWindsor && (
            <div className="text-xs mt-0.5 opacity-80">{message}</div>
          )}
          {needsWindsor && (
            <div className="text-xs mt-1 opacity-80">
              A fiokod osszekapcsolasa sikeres. Most a Windsor.ai-ban is be kell allitani az adatforras-kapcsolatot (egyszeri lepes).
              Mivel mar be vagy jelentkezve, csak kattints az &quot;Authorize&quot; gombra.
            </div>
          )}
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          &times;
        </button>
      </div>
      {needsWindsor && (
        <div className="mt-3 flex gap-3">
          <a
            href={windsorSetupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 font-semibold text-sm transition-colors"
          >
            Windsor beallitas megnyitasa &rarr;
          </a>
          <button
            onClick={() => {
              setVisible(false);
              const url = new URL(window.location.href);
              url.searchParams.delete('oauth');
              url.searchParams.delete('provider');
              url.searchParams.delete('message');
              url.searchParams.delete('windsorSetup');
              router.replace(url.pathname);
            }}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Kesobb
          </button>
        </div>
      )}
    </div>
  );
}
