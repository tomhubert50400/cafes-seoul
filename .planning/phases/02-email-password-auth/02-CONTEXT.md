# Phase 2: Email/Password Authentication - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create accounts with email/password, verify their email via link, log in with credentials, and log out. This phase delivers signup page, login page, email verification handling, and logout functionality. OAuth login is Phase 3; password reset is out of v1 scope.

</domain>

<decisions>
## Implementation Decisions

### Form Layout & Pages
- Separate pages for login (/login) and signup (/signup), not combined
- Centered card layout on minimal background
- Minimal header (logo only, no navigation links)
- Both inline link ("Don't have an account? Sign up") AND header link to switch between pages

### Verification Flow
- After signup: Redirect to home with toast notification saying "Check your email"
- Email verification link: Auto-login and redirect to home (no manual login needed)
- Resend option: Show on login page if user tries to log in while unverified
- Unverified users: Block login entirely with "Please verify your email first" error

### Input Validation UX
- Hybrid validation: Real-time for format (on blur), on-submit for server errors
- Password requirements: Strength meter (visual bar showing weak/medium/strong)
- Error placement: Below each field (inline)
- Password visibility: Eye icon toggle to show/hide password

### Post-Auth Behavior
- Login redirect: Always to home page (/)
- Logout redirect: To login page (/login)
- Logout access: User menu dropdown (click avatar/name to reveal menu)

### Claude's Discretion
- Login success feedback (toast vs silent redirect)
- Exact strength meter thresholds and colors
- Loading state design during form submission
- Error message wording

</decisions>

<specifics>
## Specific Ideas

- Minimal, clean auth experience — centered card, logo-only header
- Users should never need to log in twice (auto-login after verification)
- Clear blocking for unverified users with path to resend

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-email-password-auth*
*Context gathered: 2026-01-27*
