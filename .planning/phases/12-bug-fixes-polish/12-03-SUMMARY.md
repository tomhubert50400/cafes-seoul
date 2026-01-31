---
phase: 12-bug-fixes-polish
plan: 03
subsystem: ui
tags: [layout, header, navigation, mobile, overflow]

# Dependency graph
requires:
  - phase: 07-user-profile
    provides: Profile layout with Header component
provides:
  - Dashboard page with navigation header
  - Single header rendering on submissions page
  - Mobile-friendly profile layout without horizontal scroll
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Layout components provide shared Header, child pages render content only

key-files:
  created: []
  modified:
    - src/app/dashboard/layout.tsx
    - src/app/profile/submissions/page.tsx
    - src/app/profile/layout.tsx

key-decisions:
  - "Dashboard uses same Header pattern as profile layout"
  - "Submissions page returns Fragment, parent layout handles structure"
  - "overflow-x-hidden prevents mobile horizontal scroll"

patterns-established:
  - "Nested layouts: child pages should not duplicate Header from parent layout"

# Metrics
duration: 8min
completed: 2026-02-01
---

# Phase 12 Plan 03: Layout Bug Fixes Summary

**Fixed dashboard missing header, removed duplicate header on submissions, and prevented mobile horizontal scroll on profile**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-01T10:00:00Z
- **Completed:** 2026-02-01T10:08:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Dashboard (My Contributions) page now displays navigation header
- Profile submissions page shows single header from parent layout
- Profile pages scroll vertically without horizontal overflow on mobile

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Header to dashboard layout** - `1b0ec47` (fix)
2. **Task 2: Remove duplicate Header from submissions page** - `321d5c0` (fix)
3. **Task 3: Fix mobile horizontal scroll in profile layout** - `89740e0` (fix)

## Files Created/Modified
- `src/app/dashboard/layout.tsx` - Added Header import and wrapped content with proper layout structure
- `src/app/profile/submissions/page.tsx` - Removed Header import and outer wrapper, returns Fragment
- `src/app/profile/layout.tsx` - Added overflow-x-hidden to outer div

## Decisions Made
- Dashboard layout follows same pattern as profile layout (min-h-screen bg-background wrapper with Header)
- Submissions page returns content as Fragment since parent profile layout provides structure
- overflow-x-hidden added at outermost div to prevent any child from causing horizontal scroll

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed missing imports in user-menu.tsx**
- **Found during:** Build verification for Task 1
- **Issue:** Pre-existing TypeScript error - DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal not imported; Globe icon missing; i18n variables not destructured
- **Fix:** File was auto-fixed by linter during build process
- **Files modified:** src/components/auth/user-menu.tsx
- **Verification:** Build passes
- **Note:** Pre-existing issue, not introduced by this plan

**2. [Rule 3 - Blocking] Fixed missing supabase variable in photo-upload.tsx**
- **Found during:** Build verification for Task 1
- **Issue:** Pre-existing TypeScript error - supabase variable referenced but not defined in handleFileSelect callback
- **Fix:** Added `const supabase = createClient()` in scope (linter moved to component level)
- **Files modified:** src/components/photos/photo-upload.tsx
- **Verification:** Build passes
- **Note:** Pre-existing issue, not introduced by this plan

---

**Total deviations:** 2 auto-fixed (2 blocking - pre-existing build errors)
**Impact on plan:** Both were pre-existing build errors that blocked verification. Fixed to allow build to complete.

## Issues Encountered
- Build failed initially due to pre-existing TypeScript errors in user-menu.tsx and photo-upload.tsx
- These were fixed as blocking issues (Rule 3) to allow plan verification

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Layout issues fixed, all three requirements (LAYOUT-01, LAYOUT-02, LAYOUT-03) satisfied
- No blockers for other plans

---
*Phase: 12-bug-fixes-polish*
*Completed: 2026-02-01*
