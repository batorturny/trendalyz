# Project State — Trendalyz

## Current Position
- **Milestone**: v1.1 — UX Polish & Stability
- **Phase**: Phase 5 — Verification complete
- **Last action**: All 5 phases implemented (PDF/email, UX polish, evaluation stabilization, data quality, verification & polish)

## Recent Work (pre-GSD)
- YouTube Windsor integration (4 separate API calls, video titles, publish_date filtering)
- Evaluation chat system (multi-message, per-message reactions, email notifications)
- Brand color rebrand (navy/teal/light blue palette)
- Chart improvements (area fill, auto-zoom, green/red follower change)
- Security fixes (tenant isolation, XSS email escaping, API key redaction)
- PDF export (client-side DOM capture)
- Feedback widget (admin → developer email)

## v1.1 Phase Summary
- **Phase 1**: PDF export & monthly email scheduling — complete
- **Phase 2**: Dashboard UX polish (mobile grid, skeleton loading, chart toggle) — complete
- **Phase 3**: Evaluation system stabilization (race condition fix, atomic JSON append) — complete
- **Phase 4**: Data quality fixes (engagement_by_day weekday fix, Facebook dedup) — complete
- **Phase 5**: Verification & polish (empty catch blocks, HTML escaping, dead code removal) — complete

## Key Decisions
- Windsor API key: only from admin's encrypted DB field (no env fallback)
- Instagram: "coming soon" (Windsor Basic plan limitation)
- Chart generation: dual generators (backend CJS + frontend TS) must stay in sync
- Evaluation: JSON messages array in single Evaluation model (not separate Message table)
- PDF: client-side html-to-image + jsPDF (not Puppeteer)

## Known Issues
- Race condition in evaluation messages (read-modify-write) — mitigated with atomic append
- No automated tests or CI/CD
- Unbounded in-memory caches

## Session Continuity
Last session: 2026-03-30
