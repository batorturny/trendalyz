'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="hu">
      <body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#1a1a1e', color: '#f0f0f2', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Hiba történt</h2>
          <p style={{ color: '#9a9aa0', fontSize: 14, marginBottom: 24 }}>
            {error.message || 'Váratlan hiba lépett fel. Kérjük, próbáld újra.'}
          </p>
          <button
            onClick={reset}
            style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Újrapróbálás
          </button>
        </div>
      </body>
    </html>
  );
}
