import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Trendalyz
          </Link>
          <nav className="flex gap-6 text-sm text-[var(--text-secondary)]">
            <Link href="/aszf" className="hover:text-[var(--text-primary)] transition-colors">
              ÁSZF
            </Link>
            <Link href="/adatkezeles" className="hover:text-[var(--text-primary)] transition-colors">
              Adatkezelés
            </Link>
            <Link href="/impresszum" className="hover:text-[var(--text-primary)] transition-colors">
              Impresszum
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--text-secondary)]">
        <p>&copy; {new Date().getFullYear()} Trendalyz. Minden jog fenntartva.</p>
      </footer>
    </div>
  );
}
