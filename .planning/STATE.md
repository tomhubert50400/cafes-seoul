# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Filtrage multi-critères avec notes 1-5 sur chaque dimension du café
**Current focus:** Milestone v1.1 - User Contributions (Phase 9 complete, ready for Phase 10)

## Current Position

Phase: 9 of 11 (Photos & Voting)
Plan: 5 of 5 complete — **PHASE COMPLETE** (verified ✓)
Status: Complete - Verified ✓
Last activity: 2026-01-30 — Completed 09-05-PLAN.md (Photo integration), phase verified (10/10 requirements)

Progress: [████████████████████░░░░] 75% (18/24 plans)

## Performance Metrics

**Previous Milestone (v1.0):**
- Total plans completed: 20
- Average duration: ~6 min/plan
- Total execution time: ~1.5 hours

**Milestone v1.1:**
- Plans completed: 18/24
- Phase 7 duration: ~26 min (6 plans including gap closures)
- Phase 8 duration: ~36 min (5 plans including gap closure)
- Phase 9 duration: ~45 min (5 plans: schema, upload, gallery, Server Actions, integration)
- Average: ~5 min/plan

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
| 2026-01-30 | No rate limiting on ratings (RATE-08) | Unlike submissions, ratings unlimited to encourage engagement |
| 2026-01-30 | Upsert pattern with ON CONFLICT | Single function handles create/update atomically (RATE-05) |
| 2026-01-30 | NULLIF for zero exclusion in averages | SQL NULLIF(column, 0) excludes un-rated dimensions from averages |
| 2026-01-30 | API routes delegate to Server Actions | Single source of truth, avoids code duplication |
| 2026-01-30 | RPC with SQL fallback for averages | Primary uses database function, manual SQL as fallback |
| 2026-01-30 | useAuth hook for client-side auth | Simple Supabase browser client wrapper for auth state |
| 2026-01-30 | stopPropagation for map Rate button | Prevents navigation to cafe detail when clicking rate |
| 2026-01-30 | Use transformUserRating for data consistency | Centralized transformation ensures type safety and field mapping |
| 2026-01-30 | Handle PGRST116 specifically in user rating queries | Distinguishes "not rated yet" from actual database errors |

### Decisions for Phase 9: Photos & Voting

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-30 | Never store uploader name in photos table | Privacy by design - focus on cafes, not contributors |
| 2026-01-30 | storage_path stores path only, not full URL | Allows URL construction in app layer with transform options |
| 2026-01-30 | Rejected photos excluded from 3 photo limit | Users can retry rejected uploads without penalty |
| 2026-01-30 | upvote_count denormalized with trigger updates | Gallery sorting performance without JOIN aggregation |
| 2026-01-30 | Toggle voting via unique constraint | (user_id, photo_id) unique enables vote/unvote naturally |
| 2026-01-30 | Approved photos public, own photos always visible | Users see their pending photos; public only sees approved |
| 2026-01-30 | Rate limit reset at midnight KST | Consistent with Phase 7 pattern for Korea relevance |
| 2026-01-30 | CSS columns for masonry layout | No JavaScript library needed - CSS columns with break-inside-avoid |
| 2026-01-30 | Optimistic UI with automatic rollback | Immediate feedback, revert on error for consistency |
| 2026-01-30 | Heart animation: 200ms scale pulse | Responsive feel while visible to users |
| 2026-01-30 | Count flash: 300ms highlight | Draws attention without being distracting |
| 2026-01-30 | "Show more" loads 6 photos at a time | Balance between initial load and browsing depth |
| 2026-01-30 | RPC functions for limit checks | Consistent enforcement across Server Actions and API |
| 2026-01-30 | Server Actions return structured error objects | Type-safe error handling without throwing |
| 2026-01-30 | Dual property naming (snake_case + camelCase) | Supports existing components without breaking changes |
| 2026-01-30 | Pending-only photo deletion | PHOTO-07 requirement - approved photos are permanent |
| 2026-01-30 | Toggle voting via DELETE/INSERT | Unique constraint on (user_id, photo_id) enables natural toggle |
| 2026-01-30 | API returns storage_path for URL construction | Client controls image transformations and sizing |
| 2026-01-30 | Photos section placed after Ratings in Info tab | Logical content flow: description → facilities → ratings → photos |
| 2026-01-30 | Guest upload prompt shows Sign In CTA | Encourages conversion rather than hiding functionality |
| 2026-01-30 | router.refresh() for post-upload photo reload | Simplest pattern for SSR data refresh without complex state management |

### Pending Todos

None — Phase 9 complete. Ready for Phase 10 (Admin Panel).

### Blockers/Concerns

None — ready for Phase 10: Admin Panel.

## Session Continuity

Last session: 2026-01-30 20:35 KST
Stopped at: Phase 9 verified complete (10/10 requirements achieved)
Resume file: .planning/phases/09-photos-voting/09-photos-voting-VERIFICATION.md
Next action: Begin Phase 10: Admin Panel (10-01-PLAN.md)

---
*State initialized: 2026-01-27*
*Phase 1 complete: 2026-01-27*
*Phase 2 verified: 2026-01-28*
*Phase 3 verified: 2026-01-28*
*Phase 4 complete: 2026-01-28*
*Phase 5 complete: 2026-01-29*
*Phase 6 complete: 2026-01-29*
*Phase 7 complete: 2026-01-30 (gap closures 07-05, 07-06 completed)*
*Phase 8 complete: 2026-01-30 (gap closure 08-05 completed, 8/8 must-haves verified)*
*Phase 9 complete: 2026-01-30 (Plans 1-5/5 complete - schema, upload, gallery, Server Actions, integration)*
