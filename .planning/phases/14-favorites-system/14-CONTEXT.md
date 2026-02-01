# Phase 14: Favorites System - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

User can save and manage favorite cafes across the application. Heart icons on cafe cards and detail pages to toggle favorites. Favorites list in profile tab. Filter on main map to show only favorites.

</domain>

<decisions>
## Implementation Decisions

### Heart Interaction
- Heart icon in top-right corner of cafe cards, overlaid on image
- Bounce animation on toggle (scales up/down briefly) plus fill change
- Filled red when favorited, outline when not
- No confirmation needed for unfavoriting — immediate toggle
- Heart icon hidden entirely for logged-out users (not shown, not disabled)
- Static filled heart on page load — animation only on toggle

### Favorites List Layout
- Reuse existing CafeCard component — same layout as browse experience
- Sort dropdown with options: Date added, Rating, Neighborhood
- Empty state: Illustration + CTA button to browse cafes
- Skeleton card loading states while fetching
- Show favorites count on tab: "Favorites (12)"

### Map View
- No separate favorites map — add "Show only favorites" filter on main map page
- Favorited cafes have different color pin (e.g., red vs default color)
- Heart toggle in map popup — can favorite/unfavorite from popup
- Unfavoriting while filter active: marker disappears immediately
- Empty state when filter active with no favorites: empty map + message + CTA
- Favorites filter visible but disabled for logged-out users (with tooltip)

### Cross-page Sync
- Optimistic UI updates — update heart immediately, sync to database in background
- Refetch data on navigation — returning to list shows current state
- On error: revert heart state + show error toast
- Real-time updates — favorites list updates when toggling from other views in same session

### Claude's Discretion
- Favorites filter placement on map (filter bar vs floating button)
- Cross-tab synchronization approach (complexity vs benefit tradeoff)
- Rate limiting implementation (light UI debounce and/or server-side limits)
- Heart placement on cafe detail page

</decisions>

<specifics>
## Specific Ideas

- Heart should feel responsive — bounce animation gives satisfying feedback
- Keep consistent with existing patterns: skeleton loading, CafeCard reuse, sonner toasts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-favorites-system*
*Context gathered: 2026-02-01*
