# Architecture

## System Overview
Monorepo with Express backend + Next.js 16 frontend, shared Prisma schema, PostgreSQL database. Deployed as Docker Compose on Hetzner VPS via Coolify.

## Data Flow
```
Windsor AI API ──→ Backend (Express) ──→ ChartGenerator ──→ JSON
                                                              │
                        OR                                    │
                                                              ▼
Windsor AI API ──→ Frontend (Next.js API Route) ──→ ChartGenerator ──→ Chart.js
                                                                        │
Meta Graph API ──→ Frontend (Direct) ─────────────────────────────→ Chart.js
YouTube API ───→ Frontend (Direct + Windsor fallback) ────────→ Chart.js
```

## Dual Chart Generation
Charts are generated in TWO places (must stay in sync):
- **Backend**: `backend/services/chartGenerator.js` (CJS, ~1000 lines)
- **Frontend**: `frontend/src/lib/chartGenerator.ts` (TS, ~850 lines)

The frontend generates charts client-side when using Next.js API routes directly. The backend generates when proxying through Express.

## Auth Flow
```
User → NextAuth.js (JWT session) → Next.js middleware → API routes
                                                           │
                                    ┌──────────────────────┤
                                    ▼                      ▼
                              Prisma (direct)    Express backend (proxy)
                              (evaluations,      (charts, sync, billing)
                               auth, config)
```

## Platform Model
Each company has IntegrationConnections:
- TIKTOK_ORGANIC → Windsor `tiktok_organic` endpoint
- FACEBOOK_ORGANIC → Windsor `facebook_page` OR Meta Graph API direct
- INSTAGRAM_ORGANIC → Windsor `instagram` OR Meta Graph API direct
- YOUTUBE → Windsor `youtube` (skipSelectAccounts) + YouTube Data API
- TIKTOK_ADS → Windsor `tiktok` endpoint

## Evaluation/Chat System
```
Admin writes evaluation → Evaluation.messages JSON array → append
Client opens bubble → marks as read → can reply + emoji react
Messages stored per company/platform/month (unique constraint)
```

## PDF Export
Client-side DOM capture: html-to-image → jsPDF (A4 pagination)
No Puppeteer dependency for chart PDFs.

## Email System
Resend API with branded HTML templates. Triggered by:
- User invite, password reset
- Client evaluation reply → admin notification
- Scheduled monthly report notification (cron — not yet active)
- Admin feedback widget → developer email
