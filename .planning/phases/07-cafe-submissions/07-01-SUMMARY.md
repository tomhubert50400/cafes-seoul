---
phase: 07-cafe-submissions
plan: 01
subsystem: database
tags: [postgres, supabase, typescript, rls]

# Dependency graph
requires:
  - phase: 06-map-feature
    provides: "Authentication and cafe data structures"
provides:
  - Database schema for cafe submissions with pending/approved/declined states
  - User role system (user/pro/admin) for authorization
  - Rate limiting infrastructure (3 submissions per day per user)
  - TypeScript types matching database schema
  - Transform functions for DB-to-TS conversion
  - Row Level Security policies for submissions and rate limits
affects:
  - 07-02 (Submission form UI)
  - 07-03 (Server Actions)
  - 07-04 (Entry points)
  - 10-01 (Admin route protection)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Database enums for status states"
    - "JSONB for translated text fields"
    - "RLS policies for multi-role access control"
    - "Separate rate limit table for daily quotas"

key-files:
  created:
    - supabase/migrations/0701_cafe_submissions.sql
    - src/types/submission.ts
  modified:
    - src/types/user.ts
    - src/lib/supabase/transforms.ts

key-decisions:
  - "User roles stored as enum (user/pro/admin) for extensibility"
  - "Submission status uses separate enum from CafeStatus for clarity"
  - "Rate limits stored in dedicated table for efficient lookups"
  - "Submission.cafe_id links to approved cafe for traceability"
  - "Admin notes separate from rejection_reason (internal vs user-facing)"

patterns-established:
  - "Database enums with IF NOT EXISTS for safe migrations"
  - "Helper functions (is_admin, get_remaining_submissions) for business logic"
  - "Computed remaining field in transforms for frontend convenience"

# Metrics
duration: 5min
completed: 2026-01-30
---

# Phase 7 Plan 1: Database Schema for Cafe Submissions Summary

**Complete database migration and TypeScript types for cafe submission system with user roles, rate limiting, and admin approval workflow.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-30T06:38:53Z
- **Completed:** 2026-01-30T06:44:13Z
- **Tasks:** 4/4
- **Files modified:** 4

## Accomplishments

- Created comprehensive database migration with user roles, submission status, cafe submissions table, and rate limiting infrastructure
- Built TypeScript type definitions with proper JSDoc comments for all submission-related interfaces
- Updated User type to include role and roleUpdatedAt fields for authorization
- Implemented transform functions to convert database rows to typed objects with computed fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database migration for cafe submissions** - `9376244` (chore)
2. **Task 2: Create TypeScript types for submissions** - `1397dae` (feat)
3. **Task 3: Update User type with role support** - `a1c3542` (feat)
4. **Task 4: Create transform functions for submissions** - `e2d8477` (feat)

**Plan metadata:** `docs(07-01)` (to be committed after summary)

## Files Created/Modified

- `supabase/migrations/0701_cafe_submissions.sql` - 313 lines: user_role enum, submission_status enum, cafe_submissions table, submission_rate_limits table, indexes, RLS policies, helper functions
- `src/types/submission.ts` - TypeScript types: CafeSubmission, SubmissionStatus, CafeSubmissionInput, CafeSubmissionUpdate, SubmissionWithUser, SubmissionRateLimit, SubmissionStatistics
- `src/types/user.ts` - Added UserRole type, role and roleUpdatedAt fields to User interface, role field to UserProfile interface
- `src/lib/supabase/transforms.ts` - Added transformCafeSubmission(), transformCafeSubmissionSummary(), transformSubmissionRateLimit(), updated transformUser() and transformUserProfile()

## Decisions Made

1. **User roles stored as enum**: Created `user_role` enum with 'user', 'pro', 'admin' values instead of just boolean flags. This allows future expansion (pro tier for cafe owners).

2. **Separate submission status enum**: Created `submission_status` distinct from `CafeStatus` to maintain clear separation between submission workflow and cafe visibility states.

3. **Rate limits in dedicated table**: Created `submission_rate_limits` table rather than adding columns to profiles. This enables efficient queries and potential future rate limit features.

4. **Submission.cafe_id for traceability**: Added `cafe_id` column to link approved submissions to their final cafe record, enabling "view approved cafe" functionality.

5. **Admin notes vs rejection_reason**: Separated internal admin notes (not shown to users) from rejection reasons (shown when declined) for moderation workflow.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 07-02-PLAN.md (Submission form UI with duplicate detection):

- Database schema is complete and ready for submissions
- TypeScript types enable type-safe form handling
- User roles support authorization checks
- Rate limiting infrastructure ready for enforcement

No blockers - schema fully supports all requirements:
- SUBMIT-01: name and address fields present
- SUBMIT-02: phone field optional
- SUBMIT-04: pending status default
- SUBMIT-05/SUBMIT-06: update/delete policies for pending
- SUBMIT-08: rate_limits table with 3/day logic
- ROLE-01/ROLE-02/ROLE-03: user_role enum with all roles

---
*Phase: 07-cafe-submissions*
*Completed: 2026-01-30*
