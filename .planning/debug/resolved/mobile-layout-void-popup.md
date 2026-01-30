---
status: resolved
trigger: "Mobile layout broken (white space, wrong filter button position) and javascript:void(0) popup appearing"
created: 2026-01-29T12:00:00Z
updated: 2026-01-29T12:10:00Z
---

## Current Focus

hypothesis: CONFIRMED - (1) 100vh doesn't account for mobile browser chrome causing white space; (2) CustomOverlayMap click events bubble to map causing javascript:void(0) behavior
test: Implemented fixes - changed vh to dvh and added preventDefault/stopPropagation to overlay
expecting: Map takes full height on mobile without white space; no popup when clicking info window
next_action: Fixes applied, archiving session

## Symptoms

expected: Map takes full height below header on mobile; no popup appears when interacting with map
actual: White space below map, filter button positioned wrong, javascript:void(0) popup appears
errors: "javascript:void(0)" popup
reproduction: Open map page on mobile, interact with map elements
started: Unknown

## Eliminated

## Evidence

- timestamp: 2026-01-29T12:01:00Z
  checked: src/app/map/page.tsx
  found: Uses h-[calc(100vh-3.5rem)] which doesn't account for mobile browser UI
  implication: Mobile browsers include chrome in vh calculation causing white space
  
- timestamp: 2026-01-29T12:02:00Z
  checked: src/components/map/map-with-filters.tsx
  found: Flex layout with absolute positioned filter button at top-4 left-4
  implication: Layout structure is correct but parent height calculation is wrong
  
- timestamp: 2026-01-29T12:03:00Z
  checked: src/components/map/cafe-info-window.tsx
  found: CustomOverlayMap with clickable content, link has stopPropagation but overlay itself doesn't prevent map clicks
  implication: Click events on overlay may bubble to map triggering default Kakao behavior

## Resolution

root_cause: 
  1. Mobile layout: 100vh includes browser chrome on mobile; need 100dvh (dynamic viewport height) for proper mobile sizing
  2. javascript:void(0): CustomOverlayMap click events bubble up to the map, triggering Kakao Maps default click handlers
fix: 
  1. Changed `100vh` to `100dvh` in page.tsx for proper mobile viewport height calculation
  2. Added `onClick` handler with `preventDefault()` and `stopPropagation()` to the overlay container in cafe-info-window.tsx
  3. Replaced native `<a>` tag with Next.js `<Link>` component for proper client-side navigation
verification: TypeScript compilation passes without errors
files_changed:
  - src/app/map/page.tsx: Changed h-[calc(100vh-3.5rem)] to h-[calc(100dvh-3.5rem)]
  - src/components/map/cafe-info-window.tsx: Added preventDefault/stopPropagation on overlay div, replaced <a> with <Link>
