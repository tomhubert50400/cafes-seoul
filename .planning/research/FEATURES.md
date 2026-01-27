# Authentication Features Research

**Research Date:** 2026-01-27
**Project:** Cafes Seoul - Korean Café Discovery App
**Context:** Adding authentication to existing Next.js 16 + Supabase app
**Target Users:** Korean users (Kakao/Naver) + International visitors (Google/Email)

---

## Executive Summary

Modern authentication for a Korean web app in 2025/2026 requires a **hybrid approach**: Korean-native OAuth providers (Kakao, Naver) are **table stakes** for local users, while Google OAuth + Email/Password serve international visitors. The challenge: **Supabase natively supports Kakao but NOT Naver**, requiring workarounds or strategic trade-offs.

**Critical Finding:** Naver OAuth is not natively supported by Supabase Auth. This creates a v1 scope decision: implement Naver via workarounds (high complexity) or defer to v2 (lower Korean market coverage).

---

## Table Stakes Features (Must-Have for v1)

### 1. Multi-Provider Social Login

**What:** Allow users to sign in with multiple OAuth providers without creating duplicate accounts.

**Why Table Stakes:**
- Korean users expect Kakao and/or Naver login on every local service
- International users expect Google login (dominant globally)
- 89% reduction in account takeover attempts when eliminating passwords (Notion security findings, 2025)
- OAuth 2.1 with PKCE is now **mandatory** for all public clients (no longer optional)

**Expected Behavior:**
- **Kakao OAuth Flow:**
  1. User clicks "Continue with Kakao" button
  2. Redirects to Kakao authorization page (state: ON in Kakao Developers portal)
  3. User authorizes app permissions
  4. Callback to `https://<project-ref>.supabase.co/auth/v1/callback`
  5. Supabase creates/links user account automatically
  6. User redirected to app with active session

- **Google OAuth Flow:**
  1. User clicks "Continue with Google" button
  2. Redirects to Google OAuth consent screen
  3. User selects Google account and authorizes
  4. Callback handled by Supabase Auth
  5. Session established, user redirected to app

- **Naver OAuth Flow (⚠️ BLOCKER):**
  - **Status:** Supabase does NOT natively support Naver as of 2026
  - **Workaround Options:**
    - Option A: Implement generic OAuth2/OIDC with proxy/redirector to match Supabase URL patterns
    - Option B: Use NextAuth/Auth.js alongside Supabase (dual auth system complexity)
    - Option C: Defer Naver to v2, ship v1 with Kakao + Google + Email only
  - **Expected behavior IF implemented:** Same as Kakao flow above

**Provider Configuration:**
- Kakao: REST API Key (client_id) + Client Secret (client_secret)
- Google: OAuth 2.0 Client ID + Client Secret
- Naver: Client ID + Client Secret (if implemented via workaround)

**Dependencies:**
- Supabase Auth with SSR (@supabase/ssr already installed)
- OAuth provider developer accounts (Kakao Developers, Google Cloud Console, Naver Developers)
- Redirect URIs whitelisted in each provider console

**Security Requirements:**
- HTTPS mandatory for all OAuth flows
- State parameter for CSRF protection (handled by Supabase)
- PKCE for authorization code flow (mandatory in OAuth 2.1)
- Redirect URI whitelist validation
- Email verification requirement: If provider's userinfo doesn't include `"email_verified": true`, sign-in fails OR "Confirm email" setting must be disabled in Supabase

**UX Requirements:**
- Show all available OAuth buttons prominently on login page
- Button order: Kakao (primary for KR), Naver (if available), Google, then Email
- Mobile-optimized: OAuth flows must work seamlessly on mobile browsers
- Error handling: Clear messages if OAuth fails (provider down, user cancels, email not verified)

---

### 2. Email/Password Authentication

**What:** Traditional email + password signup and login with email verification.

**Why Table Stakes:**
- Fallback for users who don't want to use social login
- Required for users without Kakao/Google accounts
- Provides backup authentication method if OAuth provider unavailable
- Industry standard: still expected even when OAuth dominates

**Expected Behavior:**

**Sign Up:**
1. User enters email + password on signup form
2. Password validation: min 8 characters (Supabase default, customizable to 6-72 chars)
3. Supabase creates user account with `email_confirmed_at: null`
4. Verification email sent automatically
5. User clicks magic link in email → `email_confirmed_at` set
6. User can now log in

