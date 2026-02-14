// ============================================
// TIKTOK REPORT GENERATOR - EXPRESS SERVER
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WindsorService = require('./services/windsor');
const ChartGenerator = require('./services/chartGenerator');
const { processReport } = require('./services/report');
const { getAllCompanies, getCompanyById, addCompany, removeCompany } = require('./config/companies');
const { chartCatalog, validateChartKeys, getCatalogByCategory } = require('./config/chartCatalog');
const { ENABLE_CHART_API, ENABLE_ACCOUNT_MANAGEMENT, ENABLE_MULTI_PLATFORM } = require('./config/featureFlags');
const { parseUserContext, requireAdmin, requireCompanyAccess } = require('./middleware/authContext');
const { WindsorMultiPlatform } = require('./services/windsorMultiPlatform');
const connectionService = require('./services/connectionService');
const oauthService = require('./services/oauthService');
const { WindsorConnectorService } = require('./services/windsorConnectorService');
const { encrypt } = require('./utils/encryption');
const crypto = require('crypto');
const metaGraphService = require('./services/metaGraphService');
const youtubeDataService = require('./services/youtubeDataService');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Windsor Service instances
const windsor = new WindsorService(process.env.WINDSOR_API_KEY);
const windsorMulti = new WindsorMultiPlatform(process.env.WINDSOR_API_KEY);
const windsorConnector = new WindsorConnectorService(process.env.WINDSOR_API_KEY);

// ============================================
// INTERNAL AUTH MIDDLEWARE
// ============================================

function requireInternalAuth(req, res, next) {
    const apiKey = process.env.INTERNAL_API_KEY;

    // If no INTERNAL_API_KEY is configured, skip auth (dev mode)
    if (!apiKey) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
        return res.status(401).json({ error: 'Unauthorized - Invalid or missing API key' });
    }
    next();
}

// ============================================
// ROUTES
// ============================================

// Health check - always public
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply internal auth and user context parsing to all other routes
app.use('/api', requireInternalAuth);
app.use('/api', parseUserContext);

