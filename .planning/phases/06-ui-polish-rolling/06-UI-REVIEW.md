# Phase 06 — UI Review (Rolling polish, commits f593acd..a6f65df)

**Audited:** 2026-04-29
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md exists for this rolling phase)
**Screenshots:** Not captured (no dev server detected on :3000 / :5173 / :8080) — code-only audit
**Scope:** 8 frontend files (~3,440 LOC) shipped directly to `main`

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Hungarian copy is descriptive, action-oriented, fully accented; zero generic "Submit/OK" labels |
| 2. Visuals | 3/4 | Strong hierarchy and consistent card/dropdown chrome — `role="button"` on a `<span>` and missing Escape-handler in `VideoVisibilityDialog` are real a11y regressions |
| 3. Color | 2/4 | Brand gradient `#1a6b8a → #0d3b5e` hardcoded twice; status pills + alert banners lean on raw Tailwind palette (`emerald/red/amber/yellow/gray/slate`) instead of design tokens |
| 4. Typography | 3/4 | 7 sizes, 4 weights — within budget — but `text-[10px]` and `text-[11px]` arbitrary sizes appear 7× and undermine the scale |
| 5. Spacing | 4/4 | Tailwind spacing scale used cleanly; arbitrary `min-w-[…]` / `max-h-[…]` values are responsive guards, not breaks of the scale |
| 6. Experience Design | 3/4 | Loading + skeleton + empty + error + disabled all covered; `ConfirmDialog` for destructive deletes present; modal lacks Escape + focus-trap; one `<span role="button">` is not keyboard-operable |

**Overall: 19/24**

---

## Top 3 Priority Fixes

1. **`<span role="button">` clear-pill is not keyboard-operable** — `frontend/src/app/admin/charts/page.tsx:387-396`. Power users navigating with Tab cannot clear a platform's selection. Replace the `<span>` with a real `<button type="button">`, drop the `role="button"`, and rely on the existing `onClick` (no `tabIndex`/keyboard handler is needed — `<button>` gives both for free). The current outer parent is also a `<button>`, so the resulting nested-button is invalid HTML; promote the parent disclosure row to a `<div role="button" tabIndex={0}>` with explicit Enter/Space handling, OR split into a header div with two distinct buttons (preferred).

2. **`VideoVisibilityDialog` is not closable by Escape and has no focus trap** — `frontend/src/app/admin/companies/[id]/VideoVisibilityDialog.tsx:463-467`. Backdrop-click closes it (line 463 `onClick={onClose}`) but keyboard users are stuck. Add a `useEffect` that listens for `Escape` on `document` while mounted and calls `onClose`. For consistency with `ConnectionCard`'s rename input (which already does Escape, line 2980), at minimum:

   ```tsx
   useEffect(() => {
     function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
     document.addEventListener('keydown', onKey);
     return () => document.removeEventListener('keydown', onKey);
   }, [onClose]);
   ```

   Also add `role="dialog"` and `aria-modal="true"` to the dialog container (line 465).

3. **Hardcoded brand gradient + raw Tailwind palette colors leak the design token system** — two places hardcode `from-[#1a6b8a] to-[#0d3b5e]` (`admin/charts/page.tsx:1571`, `admin/reports/PlatformChartsPage.tsx:2071`) while `globals.css:127` already exports `.btn-gradient` with the exact same gradient. Status / alert UI uses `bg-red-50 / bg-emerald-100 / bg-amber-50 / bg-yellow-100 / bg-gray-100 / dark:bg-slate-500/20` 12+ times instead of token-based equivalents. Concrete fix: (a) replace both gradient buttons with `className="btn-gradient ..."`; (b) introduce `--success-bg`, `--success-fg`, `--error-bg`, `--error-fg`, `--warning-bg`, `--warning-fg` in `globals.css` and migrate the 4 status entries in `ConnectionCard.tsx:18-22` plus the alert banners. Removes 6 duplicated dark-mode pairs and lets future re-theming actually re-theme.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

Hungarian-first copy is the strongest pillar in this batch.

