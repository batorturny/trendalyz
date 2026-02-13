'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [mode, setMode] = useState<'admin' | 'client'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleAdminLogin(e: React.FormEvent) {
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
      window.location.href = '/admin';
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('email', {
      email,
      redirect: false,
    });

    if (result?.error) {
      setError('Hiba történt a link küldésekor. Ellenőrizd az email címed.');
      setLoading(false);
    } else {
      setMagicLinkSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white">TikTok Report</h1>
          <p className="text-cyan-400 font-semibold mt-2">Bejelentkezés</p>
        </div>

        {/* Mode Selector */}
        <div className="flex mb-6 bg-white/5 rounded-2xl p-1">
          <button
            onClick={() => { setMode('admin'); setError(null); setMagicLinkSent(false); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              mode === 'admin'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => { setMode('client'); setError(null); setMagicLinkSent(false); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              mode === 'client'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ügyfél
          </button>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/15 rounded-3xl p-8">
          {magicLinkSent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✉️</div>
              <h2 className="text-xl font-bold text-white mb-2">Email elküldve!</h2>
              <p className="text-slate-400">
                Ellenőrizd a postaládádat és kattints a bejelentkezési linkre.
              </p>
              <button
                onClick={() => { setMagicLinkSent(false); setEmail(''); }}
                className="mt-6 text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
              >
                Újra próbálom
              </button>
            </div>
          ) : mode === 'admin' ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Jelszó
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Email cím
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                  placeholder="ugyfel@ceg.hu"
                />
              </div>
              <p className="text-xs text-slate-400">
                Egy bejelentkezési linket küldünk az email címedre.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Küldés...' : 'Link küldése'}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
