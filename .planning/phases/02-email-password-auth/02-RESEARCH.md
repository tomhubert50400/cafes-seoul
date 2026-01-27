# Phase 2: Email/Password Authentication - Research

**Researched:** 2026-01-27
**Domain:** Supabase Auth with Next.js 15 App Router
**Confidence:** HIGH

## Summary

Email/password authentication with Supabase in Next.js 15 uses Server Actions for form submission, React Hook Form with Zod for validation, and Supabase's built-in email verification flow. The modern pattern combines server-side security with client-side UX through the `useActionState` hook (React 19+), avoiding traditional API routes in favor of direct Server Action calls.

Phase 1 already established Supabase clients (browser singleton, server-side with cookie management) and middleware for session refresh. Phase 2 builds on this foundation by adding:
- Signup/login Server Actions with Zod validation
- Email verification route handler (`/auth/confirm`) for PKCE flow
- Form components using React Hook Form + shadcn/ui patterns
- Password strength feedback with zxcvbn-ts
- Toast notifications using sonner (already installed)

The standard approach uses **no client-side state management** for auth - Server Actions handle all mutations, middleware manages sessions, and Server Components check auth status.

**Primary recommendation:** Use Server Actions for signup/login/logout, React Hook Form for client-side UX, and Supabase's native email verification flow with custom redirect handling.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.93.1 | Supabase client | Already installed (Phase 1), handles auth API |
| @supabase/ssr | 0.8.0 | SSR helpers | Already installed (Phase 1), cookie-based sessions |
| react-hook-form | ^7.54.0 | Form state management | Industry standard for React forms, minimal re-renders |
| zod | 4.3.6 | Schema validation | Already installed, TypeScript-first validation |
| @hookform/resolvers | ^3.9.0 | RHF + Zod integration | Official resolver for Zod schemas |
| zxcvbn-ts | ^4.0.0 | Password strength estimation | Modern TypeScript rewrite of Dropbox's zxcvbn |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications | Already installed, for success/error feedback |
| lucide-react | 0.563.0 | Icons | Already installed, for Eye icon (password visibility) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Actions | API Routes | API routes add boilerplate; Server Actions are Next.js 15 standard |
| React Hook Form | Formik | Formik has more re-renders and bundle size |
| zxcvbn-ts | check-password-strength | zxcvbn provides realistic strength estimation vs simple rule checking |
| sonner | react-hot-toast | sonner has better TypeScript support and shadcn/ui integration |

**Installation:**
```bash
npm install react-hook-form @hookform/resolvers zxcvbn-ts
npm install --save-dev @types/react-hook-form
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page (Client Component)
│   │   ├── signup/
│   │   │   └── page.tsx          # Signup page (Client Component)
│   │   └── layout.tsx            # Auth layout (minimal header)
│   ├── auth/
│   │   └── confirm/
│   │       └── route.ts          # Email verification handler (Route Handler)
│   └── actions/
│       └── auth.ts               # Server Actions (signup, login, logout)
├── components/
│   ├── auth/
│   │   ├── signup-form.tsx       # Signup form with validation
│   │   ├── login-form.tsx        # Login form with validation
│   │   └── password-strength-meter.tsx  # Visual strength indicator
│   └── ui/
│       └── (shadcn components)   # Already exists
└── lib/
    ├── supabase/
    │   ├── client.ts             # Already exists
    │   ├── server.ts             # Already exists
    │   └── middleware.ts         # Already exists (may need update)
    └── validations/
        └── auth.ts               # Zod schemas for auth forms
```

### Pattern 1: Server Actions for Auth Mutations
**What:** Server Actions handle all auth operations (signup, login, logout) without API routes
**When to use:** All form submissions in Next.js 15 App Router
**Example:**
```typescript
// Source: Next.js official docs + Supabase auth patterns
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signupSchema } from '@/lib/validations/auth'

export async function signup(prevState: any, formData: FormData) {
  // 1. Validate input with Zod
  const validatedFields = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields',
    }
  }

  const { email, password } = validatedFields.data

  // 2. Call Supabase Auth
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  })

  if (error) {
    return {
      message: error.message,
      errors: {},
    }
  }

  // 3. Redirect on success (triggers navigation)
  redirect('/?message=Check your email to confirm your account')
}
```

