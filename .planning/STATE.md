# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Filtrage multi-critères avec notes 1-5 sur chaque dimension du café
**Current focus:** Phase 2 verified, ready for Phase 3

## Current Position

Phase: 3 of 5 (OAuth Integration)
Plan: 2 of 4 in phase (Complete)
Status: OAuth UI verified ✓
Last activity: 2026-01-28 — Phase 3 Wave 2 complete, OAuth UI integrated and verified

Progress: [██████░░░░] 60% (Phase 3, Plan 2 verified, ready for 03-03)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~4 min/plan
- Total execution time: ~0.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Auth Foundation | 1/1 | 7 min | 7 min |
| 2. Email/Password Auth | 4/4 | ~15 min | ~4 min |
| 3. OAuth Integration | 1/4 | ~4 min | ~4 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

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

**Known risks for Phase 3:**
- Kakao email scope requires Business account - may need fallback to user ID
- OAuth cookie sizes can exceed 4KB limit - monitor during Phase 3 testing

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 03-02 OAuth UI components, checkpoint verified
Resume file: None
Next action: Proceed to Phase 03 Plan 03 (OAuth provider configuration)

---
*State initialized: 2026-01-27*
*Phase 1 complete: 2026-01-27*
*Phase 2 verified: 2026-01-28*
*Phase 3 in progress: 2026-01-28 — Plan 1 complete*
*Next: Plan 03-02 (OAuth Buttons UI)*
