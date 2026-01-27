# Phase 02 User Setup Guide

**Required for:** Email verification to work correctly

## Supabase Email Template Configuration

### 1. Update Email Template for PKCE Flow

The email verification route (`/auth/confirm`) requires the Supabase email template to be configured for PKCE flow.

**Steps:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `vanplvqjmmwgawuibhdg`
3. Navigate to: **Authentication** → **Email Templates**
4. Select: **Confirm signup** template
5. Replace the confirmation URL section with:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
```

**Default template (won't work):**
```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

**Why:** The default `{{ .ConfirmationURL }}` doesn't work with PKCE flow. We need explicit `token_hash` parameter.

### 2. Configure Redirect URLs

Add your application URLs to the Supabase allow list:

1. Go to: **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/confirm` (development)
   - `https://your-production-domain.com/auth/confirm` (production)
   - `https://*.vercel.app/auth/confirm` (Vercel preview URLs)

**Why:** Supabase only allows redirects to whitelisted URLs for security.

### 3. Set Site URL

1. Go to: **Authentication** → **URL Configuration**
2. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: `https://your-production-domain.com`

**Why:** `{{ .SiteURL }}` in email template uses this value.

## Environment Variables

Already configured in `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Used for emailRedirectTo in Server Actions
NEXT_PUBLIC_SUPABASE_URL=https://vanplvqjmmwgawuibhdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**For production:** Update `NEXT_PUBLIC_APP_URL` to your production domain.

## Verification

### Test Signup Flow

1. Start development server:
   ```bash
   npm run dev
   ```

2. Sign up with a test email (use a real email you can access)

3. Check email inbox for "Confirm your email" message

4. Click the confirmation link - should redirect to `http://localhost:3000/auth/confirm?token_hash=...&type=email`

5. Should auto-login and redirect to home page (`/`)

### Expected Behavior

**Success:**
- Email received with correct link format
- Clicking link redirects through `/auth/confirm`
- User auto-logged in (session cookie set)
- Redirected to home page

**Failure indicators:**
- Email link has wrong format (missing `token_hash`)
- 404 error on `/auth/confirm`
- Redirect to `/login?error=Unable to verify email`
- "Redirect URL not whitelisted" error

### Troubleshooting

**Email not received:**
- Check Supabase logs: **Authentication** → **Logs**
- Verify email settings: **Project Settings** → **Auth** → **SMTP Settings**
- Default uses Supabase SMTP (works for development)

**Link doesn't work:**
- Verify email template updated (step 1)
- Check redirect URL whitelist (step 2)
- Inspect link in email - should have `token_hash` and `type` params

**"Unable to verify email" error:**
- Token may be expired (valid for 24 hours by default)
- Try resend verification (when form UI is built in 02-03)
- Check Supabase auth logs for specific error

## Production Checklist

Before deploying to production:

- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Add production domain to Supabase redirect URL whitelist
- [ ] Set Supabase Site URL to production domain
- [ ] Test email verification flow in production
- [ ] (Optional) Configure custom SMTP for better deliverability

---
*Created: 2026-01-27*
*Phase: 02-email-password-auth*
