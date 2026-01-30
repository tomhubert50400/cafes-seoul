---
phase: 09-photos-voting
plan: 01
subsystem: database
tags: [postgresql, supabase, rls, triggers, rate-limiting]

# Dependency graph
requires:
  - phase: 08-ratings-system
    provides: Cafe ratings foundation and aggregation patterns
provides:
  - Photo status enum (pending, approved, rejected)
  - Photos table with moderation workflow
  - Photo votes table with toggle behavior
  - Rate limiting infrastructure (10 uploads/day)
  - 3 photo per cafe limit enforcement
  - Auto-updating upvote_count trigger
  - RLS policies for privacy and security
affects:
  - Phase 9 Plan 2 (Photo upload component)
  - Phase 9 Plan 3 (Photo gallery with voting UI)
  - Phase 9 Plan 4 (Server Actions for upload/vote)
  - Phase 10 (Admin panel for photo moderation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS policies following Phase 7/8 patterns"
    - "Denormalized counter with trigger updates"
    - "Rate limiting table with reset_at timestamp"
    - "Privacy by design: no uploader name in photos table"

key-files:
  created:
    - supabase/migrations/0901_photos_voting.sql
  modified: []

key-decisions:
  - "Never store uploader name in photos table (privacy by design)"
  - "storage_path stores Supabase Storage path, not full URL"
  - "Rejected photos don't count toward 3 photo per cafe limit"
  - "upvote_count denormalized for sorting performance"
  - "Rate limit resets tracked per user with reset_at timestamp"

patterns-established:
  - "Toggle voting: unique constraint on (user_id, photo_id) enables click-to-vote, click-to-unvote"
  - "Status-based RLS: approved photos public, own photos visible regardless of status"
  - "Admin-only moderation: only admins can update status and rejection_reason"

# Metrics
duration: 3min
completed: 2026-01-30
---

# Phase 9 Plan 1: Photos and Voting Database Schema Summary

**Photos and voting database schema with moderation workflow, rate limiting (10/day), 3 photo per cafe limits, and toggle voting with auto-updating counters.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-30T09:37:22Z
- **Completed:** 2026-01-30T09:40:28Z
- **Tasks:** 5
- **Files modified:** 1

## Accomplishments

- Created photo_status enum with pending/approved/rejected states for moderation workflow
- Built photos table with storage_path (not URL), file metadata, and approval tracking
- Implemented photo_votes table with unique constraint enabling toggle voting behavior
- Added rate limiting infrastructure with get_remaining_uploads() and can_upload_photo() functions
- Created cafe-specific limit functions enforcing 3 photos per user per cafe
- Configured comprehensive RLS policies protecting photo and vote data
- Built auto-updating upvote_count trigger that synchronizes on vote insert/delete

## Task Commits

Each task was committed atomically:

1. **Task 1: Create photo_status enum and photos table** - `e458784` (feat)
2. **Task 2: Create votes table and constraints** - `ab58f8b` (feat)
3. **Task 3: Create photo upload rate limits table** - `f2f6def` (feat)
4. **Task 4: Create 3 photo per cafe limit function** - `8d7af0e` (feat)
5. **Task 5: Add RLS policies and triggers** - `bc6e619` (feat)

**Plan metadata:** [pending final docs commit]

## Files Created/Modified

- `supabase/migrations/0901_photos_voting.sql` - Complete photos and voting schema (409 lines)
  - photo_status enum
  - photos table with moderation workflow
  - photo_votes table with toggle voting
  - photo_upload_limits table (10/day rate limit)
  - Helper functions for rate limiting and cafe limits
  - RLS policies for all three tables
  - Triggers for updated_at and upvote_count auto-sync

## Decisions Made

- **Privacy by design:** Never store uploader display name or email in photos table; user_id links to auth.users for admin reference only
- **Storage path pattern:** Store relative path (e.g., "cafes/uuid/filename.jpg") not full URL, allowing URL construction in app layer with transform options
- **Rejected photos excluded from limit:** count_user_cafe_photos() excludes rejected photos so users can retry rejected uploads
- **Rate limit at midnight KST:** Following Phase 7 pattern for Korea relevance
- **Denormalized upvote_count:** Maintained via trigger for gallery sorting performance
- **Toggle voting:** Unique constraint on (user_id, photo_id) naturally supports vote/unvote without separate state table

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema ready for Phase 9 Plan 2: Photo upload component
- Schema ready for Phase 9 Plan 3: Photo gallery with voting UI
- Schema ready for Phase 9 Plan 4: Server Actions for upload/vote/rate limiting
- Schema ready for Phase 10: Admin panel for photo moderation

**Verification complete:**
- ✓ Photo status enum exists with 3 values
- ✓ Photos table has all required columns
- ✓ No uploader name stored (privacy compliance)
- ✓ Votes table enforces one vote per user per photo
- ✓ Rate limit table tracks daily uploads
- ✓ 3 photo per cafe limit functions work
- ✓ upvote_count auto-updates via trigger
- ✓ RLS policies restrict access appropriately

---
*Phase: 09-photos-voting*
*Completed: 2026-01-30*
