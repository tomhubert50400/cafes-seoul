# Phase 11: User Dashboard - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view their contributions and statistics. Dashboard shows submitted cafes, ratings given, and uploaded photos with status indicators. This is a read-only view of user activity with limited edit/delete actions on pending items.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout
- Single scrolling page (not tabs)
- Stats inline with each section (mini cards above each list)
- Section order: Cafes → Ratings → Photos (matches user journey)
- Access via profile menu item ("My Contributions" or similar)

### Statistics display
- Simple counts per section (not status breakdowns)
- Mini cards with icon + number above each section header
- Show average rating given in ratings stats ("12 ratings • avg 4.2★")

### Contribution lists
- Sort by most recent first (newest at top)
- 5 items per section before "load more"
- Ratings show: cafe name + overall rating ("Cafe ABC — 4★")

### Status visibility
- Text labels for status ("Pending", "Approved", "Rejected")
- Rejected items: show reason on hover/click (expandable)
- Pending cafe submissions: Edit + Delete actions available
- Pending photos: Delete action available

### Claude's Discretion
- Cafe submission list fields (name + address + status vs name + status + date)
- Whether photo stats include total upvotes received
- Exact mini card styling and icons
- Empty state messaging per section
- "Load more" button styling

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-user-dashboard*
*Context gathered: 2026-01-31*
