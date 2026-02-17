'use client';

import { useState, useCallback, useRef } from 'react';
import { PROVIDERS, type ConnectionProvider } from '@/types/integration';
import { addConnection } from '../actions';
import { ChevronRight } from 'lucide-react';
import { WindsorAccountPicker } from './WindsorAccountPicker';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';

interface Props {
  companyId: string;
  existingProviders: string[];
  existingAccountIds?: string[];
}

const inputClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors";

export function AddConnectionWizard({ companyId, existingProviders, existingAccountIds = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProvider, setSelectedProvider] = useState<ConnectionProvider | null>(null);
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  // Windsor OAuth popup state
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<'idle' | 'loading' | 'popup' | 'syncing' | 'done' | 'error'>('idle');
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setStep(1);
    setSelectedProvider(null);
    setAccountId('');
    setAccountName('');
    setError(null);
    setSaving(false);
    setShowManual(false);
    setOauthLoading(false);
    setOauthStatus('idle');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleClose = () => {
    setIsOpen(false);
    reset();
  };

  const handleSelectProvider = (provider: ConnectionProvider) => {
    setSelectedProvider(provider);
    setStep(2);
  };

  const handleAccountPicked = (pickedId: string, pickedName: string) => {
    setAccountId(pickedId);
    setAccountName(pickedName);
    setShowManual(false);
  };

  // Windsor OAuth popup flow
  const handleWindsorOAuth = useCallback(async () => {
    if (!selectedProvider) return;

    const providerMeta = PROVIDERS.find(p => p.key === selectedProvider);
    if (!providerMeta) return;

    setOauthLoading(true);
    setOauthStatus('loading');
    setError(null);

    try {
      const res = await fetch(`/api/windsor/auth-link?source=${encodeURIComponent(providerMeta.windsorEndpoint)}`);
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Nem sikerült az OAuth link generálása');
      }

      const w = 600, h = 700;
      const left = (window.screen.width - w) / 2;
      const top = (window.screen.height - h) / 2;

      popupRef.current = window.open(
        data.url,
        'windsor_oauth',
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
      );

      setOauthStatus('popup');

      pollRef.current = setInterval(() => {
        if (popupRef.current && popupRef.current.closed) {
          if (pollRef.current) clearInterval(pollRef.current);
          popupRef.current = null;
          setOauthStatus('syncing');
          setTimeout(() => {
            setOauthStatus('done');
            setOauthLoading(false);
          }, 2000);
        }
      }, 500);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ismeretlen hiba';
      setError(message);
      setOauthStatus('error');
      setOauthLoading(false);
    }
  }, [selectedProvider]);

  const handleSave = async () => {
    if (!selectedProvider || !accountId.trim()) {
      setError('Account ID megadása kötelező');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addConnection(companyId, selectedProvider, accountId.trim(), accountName.trim() || null);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Hiba történt';
      setError(message);
      setSaving(false);
    }
  };

  const selectedMeta = selectedProvider ? PROVIDERS.find(p => p.key === selectedProvider) : null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[var(--accent)] text-white dark:text-[var(--surface)] text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all duration-150"
      >
        + Új integráció
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {step === 1 ? 'Platform kiválasztása' : `${selectedMeta?.label} integráció`}
          </h3>
          <button onClick={handleClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl">&times;</button>
        </div>

        {step === 1 && (
          <div className="grid gap-3">
            {PROVIDERS.map((provider) => {
              const alreadyExists = existingProviders.includes(provider.key);
              const providerColor = provider.key.includes('TIKTOK') ? 'var(--platform-tiktok)' : provider.key.includes('FACEBOOK') ? 'var(--platform-facebook)' : provider.key.includes('INSTAGRAM') ? 'var(--platform-instagram)' : 'var(--platform-youtube)';
              return (
                <button
                  key={provider.key}
                  onClick={() => handleSelectProvider(provider.key)}
                  disabled={alreadyExists}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${alreadyExists
                      ? 'border-[var(--border)] opacity-40 cursor-not-allowed'
                      : 'border-[var(--border)] hover:bg-[var(--accent-subtle)]'
                    }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white"
                    style={{ backgroundColor: providerColor }}
                  >
                    <PlatformIcon platform={getPlatformFromProvider(provider.key)} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">{provider.label}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{provider.description}</div>
                    {alreadyExists && (
                      <div className="text-xs text-[var(--success)] mt-1">Már hozzáadva</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && selectedMeta && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-raised)]">
              <PlatformIcon platform={getPlatformFromProvider(selectedMeta.key)} className="w-6 h-6" />
              <span className="font-semibold text-[var(--text-primary)]">{selectedMeta.label}</span>
            </div>

            {/* Windsor OAuth Connect Button */}
            {selectedMeta.supportsOAuth && (
              <button
                onClick={handleWindsorOAuth}
                disabled={oauthLoading}
                className="flex items-center gap-4 p-4 rounded-xl border border-[var(--accent)] bg-[var(--accent-subtle)] hover:brightness-110 transition-all group w-full text-left disabled:opacity-60 disabled:cursor-wait"
              >
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-[var(--accent)]">
                  {oauthStatus === 'loading' || oauthStatus === 'syncing' ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : oauthStatus === 'done' ? (
                    <svg className="w-5 h-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {oauthStatus === 'idle' && `Kapcsolódás ${selectedMeta.label}-kal`}
                    {oauthStatus === 'loading' && 'Kapcsolat előkészítése...'}
                    {oauthStatus === 'popup' && 'Várakozás a bejelentkezésre...'}
                    {oauthStatus === 'syncing' && 'Fiók szinkronizálása...'}
                    {oauthStatus === 'done' && 'Bejelentkezés sikeres!'}
                    {oauthStatus === 'error' && 'Hiba történt'}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {oauthStatus === 'idle' && 'Bejelentkezés popup ablakban — egy kattintás'}
                    {oauthStatus === 'loading' && 'OAuth link generálása...'}
                    {oauthStatus === 'popup' && 'Jelentkezz be a felugró ablakban, majd zárd be'}
                    {oauthStatus === 'syncing' && 'Fiók adatok lekérése Windsor-ből...'}
                    {oauthStatus === 'done' && 'Válaszd ki a fiókot az alábbi listából'}
                    {oauthStatus === 'error' && 'Próbáld újra'}
                  </div>
                </div>
              </button>
            )}

            {/* Divider */}
            {selectedMeta.supportsOAuth && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-secondary)]">
                  {oauthStatus === 'done' ? 'válaszd ki a fiókot' : 'vagy válassz meglévő fiókot'}
                </span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>
            )}

            {/* Windsor Account Picker — refreshes after OAuth done */}
            <WindsorAccountPicker
              key={oauthStatus === 'done' ? `refresh-${Date.now()}` : 'initial'}
              provider={selectedProvider!}
              existingAccountIds={existingAccountIds}
              onSelect={handleAccountPicked}
            />

            {/* Selected account display */}
            {accountId && !showManual && (
              <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
                <div className="text-xs text-[var(--text-secondary)] mb-1">Kiválasztott fiók</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{accountName || accountId}</div>
                <div className="text-xs text-[var(--text-secondary)] font-mono">{accountId}</div>
              </div>
            )}

            {/* Display name override */}
            {accountId && !showManual && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  Megjelenítési név (felülírás)
                </label>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={accountId}
                  className={inputClass}
                />
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-secondary)]">vagy</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Manual entry toggle */}
            <button
              type="button"
              onClick={() => {
                setShowManual(!showManual);
                if (!showManual) {
                  setAccountId('');
                  setAccountName('');
                }
              }}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${showManual ? 'rotate-90' : ''}`} />
              Manuális megadás
            </button>

            {/* Manual entry fields */}
            {showManual && (
              <div className="space-y-4 pl-4 border-l-2 border-[var(--border)]">
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3">
                  <p className="text-xs text-[var(--text-secondary)]">
                    A <a href="https://onboard.windsor.ai" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Windsor AI dashboardon</a> connecteld a(z) {selectedMeta.label} fiókot, majd add meg itt az account ID-t.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                    Account ID *
                  </label>
                  <input
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="pl. 123456789"
                    className={`${inputClass} font-mono`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                    Megjelenítési név (opcionális)
                  </label>
                  <input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder={`pl. Cég ${selectedMeta.label} fiók`}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setStep(1); setError(null); setShowManual(false); setAccountId(''); setAccountName(''); setOauthStatus('idle'); setOauthLoading(false); }}
                className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Vissza
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !accountId.trim()}
                className="flex-1 px-4 py-3 bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                {saving ? 'Mentés...' : 'Integráció hozzáadása'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
