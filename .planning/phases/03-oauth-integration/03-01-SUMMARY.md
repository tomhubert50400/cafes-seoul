---
phase: 03-oauth-integration
plan: 01
subsystem: authentication
tags:
  - oauth
  - supabase
  - i18n
  - server-actions
  - route-handler
tech-stack:
  added:
    - None (using existing Supabase Auth)
  patterns:
    - OAuth callback handler with PKCE code exchange
    - Server action returning external URL for client redirect
    - Open redirect prevention via path validation
    - i18n key namespacing (auth.oauth.*)
dependencies:
  requires:
    - phase-01: Supabase client infrastructure
    - phase-02: Email/password authentication foundation
  provides:
    - OAuth callback route handler
    - OAuth login server action
    - OAuth i18n translations
  affects:
    - phase-03-plan-02: OAuth UI components will use these translations and actions
    - phase-03-plan-03: OAuth provider configuration tests
---

# Phase 3 Plan 1: OAuth Infrastructure Summary

## One-Liner

OAuth backend infrastructure with PKCE callback handler, server-side login action, and full i18n support for 5 languages.

## What Was Built

### 1. OAuth Callback Route Handler (`src/app/auth/callback/route.ts`)

A Next.js route handler that processes OAuth provider callbacks:

- **Handles provider errors**: Maps `access_denied` to "Login cancelled" message
- **Exchanges authorization code**: Uses `supabase.auth.exchangeCodeForSession(code)`
- **Error code mapping**: 
  - `flow_state_expired` → "Login took too long. Please try again."
  - `bad_oauth_state` → "Login session expired. Please try again."
- **Security**: Validates `next` parameter to prevent open redirect attacks
- **Redirects**: Returns user to appropriate page based on outcome

### 2. OAuth Login Server Action (`src/app/actions/auth.ts`)

Added `loginWithOAuth` function to existing auth actions:

```typescript
export type OAuthProvider = 'google' | 'kakao'
export async function loginWithOAuth(
  provider: OAuthProvider, 
  next?: string
): Promise<{ url: string } | { error: string }>
```

- Returns provider OAuth URL for client-side redirect
- Builds `redirectTo` URL with optional `next` param
- Maps `provider_disabled` errors to provider-specific messages
- Server Actions limitation: Cannot redirect to external URLs, so URL is returned

### 3. OAuth i18n Translations (`src/lib/i18n/translations.ts`)

Added 9 new translation keys to all 5 languages:

**Keys added:**
- `auth.oauth.divider` - "or" separator text
- `auth.oauth.kakao` / `auth.oauth.google` - Button labels
- `auth.oauth.loading` - Loading state
- `auth.oauth.cancelled` - User cancellation message
- `auth.oauth.unavailable.google` / `auth.oauth.unavailable.kakao` - Provider unavailable
- `auth.oauth.error.expired` - Session timeout error
- `auth.oauth.error.default` - Generic OAuth error

**Languages:** English, Korean (한국어), French (Français), Chinese (中文), Vietnamese (Tiếng Việt)

## Decisions Made

1. **URL return pattern**: Server Actions cannot redirect to external OAuth URLs, so `loginWithOAuth` returns the provider URL for the client to handle via `window.location.href`

2. **Open redirect prevention**: Callback handler validates `next` param starts with `/` to prevent malicious redirects

3. **Error code mapping**: Specific Supabase error codes mapped to user-friendly messages in both callback handler and server action

4. **Provider type safety**: `OAuthProvider` type limited to `'google' | 'kakao'` for compile-time safety

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `src/app/auth/callback/route.ts` | Created | OAuth callback handler with PKCE exchange |
| `src/app/actions/auth.ts` | Modified | Added `loginWithOAuth` action and types |
| `src/lib/i18n/translations.ts` | Modified | Added 45 i18n keys (9 × 5 languages) |

## Verification

- ✅ TypeScript compiles without errors (`npx tsc --noEmit`)
- ✅ Build succeeds (`npm run build`)
- ✅ All 5 languages have complete OAuth translation keys
- ✅ Callback route exported at `/auth/callback`
- ✅ `loginWithOAuth` exported with proper return types

## Deviations from Plan

None - plan executed exactly as written.

## Test Commands

```bash
# TypeScript check
npx tsc --noEmit

# Build verification
npm run build

# Verify exports exist
grep -n "loginWithOAuth" src/app/actions/auth.ts
grep -n "export async function GET" src/app/auth/callback/route.ts
grep -n "auth.oauth" src/lib/i18n/translations.ts | head -20
```

## Next Phase Readiness

This plan establishes the backend OAuth infrastructure. Ready for:

- **Plan 02**: OAuth UI components (buttons, divider, loading states)
- **Plan 03**: OAuth provider configuration in Supabase dashboard
- **Plan 04**: OAuth error handling and user feedback UI

## Commits

- `d08b4aa`: feat(03-01): create OAuth callback route handler
- `a9aa3ba`: feat(03-01): add OAuth login server action
- `8d11aa0`: feat(03-01): add OAuth translations for all 5 languages
