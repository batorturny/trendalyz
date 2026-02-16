// ============================================
// COMPANIES CONFIG - Prisma-backed
// ============================================

const prisma = require('../lib/prisma');

async function getCompanyById(id) {
  return prisma.company.findUnique({ where: { id } });
}

async function getAllCompanies(adminId = null) {
  const where = { status: 'ACTIVE' };
  if (adminId) where.adminId = adminId;
  const companies = await prisma.company.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return companies;
}

async function addCompany({ name, tiktokAccountId }) {
  const company = await prisma.company.create({
    data: { name, tiktokAccountId, status: 'ACTIVE' },
  });
  return { id: company.id, name: company.name };
}

async function removeCompany(id) {
  try {
    await prisma.company.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

module.exports = { getCompanyById, getAllCompanies, addCompany, removeCompany };
