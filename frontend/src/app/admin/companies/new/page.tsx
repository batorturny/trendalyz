'use client';

import { createCompany } from '../actions';

export default function NewCompanyPage() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black">Új cég hozzáadása</h1>
        <p className="text-slate-400 mt-1">Cég létrehozása és opcionális ügyfél meghívó</p>
      </header>

      <form action={createCompany} className="max-w-xl space-y-6">
        <div className="bg-white/5 border border-white/15 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Cégnév *
            </label>
            <input
              name="name"
              required
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
              placeholder="Pl. Example Kft."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              TikTok Account ID
            </label>
            <input
              name="tiktokAccountId"
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none font-mono text-sm"
              placeholder="_000..."
            />
            <p className="text-xs text-slate-500 mt-1">Windsor AI TikTok connector account azonosító</p>
          </div>

          <div className="border-t border-white/10 pt-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Ügyfél email (opcionális)
            </label>
            <input
              name="clientEmail"
              type="email"
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
              placeholder="ugyfel@ceg.hu"
            />
            <p className="text-xs text-slate-500 mt-1">Ha megadod, automatikusan létrehozunk egy felhasználót és meghívó emailt küldünk</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-purple-400 transition-all"
          >
            Cég létrehozása
          </button>
          <a
            href="/admin/companies"
            className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
          >
            Mégse
          </a>
        </div>
      </form>
    </div>
  );
}
