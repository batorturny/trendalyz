'use client';

import { useState } from 'react';
import { PROVIDERS, type ConnectionProvider } from '@/types/integration';
import { addConnection } from '../actions';
import { WindsorAccountPicker } from './WindsorAccountPicker';

interface Props {
  companyId: string;
  existingProviders: string[];
  existingAccountIds?: string[];
}

export function AddConnectionWizard({ companyId, existingProviders, existingAccountIds = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProvider, setSelectedProvider] = useState<ConnectionProvider | null>(null);
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  const reset = () => {
    setStep(1);
    setSelectedProvider(null);
    setAccountId('');
    setAccountName('');
    setError(null);
    setSaving(false);
    setShowManual(false);
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

  const handleSave = async () => {
    if (!selectedProvider || !accountId.trim()) {
      setError('Account ID megadasa kotelezo');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addConnection(companyId, selectedProvider, accountId.trim(), accountName.trim() || null);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Hiba tortent';
      setError(message);
      setSaving(false);
    }
  };

  const selectedMeta = selectedProvider ? PROVIDERS.find(p => p.key === selectedProvider) : null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-bold rounded-xl hover:from-cyan-400 hover:to-purple-400 transition-all"
      >
        + Uj integracio
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">
            {step === 1 ? 'Platform kivalasztasa' : `${selectedMeta?.label} integracio`}
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>

        {step === 1 && (
          <div className="grid gap-3">
            {PROVIDERS.map((provider) => {
              const alreadyExists = existingProviders.includes(provider.key);
              return (
                <button
                  key={provider.key}
                  onClick={() => handleSelectProvider(provider.key)}
                  disabled={alreadyExists}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    alreadyExists
                      ? 'border-white/5 opacity-40 cursor-not-allowed'
                      : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center text-2xl`}>
                    {provider.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{provider.label}</div>
                    <div className="text-xs text-slate-400">{provider.description}</div>
                    {alreadyExists && (
                      <div className="text-xs text-cyan-400 mt-1">Mar hozzaadva</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && selectedMeta && (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${selectedMeta.color} bg-opacity-10`}>
              <span className="text-2xl">{selectedMeta.icon}</span>
              <span className="font-semibold text-white">{selectedMeta.label}</span>
            </div>

            {/* Windsor Account Picker */}
            <WindsorAccountPicker
              provider={selectedProvider!}
              existingAccountIds={existingAccountIds}
              onSelect={handleAccountPicked}
            />

            {/* Selected account display */}
            {accountId && !showManual && (
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <div className="text-xs text-slate-400 mb-1">Kivalasztott fiok</div>
                <div className="text-sm font-medium text-white">{accountName || accountId}</div>
                <div className="text-xs text-slate-500 font-mono">{accountId}</div>
              </div>
            )}

            {/* Display name override */}
            {accountId && !showManual && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Megjelenitesi nev (feluliras)
                </label>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={accountId}
                  className="w-full bg-slate-800 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500">vagy</span>
              <div className="flex-1 h-px bg-white/10" />
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
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <span className={`transition-transform ${showManual ? 'rotate-90' : ''}`}>&#9654;</span>
              Manualis megadas
            </button>

            {/* Manual entry fields */}
            {showManual && (
              <div className="space-y-4 pl-4 border-l-2 border-white/10">
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-slate-300">
                    A <a href="https://app.windsor.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Windsor AI dashboardon</a> connecteld a(z) {selectedMeta.label} fiokot, majd add meg itt az account ID-t.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Account ID *
                  </label>
                  <input
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="pl. 123456789"
                    className="w-full bg-slate-800 border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Megjelenitesi nev (opcionalis)
                  </label>
                  <input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder={`pl. Ceg ${selectedMeta.label} fiok`}
                    className="w-full bg-slate-800 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setStep(1); setError(null); setShowManual(false); setAccountId(''); setAccountName(''); }}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Vissza
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !accountId.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Mentes...' : 'Integracio hozzaadasa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
