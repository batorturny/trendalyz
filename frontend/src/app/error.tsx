'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Hiba történt</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6">
          {error.message || 'Váratlan hiba lépett fel.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-cyan-400"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
