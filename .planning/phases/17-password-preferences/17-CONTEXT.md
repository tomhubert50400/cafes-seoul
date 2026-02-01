# Phase 17: Password & Preferences - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

User can manage security and notification settings. Password reset flow via email with new password setting. Toggle email notification preferences for submission status updates. Does NOT include: session management, two-factor auth, email change.

</domain>

<decisions>
## Implementation Decisions

### Password reset flow
- Available in two places: "Forgot password?" link on login page AND "Change password" in settings
- After requesting reset: success toast ("Reset link sent to your email"), user stays on current page
- Reset link lands on settings page with password reset modal auto-opened
- After successful password change: sign out user, redirect to login with "Password updated" message
- OAuth users (Google, Kakao): hide password section entirely — they don't have passwords
- Expired/invalid link: dedicated error page with "Request new reset link" button
- Password requirements: 8+ characters with complexity (uppercase, lowercase, number, or special character)
- Visual password strength meter (color-coded weak/medium/strong) updates as user types

### Notification preferences
- Per-type toggles: separate on/off for cafe approved, cafe rejected, photo approved, photo rejected
- Default state: all notifications ON for new users (opt-out model)
- Toggle style: iOS-style switch toggles
- Auto-save: each toggle saves immediately with brief confirmation feedback

### Settings page organization
- Sub-tabs within settings: Profile | Security | Notifications (single-word labels, no icons)
- Account deletion stays where it currently is (don't move)
- Default tab: Profile (current behavior)
- Email address displayed read-only in Profile tab
- Tab navigation: horizontal scrolling tabs on mobile

### Claude's Discretion
- Security tab scope beyond password reset (keep focused on phase requirements)
- Tab URL structure (query params vs hash vs nested routes)
- Exact password strength algorithm and thresholds
- Auto-save toast duration and style

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Active sessions list with sign out — mentioned during security scope discussion, future phase
- Two-factor authentication — not in current requirements
- Email address change — separate from password reset

</deferred>

---

*Phase: 17-password-preferences*
*Context gathered: 2026-02-01*
