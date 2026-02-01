# Phase 16: Text Reviews - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhance the existing rating system with optional text commentary. Users can add text when rating or later, edit their reviews, and vote others' reviews as helpful. Text displays on cafe pages with author info and helpful counts.

</domain>

<decisions>
## Implementation Decisions

### Review Composition
- Text field expands after user completes rating (optional "Add a review" section)
- No title field — just text content
- 500 character limit for review text
- Users can add text to existing ratings anytime (not just at rating time)

### Review Display
- Card list layout on cafe page — each review in its own card
- Show author avatar + display name (clickable to public profile if enabled)
- Default sort: newest first
- Show reviewer's overall average score only (not individual dimension scores)

### Helpful Voting
- Only logged-in users can vote
- Toggle behavior — click again to remove vote (like favorites)
- Count displays only when >0 ("X people found this helpful")
- Users cannot vote on their own reviews (blocked)

### Edit Experience
- Edit from My Reviews tab only (not on cafe page)
- Can delete text while keeping rating (text-only removal)
- "Edited" badge shown with edit timestamp
- Editing preserves helpful vote count
- No time limit on editing
- Inline editing — card expands to show edit form
- Deleting text removes all helpful votes
- Confirmation dialog before deleting text

### Claude's Discretion
- Card styling and spacing
- Empty state design when no reviews
- Loading states and error handling
- Exact "edited" badge placement and format

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

*Phase: 16-text-reviews*
*Context gathered: 2026-02-01*
