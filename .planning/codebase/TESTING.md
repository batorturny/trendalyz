# Testing

## Current Status: No Tests

- No test files (`.test.ts`, `.spec.ts`)
- No test runner (Jest, Vitest, Playwright not configured)
- No CI/CD pipeline (no `.github/workflows/`)
- No pre-commit hooks (no Husky)
- Coverage: 0%

## This is a production SaaS with:
- Real customers on Hetzner VPS
- Multiple API integrations (Windsor, Meta, YouTube, Stripe)
- Auth + multi-tenant company system
- Encrypted sensitive data (API keys, tokens)
- Monthly automated email reports

## Recommended Priority
1. **Backend unit tests** — auth, chart generation, API integration mocking
2. **Frontend component tests** — Vitest + Testing Library
3. **E2E tests** — Playwright (admin flow, client flow)
4. **CI/CD** — GitHub Actions (lint + test + build)
5. **Pre-commit hooks** — Husky + lint-staged

## Deployment Testing (Manual Checklist)
- [ ] `npx tsc --noEmit` passes
- [ ] `next build` completes
- [ ] Login flow works
- [ ] Chart generation returns data
- [ ] PDF export downloads
