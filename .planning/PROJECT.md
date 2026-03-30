# Trendalyz — Social Media Analytics Platform

## Vision
Multi-platform social media analytics dashboard for marketing agencies. Aggregates TikTok, Facebook, YouTube, TikTok Ads data from Windsor AI. Admin manages companies, generates reports, sends evaluations. Clients view their dashboards with KPIs, charts, video tables.

## Current State (v1.0 — Production)
- 5 platform support (TikTok Organic, Facebook, YouTube, TikTok Ads + Instagram coming soon)
- Admin panel: company management, chart config, evaluation chat, feedback widget
- Client dashboard: KPIs, daily charts, video tables, PDF export, evaluation bubble
- Deployed: Hetzner VPS + Coolify, PostgreSQL, Docker Compose
- Auth: NextAuth.js v5 (JWT), Google OAuth, Email magic link
- Billing: Stripe (5 tiers)

## Target User
**Primary**: Marketing agency admins (manage 10-20+ client companies)
**Secondary**: Agency clients (view their dashboards, respond to evaluations)

## Next Milestone: v1.1 — UX Polish & Stability
Focus: Improve the existing product for production readiness.
- PDF export perfection (A4, brand design, all charts)
- Automated monthly email notifications (scheduled on emailDay/emailHour)
- Dashboard UX polish (mobile, loading, chart layout)
- Chat/evaluation system stabilization (race conditions, per-message reactions)

## Tech Stack
See `.planning/codebase/STACK.md` for full details.
- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind v4
- Backend: Express 4 (CJS) + Prisma 6 + PostgreSQL 15
- Deploy: Docker Compose on Hetzner VPS via Coolify

## Brand
- Colors: Navy #0d3b5e, Teal #1a6b8a, Light Blue #8ec8d8
- Logo: 3-bar ascending chart + upward arrow (SVG)
- UI language: Hungarian default, English toggle
