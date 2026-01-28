# Phase 3: OAuth Integration - Research

**Researched:** 2026-01-28
**Domain:** Supabase OAuth (Google + Kakao) with Next.js App Router
**Confidence:** HIGH

## Summary

OAuth integration with Supabase uses the PKCE (Proof Key for Code Exchange) flow, which requires a client-side trigger (`signInWithOAuth`) and a server-side callback route handler (`exchangeCodeForSession`). Supabase automatically handles account linking when OAuth emails match existing accounts, provided the email is verified. Google and Kakao OAuth are well-supported providers with specific configuration requirements.

The standard implementation pattern involves: (1) OAuth buttons on client pages that call `signInWithOAuth` with a `redirectTo` parameter, (2) A callback route handler at `/auth/callback` that exchanges the authorization code for a session, and (3) Proper error handling for user cancellation and provider failures. The existing auth infrastructure (browser client singleton, server client with cookie handling, Server Actions pattern) is fully compatible with OAuth.

Key considerations for this phase: Kakao email scope requires Biz App status (fallback to user ID needed), OAuth cookies can exceed 4KB (monitor session data), route prefetching can cause authentication issues (avoid Link components immediately after OAuth), and provider-specific branding guidelines must be followed.

**Primary recommendation:** Use Supabase's `signInWithOAuth` for client-side triggers with full-page redirects, implement callback route handler with `exchangeCodeForSession`, rely on automatic account linking (email-verified only), and add OAuth buttons below email/password form with divider.

## Standard Stack

The established libraries/tools for Supabase OAuth in Next.js:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | ^0.8.0 | Server-side auth with cookie management | Required for Next.js App Router, handles PKCE flow with cookies |
| @supabase/supabase-js | ^2.93.1 | Supabase client library | Provides `signInWithOAuth` and `exchangeCodeForSession` methods |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.563.0 | Icon components | For OAuth button icons (already in project) |
| (No additional libraries needed) | - | - | OAuth is built into Supabase Auth |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Full-page redirect | Popup flow (`skipBrowserRedirect: true`) | Popup avoids navigation but requires manual popup management, blocked by many browsers, worse UX |
| Supabase OAuth | NextAuth.js / Auth.js | More providers/flexibility but adds complexity, doesn't integrate with Supabase Auth database |
| Custom OAuth | Provider SDKs directly | Full control but requires implementing token storage, session management, security (don't hand-roll) |

**Installation:**
```bash
# No new dependencies needed - already installed
# @supabase/ssr@^0.8.0
# @supabase/supabase-js@^2.93.1
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── actions/
│   │   └── auth.ts              # Server Actions (add OAuth actions here)
│   └── auth/
│       ├── callback/
│       │   └── route.ts         # NEW: OAuth callback handler
│       └── confirm/
│           └── route.ts         # Existing: Email verification
├── components/
│   └── auth/
│       ├── login-form.tsx       # UPDATE: Add OAuth buttons
│       ├── signup-form.tsx      # UPDATE: Add OAuth buttons
│       └── oauth-buttons.tsx    # NEW: Reusable OAuth UI
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Existing: Browser client singleton
│   │   └── server.ts            # Existing: Server client factory
│   └── i18n/
│       └── translations.ts      # UPDATE: Add OAuth translations
```

### Pattern 1: Client-Side OAuth Trigger
**What:** Call `signInWithOAuth` from client component with provider and redirectTo
**When to use:** User clicks OAuth button
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/social-login
'use client'

import { createClient } from '@/lib/supabase/client'

async function handleOAuthLogin(provider: 'google' | 'kakao') {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    // Handle error (user won't be redirected)
    console.error('OAuth error:', error)
  }
  // Success: user is redirected to provider
}
```

### Pattern 2: Server-Side Callback Handler
**What:** Exchange authorization code for session in route handler
**When to use:** OAuth provider redirects back to app
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to a page WITHOUT route prefetching
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Error: redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=OAuth authentication failed`)
}
```

### Pattern 3: Automatic Account Linking
**What:** Supabase auto-links OAuth identities with same verified email
**When to use:** Always enabled by default - no code needed
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/auth-identity-linking
// NO CODE NEEDED - Automatic behavior:
//
// 1. User signs up with email/password (email@example.com)
// 2. User verifies email → email is now "verified"
// 3. User clicks "Continue with Google" using same email
// 4. Supabase auto-links Google identity to existing user
// 5. User can now login with either method
//
// Security: Only links to accounts with VERIFIED emails
// Unverified identities are removed if linking would occur
```

