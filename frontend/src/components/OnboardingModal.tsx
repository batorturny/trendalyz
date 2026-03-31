'use client';

import { useState, useEffect } from 'react';
import { BaseModal } from './BaseModal';
import { BarChart3, MousePointerClick, FileDown, MessageCircle, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const STORAGE_KEY = 'trendalyz-onboarding-seen-v1';

const STEPS = [
  {
    icon: <BarChart3 className="w-10 h-10 text-[var(--accent)]" />,
    title: 'Üdvözlünk a Trendalyz-ban!',
    text: 'Ez a platform a social media csatornáid havi teljesítményét mutatja be — TikTok, Facebook, YouTube és más platformokra.',
    tip: 'Válaszd ki a hónapot a legördülő menüből, majd kattints a "Riport generálása" gombra az adatok betöltéséhez.',
  },
  {
    icon: <MousePointerClick className="w-10 h-10 text-[var(--accent)]" />,
    title: 'KPI kártyák — kattints rájuk!',
    text: 'Minden szám egy mérőszám (KPI). Ha rákattintasz, részletes magyarázatot kapsz: mit jelent az adott mutató, mi az ideális érték, és hogyan javíthatsz rajta.',
    tip: 'Pl. az "ER%" (Engagement Rate) a legfontosabb elkötelezettségi mutató — kattints rá, hogy megtudd mi számít jónak a TikTokon!',
  },
  {
    icon: <BarChart3 className="w-10 h-10 text-[var(--accent)]" />,
    title: 'Chartok és videó teljesítmény',
    text: 'A KPI kártyák alatt megtalálod a napi trend chartokat és a videóid részletes teljesítménytáblázatát — megtekintések, like-ok, kommentek, megosztások.',
    tip: 'A chart fejlécén lévő "?" gombra kattintva megértheted, mit mér az adott grafikon.',
  },
  {
    icon: <FileDown className="w-10 h-10 text-[var(--accent)]" />,
    title: 'PDF letöltés',
    text: 'A riportot PDF formátumban is letöltheted a "Letöltés PDF-ben" gombbal — tökéletes prezentációhoz vagy archiváláshoz.',
    tip: 'A PDF A4 méretű, tartalmazza a KPI-okat, chartokat és a videótáblázatot.',
  },
  {
    icon: <MessageCircle className="w-10 h-10 text-[var(--accent)]" />,
    title: 'Értékelések és visszajelzések',
    text: 'A jobb alsó sarokban lévő chat gombra kattintva üzeneteket kaphatsz az ügynökségtől és reagálhatsz rájuk emoji-kkal vagy szöveges válasszal.',
    tip: 'Ha piros pont jelenik meg a chat gombon, olvasatlan üzeneted érkezett!',
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <BaseModal open={open} onClose={handleClose} className="max-w-md p-0 overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-[var(--border)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="p-8">
        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-[var(--accent)]' : i < step ? 'w-3 bg-[var(--accent)]/40' : 'w-3 bg-[var(--border)]'}`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="mb-4">{current.icon}</div>

        {/* Content */}
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{current.title}</h3>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">{current.text}</p>

        {/* Tip */}
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 mb-6">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <span className="font-bold text-[var(--accent)]">💡 Tipp: </span>
            {current.tip}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-0 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Vissza
          </button>

          {isLast ? (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:brightness-110 transition-all"
            >
              <Check className="w-4 h-4" /> Értem, kezdjük!
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:brightness-110 transition-all"
            >
              Tovább <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
