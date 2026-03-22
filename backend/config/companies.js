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
    select: {
      id: true,
      name: true,
      tiktokAccountId: true,
      integrationConnections: {
        where: { status: 'CONNECTED' },
        select: { provider: true },
      },
    },
    orderBy: { name: 'asc' },
  });
  return companies.map(c => {
    const platforms = c.integrationConnections.map(ic => ic.provider);
    // Legacy companies with tiktokAccountId but no IntegrationConnection
    if (c.tiktokAccountId && !platforms.includes('TIKTOK_ORGANIC')) {
      platforms.push('TIKTOK_ORGANIC');
    }
    return {
      id: c.id,
      name: c.name,
      connectedPlatforms: platforms,
    };
  });
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