### Pattern 2: Client Component with useActionState
**What:** Forms use `useActionState` to call Server Actions and handle loading/error states
**When to use:** All auth forms in Client Components
**Example:**
```typescript
// Source: Next.js 15 forms documentation
'use client'

import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, null)

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      {state?.errors?.email && <p>{state.errors.email}</p>}

      <input name="password" type="password" required />
      {state?.errors?.password && <p>{state.errors.password}</p>}

      <button disabled={isPending}>
        {isPending ? 'Creating account...' : 'Sign up'}
      </button>

      {state?.message && <p>{state.message}</p>}
    </form>
  )
}
```

### Pattern 3: React Hook Form for Enhanced UX
**What:** Use RHF for real-time validation, password strength, and better UX
**When to use:** When you need onBlur validation, field-level feedback, or custom UI controls
**Example:**
```typescript
// Source: shadcn/ui React Hook Form documentation
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema } from '@/lib/validations/auth'

export function SignupForm() {
  const form = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur', // Validate on blur, not every keystroke
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: z.infer<typeof signupSchema>) {
    // Call Server Action directly
    const result = await signup(null, new FormData(data))
    if (result?.errors) {
      // Set server errors back to form
      Object.entries(result.errors).forEach(([field, message]) => {
        form.setError(field as any, { message: message as string })
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <p>{form.formState.errors.email.message}</p>
      )}
      {/* ... */}
    </form>
  )
}
```

### Pattern 4: Email Verification Route Handler
**What:** PKCE flow requires token exchange endpoint at `/auth/confirm`
**When to use:** Always, for email verification links
**Example:**
```typescript
// Source: Supabase Next.js SSR documentation
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // Auto-login successful - redirect to home
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Error - redirect to login with error message
  return NextResponse.redirect(
    new URL('/login?error=Unable to verify email', request.url)
  )
}
```

### Pattern 5: Password Strength Meter
**What:** Real-time password strength feedback using zxcvbn-ts
**When to use:** Signup form only (not login)
**Example:**
```typescript
// Source: zxcvbn-ts documentation + community patterns
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import { useEffect, useState } from 'react'

export function PasswordStrengthMeter({ password }: { password: string }) {
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    if (password) {
      const result = zxcvbn(password)
      setStrength(result.score) // 0-4
    } else {
      setStrength(0)
    }
  }, [password])

  const colors = ['bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <div>
      <div className="flex gap-1 h-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded ${i <= strength ? colors[strength] : 'bg-muted'}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {password ? labels[strength] : ''}
      </p>
    </div>
  )
}
```

### Pattern 6: Middleware Email Verification Check
**What:** Block unverified users from protected routes
**When to use:** Update existing middleware to check `user.email_confirmed_at`
**Example:**
```typescript
// Source: Supabase patterns + Phase context requirements
const { data: { user } } = await supabase.auth.getUser()

// Check if user is trying to access protected routes
if (isProtectedPath && user) {
  if (!user.email_confirmed_at) {
    // User exists but email not verified - redirect to login with message
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'Please verify your email first')
    return NextResponse.redirect(url)
  }
}
```

### Anti-Patterns to Avoid

