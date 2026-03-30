# Concerns & Tech Debt

## Security

- **Windsor API key in URL query strings** — mitigated by `redactKey()` in logs, but still in URL params (Windsor API design limitation)
- **No input validation library** — scattered regex, no Zod/Yup schema validation
- **Evaluation PATCH endpoint** — restricted to reaction-only updates (fixed), but messages JSON still a mutable blob
- **Meta tokens in URL params** — Facebook/YouTube access tokens passed as `?access_token=` instead of Authorization header
- **No CSRF protection** on OAuth flows
- **No audit logging** for sensitive operations (key updates, OAuth, report access)

## Performance

- **Unbounded in-memory caches**: `tiktokIdCache`, `platformAccountsCache`, `windsorDataCache` — Map objects with TTL but no size limit, can cause OOM
- **Windsor data cache 1hr TTL** — stale data possible
- **No connection pooling** — Axios creates new connections per request
- **Facebook N+1**: per-post insights → 100 API calls for 100 posts (should use batch API)
- **Chart.js large datasets** — no virtualization for 1000+ data points

## Data Integrity

- **Race condition**: Evaluation messages JSON append is read-modify-write, no atomic operation
- **Facebook post/reel duplication** — same content appears in both post and reel tables
- **`engagement_by_day` broken** — uses `hour % 7` instead of actual day-of-week (`chartGenerator.js:249`)
- **Windsor data gaps** — `audience_activity_hour` often null, some fields return -1
- **`sumField` clips negatives** — `Math.max(0, value)` hides legitimate negative metrics (lost followers)

## Tech Debt

- **Duplicated chart generators** — backend CJS (~1000 lines) + frontend TS (~850 lines) must stay in sync manually
- **Legacy Evaluation fields** — `adminMessage`/`clientReply` alongside `messages` JSON array (3 messaging systems)
- **Legacy `tiktokAccountId`** on Company model — replaced by IntegrationConnection but kept for backwards compat
- **Instagram hardcoded "coming soon"** — no actual integration, just UI placeholders
- **Backend is pure CJS** — no TypeScript, no type safety
- **Dead `/react` endpoint** — evaluation react API unused by current UI

## Missing Infrastructure

- **Zero automated tests** — no test files, no test runner, no coverage
- **No CI/CD pipeline** — no GitHub Actions, no pre-commit hooks
- **No linting enforcement** — ESLint config exists but not enforced
- **Monthly report cron not running** — `emailDay`/`emailHour` fields exist but no scheduler triggers them
- **No monitoring/alerting** — no error tracking (Sentry), no uptime monitoring
- **No database backups** configured (Coolify/Hetzner)
