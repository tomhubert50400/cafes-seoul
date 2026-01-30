---
phase: 08-ratings-system
plan: 03
subsystem: api
  - database
  - server-actions
tags:
  - ratings
  - supabase
  - server-actions
  - rest-api
  - crud
  - aggregation

# Dependency graph
requires:
  - phase: 08-ratings-system
    plan: 01
    provides: Database schema with cafe_ratings table
  - phase: 08-ratings-system
    plan: 02
    provides: RatingForm component with validation
provides:
  - Database query utilities for rating CRUD operations
  - Server Actions for submit/update/delete/get operations
  - REST API endpoints for ratings
  - Cafe average rating calculation (zero-excluded)
  - Path revalidation after rating mutations
affects:
  - Phase 9 (Cafe detail page - ratings display)
  - Phase 10 (User profile - ratings history)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Upsert pattern with ON CONFLICT for create/update (RATE-05)"
    - "NULLIF SQL function to exclude zero values from averages (RATE-04)"
    - "Server Actions delegating to database utilities"
    - "API routes delegating to Server Actions for consistency"
    - "Path revalidation after mutations"

key-files:
  created:
    - src/lib/supabase/ratings.ts
    - src/lib/actions/ratings.ts
    - src/app/api/ratings/route.ts
    - src/app/api/ratings/[id]/route.ts
  modified: []

key-decisions:
  - "No rate limiting on ratings (RATE-08) - unlike submissions"
  - "upsertRating uses ON CONFLICT constraint for atomic create/update"
  - "updateCafeAverages uses NULLIF to exclude zero values (RATE-04)"
  - "API routes delegate to Server Actions for single source of truth"
  - "Both RPC and fallback implementations for cafe averages"

patterns-established:
  - "Upsert pattern: Single function handles create and update via ON CONFLICT"
  - "Zero exclusion: Use NULLIF(column, 0) in AVG calculations for optional ratings"
  - "Action delegation: API routes call Server Actions to avoid duplication"
  - "Path revalidation: Revalidate cafe detail, list, and profile paths after mutations"

# Metrics
duration: 6min
completed: 2026-01-30
---

# Phase 8 Plan 3: Server Actions and API for Ratings Summary

**Rating CRUD system with upsert pattern, cafe average updates, and zero-value exclusion using NULLIF**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-30T08:38:53Z
- **Completed:** 2026-01-30T08:45:08Z
- **Tasks:** 3/3
- **Files modified:** 4

## Accomplishments

- Created database utilities with 8 functions (422 lines)
- Implemented Server Actions with 6 operations (319 lines)
- Built REST API endpoints for GET, POST, PATCH, DELETE (342 lines total)
- Implemented zero-excluded averages using NULLIF SQL pattern
- Added automatic cafe aggregate updates after rating changes
- Set up path revalidation for cafe detail, list, and profile pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Database query utilities** - `1c696da` (feat)
2. **Task 2: Server Actions** - `3cd57d7` (feat)
3. **Task 3: API routes** - `1f06e97` (feat)

**Plan metadata:** [pending after this commit] (docs)

## Files Created/Modified

- `src/lib/supabase/ratings.ts` - Database query functions for rating CRUD and cafe average updates (422 lines)
  - upsertRating: Creates or updates rating using ON CONFLICT
  - getRatingByUserAndCafe: Fetches single rating for user+cafe combo
  - getUserRatings: Lists all ratings by user with cafe info
  - getCafeRatings: Lists all ratings for cafe with user info
  - deleteRating: Deletes rating with ownership verification
  - updateCafeAverages: Updates cafe aggregates using NULLIF for zero exclusion
  - getCafeRatingStats: Raw statistics without updating cafes table
  
- `src/lib/actions/ratings.ts` - Server Actions for rating operations (319 lines)
  - submitRating: Upsert rating with cafe average update
  - getMyRatingForCafe: Fetches current user's rating for specific cafe
  - getMyRatings: Lists user's rating history
  - getCafeRatingsList: Lists all ratings for cafe with total count
  - deleteMyRating: Deletes user's rating with average update
  - hasRatedCafe: Quick check if user rated cafe
  
- `src/app/api/ratings/route.ts` - List and create endpoints (103 lines)
  - GET /api/ratings?cafeId=xxx: List ratings for cafe with pagination
  - POST /api/ratings: Submit or update rating
  
- `src/app/api/ratings/[id]/route.ts` - Single rating endpoints (239 lines)
  - GET /api/ratings/:id: Fetch specific rating
  - PATCH /api/ratings/:id: Update specific rating
  - DELETE /api/ratings/:id: Delete specific rating

## Decisions Made

- **No rate limiting on ratings (RATE-08):** Unlike submissions which are limited to 3/day, ratings have no limits to encourage user engagement
- **Upsert pattern for create/update (RATE-05):** Single function handles both operations using PostgreSQL ON CONFLICT, simplifying client code
- **NULLIF for zero exclusion (RATE-04):** Use `AVG(NULLIF(column, 0))` to exclude un-rated dimensions from averages
- **RPC with fallback:** Primary implementation uses `update_cafe_rating_averages` RPC function with manual SQL fallback
- **API routes delegate to Server Actions:** Avoids code duplication by having API routes call Server Actions rather than database utilities directly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Supabase TypeScript parser limitations with complex SQL aggregates (avg, nullif, case)
  - **Resolution:** Used `as unknown as Record<string, unknown>` type casting pattern
  - This is a known Supabase limitation when using complex aggregation SQL

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### Ready for Next Phase

- Rating CRUD operations fully functional
- Cafe averages automatically update when ratings change
- Zero values properly excluded from calculations (RATE-04)
- Both Server Actions and REST API available

### Upcoming Work

- Phase 8 Plan 4: Rating display components (rating list, aggregate display)
- Phase 8 Plan 5: Integration with cafe detail page
- Phase 8 Plan 6: User profile ratings tab

---
*Phase: 08-ratings-system*
*Completed: 2026-01-30*