### Pattern 4: OAuth Button UI Component
**What:** Reusable OAuth button following brand guidelines
**When to use:** Login and signup pages
**Example:**
```typescript
// Source: User decisions from CONTEXT.md + brand guidelines
'use client'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

type OAuthProvider = 'google' | 'kakao'

export function OAuthButtons({ onLogin }: { onLogin: (provider: OAuthProvider) => Promise<void> }) {
  const { t } = useI18n()
  const [loading, setLoading] = useState<OAuthProvider | null>(null)

  const handleLogin = async (provider: OAuthProvider) => {
    setLoading(provider)
    try {
      await onLogin(provider)
    } catch (error) {
      // Handle error
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('auth.or')}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {/* Kakao first per user decision */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000]"
          onClick={() => handleLogin('kakao')}
          disabled={loading !== null}
        >
          {/* Kakao chat bubble icon + localized text */}
          {t('auth.oauth.kakao')}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleLogin('google')}
          disabled={loading !== null}
        >
          {/* Google multicolor logo + localized text */}
          {t('auth.oauth.google')}
        </Button>
      </div>
    </>
  )
}
```

### Pattern 5: Error Handling
**What:** Distinguish between user cancellation, provider errors, and configuration issues
**When to use:** In callback handler and OAuth trigger
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/debugging/error-codes
import { AuthError } from '@supabase/supabase-js'

