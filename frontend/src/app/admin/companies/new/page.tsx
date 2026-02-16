'use client';

import { createCompany } from '../actions';

export default function NewCompanyPage() {
  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">Új cég hozzáadása</h1>
        <p className="text-[var(--text-secondary)] mt-1">Cég létrehozása és opcionális ügyfél meghívó</p>
      </header>

      <form action={createCompany} className="max-w-xl space-y-6">
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
              Cégnév *
            </label>
            <input
              name="name"
              required
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-emerald-500 focus:outline-none"
              placeholder="Pl. Example Kft."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
              TikTok Account ID
            </label>
            <input
              name="tiktokAccountId"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-emerald-500 focus:outline-none font-mono text-sm"
              placeholder="_000..."
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">Windsor AI TikTok connector account azonosító</p>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
              Ügyfél email (opcionális)
            </label>
            <input
              name="clientEmail"
              type="email"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-emerald-500 focus:outline-none"
              placeholder="ugyfel@ceg.hu"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">Ha megadod, automatikusan létrehozunk egy felhasználót és meghívó emailt küldünk</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.97] transition-all duration-150"
          >
            Cég létrehozása
          </button>
          <a
            href="/admin/companies"
            className="px-6 py-3 bg-[var(--accent-subtle)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--border)] transition-all"
          >
            Mégse
          </a>
        </div>
      </form>
    </div>
  );
}