**Sign In:**
1. User enters email + password
2. If email not verified: error message "Please verify your email first"
3. If verified: session created, user redirected to app
4. Failed attempts: generic error "Invalid credentials" (don't leak user existence)

**Password Requirements:**
- Minimum length: 8-12 characters (industry standard: 15-30 minute access token lifetime)
- No maximum length (Supabase supports 6-72 characters)
- No complexity requirements mandated (research shows length > complexity for security)
- Password strength indicator on signup form (optional UX enhancement)

**Security Requirements:**
- Passwords hashed with bcrypt/Argon2 (Supabase handles automatically)
- Email verification mandatory before first login
- Rate limiting on login attempts (Supabase has built-in rate limiting)
- No password reset in v1 (deferred to v2 per project scope)

**Dependencies:**
- Supabase Auth email provider enabled
- SMTP configuration in Supabase dashboard (for sending verification emails)
- Email templates customized with i18n (Korean/English)

---

### 3. Session Management with Refresh Tokens

**What:** Secure, persistent sessions using short-lived access tokens + refresh token rotation.

**Why Table Stakes:**
- Modern security standard: access tokens should be **15-30 minutes** (most common: 15 min)
- Refresh tokens enable "stay logged in" without repeated login prompts
- Refresh token rotation prevents replay attacks and detects compromised tokens
- Required for seamless UX (data sync, pre-filled forms without re-auth)

**Expected Behavior:**

**Session Lifecycle:**
1. User logs in → Supabase issues access token (15 min) + refresh token (7-14 days)
2. Access token stored in memory (NOT localStorage - security risk)
3. Refresh token stored as **HttpOnly cookie** (safe from XSS attacks)
4. When access token expires:
   - Interceptor catches 401 Unauthorized
   - Pauses outgoing requests
   - Calls `/auth/v1/token?grant_type=refresh_token`
   - Receives new access token + new refresh token (rotation)
   - Original request retried with new token
5. If refresh fails → user logged out, redirected to login

**Refresh Token Rotation:**
- Every refresh exchange invalidates old refresh token
- New refresh token issued each time
- If old token reused → **all sessions invalidated** (detects compromise)
- Reduces long-lived token risk

**Token Lifetimes (Recommendations):**
- **High-security (default for v1):**
  - Access token: 15 minutes
  - Refresh token: 7 days (absolute lifetime)
  - Inactivity timeout: 30 minutes

- **Mobile-friendly (consider for v2):**
  - Access token: 1 hour
  - Refresh token: 180 days (absolute lifetime)
  - No inactivity timeout

**Storage Strategy:**
- Access token: In-memory only (cleared on page refresh)
- Refresh token: HttpOnly cookie (server-side only, JS cannot access)
- Session persistence: Cookie-based via `@supabase/ssr` (already installed)

**Implementation:**
- Next.js middleware refreshes session on each request (`src/lib/supabase/middleware.ts` exists)
- Supabase client factory handles token refresh automatically
- No manual token management needed in UI code

**Security:**
- Continuous monitoring for suspicious activity (repeated failures, unusual IPs)
- Log token issuance/refresh events with IP, device type, client app
- Detect "thundering herd" with atomic refresh calls (queue/subscriber pattern)

---

### 4. Account Linking (Same Email, Multiple Providers)

**What:** Allow users to log in with different OAuth providers using the same email address without creating duplicate accounts.

**Why Table Stakes:**
- Users may have Kakao + Google accounts with same email
- Prevents fragmented user profiles and duplicate data
- Provides backup auth methods if one provider is unavailable
- Expected behavior in modern apps (Google Cloud, Firebase, Auth0 all support this)

**Expected Behavior:**

**Scenario 1: User signs up with Kakao, later tries Google (same email)**
1. User clicks "Continue with Google"
2. Google returns email: `user@example.com`
3. Supabase checks if email exists → finds Kakao account
4. **Automatic linking:** Supabase links Google provider to existing account
5. User can now log in with either Kakao OR Google

**Scenario 2: Email not verified on OAuth provider**
1. Provider returns `email_verified: false` in userinfo
2. Supabase **rejects sign-in** (security: prevent account takeover)
3. User sees error: "Email not verified with [Provider]"
4. Workaround: Disable "Confirm email" in Supabase Email provider settings (reduces security)

**Security Requirements:**
- Both accounts must authenticate before linking (no implicit linking)
- Manual account linking should prompt credentials for both providers
- Some platforms disable automatic linking for users who sign up with social login (prevents account takeover)

**Supabase Behavior:**
- Automatic linking enabled by default (configurable in dashboard)
- Links based on email address match
- User identity stored with multiple `identities` array in `auth.users` table
- Each provider has separate entry in `identities` (provider, provider_id, user_id)

**Dependencies:**
- Supabase Auth automatic account linking enabled (dashboard setting)
- Email verification required on all OAuth providers
- User profile table (`profiles`) must handle multiple auth providers for single user

---

### 5. Protected Routes & Public Access

**What:** Certain pages require authentication; others are publicly accessible without login.

**Why Table Stakes:**
- Core product requirement: browse cafes without account, contribute with account
- Industry standard: read-only access public, write access authenticated
- Aligns with project scope (PROJECT.md: "parcourir sans compte, contribuer avec compte")

**Expected Behavior:**

**Public Routes (No Auth Required):**
- `/` - Home page
- `/cafes` - Browse cafes list
- `/cafes/[slug]` - View cafe details, photos, reviews
- `/districts` - Browse by district
- `/map` - Map view of cafes
- `/about`, `/privacy`, `/terms` - Static pages

**Protected Routes (Auth Required):**
- `/profile` - User profile management
- `/favorites` - User's saved cafes (v2)
- `/cafes/[slug]/review` - Submit cafe review (v2)
- `/cafes/new` - Suggest new cafe (v2)

**Auth State Checks:**
- Middleware: `src/middleware.ts` → calls `src/lib/supabase/middleware.ts`
- Protected route access without session → redirect to `/login?redirect=/profile`
- After login → redirect back to original protected route
- Auth route access with active session → redirect to `/` (logged-in users don't need login page)

**Implementation:**
- Next.js middleware checks session on every request
- Server components can access session via `createServerClient()`
- Client components use `useUser()` hook (Supabase React helpers)

**Dependencies:**
- Middleware configured in `src/middleware.ts` (file exists, needs auth logic)
- Route groups: `src/app/(auth)/` for login/signup, `src/app/(main)/` for authenticated layouts

---

### 6. Logout & Session Termination

**What:** User-initiated logout that clears all session data and invalidates tokens.

**Why Table Stakes:**
- Basic security hygiene (required for shared devices, public computers)
- Regulatory compliance (GDPR: users must be able to end sessions)
- Expected by 100% of users in any authenticated app

**Expected Behavior:**

**Logout Flow:**
1. User clicks "Logout" button in header/profile menu
2. Client calls `supabase.auth.signOut()`
3. Supabase invalidates refresh token server-side
4. Access token cleared from memory
5. HttpOnly cookie deleted
6. User redirected to home page `/`
7. Protected routes now inaccessible (redirect to login)

**Server-Side Session Cleanup:**
- Refresh token removed from Supabase `auth.refresh_tokens` table
- All active sessions for that token invalidated
- User must re-authenticate to access protected routes

**Edge Cases:**
- Logout on one device does NOT log out other devices (unless "Logout All Devices" feature added in v2)
- Session expiry: if user doesn't log out manually, session expires after refresh token lifetime (7-14 days)

**UX Requirements:**
- Logout button visible when user is logged in (header avatar dropdown)
- Confirmation dialog optional (can be instant for better UX)
- After logout: Toast notification "You've been logged out"
- Any unsaved data warnings before logout (if applicable)

**Dependencies:**
- Supabase Auth signOut method
- Client-side session state cleared
- Next.js router redirect to public page

---

## Differentiators (Nice-to-Have, v2 Candidates)

### 7. Magic Link Authentication (Passwordless Email)

**What:** Users receive a time-limited login link via email; click to authenticate without entering password.

**Why Differentiator:**
- Passwordless is trending in 2026 (89% drop in account takeover attempts per Notion data)
- Improves UX for users who forget passwords
- Simpler than password reset flow
- Reduces password storage/management overhead

**Expected Behavior:**
1. User enters email on login page, clicks "Send magic link"
2. Supabase sends email with unique, time-limited URL (15-30 min expiry, industry standard)
3. User clicks link in email
4. Link opens app → Supabase validates token
5. If valid + not expired + single-use → user logged in
6. Token immediately invalidated (can't be reused)
7. If expired/invalid → error message "Link expired, request a new one"

**Token Characteristics:**
- Unique per request (UUID embedded in URL)
- Time-limited: **15-30 minutes** (most common: 15 min, balances security and UX)
- Single-use: becomes invalid after first click
- Programmatically revocable

**Security:**
- Email authentication requires SPF, DKIM, DMARC DNS records (prevent phishing)
- Token entropy must be cryptographically secure
- HTTPS mandatory for callback URLs
- Rate limiting on magic link requests (prevent spam)

**Trade-offs:**
- Requires reliable email delivery (SMTP, SendGrid, etc.)
- UX friction: user must check email, switch apps
- Not mobile-friendly if email opened on different device than browser session
- Weaker than OAuth for identity assurance (email access = account access)

**Implementation Complexity:** Medium (Supabase supports natively, but email templates need i18n)

**Recommendation:** **v2** - Email/password + OAuth already cover most use cases. Magic links add complexity without enough value for v1.

---

### 8. Multi-Factor Authentication (MFA)

**What:** Require second authentication factor (TOTP, SMS, WebAuthn) after password/OAuth login.

**Why Differentiator:**
- Modern security best practice (recommended for all user-facing services)
- Mitigates password reuse, phishing, credential stuffing
- **Not required for v1** per PROJECT.md ("2FA — complexité non nécessaire pour v1")
- Expected by high-security users (enterprise, financial apps)

**Expected Behavior:**

**Enrollment:**
1. User enables MFA in profile settings
2. App shows QR code for TOTP app (Google Authenticator, Authy, etc.)
3. User scans QR code, enters 6-digit code to verify
4. Backup codes generated (10 single-use codes)
5. MFA active for future logins

**Login with MFA:**
1. User enters email + password (or completes OAuth)
2. Supabase detects MFA enabled
3. Prompt: "Enter code from authenticator app"
4. User enters 6-digit TOTP code
5. If valid → session created; if invalid → retry (max 3 attempts)

**MFA Methods (Priority Order):**
1. **TOTP (Time-based One-Time Password):** Industry standard, works offline, best UX
2. **WebAuthn/FIDO2:** Hardware keys (Yubikey, Touch ID, Face ID) - strongest security, emerging standard
3. **SMS:** Weakest (SIM swapping attacks), not recommended in 2026
4. **Email codes:** Weak (email compromise = account compromise)

**Supabase Support:**
- Supabase Auth supports TOTP MFA natively (can be enabled in dashboard)
- WebAuthn support: experimental, check Supabase docs for latest status
- SMS: requires third-party provider (Twilio, Vonage)

**Security Best Practices:**
- MFA should be **encouraged as default** but NOT mandatory for all users (UX friction)
- Backup codes essential (user loses device → account recovery)
- Admin override for support tickets (locked-out users)

**Implementation Complexity:** High (UI for enrollment, TOTP validation, backup codes, recovery flow)

**Recommendation:** **v2** - Explicitly out of scope for v1. Revisit after auth v1 ships if high-value users request it.

---

### 9. Account Deletion & Data Portability

**What:** Users can permanently delete their account and download all their data (GDPR compliance).

**Why Differentiator:**
- **Regulatory requirement** for Korean/EU users (GDPR, PIPA - Personal Information Protection Act in Korea)
- App Store compliance: Google Play (since May 2024) requires in-app account deletion
- iOS App Review Guidelines (since Jan 2022): Apps using social login must offer in-app account unlinking + deletion
- Trust signal for privacy-conscious users

**Expected Behavior:**

**Account Deletion:**
1. User navigates to profile settings → "Delete Account"
2. Confirmation dialog: "This action cannot be undone. All your data will be permanently deleted."
3. User enters password (or re-authenticates via OAuth)
4. Server deletes:
   - User record in `auth.users` (Supabase Auth)
   - User profile in `profiles` table
   - User-generated content (reviews, ratings, photos - v2 features)
   - OAuth links in `auth.identities`
5. All sessions invalidated immediately
6. User logged out, redirected to home page
7. Confirmation email: "Your account has been deleted"

**Data Portability:**
1. User navigates to profile settings → "Download My Data"
2. Server generates JSON export with:
   - Profile information (name, email, created_at)
   - User-generated content (reviews, ratings, favorites)
   - Activity logs (login history - optional)
3. User downloads file or receives via email
4. Format: JSON or CSV (machine-readable)

**Security Requirements:**
- Password/OAuth re-authentication before deletion (prevent accidental deletion)
- Soft delete option for admin (30-day grace period before permanent deletion)
- Irreversible data destruction per Kakao Developers Operating Policy
- Unlink webhook verification (Kakao requires services to verify deletion beyond in-app process)

**Platform-Specific Compliance:**
- **Google Play:** Account deletion option mandatory since May 31, 2024 (apps removed if non-compliant)
- **iOS App Review:** Social login apps must offer in-app unlinking + account deletion since Jan 31, 2022
- **Kakao Developers Policy:** Must irreversibly destroy all user personal information upon account deletion

**Implementation Complexity:** Medium-High (cascade deletes, data export, re-auth flow, platform compliance)

**Recommendation:** **v2 High Priority** - Required for mobile app store compliance and Korean regulatory compliance. If v1 ships as web-only, can defer. If mobile app planned, implement in v1.

---

### 10. Profile Management & Avatar

**What:** Users can update profile information (display name, avatar, bio) after signup.

**Why Differentiator:**
- Personalization improves engagement (users with avatars more likely to contribute)
- Required for v2 features (reviews show user avatar + name)
- Not core auth functionality, but closely related

**Expected Behavior:**

**Profile Fields:**
- Display name (shown on reviews, comments)
- Avatar image (uploaded or OAuth provider photo)
- Bio (optional, 160 chars)
- Language preference (Korean/English - already handled by i18n)

**Edit Profile:**
1. User navigates to `/profile`
2. Form pre-filled with current data
3. User updates fields, uploads avatar
4. Avatar uploaded to Supabase Storage (`avatars` bucket)
5. Profile updated in `profiles` table
6. Success toast: "Profile updated"

**Avatar Sources:**
- OAuth provider photo (Kakao, Google profile pictures)
- User-uploaded image (JPEG/PNG, max 2MB, square crop)
- Default avatar (generated from initials or placeholder icon)

**Dependencies:**
- `profiles` table in database (likely already exists per INTEGRATIONS.md)
- Supabase Storage bucket for avatars (public read, authenticated write)
- Image upload component (drag-drop or file picker)

**Implementation Complexity:** Low (standard CRUD + file upload)

**Recommendation:** **v1 Optional** - Can ship minimal v1 without profile editing. Add in v1.1 or v2 when user-generated content (reviews) is implemented.

---

### 11. Social Account Unlinking

**What:** Users can disconnect specific OAuth providers from their account while keeping others.

**Why Differentiator:**
- User control over data sharing with third parties
- Required by iOS App Review Guidelines (since Jan 2022) for apps using social login
- Allows users to switch primary login method
- Privacy-conscious users expect this

**Expected Behavior:**

**Unlinking Flow:**
1. User navigates to profile settings → "Connected Accounts"
2. Shows list of linked providers (Kakao, Google, Email/Password)
3. User clicks "Disconnect" next to Kakao
4. Warning: "You will no longer be able to sign in with Kakao. Ensure you have another login method enabled."
5. User confirms
6. Server removes Kakao entry from `auth.identities`
7. User can no longer log in with Kakao (must use Google or Email/Password)

**Safety Checks:**
- **Cannot unlink last login method:** If user only has Kakao linked, unlinking is blocked
- Must have at least one active login method (OAuth or Email/Password)
- Re-authentication required before unlinking (security: confirm user identity)

**Kakao-Specific Requirement:**
- Kakao Developers Operating Policy: Must offer in-app account unlinking
- Strongly recommended to verify user's account deletion status beyond in-app process using **Unlink webhook**
- Webhook receives notification when user unlinks Kakao → app verifies and cleans up data

**Implementation Complexity:** Medium (UI for linked accounts, unlink logic, safety checks, webhooks)

**Recommendation:** **v2** - Not essential for v1. If mobile app on iOS, becomes higher priority (App Store compliance).

---

## Anti-Features (Deliberately NOT Building)

### 12. Password Reset (Excluded from v1)

**What:** Users can reset forgotten passwords via email link.

**Why Excluded:**
- Explicitly out of scope per PROJECT.md ("Reset mot de passe — v2, peut être ajouté plus tard")
- OAuth covers most users (Kakao, Google) - they manage password reset on their platforms
- Magic links (if added in v2) cover passwordless recovery
- Adds complexity: reset token generation, email templates, token validation, password update UI
- Minimal value for v1: target users primarily use OAuth (Korean users → Kakao/Naver, international → Google)

**Workaround for v1:**
- Users who forget email/password credentials must contact support
- Support can manually reset password via Supabase dashboard (admin action)
- Alternative: Users can sign up again with OAuth (if they only used email/password previously)

**Revisit in v2 if:**
- High volume of support tickets for forgotten passwords
- Email/password becomes primary auth method (unexpected)

---

### 13. SMS/Phone Number Authentication (Excluded from v1)

**What:** Users sign up and log in using phone number + SMS OTP.

**Why Excluded:**
- Not standard in Korean web apps (Kakao/Naver OAuth is standard)
- Requires third-party SMS provider (Twilio, Vonage) - additional cost + integration
- SMS as second factor is **insufficient** in 2026 (SIM swapping attacks, SMS interception)
- TOTP/WebAuthn are superior MFA methods
- Phone number collection adds privacy concerns (GDPR/PIPA compliance)

**Recommendation:** **Never build** unless specific use case emerges (e.g., delivery drivers, phone-first user segment).

---

### 14. Enterprise SSO (SAML, OIDC for Organizations)

**What:** Allow organizations to use their own identity providers (Okta, Azure AD, Google Workspace) for employee login.

**Why Excluded:**
- Not relevant for consumer app (cafes discovery)
- Target users: individuals, not enterprises
- Adds significant complexity: SAML/OIDC protocol implementation, tenant management, provisioning
- Supabase supports OAuth 2.1 server capabilities (added Nov 2025), but enterprise SSO is overkill for this use case

**Recommendation:** **Never build** - out of scope for consumer-facing cafe discovery app.

---

### 15. Biometric Authentication (Touch ID, Face ID)

**What:** Use device biometrics as primary or secondary authentication factor.

**Why Excluded:**
- Requires native mobile app (not web app focus)
- WebAuthn can support biometrics on web, but browser support inconsistent in 2026
- Adds platform-specific complexity (iOS vs Android)
- Users can use biometrics at OS level for password autofill (iOS Keychain, Google Smart Lock)

**Recommendation:** **v2 for mobile app** - If native iOS/Android apps are built, WebAuthn/FIDO2 biometrics become relevant.

---

## OAuth Flow Behaviors: Expected UX by Provider

### Google OAuth

**Standard Flow:**
1. User clicks "Continue with Google"
2. Redirected to `accounts.google.com/o/oauth2/v2/auth` with params:
   - `client_id`: Google OAuth client ID
   - `redirect_uri`: `https://<project-ref>.supabase.co/auth/v1/callback`
   - `response_type`: `code` (authorization code flow)
   - `scope`: `openid email profile`
   - `state`: CSRF token (Supabase generates)
3. User selects Google account or signs in
4. Google consent screen: "Cafes Seoul wants to access your email and profile"
5. User clicks "Allow"
6. Redirected back to `redirect_uri` with `code` and `state`
7. Supabase exchanges code for tokens (access_token, refresh_token, id_token)
8. Supabase creates user in `auth.users`, extracts email/name/avatar from Google userinfo
9. User redirected to app with session cookie

**Error Cases:**
- User clicks "Cancel" → Redirected with `error=access_denied` → Show "Login cancelled"
- Email not verified on Google → Sign-in succeeds (Google verifies all emails by default)
- User denies consent → Same as cancel

**Mobile Considerations:**
- Works in mobile web browsers (Chrome, Safari)
- Deep links not required (web-based OAuth)

---

### Kakao OAuth

**Standard Flow:**
1. User clicks "Continue with Kakao"
2. Redirected to `kauth.kakao.com/oauth/authorize` with params:
   - `client_id`: Kakao REST API Key
   - `redirect_uri`: `https://<project-ref>.supabase.co/auth/v1/callback`
   - `response_type`: `code`
   - `state`: CSRF token
3. User logs into Kakao account (if not already logged in)
4. Kakao consent screen: "Cafes Seoul wants to access your profile and email"
5. User clicks "동의하고 계속하기" (Agree and continue)
6. Redirected back with `code` and `state`
7. Supabase exchanges code for tokens
8. Supabase fetches userinfo from Kakao API (email, nickname, profile_image)
9. User created/linked in Supabase Auth
10. User redirected to app

**Kakao-Specific Behavior:**
- Kakao Login must be set to "ON" state in Kakao Developers portal (Product Settings > Kakao Login > General)
- Redirect URI must be **exactly registered** in Kakao Developers console (no wildcards)
- Email scope must be explicitly requested and approved by Kakao (requires app review)
- Profile image URL format: `http://k.kakaocdn.net/...` (external image, must proxy or cache)

**Error Cases:**
- User clicks "취소" (Cancel) → `error=access_denied`
- Email not provided by Kakao → Sign-in fails (email is required by Supabase)
- Kakao account has no email → User must add email to Kakao account first

**Kakao Requirements (Security & Compliance):**
- App must offer in-app account deletion (mandatory for app store)
- Unlink webhook recommended for verifying user deletion status
- Must irreversibly destroy all user data upon account deletion

---

### Naver OAuth (⚠️ Not Natively Supported by Supabase)

**Expected Flow (If Implemented via Workaround):**
1. User clicks "Continue with Naver"
2. Redirected to `nid.naver.com/oauth2.0/authorize` with params:
   - `client_id`: Naver Client ID
   - `redirect_uri`: Custom proxy or NextAuth callback
   - `response_type`: `code`
   - `state`: CSRF token
3. User logs into Naver account
4. Naver consent screen: "Cafes Seoul wants to access your profile and email"
5. User clicks "동의" (Agree)
6. Redirected to callback with `code` and `state`
7. **Workaround logic:**
   - Option A: Proxy exchanges code for Naver access token, forwards to Supabase
   - Option B: NextAuth handles Naver OAuth, creates session, syncs to Supabase
8. User session established

**Challenges:**
- Supabase hardcodes OAuth provider URLs (doesn't support custom OIDC yet)
- Naver's userinfo response format may not match Supabase expectations
- If userinfo doesn't include `"email_verified": true`, sign-in fails unless "Confirm email" disabled (security risk)

**Workaround Implementation Options:**

**Option A: Generic OAuth2/OIDC Proxy**
- Build custom proxy endpoint: `/api/auth/naver/callback`
- Proxy exchanges Naver code for access token
- Fetch userinfo from Naver API
- Transform response to Supabase-compatible format
- Call Supabase Auth API to create session
- Complexity: Medium-High
- Maintenance: Ongoing (breaks if Naver changes API)

**Option B: Dual Auth System (NextAuth + Supabase)**
- Use NextAuth for Naver OAuth (native support)
- Sync NextAuth session to Supabase (create user in `auth.users` via Admin API)
- Complexity: High (two auth systems, sync logic)
- Maintenance: High (keep both in sync)

**Option C: Defer to v2**
- Ship v1 with Kakao + Google + Email only
- Add Naver in v2 when Supabase adds custom OIDC support (planned for 2026)
- Complexity: Zero
- Trade-off: Lower Korean market coverage (~50% of Korean users use Naver)

**Recommendation:** **Option C (Defer to v2)** - Kakao covers majority of Korean users. Naver workarounds add significant complexity for marginal v1 value. Revisit when Supabase ships custom OIDC provider support.

---

## Feature Dependencies

```
Session Management (3)
  ↓ (required by)
├─ Protected Routes (5)
├─ Logout (6)
└─ Profile Management (10)

Email/Password Auth (2)
  ↓ (required by)
├─ Magic Links (7)
└─ Password Reset (12 - Anti-feature)

OAuth Providers (1)
  ↓ (required by)
├─ Account Linking (4)
└─ Social Account Unlinking (11)

Account Linking (4)
  ↓ (required by)
└─ Social Account Unlinking (11)

Protected Routes (5)
  ↓ (required by)
└─ Profile Management (10)

Profile Management (10)
  ↓ (required by)
└─ Account Deletion (9)

MFA (8)
  ↓ (optionally enhances)
└─ All Auth Methods (1, 2, 7)
```

**Critical Path for v1:**
1. Email/Password Auth (2)
2. OAuth Providers: Kakao + Google (1)
3. Session Management (3)
4. Account Linking (4)
5. Protected Routes (5)
6. Logout (6)

**Blocked by Naver:**
- Naver OAuth (1) → Requires workaround or deferred to v2

**Can Ship v1 Without:**
- Magic Links (7)
- MFA (8)
- Account Deletion (9)
- Profile Management (10)
- Social Account Unlinking (11)
- Password Reset (12)

---

## Implementation Priorities

### P0 - Must Ship for v1 (MVP)
1. Email/Password Authentication (2)
2. Google OAuth (1)
3. Kakao OAuth (1)
4. Session Management with Refresh Tokens (3)
5. Account Linking (4)
6. Protected Routes (5)
7. Logout (6)

### P1 - Nice to Have for v1.1
8. Profile Management (10) - Required for v2 user-generated content
9. Account Deletion (9) - Required for mobile app store compliance

### P2 - v2 Features
10. Magic Link Authentication (7)
11. Social Account Unlinking (11)
12. MFA (8)
13. Naver OAuth (1) - When Supabase adds custom OIDC or via workaround

### P3 - Never Build
14. Password Reset (12) - Deferred indefinitely, OAuth covers most users
15. SMS/Phone Auth (13) - Out of scope
16. Enterprise SSO (14) - Out of scope
17. Biometric Auth (15) - Web-only, no native app

---

## Quality Gate Checklist

- [x] **Categories are clear:** Table stakes (6), differentiators (6), anti-features (5) clearly labeled
- [x] **Expected UX for Korean OAuth providers documented:** Kakao flow fully detailed, Naver blockers identified
- [x] **Dependencies between features identified:** Dependency graph provided, critical path defined
- [x] **Token lifetimes specified:** Access token 15 min, refresh token 7-14 days, magic link 15-30 min
- [x] **Security best practices included:** PKCE, refresh token rotation, HttpOnly cookies, HTTPS, rate limiting
- [x] **Supabase limitations documented:** Naver not supported, workarounds explored, recommendation provided
- [x] **Mobile compliance noted:** Google Play + iOS App Store requirements for account deletion/unlinking
- [x] **Korean regulatory compliance:** PIPA, Kakao Operating Policy requirements included
- [x] **Implementation complexity assessed:** Low/Medium/High ratings for each feature
- [x] **v1 scope validated against PROJECT.md:** Active requirements covered, out-of-scope items confirmed

---

## Sources

### OAuth & Authentication Standards
- [OAuth 2.0 Security Best Practices: From Authorization Code to PKCE](https://medium.com/@basakerdogan/oauth-2-0-security-best-practices-from-authorization-code-to-pkce-beccdbe7ec35)
- [Authorization Code Flow with Proof Key for Code Exchange (PKCE) - Auth0](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce)
- [What is PKCE? Flow Examples and How It Works - Descope](https://www.descope.com/learn/post/pkce)

### Session Management & Refresh Tokens
- [What are Refresh Tokens? Complete Implementation Guide & Security Best Practices](https://securityboulevard.com/2026/01/what-are-refresh-tokens-complete-implementation-guide-security-best-practices/)
- [OAuth 2 Refresh Tokens: A Practical Guide - Frontegg](https://frontegg.com/blog/oauth-2-refresh-tokens)
- [Session Management Best Practices - Stytch](https://stytch.com/blog/session-management-best-practices/)
- [Better Session Management with Refresh Tokens - 1Password](https://passage.1password.com/post/better-session-management-with-refresh-tokens)

### Magic Links & Passwordless
- [What Are Magic Links and How Do They Work? - Descope](https://www.descope.com/learn/post/magic-links)
- [Email Magic Links - Clerk](https://clerk.com/blog/magic-links)
- [Magic Links in 2025 – How Do They Work? - EngageLab](https://www.engagelab.com/blog/magic-links)
- [Passwordless Authentication with Magic Links - Auth0](https://auth0.com/docs/authenticate/passwordless/authentication-methods/email-magic-link)

### Korean OAuth Providers (Kakao, Naver)
- [Korean Social Login, Naver, Kakao And More - Shopify](https://apps.shopify.com/korean-social-login)
- [Concepts | Kakao Developers](https://developers.kakao.com/docs/latest/en/kakaologin/common)
- [Login with Kakao | Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-kakao)
- [Support Auth Provider: Naver - Supabase Discussion #35631](https://github.com/orgs/supabase/discussions/35631)
- [Kakao and Naver certificates (used for log in) - FlipKorea](https://www.flipkorea.com/post/kakao-and-naver-certificates-used-for-log-in)

### Supabase Auth Capabilities
- [OAuth 2.1 Server | Supabase Docs](https://supabase.com/docs/guides/auth/oauth-server)
- [Build "Sign in with Your App" using Supabase Auth](https://supabase.com/blog/oauth2-provider)
- [Getting Started with OAuth 2.1 Server | Supabase Docs](https://supabase.com/docs/guides/auth/oauth-server/getting-started)
- [Signing in with a generic OAuth2/OIDC provider - Supabase Discussion #6547](https://github.com/orgs/supabase/discussions/6547)

### Account Linking & Multi-Provider Auth
- [Linking multiple providers to an account - Google Cloud Identity Platform](https://cloud.google.com/identity-platform/docs/link-accounts)
- [How to Integrate Social Logins the Right Way - Curity](https://curity.medium.com/how-to-integrate-social-logins-the-right-way-7e8c075b484a)
- [Account Linking with Social Identity Providers - Curity](https://curity.io/resources/learn/account-linking-with-social/)
- [User Account Linking - Auth0](https://auth0.com/docs/manage-users/user-accounts/user-account-linking)

### Table Stakes Features & Industry Standards
- [Table-stake Features in SaaS/Enterprise Products - LinkedIn](https://www.linkedin.com/pulse/table-stake-features-saas-enterprise-products-rohit-pareek)
- [Web Development in 2025–2026: 12 Essential Trends - Nanobyte Technologies](https://nanobytetechnologies.com/Blog/Web-Development-in-20252026-12-Essential-Trends-Shaping-Modern-Web-Applications)
- [The 8 trends that will define web development in 2026 - LogRocket](https://blog.logrocket.com/8-trends-web-dev-2026/)

---

**Research Complete:** 2026-01-27
**Next Step:** Use this FEATURES.md to define requirements in REQUIREMENTS.md with concrete acceptance criteria and technical implementation details.