- **Using getSession() in server code:** Always use `getUser()` or `getClaims()` - `getSession()` doesn't validate JWT signatures and creates security vulnerabilities
- **Storing session in client state:** Don't use React state for auth - cookies + middleware is the standard pattern
- **Building custom token refresh logic:** Use Supabase's built-in refresh via middleware, never manual
- **Using service_role key in client:** Service role bypasses RLS - keep it server-only
- **onChange validation for passwords:** Causes too many re-renders - use onBlur or onSubmit
- **Throwing errors from Server Actions:** Return error objects instead of throwing - enables better UX
- **Mixing API routes and Server Actions:** Pick one pattern (Server Actions are standard in Next.js 15)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password strength estimation | Simple character counting | zxcvbn-ts | Realistic estimation using entropy, dictionary attacks, patterns - catches "Password123!" as weak |
| Form validation | Manual useState + error handling | React Hook Form + Zod | Handles field state, touched/dirty tracking, async validation, error mapping |
| Session management | Manual cookie reading/writing | @supabase/ssr with middleware | Handles refresh tokens, PKCE flow, cookie security flags automatically |
| Email verification flow | Custom token generation + expiry | Supabase Auth email verification | Built-in secure tokens, templates, expiry, rate limiting |
| Password visibility toggle | Custom show/hide logic | Input type swap + Lucide Eye icon | Accessibility built-in (aria-pressed, keyboard support) |
| Toast notifications | Custom toast component | sonner | Stacking, animations, dismissal, promise handling, accessibility |
| Email validation | Regex patterns | Zod .email() | Handles edge cases (internationalized domains, plus addressing, etc.) |

**Key insight:** Authentication is security-critical - using battle-tested libraries prevents subtle bugs (token expiry edge cases, refresh race conditions, CSRF vulnerabilities). The ecosystem has mature solutions; custom implementations create risk without benefit.

## Common Pitfalls

### Pitfall 1: Not Configuring Email Redirect URL
**What goes wrong:** Email verification links fail with 404 or redirect to localhost in production
**Why it happens:** Supabase email templates use `{{ .ConfirmationURL }}` by default, which doesn't work with PKCE flow
**How to avoid:**
1. Update email template to use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
2. Configure redirect URLs in Supabase dashboard (Settings > Auth > URL Configuration)
3. Add production domains to allow list (supports wildcards for preview URLs)
**Warning signs:** Email links return 404, or users report "Unable to verify" errors

### Pitfall 2: Blocking Unverified Users in Wrong Place
**What goes wrong:** Users can't access verification link or get stuck in redirect loops
**Why it happens:** Checking email verification in middleware before the `/auth/confirm` route runs
**How to avoid:**
- Allow `/auth/confirm` route without verification check
- Block unverified users at protected routes (`/profile`, `/favorites`) in middleware
- Show "resend verification" option on login page for unverified users
**Warning signs:** Users report "can't verify email" or "link doesn't work"

### Pitfall 3: Using getSession() in Middleware
**What goes wrong:** Session data becomes stale, users appear logged out randomly
**Why it happens:** `getSession()` doesn't validate JWT signatures - returns cached data
**How to avoid:** Always use `getUser()` in middleware and Server Components - validates JWT on every call
**Warning signs:** Users randomly logged out, stale user data, security audit failures

### Pitfall 4: No Loading State on Submit
**What goes wrong:** Users click submit multiple times, creating duplicate accounts or login attempts
**Why it happens:** Form doesn't disable during Server Action execution
**How to avoid:**
- With `useActionState`: Use the `isPending` boolean to disable submit button
- With React Hook Form: Use `form.formState.isSubmitting`
- Show loading spinner or "Creating account..." text
**Warning signs:** Duplicate signup errors, rate limiting triggers, poor UX feedback

### Pitfall 5: Weak Password Requirements
**What goes wrong:** Supabase returns `weak_password` error, blocking signup
**Why it happens:** Supabase has built-in password strength requirements (default: min 8 chars)
**How to avoid:**
- Check project's password requirements in dashboard (Auth > Settings)
- Reflect requirements in Zod schema: `z.string().min(8)`
- Show strength meter to guide users toward stronger passwords
- Display specific requirements ("at least 8 characters")
**Warning signs:** High signup failure rate, users confused by "weak password" errors

