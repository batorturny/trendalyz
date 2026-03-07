// ============================================
// META TOKEN REFRESH JOB
// Re-exchanges long-lived tokens before they expire (60 days)
// Run weekly — tokens expiring within 30 days get refreshed
// ============================================

const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { decrypt, encrypt } = require('../utils/encryption');
const { exchangeLongLivedToken } = require('./metaGraphService');

const META_PROVIDERS = ['FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC'];

async function refreshExpiringSoonTokens() {
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const connections = await prisma.integrationConnection.findMany({
    where: {
      provider: { in: META_PROVIDERS },
      status: { in: ['CONNECTED', 'ERROR'] },
    },
  });

  let refreshed = 0;
  let failed = 0;

  for (const conn of connections) {
    try {
      const meta = conn.metadata;
      if (!meta?.encryptedAccessToken) continue;

      // Skip if token still has more than 30 days left
      if (meta.tokenExpiresAt) {
        const expiresAt = new Date(meta.tokenExpiresAt);
        if (expiresAt > thirtyDaysFromNow) continue;
      }

      const currentToken = decrypt(meta.encryptedAccessToken);
      const { access_token, expires_in } = await exchangeLongLivedToken(currentToken);

      await prisma.integrationConnection.update({
        where: { id: conn.id },
        data: {
          status: 'CONNECTED',
          errorMessage: null,
          lastSyncAt: new Date(),
          metadata: {
            ...meta,
            encryptedAccessToken: encrypt(access_token),
            tokenExpiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
          },
        },
      });

      refreshed++;
      console.log(`[MetaTokenRefresh] Refreshed token for connection ${conn.id} (${conn.provider})`);
    } catch (err) {
      failed++;
      console.error(`[MetaTokenRefresh] Failed for connection ${conn.id}:`, err.message);
      await prisma.integrationConnection.update({
        where: { id: conn.id },
        data: {
          status: 'ERROR',
          errorMessage: `Token refresh failed: ${err.message}`,
        },
      });
    }
  }

  console.log(`[MetaTokenRefresh] Done. Refreshed: ${refreshed}, Failed: ${failed}`);
}

function startMetaTokenRefreshJob() {
  // Run every Monday at 03:00 UTC
  cron.schedule('0 3 * * 1', async () => {
    console.log('[MetaTokenRefresh] Running weekly token refresh...');
    await refreshExpiringSoonTokens();
  });
  console.log('Meta token refresh job scheduled (weekly, Monday 03:00 UTC)');
}

module.exports = { startMetaTokenRefreshJob, refreshExpiringSoonTokens };
