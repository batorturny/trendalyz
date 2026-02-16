// ============================================
// ADMIN KEY SERVICE
// Resolves per-admin Windsor API keys
// ============================================

const prisma = require('../lib/prisma');
const { decrypt } = require('../utils/encryption');

/**
 * Get Windsor API key for a specific admin user.
 * Only uses the admin's personally saved key — no env fallback.
 */
async function getWindsorApiKey(adminUserId) {
  if (adminUserId) {
    const user = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { windsorApiKeyEnc: true, role: true },
    });

    if (user?.windsorApiKeyEnc) {
      return decrypt(user.windsorApiKeyEnc);
    }
  }

  throw new Error('Nincs Windsor API kulcs konfigurálva. Kérjük, add meg a Beállítások oldalon.');
}

/**
 * Get Windsor API key for a company by resolving its owning admin.
 * Falls back to global key if company has no adminId.
 */
async function getWindsorApiKeyForCompany(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { adminId: true },
  });

  return getWindsorApiKey(company?.adminId || null);
}

module.exports = { getWindsorApiKey, getWindsorApiKeyForCompany };
