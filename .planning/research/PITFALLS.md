# Authentication Implementation Pitfalls

Research on common mistakes when implementing Supabase Auth with Next.js App Router and OAuth providers, with specific focus on Korean providers (Kakao, Naver).

## Critical Security Pitfalls

### 1. Using `getSession()` Instead of `getUser()` in Server Code

**Impact:** CRITICAL - Authentication bypass vulnerability

**What Goes Wrong:**
- `supabase.auth.getSession()` does NOT validate the JWT with the auth server when used server-side
- Only checks JWT format and expiry, not authenticity
- An attacker can forge a valid-looking JWT and bypass authorization
- Users can remain authenticated even after server-side logout

**Warning Signs:**
- Using `getSession()` in Server Components, Route Handlers, or middleware
- Authorization logic based on `session.user` from `getSession()`
- RLS policies bypassed due to invalid JWT acceptance

**Prevention Strategy:**
```typescript
// WRONG - Vulnerable
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) { /* authorize */ }

// CORRECT - Secure
const { data: { user }, error } = await supabase.auth.getUser();
if (user) { /* authorize */ }
```

**Phase to Address:** Phase 1 (Auth Infrastructure Setup)
- Configure server-side auth utilities with `getUser()` from the start
- Document this pattern for all future server-side auth checks

