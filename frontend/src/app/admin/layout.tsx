import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="h-screen bg-[var(--surface)] text-[var(--text-primary)] flex overflow-hidden">
      <AdminSidebar userName={session.user.name || session.user.email || 'Admin'} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
