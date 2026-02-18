'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LinkIcon } from 'lucide-react';


export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--surface-raised)] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <LinkIcon className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Érvénytelen link</h2>
          <p className="text-[var(--text-secondary)]">Ez a link nem tartalmaz érvényes tokent.</p>
          <a href="/login" className="inline-block mt-6 text-[var(--accent)] hover:opacity-70 font-semibold">
            Vissza a bejelentkezéshez
          </a>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie');
      return;
    }

    if (password !== confirmPassword) {
      setError('A két jelszó nem egyezik');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Hiba történt');
        setLoading(false);
        return;
      }

      // Auto-login with the email returned from the API
      if (data.ok && data.email) {
        const loginResult = await signIn('credentials', {
          email: data.email,
          password,
          redirect: false,
        });
        if (!loginResult?.error) {
          window.location.href = '/dashboard';
          return;
        }
      }

      // Fallback: redirect to login
      window.location.href = '/login';
    } catch {
      setError('Hálózati hiba');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-raised)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[var(--text-primary)]">Trend<span className="text-[var(--accent)]">alyz</span></h1>
          <p className="text-[var(--text-secondary)] font-semibold mt-2">Jelszó beállítása</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-lg)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                Jelszó
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
                placeholder="Min. 6 karakter"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                Jelszó megerősítése
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
                placeholder="Jelszó újra"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {loading ? 'Mentés...' : 'Jelszó beállítása'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
