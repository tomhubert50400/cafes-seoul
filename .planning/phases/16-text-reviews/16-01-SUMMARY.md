---
phase: 16-text-reviews
plan: 01
subsystem: reviews
tags: [database, schema, types, validation]
requires: [08-user-ratings]
provides: [review-text-schema, helpful-votes-table, review-types]
affects: [16-02, 16-03, 16-04]
tech-stack:
  added: []
  patterns: [review-text-extension, helpful-voting, edit-tracking-trigger]
key-files:
  created:
    - supabase/migrations/1601_review_text.sql
    - src/types/reviews.ts
    - src/lib/validations/reviews.ts
  modified: []
decisions:
  - id: 16-01-01
    decision: Extend cafe_ratings vs separate reviews table
    rationale: Maintains one-review-per-user-per-cafe constraint, simpler queries
  - id: 16-01-02
    decision: IS DISTINCT FROM in trigger
    rationale: Handles NULL transitions correctly for review_edited_at
  - id: 16-01-03
    decision: Public SELECT on helpful_votes
    rationale: Count needs to be visible to all users, only write ops restricted
metrics:
  duration: 2m 18s
  completed: 2026-02-01
---

# Phase 16 Plan 01: Schema & Types Foundation Summary

Database schema and TypeScript types for text reviews with helpful voting.

## What Was Built

### Database Migration (`1601_review_text.sql`)

Extended `cafe_ratings` table with review text support:
- `review_text TEXT` column with 500 character limit constraint
- `review_edited_at TIMESTAMPTZ` for edit tracking
- Partial index on `(cafe_id, created_at DESC) WHERE review_text IS NOT NULL`
- Trigger function `update_review_edited_at()` using `IS DISTINCT FROM` for NULL handling

Created `review_helpful_votes` table:
- `id`, `user_id`, `rating_id`, `created_at` columns
- Unique constraint on `(user_id, rating_id)`
- Indexes for user-rating lookup and rating vote counting
- RLS policies: public SELECT, authenticated INSERT/DELETE with ownership check

### TypeScript Types (`src/types/reviews.ts`)

Defined type hierarchy:
- `ReviewAuthor`: Minimal author info for display (id, displayName, avatarUrl, profilePublic)
- `ReviewWithAuthor`: Full review with author, vote count, and context flags
- `HelpfulVote`: Vote record structure
- `UpdateReviewTextResult`, `ToggleHelpfulResult`: Action result types
- `ReviewTextFormData`: Form input type

### Validation Schemas (`src/lib/validations/reviews.ts`)

Created Zod schemas:
- `reviewTextSchema`: String max 500 chars, allows empty for deletion
- `ratingIdSchema`: UUID validation for vote actions
- Exported inferred types `ReviewTextInput`, `RatingIdInput`

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 16-01-01 | Extend cafe_ratings vs separate table | Maintains one-review-per-user-per-cafe, simpler JOINs |
| 16-01-02 | IS DISTINCT FROM in trigger | Correctly handles NULL to value, value to NULL, value to value |
| 16-01-03 | Public SELECT on helpful_votes | Vote counts need to be visible publicly, only mutations restricted |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 04066c7 | feat(16-01): add review text columns and helpful votes table |
| f5ab03f | feat(16-01): add TypeScript types for reviews and votes |
| 401850d | feat(16-01): add Zod validation schemas for reviews |

## Verification Results

- [x] Migration 1601_review_text.sql applied successfully
- [x] cafe_ratings has review_text (TEXT) and review_edited_at (TIMESTAMPTZ) columns
- [x] review_helpful_votes table exists with proper foreign keys and RLS
- [x] Trigger created for review_edited_at updates
- [x] TypeScript compiles without errors
- [x] Types and schemas importable from other files

## Next Phase Readiness

Ready for 16-02 (Server Actions & Data Queries):
- Schema in place with proper constraints and indexes
- Types ready for use in Server Actions
- Validation schemas ready for form handling
- RLS policies allow required operations

---
*Completed: 2026-02-01 | Duration: 2m 18s*
