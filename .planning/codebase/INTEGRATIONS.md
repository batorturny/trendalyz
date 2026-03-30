# External Integrations

## 1. Windsor AI — Multi-Platform Data Connector
- **Base**: `https://connectors.windsor.ai`
- **Auth**: API key in query string (encrypted in DB, redacted in logs)
- **Platforms**: TikTok Organic, TikTok Ads, Facebook Organic, Instagram Organic, YouTube
- **Pattern**: Separate API calls per data dimension (daily, content, demographics, extras)
- **YouTube**: `skipSelectAccounts: true` (doesn't support account filter)
- **Timeout**: 120s chart data, 15s discovery
- **Files**: `backend/services/windsorMultiPlatform.js`, `frontend/src/app/api/charts/route.ts`

## 2. Meta Graph API — Facebook & Instagram
- **Base**: `https://graph.facebook.com/v19.0`
- **Auth**: OAuth 2.0 long-lived tokens + page tokens
- **Flow**: Short-lived → exchange → long-lived user → derive page token (never expires)
- **Features**: Page insights, post insights, Instagram media, stories, demographics
- **Token refresh**: Hourly cron job
- **Files**: `backend/services/metaGraphService.js`

## 3. YouTube APIs
- **Data API v3**: Channel discovery (`/channels?mine=true`)
- **Analytics**: Via Windsor (not direct — Windsor bridges YouTube Analytics)
- **Auth**: Google OAuth 2.0 token
- **Files**: `backend/services/youtubeDataService.js`

## 4. Resend — Email Service
- **From**: `noreply@trendalyz.hu`
- **Templates**: Invite, password reset, evaluation reply, scheduled report, KPI report
- **Brand**: Navy/teal gradient header, inline SVG logo
- **Files**: `frontend/src/lib/email.ts`

## 5. Stripe — Billing
- **Tiers**: FREE, STARTER, GROWTH, PROFESSIONAL, ENTERPRISE
- **Currencies**: EUR + HUF variants
- **Features**: Checkout sessions, billing portal, webhook handlers
- **Webhooks**: subscription.created/updated/deleted, invoice.paid/failed
- **Files**: `backend/services/stripeService.js`

## 6. PostgreSQL — Database
- **Version**: 15 (Docker Alpine)
- **ORM**: Prisma 6.19.2 (triple generators)
- **Migrations**: Auto-deploy on container start
- **Files**: `prisma/schema.prisma`

## 7. Coolify — Deployment
- **Host**: Hetzner VPS (Germany)
- **Auto-deploy**: GitHub webhook on push to main
- **Env vars**: Managed in Coolify dashboard
