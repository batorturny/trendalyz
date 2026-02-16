// ============================================
// AUTH CONTEXT MIDDLEWARE
// Parses user context from headers forwarded by Next.js proxy
// ============================================

function parseUserContext(req, res, next) {
    req.userContext = {
        userId: req.headers['x-user-id'] || null,
        role: req.headers['x-user-role'] || null,
        companyId: req.headers['x-company-id'] || null,
    };
    next();
}

function requireAdmin(req, res, next) {
    if (!req.userContext || req.userContext.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    next();
}

function requireCompanyAccess(companyIdExtractor) {
    return (req, res, next) => {
        if (!req.userContext) {
            return res.status(403).json({ error: 'Forbidden - No user context' });
        }

        // Admin can access everything
        if (req.userContext.role === 'ADMIN') {
            return next();
        }

        // Client can only access their own company
        const requestedCompanyId = companyIdExtractor(req);
        if (requestedCompanyId && requestedCompanyId !== req.userContext.companyId) {
            return res.status(403).json({ error: 'Forbidden - No access to this company' });
        }

        next();
    };
}

module.exports = { parseUserContext, requireAdmin, requireCompanyAccess };
