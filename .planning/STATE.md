# Project State — Trendalyz

## Current Position
- **Milestone**: v1.1 — UX Polish & Stability
- **Phase**: Not started (run `/gsd:plan-phase 1`)
- **Last action**: Project initialized with GSD, codebase mapped

## Recent Work (pre-GSD)
- YouTube Windsor integration (4 separate API calls, video titles, publish_date filtering)
- Evaluation chat system (multi-message, per-message reactions, email notifications)
- Brand color rebrand (navy/teal/light blue palette)
- Chart improvements (area fill, auto-zoom, green/red follower change)
- Security fixes (tenant isolation, XSS email escaping, API key redaction)
- PDF export (client-side DOM capture)
- Feedback widget (admin → developer email)

## Key Decisions
- Windsor API key: only from admin's encrypted DB field (no env fallback)
- Instagram: "coming soon" (Windsor Basic plan limitation)
- Chart generation: dual generators (backend CJS + frontend TS) must stay in sync
- Evaluation: JSON messages array in single Evaluation model (not separate Message table)
- PDF: client-side html-to-image + jsPDF (not Puppeteer)

## Known Issues
- Race condition in evaluation messages (read-modify-write)
- engagement_by_day uses hour%7 (broken)
- Facebook post/reel duplication
- No automated tests or CI/CD
- Unbounded in-memory caches

## Session Continuity
Last session: 2026-03-30
