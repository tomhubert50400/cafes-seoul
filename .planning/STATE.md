# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Filtrage multi-criteres avec notes 1-5 sur chaque dimension du cafe
**Current focus:** Phase 14 - Favorites System

## Current Position

Phase: 14 of 18 (Favorites System)
Plan: 1 of 4 in current phase
Status: In progress
Last activity: 2026-02-01 — Completed 14-01-PLAN.md

Progress: v1.0 [6 phases] v1.1 [5 phases] v1.2 [1 phase] v1.3 [2/6 phases]

## Performance Metrics

**Milestone v1.0:**
- Plans completed: 20
- Average duration: ~6 min/plan

**Milestone v1.1:**
- Plans completed: 24
- Phases: 7-11 (5 phases)
- Average: ~5 min/plan
- Timeline: 2 days

**Milestone v1.2:**
- Plans completed: 4
- Phase: 12 (1 phase)
- Average: ~6 min/plan
- Timeline: 1 day

**Milestone v1.3:**
- Plans completed: 4
- Phases: 13-18 (6 phases)
- Status: In progress (Phase 14 in progress)

## Accumulated Context

### Key Patterns (carry forward)

**Authentication:**
- Supabase Auth with Next.js 16 App Router
- `@supabase/ssr` for cookie-based sessions
- Server Actions for auth mutations
- `getUser()` not `getSession()` in server code
- Client components: use onAuthStateChange subscription to track auth state

**UI/UX:**
- Sonner for toast notifications
- react-hook-form + Zod for validation
- Tailwind animate-pulse for loading states
- i18n via next-intl (KO, EN, FR, ZH, VI)
- Unified tab state: When multiple tab groups should sync, use shared controlled state
- Nested layouts: child pages return content only, parent layout provides Header

**Database:**
- pg_trgm for fuzzy text search
- Rate limit reset at midnight KST
- Upsert pattern with ON CONFLICT
- Database triggers for aggregation

**Ratings (Phase 13):**
- WithImage type suffix for types including image URLs
- getDimensionLabel utility for localized dimension labels in src/lib/utils/ratings.ts
- getStorageUrl transform for consistent image URL generation

**Components (Phase 13):**
- Expand/collapse cards use max-height transition for smooth animation
- Empty states distinguish no-data vs filtered-empty for better UX guidance

### Decisions Log

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 13-01 | Dimension labels in utility file | Programmatic access for components, not just translations |
| 13-01 | Flat translation key pattern | Consistency with existing reviews.* keys |
| 13-02 | Header click expands card, View button in expanded content | Avoids competing click targets |
| 13-02 | Dual-state empty component | Differentiates no-reviews vs filtered-to-zero for better UX |
| 14-01 | Check-then-act pattern for toggle | RLS policies don't support upsert with delete in single operation |
| 14-01 | maybeSingle() for existence check | Returns null instead of error when not found |

### Pending Todos

None

### Blockers/Concerns

None

## Session Continuity

Last session: 2026-02-01
Stopped at: Completed 14-01-PLAN.md
Resume file: None
Next action: Execute 14-02-PLAN.md

---
*State initialized: 2026-01-27*
*v1.0 MVP shipped: 2026-01-29*
*v1.1 User Contributions shipped: 2026-01-31*
*v1.2 Polish & Bug Fixes shipped: 2026-02-01*
*v1.3 roadmap created: 2026-02-01*
*Phase 13 completed: 2026-02-01*
