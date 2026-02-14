// ============================================
// CONNECTION SERVICE - IntegrationConnection CRUD
// ============================================

const prisma = require('../lib/prisma');

async function getConnectionsByCompany(companyId) {
  return prisma.integrationConnection.findMany({
    where: { companyId },
    orderBy: [{ provider: 'asc' }, { createdAt: 'asc' }],
  });
}

async function getConnectionById(id) {
  return prisma.integrationConnection.findUnique({ where: { id } });
}

async function getConnectionsByProvider(companyId, provider) {
  return prisma.integrationConnection.findMany({
    where: { companyId, provider },
  });
}

async function createConnection({ companyId, provider, externalAccountId, externalAccountName, metadata }) {
  return prisma.integrationConnection.create({
    data: {
      companyId,
      provider,
      externalAccountId,
      externalAccountName: externalAccountName || null,
      status: 'CONNECTED',
      metadata: metadata || undefined,
    },
  });
}

async function upsertConnection({ companyId, provider, externalAccountId, externalAccountName, metadata }) {
  return prisma.integrationConnection.upsert({
    where: {
      companyId_provider_externalAccountId: { companyId, provider, externalAccountId },
    },
    update: {
      status: 'CONNECTED',
      externalAccountName: externalAccountName || null,
      metadata: metadata || undefined,
      errorMessage: null,
      lastSyncAt: new Date(),
    },
    create: {
      companyId,
      provider,
      externalAccountId,
      externalAccountName: externalAccountName || null,
      status: 'CONNECTED',
      metadata: metadata || undefined,
    },
  });
}

async function deleteConnection(id) {
  return prisma.integrationConnection.delete({ where: { id } });
}

async function updateConnectionStatus(id, status, errorMessage = null) {
  const data = { status, errorMessage };
  if (status === 'CONNECTED') {
    data.lastSyncAt = new Date();
    data.errorMessage = null;
  }
  return prisma.integrationConnection.update({
    where: { id },
    data,
  });
}

module.exports = {
  getConnectionsByCompany,
  getConnectionById,
  getConnectionsByProvider,
  createConnection,
  upsertConnection,
  deleteConnection,
  updateConnectionStatus,
};
