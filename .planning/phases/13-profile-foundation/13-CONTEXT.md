# Phase 13: Profile Foundation - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

User can view their complete rating history in a dedicated "My Reviews" tab. Each entry shows cafe info and user's scores. Users can sort/filter and see aggregate stats. Navigation to cafe detail pages. Text reviews and editing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Review List Layout
- Medium cards with cafe thumbnail, name, date rated, and overall score
- Click card to expand in-place and reveal all 5 dimension scores
- Thumbnail is for expand only; separate "View cafe" button for navigation to detail page
- Cards should feel clean and scannable

### Sorting & Filtering
- Sort options: Date (newest/oldest) and Overall score (highest/lowest)
- Default sort: Highest rated first
- Filter by minimum overall score using a slider
- Filter updates the displayed list dynamically

### Stats Display
- Subtle footer placement (not prominent header)
- Show: total count, average overall score, average per dimension
- Dimension breakdown as simple numbers (Coffee: 3.8 | Vibe: 4.2 | etc.)
- Stats update dynamically to reflect active filters ("3 cafes shown of 12 total")

### Empty States
- Zero reviews: Illustration + encouraging message + show 2-3 popular cafes to check out
- Tone: Encouraging ("Start discovering cafes and share your thoughts!")
- Filtered to zero: Same illustration style with "No reviews match this filter" + clear filter option

### Claude's Discretion
- Exact illustration choice/style
- Slider UI implementation details
- Card expand animation
- Responsive layout adjustments

</decisions>

<specifics>
## Specific Ideas

- Cards should be medium-sized, not cramped rows or full detail cards
- User wants to quickly scan their best-rated cafes (hence highest-rated default)
- Stats should be informative but not dominate the view
- Empty state should gently encourage exploration, not feel like an error

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-profile-foundation*
*Context gathered: 2026-02-01*
