# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Filtrage multi-critères avec notes 1-5 sur chaque dimension du café
**Current focus:** Phase 3 verified, ready for Phase 4

## Current Position

Phase: 4 of 5 (Protected Routes & Session Management)
Plan: 2 of 4 in phase
Status: In progress
Last activity: 2026-01-28 — Completed 04-02-PLAN.md

Progress: [██████████] 80% (8/10 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: ~4 min/plan
- Total execution time: ~0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Auth Foundation | 1/1 | 7 min | 7 min |
| 2. Email/Password Auth | 4/4 | ~15 min | ~4 min |
| 3. OAuth Integration | 2/2 | ~11 min | ~5 min |
| 4. Protected Routes | 2/4 | ~15 min | ~8 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

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

**Known risks for Phase 3:**
- Kakao email scope requires Business account - may need fallback to user ID
- OAuth cookie sizes can exceed 4KB limit - monitor during Phase 3 testing

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 04-02-PLAN.md
Resume file: None
Next action: Execute 04-03-PLAN.md (Profile page with tab navigation)

---
*State initialized: 2026-01-27*
*Phase 1 complete: 2026-01-27*
*Phase 2 verified: 2026-01-28*
*Phase 3 verified: 2026-01-28*
*Phase 4 in progress: 2/4 plans complete*
*Next: Execute 04-03-PLAN.md*
