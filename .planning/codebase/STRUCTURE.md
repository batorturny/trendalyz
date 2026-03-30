# Directory Structure

```
Tiktok_riport/
├── package.json              # Root — Prisma config, workspace scripts
├── prisma/
│   ├── schema.prisma         # Shared schema (3 generators)
│   ├── migrations/           # Database migrations
│   └── seed.js               # Demo data seeder
├── docker-compose.yml        # Backend + Frontend + PostgreSQL
│
├── backend/
│   ├── Dockerfile            # node:20-alpine, Express server
│   ├── package.json          # Express, axios, stripe, prisma, etc.
│   ├── server.js             # Main Express app (~1400 lines)
│   ├── services/
│   │   ├── windsorMultiPlatform.js  # Windsor API client (all platforms)
│   │   ├── chartGenerator.js        # Chart data generation (~1000 lines)
│   │   ├── metaGraphService.js      # Facebook/Instagram Graph API
│   │   ├── youtubeDataService.js    # YouTube Data API
│   │   ├── oauthService.js          # OAuth flow handling
│   │   ├── stripeService.js         # Stripe billing
│   │   ├── pdfService.js            # Puppeteer PDF generation
│   │   ├── emailService.js          # Backend email sending
│   │   ├── adminKeyService.js       # Windsor key resolution
│   │   └── dashboardPdfTemplate.js  # HTML template for PDFs
│   ├── config/
│   │   ├── chartCatalog.js          # All chart definitions
│   │   ├── featureFlags.js          # Feature toggles
│   │   └── plans.js                 # Subscription plans
│   └── middleware/
│       ├── authContext.js           # Auth middleware
│       └── featureGate.js           # Feature gate middleware
│
├── frontend/
│   ├── Dockerfile            # Multi-stage Next.js build
│   ├── package.json          # Next.js, React, Tailwind, etc.
│   ├── next.config.ts        # Next.js configuration
│   ├── tsconfig.json         # TypeScript strict mode
│   └── src/
│       ├── app/
│       │   ├── globals.css           # Theme tokens, Tailwind layers
│       │   ├── layout.tsx            # Root layout (I18n, Theme providers)
│       │   ├── page.tsx              # Landing page
│       │   ├── login/                # Login page
│       │   ├── admin/                # Admin panel
│       │   │   ├── layout.tsx        # Admin layout (sidebar + feedback widget)
│       │   │   ├── AdminSidebar.tsx   # Navigation sidebar
│       │   │   ├── page.tsx          # Admin dashboard
│       │   │   ├── companies/        # Company management
│       │   │   │   ├── [id]/         # Company detail (config, users, integrations)
│       │   │   │   └── new/          # New company form
│       │   │   ├── reports/          # Platform report pages
│       │   │   │   ├── [platform]/page.tsx     # Dynamic platform route
│       │   │   │   └── PlatformChartsPage.tsx  # Main report component
│       │   │   ├── evaluations/      # Admin chat/evaluation page
│       │   │   ├── charts/           # Multi-platform chart builder
│       │   │   ├── settings/         # Windsor API key, billing link
│       │   │   └── billing/          # Stripe billing page
│       │   ├── dashboard/            # Client dashboard
│       │   │   ├── layout.tsx        # Client layout (header)
│       │   │   ├── ClientHeader.tsx   # Platform tabs navigation
│       │   │   ├── ClientPlatformPage.tsx  # Main client report view
│       │   │   └── [platform]/page.tsx     # Dynamic platform route
│       │   ├── api/                  # Next.js API routes
│       │   │   ├── charts/route.ts   # Chart generation (Windsor + direct APIs)
│       │   │   ├── evaluations/      # Evaluation CRUD + reply/react/read
│       │   │   ├── feedback/route.ts # Dev feedback widget
│       │   │   ├── report/route.ts   # Legacy report generation
│       │   │   ├── reports/          # PDF export, email send
│       │   │   ├── windsor/          # Windsor discover, auth-link, activate
│       │   │   └── auth/             # NextAuth routes, forgot-password
│       │   └── privacy/             # Privacy policy page
│       ├── components/
│       │   ├── Chart.tsx             # Chart.js wrapper (memo, auto-zoom)
│       │   ├── ChartLazy.tsx         # Dynamic import wrapper
│       │   ├── VideoTable.tsx        # Video/post table (memo)
│       │   ├── KPICard.tsx           # KPI display card with tooltip
│       │   ├── MonthPicker.tsx       # Month/period selector
│       │   ├── CompanyPicker.tsx     # Company dropdown
│       │   ├── TrendalyzLogo.tsx     # SVG logo component
│       │   ├── EvaluationBubble.tsx  # Client chat bubble
│       │   ├── FeedbackWidget.tsx    # Dev feedback button
│       │   ├── ThemeProvider.tsx     # Dark/light mode
│       │   ├── BaseModal.tsx         # Generic modal
│       │   └── PlatformIcon.tsx      # Platform icon component
│       ├── lib/
│       │   ├── api.ts               # API client helpers
│       │   ├── auth.ts              # NextAuth configuration
│       │   ├── prisma.ts            # Prisma client singleton
│       │   ├── i18n.tsx             # i18n context + ~500 translations
│       │   ├── email.ts             # Email templates (branded HTML)
│       │   ├── chartHelpers.ts      # KPI extraction, aggregation
│       │   ├── chartGenerator.ts    # Frontend chart generator (~850 lines)
│       │   ├── chartCatalog.ts      # Frontend chart definitions
│       │   ├── platformMetrics.ts   # Platform KPI/chart config
│       │   ├── platformConfigs.ts   # Admin platform page configs
│       │   ├── encryption.ts        # AES-256-GCM encrypt/decrypt
│       │   └── exportPdfClient.ts   # DOM-to-PDF capture
│       └── types/
│           ├── integration.ts       # Platform types, provider configs
│           └── next-auth.d.ts       # NextAuth type augmentation
│
└── _bmad-output/             # BMAD brainstorming artifacts
    └── evaluation-feature-prd.md
```

## Key File Counts
- Frontend components: ~15 files
- Frontend lib: ~12 files
- API routes: ~15 files
- Backend services: ~12 files
- Prisma models: ~12 models
- Total TypeScript/JavaScript: ~80 files
