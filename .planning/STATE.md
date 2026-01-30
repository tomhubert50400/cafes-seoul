# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Filtrage multi-critères avec notes 1-5 sur chaque dimension du café
**Current focus:** Milestone v1.1 - User Contributions (Phase 7 complete, ready for Phase 8)

## Current Position

Phase: 8 of 11 (Ratings System)
Plan: 2 of 6 in current phase
Status: In progress
Last activity: 2026-01-30 — Completed 08-02-PLAN.md (Rating form UI with sliders)

Progress: [██████████░░░░░░░░░░░░░░] 35% (8/23 plans)

## Performance Metrics

**Previous Milestone (v1.0):**
- Total plans completed: 20
- Average duration: ~6 min/plan
- Total execution time: ~1.5 hours

**Milestone v1.1:**
- Plans completed: 6/19
- Phase 7 duration: ~26 min (6 plans including gap closures)
- Average: ~4 min/plan

## Accumulated Context

### Decisions from v1.0 (retained)

**Authentication patterns:**
- Supabase Auth with Next.js 16 App Router
- `@supabase/ssr` for cookie-based sessions
- Server Actions for auth mutations
- `getUser()` not `getSession()` in server code

**UI/UX patterns:**
- Sonner for toast notifications
- react-hook-form + Zod for validation
- Tailwind animate-pulse for loading states
- i18n via next-intl (KO, EN, FR, ZH, VI)

**Map patterns:**
- Kakao Maps SDK with react-kakao-maps-sdk
- Marker clustering for performance
- React.memo + useMemo + useCallback for smooth rendering

### Decisions for v1.1 (new)

**Phase 7: Cafe Submissions**

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-30 | User roles stored as enum (user/pro/admin) | Allows future expansion for pro tier features |
| 2026-01-30 | Separate submission_status enum from CafeStatus | Clear separation between workflow and visibility states |
| 2026-01-30 | Rate limits in dedicated table | Efficient queries, supports future rate limit features |
| 2026-01-30 | Submission.cafe_id links to approved cafe | Enables traceability and "view approved cafe" feature |
| 2026-01-30 | Admin notes separate from rejection_reason | Internal vs user-facing moderation workflow |
| 2026-01-30 | Rate limit reset at midnight KST | Korea Standard Time for local relevance in Seoul |
| 2026-01-30 | Server Actions preferred over API routes for forms | Better type safety and React form integration |
| 2026-01-30 | Return error objects instead of throwing | Predictable error handling with TypeScript narrowing |
| 2026-01-30 | PATCH merges updates before validation | Allows partial updates while maintaining validation |
| 2026-01-30 | Map page uses FAB pattern for primary action | Floating action button visible without obstructing map |
| 2026-01-30 | Three-tab submission organization | Pending/Approved/Declined with counts for clear status visibility |
| 2026-01-30 | Status-based conditional actions | Only pending submissions show edit/delete buttons |
| 2026-01-30 | pg_trgm similarity threshold 0.3 for names, 0.4 for addresses | Balances precision/recall - stricter for addresses to avoid false positives |
| 2026-01-30 | GIN trigram indexes on both ko/en columns | Supports dual-language cafe names with fast similarity search |

### Decisions for Phase 8: Ratings System

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-30 | UserRatingDimension distinct from cafe.ts RatingDimension | Avoids type name collision while clarifying user vs aggregated ratings |
| 2026-01-30 | pet_friendly as boolean (not 0-5) | Binary indicator clearer than gradient for pet policy |
| 2026-01-30 | Zero ratings excluded via calculate_dimension_average() function | Satisfies RATE-04 requirement cleanly at database level |
| 2026-01-30 | Auto-aggregation trigger on rating changes | Keeps cafes table denormalized aggregates synchronized automatically |
| 2026-01-30 | Overall rating uses star input, not slider | Visual prominence for mandatory field, more intuitive for 1-5 scale |
| 2026-01-30 | Optional dimensions default to 0 (skip) | Users explicitly choose to rate; 0 clearly indicates "not rated" |
| 2026-01-30 | Three sections organize 10 dimensions | Logical grouping: Essentials (core), Comfort (environment), Extras (features) |
| 2026-01-30 | Same RatingForm component for create/update | existingRating prop determines mode; reduces code duplication |
| 2026-01-30 | Touch-friendly 44px+ interaction targets | Mobile-optimized sliders and star buttons |

### Pending Todos

None — Phase 8 in progress.

### Blockers/Concerns

None — ready for 08-03 (Server Actions for rating submission).

## Session Continuity

Last session: 2026-01-30 17:35 KST
Stopped at: Completed 08-02-PLAN.md (Rating form UI)
Resume file: .planning/phases/08-ratings-system/08-02-SUMMARY.md
Next action: Continue Phase 8 with 08-03-PLAN.md (Server Actions for rating submission)

---
*State initialized: 2026-01-27*
*Phase 1 complete: 2026-01-27*
*Phase 2 verified: 2026-01-28*
*Phase 3 verified: 2026-01-28*
*Phase 4 complete: 2026-01-28*
*Phase 5 complete: 2026-01-29*
*Phase 6 complete: 2026-01-29*
*Phase 7 complete: 2026-01-30 (gap closures 07-05, 07-06 completed)*
