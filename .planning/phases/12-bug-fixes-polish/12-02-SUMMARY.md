---
phase: 12-bug-fixes-polish
plan: 02
subsystem: ui
tags: [react-hook-form, tabs, ux, form-simplification]

# Dependency graph
requires:
  - phase: 09-user-submissions
    provides: cafe-submission-form.tsx foundation
provides:
  - Simplified cafe submission form without coordinates
  - Unified language tab selection for name and address
affects: [submissions, add-cafe]

# Tech tracking
tech-stack:
  added: []
  patterns: [unified-tab-state]

key-files:
  created: []
  modified:
    - src/components/submissions/cafe-submission-form.tsx

key-decisions:
  - "Keep schema unchanged for API compatibility - fields hidden in UI only"
  - "Share activeLanguageTab state between name and address sections"

patterns-established:
  - "Unified tab state: When multiple tab groups should sync, use shared controlled state"

# Metrics
duration: 5min
completed: 2026-02-01
---

# Phase 12 Plan 02: Simplify Submission Form Summary

**Removed coordinates input fields and unified name/address language tabs for cleaner UX**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-01T00:12:00Z
- **Completed:** 2026-02-01T00:17:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Removed latitude/longitude input fields from submission form UI
- Unified language tab selection - switching name language also switches address language
- Form is now simpler with only name, address, and phone fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove coordinates section from submission form** - `6628248` (fix)
2. **Task 2: Unify language tab selection for name and address** - `9f52515` (fix)

## Files Created/Modified
- `src/components/submissions/cafe-submission-form.tsx` - Removed coordinates section (70 lines), changed address Tabs to use shared activeLanguageTab state

## Decisions Made
- Kept Zod schema unchanged - latitude/longitude remain optional in schema for API compatibility, just hidden from form UI
- Used existing activeLanguageTab state for both tab groups rather than creating separate sync mechanism

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Form simplification complete
- Requirements FORM-01 (no coordinates) and FORM-02 (unified tabs) satisfied
- Ready for verification in UAT

---
*Phase: 12-bug-fixes-polish*
*Completed: 2026-02-01*
