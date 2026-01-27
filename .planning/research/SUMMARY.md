# Project Research Summary

**Project:** Cafes Seoul - Korean Cafe Discovery App
**Domain:** Authentication (Supabase Auth + Next.js 16 App Router + Korean OAuth)
**Researched:** 2026-01-27
**Confidence:** HIGH

## Executive Summary

Adding authentication to a Next.js 16 App Router + Supabase application requires cookie-based session management using `@supabase/ssr` (v0.8.0) with middleware-driven token refresh. The standard approach leverages Server Components for data fetching, Server Actions for auth mutations, and Route Handlers for OAuth callbacks. For Korean market coverage, Kakao OAuth is natively supported by Supabase, but **Naver OAuth is NOT natively supported** — requiring either a custom implementation or deferring to v2.

The recommended v1 scope is Email/Password + Google + Kakao authentication, which covers 70%+ of users without the complexity of Naver workarounds. Critical risks include using `getSession()` instead of `getUser()` in server code (authentication bypass vulnerability), cookie size limits with PKCE flows, and Kakao's email scope restriction to business accounts only.

Architecture follows Next.js 16 patterns: middleware refreshes sessions on every request, Server Components fetch protected data using `getUser()`, and Client Components handle interactive auth forms that submit to Server Actions. Build order must respect dependencies: foundation (middleware + clients) → email auth → OAuth → protected routes → UX polish.

## Key Findings

### Recommended Stack

**Current packages are nearly up-to-date.** The project already has `@supabase/ssr@0.8.0` (latest) and `@supabase/supabase-js@2.91.1` (minor update available to 2.93.1). No additional packages are needed for Email/Password + Google + Kakao authentication.

**Core technologies:**
- `@supabase/ssr@0.8.0`: Cookie-based SSR auth for Next.js — consolidates deprecated auth-helpers, provides XSS protection via HTTP-only cookies
- `@supabase/supabase-js@2.93.1`: Auth client with PKCE OAuth flow — handles token refresh, session management, JWT validation
- Next.js 16 App Router: Server Components + Server Actions — secure server-side auth checks, zero client JS for data fetching

**Update required:**
```bash
npm install @supabase/supabase-js@latest
```

### Expected Features

**Must have (table stakes):**
- Multi-provider OAuth (Kakao, Google) — Korean users expect Kakao login as standard
- Email/Password authentication — fallback for users without social accounts
- Session management with refresh tokens — 15-min access tokens, 7-day refresh tokens with rotation
- Account linking — users can log in with multiple providers using same email
- Protected routes — browse public, contribute with account
- Logout — clear session and invalidate tokens

**Defer (v2+):**
- Naver OAuth — NOT natively supported by Supabase, requires workaround or custom implementation
- Magic link authentication — passwordless, but adds complexity without enough v1 value
- MFA (TOTP) — explicitly out of scope per project requirements
- Password reset — deferred per project scope, OAuth covers most users
- Account deletion/data portability — required for mobile app store compliance (Phase 2)

### Architecture Approach

Supabase Auth with Next.js 16 uses **cookie-based session management** where middleware handles automatic token refresh on every request, Server Components read cookies for data fetching, and Server Actions handle auth mutations (login, signup, logout). The architecture maintains Server Components as default, using Client Components only for interactive auth UI (forms, buttons).