// In callback route handler
if (error) {
  // Check error.code for specific handling
  let errorMessage = 'OAuth authentication failed'

  if (error.code === 'provider_disabled') {
    errorMessage = 'This login provider is temporarily unavailable'
  } else if (error.code === 'bad_oauth_state') {
    errorMessage = 'Login session expired. Please try again'
  } else if (error.code === 'flow_state_expired') {
    errorMessage = 'Login took too long. Please try again'
  }
  // User cancellation shows as no code in callback
  // (they're redirected back without code parameter)

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`)
}
```

### Anti-Patterns to Avoid
- **Using skipBrowserRedirect for "popup" flow:** Popups are blocked by browsers, break mobile UX, require complex window management. User decision: full-page redirect only.
- **Not handling missing email from Kakao:** Kakao Biz App requirement means email may be unavailable. Must fallback to Kakao user ID as identifier.
- **Using Link components immediately after OAuth:** Next.js route prefetching causes server requests before cookies are set, rendering unauthenticated content. Redirect to a page without prefetching first.
- **Storing provider tokens in localStorage:** Security risk (XSS). Supabase doesn't store provider tokens in database by design. If needed, send to trusted backend only.
- **Custom account linking logic:** Supabase handles this automatically for verified emails. Don't implement manual linking unless you need same user with different emails.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow implementation | Custom OAuth client with PKCE, state management, code verifier storage | Supabase `signInWithOAuth` + `exchangeCodeForSession` | OAuth has many security pitfalls (CSRF, code interception, token leakage). Supabase handles PKCE, state validation, token storage, refresh logic. |
| Account linking | Manual logic to check if email exists, merge user records, link identities | Supabase automatic identity linking | Security is critical - only link verified emails to prevent account takeover. Supabase enforces this automatically. |
| Session management | Custom cookie handling, token refresh, expiry checks | Supabase SSR with `@supabase/ssr` | Cookie chunking (>4KB), refresh token rotation, secure httpOnly cookies, PKCE flow state. Already implemented in project. |
| OAuth button icons | Custom SVG components for provider logos | Provider official assets + lucide-react for generic icons | Brand guidelines require official logos. Google/Kakao provide official assets. |
| Error handling | Generic error messages | Supabase error codes (`error.code`) + custom messages | Supabase provides specific error codes (provider_disabled, bad_oauth_state, etc.) for better UX. |

**Key insight:** OAuth security is complex (CSRF attacks, authorization code interception, token replay, pre-account takeover). Supabase Auth implements PKCE flow, automatic state validation, time-limited codes (5 min), single-use codes, and secure token storage. Building this yourself risks security vulnerabilities.

## Common Pitfalls

### Pitfall 1: Route Prefetching Breaks Authentication
**What goes wrong:** After OAuth redirect, user sees unauthenticated content or gets access denied errors
**Why it happens:** Next.js `<Link>` components prefetch routes on hover/viewport. Prefetch requests hit server before browser processes OAuth callback tokens, so cookies aren't set yet. Server renders unauthenticated state, which gets cached.
**How to avoid:**
1. Redirect OAuth callback to a dedicated "success" page without any Link components
2. Use `router.push()` or `window.location.href` for navigation immediately after OAuth
3. Or disable prefetching: `<Link href="..." prefetch={false}>`
**Warning signs:** Users report being logged out after OAuth login, or seeing login page briefly then redirecting to authenticated page

### Pitfall 2: OAuth Cookies Exceed 4KB Limit
**What goes wrong:** OAuth login fails silently or returns "cookie too large" error (431 Request Header Fields Too Large)
**Why it happens:** Supabase stores user metadata in session cookie. OAuth providers (especially Google) return large amounts of user data (profile, scopes, provider tokens). When combined with refresh token, total cookie size exceeds browser/server limits (4KB per cookie, ~16KB total headers).
**How to avoid:**
1. Monitor cookie sizes during testing (browser DevTools → Network → Response Headers)
2. Minimize `user_metadata` stored during signup (don't store large objects)
3. Use `@supabase/ssr` v0.8.0+ (implements automatic cookie chunking)
4. If issue persists, reduce OAuth scopes to minimize provider data
**Warning signs:** OAuth succeeds but user isn't logged in, 431 errors in Network tab, cookies named `sb-*-auth-token.0`, `.1`, `.2` (chunked)

### Pitfall 3: Kakao Email Scope Unavailable
**What goes wrong:** User logs in with Kakao but no email is stored, causing account linking to fail
**Why it happens:** Kakao's `account_email` scope requires "Biz App" registration. Standard apps don't have access to user emails. User decision: Use Kakao user ID as identifier when email not shared.
**How to avoid:**
1. Check `user.email` after Kakao OAuth - may be null
2. Fallback to `user.user_metadata.sub` (Kakao user ID) as unique identifier
3. Handle UI for "email not available" - don't require email for OAuth users
4. Consider upgrading to Kakao Biz App if email is critical
**Warning signs:** Kakao login succeeds but no email in user object, account linking fails for Kakao users

### Pitfall 4: Forgetting to Update Redirect URIs for Production
**What goes wrong:** OAuth works in development but fails in production with "redirect_uri_mismatch" error
**Why it happens:** OAuth providers (Google Cloud Console, Kakao Developers Portal) require pre-registering authorized redirect URIs. Developers register `http://localhost:3000/auth/callback` during development but forget to add production URL.
**How to avoid:**
1. Add production redirect URI to provider consoles BEFORE deploying: `https://yourdomain.com/auth/callback`
2. Also add to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
3. Test OAuth in production-like environment (Vercel preview deployments) before launch
**Warning signs:** Works locally but fails in production, "Invalid redirect URI" errors from OAuth provider

### Pitfall 5: Missing Error Display on Auth Pages
**What goes wrong:** OAuth fails but user sees no feedback, just stuck on login page
**Why it happens:** Callback route redirects to login with `?error=` query param, but login page doesn't check/display query params
**How to avoid:**
1. Add error param handling to login/signup pages: `const error = searchParams.get('error')`
2. Display inline error message (not toast - user decision from CONTEXT.md)
3. Use specific error messages per user decision: "Google login is temporarily unavailable" not generic "Login failed"
4. Handle user cancellation separately: "Login cancelled" message
**Warning signs:** Users report OAuth "doesn't work" but no error message visible

### Pitfall 6: OAuth State Expires During User Action
**What goes wrong:** User clicks OAuth button, provider page loads, user takes >5 minutes to complete (checking password manager, phone 2FA), returns to app with "flow_state_expired" error
**Why it happens:** PKCE authorization codes expire after 5 minutes for security. Code verifier is stored locally and tied to the auth flow. After expiration, code can't be exchanged for session.
**How to avoid:**
1. Detect `flow_state_expired` error code and show friendly message: "Login took too long. Please try again."
2. Provide "Try Again" button that re-initiates OAuth flow
3. Don't cache OAuth triggers - always create fresh flow
**Warning signs:** Users report OAuth fails "randomly", especially on mobile where they switch apps during OAuth flow

## Code Examples

Verified patterns from official sources:

### Complete OAuth Callback Route Handler
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
// File: src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle provider errors (user cancellation, provider unavailable)
  if (error) {
    // User cancelled OAuth flow
    if (error === 'access_denied') {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Login cancelled')}`
      )
    }
    // Other provider errors
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error_description || 'OAuth authentication failed')}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Success: Redirect to page without route prefetching
      // Avoid using searchParams.get('next') with user-provided URLs (open redirect vulnerability)
      const redirectPath = next.startsWith('/') ? next : '/'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }

    // Exchange failed: specific error messages
    let errorMessage = 'OAuth authentication failed'
    if (exchangeError.code === 'flow_state_expired') {
      errorMessage = 'Login took too long. Please try again.'
    } else if (exchangeError.code === 'bad_oauth_state') {
      errorMessage = 'Login session expired. Please try again.'
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMessage)}`
    )
  }

  // No code and no error: invalid callback
  return NextResponse.redirect(`${origin}/login`)
}
```

