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

### @supabase/auth-helpers-* packages
**Status:** DEPRECATED (as of 2024)
**Replacement:** @supabase/ssr

**Rationale:** All framework-specific auth-helpers packages (auth-helpers-nextjs, auth-helpers-react, etc.) have been consolidated into @supabase/ssr. Using deprecated packages means missing security updates and bug fixes.

### localStorage for session storage
**Status:** ANTI-PATTERN

**Rationale:** Vulnerable to XSS attacks. Supabase's @supabase/ssr uses HTTP-only cookies for session storage, which cannot be accessed by client-side JavaScript and provides defense-in-depth security.

### Client-side only authentication checks
**Status:** SECURITY VULNERABILITY

**Rationale:** CVE-2025-29927 demonstrated that relying solely on middleware for authentication is insufficient. Always implement verification at data access points using Row-Level Security (RLS) policies in Supabase database.

### Custom JWT parsing/validation
**Status:** UNNECESSARY

**Rationale:** @supabase/ssr handles all JWT operations including validation, refresh, and parsing. Manual JWT handling increases risk of security vulnerabilities.

### Mixing Supabase Auth with Firebase Auth or AWS Cognito
**Status:** ARCHITECTURAL MISMATCH

**Rationale:** Supabase Auth integrates deeply with Supabase's Row-Level Security (RLS) system. Using a different auth provider breaks this integration and requires manual user ID mapping in RLS policies.

---

## Sources

