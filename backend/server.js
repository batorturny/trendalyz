// ============================================
// TIKTOK REPORT GENERATOR - EXPRESS SERVER
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WindsorService = require('./services/windsor');
const { processReport } = require('./services/report');
const { getAllCompanies, getCompanyById } = require('./config/companies');

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
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 TikTok Report API running on http://localhost:${PORT}`);
    console.log(`📊 Companies loaded: ${getAllCompanies().length}`);
});