### OAuth Login Server Action
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
// File: src/app/actions/auth.ts (add to existing file)
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type OAuthProvider = 'google' | 'kakao'

export async function loginWithOAuth(
  provider: OAuthProvider,
  next?: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()

  // Build redirect URL with optional next parameter
  const redirectTo = new URL('/auth/callback', process.env.NEXT_PUBLIC_APP_URL!)
  if (next) {
    redirectTo.searchParams.set('next', next)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo.toString(),
      // For Google: request offline access for refresh token
      ...(provider === 'google' && {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }),
    },
  })

  if (error) {
    // Map Supabase errors to user-friendly messages
    if (error.code === 'provider_disabled') {
      return { error: `${provider === 'google' ? 'Google' : 'Kakao'} login is temporarily unavailable` }
    }
    return { error: 'Unable to start login. Please try again.' }
  }

  // Return URL for client-side redirect (Server Actions can't redirect to external URLs)
  return { url: data.url }
}
```

### OAuth Buttons Client Component
```typescript
// Source: User decisions + https://developers.google.com/identity/branding-guidelines
// File: src/components/auth/oauth-buttons.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { loginWithOAuth } from '@/app/actions/auth'

export function OAuthButtons() {
  const { t } = useI18n()
  const [loading, setLoading] = useState<'google' | 'kakao' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
    setLoading(provider)
    setError(null)

    try {
      const result = await loginWithOAuth(provider)

      if ('error' in result) {
        setError(result.error)
        setLoading(null)
      } else {
        // Redirect to OAuth provider
        window.location.href = result.url
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(null)
    }
  }

  return (
    <>
      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('auth.oauth.divider')}
          </span>
        </div>
      </div>

      {/* Error display (inline per user decision) */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-2">
          {error}
        </div>
      )}

      {/* OAuth buttons (Kakao first per user decision) */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] font-medium"
          onClick={() => handleOAuthLogin('kakao')}
          disabled={loading !== null}
        >
          {/* Add Kakao chat bubble icon here */}
          {loading === 'kakao' ? t('auth.oauth.loading') : t('auth.oauth.kakao')}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full font-medium"
          onClick={() => handleOAuthLogin('google')}
          disabled={loading !== null}
        >
          {/* Add Google multicolor logo here */}
          {loading === 'google' ? t('auth.oauth.loading') : t('auth.oauth.google')}
        </Button>
      </div>
    </>
  )
}
```

### Handling Missing Kakao Email
```typescript
// Source: https://developers.kakao.com/docs/latest/en/kakaologin/common
// In Server Action or callback handler
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  // Kakao may not provide email (requires Biz App)
  const email = user.email // May be null for Kakao
  const userId = user.id // Always available (Supabase UUID)
  const kakaoUserId = user.user_metadata.sub // Kakao user ID (if Kakao provider)

  // Use email if available, otherwise use Kakao user ID for display
  const displayIdentifier = email || `kakao_${kakaoUserId}`

  // Account linking will NOT work without email
  // Each Kakao login without email creates separate account
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth-helpers` package | `@supabase/ssr` package | 2024 Q2 | Breaking change - cookie handling API changed, automatic cookie chunking added |
| Implicit OAuth flow | PKCE flow (default) | 2023 | PKCE is more secure (prevents authorization code interception), required for server-side OAuth |
| Manual account linking | Automatic identity linking | 2024 Q3 | Simplified UX - users don't need to remember which provider they used. Requires verified emails. |
| localStorage for tokens | httpOnly cookies | 2023 | More secure (XSS protection), enables SSR, but requires server-side session management |
| Popup OAuth flow | Full-page redirect | Ongoing recommendation | Popups blocked by browsers, worse mobile UX, harder to implement. Redirects more reliable. |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr` - don't use old package
- `supabase.auth.session()`: Replaced by `supabase.auth.getSession()` - old method removed
- Implicit flow (`response_type=token`): Use PKCE flow - implicit flow less secure
- Manual cookie handling: Use `@supabase/ssr` cookie helpers - handles chunking, security flags

## Open Questions

Things that couldn't be fully resolved:

1. **Kakao Biz App Email Access**
   - What we know: `account_email` scope requires Biz App registration. Standard apps can't access email.
   - What's unclear: Exact requirements for Biz App approval (business registration, review process, timeline)
   - Recommendation: Implement fallback to Kakao user ID now. Investigate Biz App upgrade during implementation if email critical.