### Official Documentation
- [Setting up Server-Side Auth for Next.js | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Login with Google | Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Login with Kakao | Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-kakao)
- [@supabase/ssr - npm](https://www.npmjs.com/package/@supabase/ssr)
- [Kakao Developers REST API](https://developers.kakao.com/docs/latest/en/kakaologin/rest-api)

### Community Discussions
- [Support Auth Provider: Naver Discussion #35631](https://github.com/orgs/supabase/discussions/35631)
- [Docs: update Kakao OAuth guide with new Kakao UI Issue #41680](https://github.com/supabase/supabase/issues/41680)
- [Naver sign-in does not adhere to OAuth 2.0 specs Discussion #9313](https://github.com/nextauthjs/next-auth/discussions/9313)

---

# Profile Enhancement Stack Research

**Research Date:** 2026-02-01
**Target:** Stack additions for profile enhancement milestone
**Milestone:** Profile tabs, text reviews, favorites, settings, email notifications

---

## Executive Summary

The profile enhancement features require minimal stack additions. Supabase Auth already includes password reset via `resetPasswordForEmail()` and `updateUser()` - no new libraries needed. Email notifications require Resend integration via Supabase Edge Functions. Avatar uploads use existing Supabase Storage patterns. Favorites and text reviews are pure database features with no new frontend dependencies.

**Confidence:** HIGH

---

## Stack Additions

### Email Service: Resend

**Recommended:** `resend@6.9.1`
**Required For:** Email notifications when submission status changes (approved/rejected)
**Confidence:** HIGH (verified via [GitHub releases](https://github.com/resend/resend-node/releases))

**Rationale:**
- Official Supabase documentation recommends Resend for Edge Functions email integration
- 748K+ weekly npm downloads, actively maintained (v6.9.1 released 2026-01-27)
- Free tier supports 3,000 emails/month - sufficient for submission notifications
- Simple API: single POST request with JSON payload
- No SDK needed in Next.js - Edge Functions handle email sending server-side

**Integration:**
- Create Supabase Edge Function `send-notification-email`
- Trigger via Database Webhook on `cafe_submissions` status change
- Store `RESEND_API_KEY` in Supabase secrets
- Does NOT require npm install in Next.js app - runs entirely in Supabase Edge Functions

**Alternative Considered:** Nodemailer
- Rejected: Requires SMTP server configuration, more complex setup
- Resend is purpose-built for transactional email with better DX

### Email Templates: React Email (Optional)

**Recommended:** `@react-email/components@1.0.4` (Edge Function only)
**Required For:** Beautiful HTML email templates
**Confidence:** HIGH (verified via [npm](https://www.npmjs.com/package/@react-email/components))

**Rationale:**
- Build email templates with React components in Supabase Edge Functions
- Supports Tailwind 4 (React Email 5.0)
- Same component model as the app - consistent DX
- Optional: Can start with plain HTML templates and add later

**Integration:**
- Install in Supabase Edge Functions project (not main Next.js app)
- `supabase/functions/send-notification-email/package.json`
- Compile to HTML at send time

**Skip If:** Plain text emails are acceptable for MVP

### Client-Side Image Compression (Optional)

**Recommended:** `browser-image-compression@2.0.2`
**Required For:** Avatar upload optimization before Supabase Storage upload
**Confidence:** MEDIUM (last update 3 years ago, but stable and widely used)

**Rationale:**
- 392K weekly downloads, proven stable
- Compress avatars client-side before upload (reduce bandwidth, faster uploads)
- Supabase Pro plan includes server-side image transforms, but client-side is free
- Reduces storage costs

**Integration:**
```typescript
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 0.5,           // Max 500KB
  maxWidthOrHeight: 400,    // Avatar size
  useWebWorker: true        // Non-blocking
};
const compressedFile = await imageCompression(file, options);
```

**Skip If:**
- Using Supabase Pro plan with server-side image transformations
- Avatars are already small (under 500KB typical)

---

## No Changes Needed

### Password Reset Flow

**Uses:** Existing `@supabase/supabase-js@2.93.1`
**Confidence:** HIGH (verified via [Supabase docs](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail))

Supabase Auth already provides complete password reset:

```typescript
// Step 1: Request password reset email
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/auth/reset-password`,
});

// Step 2: User clicks email link, lands on reset page
// The PASSWORD_RECOVERY event fires, user is authenticated

// Step 3: Update password
await supabase.auth.updateUser({ password: newPassword });
```

**Implementation Notes:**
- Uses existing `/auth/confirm` route pattern (already handles `recovery` type)
- Password validation uses existing `@zxcvbn-ts/core` for strength checking
- Form validation uses existing `react-hook-form` + `zod`

### Avatar Upload

**Uses:** Existing Supabase Storage patterns from photo upload
**Confidence:** HIGH

Current codebase (`src/lib/photos/upload.ts`) already has:
- `uploadPhotoToStorage()` - reusable pattern
- `getPhotoPublicUrl()` - generate public URLs
- Error handling, progress tracking

**Implementation:**
- Create `avatars` bucket in Supabase Storage (or use subfolder in existing bucket)
- Storage path: `avatars/{userId}/avatar.{ext}`
- Single file per user (overwrite on update)
- Use existing image validation from `src/lib/photos/validation.ts`

### Favorites System

**Uses:** Pure database + existing patterns
**Confidence:** HIGH

**Database:** New `user_favorites` table
```sql
CREATE TABLE user_favorites (
  user_id UUID REFERENCES auth.users(id),
  cafe_id UUID REFERENCES cafes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, cafe_id)
);
```

**Frontend:**
- Heart icon toggle uses existing Lucide React (`Heart`, `HeartOff`)
- Optimistic updates use existing TanStack Query patterns
- No new libraries needed

### Text Reviews Extension

**Uses:** Existing `cafe_ratings` table + Zod validation
**Confidence:** HIGH

Current schema supports extending with:
```sql
ALTER TABLE cafe_ratings ADD COLUMN review_text TEXT;
ALTER TABLE cafe_ratings ADD COLUMN review_text_updated_at TIMESTAMPTZ;
```

**Frontend:**
- Textarea component in rating form
- Character limit validation with Zod
- Display in cafe detail page
- No new libraries needed

### Notification Preferences

**Uses:** Profiles table extension + Zod schemas
**Confidence:** HIGH

```sql
ALTER TABLE profiles ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN notification_prefs JSONB DEFAULT '{"submissions": true}';
```

**Frontend:**
- Switch component (existing `@radix-ui/react-switch`)
- Form handling with existing react-hook-form
- No new libraries needed

### Profile Editing

**Uses:** Existing form patterns + Supabase
**Confidence:** HIGH

- Form: react-hook-form + Zod (existing)
- Display name update: `profiles` table update
- Email change: `supabase.auth.updateUser({ email })` (sends verification)
- No new libraries needed

---

## Avoid

### Do NOT Add: next-intl for Email Templates

**Why Avoid:**
- Edge Functions run in Deno, not Node.js
- next-intl designed for Next.js, not portable
- Email templates should have inline translations or use simple key-value lookup

**Instead:** Create simple translation object in Edge Function:
```typescript
const translations = {
  en: { subject: 'Your submission was approved!', ... },
  ko: { subject: '제출이 승인되었습니다!', ... },
};
```

### Do NOT Add: Nodemailer

**Why Avoid:**
- Requires SMTP configuration
- Edge Functions better served by API-based providers (Resend)
- Supabase docs don't recommend it for Edge Functions

### Do NOT Add: NextAuth/Auth.js

**Why Avoid:**
- Supabase Auth already handles all auth flows
- Would add complexity without benefit
- Password reset, OAuth, session management all work with existing @supabase/ssr

### Do NOT Add: sharp for Image Processing

**Why Avoid:**
- Native binary, complex deployment
- browser-image-compression handles client-side compression
- Supabase Pro has built-in image transforms
- Edge Functions can use magick-wasm if server-side needed

### Do NOT Add: AWS SES, SendGrid, Mailgun

**Why Avoid:**
- More complex API and setup than Resend
- Supabase documentation specifically covers Resend integration
- Free tiers have more restrictions

---

## Version Summary

| Package | Version | Location | Purpose |
|---------|---------|----------|---------|
| resend | 6.9.1 | Edge Functions | Email API |
| @react-email/components | 1.0.4 | Edge Functions (optional) | Email templates |
| browser-image-compression | 2.0.2 | Next.js (optional) | Avatar optimization |

## Existing Stack (Validated, No Changes)

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | 2.93.1 | Database, Auth, Storage |
| @supabase/ssr | 0.8.0 | Server-side sessions |
| react-hook-form | 7.71.1 | Form handling |
| zod | 4.3.6 | Validation |
| @zxcvbn-ts/core | 3.0.4 | Password strength |
| @radix-ui/react-switch | 1.2.6 | Toggle components |
| lucide-react | 0.563.0 | Icons (Heart for favorites) |
| sonner | 2.0.7 | Toast notifications |
| @tanstack/react-query | 5.90.20 | Server state |

---

## Installation Commands

### Next.js App (Optional)
```bash
# Only if client-side image compression needed
npm install browser-image-compression@2.0.2
```

### Supabase Edge Functions
```bash
# In supabase/functions/send-notification-email/
npm init -y
npm install resend@6.9.1
npm install @react-email/components@1.0.4  # Optional
```

### Supabase Secrets
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

## Sources

- [Supabase resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- [Supabase Sending Emails with Edge Functions](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Supabase Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Resend + Supabase Edge Functions](https://resend.com/docs/send-with-supabase-edge-functions)
- [React Email](https://react.email)
- [Resend npm package](https://github.com/resend/resend-node/releases) - v6.9.1 (2026-01-27)
- [@react-email/components npm](https://www.npmjs.com/package/@react-email/components) - v1.0.4
- [browser-image-compression npm](https://www.npmjs.com/package/browser-image-compression) - v2.0.2

---
*Researched: 2026-02-01*
*Confidence: HIGH - All recommendations verified against official documentation*
