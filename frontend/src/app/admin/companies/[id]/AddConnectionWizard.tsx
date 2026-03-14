'use client';

import { useState, useCallback, useRef } from 'react';
import { PROVIDERS, type ConnectionProvider } from '@/types/integration';
import { addConnection } from '../actions';
import { ChevronRight } from 'lucide-react';
import { WindsorAccountPicker } from './WindsorAccountPicker';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';
import { BaseModal } from '@/components/BaseModal';
import { useT } from '@/lib/i18n';

interface Props {
  companyId: string;
  existingProviders: string[];
  existingAccountIds?: string[];
}

export function AddConnectionWizard({ companyId, existingProviders, existingAccountIds = [] }: Props) {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProvider, setSelectedProvider] = useState<ConnectionProvider | null>(null);
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Windsor OAuth popup state
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<'idle' | 'loading' | 'popup' | 'syncing' | 'done' | 'error'>('idle');
  const [pickerEmpty, setPickerEmpty] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setStep(1);
    setSelectedProvider(null);
    setAccountId('');
    setAccountName('');
    setError(null);
    setSaving(false);
    setOauthLoading(false);
    setOauthStatus('idle');
    setPickerEmpty(false);
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
  };

  // Direct OAuth redirect (Meta: Facebook, Instagram)
  const handleDirectOAuth = useCallback(() => {
    if (!selectedProvider) return;
    // Full page redirect — backend handles token exchange and DB storage,
    // then redirects back to /admin/companies/{companyId}?oauth=success
    window.location.href = `/api/oauth/authorize?provider=${encodeURIComponent(selectedProvider)}&companyId=${encodeURIComponent(companyId)}`;
  }, [selectedProvider, companyId]);

  // Windsor OAuth popup flow (TikTok, YouTube)
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
        throw new Error(data.error || t('Nem sikerült az OAuth link generálása'));
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
      const message = err instanceof Error ? err.message : t('Ismeretlen hiba');
      setError(message);
      setOauthStatus('error');
      setOauthLoading(false);
    }
  }, [selectedProvider]);

  const handleSave = async () => {
    if (!selectedProvider || !accountId.trim()) {
      setError(t('Account ID megadása kötelező'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addConnection(companyId, selectedProvider, accountId.trim(), accountName.trim() || null);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('Hiba történt');
      setError(message);
      setSaving(false);
    }
  };

  const selectedMeta = selectedProvider ? PROVIDERS.find(p => p.key === selectedProvider) : null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white dark:text-[var(--surface)] text-sm font-bold rounded-xl hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.97] transition-all duration-150"
      >
        {t('+ Új integráció')}
      </button>
    );
  }

  return (
    <BaseModal open={isOpen} onClose={handleClose} className="max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {step === 1 ? t('Platform kiválasztása') : `${selectedMeta?.label} ${t('integráció')}`}
          </h3>
          <button onClick={handleClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl">&times;</button>
        </div>

        {step === 1 && (
          <div className="grid gap-3">
            {PROVIDERS.map((provider) => {
              const alreadyExists = existingProviders.includes(provider.key);
              // @ts-ignore - isDev might not be in the type definition yet if types are not fully updated in IDE context, but it is in the file
              const isDev = provider.isDev;
              const isDisabled = alreadyExists || isDev;

              const providerColor = provider.key.includes('TIKTOK') ? 'var(--platform-tiktok)' : provider.key.includes('FACEBOOK') ? 'var(--platform-facebook)' : provider.key.includes('INSTAGRAM') ? 'var(--platform-instagram)' : 'var(--platform-youtube)';

              return (
                <div key={provider.key} className="relative group">
                  <button
                    onClick={() => handleSelectProvider(provider.key)}
                    disabled={isDisabled}
                    title={isDev ? t("Fejlesztés alatt") : alreadyExists ? t("Már hozzáadva") : ""}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${isDisabled
                      ? 'border-[var(--border)] opacity-50 cursor-not-allowed grayscale-[0.5]'
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
                      <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        {provider.label}
                        {isDev && <span className="text-[10px] uppercase tracking-wider bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded">Dev</span>}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">{provider.description}</div>
                      {alreadyExists && (
                        <div className="text-xs text-[var(--success)] mt-1">{t('Már hozzáadva')}</div>
                      )}
                      {isDev && (
                        <div className="text-xs text-[var(--warning)] mt-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--surface)] px-2 py-1 rounded shadow-sm border border-[var(--border)]">
                          {t('Fejlesztés alatt')} 🚧
                        </div>
                      )}
                    </div>
                  </button>
                </div>
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

            {/* Direct OAuth (Meta: Facebook, Instagram) — full page redirect, no popup */}
            {selectedMeta.supportsOAuth && (selectedMeta as any).directOAuth && (
              <button
                onClick={handleDirectOAuth}
                className="flex items-center gap-4 p-4 rounded-xl border border-[var(--accent)] bg-[var(--accent-subtle)] hover:brightness-110 transition-all w-full text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                  <PlatformIcon platform={getPlatformFromProvider(selectedMeta.key)} className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {t('Bejelentkezés')} {selectedMeta.label}{t('-kal')}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {selectedMeta.key === 'YOUTUBE'
                      ? t('Google fiókoddal — automatikusan felismeri a csatornádat')
                      : t('Facebook fiókkal — automatikusan menti az összes oldalt')}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            )}

            {/* Windsor OAuth popup (TikTok, YouTube) */}
            {selectedMeta.supportsOAuth && !(selectedMeta as any).directOAuth && (
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
                    {oauthStatus === 'idle' && `${t('Kapcsolódás')} ${selectedMeta.label}${t('-kal')}`}
                    {oauthStatus === 'loading' && t('Kapcsolat előkészítése...')}
                    {oauthStatus === 'popup' && t('Várakozás a bejelentkezésre...')}
                    {oauthStatus === 'syncing' && t('Fiók szinkronizálása...')}
                    {oauthStatus === 'done' && t('Bejelentkezés sikeres!')}
                    {oauthStatus === 'error' && t('Hiba történt')}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {oauthStatus === 'idle' && t('Bejelentkezés popup ablakban — egy kattintás')}
                    {oauthStatus === 'loading' && t('OAuth link generálása...')}
                    {oauthStatus === 'popup' && t('Jelentkezz be a felugró ablakban, majd zárd be')}
                    {oauthStatus === 'syncing' && t('Fiók adatok lekérése Windsor-ből...')}
                    {oauthStatus === 'done' && t('Válaszd ki a fiókot az alábbi listából')}
                    {oauthStatus === 'error' && t('Próbáld újra')}
                  </div>
                </div>
              </button>
            )}

            {/* Divider + Account Picker — only shown when picker has results, and only for Windsor providers */}
            {!pickerEmpty && selectedMeta.supportsOAuth && !(selectedMeta as any).directOAuth && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-secondary)]">
                  {oauthStatus === 'done' ? t('válaszd ki a fiókot') : t('vagy válassz meglévő fiókot')}
                </span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>
            )}

            {/* Windsor Account Picker — only for Windsor providers (not directOAuth) */}
            {!(selectedMeta as any).directOAuth && (
              <WindsorAccountPicker
                key={oauthStatus === 'done' ? `refresh-${Date.now()}` : 'initial'}
                provider={selectedProvider!}
                existingAccountIds={existingAccountIds}
                onSelect={handleAccountPicked}
                onEmpty={() => { setPickerEmpty(true); }}
              />
            )}

            {/* Selected account display */}
            {accountId && (
              <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
                <div className="text-xs text-[var(--text-secondary)] mb-1">{t('Kiválasztott fiók')}</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{accountName || accountId}</div>
                <div className="text-xs text-[var(--text-secondary)] font-mono">{accountId}</div>
              </div>
            )}

            {/* Display name override */}
            {accountId && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  {t('Megjelenítési név (felülírás)')}
                </label>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={accountId}
                  className="input-field"
                />
              </div>
            )}


            {error && (
              <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setStep(1); setError(null); setAccountId(''); setAccountName(''); setOauthStatus('idle'); setOauthLoading(false); }}
                className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {t('Vissza')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !accountId.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white dark:text-[var(--surface)] font-bold rounded-xl hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                {saving ? t('Mentés...') : t('Integráció hozzáadása')}
              </button>
            </div>
          </div>
        )}
    </BaseModal>
  );
}
