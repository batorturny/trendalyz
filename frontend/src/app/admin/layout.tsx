import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <AdminSidebar userName={session.user.name || session.user.email || 'Admin'} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
