# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Filtrage multi-critères avec notes 1-5 sur chaque dimension du café
**Current focus:** Phase 5 complete - Authentication milestone finished

## Current Position

Phase: 5 of 5 (Auth UI/UX Polish)
Plan: 6 of 6 in phase
Status: Phase complete
Last activity: 2026-01-29 — Completed 05-06-PLAN.md

Progress: [████████████████████] 100% (16/16 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: ~6 min/plan
- Total execution time: ~1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Auth Foundation | 1/1 | 7 min | 7 min |
| 2. Email/Password Auth | 4/4 | ~15 min | ~4 min |
| 3. OAuth Integration | 2/2 | ~11 min | ~5 min |
| 4. Protected Routes | 4/4 | ~25 min | ~6 min |
| 5. Auth UI/UX Polish | 6/6 | ~57 min | ~10 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

**From Phase 5 (05-06):**
- useAutofillDetection hook: Triple detection strategy (onInput + polling + CSS animation) for password manager compatibility
- setFocus over manual refs: Use react-hook-form's setFocus instead of manual ref handling to avoid conflicts
- AuthMotionWrapper pattern: Separate motion animations into Client Component, keep layout as Server Component
- Error code translations: Use translation keys as error codes (verification_failed, user_not_found, etc.) for consistent messaging
- Already-verified handling: Check if user verified before showing errors, show helpful "Try logging in" message

**From Phase 5 (05-05):**
- Custom scoring algorithm replaces zxcvbn: Finer control over password strength calculation and criteria
- Check/Circle icon pattern: Met criteria show Check (green), unmet show Circle (neutral gray) - avoids negative X
- 3-character threshold for meter appearance: Prevents overwhelming users with feedback too early
- Animate-in CSS classes: Built-in Tailwind animation classes provide smooth entrance without framer-motion

**From Phase 5 (05-04):**
- OAuth errors remain inline: URL query param errors (OAuth failures) stay inline since user just landed
- useTransition for logout toast: React's useTransition allows toast to render before server action redirect
- Email from URL param: Verify page receives email via ?email= param, avoiding session/storage complexity
- Remove unused error state: Signup form no longer needs error state since all errors shown as toasts

**From Phase 5 (05-03):**
- Top-right toast positioning: Auth toasts positioned at top-right to avoid overlapping centered forms
- Rich colors enabled: Better visual distinction between success (green), error (red), and loading states
- Close button for accessibility: Users can manually dismiss toasts
- Duration differentiation: Error toasts 6s (longer reading time), success toasts 4s
- Translation function injection pattern: Auth toast utilities accept `t` function for consistent i18n support
- Toast ID pattern: Loading toasts return IDs for programmatic dismissal/update

**From Phase 5 (05-02):**
- 200ms delay prevents flash: Loading overlay appears after 200ms delay to prevent visual flash on fast responses (sub-200ms operations)
- Separate isLoading and showOverlay states: isLoading controls button state and form interactivity immediately, while showOverlay controls visual overlay with delay
- AbortController for cancellation: Each form submission creates a new AbortController, enabling users to cancel in-flight requests via the cancel button
- Consistent pattern across forms: Login and signup forms share identical loading state implementation for maintainability

**From Phase 5 (05-01):**
- Error clearing behavior: Errors only clear immediately when user types if the field was previously touched (not on initial load) - prevents clearing validation before user interaction
- Focus management priority: Email field focused first when server errors occur for better accessibility and user flow
- i18n placeholder pattern: Form placeholders use dedicated translation keys instead of hardcoded strings

**From Phase 4 (04-04):**
- Remember me checkbox defaults to true: Better UX for users who want to stay logged in
- LocalStorage for UX preferences: rememberMe preference stored in localStorage, SSR-safe with typeof window check
- SessionStorage for ephemeral auth state: next URL stored in sessionStorage (clears when tab closes), authNextUrl key
- 5-language i18n coverage: All auth translations maintained across EN, KO, FR, ZH, VI

**From Phase 4 (04-03):**
- Profile page structure: Tabbed navigation (Overview, Reviews, Favorites, Settings) with Reviews/Favorites as "Coming soon" placeholders
- Route protection pattern: Middleware for page-level protection, server-side checks for additional security
- Session expiry handling: Redirect to login with error message when session expires

**From Phase 4 (04-02):**
- Supabase User type for auth UI: Use Supabase Auth User type (with user_metadata) instead of internal User type for avatar dropdown - provides access to OAuth provider avatars and names
- Avatar initials fallback: Show first 2 characters of email (uppercase) when no profile image exists
- UserMenu structure: Mini-profile card (avatar + name + email) followed by navigation links (Profile, My Reviews, Settings) and Logout
- Server-side user fetching: Layout fetches user via supabase.auth.getUser() for optimal performance and hydration consistency

**From Phase 4 (04-01):**
- Redirect parameter standardization: Using 'next' instead of 'redirect' for consistency with OAuth callback and Next.js conventions
- AUTH-08 implementation: Sessions persist until logout by default via Supabase @supabase/ssr - no additional code needed
- Remember me checkbox: UI-only for user expectation management, actual persistence handled automatically

**From Phase 3 (03-02):**
- Kakao-first button order: Kakao appears before Google in UI (Korean market preference)
- Server/Client split pattern: Next.js 15+ searchParams as Promise requires Server Component, but i18n needs Client Component - solved with wrapper pattern
- OAuth error display: URL query param errors passed from page to form via props
- Divider styling: "or" text divider between email form and OAuth buttons using relative positioning

**From Phase 3 (03-01):**
- OAuth URL return pattern: Server Actions cannot redirect to external URLs, so `loginWithOAuth` returns provider URL for client to handle via `window.location.href`
- Open redirect prevention: Callback handler validates `next` param starts with `/` to prevent malicious redirects
- OAuth error code mapping: Specific Supabase error codes (flow_state_expired, bad_oauth_state, provider_disabled) mapped to user-friendly messages
- OAuth i18n namespacing: All OAuth keys under `auth.oauth.*` for consistency

**From Phase 2 (02-04):**
- Auth page redirect: Logged-in users auto-redirect from /login, /signup to home
- Header auth state: Main Header accepts user prop, shows LogoutButton when logged in
- Language switcher: Added to auth layout for i18n on auth pages

**From Phase 2 (02-03):**
- Password strength meter: Provides guidance only, does not enforce complexity rules
- Auth layout pattern: Minimal header with logo, language switcher
- Password strength debounce: 300ms delay prevents lag while typing
- Resend verification: Button appears in login form when email not confirmed

**From Phase 2 (02-02):**
- Server Actions pattern: All auth operations use Server Actions (no API routes)
- Error handling: Return error objects from actions instead of throwing for better UX
- Email verification: PKCE flow via /auth/confirm route handler with auto-login

**From Phase 2 (02-01):**
- Password validation: 8-char minimum for signup (Supabase default)
- Validation pattern: Schemas in src/lib/validations/ with exported types via z.infer

**From Phase 1 (01-01):**
- Browser client singleton pattern
- Package versions: @supabase/supabase-js@2.93.1, @supabase/ssr@0.8.0

### Pending Todos

None.

### Blockers/Concerns

**Phase 5 complete - Authentication milestone finished.**

All auth requirements (AUTH-01 through AUTH-09) are now implemented and polished:
- AUTH-01: Email/password signup ✓
- AUTH-02: Email verification ✓
- AUTH-03: Email verification link handling ✓
- AUTH-04: Email/password login ✓
- AUTH-05: Google OAuth ✓
- AUTH-06: Kakao OAuth ✓
- AUTH-07: Logout ✓
- AUTH-08: Session persistence ✓
- AUTH-09: Auth-aware UI ✓

## Session Continuity

Last session: 2026-01-29
Stopped at: Completed 05-06-PLAN.md
Resume file: None
Next action: Milestone completion and audit

---
*State initialized: 2026-01-27*
*Phase 1 complete: 2026-01-27*
*Phase 2 verified: 2026-01-28*
*Phase 3 verified: 2026-01-28*
*Phase 4 complete: 2026-01-28*
*Phase 5 complete: 2026-01-29 — All 6 plans finished*
