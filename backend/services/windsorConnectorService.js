// ============================================
// WINDSOR CONNECTOR SERVICE
// Creates connectors in Windsor AI via API
// ============================================

const axios = require('axios');

const WINDSOR_BASE = 'https://connectors.windsor.ai';

class WindsorConnectorService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async createConnector(connectorType, accessToken, refreshToken = null) {
    const url = `${WINDSOR_BASE}/api/v1/connectors?api_key=${this.apiKey}`;

    const credentials = { access_token: accessToken };
    if (refreshToken) {
      credentials.refresh_token = refreshToken;
    }

    try {
      const response = await axios.post(url, {
        connector_type: connectorType,
        credentials,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      return {
        connectorId: response.data?.connector_id || response.data?.id || null,
        message: response.data?.message || 'Connector created',
        raw: response.data,
      };
    } catch (error) {
      const detail = error.response?.data?.message || error.response?.data?.error || error.message;
      console.error(`Windsor connector creation failed (${connectorType}):`, detail);
      throw new Error(`Windsor connector creation failed: ${detail}`);
    }
  }
}

module.exports = { WindsorConnectorService };
