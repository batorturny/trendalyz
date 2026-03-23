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
          className="px-6 py-3 bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white font-bold rounded-xl hover:from-[#8ec8d8] hover:to-[#1a6b8a]"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}
