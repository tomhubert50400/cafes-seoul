---
phase: 11
plan: 02
subsystem: user-dashboard
tags: [dashboard, contribution-lists, pagination, i18n]

# Dependency graph
requires:
  - phase-11-01 (dashboard foundation with UserStats, StatusBadge)
provides:
  - SubmissionsList with edit/delete actions for pending items
  - RatingsList with cafe links and star ratings
  - PhotosList with thumbnails and delete actions
  - Dashboard pagination via API endpoints
  - Full i18n for all list UI in 5 languages
affects:
  - User contribution management workflow
  - Future user profile enhancements

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client-side list components with load more pagination
    - API routes for paginated dashboard data
    - useTransition for delete action state management
    - Expandable rejection reason with toggle pattern

# File tracking
key-files:
  created:
    - src/components/dashboard/submissions-list.tsx
    - src/components/dashboard/ratings-list.tsx
    - src/components/dashboard/photos-list.tsx
    - src/app/api/dashboard/submissions/route.ts
    - src/app/api/dashboard/ratings/route.ts
    - src/app/api/dashboard/photos/route.ts
  modified:
    - src/app/dashboard/page.tsx
    - src/lib/i18n/translations.ts

# Decisions
decisions:
  - id: dash-list-client-components
    description: List components are client components for load more and delete state
    rationale: Required for interactive pagination and action feedback
  - id: dash-api-pagination
    description: API routes handle pagination with offset/limit params
    rationale: Clean separation between initial SSR data and client-side load more
  - id: dash-rejection-expandable
    description: Rejection reasons use expandable toggle pattern
    rationale: Keeps list compact while providing detail on demand

# Metrics
metrics:
  duration: ~5 min
  completed: 2026-01-31
---

# Phase 11 Plan 02: Contribution Lists Summary

Dashboard contribution list components with pagination, actions, and full i18n support for user's cafes, ratings, and photos.

## One-liner

Three list components (SubmissionsList, RatingsList, PhotosList) with load more pagination, edit/delete actions, expandable rejection reasons, and 12 new translation keys across 5 languages.

## What Was Built

### SubmissionsList Component (src/components/dashboard/submissions-list.tsx)

**Features:**
- Client component with useState for load more and expanded state
- Displays cafe name, address, status badge, and created date
- For pending submissions: Edit button (links to /profile/submissions/[id]/edit) and Delete button
- For declined submissions: Expandable rejection reason with ChevronDown/Up toggle
- Rejection reason displays in red-tinted box when expanded
- Load More button shows remaining count
- Empty state with CTA to /map for cafe submission
- Uses deleteSubmission Server Action with confirmation and toast feedback

**Props:**
- submissions: Array of submission objects
- totalCount: Total for load more calculation
- userId: Current user ID
- translations: Object with all UI strings

### RatingsList Component (src/components/dashboard/ratings-list.tsx)

**Features:**
- Client component for load more state
- Each rating links to cafe detail page via ROUTES.CAFE_DETAIL
- Displays cafe name, date, and overall rating with star icon
- Entire row is clickable (Link component)
- Load More button with remaining count
- Empty state with CTA to browse cafes

### PhotosList Component (src/components/dashboard/photos-list.tsx)

**Features:**
- Client component with grid layout (2/3/4 columns responsive)
- Thumbnail images with Supabase storage transform (width=200)
- Status badge overlay on each photo
- Upvote count with heart icon for photos with votes
- For pending photos: Delete button (trash icon) appears on hover
- For rejected photos: Rejection reason shown below cafe name
- Uses deletePhoto Server Action with confirmation and toast feedback
- Load More button with remaining count

### API Routes

**src/app/api/dashboard/submissions/route.ts:**
- GET handler with offset and limit query params
- Auth check via createClient().auth.getUser()
- Queries cafe_submissions filtered by user_id
- Returns JSON array of submissions

**src/app/api/dashboard/ratings/route.ts:**
- GET handler with offset and limit query params
- Auth check and user_id filter
- Includes cafe join for name and slug
- Returns JSON array of ratings

**src/app/api/dashboard/photos/route.ts:**
- GET handler with offset and limit query params
- Auth check and user_id filter
- Includes cafe join for name
- Returns JSON array of photos

### Dashboard Integration (src/app/dashboard/page.tsx)

**Updates:**
- Imports SubmissionsList, RatingsList, PhotosList components
- Builds translations objects for each list component
- Transforms fetched data for proper typing
- Passes data and translations to list components
- Added rejection_reason to photos query for rejected photo display

### Translations (src/lib/i18n/translations.ts)

**12 new keys added for all 5 languages (en, ko, fr, zh, vi):**
- dashboard.cafes.emptyCta
- dashboard.ratings.emptyCta
- dashboard.photos.emptyCta
- dashboard.loadMore
- dashboard.remaining
- dashboard.showReason
- dashboard.hideReason
- dashboard.rejectionReason
- dashboard.actions.edit
- dashboard.actions.delete
- dashboard.actions.deleteConfirm
- dashboard.upvotes

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `npm run build` succeeds - All routes compile without errors
- [x] SubmissionsList renders with status badges (259 lines, min 60)
- [x] Pending submissions show Edit/Delete buttons
- [x] Declined submissions can expand to show rejection reason
- [x] RatingsList shows cafe names as links + overall scores (145 lines, min 50)
- [x] PhotosList displays thumbnails with status badges (243 lines, min 50)
- [x] Load More fetches additional items via API endpoints
- [x] API routes for all three sections (53 lines submissions, min 25)
- [x] Key links verified: fetch patterns, CAFE_DETAIL, component imports
- [x] 12 translation keys added to all 5 languages

## Commits

| Hash | Message |
|------|---------|
| 51b3511 | feat(11-02): add SubmissionsList component with actions |
| d60362b | feat(11-02): add RatingsList and PhotosList components |
| 23b70c6 | feat(11-02): integrate lists into dashboard with i18n |

## Success Criteria Verification

- [x] DASH-01: User sees submitted cafes with status (pending/approved/declined)
- [x] DASH-02: User sees ratings with cafe names and overall scores
- [x] DASH-03: User sees photos with thumbnails and status
- [x] DASH-04: Stats show counts (from Plan 01) + lists show details
- [x] Load more functionality works for all sections
- [x] Pending items have appropriate actions (edit/delete)
- [x] All text translated for 5 languages
