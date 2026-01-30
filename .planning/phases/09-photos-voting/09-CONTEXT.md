# Phase 9: Photos & Voting - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Photo uploads with moderation queue and upvoting system. Users can upload up to 3 photos per cafe (10 per day rate limit). Photos enter pending state for admin approval. Approved photos display in a gallery sorted by upvote count. Users can upvote photos with a heart button (one vote per user per photo). Phase 10 (Admin Panel) handles the moderation interface.

</domain>

<decisions>
## Implementation Decisions

### Upload experience
- Traditional file picker (click button to browse files) — not drag-and-drop primary
- One photo at a time only — no batch uploads
- Progress bar showing upload percentage — visible feedback during upload
- Validation errors shown in list format below upload area — invalid files rejected, valid files kept

### Photo presentation
- Masonry layout (Pinterest-style varying heights) — not uniform grid
- First 6 photos visible initially, "Show more" button to load more
- Gallery thumbnails only — no lightbox or full-view modal
- Vote count always visible on each photo — no hover required
- **CRITICAL:** Never display uploader name — privacy by design

### Voting interaction
- Heart button in top-right corner of each photo (Instagram-style placement)
- Toggle behavior — click to upvote, click again to remove upvote
- Optimistic UI — vote count updates immediately before server confirmation
- Visual feedback: heart animation (scale + color pulse) + number briefly flashes/highlighted

### Moderation visibility
- Pending photos appear in gallery mixed with approved photos
- "Pending" badge visible ONLY to the uploader — other users don't see pending photos
- Cross-cafe photo viewing: User Dashboard only (Phase 11) — not on cafe detail pages
- Simple status badges: "Pending", "Approved", "Rejected" — text only, no color coding requirement
- Rejection messaging: show specific admin reason if provided, otherwise generic "Doesn't meet guidelines"

### Claude's Discretion
- Exact masonry column configuration (2/3 columns based on viewport)
- Upload file size limits and compression
- Heart animation timing and easing
- Badge styling and positioning
- Progress bar color and style
- Error message wording

</decisions>

<specifics>
## Specific Ideas

- Instagram-style heart placement in top-right corner feels familiar
- Masonry layout better showcases cafe atmosphere with varying photo orientations
- "Show more" pattern keeps initial load light while allowing browsing
- Privacy: Never showing uploader names maintains focus on cafes, not contributors

</specifics>

<deferred>
## Deferred Ideas

- Photo lightbox/full-view modal — out of scope for this phase
- Batch upload multiple photos — one-at-a-time only for now
- Photo editing/cropping after upload — future enhancement
- Commenting on photos — separate phase
- Photo categories/tags — future enhancement

</deferred>

---

*Phase: 09-photos-voting*
*Context gathered: 2026-01-30*
