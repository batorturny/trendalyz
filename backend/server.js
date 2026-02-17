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
const { ENABLE_CHART_API, ENABLE_ACCOUNT_MANAGEMENT, ENABLE_MULTI_PLATFORM, ENABLE_BILLING } = require('./config/featureFlags');
const { parseUserContext, requireAdmin, requireCompanyAccess } = require('./middleware/authContext');
const { WindsorMultiPlatform } = require('./services/windsorMultiPlatform');
const connectionService = require('./services/connectionService');
const oauthService = require('./services/oauthService');
const { WindsorConnectorService } = require('./services/windsorConnectorService');
const { encrypt } = require('./utils/encryption');
const crypto = require('crypto');
const metaGraphService = require('./services/metaGraphService');
const youtubeDataService = require('./services/youtubeDataService');
const { getWindsorApiKey, getWindsorApiKeyForCompany } = require('./services/adminKeyService');
const prisma = require('./lib/prisma');

const app = express();

// ============================================
// STRIPE WEBHOOK — must be BEFORE express.json()
// Raw body needed for Stripe signature verification
// ============================================
if (ENABLE_BILLING) {
    const stripeService = require('./services/stripeService');

    app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        let event;
        try {
            event = stripeService.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            console.error('[Stripe Webhook] Signature verification failed:', err.message);
            return res.status(400).json({ error: 'Webhook signature verification failed' });
        }

        try {
            switch (event.type) {
                case 'customer.subscription.created':
                    await stripeService.handleSubscriptionCreated(event.data.object);
                    break;
                case 'customer.subscription.updated':
                    await stripeService.handleSubscriptionUpdated(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await stripeService.handleSubscriptionDeleted(event.data.object);
                    break;
                case 'invoice.paid':
                    await stripeService.handleInvoicePaid(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await stripeService.handlePaymentFailed(event.data.object);
                    break;
                default:
                    console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
            }
            res.json({ received: true });
        } catch (err) {
            console.error(`[Stripe Webhook] Handler error for ${event.type}:`, err);
            res.status(500).json({ error: 'Webhook handler error' });
        }
    });

    console.log('Stripe webhook endpoint registered (raw body)');
}

/**
 * Resolve TikTok account ID for a company.
 * First checks legacy tiktokAccountId field, then falls back to IntegrationConnection.
 */
async function resolveTiktokAccountId(company) {
    if (company.tiktokAccountId) return company.tiktokAccountId;

    const connection = await prisma.integrationConnection.findFirst({
        where: { companyId: company.id, provider: 'TIKTOK_ORGANIC' },
        select: { externalAccountId: true },
    });

    if (connection?.externalAccountId) return connection.externalAccountId;

    return null;
}
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Per-request Windsor service factory
function createWindsorServices(apiKey) {
    return {
        windsor: new WindsorService(apiKey),
        windsorMulti: new WindsorMultiPlatform(apiKey),
        windsorConnector: new WindsorConnectorService(apiKey),
    };
}

/**
 * Resolve Windsor API key for the current request.
 * For ADMIN users: use their personal key.
 * For CLIENT users: resolve via their company's owning admin.
 */