**References:**
- [Advanced guide | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [getSession should validate with JWT_SECRET](https://github.com/supabase/auth-js/issues/908)

---

### 2. Cookie Size Limits with PKCE Flow

**Impact:** HIGH - Authentication failures in production

**What Goes Wrong:**
- PKCE flow cookies can exceed browser's 4096-character limit
- Especially common with Google OAuth
- Users experience silent authentication failures
- More likely with multiple OAuth providers configured

**Warning Signs:**
- OAuth callback fails with no clear error
- Console shows "Set-Cookie header was blocked as cookie is bigger than 4096"
- Works in development but fails in production with HTTPS/Secure cookies
- Users report "Can't sign in with Google" intermittently

**Prevention Strategy:**
- Monitor cookie sizes during OAuth testing
- Consider using server-side session storage for large auth states
- Test with all OAuth providers (Google, Kakao, Naver) before launch
- Use browser DevTools Network tab to inspect Set-Cookie headers

**Phase to Address:** Phase 2 (OAuth Integration)
- Test cookie sizes with all three providers during implementation
- Add monitoring for cookie-related auth failures

**References:**
- [Cookie size blocked with PKCE flow for Google](https://github.com/supabase/supabase-py/issues/1028)

---

### 3. Middleware Performance - Excessive Auth Checks

**Impact:** MEDIUM - Poor performance and rate limiting

**What Goes Wrong:**
- Next.js prefetches all links, causing middleware to run 9+ times per page
- Middleware runs on static assets (images, CSS, favicons)
- Each middleware call = one `getUser()` API request to Supabase
- Can trigger rate limits and increase latency significantly

**Warning Signs:**
- Slow page navigation
- High number of auth API requests in Supabase dashboard
- Middleware executing on `/_next/static/*` requests
- Approaching Supabase rate limits (60 requests per minute on free tier)

**Prevention Strategy:**
```typescript
// CORRECT - Exclude static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Phase to Address:** Phase 1 (Auth Infrastructure Setup)
- Configure middleware matcher from the start
- Your existing middleware already has this - DO NOT MODIFY

**References:**
- [Supabase Auth with Next.js App Router](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [NextJS Middleware Auth Examples](https://github.com/orgs/supabase/discussions/34842)

---

## Korean OAuth Provider Pitfalls

### 4. Kakao OAuth - `account_email` Scope Restriction

**Impact:** CRITICAL - Blocks non-business accounts from using Kakao login

**What Goes Wrong:**
- Supabase's default `signInWithOAuth()` for Kakao requests `account_email` scope
- `account_email` consent item is only available to Kakao Business accounts
- Individual developer accounts cannot enable this scope
- Users get blocked from Kakao login with unclear error messages
- This critical limitation is NOT documented in Supabase docs

**Warning Signs:**
- Kakao OAuth works in testing but fails for real users
- Error messages about email consent or scope permissions
- Works with your Kakao Business account but not regular users
- OAuth redirect shows permission error in Korean

**Prevention Strategy:**
- Do NOT rely solely on Kakao email scope for user identification
- Request only essential scopes during Kakao OAuth setup
- Test with non-business Kakao accounts during development
- Consider using Kakao's user ID as primary identifier instead of email
- Provide alternative auth methods (email/password, Google, Naver)

**Phase to Address:** Phase 2 (OAuth Integration - Kakao)
- Research current Kakao scope requirements before implementation
- Test with multiple Kakao account types (business and personal)
- Document scope limitations in implementation notes

**References:**
- [Kakao OAuth fails for individual developers - account_email scope](https://github.com/supabase/supabase/issues/36878)

---

### 5. Kakao OAuth - REST API Key vs Native App Key Confusion

**Impact:** MEDIUM - Configuration errors delaying deployment

**What Goes Wrong:**
- Supabase Dashboard requires the Kakao REST API Key
- Documentation and UI terminology is confusing
- Developers often try to use Native App Key instead
- Kakao Developer Portal has changed UI, outdated screenshots in docs

**Warning Signs:**
- "Invalid client credentials" errors from Kakao
- OAuth callback returns authentication failed
- Confusion about which key to use from Kakao Developers Console

**Prevention Strategy:**
- Use the REST API Key from Kakao Developers > App Settings > App Keys
- NOT the Native App Key or JavaScript Key
- Update Kakao redirect URI in Kakao Console to match Supabase callback
- Verify both keys are from the same Kakao application

**Phase to Address:** Phase 2 (OAuth Integration - Kakao)
- Create clear documentation mapping Supabase fields to Kakao portal
- Screenshot the current Kakao Developer Portal (2026) for reference

**References:**
- [Kakao Login: REST API Key vs Native App Key confusion](https://github.com/supabase/auth/issues/1755)
- [Docs: update Kakao OAuth guide with new UI](https://github.com/supabase/supabase/issues/41680)

---

### 6. Naver OAuth - No Official Supabase Support

**Impact:** MEDIUM - Additional implementation complexity

**What Goes Wrong:**
- Supabase supports Kakao natively but NOT Naver
- Naver and Kakao have nearly equal market share in Korea
- Requires custom OAuth implementation or workarounds
- Missing official documentation increases development time

**Warning Signs:**
- Naver not appearing in Supabase Auth Providers list
- Unable to find Naver configuration in Supabase Dashboard
- PROJECT.md lists Naver as requirement but no clear path

**Prevention Strategy:**
- Verify Naver support status in Supabase before committing to roadmap
- Check for community packages or custom OAuth implementations
- Consider using Supabase's generic OAuth provider support
- Alternative: Start with Google + Kakao, add Naver in v2 if still unsupported

**Phase to Address:** Phase 2 (OAuth Integration - Planning)
- Research current Naver OAuth support BEFORE implementing
- Budget extra time if custom implementation needed
- Document workaround approach if using generic OAuth

**References:**
- [Support Auth Provider: Naver discussion](https://github.com/orgs/supabase/discussions/35631)

---

## Email Verification Pitfalls

### 7. Wrong Callback Route for Email Verification

**Impact:** MEDIUM - Email confirmations fail silently

**What Goes Wrong:**
- Developers use `/auth/callback` for email confirmations
- `/auth/callback` is designed for OAuth PKCE flow, not email verification
- Email confirmations should use `/auth/confirm` route
- Session returned in URL fragments, not accessible server-side

**Warning Signs:**
- Email confirmation links redirect but don't authenticate user
- Users click email link but remain logged out
- 404 errors on email confirmation callback
- Can't access session in route handler

**Prevention Strategy:**
```typescript
// Email signup - use /auth/confirm
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    emailRedirectTo: `${origin}/auth/confirm`
  }
})

