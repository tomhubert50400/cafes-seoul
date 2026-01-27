# Authentication Stack Research

**Research Date:** 2026-01-27
**Target:** Supabase Auth with Next.js 16 App Router + OAuth (Google, Kakao, Naver)
**Milestone:** Add authentication to existing Next.js + Supabase app

---

## Executive Summary

The standard 2025/2026 stack for Supabase Auth with Next.js App Router is **@supabase/ssr** (currently v0.8.0) combined with **@supabase/supabase-js** (currently v2.93.1). Your existing installation is nearly current but should be updated. The stack supports email authentication and OAuth providers including Google and Kakao natively. **Naver is NOT natively supported** by Supabase and requires a workaround solution.

**Confidence Levels:**
- Email + Google + Kakao: **HIGH** (native support, production-ready)
- Naver OAuth: **MEDIUM** (requires custom implementation via NextAuth.js or manual OAuth flow)

---

## Current Package Status

### Installed Packages
- **@supabase/ssr**: `0.8.0` (CURRENT - latest as of Nov 2024)
- **@supabase/supabase-js**: `2.91.1` (UPDATE AVAILABLE - latest is 2.93.1)
- **Next.js**: `16.1.4` (CURRENT)

### Required Updates
```bash
npm install @supabase/supabase-js@latest
```

### No Additional Packages Needed
The existing @supabase/ssr + @supabase/supabase-js combination handles:
- Email authentication with verification
- OAuth providers (Google, Kakao)
- Cookie-based session management
- Server Components + Server Actions
- Middleware session refresh

**Rationale:** @supabase/ssr is the official successor to deprecated auth-helpers packages and consolidates all SSR auth functionality. It's framework-agnostic but optimized for Next.js App Router patterns.

---

## Email Authentication Stack

### Configuration Required

**1. Supabase Dashboard Settings**
- **Location:** Dashboard > Authentication > Providers > Email
- **Enable email provider:** ON
- **Confirm email:** ON (recommended for production)
- **Secure email change:** ON (generates confirmation links for email changes)

**2. Email Templates Configuration**
- **Location:** Dashboard > Authentication > Email Templates
- **Template to modify:** "Confirm signup"
- **Change required:** Update confirmation URL from:
  ```
  {{ .ConfirmationURL }}
  ```
  To:
  ```
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
  ```

**Rationale:** The updated URL format works with Next.js App Router route handlers for secure server-side token exchange, avoiding client-side exposure of auth tokens.

**3. Redirect URLs Configuration**
- **Location:** Dashboard > Authentication > URL Configuration
- **Site URL:** `https://yourdomain.com` (production)
- **Additional Redirect URLs:** Add development URLs like `http://localhost:3000`

### Implementation Requirements

**Route Handler:** `src/app/auth/confirm/route.ts`
```typescript
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = '/account'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  redirectTo.pathname = '/error'
  return NextResponse.redirect(redirectTo)
}
```

**Confidence:** HIGH - This is the official Supabase pattern as of 2025/2026.

---

## Google OAuth Stack

### Native Support Status
**Supported:** YES (Native Supabase provider)
**Confidence:** HIGH

### Google Cloud Console Setup

