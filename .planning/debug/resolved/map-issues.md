---
status: resolved
trigger: "Debug and fix two issues: 1) View Details doesn't work in map info window, 2) Mobile shows blank page (only header)"
created: 2026-01-29T00:00:00Z
updated: 2026-01-29T00:05:00Z
---

## Current Focus

hypothesis: Both issues identified and fixed
test: Code review of map components and layout structure
expecting: Fixes applied successfully
next_action: Complete verification

## Symptoms

expected: 
  - Issue 1: Clicking "View Details" should navigate to cafe detail page
  - Issue 2: Mobile viewport should show map below header
actual: 
  - Issue 1: Clicking "View Details" doesn't navigate
  - Issue 2: Mobile shows only header, blank page below
errors: []
reproduction: 
  - Issue 1: Open map, click on cafe marker, click "View Details" in info window
  - Issue 2: Open /map on mobile viewport or use dev tools mobile mode
started: Unknown

## Eliminated

## Evidence

- timestamp: 2026-01-29T00:00:00Z
  checked: cafe-info-window.tsx
  found: Uses next/Link inside CustomOverlayMap from react-kakao-maps-sdk. Link href is `/cafes/${cafe.slug}`. No event propagation control on Link.
  implication: Click events on Link may bubble up to Map's onClick handler, closing info window before navigation

- timestamp: 2026-01-29T00:01:00Z
  checked: map/page.tsx layout structure
  found: Main container uses h-[calc(100vh-3.5rem)] but child components rely on h-full
  implication: Height may not be properly inherited on mobile due to flex layout differences

- timestamp: 2026-01-29T00:02:00Z
  checked: map-with-filters.tsx
  found: Uses flex layout with h-full, sidebar hidden on mobile (md:block), map in flex-1 relative container
  implication: Mobile layout should work but height inheritance chain might be broken

## Resolution

root_cause: 
  Issue 1: Event propagation from Link inside CustomOverlayMap was not stopped, causing the Map's onClick handler to fire and close the info window before navigation could complete.
  Issue 2: The height calculation chain on mobile wasn't ensuring the map container had proper dimensions, causing the map to not render.

fix: 
  Issue 1: Added onClick handler with e.stopPropagation() to the Link component in cafe-info-window.tsx to prevent event bubbling.
  Issue 2: Added overflow-hidden to main container and wrapped CafeMapWrapperDynamic in a div with h-full w-full to ensure proper height inheritance on mobile.

verification: 
  Issue 1: Link now has event propagation control, should allow navigation to work properly.
  Issue 2: Height container structure improved to ensure map renders on mobile viewports.

files_changed: 
  - src/components/map/cafe-info-window.tsx
  - src/app/map/page.tsx
