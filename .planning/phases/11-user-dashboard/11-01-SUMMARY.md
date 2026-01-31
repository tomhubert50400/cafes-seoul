---
phase: 11
plan: 01
subsystem: user-dashboard
tags: [dashboard, user-contributions, statistics, i18n]

# Dependency graph
requires:
  - phase-10 (admin panel patterns)
  - phase-7 (cafe_submissions table)
  - phase-8 (cafe_ratings table)
  - phase-9 (photos table)
provides:
  - /dashboard route with auth protection
  - UserStats component for mini stat cards
  - StatusBadge component for status indicators
  - Dashboard translations in 5 languages
affects:
  - phase-11-02 (contribution lists will build on this page)
  - future user profile enhancements

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Parallel data fetching with Promise.all
    - Server component with cookies for language
    - Mini stats cards per section
    - Empty state with CTAs for new users

# File tracking
key-files:
  created:
    - src/app/dashboard/layout.tsx
    - src/app/dashboard/page.tsx
    - src/components/dashboard/user-stats.tsx
    - src/components/dashboard/status-badge.tsx
  modified:
    - src/lib/constants/routes.ts
    - src/components/auth/user-menu.tsx
    - src/lib/i18n/translations.ts

# Decisions
decisions:
  - id: dash-layout-simple
    description: Dashboard layout is simple container, not admin-style sidebar
    rationale: User dashboard is single-page, no sub-navigation needed
  - id: dash-stats-per-section
    description: Mini stats cards placed above each section, not single summary
    rationale: Provides context for each contribution type separately
  - id: dash-avg-rating-inline
    description: Average rating shown inline with count as metric
    rationale: Compact display, avoids extra visual elements

# Metrics
metrics:
  duration: ~5 min
  completed: 2026-01-31
---

# Phase 11 Plan 01: Dashboard Foundation Summary

User dashboard page at /dashboard with stats aggregation and navigation entry point via user menu.

## One-liner

Dashboard page with parallel stat queries, UserStats/StatusBadge components, user menu link, and 5-language i18n.

## What Was Built

### Dashboard Route (src/app/dashboard/)

**layout.tsx:**
- Server component with auth check via `createClient().auth.getUser()`
- Redirects unauthenticated users to `/login?redirect=/dashboard`
- Simple container layout with padding (not admin-style sidebar)
- Exports metadata with title "My Contributions"

**page.tsx:**
- Server component with parallel data fetching using Promise.all
- 6 queries in parallel:
  - Count cafe_submissions by user_id (head: true)
  - Count cafe_ratings by user_id
  - Count photos by user_id
  - Recent 5 cafe_submissions with status, rejection_reason
  - Recent 5 cafe_ratings with overall score and cafe join
  - Recent 5 photos with status, upvote_count, cafe join
- Calculates average rating: ratings.reduce sum / length, .toFixed(1)
- Handles edge case: avgRating = null if no ratings
- Empty state for new users (all counts = 0) with welcome message and CTAs

### Dashboard Components (src/components/dashboard/)

**user-stats.tsx:**
- Props: icon (LucideIcon), title, count, optional metric
- Horizontal flex layout with 48px rounded-full icon container
- Count as text-2xl font-bold, metric as text-sm text-muted-foreground

**status-badge.tsx:**
- Props: status (pending/approved/declined/rejected), label
- Color variants:
  - pending: yellow
  - approved: green
  - declined/rejected: red
- Dark mode compatible with dark: prefixed colors
- Rounded-full px-2.5 py-0.5 text-xs font-medium

### Navigation Integration

**routes.ts:**
- Added DASHBOARD: '/dashboard' to ROUTES.User section

**user-menu.tsx:**
- Added "My Contributions" link after Profile, before My Reviews
- Uses LayoutDashboard icon from lucide-react
- Links to ROUTES.DASHBOARD

### Translations (src/lib/i18n/translations.ts)

Added for all 5 languages (en, ko, fr, zh, vi):
- nav.contributions: Menu item label
- dashboard.title: Page title
- dashboard.welcome.title/subtitle: Welcome messages for new users
- dashboard.welcome.browse/submit: CTA button labels
- dashboard.cafes/ratings/photos.title: Section headers
- dashboard.cafes/ratings/photos.empty: Empty state messages
- dashboard.ratings.avg: Average label
- dashboard.status.pending/approved/declined/rejected: Status labels

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `npm run build` succeeds - Route shows as dynamic at /dashboard
- [x] Dashboard page renders with three sections (Cafes, Ratings, Photos)
- [x] Stats cards display counts correctly
- [x] Average rating calculation works (e.g., "avg 4.2")
- [x] Empty state appears for new users with CTAs
- [x] User menu shows "My Contributions" link
- [x] All 5 languages have dashboard translations

## Commits

| Hash | Message |
|------|---------|
| 6740723 | feat(11-01): add dashboard route with layout and auth protection |
| 3503215 | feat(11-01): add UserStats and StatusBadge components |
| fe34c58 | feat(11-01): add dashboard route constant, user menu link, and i18n |

## Next Phase Readiness

**Ready for 11-02:** Contribution Lists
- UserStats and StatusBadge components available for reuse
- Dashboard page structure ready for list components
- Recent items display works, Load More pattern needed for full lists
- Edit/delete actions on pending items to be added in Plan 02

**Technical foundation solid:**
- Parallel fetching pattern established
- Translation keys in place
- Status badge variants defined