**1. Create OAuth 2.0 Client**
- **Console:** [Google Cloud Console](https://console.cloud.google.com/)
- **Location:** APIs & Services > Credentials
- **Action:** Create OAuth client ID
- **Application type:** Web application

**2. Configure Authorized Origins**
- **Development:** `http://localhost:3000`
- **Production:** `https://yourdomain.com`

**3. Configure Redirect URIs**
- **Format:** `https://[your-project-ref].supabase.co/auth/v1/callback`
- **Example:** `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
- **Local development:** `http://localhost:54321/auth/v1/callback` (for local Supabase)

**4. Obtain Credentials**
- Save **Client ID**
- Save **Client Secret**

### Supabase Dashboard Configuration

**Location:** Dashboard > Authentication > Providers > Google

**Settings:**
- **Enable Google provider:** ON
- **Client ID:** [from Google Cloud Console]
- **Client Secret:** [from Google Cloud Console]
- **Skip nonce check:** OFF (recommended for security)
- **Email optional:** OFF (recommended - ensures email is always provided)

**Rationale:** Google OAuth is a first-class citizen in Supabase with native PKCE flow support, automatic token refresh, and secure cookie management. Skip nonce check is disabled for better security compliance with OIDC standards.

**Confidence:** HIGH

---

## Kakao OAuth Stack

### Native Support Status
**Supported:** YES (Native Supabase provider)
**Confidence:** HIGH

### Kakao Developers Console Setup

**1. Create Application**
- **Console:** [Kakao Developers](https://developers.kakao.com/)
- **Action:** Register new application
- **Note:** For email consent, app must be registered as "Biz App"

**2. Enable Kakao Login**
- **Location:** Product Settings > Kakao Login > General
- **Setting:** State = "ON"

**3. Activate Client Secret**
- **Location:** App Settings > App > Platform Key
- **Action:** Click on REST API key
- **Enable:** Kakao Login Client Secret
- **Note:** Copy the Client Secret code (recommended to rotate every 2 years)

**4. Configure Redirect URI**
- **Location:** App Settings > App > Platform Key > REST API key details
- **Field:** Kakao Login Redirect URI
- **Format:** `https://[your-project-ref].supabase.co/auth/v1/callback`

**5. Obtain Credentials**
- **Client ID (client_id):** REST API key (found in Platform Key section)
- **Client Secret (client_secret):** Kakao Login Client Secret code

### Supabase Dashboard Configuration

**Location:** Dashboard > Authentication > Providers > Kakao

**Settings:**
- **Enable Kakao provider:** ON
- **Client ID:** [REST API key from Kakao]
- **Client Secret:** [Kakao Login Client Secret code]
- **Email optional:** OFF (recommended - but note: email consent only available for Biz Apps)

**Important Notes:**
- Kakao recently redesigned their developer portal UI (2025)
- The "account_email" consent item requires "Biz App" registration
- Client secret is now enabled by default for enhanced security
- Supabase documentation was updated in early 2025 to match new Kakao UI

**Rationale:** Kakao is natively supported by Supabase as one of 20+ OAuth providers. The setup follows standard OAuth 2.0 patterns with PKCE support.

**Confidence:** HIGH

---

## Naver OAuth Stack

### Native Support Status
**Supported:** NO (Not a native Supabase provider)
**Confidence:** MEDIUM (workaround required)

### Problem Statement

Supabase does not currently support Naver as a native OAuth provider, despite Naver being one of the largest social login providers in Korea (comparable market share to Kakao). This is a known gap in Supabase's provider ecosystem.

### Solution Options

#### Option 1: NextAuth.js Integration (RECOMMENDED)
**Confidence:** MEDIUM-HIGH

**Approach:** Use NextAuth.js (Auth.js v5) alongside Supabase for Naver OAuth only.

**Packages Required:**
```bash
npm install next-auth@beta @auth/core
```

**Implementation:**
- Configure NextAuth.js with custom Naver provider
- Use NextAuth.js for Naver OAuth flow
- On successful Naver auth, create or link Supabase user session
- Maintain Supabase as primary auth system for email/Google/Kakao

**Known Issues:**
- Naver's OAuth implementation violates OAuth 2.0 specs (returns `expires_in` as string instead of number)
- May cause `OperationProcessingError` in NextAuth.js v5
- Requires custom error handling

**Naver Provider Configuration:**
```typescript
{
  id: "naver",
  name: "Naver",
  type: "oauth",
  authorization: "https://nid.naver.com/oauth2.0/authorize",
  token: "https://nid.naver.com/oauth2.0/token",
  userinfo: "https://openapi.naver.com/v1/nid/me",
  clientId: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  profile(profile) {
    return {
      id: profile.response.id,
      name: profile.response.name,
      email: profile.response.email,
      image: profile.response.profile_image,
    }
  }
}
```

**Rationale:** NextAuth.js has community support for Naver and handles the OAuth spec violations. Dual auth system adds complexity but maintains consistency with other providers.

#### Option 2: Manual OAuth 2.0 Implementation
**Confidence:** MEDIUM

**Approach:** Implement Naver OAuth 2.0 flow manually with custom route handlers.

**Endpoints:**
- Authorization: `https://nid.naver.com/oauth2.0/authorize`
- Token: `https://nid.naver.com/oauth2.0/token`
- User info: `https://openapi.naver.com/v1/nid/me`

**Workflow:**
1. Create `/auth/naver/login` route to redirect to Naver authorization
2. Create `/auth/naver/callback` route to handle OAuth callback
3. Exchange code for access token
4. Fetch user info from Naver API
5. Create or update Supabase user using `supabase.auth.admin.createUser()`
6. Sign in user with `supabase.auth.setSession()`

**Cons:**
- More code to maintain
- Manual session management
- Need to handle token refresh logic
- Security considerations for storing credentials

**Rationale:** Provides full control but increases maintenance burden and security risks.

#### Option 3: Wait for Supabase Custom OIDC Support
**Confidence:** LOW (timing uncertain)

**Status:** Supabase has discussed adding support for custom OIDC providers (expected early 2026 per community discussions), which would allow configuring additional OAuth providers beyond the fixed dashboard list.

**Recommendation:** DO NOT wait for this feature. Timeline is uncertain and feature may not materialize.

### Recommended Approach

**For MVP:** Skip Naver OAuth initially, launch with Email + Google + Kakao only.

**For Full Implementation:** Use NextAuth.js (Option 1) with custom Naver provider and create bridge logic to sync with Supabase sessions.

**Rationale:** Naver is important for Korean market but adds significant complexity. Email + Google + Kakao covers majority of use cases. Add Naver in a future phase if user demand justifies the engineering investment.

---

## What NOT to Use

### ❌ @supabase/auth-helpers-* packages
**Status:** DEPRECATED (as of 2024)
**Replacement:** @supabase/ssr

**Rationale:** All framework-specific auth-helpers packages (auth-helpers-nextjs, auth-helpers-react, etc.) have been consolidated into @supabase/ssr. Using deprecated packages means missing security updates and bug fixes.

### ❌ localStorage for session storage
**Status:** ANTI-PATTERN

**Rationale:** Vulnerable to XSS attacks. Supabase's @supabase/ssr uses HTTP-only cookies for session storage, which cannot be accessed by client-side JavaScript and provides defense-in-depth security.

### ❌ Client-side only authentication checks
**Status:** SECURITY VULNERABILITY

**Rationale:** CVE-2025-29927 demonstrated that relying solely on middleware for authentication is insufficient. Always implement verification at data access points using Row-Level Security (RLS) policies in Supabase database.

### ❌ Custom JWT parsing/validation
**Status:** UNNECESSARY

**Rationale:** @supabase/ssr handles all JWT operations including validation, refresh, and parsing. Manual JWT handling increases risk of security vulnerabilities.

### ❌ Mixing Supabase Auth with Firebase Auth or AWS Cognito
**Status:** ARCHITECTURAL MISMATCH

**Rationale:** Supabase Auth integrates deeply with Supabase's Row-Level Security (RLS) system. Using a different auth provider breaks this integration and requires manual user ID mapping in RLS policies.

---

## Implementation Architecture

### File Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Email + OAuth login UI
│   │   ├── signup/
│   │   │   └── page.tsx          # Email signup UI
│   │   └── error/
│   │       └── page.tsx          # Auth error page
│   └── auth/
│       └── confirm/
│           └── route.ts          # Email verification handler
├── lib/
│   └── supabase/
│       ├── client.ts             # Browser client (existing)
│       ├── server.ts             # Server client (existing)
│       └── middleware.ts         # Session refresh (existing)
└── middleware.ts                 # App-level middleware (imports from lib)
```

### Authentication Flow Patterns

**Email Signup Flow:**
1. User submits email/password via form
2. Server Action calls `supabase.auth.signUp()`
3. Supabase sends verification email
4. User clicks link → `/auth/confirm?token_hash=...&type=email`
5. Route handler validates token and creates session
6. Redirect to `/account` or dashboard

**OAuth Flow (Google/Kakao):**
1. User clicks "Login with Google" button
2. Client-side calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. User redirected to OAuth provider
4. OAuth provider redirects to Supabase callback URL
5. Supabase creates session and redirects to app
6. Middleware refreshes session on next request

**Session Management:**
- Middleware calls `supabase.auth.getUser()` on every request
- Automatic token refresh handled by @supabase/ssr
- HTTP-only cookies prevent XSS attacks
- Protected routes checked in middleware

### Security Best Practices

**1. Row-Level Security (RLS)**
Enable RLS on all tables that store user data:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);
```

**Rationale:** Database-level authorization that applies across REST API, Edge Functions, and Realtime subscriptions. Cannot be bypassed by client-side code.

**2. Middleware Session Validation**
Existing middleware at `src/lib/supabase/middleware.ts` already implements:
- Session refresh via `supabase.auth.getUser()`
- Protected route redirection
- Auth page redirection for logged-in users

**3. Server-Side Verification**
Always use server-side Supabase client for data access:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}
```

**4. PKCE Flow**
Supabase automatically uses PKCE (Proof Key for Code Exchange) for OAuth flows when using @supabase/ssr, providing additional security for authorization code exchange.

---

## Environment Variables Required

### Existing Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### No Additional Variables for Email/Google/Kakao
OAuth credentials are configured in Supabase Dashboard, not environment variables.

### Optional: Naver OAuth (if implementing Option 1)
```bash
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## Migration Path from Current State

### Current State Analysis
- ✅ @supabase/ssr already installed (v0.8.0)
- ✅ @supabase/supabase-js installed (v2.91.1, minor update available)
- ✅ Middleware configured with session refresh
- ✅ Client/server utilities set up
- ✅ Protected routes defined
- ⚠️ Auth route group exists but empty

### Required Changes

**1. Update Packages (Low Risk)**
```bash
npm install @supabase/supabase-js@latest
```

**2. Configure Supabase Dashboard (Zero Code)**
- Enable email provider with confirmation
- Configure email template for `/auth/confirm` redirect
- Add Google OAuth credentials
- Add Kakao OAuth credentials

**3. Implement Auth UI (New Code)**
- Create login page with email + OAuth buttons
- Create signup page with email form
- Create error page for auth failures

**4. Add Email Confirmation Handler (New Code)**
- Create `/auth/confirm/route.ts` for token verification

**5. Database Schema (New Code)**
- Create `profiles` table with RLS policies
- Link to `auth.users` via foreign key

**No Breaking Changes:** Existing Supabase setup remains unchanged.

---

## Quality Gate Checklist

- [x] **Versions are current**
  - @supabase/ssr v0.8.0 is latest (verified via npm, released Nov 2024)
  - @supabase/supabase-js v2.93.1 is latest (verified via npm, released Jan 2026)
  - Recommendations based on official Supabase docs and Context7 documentation

- [x] **Rationale explains WHY, not just WHAT**
  - Cookie-based auth reasoning (XSS prevention)
  - @supabase/ssr consolidation reasoning (deprecated helpers)
  - RLS importance reasoning (defense-in-depth)
  - Naver workaround reasoning (native support gap)

- [x] **Confidence levels assigned**
  - Email + Google + Kakao: HIGH (native support, production-ready)
  - Naver via NextAuth.js: MEDIUM-HIGH (proven but complex)
  - Naver manual implementation: MEDIUM (custom code risks)
  - Naver custom OIDC: LOW (uncertain timeline)

---

## Sources

### Official Documentation
- [Setting up Server-Side Auth for Next.js | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Login with Google | Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Login with Kakao | Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-kakao)
- [@supabase/ssr - npm](https://www.npmjs.com/package/@supabase/ssr)
- [Kakao Developers REST API](https://developers.kakao.com/docs/latest/en/kakaologin/rest-api)

### Community Discussions
- [Support Auth Provider: Naver · supabase · Discussion #35631](https://github.com/orgs/supabase/discussions/35631)
- [Docs: update Kakao OAuth guide with new Kakao UI · Issue #41680](https://github.com/supabase/supabase/issues/41680)
- [Naver sign-in does not adhere to OAuth 2.0 specs · Discussion #9313](https://github.com/nextauthjs/next-auth/discussions/9313)

### Technical Articles
- [🔐 Next.js + Supabase Cookie-Based Auth Workflow: The Best Auth Solution (2025 Guide)](https://the-shubham.medium.com/next-js-supabase-cookie-based-auth-workflow-the-best-auth-solution-2025-guide-f6738b4673c1)
- [Complete Authentication Guide for Next.js App Router in 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)
- [Top 5 authentication solutions for secure Next.js apps in 2026](https://workos.com/blog/top-authentication-solutions-nextjs-2026)

---

## Recommendations Summary

### Do Use
1. **@supabase/ssr v0.8.0** - Current standard for SSR auth
2. **Email + Google + Kakao** - Native Supabase support, production-ready
3. **Cookie-based sessions** - XSS protection via HTTP-only cookies
4. **Row-Level Security** - Database-level authorization
5. **Server-side verification** - Defense-in-depth security
6. **PKCE flow** - Automatic via @supabase/ssr

### Don't Use
1. ❌ @supabase/auth-helpers-* (deprecated)
2. ❌ localStorage for sessions (XSS vulnerable)
3. ❌ Client-side only auth checks (insufficient)
4. ❌ Custom JWT handling (unnecessary complexity)
5. ❌ Mixed auth providers (breaks RLS integration)

### Naver OAuth Decision
**MVP Phase:** Skip Naver, launch with Email + Google + Kakao
**Future Phase:** Add Naver via NextAuth.js if user demand justifies complexity

**Rationale:** Focus engineering effort on high-confidence solutions. Add Naver after validating market demand.
