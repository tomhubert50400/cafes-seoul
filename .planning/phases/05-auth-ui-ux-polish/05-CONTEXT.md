# Phase 5: Auth UI/UX Polish - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish and refine the existing auth experience for production readiness. Focus on validation feedback, loading states, error handling, and smooth interactions. No new auth capabilities — only improving how existing flows feel and respond.

</domain>

<decisions>
## Implementation Decisions

### Validation Behavior
- **Timing:** Errors appear on field blur (when user leaves the field), not while typing or only on submit
- **Display:** Inline below each field with clear error text
- **Re-validation:** For fields that already showed errors, clear the error immediately when user starts typing, then re-validate on next blur
- **Password strength:** Indicator appears after 3+ characters typed (not immediately on focus)

### Loading States
- **Visual:** Form-level semi-transparent overlay with spinner (not just button-level)
- **Trigger timing:** Loading state starts after 200ms delay (prevents flash on fast responses)
- **Button text:** Changes to action-specific text during loading (e.g., "Signing in...", "Creating account...")
- **Interactivity:** Cancel button appears during loading operations (allows users to abort long requests)

### Error Feedback Style
- **Server errors:** Display as toast notifications (slide-in at screen edge)
- **Dismissal:** Auto-dismiss with progress bar showing countdown (users can also manually close)
- **Multiple errors:** Combine into single toast (e.g., "3 errors found" with expandable details)
- **Retry:** Claude's discretion on retry strategy for network/server errors

### Success Feedback
- **After login:** Show success toast with brief celebration, then redirect to destination
- **After signup:** Different flows by method —
  - Email signup: Show "verification email sent" message inline on page (display email address)
  - OAuth signup: Redirect to home with success toast
- **Success style:** Brief celebration (subtle animation) for major actions like signup
- **After logout:** Toast confirmation "Logged out successfully"

### Accessibility & Motion
- **Motion:** Always animate but keep subtle (do not honor reduced motion system preferences)
- **Focus management:** On validation error, automatically focus the first invalid field
- **Keyboard:** Tab navigation optimization (logical order, skip decorative elements)
- **Screen readers:** Use live regions sparingly (announce critical changes only)

### Claude's Discretion
- Retry strategy implementation for failed network requests
- Specific animation/celebration implementation details
- Exact toast positioning and styling
- Cancel button behavior implementation

</decisions>

<specifics>
## Specific Ideas

- Progress bar on toasts gives users sense of how long message will stay visible
- Cancel button during loading provides escape hatch for slow network conditions
- Brief celebration adds delight to successful account creation without being distracting
- Email verification page should display the actual email address so user knows where to check

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (polish only, no new capabilities)

</deferred>

---

*Phase: 05-auth-ui-ux-polish*
*Context gathered: 2026-01-28*
