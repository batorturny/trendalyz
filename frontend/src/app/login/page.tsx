'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { TrendalyzLogo } from '@/components/TrendalyzLogo';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasGoogle, setHasGoogle] = useState(false);

  useEffect(() => {
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(providers => {
        setHasGoogle(!!providers?.google);
      })
      .catch(() => {});
  }, []);

  function switchMode(newMode: 'login' | 'register' | 'forgot') {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Hibás email vagy jelszó');
      setLoading(false);
    } else {
      const session = await fetch('/api/auth/session').then(r => r.json());
      window.location.href = session?.user?.role === 'CLIENT' ? '/dashboard' : '/admin';
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Hiba történt');
        setLoading(false);
        return;
      }

      // Auto-login after successful registration
      const loginResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setSuccess('Sikeres regisztráció! Most már bejelentkezhetsz.');
        setMode('login');
        setLoading(false);
      } else {
        window.location.href = '/admin';
      }
    } catch {
      setError('Hálózati hiba');
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Hiba történt');
        setLoading(false);
        return;
      }

      setSuccess('Ha létezik ilyen fiók, elküldtük a jelszó-visszaállító linket az email címedre.');
      setLoading(false);
    } catch {
      setError('Hálózati hiba');
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    await signIn('google', { callbackUrl: '/admin' });
  }

  const inputClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors";

  return (
    <div className="min-h-screen bg-[var(--surface-raised)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <TrendalyzLogo size="lg" />
          <p className="text-[var(--text-secondary)] text-sm mt-3 max-w-xs">
            Multi-platform social media analitika és riport dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-lg)]">
          {mode === 'forgot' ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Elfelejtett jelszó</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Add meg az email címed és küldünk egy linket a jelszó visszaállításához.
                </p>
              </div>

              {success ? (
                <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/50 rounded-xl p-4 text-emerald-700 dark:text-emerald-300 text-sm">
                  {success}
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="email@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    {loading ? 'Küldés...' : 'Visszaállító link küldése'}
                  </button>
                </form>
              )}

              <button
                onClick={() => switchMode('login')}
                className="mt-4 w-full text-center text-sm text-[var(--accent)] hover:opacity-70 font-semibold transition-opacity"
              >
                Vissza a bejelentkezéshez
              </button>
            </>
          ) : (
            <>
              {/* Mode Toggle */}
              <div className="flex bg-[var(--surface-raised)] rounded-xl p-1 mb-6">
                <button
                  onClick={() => switchMode('login')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    mode === 'login'
                      ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Bejelentkezés
                </button>
                <button
                  onClick={() => switchMode('register')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Regisztráció
                </button>
              </div>

              {success && (
                <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/50 rounded-xl p-4 text-emerald-700 dark:text-emerald-300 text-sm">
                  {success}
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Jelszó</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={`${inputClass} pr-12`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-sm text-[var(--accent)] hover:opacity-70 font-semibold transition-opacity"
                    >
                      Elfelejtettem a jelszavam
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Név</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      placeholder="Teljes neved"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Jelszó</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className={`${inputClass} pr-12`}
                        placeholder="Min. 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    {loading ? 'Regisztráció...' : 'Fiók létrehozása'}
                  </button>
                </form>
              )}

              {hasGoogle && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--border)]"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-[var(--surface)] px-3 text-[var(--text-secondary)] font-semibold">vagy</span>
                    </div>
                  </div>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-bold py-3 px-6 rounded-xl hover:bg-[var(--accent-subtle)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {mode === 'login' ? 'Bejelentkezés Google fiókkal' : 'Regisztráció Google fiókkal'}
                  </button>
                </>
              )}
            </>
          )}

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
