---
phase: 09-photos-voting
plan: 04
subsystem: api
tags: [server-actions, api-routes, supabase, photos, voting]

# Dependency graph
requires:
  - phase: 09-photos-voting
    provides: Database schema with photos and photo_votes tables
provides:
  - Photo upload Server Action with dual limit enforcement
  - Photo deletion Server Action (pending only)
  - Photo voting Server Action with toggle behavior
  - Photos API endpoint with vote status
  - Photo types and utility functions
affects:
  - Phase 9 Plan 5 (Photo gallery integration)
  - Phase 10 (Admin panel - photo moderation)
  - Phase 11 (User dashboard - photo contributions)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Actions with form data handling
    - Supabase Storage for file uploads
    - RPC functions for rate limit checks
    - API routes delegating to Server Actions
    - Dual property naming (snake_case + camelCase)

key-files:
  created:
    - src/lib/actions/photos.ts
    - src/app/api/photos/route.ts
    - src/lib/utils/photos.ts
  modified:
    - src/types/photos.ts

key-decisions:
  - Use RPC functions for limit checks (count_user_cafe_photos, can_upload_photo)
  - Server Actions return structured error objects (not throwing)
  - API returns both snake_case and camelCase for compatibility
  - Storage path kept minimal (no width/height metadata in DB)

# Metrics
duration: 12min
completed: 2026-01-30
---

# Phase 9 Plan 4: Photo Server Actions and API Summary

**Photo CRUD Server Actions with dual rate limiting, Supabase Storage integration, and vote status API**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-30
- **Completed:** 2026-01-30
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

1. **Photo Upload Server Action** (`uploadPhoto`)
   - Enforces 3 photos per cafe limit via `can_upload_to_cafe` RPC
   - Enforces 10 uploads per day rate limit via `can_upload_photo` RPC
   - Validates file type (JPEG, PNG, WebP) and size (5MB max)
   - Uploads to Supabase Storage with unique path
   - Creates photo record with `pending` status
   - Revalidates cafe detail page on success

2. **Photo Delete Server Action** (`deletePhoto`)
   - Verifies user ownership before deletion
   - Only allows deletion of `pending` photos (PHOTO-07 requirement)
   - Blocks deletion of approved photos with clear error message
   - Cleans up both Storage file and database record
   - Cascades vote deletions via foreign key constraint

3. **Photo Voting Server Action** (`togglePhotoVote`)
   - Toggle behavior: click to vote, click again to unvote
   - Enforces one vote per user per photo via unique constraint
   - Automatic `upvote_count` updates via database trigger
   - Returns updated count and vote status

4. **Photos API Endpoint** (`/api/photos`)
   - GET endpoint with pagination (?offset=0&limit=6)
   - Returns photos sorted by `upvote_count` DESC (VOTE-03)
   - Includes `hasVoted` boolean for authenticated users
   - Includes `isOwnPhoto` flag for user's own photos
   - Visibility rules: approved → all, pending → uploader only, rejected → hidden
   - Returns both snake_case (database) and camelCase (client) properties

5. **Photo Utilities** (`src/lib/utils/photos.ts`)
   - `getPhotoUrl()` - Construct full Supabase Storage URL
   - `getPhotoThumbnailUrl()` - Optimized thumbnails with transformations
   - `formatVoteCount()` - Compact notation (1.2K, 3M)
   - `sortPhotosByVotes()` - Sort by popularity
   - Validation and filename generation helpers

## Task Commits

1. **Task 1: Photo Server Actions** - `11a7832` (feat)
   - uploadPhoto with dual limit enforcement
   - deletePhoto for pending photos only
   - togglePhotoVote for heart voting
   - getCafePhotos, getMyPhotos, checkPhotoLimits

2. **Task 2: Photos API** - `c15b1ac` (feat)
   - GET /api/photos endpoint
   - Pagination and visibility rules
   - Vote status inclusion
   - URL generation helper

3. **Task 3: Photo Utilities** - `481fafb` (feat)
   - Storage URL helpers
   - Thumbnail generation
   - Vote count formatting
   - Sorting and validation utilities

## Files Created/Modified

- `src/lib/actions/photos.ts` - Complete photo CRUD Server Actions (674 lines)
- `src/app/api/photos/route.ts` - Photos API with vote status (185 lines)
- `src/lib/utils/photos.ts` - Photo utility functions (186 lines)
- `src/types/photos.ts` - Updated with Server Action types

## Decisions Made

- **RPC for limit checks:** Using database functions `can_upload_to_cafe` and `can_upload_photo` ensures consistent limit enforcement across all access points
- **Dual property naming:** API returns both `upvote_count` (snake_case) and `upvoteCount` (camelCase) to support existing components without breaking changes
- **Server Actions for mutations:** All write operations (upload, delete, vote) use Server Actions for consistent error handling and revalidation
- **API for reads:** GET endpoint for fetching photos with filtering and pagination
- **Pending-only deletion:** Users cannot delete approved photos per PHOTO-07 requirement; this prevents abuse while allowing correction of pending uploads

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Type compatibility with existing components:**
   - The `photo-card.tsx` component from Plan 09-02 expected additional properties (`url`, `upvoteCount`, `width`, `height`)
   - Resolution: Updated `PhotoWithVoteStatus` type to include both snake_case and camelCase properties
   - Updated API route to construct and return full URLs

## Next Phase Readiness

Ready for Phase 9 Plan 5: Photo gallery integration on cafe detail pages

- Server Actions complete and ready for component integration
- API endpoint ready for client-side data fetching
- Utility functions ready for URL generation
- All PHOTO-01 through PHOTO-07 requirements implemented in backend
- All VOTE-01 through VOTE-03 requirements implemented in backend

---
*Phase: 09-photos-voting*
*Completed: 2026-01-30*
