// ============================================
// ADMIN KEY SERVICE
// Resolves per-admin Windsor API keys
// ============================================

const prisma = require('../lib/prisma');
const { decrypt } = require('../utils/encryption');

/**
 * Get Windsor API key for a specific admin user.
 * Priority: admin's personal key → WINDSOR_API_KEY env var.
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

  // Fallback to central Windsor API key
  if (process.env.WINDSOR_API_KEY) {
    return process.env.WINDSOR_API_KEY;
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
