'use client';

import { useState, useEffect, useCallback } from 'react';
import { MonthPicker } from '@/components/MonthPicker';
import { Save, Loader2, Check, FileText } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface Props {
  companyId: string;
}

export function MonthlyAnalysis({ companyId }: Props) {
  const t = useT();
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const defaultMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const [month, setMonth] = useState(defaultMonth);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchAnalysis = useCallback(async (m: string) => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/analysis?companyId=${companyId}&month=${m}`);
      const data = await res.json();
      setContent(data.content ?? '');
    } catch {
      setContent('');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAnalysis(month);
  }, [month, fetchAnalysis]);

  const handleMonthChange = (m: string) => {
    setMonth(m);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, month, content }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const [y, mo] = month.split('-').map(Number);
  const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  const monthLabel = `${y}. ${MONTHS[mo - 1]}`;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
            {t('Havi elemzés az ügyfélnek')}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {t('Írj havi összefoglalót — az ügyfél látja a dashboardján, amikor kiválasztja a hónapot')}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white dark:text-[var(--surface)] font-bold py-2 px-4 rounded-xl hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shrink-0"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? t('Mentve') : t('Mentés')}
        </button>
      </div>

      <div className="mb-4 max-w-xs">
        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">{t('Hónap')}</label>
        <MonthPicker value={month} onChange={handleMonthChange} />
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-[var(--text-secondary)] text-sm">
          {t('Betöltés...')}
        </div>
      ) : (
        <>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
            {monthLabel} — {t('elemzés szövege')}
          </label>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setSaved(false); }}
            placeholder={`${t('Írd ide a havi értékelést az ügyfélnek...')}\n\n${t('Pl.: Ebben a hónapban kiemelkedő eredményeket értünk el az elérés terén...')}`}
            rows={10}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all resize-y leading-relaxed"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            {t('Az ügyfél ezt az elemzést látja a dashboardján, amikor a(z)')} <span className="font-semibold">{monthLabel}</span> {t('hónapot kiválasztja.')}
            {content.length > 0 && ` (${content.length} ${t('karakter')})`}
          </p>
        </>
      )}
    </div>
  );
}
