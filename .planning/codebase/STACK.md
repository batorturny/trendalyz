# Technology Stack

## Runtime & Languages
| Component | Version |
|-----------|---------|
| Node.js | 20.x (Alpine) |
| TypeScript | 5.9.3 (frontend strict mode) |
| JavaScript | ES2017+ CJS (backend) |

## Frontend
- **Next.js** 16.1.6 (App Router, Turbopack)
- **React** 19.2.3
- **Tailwind CSS** v4 (PostCSS, CSS custom properties theming)
- **Chart.js** 4.5.1 + react-chartjs-2 5.3.1
- **next-auth** 5.0.0-beta.28 (JWT sessions, Credentials + Google + Email)
- **@prisma/client** 6.19.2 (multi-generator)
- **Lucide React** 0.564.0 (icons)
- **html-to-image** 1.11.13 + **jsPDF** 4.1.0 (PDF export)
- **Resend** 4.1.2 (email)

## Backend
- **Express** 4.18.2 (CJS, no TypeScript)
- **axios** 1.6.0 (HTTP client)
- **Prisma** 6.19.2 (ORM)
- **node-cron** 4.2.1 (scheduler)
- **stripe** 20.3.1 (billing)
- **puppeteer** 24.37.4 (headless browser)
- **express-rate-limit** 8.2.1
- **compression** 1.8.1
- **bcryptjs** 2.4.3

## Database
- **PostgreSQL** 15 (Alpine, Docker)
- **Prisma** — 3 generators (root, frontend, backend)
- Models: User, Company, IntegrationConnection, Evaluation, Subscription, ReportCache, Message

## Deployment
- **Hetzner VPS** (Germany, EU)
- **Coolify** (Docker Compose orchestration)
- **Docker** multi-stage builds (node:20-alpine)
- IPv4-first DNS (Hetzner→Windsor routing fix)

## Key Environment Variables
DATABASE_URL, NEXTAUTH_SECRET, INTERNAL_API_KEY, TOKEN_ENCRYPTION_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, GOOGLE_CLIENT_ID/SECRET, ALLOWED_ORIGINS
