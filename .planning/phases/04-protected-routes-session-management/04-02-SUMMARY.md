---
phase: 04-protected-routes-session-management
plan: 02
subsystem: ui
tags: [auth, avatar, dropdown, i18n, supabase]

# Dependency graph
requires:
  - phase: 03-oauth-integration
    provides: OAuth authentication and session management
provides:
  - UserMenu component with avatar dropdown
  - Auth-aware Header showing user menu or login buttons
  - Server-side user fetching in root layout
  - User menu translations in 5 languages
affects:
  - 04-03-profile-page
  - 04-04-session-persistence

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component fetches user and passes to Client Component Header"
    - "Client Component Header conditionally renders based on auth state"
    - "Avatar dropdown using Radix UI primitives"

key-files:
  created:
    - src/components/auth/user-menu.tsx
  modified:
    - src/components/header.tsx
    - src/app/layout.tsx
    - src/lib/i18n/translations.ts

key-decisions:
  - "Use Supabase Auth User type instead of internal User type for auth-aware UI"
  - "Avatar shows initials fallback (first 2 chars of email) when no profile image"
  - "Layout fetches user server-side for optimal performance"
  - "UserMenu includes: Profile, My Reviews, Settings, Logout"

patterns-established:
  - "Server/Client pattern: Layout (Server) → Header (Client) → UserMenu (Client)"
  - "Avatar dropdown with user info header and navigation links"
  - "Logout action wrapped in DropdownMenuItem as form"

# Metrics
duration: 8min
completed: 2026-01-28
---

# Phase 4 Plan 2: Auth-aware Header with UserMenu Summary

**Avatar dropdown menu for authenticated users with Profile, My Reviews, Settings, and Logout options. Logged-out users see Login and Signup buttons. Layout fetches user server-side.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-28T12:47:30Z
- **Completed:** 2026-01-28T12:55:30Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Created UserMenu component with avatar dropdown for logged-in users
- Updated Header to conditionally show UserMenu (logged in) or Login/Signup buttons (logged out)
- Made root layout async to fetch user server-side via Supabase auth
- Added i18n translations for user menu items in all 5 languages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create UserMenu component** - `13d0a39` (feat)
2. **Task 2: Update Header to use UserMenu** - `b83bd0f` (feat)
3. **Task 3: Add user fetching to root layout** - `f906a90` (feat)
4. **Task 4: Add translations for user menu** - `4ae31b1` (feat)

## Files Created/Modified

- `src/components/auth/user-menu.tsx` - New avatar dropdown component for authenticated users
- `src/components/header.tsx` - Updated to use UserMenu and accept Supabase User type
- `src/app/layout.tsx` - Now async, fetches user server-side and passes to Header
- `src/lib/i18n/translations.ts` - Added nav.profile, nav.myReviews, nav.settings in 5 languages

## Decisions Made

- **Supabase User Type**: Used `User` from `@supabase/supabase-js` instead of internal `User` type because the auth-aware UI needs access to `user_metadata` (avatar_url, name) from OAuth providers
- **Avatar Fallback**: Shows first 2 characters of email (uppercase) when no profile image exists
- **Server-Side Fetching**: Layout fetches user via `supabase.auth.getUser()` for optimal performance and to avoid client-side hydration issues
- **Menu Structure**: Dropdown contains mini-profile card (avatar + name + email), navigation links (Profile, My Reviews, Settings), and Logout button

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components integrated smoothly with existing architecture.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Auth-aware Header is complete and ready for use across all pages
- Layout now provides user context to Header automatically
- Ready for Phase 4 Plan 3: Create profile page with tab navigation and route protection

---
*Phase: 04-protected-routes-session-management*
*Completed: 2026-01-28*
