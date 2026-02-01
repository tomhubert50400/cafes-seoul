---
phase: 16-text-reviews
plan: 02
subsystem: reviews
tags: [supabase, server-actions, mutations, voting]
requires: [16-01]
provides: [review-queries, review-actions, helpful-voting]
affects: [16-03, 16-04]
tech-stack:
  added: []
  patterns: [check-then-act-voting, ownership-verified-updates, vote-cascade-delete]
key-files:
  created:
    - src/lib/supabase/reviews.ts
    - src/lib/actions/reviews.ts
  modified: []
decisions:
  - id: 16-02-01
    decision: getRatingById helper for multi-check actions
    rationale: Single fetch provides ownership, text existence, and cafeId for revalidation
  - id: 16-02-02
    decision: Vote deletion on empty text via deleteHelpfulVotesForRating
    rationale: Explicit cleanup prevents orphaned votes, matches CONTEXT requirement
metrics:
  duration: 3m 42s
  completed: 2026-02-01
---

# Phase 16 Plan 02: Server Actions & Data Queries Summary

Supabase queries and Server Actions for review text mutations and helpful voting.

## What Was Built

### Supabase Query Functions (`src/lib/supabase/reviews.ts`)

Created database layer following established favorites/ratings patterns:

- `updateReviewText`: Updates review_text column with ownership check via user_id match
- `deleteHelpfulVotesForRating`: Cleans up votes when review text deleted
- `toggleHelpfulVote`: Check-then-act pattern with maybeSingle() for vote toggle
- `getCafeReviewsWithVotes`: Fetches reviews with author info, vote counts, user vote status
- `getUserVotedRatingIds`: Batch check for vote status (returns Set)
- `getRatingById`: Helper for ownership and text existence checks

### Server Actions (`src/lib/actions/reviews.ts`)

Created mutation actions with proper auth, validation, and revalidation:

- `updateReviewTextAction`: Validates with Zod, updates text, cleans up votes if deleting
- `deleteReviewTextAction`: Convenience wrapper calling updateReviewTextAction with empty string
- `toggleHelpfulAction`: Prevents self-voting, verifies text exists, toggles vote
- `getCafeReviewsAction`: Fetches reviews for both logged-in and anonymous users

## Key Implementation Details

### Self-Vote Prevention

```typescript
const rating = await getRatingById(supabase, ratingId);
if (rating.userId === user.id) {
  return { success: false, error: 'Cannot vote on own review' };
}
```

### Vote Cascade on Text Deletion

```typescript
if (!textToSave) {
  await deleteHelpfulVotesForRating(supabase, ratingId);
}
```

### Path Revalidation

- `/profile/reviews` - On text updates
- `/cafes/[slug]` - On both text updates and vote toggles

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 16-02-01 | getRatingById helper function | Single fetch provides userId, cafeId, reviewText for ownership/existence/revalidation |
| 16-02-02 | Explicit vote deletion on text removal | Prevents orphaned votes, explicit is safer than relying on triggers |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| ec41e23 | feat(16-02): add Supabase query functions for reviews |
| be8271c | feat(16-02): add Server Actions for review text and voting |

## Verification Results

- [x] TypeScript compiles without errors
- [x] All query functions follow established patterns (favorites.ts, ratings.ts)
- [x] Server Actions have 'use server' directive
- [x] Server Actions verify authentication with getUser()
- [x] toggleHelpfulAction prevents voting on own reviews
- [x] Deleting review text cascades to remove votes
- [x] Path revalidation covers profile and cafe pages

## Next Phase Readiness

Ready for 16-03 (Review Display Components):
- Query functions ready to fetch reviews with all needed data
- Actions ready for UI integration
- Types from 16-01 align with query return types
- Vote toggle pattern matches established favorites pattern

---
*Completed: 2026-02-01 | Duration: 3m 42s*