2. **OAuth Cookie Size in Production**
   - What we know: OAuth sessions can exceed 4KB, especially with Google. `@supabase/ssr` chunks cookies automatically.
   - What's unclear: Exact cookie size with Google + Kakao in production (depends on user metadata, provider tokens)
   - Recommendation: Monitor cookie sizes during Phase 3 testing (per known risk in STATE.md). Add logging in callback route to track cookie size.

3. **Provider Token Refresh for Extended API Access**
   - What we know: Supabase doesn't auto-refresh provider tokens (Google, Kakao API access tokens). Available in session as `provider_token`, `provider_refresh_token`.
   - What's unclear: Whether this app needs extended provider API access (future features like importing Google contacts, Kakao friends)
   - Recommendation: Not needed for Phase 3 (just authentication). Defer to later phase if extended provider API access required.

4. **Manual Identity Linking UI**
   - What we know: Supabase supports manual linking via `linkIdentity()` method when user is logged in. Requires `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED: true`.
   - What's unclear: Whether to enable manual linking (user clicks "Link Google" in profile) or rely only on automatic linking (same email)
   - Recommendation: CONTEXT.md doesn't mention manual linking UI. User decision says "auto-link accounts" - suggests automatic only. Defer manual linking UI to Phase 4 (profile management) per phase boundary.

## Sources

### Primary (HIGH confidence)
- Supabase Official Documentation:
  - [Social OAuth Login](https://supabase.com/docs/guides/auth/social-login) - OAuth overview
  - [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google) - Google-specific setup
  - [Login with Kakao](https://supabase.com/docs/guides/auth/social-login/auth-kakao) - Kakao-specific setup
  - [signInWithOAuth API Reference](https://supabase.com/docs/reference/javascript/auth-signinwithoauth) - Method signature
  - [exchangeCodeForSession API Reference](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession) - PKCE code exchange
  - [Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - SSR patterns
  - [PKCE Flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow) - PKCE implementation details
  - [Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking) - Automatic account linking
  - [Error Codes](https://supabase.com/docs/guides/auth/debugging/error-codes) - OAuth error handling
  - [Advanced Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) - Route prefetching issue

- Provider Brand Guidelines:
  - [Google Sign-In Branding Guidelines](https://developers.google.com/identity/branding-guidelines) - Official button styling
  - [Kakao Login Design Guide](https://developers.kakao.com/docs/latest/en/kakaologin/design-guide) - Official button styling
  - [Kakao Login Concepts](https://developers.kakao.com/docs/latest/en/kakaologin/common) - User identification

### Secondary (MEDIUM confidence)
- [Supabase Blog: Identity Linking, Hooks, and HaveIBeenPwned integration](https://supabase.com/blog/supabase-auth-identity-linking-hooks) - Identity linking announcement
- [Understanding Cookie Sizing and Chunking: A Supabase Dilemma](https://chuma.blog/understanding-cookie-sizing-and-chunking-a-supabase-dilemma) - Cookie size issue deep-dive
- [Next.js with Supabase Google Login: Step-by-Step Guide](https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501) - Implementation walkthrough
- [Next.js + Supabase Cookie-Based Auth Workflow: The Best Auth Solution (2025 Guide)](https://the-shubham.medium.com/next-js-supabase-cookie-based-auth-workflow-the-best-auth-solution-2025-guide-f6738b4673c1) - Best practices

### Tertiary (LOW confidence - flagged for validation)
- GitHub Discussions:
  - [Linking Multiple Authentication providers to a single user #5827](https://github.com/orgs/supabase/discussions/5827) - Account linking discussion
  - [Google Auth Popup? #4487](https://github.com/orgs/supabase/discussions/4487) - skipBrowserRedirect use case
  - [Auth token cookie chunk exceeds the size limit #707](https://github.com/supabase/auth-helpers/issues/707) - Cookie chunking issue
  - [Route prefetching issue](https://github.com/orgs/supabase/discussions/2842) - Discussed but not in official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase packages, verified versions in package.json
- Architecture: HIGH - Official docs + existing auth infrastructure, patterns verified in multiple sources
- Pitfalls: MEDIUM - Route prefetching and cookie size issues verified in official docs + GitHub issues, other pitfalls based on common OAuth mistakes and error codes
- Brand guidelines: HIGH - Official Google and Kakao developer documentation
- Kakao email limitation: HIGH - Official Kakao documentation explicitly states Biz App requirement
- Account linking: HIGH - Official Supabase documentation with security details

**Research date:** 2026-01-28
**Valid until:** 2026-02-27 (30 days - stable domain, Supabase Auth is mature)