- **Action-oriented CTAs everywhere.** `"Belépési link küldése"` (LoginForm.tsx:248), `"Visszaállító link küldése"` (LoginForm.tsx:189), `"Riport generálása"` (PlatformChartsPage.tsx:345, ClientPlatformPage.tsx:348), `"Mindet mutat"` / `"Mindet rejt"` (VideoVisibilityDialog.tsx:142,148) — verbs first, never `"Submit"`/`"OK"`/`"Cancel"`.
- **Empty states are specific, not generic.** `"Nem találtunk videót az utóbbi 6 hónapban"` (VideoVisibilityDialog.tsx:163) tells the user *why*. `"Egy fiók sem kiválasztva"` (charts/page.tsx:837) is unambiguous. `"Még egyik cégnél sincs Facebook fiók konfigurálva. Először adj hozzá egy Facebook kapcsolatot a cég beállításainál."` (PlatformChartsPage.tsx:402) even guides the next action.
- **All flagged Hungarian strings have proper accents.** `Mégse`, `Bezárás`, `Mentés`, `Bejelentkezés`, `Töltés...`, `Időszak`, `Riport`, `Generálás...`, `Letöltés` — verified against the 230+ keys in `i18n.tsx`.
- **Login mode hierarchy reads well.** Magic-link is the default (LoginForm.tsx:30), the password fallback is buried under a quiet `"Adminoknak: belépés jelszóval"` link (LoginForm.tsx:256) — exactly right for the audience split.
- **Email templates (`email.ts:123-293`) use the right register** — friendly without being chummy ("Meghívást kaptál!", "Új értékelést kaptál"), preheaders are filled, footer has the correct legal-ish line.

Minor (not score-affecting):
- `email.ts:13` logs `\n📧 [DEV] Email → ...` to console. Cute, but harmless.
- `email.ts:188` has `💬 Ügyfél válaszolt` — emoji in heading. Consistent with the rest of evaluation flow, fine.

### Pillar 2: Visuals (3/4)

Hierarchy is strong; two real a11y regressions cap the score.

**What works:**
- One `<h1>` per page (charts/page.tsx:1523, PlatformChartsPage.tsx:2023), `<h2>` for major sections, `<h3>` for sub-blocks. Heading hierarchy is clean.
- Accent-bordered section headings (`border-l-4 border-[var(--accent)]`, charts/page.tsx:1049 / PlatformChartsPage.tsx:2202) give a clear focal element.
- Icon-only buttons have either `aria-label` (VideoVisibilityDialog.tsx:483 — the X close button) or `title` attributes (charts/page.tsx:391, PlatformChartsPage.tsx:354,387).
- Empty/skeleton/error/loading states all visually differentiated, not collapsed into one "spinner".

**Regressions:**
- **`role="button"` on a `<span>`** at `admin/charts/page.tsx:387-396`. No `tabIndex`, no keyDown handler. Worse: it's nested inside another `<button>` (the platform-section disclosure at line 364), which is invalid HTML and most browsers will collapse the outer click target.
- **`VideoVisibilityDialog` lacks Escape + focus trap.** Backdrop click works, but a keyboard-only user is trapped. Code already imports `useEffect` (line 3) — fix is ~5 lines.
- **The dialog container itself lacks `role="dialog"` and `aria-modal="true"`** (line 465). Screen readers won't announce it as a modal.
- **`text-[10px]`/`text-[11px]` micro-text** for body labels (charts/page.tsx:891 — the trailing externalAccountId monospace, DateRangePicker.tsx:171,194 — section captions). 10px is below the WCAG-recommended minimum body size; users on tablets or with `zoom < 100%` will struggle.

### Pillar 3: Color (2/4)

This is the lowest-scoring pillar — design tokens exist but aren't being used consistently.

**Token leaks (hardcoded brand gradient — same hex pair as `--accent` light/dark):**

```
admin/charts/page.tsx:1571        from-[#1a6b8a] to-[#0d3b5e] hover:from-[#8ec8d8]
admin/reports/PlatformChartsPage.tsx:2071  from-[#1a6b8a] to-[#0d3b5e] hover:from-[#8ec8d8]
```

`globals.css:127` already defines `.btn-gradient` with this exact gradient. Both should swap to `<button className="btn-gradient ...">` — single source of truth.

**Raw Tailwind palette colors used as semantic UI (instead of tokens):**

