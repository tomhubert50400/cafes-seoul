# Roadmap: Cafes Seoul - Authentication

## Overview

This milestone adds authentication to the existing cafe discovery application, enabling users to create accounts and log in using email/password, Google OAuth, or Kakao OAuth. The authentication layer uses Supabase Auth with Next.js 16 App Router, building on the existing infrastructure (middleware, clients) already in place. Once complete, users can browse cafes publicly but must authenticate to contribute content in future milestones.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Auth Foundation** - Verify existing Supabase setup and update packages
- [ ] **Phase 2: Email/Password Authentication** - Signup, login, email verification, logout
- [ ] **Phase 3: OAuth Integration** - Google and Kakao social login
- [ ] **Phase 4: Protected Routes & Session Management** - Profile page, persistent sessions, auth UI state
- [ ] **Phase 5: Auth UI/UX Polish** - Validation, loading states, error handling, redirects

## Phase Details

### Phase 1: Auth Foundation
**Goal**: Verify and establish cookie-based session management infrastructure
**Depends on**: Nothing (first phase)
**Requirements**: Foundation for all auth requirements
**Success Criteria** (what must be TRUE):
  1. Middleware successfully refreshes expired tokens on cold starts
  2. Server and browser Supabase clients exist and are properly configured
  3. Package dependencies are up-to-date (@supabase/supabase-js@latest)
  4. Environment variables are validated and documented
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Audit auth infrastructure, fix browser client singleton, update packages

### Phase 2: Email/Password Authentication
**Goal**: Users can create accounts, verify email, and log in with password
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-07
**Success Criteria** (what must be TRUE):
  1. User can create account with email and password (AUTH-01)
  2. User receives verification email after signup (AUTH-02)
  3. User can verify email via link and activate account (AUTH-03)
  4. User can log in with email and password after verification (AUTH-04)
  5. User can log out from any page (AUTH-07)
  6. Login and signup pages render correctly with i18n support (Korean/English)
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 3: OAuth Integration
**Goal**: Users can log in with Google or Kakao accounts
**Depends on**: Phase 2
**Requirements**: AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can log in with Google OAuth (AUTH-05)
  2. User can log in with Kakao OAuth (AUTH-06)
  3. OAuth callback handler successfully exchanges codes for sessions
  4. Users with same email can link accounts across providers
  5. OAuth configuration is complete in Supabase Dashboard (providers enabled, callbacks whitelisted)
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 4: Protected Routes & Session Management
**Goal**: Users stay logged in across sessions and see auth-aware UI
**Depends on**: Phase 3
**Requirements**: AUTH-08, AUTH-09
**Success Criteria** (what must be TRUE):
  1. User session persists across browser refresh and tab close/reopen (AUTH-08)
  2. User sees appropriate UI state - logged in shows user menu, logged out shows login/signup buttons (AUTH-09)
  3. Middleware redirects unauthenticated users from protected routes (e.g., /profile)
  4. Profile page displays user information correctly
  5. Redirect flow works - users land on intended page after login
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 5: Auth UI/UX Polish
**Goal**: Production-ready auth experience with smooth interactions and error handling
**Depends on**: Phase 4
**Requirements**: None (polish existing functionality)
**Success Criteria** (what must be TRUE):
  1. Forms display client-side validation errors (email format, password strength, required fields)
  2. Auth actions show loading states (disabled buttons, spinners) during submission
  3. Server errors display as inline messages or toast notifications
  4. Password strength indicator guides users to create secure passwords
  5. All auth flows feel smooth and provide clear feedback at each step
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth Foundation | 0/1 | Planned | - |
| 2. Email/Password Authentication | 0/? | Not started | - |
| 3. OAuth Integration | 0/? | Not started | - |
| 4. Protected Routes & Session Management | 0/? | Not started | - |
| 5. Auth UI/UX Polish | 0/? | Not started | - |

---
*Roadmap created: 2026-01-27*
*Phase 1 planned: 2026-01-27*
*Next: `/gsd:execute-phase 1`*
