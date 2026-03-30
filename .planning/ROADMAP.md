# Roadmap — Trendalyz v1.1

## Phase 1: PDF Export & Email (REQ-001, REQ-002) ✅ Complete
**Goal**: Perfect PDF export and automated monthly email notifications.
- Fix PDF A4 layout (brand header/footer, pagination, chart rendering)
- Build cron scheduler for monthly email (uses emailDay/emailHour from Company)
- Create `scheduledReportEmailHtml` email template (already exists in email.ts)
- Wire up node-cron in backend server.js
**Success**: PDF downloads cleanly on A4, email arrives on scheduled day.

## Phase 2: Dashboard UX Polish (REQ-003, REQ-004, REQ-008) ✅ Complete
**Goal**: Smooth, responsive dashboard experience.
- Verify mobile KPI grid (2/3/5 cols) — already implemented
- Verify chart layout toggle (1/2 cols) — already implemented
- Add skeleton loading for KPIs and charts
- Optimize chart rendering (lazy load below-fold charts)
**Success**: Mobile dashboard usable, no layout jumps, fast perceived loading.

## Phase 3: Evaluation System Stabilization (REQ-005, REQ-006, REQ-007) ✅ Complete
**Goal**: Reliable chat system without data loss.
- Fix race condition: atomic JSON append via Prisma raw SQL
- Verify admin tenant isolation (already fixed)
- Verify per-message reactions persist (already fixed)
- Add admin "unread reply" badge based on adminReadAt timestamp
**Success**: Concurrent admin+client messages don't lose data, reactions persist.

## Phase 4: Data Quality Fixes (REQ-009, REQ-010) ✅ Complete
**Goal**: Accurate data in all charts and tables.
- Fix engagement_by_day (use actual weekday from date, not hour%7)
- Facebook post/reel deduplication by post_id
- Remove dead /react endpoint
**Success**: Day-of-week chart shows correct data, no duplicate Facebook posts.

## Phase 5: Verification & Polish (REQ-011, REQ-012, REQ-013) ✅ Complete
**Goal**: Final polish before v1.1 release.
- Verify all security fixes (HTML escaping, tenant isolation, DOM restore)
- Quick evaluation on Charts page
- Clean up unused code, empty catch blocks
- Manual QA checklist pass
**Success**: All REQ-001 through REQ-013 verified working in production.

---

**Estimated timeline**: 2 weeks (5 phases, ~2-3 days each)
**Status**: ✅ All phases complete — v1.1 ready for release