| Where | What | Fix |
|------|------|-----|
| `ConnectionCard.tsx:18-22` | 4 status pills with `bg-emerald-100 / bg-gray-100 / bg-red-100 / bg-yellow-100` plus dark-mode pairs | Add `--status-connected/--status-error/--status-pending` tokens |
| `admin/charts/page.tsx:1125, 1613` | Error banner `bg-red-50 dark:bg-red-500/20` | `--error-bg-subtle` token |
| `admin/charts/page.tsx:1093` | `text-emerald-500 font-bold` for positive ER% | `--success` exists already (`#059669`) — use it |
| `PlatformChartsPage.tsx:2117, 2127` | Amber + red banners | `--warning-bg` (missing token) + `--error-bg` (missing token) |
| `LoginForm.tsx:3270, 3306, 3314, 3433` | Same red/emerald/amber pairs in 4 places | same |

Counted: **12+ raw-palette usages** versus a defined token set of `--success` (`#059669` light, `#34d399` dark) and `--error` (`#dc2626` light, `#f87171` dark). The `--success`/`--error` foreground tokens exist but no `*-bg` / `*-bg-subtle` variants. Closing the gap unlocks proper dark-mode parity (right now the dark-mode opacity values like `bg-red-500/20` are lighter than they should be against `#1a1a1e`).

**What's good:**
- `--surface`, `--surface-raised`, `--border`, `--text-primary`, `--text-secondary`, `--accent`, `--accent-subtle` are used everywhere correctly (200+ hits across the audited files).
- Platform colors via inline `style={{ backgroundColor: config.color }}` are an explicit design choice (data-driven from `PLATFORM_METRICS`) — that's *correct* use of inline style, not a leak.
- Dark-mode coverage is thorough — every banner has a `dark:` variant.

### Pillar 4: Typography (3/4)

**Distribution (audited files only):**

```
text-xs:    58 occurrences
text-sm:    46
text-2xl:    9
text-lg:     5
text-xl:     4
text-3xl:    2
text-base:   1
```

7 distinct sizes — over the heuristic budget of 4-5 but in a multi-platform analytics app this is justifiable. Body / label / caption / KPI / section heading / page heading / hero are 7 distinct roles.

**Weights:**

```
font-bold:     69
font-semibold: 33
font-medium:    5
font-normal:    3
```

4 weights, healthy.

**Real concerns:**
- `text-[10px]` appears 5× and `text-[11px]` 2× as arbitrary values. These are below the typographic scale and below WCAG-recommended minimums. Specifically: `DateRangePicker.tsx:171,194`, `admin/charts/page.tsx:891,962`, `dashboard/ClientPlatformPage.tsx:432`, `admin/charts/page.tsx:1113`, `dashboard/ClientPlatformPage.tsx:2732`. Either promote them to `text-xs` (12px) or add a `text-2xs` (10px) class to the design system to make the choice intentional.
- `font-bold` on `.text-xs` uppercase labels appears 13+ times — that's the project's intentional "section caption" pattern (`text-xs font-bold ... uppercase tracking-wider`). It works visually, but extracting it to a `.label-eyebrow` utility class in `globals.css` would prevent drift.

### Pillar 5: Spacing (4/4)

**Spacing values used (sample, top of distribution):**

Tailwind defaults dominate — `p-2`, `p-3`, `p-4`, `p-5`, `p-6`, `p-8`, `gap-2`, `gap-3`, `gap-4`, `mb-2`, `mb-4`, `mb-6`, `mb-8`. Half-step values (`py-2.5`, `gap-2.5`, `mt-0.5`) are present but consistent.

