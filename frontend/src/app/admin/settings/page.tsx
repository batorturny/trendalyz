import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { WindsorApiKeyForm } from './WindsorApiKeyForm';
import { DeleteAccountButton } from '@/app/dashboard/settings/DeleteAccountButton';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { windsorApiKeyEnc: true },
  });

  let keyHint: string | null = null;
  if (user?.windsorApiKeyEnc) {
    try {
      const decrypted = decrypt(user.windsorApiKeyEnc);
      keyHint = decrypted.slice(-4);
    } catch {
      keyHint = '????';
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Beállítások</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          API kulcsok és integrációk kezelése
        </p>
      </header>

      <div className="space-y-6">
        <section>
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">Integrációk</h2>
          <WindsorApiKeyForm hasKey={!!user?.windsorApiKeyEnc} keyHint={keyHint} />
        </section>

        <section className="pt-6 border-t border-[var(--border)]">
          <h2 className="text-xs font-bold text-[var(--error)] uppercase mb-3">Veszélyes zóna</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            A fiók törlése végleges és visszavonhatatlan. Minden adatod elvész.
          </p>
          <DeleteAccountButton />
        </section>
      </div>
    </div>
  );
}
