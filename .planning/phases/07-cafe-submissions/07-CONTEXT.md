# Phase 7: Cafe Submissions - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can propose new cafes through a submission form. Submissions undergo duplicate detection, enter a pending state for admin approval, and users can track status, edit while pending, and delete if needed. Rate limiting enforces 3 submissions per day per user.

</domain>

<decisions>
## Implementation Decisions

### Submission Form Layout
- Single-page form (not multi-step wizard)
- Fields ordered: most important → least important information
- Validation triggers on submit, not inline

### Duplicate Detection UX
- Modal dialog shows potential duplicate matches
- Checks similarity on name and address fields
- User can proceed with submission despite warning, or cancel

### Submission Status Visibility
- Profile section includes "My Submissions" area
- Three tabs/sections: Pending, Approved, Declined
- Clicking each tab displays related cafes in that status
- Admin rejection reasons display in the Declined section

### Rate Limiting Feedback
- Block with clear explanation when daily limit (3 submissions) is reached
- Not a warning — actual prevention with messaging

### Entry Point Placement
- "Add Cafe" button appears in multiple smart locations
- Primary placement: map page and list page
- Consider global nav or contextual placement based on user flow

### Claude's Discretion
- Exact field ordering within the form
- Modal design and styling details
- How similarity matching is implemented (fuzzy logic, thresholds)
- Profile submissions tab layout and organization
- Specific wording for rate limit messaging
- Exact placement strategy for entry points

</decisions>

<specifics>
## Specific Ideas

- Rejection reasons should be visible when viewing declined submissions in profile
- Duplicate detection should catch similar names and addresses, not just exact matches
- Form should feel lightweight despite having multiple fields (name, address, phone optional)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-cafe-submissions*
*Context gathered: 2026-01-30*