**Major components:**
1. **Middleware Layer** (`src/middleware.ts` + `src/lib/supabase/middleware.ts`) — automatic session refresh via `getUser()`, protected route redirects, runs on every request excluding static assets
2. **Client Factories** (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`) — browser client for Client Components, server client for Server Components/Actions with read-only cookie access
3. **Server Actions** (`src/app/(auth)/login/actions.ts`) — handle auth mutations (login, signup, signout) with form data, call Supabase Auth API, revalidate cache, redirect
4. **OAuth Callback Handler** (`src/app/auth/callback/route.ts`) — exchange authorization code for session, handle PKCE flow, redirect to app with session cookies
5. **Protected Routes** — middleware checks auth state and redirects unauthenticated users to `/login?redirect=/protected-route`

### Critical Pitfalls

1. **Using `getSession()` instead of `getUser()` in server code** — CRITICAL: `getSession()` does NOT validate JWT signature server-side, enabling authentication bypass. Always use `getUser()` in Server Components, Route Handlers, and middleware.

2. **Kakao `account_email` scope restriction** — CRITICAL: Email scope only available to Kakao Business accounts, NOT individual developer accounts. Test with non-business accounts, consider using Kakao user ID as primary identifier, provide alternative auth methods.

3. **Cookie size limits with PKCE flows** — HIGH: OAuth cookies can exceed 4096-character browser limit, causing silent failures. Monitor cookie sizes, test all OAuth providers before launch.

4. **Wrong callback route for email verification** — MEDIUM: Email confirmations should use `/auth/confirm`, NOT `/auth/callback` (which is for OAuth). Create separate route handlers for each flow.

5. **Environment-specific OAuth redirects** — HIGH: Hardcoded redirect URLs break in production/preview. Use dynamic URL helper based on `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_VERCEL_URL`, or localhost. Whitelist all environments in Supabase Dashboard.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Auth Foundation
**Rationale:** Middleware and client factories must be established before any auth flows. Existing setup is 90% complete — just needs verification and minor updates.
**Delivers:** Cookie-based session management, automatic token refresh, protected route infrastructure
**Addresses:** Session management (table stakes), protected routes (table stakes)
**Avoids:** Pitfall #1 (getUser vs getSession), Pitfall #3 (middleware performance)
**Estimated effort:** 1-2 hours (verify existing setup, update package, test token refresh)

### Phase 2: Email/Password Authentication
**Rationale:** Simplest auth flow, no external dependencies, validates core infrastructure before adding OAuth complexity.
**Delivers:** Login/signup pages, email verification, Server Actions for auth mutations
**Addresses:** Email/Password auth (table stakes), logout (table stakes)
**Avoids:** Pitfall #4 (email callback route), Pitfall #8 (redirect URL allowlist)
**Estimated effort:** 4-6 hours (UI components, Server Actions, email templates, testing)

### Phase 3: OAuth Integration (Google + Kakao)
**Rationale:** Google and Kakao are natively supported by Supabase. Kakao is essential for Korean market, Google covers international users. Skip Naver in v1 due to lack of native support.
**Delivers:** Social login buttons, OAuth callback handler, account linking, Supabase Dashboard configuration
**Addresses:** Multi-provider OAuth (table stakes), account linking (table stakes)
**Avoids:** Pitfall #2 (cookie sizes), Pitfall #5 (Kakao API keys), Pitfall #11 (environment redirects)
**Uses:** `@supabase/ssr` OAuth methods, PKCE flow, Supabase Auth providers
**Estimated effort:** 6-8 hours (OAuth setup, callback handler, provider config, testing all flows)

### Phase 4: Protected Routes & User Profile
**Rationale:** With auth working, implement route protection and basic profile management. This validates the full auth cycle (signup → login → protected content → logout).
**Delivers:** Updated middleware with protected paths, profile page, user menu, logout button
**Addresses:** Protected routes (table stakes), profile management (v1 optional)
**Avoids:** Pitfall #10 (hydration errors), Pitfall #12 (signout cookie clearing)
**Implements:** Server Component protection pattern, `getUser()` validation, middleware redirects
**Estimated effort:** 3-4 hours (middleware updates, profile page, user menu component)

### Phase 5: Auth UI/UX Polish
**Rationale:** Final pass for production-ready UX — validation, loading states, error handling, redirect preservation.
**Delivers:** Form validation, loading spinners, inline errors, toast notifications, redirect flow
**Addresses:** Production UX requirements (not table stakes, but expected)
**Estimated effort:** 4-5 hours (validation logic, pending UI, error display, redirect handling)

### Phase Ordering Rationale

- **Foundation first** because middleware/client setup is required by all subsequent phases. Existing code reduces effort from 4-6 hours to 1-2 hours.
- **Email/Password before OAuth** because it's simpler, has no external dependencies, and validates core infrastructure. If this fails, OAuth will also fail.
- **Google + Kakao together** because both are natively supported and follow identical patterns. Implementing one makes the second trivial.
- **Skip Naver in v1** because it's NOT natively supported by Supabase, requires custom implementation (6-10 extra hours), and Kakao already covers Korean users. Defer to v2 when Supabase adds custom OIDC support or if user demand justifies complexity.
- **Protected routes after auth** because you need working login/signup flows to test route protection.
- **Polish last** because it depends on all auth flows working correctly.

### Research Flags

**Phases with standard patterns (skip deeper research):**
- **Phase 1 (Foundation):** Well-documented Supabase + Next.js patterns, existing codebase already 90% complete
- **Phase 2 (Email/Password):** Standard Supabase Auth features, official docs cover all edge cases
- **Phase 4 (Protected Routes):** Next.js middleware patterns, Supabase RLS documented extensively
- **Phase 5 (Polish):** Standard UX patterns, no domain-specific research needed

**Phases needing caution during execution:**
- **Phase 3 (OAuth):** Kakao email scope restriction requires testing with non-business accounts. Research completed, but validate during implementation. Cookie size limits need monitoring during testing.

**No phases require `/gsd:research-phase`** — all patterns are well-documented and research is complete.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Supabase docs + Context7, packages verified on npm, versions current |
| Features | HIGH | Supabase Auth capabilities documented, Korean OAuth providers researched via Kakao Developers docs + community discussions |
| Architecture | HIGH | Next.js 16 App Router patterns established, Supabase SSR architecture documented, existing codebase follows best practices |
| Pitfalls | HIGH | GitHub issues + Supabase discussions provide concrete examples, warnings signs verified across multiple sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Naver OAuth support status:** Confirmed NOT supported as of 2026-01-27. Decision: defer to v2. Validate again if Supabase announces custom OIDC support (rumored for 2026).
- **Kakao email scope for non-business accounts:** Research indicates email scope requires Biz App registration. Validation needed: test with personal Kakao account during Phase 3 implementation. Fallback: use Kakao user ID as identifier instead of email.
- **Cookie size limits in production:** Research shows Google OAuth cookies can exceed 4096 characters. Monitoring needed: inspect Set-Cookie headers during Phase 3 testing with DevTools.

## Sources

### Primary (HIGH confidence)
- [Supabase Auth Server-Side Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — Next.js 16 integration patterns
- [Supabase @supabase/ssr package docs](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers) — SSR client usage, migration guide
- [Kakao Developers OAuth docs](https://developers.kakao.com/docs/latest/en/kakaologin/rest-api) — Kakao OAuth configuration, scope requirements
- Supabase npm packages: `@supabase/ssr@0.8.0`, `@supabase/supabase-js@2.93.1` — verified versions

### Secondary (MEDIUM confidence)
- [Supabase GitHub discussions: Naver provider support](https://github.com/orgs/supabase/discussions/35631) — confirmed NOT supported, custom implementation required
- [Supabase issues: Kakao email scope](https://github.com/supabase/supabase/issues/36878) — Business account requirement for email scope
- OAuth 2.1/PKCE standards articles — security best practices, token lifetimes, refresh token rotation

### Tertiary (LOW confidence)
- Community articles on session management — token lifetime recommendations (15-30 min access, 7-14 day refresh)
- Medium/Dev.to tutorials — validated against official docs before inclusion

---
*Research completed: 2026-01-27*
*Ready for roadmap: yes*