**Arbitrary values found (and why they're OK):**

```
DateRangePicker.tsx:169   min-w-[320px]    — dropdown floor width
CompanyMultiPicker.tsx:74 min-w-[280px]    — same pattern
charts/page.tsx:268,853   min-w-[280px]
charts/page.tsx:1071      min-w-[600px]    — table horizontal-scroll guard
VideoVisibilityDialog.tsx:495 min-w-[200px] — search input floor
charts/page.tsx:891       max-w-[80px]     — truncation budget
charts/page.tsx:326       max-h-[320px]    — dropdown max height
LoginForm.tsx:3229        min-h-[88px]     — Google section reserved space (prevents jump)
```

These are all **legitimate responsive guards** — not arbitrary values bypassing the scale. The `min-h-[88px]` reserved-space pattern in `LoginForm` is particularly nice (prevents CLS).

No genuine spacing-scale violations found.

### Pillar 6: Experience Design (3/4)

**State coverage:**
- **Loading:** explicit `loading` flags in all 5 page components; `Loader2` spinner + `SkeletonKPI` + `SkeletonChart` placeholders rendered (PlatformChartsPage.tsx:571-577, ClientPlatformPage.tsx:528-535). Multi-state: `aggregateProgress.done/total` per-batch progress in `admin/charts/page.tsx:1513-1517`.
- **Error:** `setError(...)` paths in every async handler. Error banners rendered with consistent chrome (`bg-red-50 ... border border-red-200 ... text-red-700`) — though see Color pillar for the token-leak issue.
- **Empty:** 7 distinct empty-state strings, each contextual (`"Nincs hozzárendelt cég"`, `"Nincs csatlakoztatott fiók"`, `"Több cég módban a fiók-szűrő nem aktív"`, `"Egyik fióknak sincs adata ezen a platformon a kiválasztott időszakban"` etc.).
- **Disabled:** 22 `disabled={...}` instances — disabled state is consistently styled (`disabled:opacity-50 disabled:cursor-not-allowed`).
- **Confirmation:** `ConfirmDialog` used for delete (ConnectionCard.tsx:3090-3098). The "Show all / Hide all" buttons in `VideoVisibilityDialog` correctly DON'T confirm — they only mutate local state, the actual commit is the explicit "Mentés" button. Good UX.

**What costs the score:**
- The two a11y issues in `admin/charts/page.tsx:387` (non-keyboard-operable clear pill) and `VideoVisibilityDialog.tsx:463` (no Escape, no focus trap, no `role="dialog"`).
- One copy redundancy: `admin/charts/page.tsx:404-414` has both "Összes kijelölése / Összes törlése" inline buttons AND a count pill that doubles as a clear (the spurious `role="button"` mentioned above). Either remove the inline pair or remove the pill — having both is what led to the nested-button HTML.
- `loading` state on the magic-link form (LoginForm.tsx:67-75) only flips `setLoading(true)` then resets — no skeleton or progress hint while the email is being sent. A 1-2 second wait without indication feels frozen. Lower priority.

---

## Files Audited

| File | LOC (approx) | Notable |
|------|-------------|---------|
| `frontend/src/components/DateRangePicker.tsx` | 226 | Clean preset-driven picker, click-outside handled, validates `start <= end` |
| `frontend/src/components/CompanyMultiPicker.tsx` | 135 | Search appears only when >5 companies — nice progressive enhancement |
| `frontend/src/app/admin/companies/[id]/VideoVisibilityDialog.tsx` | 227 | Functional, but lacks Escape + dialog ARIA |
| `frontend/src/app/admin/charts/page.tsx` | 1133 | Two in-file components (`MultiSelectDropdown`, `ConnectionMultiSelect`) — extracting them to `/components` would reduce this file by ~200 LOC |
| `frontend/src/app/admin/reports/PlatformChartsPage.tsx` | 593 | Strong skeleton + delta-period calculation + PDF export; legacy gradient button |
| `frontend/src/app/dashboard/ClientPlatformPage.tsx` | 557 | Per-account selection persisted to `localStorage`; auto-load on mount; tour modal |
| `frontend/src/app/admin/companies/[id]/ConnectionCard.tsx` | 237 | Status pill colors leak Tailwind palette; rest is solid |
| `frontend/src/app/login/LoginForm.tsx` | 338 | Magic-link first, password fallback, Google OAuth gated; 88px reserved-space prevents CLS |
| `frontend/src/lib/email.ts` | 294 | Brand-consistent inline-CSS templates; `escapeHtml` used on all interpolated values ✓ |
| `frontend/src/lib/i18n.tsx` | 618 | 230+ HU↔EN translation pairs; `useT()` hook returns identity in HU mode |
| `frontend/src/app/globals.css` | 203 | Token system + `.btn-gradient` already defined and underused |

**Reference files read for context (not scored):** `frontend/CLAUDE.md` (does not exist), `MEMORY.md` (project context), `ui-brand.md` (file does not contain a 6-pillar standard — fell back to abstract pillars).
