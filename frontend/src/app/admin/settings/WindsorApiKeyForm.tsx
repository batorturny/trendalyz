'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Trash2, Key } from 'lucide-react';
import { saveWindsorApiKey, testWindsorApiKey } from './actions';
import { useRouter } from 'next/navigation';

export function WindsorApiKeyForm({ hasKey, keyHint }: { hasKey: boolean; keyHint: string | null }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>(hasKey ? 'success' : 'idle');
  const [message, setMessage] = useState(hasKey ? 'API kulcs mentve' : '');
  const [isSaving, startSaving] = useTransition();
  const [isTesting, startTesting] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [savedKey, setSavedKey] = useState(hasKey);
  const [savedHint, setSavedHint] = useState(keyHint);
  const router = useRouter();

  function handleSave() {
    startSaving(async () => {
      try {
        const result = await saveWindsorApiKey(apiKey);
        setStatus(result.success ? 'success' : 'error');
        setMessage(result.message);
        if (result.success) {
          setSavedKey(true);
          setSavedHint(apiKey.slice(-4));
          setApiKey('');
          router.refresh();
        }
      } catch {
        setStatus('error');
        setMessage('Mentési hiba');
      }
    });
  }

  function handleTest() {
    startTesting(async () => {
      try {
        const result = await testWindsorApiKey(apiKey);
        setStatus(result.success ? 'success' : 'error');
        setMessage(result.message);
      } catch {
        setStatus('error');
        setMessage('Tesztelési hiba');
      }
    });
  }

  function handleDelete() {
    startDeleting(async () => {
      try {
        const result = await saveWindsorApiKey('');
        setStatus('idle');
        setMessage('');
        setSavedKey(false);
        setSavedHint(null);
        setApiKey('');
        router.refresh();
      } catch {
        setStatus('error');
        setMessage('Törlési hiba');
      }
    });
  }

  return (
    <div className="bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Windsor API kulcs</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            A Windsor.ai API kulcsod a riportok és integrációk működéséhez szükséges.
          </p>
        </div>
        {status !== 'idle' && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${
            status === 'success' ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {status === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {message}
          </div>
        )}
      </div>

      {/* Saved key indicator */}
      {savedKey && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <span className="text-sm font-mono text-[var(--text-primary)]">
                {'•'.repeat(20)}{savedHint}
              </span>
              <span className="text-xs text-emerald-500 ml-3 font-semibold">Aktív</span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50"
            title="API kulcs törlése"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Input for new/replacement key */}
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={savedKey ? 'Új kulcs megadása a cseréhez...' : 'Illeszd be a Windsor API kulcsod...'}
          className="w-full px-4 py-3 pr-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving || !apiKey}
          className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white dark:text-[var(--surface)] text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {savedKey ? 'Kulcs cseréje' : 'Mentés'}
        </button>
        <button
          onClick={handleTest}
          disabled={isTesting || !apiKey}
          className="px-5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-semibold disabled:opacity-50 hover:bg-[var(--accent-subtle)] transition-all flex items-center gap-2"
        >
          {isTesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Kapcsolat tesztelése
        </button>
      </div>
    </div>
  );
}