### Pitfall 6: Form Doesn't Reset After Success
**What goes wrong:** After signup, form still shows submitted data on back navigation
**Why it happens:** Browser caches form state; Server Actions don't auto-reset forms
**How to avoid:**
- Use `form.reset()` after successful submission (RHF)
- Or use `redirect()` in Server Action to navigate away (standard pattern)
- For inline success messages, manually reset form fields
**Warning signs:** Stale data in forms after navigation, users confused by pre-filled fields

### Pitfall 7: Error Messages Not i18n
**What goes wrong:** Korean users see English error messages from Supabase
**Why it happens:** Supabase errors are English-only; app needs translation layer
**How to avoid:**
- Map Supabase error codes to i18n keys
- Create error message translation dictionary
- Use error codes (not message strings) to look up translations
**Warning signs:** Mixed language errors, user feedback about English errors

### Pitfall 8: Password Strength Runs on Every Keystroke
**What goes wrong:** Performance issues, excessive re-renders
**Why it happens:** Running zxcvbn on every onChange event
**How to avoid:**
- Debounce password strength calculation (300ms)
- Or calculate only onBlur
- Use React.memo for PasswordStrengthMeter component
**Warning signs:** Laggy typing experience, high CPU usage in dev tools

## Code Examples

Verified patterns from official sources:

### Zod Schema for Signup Form
```typescript
// Source: Zod documentation + Supabase password requirements
import { z } from 'zod'

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
```

### Login Server Action with Error Handling
```typescript
// Source: Supabase auth documentation + Next.js Server Actions guide
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema } from '@/lib/validations/auth'

export async function login(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Map Supabase errors to user-friendly messages
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { message: 'Invalid email or password' }
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        message: 'Please verify your email first',
        showResend: true,
        email,
      }
    }
    return { message: error.message }
  }

  // Success - redirect to home
  redirect('/')
}
```

### Logout Server Action
```typescript
// Source: Supabase auth documentation
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

### Complete Login Form with React Hook Form
```typescript
// Source: shadcn/ui form patterns + React Hook Form documentation
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/lib/validations/auth'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const form = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    setServerError('')

    // Call Server Action
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)

    const result = await login(null, formData)

    if (result?.errors) {
      Object.entries(result.errors).forEach(([field, messages]) => {
        form.setError(field as any, { message: messages[0] })
      })
    }

    if (result?.message) {
      setServerError(result.message)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          aria-invalid={!!form.formState.errors.email}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...form.register('password')}
            aria-invalid={!!form.formState.errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Logging in...' : 'Log in'}
      </Button>
    </form>
  )
}
```

### Resend Verification Email
```typescript
// Source: Supabase auth documentation
'use server'

import { createClient } from '@/lib/supabase/server'

