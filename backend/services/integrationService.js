// ============================================
// INTEGRATION SERVICE - CRUD for provider integrations
// ============================================

const prisma = require('../lib/prisma');
const { encrypt, decrypt } = require('../lib/crypto');

class IntegrationService {
    /**
     * Get integration for a company and provider
     */
    async get(companyId, provider) {
        const integration = await prisma.integration.findUnique({
            where: { companyId_provider: { companyId, provider } },
        });

        if (!integration) return null;

        // Decrypt tokens before returning
        return {
            ...integration,
            accessToken: integration.accessTokenEnc ? decrypt(integration.accessTokenEnc) : null,
            refreshToken: integration.refreshTokenEnc ? decrypt(integration.refreshTokenEnc) : null,
        };
    }

    /**
     * Create or update an integration
     */
    async upsert(companyId, provider, data = {}) {
        const updateData = {
            status: data.status || 'PENDING',
            errorMessage: data.errorMessage || null,
            lastSyncAt: data.lastSyncAt || null,
        };

        // Encrypt tokens if provided
        if (data.accessToken !== undefined) {
            updateData.accessTokenEnc = data.accessToken ? encrypt(data.accessToken) : null;
        }
        if (data.refreshToken !== undefined) {
            updateData.refreshTokenEnc = data.refreshToken ? encrypt(data.refreshToken) : null;
        }
        if (data.expiresAt !== undefined) {
            updateData.expiresAt = data.expiresAt;
        }

        return prisma.integration.upsert({
            where: { companyId_provider: { companyId, provider } },
            create: {
                companyId,
                provider,
                ...updateData,
            },
            update: updateData,
        });
    }

    /**
     * Update integration status
     */
    async updateStatus(companyId, provider, status, errorMessage = null) {
        return prisma.integration.update({
            where: { companyId_provider: { companyId, provider } },
            data: { status, errorMessage },
        });
    }

    /**
     * Get all integrations for a company
     */
    async getAllForCompany(companyId) {
        return prisma.integration.findMany({
            where: { companyId },
        });
    }

    /**
     * Delete an integration
     */
    async delete(companyId, provider) {
        return prisma.integration.delete({
            where: { companyId_provider: { companyId, provider } },
        });
    }
}

module.exports = new IntegrationService();
