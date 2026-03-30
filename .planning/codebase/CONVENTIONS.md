# Coding Conventions

## Language Policy
- **UI text**: Hungarian (magyar, always with proper diacritics: á, é, í, ó, ö, ő, ú, ü, ű)
- **Code, comments, commits, PRs**: English
- **i18n**: HU is default, translations map HU→EN in `frontend/src/lib/i18n.tsx`

## Commit Format
Conventional commits with emojis: `emoji type: message`
- ✨ feat | 🐛 fix | 💄 style | ♻️ refactor | 🔧 chore | 🔒 security | ⚡ perf
- Imperative mood, max 72 chars first line, atomic commits

## CSS & Theming
- Tailwind v4 + CSS custom properties (`--surface`, `--accent`, `--text-primary`, `--platform-*`)
- Custom CSS MUST use `@layer base {}` or `@layer components {}` (Turbopack strips otherwise)
- Brand colors: `#0d3b5e` (navy), `#1a6b8a` (teal), `#8ec8d8` (light blue)

## Component Patterns
- `memo()` for heavy components (Chart, VideoTable)
- `useCallback()` for handlers
- `dynamic()` for lazy loading (ChartLazy)
- `'use client'` directive for interactive components
- Server Components for data fetching + auth

## Naming
- **camelCase**: variables, functions (`handleSave`, `companyId`)
- **PascalCase**: components, types (`VideoTable`, `Company`)
- **UPPER_SNAKE**: constants, platform keys (`TIKTOK_ORGANIC`)
- **kebab-case**: routes, filenames (`/admin/reports/tiktok`)

## API Pattern
- Frontend Next.js API routes proxy to Express backend
- Auth: `INTERNAL_API_KEY` header for FE→BE communication
- Windsor: API key from admin's encrypted DB field (no env fallback)

## File Organization
- One component per file
- Imports: React/external → types → local components/utils
- Sections marked with `// ─── Section ────`
