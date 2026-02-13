import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CompanyEditForm } from './CompanyEditForm';
import { CompanyUsers } from './CompanyUsers';

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
      integrations: true,
    },
  });

  if (!company) notFound();

  return (
    <div className="p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/admin/companies" className="text-slate-400 hover:text-white text-sm">&larr; Vissza</a>
        </div>
        <h1 className="text-3xl font-black">{company.name}</h1>
        <p className="text-slate-400 mt-1">Cég részletei és szerkesztés</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit form */}
        <CompanyEditForm company={{
          id: company.id,
          name: company.name,
          tiktokAccountId: company.tiktokAccountId,
          status: company.status,
        }} />

        {/* Users */}
        <CompanyUsers
          companyId={company.id}
          users={company.users.map((u: { id: string; email: string; name: string | null; createdAt: Date }) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            createdAt: u.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
