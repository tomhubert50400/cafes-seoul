# Phase 08: Ratings System - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Users rate cafes on 10 dimensions with 1 mandatory overall rating (1-5 stars) and 9 optional dimension ratings (0-5). Includes rating form UI, display on cafe cards (list/map/detail), and entry points throughout the app. Users can update their ratings (overwrite).

</domain>

<decisions>
## Implementation Decisions

### Rating Form Layout
- Overall rating (mandatory 1-5) positioned prominently at top of form, visually distinct from optional dimensions
- Optional dimensions organized into three sections:
  - **Essentials:** Coffee Quality, Wifi, Price
  - **Comfort:** Quietness, Seating, Comfort
  - **Extras:** Food, Pet Friendly, Accessibility
- All dimensions visible at once — no step wizard or hidden sections

### Rating Input Method
- **All dimensions use sliders** (not stars) for mobile-friendly interaction
- Sliders display numeric values 0-5 clearly alongside visual position
- Optional dimensions default to "Unrated" state — user must drag to set a value
- Zero (0) means "skip/unrated" not "poor quality"

### Rating Display on Cards
- **List cards:** Show overall average + star rating only (e.g., "★ 4.2") — clean, scannable
- **Map info window:** Same as list cards — keep it simple and consistent
- **Detail page:** Full breakdown with all 10 dimensions prominently displayed
- Show both average and user's rating: "Average: 4.2 · Your rating: 4.5" with clear indicator

### Update/Overwrite Flow
- Same rating form pre-populated with user's current ratings
- "Update" button instead of "Submit" when editing existing rating
- Soft inline confirmation: "Update your rating?" with cancel/update options (no modal)
- Ratings overwrite completely — no history shown to users
- **No delete option** — ratings can only be updated, never removed

### Empty State Handling
- **List cards:** "Be the first to rate" prompt directly on card
- **Detail page:** Placeholder visual (5 empty stars) with "Rate this cafe" CTA
- Messaging emphasizes value: "Help others find great cafes" and "Your rating helps the community"
- No gamification elements (badges, points) — focus on community contribution

### Claude's Discretion
- Exact slider styling and thumb design
- Spacing between sections and dimensions
- Empty state illustration style
- Exact wording for i18n translations
- Animation/transition details for slider interaction

</decisions>

<specifics>
## Specific Ideas

- Sliders preferred over stars for mobile usability — easier to adjust precisely with thumb
- "Unrated" state important to communicate that 0 = skipped, not rated poorly
- Grouping by Essentials/Comfort/Extras helps users think about what matters to them
- Keep list/map views minimal (overall only) to avoid clutter, full detail on dedicated page

</specifics>

<deferred>
## Deferred Ideas

- Rating history/time-series for users (belongs in User Dashboard phase)
- Gamification/badges for frequent raters (potential future enhancement)
- Text reviews or comments (separate feature, not in this phase)
- Machine learning recommendations based on rating patterns (future enhancement)

</deferred>

---

*Phase: 08-ratings-system*
*Context gathered: 2026-01-30*
