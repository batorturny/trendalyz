// ============================================
// WINDSOR AI CLIENT - Adapter for future automation
// ============================================
// NOTE: Windsor AI currently requires manual browser-based TikTok login
// to create connectors. These methods are stubs for when/if Windsor
// provides API-based connector management.

class WindsorClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://connectors.windsor.ai/api/v1';
    }

    /**
     * Ensure a Windsor user exists for the given email
     * TODO: Implement when Windsor provides user management API
     */
    async ensureUser(email) {
        console.log(`[WindsorClient] ensureUser stub called for: ${email}`);
        return { id: null, email, status: 'NOT_IMPLEMENTED' };
    }

    /**
     * Ensure a workspace exists for the user
     * TODO: Implement when Windsor provides workspace management API
     */
    async ensureWorkspace(userId) {
        console.log(`[WindsorClient] ensureWorkspace stub called for userId: ${userId}`);
        return { id: null, userId, status: 'NOT_IMPLEMENTED' };
    }

    /**
     * Attach a TikTok connector to a workspace using OAuth tokens
     * TODO: Implement when Windsor provides connector attachment API
     */
    async attachConnector(workspaceId, tokens) {
        console.log(`[WindsorClient] attachConnector stub called for workspace: ${workspaceId}`);
        return { id: null, workspaceId, status: 'NOT_IMPLEMENTED' };
    }

    /**
     * Get the status of a TikTok connector in a workspace
     * TODO: Implement when Windsor provides connector status API
     */
    async getConnectorStatus(workspaceId) {
        console.log(`[WindsorClient] getConnectorStatus stub called for workspace: ${workspaceId}`);
        return { status: 'NOT_IMPLEMENTED', message: 'Manual setup required via Windsor dashboard' };
    }
}

module.exports = WindsorClient;