// OAuth - use /auth/callback
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback`
  }
})
```

**Phase to Address:** Phase 1 (Auth Infrastructure Setup)
- Create separate route handlers for `/auth/confirm` and `/auth/callback`
- Document which route is for which auth flow

**References:**
- [Redirect URLs | Supabase Docs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Redirect after email verification](https://github.com/orgs/supabase/discussions/7076)

---

### 8. Email Redirect URL Not in Allow List

**Impact:** HIGH - Email verification completely blocked

**What Goes Wrong:**
- Email redirect URLs must be whitelisted in Supabase Dashboard
- Production URLs work but email verification redirects to localhost
- Vercel preview deployments have different URLs each time
- Email template uses `{{ .SiteURL }}` instead of `{{ .RedirectTo }}`

**Warning Signs:**
- Email confirmation links redirect to `http://localhost:3000` in production
- "Invalid redirect URL" errors
- Email verification works locally but not in production
- Different behavior between development and deployed environments

**Prevention Strategy:**
1. Add ALL redirect URLs to Supabase Dashboard > Authentication > URL Configuration:
   - `http://localhost:3000/auth/confirm` (development)
   - `https://yourdomain.com/auth/confirm` (production)
   - `https://*.vercel.app/auth/confirm` (preview deployments - if supported)

2. Set Site URL to production domain: `https://yourdomain.com`

3. Update email templates to use `{{ .RedirectTo }}` instead of `{{ .SiteURL }}`

**Phase to Address:** Phase 3 (Email Verification)
- Configure all redirect URLs before testing email verification
- Test email flow in local, preview, and production environments

**References:**
- [Why am I being redirected to the wrong URL](https://supabase.com/docs/guides/troubleshooting/why-am-i-being-redirected-to-the-wrong-url-when-using-auth-redirectto-option-_vqIeO)
- [Always redirects to localhost despite correct URLs](https://github.com/orgs/supabase/discussions/26483)

---

### 9. Email Rate Limiting During Development

**Impact:** LOW - Development slowdown

**What Goes Wrong:**
- Supabase's built-in email provider limits to 2 emails/hour
- Testing signup flows quickly hits rate limit
- Password reset testing blocked after 2 attempts
- Custom SMTP limited to 30 messages/hour initially

**Warning Signs:**
- "Email rate limit exceeded" errors
- Email verification/password reset emails stop sending
- Unable to test email flows repeatedly
- Development blocked waiting for rate limit reset

**Prevention Strategy:**
- Configure CAPTCHA protection to prevent accidental spam
- Use mocked email workflows in local development
- Set up custom SMTP early (before intensive testing)
- For testing: use multiple test email addresses
- Monitor Auth > Rate Limits in Supabase Dashboard

**Phase to Address:** Phase 3 (Email Verification)
- Configure CAPTCHA before opening signup to testing
- Document rate limits for QA team
- Consider custom SMTP if doing extensive email testing

**References:**
- [Rate limits | Supabase Docs](https://supabase.com/docs/guides/auth/rate-limits)
- [Overcoming Authentication Limits in Development](https://medium.com/@tempmailwithpassword/overcoming-authentication-limits-in-supabase-while-in-development-c035b28b5253)

---

## Next.js App Router Specific Pitfalls

### 10. React Hydration Errors with Auth State

**Impact:** MEDIUM - UI inconsistencies and console errors

**What Goes Wrong:**
- Server Components don't have access to localStorage/cookies initially
- Server renders "logged out" state
- Client hydrates and detects user from localStorage
- React throws hydration mismatch error
- UI flickers between logged in/out states

**Warning Signs:**
- Console error: "Text content does not match server-rendered HTML"
- Login/logout button flickers on page load
- User avatar appears then disappears then reappears
- Hydration error specifically on auth-dependent UI elements

**Prevention Strategy:**
```typescript
// WRONG - Causes hydration error
export default function Nav() {
  const [user] = useState(() => supabase.auth.getUser());
  return user ? <LogoutButton /> : <LoginButton />;
}

// CORRECT - Wait for client-side mount
export default function Nav() {
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (!isMounted) return <NavSkeleton />;
  return user ? <LogoutButton /> : <LoginButton />;
}

// BETTER - Fetch in Server Component, pass to Client Component
// server-component.tsx
const { data: { user } } = await supabase.auth.getUser();
return <ClientNav user={user} />;
```

**Phase to Address:** Phase 1 (Auth Infrastructure Setup)
- Plan auth state management strategy before building UI
- Create reusable auth context/hooks with hydration handling

**References:**
- [Hydration errors in NextJS User Auth guide](https://github.com/supabase/supabase/issues/15145)
- [Managing Supabase Auth State Across Server & Client Components](https://dev.to/jais_mukesh/managing-supabase-auth-state-across-server-client-components-in-nextjs-2h2b)

---

### 11. Environment-Specific OAuth Redirects

**Impact:** HIGH - OAuth fails in production/preview

**What Goes Wrong:**
- Hardcoded OAuth redirect URLs (`http://localhost:3000`)
- Works in development, breaks in production
- Vercel preview deployments have dynamic URLs
- Redirect URL must exactly match Supabase allow list

**Warning Signs:**
- OAuth works locally but fails in production
- OAuth callback returns "redirect_uri_mismatch" error
- Preview deployments can't authenticate
- Different behavior across Vercel environments

**Prevention Strategy:**
```typescript
// CORRECT - Dynamic redirect based on environment
const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Production
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Vercel preview
    'http://localhost:3000'; // Development

  url = url.startsWith('http') ? url : `https://${url}`;
  url = url.endsWith('/') ? url : `${url}/`;
  return url;
};

// Use in OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${getURL()}auth/callback`
  }
});
```

**Configuration in Supabase Dashboard:**
- Site URL: `https://cafes-seoul.com` (production)
- Additional Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://cafes-seoul.com/auth/callback`
  - `https://*.vercel.app/auth/callback` (if wildcards supported)

**Phase to Address:** Phase 2 (OAuth Integration)
- Create environment-aware URL utility before implementing OAuth
- Test in all three environments (local, preview, production)

**References:**
- [signInWithOAuth always redirects to localhost in production](https://github.com/supabase/supabase/issues/12941)
- [Fixing Google OAuth Redirection with Local and Production](https://llamazookeeper.medium.com/supabase-003-fixing-google-oauth-redirection-when-local-and-production-coexistence-with-nuxt-0c545d3ea4bd)

---

### 12. SignOut Not Clearing Cookies Properly

**Impact:** MEDIUM - Users remain authenticated after logout

**What Goes Wrong:**
- `signOut()` invalidates session but cookies may persist
- JWT remains valid until expiry (even after server-side logout)
- Users appear logged out but RLS queries still succeed
- Middleware may still detect "authenticated" user

**Warning Signs:**
- User logs out but can still access protected routes
- `getSession()` returns user after `signOut()` called
- Need to manually clear cookies with `document.cookie`
- Session persists across browser tabs

**Prevention Strategy:**
```typescript
// CORRECT - Full logout with redirect
export async function signOut() {
  const supabase = createClient();

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Redirect to clear client state and trigger middleware
  router.push('/login');
  router.refresh(); // Force full page refresh
}
```

**Middleware consideration:**
- Ensure middleware runs on `/login` route to clear any stale cookies
- Use `getUser()` not `getSession()` to verify logout state

**Phase to Address:** Phase 4 (Logout Implementation)
- Test logout thoroughly with network inspection
- Verify cookies are cleared in DevTools
- Test across multiple tabs/windows

**References:**
- [signOut not deleting cookie](https://github.com/supabase/gotrue-js/issues/46)
- [signOut() not working](https://github.com/orgs/supabase/discussions/9639)

---

## Migration and Package Pitfalls

### 13. Using Deprecated `@supabase/auth-helpers` Package

**Impact:** LOW - Missing bug fixes and features

**What Goes Wrong:**
- Old tutorials reference `@supabase/auth-helpers-nextjs`
- Package is deprecated in favor of `@supabase/ssr`
- Bug fixes and new features only in `@supabase/ssr`
- Breaking changes between packages

**Warning Signs:**
- Installing `@supabase/auth-helpers` or `@supabase/auth-helpers-nextjs`
- Following tutorials from 2023 or earlier
- Missing features mentioned in recent Supabase docs

**Prevention Strategy:**
- ONLY use `@supabase/ssr` (already in your package.json ✓)
- Avoid tutorials that import from `@supabase/auth-helpers`
- Check package.json before following any auth tutorial

**Phase to Address:** Already Resolved
- Your project already uses `@supabase/ssr@0.8.0` ✓
- No action needed, just awareness

**References:**
- [How to Migrate from Auth Helpers to SSR package](https://supabase.com/docs/guides/troubleshooting/how-to-migrate-from-supabase-auth-helpers-to-ssr-package-5NRunM)

---

## Internationalization Pitfalls

### 14. i18n Email Templates Not Configured

**Impact:** MEDIUM - Poor UX for Korean users

**What Goes Wrong:**
- Default Supabase emails are in English only
- Korean users receive English verification emails
- Magic link text, button labels, support links all in English
- Reduces trust and conversion for Korean audience

**Warning Signs:**
- Email templates not customized in Supabase Dashboard
- Korean test users confused by English emails
- Mismatch between app language (Korean) and email language (English)

**Prevention Strategy:**
1. Customize email templates in Supabase Dashboard > Authentication > Email Templates
2. Create Korean versions of:
   - Confirmation email (signup verification)
   - Password reset email
   - Magic link email (if used)
   - Email change confirmation

3. Consider dynamic template selection based on user's language preference:
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { language: 'ko' }, // Store user language preference
    emailRedirectTo: `${getURL()}auth/confirm`
  }
});
```

4. Test emails in both Korean and English before launch

**Phase to Address:** Phase 3 (Email Verification)
- Customize templates when implementing email verification
- Get Korean translations reviewed by native speaker

**References:**
- [Email Templates | Supabase Docs](https://supabase.com/docs/guides/auth/auth-email-templates)

---

## Summary: Phase Mapping

| Phase | Pitfalls to Address |
|-------|---------------------|
| **Phase 1: Auth Infrastructure** | #1 (getUser vs getSession), #3 (Middleware matcher), #7 (Route structure), #10 (Hydration errors) |
| **Phase 2: OAuth Integration** | #2 (Cookie sizes), #4 (Kakao email scope), #5 (Kakao API keys), #6 (Naver support), #11 (Environment redirects) |
| **Phase 3: Email Verification** | #8 (Redirect allow list), #9 (Rate limiting), #14 (i18n templates) |
| **Phase 4: Session Management** | #12 (SignOut cookie clearing) |
| **Ongoing** | #13 (Use correct packages) - Already resolved ✓ |

---

## Quality Gate Checklist

- [x] Pitfalls are specific to Supabase Auth + Next.js (not generic advice)
- [x] Korean OAuth provider specific issues documented (Kakao #4, #5, Naver #6)
- [x] Prevention strategies are actionable (code examples provided)
- [x] Warning signs help detect issues early (observable symptoms listed)
- [x] Phase mapping connects pitfalls to roadmap execution
- [x] References link to source documentation and issues

---

*Research completed: 2026-01-27*
*Based on: Supabase Auth SSR docs, GitHub issues, community discussions, and Next.js 16 App Router patterns*