async function resolveWindsorKey(req) {
    const { userId, role, companyId } = req.userContext || {};
    if (role === 'ADMIN') {
        return getWindsorApiKey(userId);
    }
    if (companyId) {
        return getWindsorApiKeyForCompany(companyId);
    }
    return getWindsorApiKey(null); // fallback to global
}

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
        const adminId = req.userContext?.role === 'ADMIN' ? req.userContext.userId : null;
        const companies = await getAllCompanies(adminId);
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

        // Resolve TikTok account ID (legacy field or IntegrationConnection)
        const tiktokAccountId = await resolveTiktokAccountId(company);

        // Resolve Windsor API key for this request
        const apiKey = await resolveWindsorKey(req);
        const { windsor: windsorSvc } = createWindsorServices(apiKey);

        // Fetch current and previous month data
        const [currentData, prevData] = await Promise.all([
            windsorSvc.fetchAllData(tiktokAccountId, dateFrom, dateTo),
            windsorSvc.fetchAllData(tiktokAccountId, prevDateFrom, prevDateTo)
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

            const apiKey = await resolveWindsorKey(req);
            const { windsorMulti: wm } = createWindsorServices(apiKey);
            const result = await wm.testConnection(connection.provider, connection.externalAccountId);

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

            const apiKey = await resolveWindsorKey(req);
            const { windsorMulti: wm } = createWindsorServices(apiKey);
            const accounts = await wm.discoverAccounts(provider);
            res.json({ provider, accounts });
        } catch (error) {
            console.error('Windsor discover error:', error);
            res.status(500).json({ error: 'Failed to discover accounts', details: error.message });
        }
    });

    // List all Windsor datasources (admin only)
    app.get('/api/windsor/datasources', requireAdmin, async (req, res) => {
        try {
            const apiKey = await resolveWindsorKey(req);
            const { windsorMulti: wm } = createWindsorServices(apiKey);
            const datasources = await wm.listDataSources();
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

            const config = oauthService.getConfig(provider);

            // Resolve Windsor key from the user who initiated the OAuth flow
            const oauthApiKey = await getWindsorApiKey(stateUserId || null);
            const { windsorMulti: wmOauth } = createWindsorServices(oauthApiKey);

            // Check if Windsor already has this datasource configured
            let windsorReady = false;
            try {
                const testResult = await wmOauth.testConnection(provider, 'any');
                windsorReady = !testResult.needsWindsorSetup;
            } catch {
                windsorReady = false;
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
                    const windsorAccounts = await wmOauth.discoverAccounts(provider);
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

            const windsorOnboardUrl = !windsorReady
                ? `https://onboard.windsor.ai?datasource=${config.windsorConnectorType}`
                : null;

            res.json({
                success: true,
                companyId,
                connection,
                discoveredAccounts: platformAccounts.length,
                windsorReady,
                windsorOnboardUrl,
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

            // Validate chart keys — skip any unknown ones instead of rejecting the whole request
            const chartKeys = charts.map(c => c.key);
            const validation = validateChartKeys(chartKeys);
            let validCharts = charts;
            if (!validation.valid) {
                console.warn('[CHART API] Skipping invalid chart keys:', validation.invalidKeys);
                const validKeySet = new Set(chartCatalog.map(c => c.key));
                validCharts = charts.filter(c => validKeySet.has(c.key));
                if (validCharts.length === 0) {
                    return res.status(400).json({
                        error: 'No valid chart keys provided',
                        invalidKeys: validation.invalidKeys,
                        availableKeys: chartCatalog.map(c => c.key)
                    });
                }
            }

            // Get company
            const company = await getCompanyById(accountId);
            if (!company) {
                return res.status(404).json({ error: 'Account not found' });
            }

            console.log(`Generating ${validCharts.length} charts for ${company.name} (${startDate} - ${endDate})`);

            // Resolve TikTok account ID (legacy field or IntegrationConnection)
            const tiktokAccountId = await resolveTiktokAccountId(company);

            // Fetch Windsor data
            const chartApiKey = await resolveWindsorKey(req);
            const { windsor: windsorChart } = createWindsorServices(chartApiKey);
            const windsorData = await windsorChart.fetchAllChartData(tiktokAccountId, startDate, endDate);

            console.log(`Received ${Array.isArray(windsorData) ? windsorData.length : 'invalid'} rows from Windsor`);

            // Generate charts
            const generator = new ChartGenerator(windsorData, startDate, endDate);
            const results = validCharts.map(chartReq => {
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
                chartsRequested: validCharts.length,
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
// REPORT SUMMARY ROUTES
// ============================================

app.post('/api/summary', requireInternalAuth, async (req, res) => {
    try {
        const { companyId, month, content } = req.body;
        if (!companyId || !month) return res.status(400).json({ error: 'Missing companyId or month' });

        const summary = await prisma.reportSummary.upsert({
            where: {
                companyId_month: {
                    companyId,
                    month,
                },
            },
            update: { content },
            create: {
                companyId,
                month,
                content,
            },
        });
        res.json(summary);
    } catch (error) {
        console.error('Error saving summary:', error);
        res.status(500).json({ error: 'Failed to save summary' });
    }
});

app.get('/api/summary/:companyId/:month', requireCompanyAccess(req => req.params.companyId), async (req, res) => {
    try {
        const { companyId, month } = req.params;
        const summary = await prisma.reportSummary.findUnique({
            where: {
                companyId_month: {
                    companyId,
                    month,
                },
            },
        });
        res.json(summary || { content: '' });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// ============================================
// BILLING ROUTES (Feature Flag Protected)
// ============================================

if (ENABLE_BILLING) {
    const stripeService = require('./services/stripeService');
    const { PLANS } = require('./config/plans');

    // Get current subscription
    app.get('/api/billing/subscription', requireAdmin, async (req, res) => {
        try {
            const sub = await stripeService.getSubscription(req.userContext.userId);
            res.json(sub || { tier: 'FREE', status: 'ACTIVE', companyLimit: 1 });
        } catch (error) {
            console.error('Error fetching subscription:', error);
            res.status(500).json({ error: 'Failed to fetch subscription' });
        }
    });

    // Create checkout session
    app.post('/api/billing/checkout', requireAdmin, async (req, res) => {
        try {
            const { tier, currency = 'eur', successUrl, cancelUrl } = req.body;

            if (!tier || !successUrl || !cancelUrl) {
                return res.status(400).json({ error: 'tier, successUrl, and cancelUrl are required' });
            }

            const user = await prisma.user.findUnique({
                where: { id: req.userContext.userId },
                select: { email: true, name: true },
            });

            const result = await stripeService.createCheckoutSession({
                userId: req.userContext.userId,
                email: user.email,
                name: user.name || user.email,
                tier,
                currency,
                successUrl,
                cancelUrl,
            });

            res.json(result);
        } catch (error) {
            console.error('Error creating checkout:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Customer portal session
    app.post('/api/billing/portal', requireAdmin, async (req, res) => {
        try {
            const { returnUrl } = req.body;
            const sub = await prisma.subscription.findUnique({
                where: { userId: req.userContext.userId },
                select: { stripeCustomerId: true },
            });

            if (!sub?.stripeCustomerId) {
                return res.status(404).json({ error: 'Nincs Stripe fiók' });
            }

            const result = await stripeService.createPortalSession(sub.stripeCustomerId, returnUrl);
            res.json(result);
        } catch (error) {
            console.error('Error creating portal session:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Change plan
    app.post('/api/billing/change-plan', requireAdmin, async (req, res) => {
        try {
            const { tier, currency = 'eur' } = req.body;
            if (!tier) return res.status(400).json({ error: 'tier is required' });

            const result = await stripeService.changePlan(req.userContext.userId, tier, currency);
            res.json(result);
        } catch (error) {
            console.error('Error changing plan:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Cancel subscription
    app.post('/api/billing/cancel', requireAdmin, async (req, res) => {
        try {
            const result = await stripeService.cancelSubscription(req.userContext.userId);
            res.json(result);
        } catch (error) {
            console.error('Error canceling subscription:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Reactivate subscription
    app.post('/api/billing/reactivate', requireAdmin, async (req, res) => {
        try {
            const result = await stripeService.reactivateSubscription(req.userContext.userId);
            res.json(result);
        } catch (error) {
            console.error('Error reactivating subscription:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get invoices
    app.get('/api/billing/invoices', requireAdmin, async (req, res) => {
        try {
            const sub = await prisma.subscription.findUnique({
                where: { userId: req.userContext.userId },
                select: { stripeCustomerId: true },
            });

            if (!sub?.stripeCustomerId) {
                return res.json([]);
            }

            const invoices = await stripeService.getInvoices(sub.stripeCustomerId);
            res.json(invoices);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            res.status(500).json({ error: 'Failed to fetch invoices' });
        }
    });

    // Get usage (company count vs limit)
    app.get('/api/billing/usage', requireAdmin, async (req, res) => {
        try {
            const usage = await stripeService.getUsage(req.userContext.userId);
            res.json(usage);
        } catch (error) {
            console.error('Error fetching usage:', error);
            res.status(500).json({ error: 'Failed to fetch usage' });
        }
    });

    // Get plans config (public within auth)
    app.get('/api/billing/plans', (req, res) => {
        const plans = Object.values(PLANS).map(p => ({
            tier: p.tier,
            name: p.name,
            companyLimit: p.companyLimit,
            prices: p.prices,
            features: p.features,
            popular: p.popular || false,
        }));
        res.json(plans);
    });

    console.log('Billing routes enabled');
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
