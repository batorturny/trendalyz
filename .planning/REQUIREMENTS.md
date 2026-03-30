# Requirements — Trendalyz v1.1

## Milestone: UX Polish & Stability

### Must Have (v1.1)

| ID | Feature | Description |
|----|---------|-------------|
| REQ-001 | PDF A4 export | Perfect A4 layout with brand header/footer, all KPIs + charts + tables. Client-side DOM capture with proper pagination. |
| REQ-002 | Scheduled report email | Cron job sends HTML email on company's emailDay/emailHour. "Elkészült a havi riportod" with platform list + dashboard link. |
| REQ-003 | Mobile KPI grid | 2-col grid on mobile, 3-col tablet, 5-col desktop. Responsive chart widths. |
| REQ-004 | Chart layout toggle | 1-col / 2-col toggle with localStorage persistence. Already implemented — verify production. |
| REQ-005 | Evaluation race condition fix | Atomic JSON append (Prisma raw SQL or separate Message table) instead of read-modify-write. |
| REQ-006 | Admin tenant isolation | Admin can only access own companies' evaluations (already fixed — verify). |
| REQ-007 | Per-message emoji reactions | Reactions stored per-message in JSON, persist across reload (already implemented — verify). |
| REQ-008 | Skeleton loading | Show placeholder KPI cards and chart skeletons during data fetch. |

### Should Have (v1.1)

| ID | Feature | Description |
|----|---------|-------------|
| REQ-009 | engagement_by_day fix | Remove broken hour%7 logic, use actual day-of-week from date field. |
| REQ-010 | Facebook deduplication | Deduplicate post/reel by post_id to prevent double counting. |
| REQ-011 | Quick evaluation on all report pages | Already on PlatformChartsPage — add to Charts page too. |
| REQ-012 | Email HTML escaping | Ensure all user content in emails is HTML-escaped (already done — verify). |
| REQ-013 | PDF DOM restore on error | try/finally for temporary style changes (already done — verify). |

### Nice to Have (v1.2+)

| ID | Feature | Description |
|----|---------|-------------|
| REQ-014 | AI monthly summary | Claude/GPT generates 3-sentence summary from KPI data. |
| REQ-015 | Instagram integration | Full Windsor Instagram connector (pending Windsor Pro). |
| REQ-016 | CI/CD pipeline | GitHub Actions: lint + typecheck + build on push. |
| REQ-017 | Automated tests | Jest backend + Vitest frontend + Playwright E2E. |
| REQ-018 | LRU cache | Replace unbounded Map caches with lru-cache package. |
| REQ-019 | Sparkline KPI cards | Mini trend chart inside each KPI card. |
| REQ-020 | Cross-platform summary dashboard | One page showing all platforms' key metrics. |

### Out of Scope

- Real-time WebSocket chat
- Instagram full launch (Windsor Basic plan limitation)
- Mobile native app
- Multi-language beyond HU/EN
- White-label branding per agency
