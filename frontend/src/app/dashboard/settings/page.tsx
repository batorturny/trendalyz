import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DeleteAccountButton } from './DeleteAccountButton';

export default async function DashboardSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Beállítások</h1>
        <p className="text-[var(--text-secondary)] mt-1">Fiók beállítások kezelése</p>
      </header>

      {/* Profile info */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-6">
        <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">Profil</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-secondary)]">Email</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{session.user.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-secondary)]">Név</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{session.user.name || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-secondary)]">Szerepkör</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {session.user.role === 'ADMIN' ? 'Adminisztrátor' : 'Kliens'}
            </span>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-xs font-bold text-[var(--error)] uppercase mb-4">Veszélyes zóna</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          A fiók törlése végleges és visszavonhatatlan. Minden adatod elvész.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