// Get all companies
app.get('/api/companies', async (req, res) => {
    try {
        const companies = await getAllCompanies();
        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Generate report
app.post('/api/report', requireCompanyAccess(req => req.body.companyId), async (req, res) => {
    try {
        const { companyId, month } = req.body;

        if (!companyId || !month) {
            return res.status(400).json({ error: 'companyId and month are required' });
        }

        const company = await getCompanyById(companyId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Parse month (YYYY-MM format)
        const [year, monthNum] = month.split('-').map(Number);
        const dateFrom = `${year}-${String(monthNum).padStart(2, '0')}-01`;
        const lastDay = new Date(year, monthNum, 0).getDate();
        const dateTo = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`;

        // Calculate previous month
        const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
        const prevYear = monthNum === 1 ? year - 1 : year;
        const prevDateFrom = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
        const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
        const prevDateTo = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${prevLastDay}`;

        console.log(`Fetching data for ${company.name} (${dateFrom} to ${dateTo})`);

        // Fetch current and previous month data
        const [currentData, prevData] = await Promise.all([
            windsor.fetchAllData(company.tiktokAccountId, dateFrom, dateTo),
            windsor.fetchAllData(company.tiktokAccountId, prevDateFrom, prevDateTo)
        ]);

        // Process report
        const reportData = processReport(currentData, prevData);

        res.json({
            company: { id: company.id, name: company.name },
            month: { year, month: monthNum, label: `${year}. ${String(monthNum).padStart(2, '0')}.` },
            dateRange: { from: dateFrom, to: dateTo },
            data: reportData
        });

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

// ============================================
// MULTI-PLATFORM CONNECTIONS (Feature Flag Protected)
// ============================================

if (ENABLE_MULTI_PLATFORM) {
    // Get connections for a company
    app.get('/api/connections/:companyId', requireCompanyAccess(req => req.params.companyId), async (req, res) => {
        try {
            const connections = await connectionService.getConnectionsByCompany(req.params.companyId);
            res.json(connections);
        } catch (error) {
            console.error('Error fetching connections:', error);
            res.status(500).json({ error: 'Failed to fetch connections' });
        }
    });

    // Create a new connection (admin only)
    app.post('/api/connections', requireAdmin, async (req, res) => {
        try {
            const { companyId, provider, externalAccountId, externalAccountName } = req.body;

            if (!companyId || !provider || !externalAccountId) {
                return res.status(400).json({ error: 'companyId, provider, and externalAccountId are required' });
            }

            const validProviders = ['TIKTOK_ORGANIC', 'FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];
            if (!validProviders.includes(provider)) {
                return res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` });
            }

            const connection = await connectionService.createConnection({
                companyId,
                provider,
                externalAccountId,
                externalAccountName,
            });

            res.status(201).json(connection);
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Ez az integráció már létezik ehhez a céghez' });
            }
            console.error('Error creating connection:', error);
            res.status(500).json({ error: 'Failed to create connection' });
        }
    });

    // Test a connection via Windsor API
    app.post('/api/connections/:id/test', requireAdmin, async (req, res) => {
        try {
            const connection = await connectionService.getConnectionById(req.params.id);
            if (!connection) {
                return res.status(404).json({ error: 'Connection not found' });
            }

            const result = await windsorMulti.testConnection(connection.provider, connection.externalAccountId);

            // Update connection status based on test result
            await connectionService.updateConnectionStatus(
                connection.id,
                result.success ? 'CONNECTED' : 'ERROR',
                result.success ? null : result.message
            );

            res.json(result);
        } catch (error) {
            console.error('Error testing connection:', error);
            res.status(500).json({ error: 'Failed to test connection' });
        }
    });

    // Delete a connection (admin only)
    app.delete('/api/connections/:id', requireAdmin, async (req, res) => {
        try {
            await connectionService.deleteConnection(req.params.id);
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting connection:', error);
            res.status(500).json({ error: 'Failed to delete connection' });
        }
    });

    // Discover Windsor accounts for a provider (admin only)
    app.get('/api/windsor/discover-accounts', requireAdmin, async (req, res) => {
        try {
            const { provider } = req.query;

            if (!provider) {
                return res.status(400).json({ error: 'provider query parameter is required' });
            }

            const validProviders = ['TIKTOK_ORGANIC', 'FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];
            if (!validProviders.includes(provider)) {
                return res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` });
            }

            const accounts = await windsorMulti.discoverAccounts(provider);
            res.json({ provider, accounts });
        } catch (error) {
            console.error('Windsor discover error:', error);
            res.status(500).json({ error: 'Failed to discover accounts', details: error.message });
        }
    });

    // List all Windsor datasources (admin only)
    app.get('/api/windsor/datasources', requireAdmin, async (req, res) => {
        try {
            const datasources = await windsorMulti.listDataSources();
            res.json({ datasources });
        } catch (error) {
            console.error('Windsor datasources error:', error);
            res.status(500).json({ error: 'Failed to list datasources', details: error.message });
        }
    });

    // ============================================
    // OAUTH FLOW
    // ============================================

    // Get available OAuth providers (which have env vars configured)
    app.get('/api/oauth/providers', requireAdmin, (req, res) => {
        res.json({ providers: oauthService.getAvailableProviders() });
    });

    // Start OAuth: returns authorization URL
    app.get('/api/oauth/authorize', requireAdmin, (req, res) => {
        try {
            const { provider, companyId, redirectUri } = req.query;

            if (!provider || !companyId) {
                return res.status(400).json({ error: 'provider and companyId are required' });
            }

            if (!redirectUri) {
                return res.status(400).json({ error: 'redirectUri is required' });
            }

            // Validate provider exists in OAUTH_CONFIGS
            if (!oauthService.OAUTH_CONFIGS[provider]) {
                return res.status(400).json({ error: `Ismeretlen provider: ${provider}` });
            }

            // Check if provider has credentials configured
            const availableProviders = oauthService.getAvailableProviders();
            if (!availableProviders.includes(provider)) {
                return res.status(400).json({ error: `${provider} OAuth nincs konfigurálva (hiányzó client ID vagy secret)` });
            }

            const userId = req.userContext?.userId || null;
            const state = oauthService.createState(companyId, provider, userId);

            const authorizationUrl = oauthService.buildAuthUrl(provider, redirectUri, state);
            res.json({ authorizationUrl });
        } catch (error) {
            console.error('OAuth authorize error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Complete OAuth: exchange code, create Windsor connector, create connection
    // No requireAdmin - the state JWT (signed with NEXTAUTH_SECRET) authenticates this request
    app.post('/api/oauth/complete', async (req, res) => {
        let stateCompanyId = null;
        try {
            const { provider, code, state, redirectUri } = req.body;

            if (!provider || !code || !state || !redirectUri) {
                return res.status(400).json({ error: 'provider, code, state, and redirectUri are required' });
            }

            // Verify state JWT
            const { companyId, provider: stateProvider, userId: stateUserId } = oauthService.verifyState(state);
            stateCompanyId = companyId;

            if (stateProvider !== provider) {
                return res.status(400).json({ error: 'Provider mismatch in state token', companyId });
            }

            // Audit log: which user initiated the OAuth flow
            if (stateUserId) {
                console.log(`OAuth complete: userId=${stateUserId}, companyId=${companyId}, provider=${provider}`);
            }

            // Verify company exists
            const company = await getCompanyById(companyId);
            if (!company) {
                return res.status(400).json({ error: 'Cég nem található', companyId });
            }

            // Exchange code for tokens
            const tokens = await oauthService.exchangeCode(provider, code, redirectUri);

            // Create Windsor connector
            const config = oauthService.getConfig(provider);
            let windsorResult = null;
            try {
                windsorResult = await windsorConnector.createConnector(
                    config.windsorConnectorType,
                    tokens.access_token,
                    tokens.refresh_token
                );
            } catch (windsorErr) {
                console.error('Windsor connector creation failed (non-fatal):', windsorErr.message);
            }

            // Platform-specific account discovery using the fresh access token
            let platformAccounts = [];
            try {
                if (provider === 'FACEBOOK_ORGANIC') {
                    platformAccounts = await metaGraphService.discoverFacebookPages(tokens.access_token);
                    console.log(`Discovered ${platformAccounts.length} Facebook pages`);
                } else if (provider === 'INSTAGRAM_ORGANIC') {
                    platformAccounts = await metaGraphService.discoverInstagramAccounts(tokens.access_token);
                    console.log(`Discovered ${platformAccounts.length} Instagram business accounts`);
                } else if (provider === 'YOUTUBE') {
                    platformAccounts = await youtubeDataService.discoverChannels(tokens.access_token);
                    console.log(`Discovered ${platformAccounts.length} YouTube channels`);
                }
            } catch (platformErr) {
                console.error(`Platform account discovery failed for ${provider} (non-fatal):`, platformErr.message);
            }

            // Fall back to Windsor discovery if platform API returned nothing
            if (platformAccounts.length === 0) {
                try {
                    const windsorAccounts = await windsorMulti.discoverAccounts(provider);
                    platformAccounts = windsorAccounts;
                } catch (discoverErr) {
                    console.error('Windsor account discovery failed (non-fatal):', discoverErr.message);
                }
            }

            // Build encrypted metadata — encryption failure is FATAL
            const metadata = {};
            metadata.encryptedAccessToken = encrypt(tokens.access_token);
            if (tokens.refresh_token) {
                metadata.encryptedRefreshToken = encrypt(tokens.refresh_token);
            }
            if (tokens.expires_in) {
                metadata.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
            }
            if (windsorResult?.connectorId) {
                metadata.windsorConnectorId = windsorResult.connectorId;
            }

            // Build externalAccountId with unique fallback
            const externalAccountId = platformAccounts[0]?.accountId
                || tokens.open_id
                || `oauth-${crypto.randomUUID().slice(0, 8)}`;
            const externalAccountName = platformAccounts[0]?.accountName || null;

            // Upsert IntegrationConnection (handles duplicate clicks gracefully)
            const connection = await connectionService.upsertConnection({
                companyId,
                provider,
                externalAccountId,
                externalAccountName,
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            });

            res.json({
                success: true,
                companyId,
                connection,
                discoveredAccounts: platformAccounts.length,
                windsorConnector: !!windsorResult,
            });
        } catch (error) {
            console.error('OAuth complete error:', error);
            res.status(500).json({
                error: error.message,
                companyId: stateCompanyId,
            });
        }
    });

    console.log('Multi-platform connections enabled');
}

// ============================================
// CHART API (Feature Flag Protected)
// ============================================

if (ENABLE_CHART_API) {
    // Get chart catalog
    app.get('/api/charts/catalog', (req, res) => {
        const byCategory = getCatalogByCategory();
        res.json({
            total: chartCatalog.length,
            categories: Object.keys(byCategory),
            charts: chartCatalog.map(c => ({
                key: c.key,
                title: c.title,
                description: c.description,
                type: c.type,
                category: c.category,
                color: c.color,
                platform: c.platform || 'TIKTOK_ORGANIC'
            })),
            byCategory
        });
    });

    // Generate charts
    app.post('/api/charts', requireCompanyAccess(req => req.body.accountId), async (req, res) => {
        try {
            const { accountId, startDate, endDate, charts } = req.body;

            // Validate required fields
            if (!accountId || !startDate || !endDate || !charts || !Array.isArray(charts)) {
                return res.status(400).json({
                    error: 'accountId, startDate, endDate, and charts array are required'
                });
            }

            // Validate chart keys
            const chartKeys = charts.map(c => c.key);
            const validation = validateChartKeys(chartKeys);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Invalid chart keys',
                    invalidKeys: validation.invalidKeys,
                    availableKeys: chartCatalog.map(c => c.key)
                });
            }

            // Get company
            const company = await getCompanyById(accountId);
            if (!company) {
                return res.status(404).json({ error: 'Account not found' });
            }

            console.log(`Generating ${charts.length} charts for ${company.name} (${startDate} - ${endDate})`);

            // Fetch Windsor data
            const windsorData = await windsor.fetchAllChartData(company.tiktokAccountId, startDate, endDate);

            console.log(`Received ${Array.isArray(windsorData) ? windsorData.length : 'invalid'} rows from Windsor`);

            // Generate charts
            const generator = new ChartGenerator(windsorData);
            const results = charts.map(chartReq => {
                try {
                    return generator.generate(chartReq.key, chartReq.params || {});
                } catch (error) {
                    return {
                        key: chartReq.key,
                        error: error.message,
                        empty: true
                    };
                }
            });

            res.json({
                account: { id: company.id, name: company.name },
                dateRange: { from: startDate, to: endDate },
                chartsRequested: charts.length,
                chartsGenerated: results.filter(r => !r.error).length,
                charts: results
            });

        } catch (error) {
            console.error('Chart generation error:', error);
            res.status(500).json({ error: 'Failed to generate charts', details: error.message });
        }
    });

    console.log('Chart API enabled');
}

// ============================================
// ACCOUNT MANAGEMENT (Feature Flag Protected)
// ============================================

if (ENABLE_ACCOUNT_MANAGEMENT) {
    // Add new account
    app.post('/api/accounts', async (req, res) => {
        try {
            const { name, tiktokAccountId } = req.body;

            if (!name || !tiktokAccountId) {
                return res.status(400).json({
                    error: 'name and tiktokAccountId are required'
                });
            }

            const newAccount = await addCompany({ name, tiktokAccountId });
            res.status(201).json({ success: true, account: newAccount });

        } catch (error) {
            res.status(500).json({ error: 'Failed to add account', details: error.message });
        }
    });

    // Delete account
    app.delete('/api/accounts/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const removed = await removeCompany(id);

            if (!removed) {
                return res.status(404).json({ error: 'Account not found' });
            }

            res.json({ success: true, message: `Account ${id} removed` });

        } catch (error) {
            res.status(500).json({ error: 'Failed to remove account', details: error.message });
        }
    });

    console.log('Account Management enabled');
}

// ============================================
// START SERVER
// ============================================

app.listen(PORT, async () => {
    try {
        const companies = await getAllCompanies();
        console.log(`TikTok Report API running on http://localhost:${PORT}`);
        console.log(`Companies loaded: ${companies.length}`);
    } catch (error) {
        console.log(`TikTok Report API running on http://localhost:${PORT}`);
        console.error('Warning: Could not load companies from database:', error.message);
    }
});
