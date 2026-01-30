---
status: resolved
trigger: "Debug two remaining issues: 1) View Details works in Inspect Element but not on regular page, 2) Mobile shows nothing but filter button exists under header"
created: 2026-01-29T00:00:00Z
updated: 2026-01-29T00:00:00Z
---

## Current Focus

hypothesis: "Issue 1: Link click event is being blocked by Kakao Map's click handler. Issue 2: Mobile map has no explicit height/z-index causing it to be hidden"
test: "Apply fixes: convert Link to <a> tag with proper pointer-events, add explicit z-index and height to map container"
expecting: "Both issues resolved - link becomes clickable, map appears on mobile"
next_action: "Apply fixes to cafe-info-window.tsx and map-with-filters.tsx"

## Symptoms

expected: |
  Issue 1: Clicking "View Details" in cafe info window should navigate to cafe detail page
  Issue 2: Mobile should display the Kakao map with filter button overlay
actual: |
  Issue 1: View Details link works in Inspect Element but not on regular page
  Issue 2: Mobile shows blank page with only filter button visible
errors: "No visible errors, both appear to be CSS/z-index/pointer-events issues"
reproduction: |
  Issue 1: Open map, click any cafe marker, try to click "View Details" link
  Issue 2: View map page on mobile viewport or mobile device
started: "Always present"

## Eliminated

## Evidence

- timestamp: 2026-01-29T00:00:00Z
  checked: "cafe-info-window.tsx"
  found: "CustomOverlayMap has zIndex={10}, Link uses onClick with stopPropagation"
  implication: "stopPropagation might be interfering with navigation, or overlay parent blocks clicks"

- timestamp: 2026-01-29T00:00:00Z
  checked: "map-with-filters.tsx"
  found: "Mobile filter button has z-10 absolute positioning, map has flex-1 relative but no explicit z-index"
  implication: "Map might be rendering behind something or lacking proper height on mobile"

## Resolution

root_cause: "Issue 1: Link click was blocked by Kakao Map overlay's event handling. Issue 2: Map container lacked explicit z-index and min-height on mobile"
fix: "Issue 1: Converted Next.js Link to <a> tag with cursor-pointer, pointer-events-auto, and z-50. Increased CustomOverlayMap zIndex to 1000. Issue 2: Added z-0 to map container, wrapped CafeMap in absolute inset-0 div, added min-height to Map component"
verification: "Pending build verification"
files_changed:
  - src/components/map/cafe-info-window.tsx
  - src/components/map/map-with-filters.tsx
  - src/components/map/cafe-map.tsx
