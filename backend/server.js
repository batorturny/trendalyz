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
const { ENABLE_CHART_API, ENABLE_ACCOUNT_MANAGEMENT } = require('./config/featureFlags');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Windsor Service instance
const windsor = new WindsorService(process.env.WINDSOR_API_KEY);

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all companies
app.get('/api/companies', (req, res) => {
    res.json(getAllCompanies());
});

// Generate report
app.post('/api/report', async (req, res) => {
    try {
        const { companyId, month } = req.body;

        if (!companyId || !month) {
            return res.status(400).json({ error: 'companyId and month are required' });
        }

        const company = getCompanyById(companyId);
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
                color: c.color
            })),
            byCategory
        });
    });

    // Generate charts
    app.post('/api/charts', async (req, res) => {
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
            const company = getCompanyById(accountId);
            if (!company) {
                return res.status(404).json({ error: 'Account not found' });
            }

            console.log(`📊 Generating ${charts.length} charts for ${company.name} (${startDate} - ${endDate})`);

            // Fetch Windsor data
            const windsorData = await windsor.fetchAllChartData(company.tiktokAccountId, startDate, endDate);

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

    console.log('📈 Chart API enabled');
}

// ============================================
// ACCOUNT MANAGEMENT (Feature Flag Protected)
// ============================================

if (ENABLE_ACCOUNT_MANAGEMENT) {
    // Add new account
    app.post('/api/accounts', (req, res) => {
        try {
            const { id, name, tiktokAccountId } = req.body;

            if (!id || !name || !tiktokAccountId) {
                return res.status(400).json({
                    error: 'id, name, and tiktokAccountId are required'
                });
            }

            // Check if exists
            if (getCompanyById(id)) {
                return res.status(409).json({ error: 'Account with this ID already exists' });
            }

            const newAccount = addCompany({ id, name, tiktokAccountId });
            res.status(201).json({ success: true, account: newAccount });

        } catch (error) {
            res.status(500).json({ error: 'Failed to add account', details: error.message });
        }
    });

    // Delete account
    app.delete('/api/accounts/:id', (req, res) => {
        try {
            const { id } = req.params;
            const removed = removeCompany(id);

            if (!removed) {
                return res.status(404).json({ error: 'Account not found' });
            }

            res.json({ success: true, message: `Account ${id} removed` });

        } catch (error) {
            res.status(500).json({ error: 'Failed to remove account', details: error.message });
        }
    });

    console.log('👤 Account Management enabled');
}

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 TikTok Report API running on http://localhost:${PORT}`);
    console.log(`📊 Companies loaded: ${getAllCompanies().length}`);
});