export async function resendVerification(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API routes for auth | Server Actions | Next.js 13 (2023), stable in 14-15 | Less boilerplate, automatic revalidation, better DX |
| useFormState | useActionState | React 19 (2024) | Renamed for clarity, same functionality |
| Manual form validation | React Hook Form + Zod | 2022+ standard | Type-safe validation, less custom code |
| zxcvbn (unmaintained) | zxcvbn-ts | ~2023 | TypeScript support, ESM modules, tree-shaking |
| Custom toast systems | sonner | 2023+ | Better DX, stacking, promise handling, a11y |
| Supabase Auth UI | Custom forms + Server Actions | Next.js 13+ | More control, better Next.js integration |

**Deprecated/outdated:**
- **Supabase Auth Helpers (@supabase/auth-helpers-nextjs)**: Replaced by `@supabase/ssr` in 2024 - simpler API, better SSR support
- **getSession() in server code**: Deprecated for security - use getUser() instead
- **Pages Router auth patterns**: App Router patterns are different - middleware is the session boundary

## Open Questions

Things that couldn't be fully resolved:

1. **Toast notification on successful login**
   - What we know: Phase context marks "login success feedback" as Claude's discretion
   - What's unclear: Whether to show toast or silent redirect after login
   - Recommendation: Use silent redirect (standard pattern) - save toasts for errors only. Login success is evident from navigation + logged-in UI state.

2. **Password strength meter thresholds**
   - What we know: zxcvbn returns scores 0-4, context wants "weak/medium/strong" display
   - What's unclear: Exact mapping (is score 2 "medium" or "fair"?)
   - Recommendation: Map scores as: 0-1 = "Weak" (red), 2 = "Fair" (yellow), 3 = "Good" (blue), 4 = "Strong" (green). Show meter only when password field has content.

3. **Resend verification UI placement**
   - What we know: Context says "show on login page if user tries to log in while unverified"
   - What's unclear: How to trigger UI (detect error, or always show button?)
   - Recommendation: Show "Resend verification email" button only when login fails with email_not_confirmed error - cleaner UX than always-visible option.

4. **Loading state during form submission**
   - What we know: Context marks "loading state design" as Claude's discretion
   - What's unclear: Skeleton, spinner, or disabled button with text?
   - Recommendation: Disable button + change text ("Creating account..." / "Logging in...") - maintains layout stability, clear feedback, standard pattern.

5. **Email verification auto-login timing**
   - What we know: Context says "auto-login and redirect to home" after verification
   - What's unclear: Should show success message first, or immediate redirect?
   - Recommendation: Immediate redirect to home + toast notification "Email verified!" - provides feedback without extra clicks.

## Sources

### Primary (HIGH confidence)
- Supabase Email Auth Documentation: https://supabase.com/docs/guides/auth/auth-email (official)
- Supabase Next.js SSR Guide: https://supabase.com/docs/guides/auth/server-side/nextjs (official)
- Supabase Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates (official)
- Supabase Auth Error Codes: https://supabase.com/docs/guides/auth/debugging/error-codes (official)
- Supabase Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls (official)
- Next.js Forms Guide: https://nextjs.org/docs/app/guides/forms (official)
- Next.js Authentication Guide: https://nextjs.org/docs/app/guides/authentication (official)
- React Hook Form Documentation: https://react-hook-form.com/docs/useform (official)
- Zod Documentation: https://zod.dev/ (official, v4)
- shadcn/ui React Hook Form: https://ui.shadcn.com/docs/forms/react-hook-form (official)
- shadcn/ui Form Component: https://ui.shadcn.com/docs/components/form (official)
- shadcn/ui Sonner: https://ui.shadcn.com/docs/components/sonner (official)

### Secondary (MEDIUM confidence)
- Next.js 15 Server Actions Guide (Medium): https://medium.com/@saad.minhas.codes/next-js-15-server-actions-complete-guide-with-real-examples-2026-6320fbfa01c3 (verified with official docs)
- Handling Forms in Next.js (Medium): https://medium.com/@sorayacantos/handling-forms-in-next-js-with-next-form-server-actions-useactionstate-and-zod-validation-15f9932b0a9e (verified with official docs)
- Supabase Best Practices: https://www.leanware.co/insights/supabase-best-practices (verified with official docs)
- Supabase Common Mistakes: https://hrekov.com/blog/supabase-common-mistakes (verified with official docs)
- Sonner Toast Library Guide (Knock): https://knock.app/blog/the-top-notification-libraries-for-react (verified with GitHub)
- React Hook Form + Zod Guide (Contentful): https://www.contentful.com/blog/react-hook-form-validation-zod/ (verified with official docs)
- zxcvbn-ts GitHub: https://github.com/zxcvbn-ts/zxcvbn (official repository)

### Tertiary (LOW confidence)
- Password strength meter tutorials (DigitalOcean, DEV.to) - general patterns, not library-specific
- Community discussions on GitHub - used for context, not recommendations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in official docs, versions checked
- Architecture: HIGH - Patterns from official Next.js, Supabase, and RHF documentation
- Pitfalls: HIGH - Sourced from official Supabase troubleshooting docs and verified community reports
- Code examples: HIGH - Adapted from official documentation sources with proper error handling

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable stack, but Next.js and Supabase iterate quickly)
