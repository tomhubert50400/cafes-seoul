# Phase 17: Password & Preferences - Research

**Researched:** 2026-02-01
**Domain:** Authentication security & user preferences management
**Confidence:** HIGH

## Summary

This phase implements password reset functionality via email and toggleable notification preferences. The research focused on Supabase Auth's built-in password reset flow, password strength validation libraries, user preferences data modeling, and UI component patterns for settings interfaces.

Supabase Auth provides a two-step password reset workflow: (1) `resetPasswordForEmail()` sends a recovery link, (2) `updateUser({ password })` sets the new password after the user clicks the link. The system automatically terminates all sessions when a password is updated, requiring users to re-authenticate for security. For password strength visualization, the project already has `@zxcvbn-ts/core` installed, which provides realistic password strength estimation with scores 0-4 based on guessing complexity. For notification preferences, the key-value pattern (user_id, setting_name, setting_value with UNIQUE constraint) is the PostgreSQL best practice for flexible user settings.

The user decisions from CONTEXT.md lock in several implementation details: password reset available from both login and settings pages, visual strength meter with color-coded feedback, iOS-style toggle switches for notification preferences with auto-save, and sub-tab navigation within settings (Profile | Security | Notifications).

**Primary recommendation:** Use Supabase's built-in password reset flow with `resetPasswordForEmail()` and `updateUser()`, validate password strength with the already-installed `@zxcvbn-ts/core`, implement notification preferences as a key-value table in Postgres, and use `@radix-ui/react-switch` (already installed) for toggle controls.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | 0.8.0 | Auth session management | Project standard for Next.js App Router auth |
| @supabase/supabase-js | 2.93.1 | Auth API (resetPasswordForEmail, updateUser) | Official Supabase client |
| @zxcvbn-ts/core | 3.0.4 | Password strength estimation | Modern TypeScript rewrite of Dropbox's zxcvbn, already installed |
| @radix-ui/react-switch | 1.2.6 | Toggle switch primitives | Accessible, unstyled primitives, already installed |
| react-hook-form | 7.71.1 | Form state management | Project standard for forms |
| zod | 4.3.6 | Schema validation | Project standard for validation |
| sonner | 2.0.7 | Toast notifications | Project standard for feedback |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @zxcvbn-ts/language-common | 3.0.4 | Base dictionaries for password checking | Required dependency for @zxcvbn-ts/core |
| @zxcvbn-ts/language-en | 3.0.4 | English language dictionary | Better password strength detection |
| next-intl | (current) | Internationalization | Translate password requirements and notification labels |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @zxcvbn-ts/core | Original zxcvbn | TypeScript rewrite is more maintainable, smaller without dictionaries |
| Radix UI Switch | Headless UI Switch | Both viable; Radix already in project, slightly better bundle size |
| Key-value preferences table | JSONB column | Key-value allows indexing, easier migrations; JSONB is simpler but less flexible |

**Installation:**
```bash
# Additional packages needed (core packages already installed)
npm install @zxcvbn-ts/language-common @zxcvbn-ts/language-en
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── [locale]/
│   │   ├── auth/
│   │   │   └── reset-password/
│   │   │       └── page.tsx           # Password reset landing page
│   │   ├── settings/
│   │   │   └── page.tsx               # Settings with sub-tabs
│   │   └── login/
│   │       └── page.tsx               # Forgot password link here
├── components/
│   ├── settings/
│   │   ├── password-section.tsx       # Password reset UI for settings
│   │   ├── notification-preferences.tsx  # Toggle switches
│   │   └── settings-tabs.tsx          # Sub-tab navigation
│   └── ui/
│       ├── password-strength-meter.tsx   # Visual strength indicator
│       └── switch.tsx                 # Radix UI wrapper
└── lib/
    ├── supabase/
    │   └── server-actions.ts          # resetPassword, updatePassword actions
    └── validation/
        └── password-schema.ts         # Zod + zxcvbn integration
```

### Pattern 1: Two-Step Password Reset Flow
**What:** Supabase's built-in password recovery using email magic links
**When to use:** All password reset scenarios (login, settings)
**Example:**
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
// Step 1: Request password reset (Server Action)
'use server'
export async function requestPasswordReset(email: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
  })

  if (error) throw error

  // Always return success to avoid email enumeration
  return { success: true }
}

// Step 2: Update password after redirect
export async function updatePassword(newPassword: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) throw error

  // Sign out all sessions (global scope)
  await supabase.auth.signOut()

  return { success: true }
}
```

### Pattern 2: Password Strength Validation with zxcvbn-ts
**What:** Real-time password strength estimation with visual feedback
**When to use:** Password reset forms, new password input
**Example:**
```typescript
// Source: https://zxcvbn-ts.github.io/zxcvbn/guide/getting-started/
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en'

// Setup once at app initialization
const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
}
zxcvbnOptions.setOptions(options)

// Use in component
function PasswordInput({ value }: { value: string }) {
  const result = zxcvbn(value)
  // result.score: 0-4 (weak to strong)
  // result.feedback.warning: What's wrong
  // result.feedback.suggestions: How to improve

  const strengthColor = ['red', 'orange', 'yellow', 'lime', 'green'][result.score]
  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][result.score]

  return (
    <div>
      <input type="password" value={value} />
      <div className={`strength-meter bg-${strengthColor}-500`}>
        {strengthLabel}
      </div>
    </div>
  )
}
```

### Pattern 3: Notification Preferences Key-Value Table
**What:** Flexible user settings stored as key-value pairs with UNIQUE constraint
**When to use:** User preferences that may change over time
**Example:**
```sql
-- Source: https://basila.medium.com/designing-a-user-settings-database-table-e8084fcd1f67
CREATE TABLE user_notification_preferences (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR NOT NULL,  -- 'cafe_approved', 'cafe_rejected', etc.
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, notification_type)
);

-- Upsert preference (Server Action)
INSERT INTO user_notification_preferences (user_id, notification_type, enabled)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, notification_type)
DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW();
```

### Pattern 4: Sub-Tab Navigation with Query Params
**What:** Client-side tab navigation that updates URL search params
**When to use:** Settings page with Profile | Security | Notifications tabs
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-search-params
'use client'
import { useSearchParams, useRouter } from 'next/navigation'

function SettingsTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'profile'

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-4 border-b">
      <button
        onClick={() => setTab('profile')}
        data-active={activeTab === 'profile'}
      >
        Profile
      </button>
      <button
        onClick={() => setTab('security')}
        data-active={activeTab === 'security'}
      >
        Security
      </button>
      <button
        onClick={() => setTab('notifications')}
        data-active={activeTab === 'notifications'}
      >
        Notifications
      </button>
    </div>
  )
}
```

### Pattern 5: Detecting OAuth vs Email/Password Users
**What:** Check user identities to determine if password section should be shown
**When to use:** Conditionally rendering password reset UI in settings
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/auth-identity-linking
async function shouldShowPasswordSection() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  // Check if user has email provider (not just OAuth)
  const { data: identities } = await supabase.auth.getUserIdentities()

  // OAuth-only users: hide password section
  const hasOAuthOnly = identities?.identities.every(
    identity => identity.provider !== 'email'
  )

  return !hasOAuthOnly
}
```

### Anti-Patterns to Avoid
- **Email enumeration:** Don't reveal if email exists. Always show "Reset link sent" regardless.
- **Long-lived reset tokens:** Don't extend token expiry beyond 1 hour (Supabase default: 24h).
- **Keeping user signed in after password reset:** Always sign out after password update for security.
- **Custom password strength logic:** Don't hand-roll regex-based password validation. Use zxcvbn.
- **Columns for each preference:** Don't add `cafe_approved_email`, `cafe_rejected_email` columns. Use key-value table.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password strength estimation | Regex patterns checking character types | @zxcvbn-ts/core | Realistic estimation based on cracking difficulty, detects patterns, sequences, common passwords |
| Password reset emails | Custom email service with tokens | Supabase resetPasswordForEmail() | Handles token generation, expiry, SMTP, email templates, PKCE flow |
| Toggle switches | Custom checkbox styling | @radix-ui/react-switch (already installed) | Accessibility (keyboard nav, ARIA), focus management, proper semantics |
| User preference storage | JSONB column or multiple columns | Key-value table with UNIQUE constraint | Easier to query, index, migrate, add new preferences without schema changes |
| Session invalidation after password change | Manual token revocation | Supabase automatic session termination | Password updates auto-terminate sessions, built-in security |

**Key insight:** Authentication security has subtle edge cases (timing attacks, token fixation, session hijacking). Supabase Auth handles these. Password strength estimation requires linguistic analysis and pattern detection that regex can't provide. Use battle-tested libraries for security-critical features.

## Common Pitfalls

### Pitfall 1: Email Enumeration Vulnerability
**What goes wrong:** Revealing whether an email exists in the database through different responses.
**Why it happens:** Developers return "Email not found" vs "Reset link sent" to be helpful.
**How to avoid:** Always return the same success message regardless of whether email exists. Handle the check server-side without exposing results.
**Warning signs:** Different response messages, different response times, different HTTP status codes for valid vs invalid emails.

### Pitfall 2: Not Signing Out After Password Reset
**What goes wrong:** User's old session remains active after password change, allowing continued access with old credentials.
**Why it happens:** Forgetting that Supabase automatically terminates sessions on password update, but the client still holds the old access token until expiry.
**How to avoid:** Always call `signOut()` with global scope after `updateUser({ password })` to immediately clear client-side session data and redirect to login.
**Warning signs:** User can still access authenticated pages after password reset, old access tokens work until expiry.

### Pitfall 3: Missing Language Packages for zxcvbn-ts
**What goes wrong:** Password strength meter returns inaccurate scores or crashes.
**Why it happens:** Installing only `@zxcvbn-ts/core` without the required language dictionaries.
**How to avoid:** Install `@zxcvbn-ts/language-common` (required) and `@zxcvbn-ts/language-en` (recommended). Call `zxcvbnOptions.setOptions()` before first use.
**Warning signs:** zxcvbn returns score 0 for all passwords, throws errors about missing dictionaries.

### Pitfall 4: OAuth Users Seeing Password Reset UI
**What goes wrong:** Google/Kakao OAuth users see "Change Password" section that doesn't work.
**Why it happens:** Not checking user's authentication provider before rendering password UI.
**How to avoid:** Use `getUserIdentities()` to check if user has email provider. Hide password section for OAuth-only users.
**Warning signs:** OAuth users reporting password reset doesn't work, confusion about password requirements.

### Pitfall 5: Hard-Coded Redirect URLs in resetPasswordForEmail
**What goes wrong:** Password reset links redirect to localhost or wrong environment.
**Why it happens:** Using hard-coded URLs instead of environment variables.
**How to avoid:** Use `process.env.NEXT_PUBLIC_SITE_URL` for redirect URLs. Configure allowed redirect URLs in Supabase dashboard.
**Warning signs:** Password reset works in dev but fails in production, links redirect to localhost.

### Pitfall 6: Password Strength Validation Only on Client
**What goes wrong:** Users bypass client-side validation by calling API directly with weak passwords.
**Why it happens:** Only validating password strength in React component, not in Server Action.
**How to avoid:** Run zxcvbn validation in both client (for UX) and server (for security). Reject weak passwords (score < 2) in Server Action.
**Warning signs:** Users can create accounts with weak passwords despite strength meter showing weak.

### Pitfall 7: Generic Password Requirements Error Messages
**What goes wrong:** Users don't understand why their password was rejected.
**Why it happens:** Showing "Password must be 8+ characters with complexity" without specifics.
**How to avoid:** Use `result.feedback.suggestions` from zxcvbn to show actionable guidance. Show requirements as checklist that updates as user types.
**Warning signs:** High password reset failure rate, support tickets about password requirements.

## Code Examples

Verified patterns from official sources:

### Password Reset Request with Email Enumeration Protection
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
// https://www.smashingmagazine.com/2022/08/implementing-reset-password-feature-nextjs-dynamic-routes/
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const resetSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function requestPasswordReset(formData: FormData) {
  const parsed = resetSchema.safeParse({
    email: formData.get('email')
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = createClient()

  // Don't check if email exists - always succeed to avoid enumeration
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
  })

  // Always return success, never reveal if email exists
  return {
    success: true,
    message: 'If that email exists, a reset link has been sent.'
  }
}
```

### Password Update with Session Termination
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-updateuser
// https://supabase.com/docs/guides/auth/signout
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { zxcvbn } from '@zxcvbn-ts/core'

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((password) => {
      const result = zxcvbn(password)
      return result.score >= 2
    }, 'Password is too weak')
})

export async function updatePassword(newPassword: string) {
  const parsed = passwordSchema.safeParse({ password: newPassword })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    return { error: { password: [error.message] } }
  }

  // Sign out globally (all sessions) after password change
  await supabase.auth.signOut({ scope: 'global' })

  redirect('/login?message=Password updated. Please sign in.')
}
```

### Password Strength Meter Component
```typescript
// Source: https://zxcvbn-ts.github.io/zxcvbn/guide/framework-examples/
'use client'

import { zxcvbn } from '@zxcvbn-ts/core'
import { useMemo } from 'react'

interface PasswordStrengthMeterProps {
  password: string
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const result = useMemo(() => {
    if (!password) return null
    return zxcvbn(password)
  }, [password])

  if (!result || !password) return null

  const colors = ['red', 'orange', 'yellow', 'lime', 'green']
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']

  const color = colors[result.score]
  const label = labels[result.score]
  const width = ((result.score + 1) / 5) * 100

  return (
    <div className="mt-2 space-y-1">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-${color}-500 transition-all duration-300`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex justify-between text-sm">
        <span className={`text-${color}-600 font-medium`}>{label}</span>
        {result.feedback.warning && (
          <span className="text-gray-600">{result.feedback.warning}</span>
        )}
      </div>
      {result.feedback.suggestions.length > 0 && (
        <ul className="text-xs text-gray-500 list-disc list-inside">
          {result.feedback.suggestions.map((suggestion, i) => (
            <li key={i}>{suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Notification Preferences Toggle
```typescript
// Source: https://headlessui.com/react/switch
// https://www.radix-ui.com/docs/primitives/components/switch
'use client'

import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import { toast } from 'sonner'

interface NotificationToggleProps {
  userId: string
  type: 'cafe_approved' | 'cafe_rejected' | 'photo_approved' | 'photo_rejected'
  initialEnabled: boolean
}

export function NotificationToggle({
  userId,
  type,
  initialEnabled
}: NotificationToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggle = async (newValue: boolean) => {
    setIsUpdating(true)
    setEnabled(newValue)

    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, enabled: newValue })
      })

      if (!response.ok) throw new Error('Failed to update')

      toast.success('Preference updated', { duration: 2000 })
    } catch (error) {
      setEnabled(!newValue) // Revert on error
      toast.error('Failed to update preference')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium">{formatType(type)}</p>
        <p className="text-sm text-muted-foreground">
          Receive email when {formatDescription(type)}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
    </div>
  )
}

function formatType(type: string) {
  return type.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function formatDescription(type: string) {
  const descriptions = {
    cafe_approved: 'your cafe submission is approved',
    cafe_rejected: 'your cafe submission is rejected',
    photo_approved: 'your photo submission is approved',
    photo_rejected: 'your photo submission is rejected'
  }
  return descriptions[type as keyof typeof descriptions]
}
```

### Check if User Has Email Provider
```typescript
// Source: https://supabase.com/docs/guides/auth/auth-identity-linking
import { createClient } from '@/lib/supabase/server'

export async function hasPasswordAuth() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: identities } = await supabase.auth.getUserIdentities()
  if (!identities?.identities) return false

  // Check if user has email provider (not just OAuth)
  const hasEmailProvider = identities.identities.some(
    identity => identity.provider === 'email'
  )

  return hasEmailProvider
}

// Usage in Settings page
export default async function SecurityTab() {
  const canChangePassword = await hasPasswordAuth()

  return (
    <div>
      {canChangePassword ? (
        <PasswordResetSection />
      ) : (
        <p className="text-muted-foreground">
          You signed in with a social provider. Password reset is not available.
        </p>
      )}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| zxcvbn (original) | @zxcvbn-ts/core | 2020+ | TypeScript rewrite, better tree-shaking, modular dictionaries, smaller bundle without dictionaries |
| Manual password reset tokens | Supabase resetPasswordForEmail | Supabase Auth GA 2021 | Built-in PKCE flow, automatic token expiry, email template management, no custom token logic |
| JSONB user settings column | Key-value preferences table | Ongoing best practice | Easier indexing, querying, migrations; PostgreSQL best practice for flexible schemas |
| Headless UI 1.x | Headless UI 2.x (data attributes) | 2024 | Simpler styling with data-* attributes instead of render props |
| Pages Router auth | App Router with Server Actions | Next.js 13+ | Server-side auth mutations, better security, no API routes needed |

**Deprecated/outdated:**
- **getSession() for auth checks:** Use `getUser()` instead. getSession() only checks JWT validity, doesn't verify user exists in database.
- **Client-side password reset:** All password mutations should use Server Actions to prevent token exposure in client code.
- **Hard-coded redirect URLs:** Use environment variables and configure allowed URLs in Supabase dashboard.

## Open Questions

Things that couldn't be fully resolved:

1. **Password reset token expiry customization**
   - What we know: Supabase default is 24 hours for email links
   - What's unclear: Can this be customized to 1 hour for better security?
   - Recommendation: Use default 24h for UX, rely on one-time use to prevent replay attacks

2. **Rate limiting for password reset requests**
   - What we know: Supabase has built-in rate limiting, default 30 emails/hour with custom SMTP
   - What's unclear: Is this per-user or global? Can it be customized?
   - Recommendation: Assume adequate built-in protection, add custom rate limiting if needed after testing

3. **Notification preferences default state migration**
   - What we know: New users should have all notifications ON (opt-out model)
   - What's unclear: How to handle existing users who don't have preference rows?
   - Recommendation: Use COALESCE in queries to default to true when row doesn't exist, or create preferences on first settings page visit

4. **Password strength threshold for acceptance**
   - What we know: zxcvbn scores 0-4, user decided 8+ chars with complexity
   - What's unclear: Should we require score >= 2, or allow score 1 with warning?
   - Recommendation: Require score >= 2 (somewhat guessable), show warning for score 3-4 recommendation

## Sources

### Primary (HIGH confidence)
- Supabase Auth resetPasswordForEmail API - https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
- Supabase Auth updateUser API - https://supabase.com/docs/reference/javascript/auth-updateuser
- Supabase Password-based Auth Guide - https://supabase.com/docs/guides/auth/passwords
- Supabase Identity Linking - https://supabase.com/docs/guides/auth/auth-identity-linking
- Supabase Session Management - https://supabase.com/docs/guides/auth/sessions
- Supabase Sign Out Guide - https://supabase.com/docs/guides/auth/signout
- Supabase Rate Limits - https://supabase.com/docs/guides/auth/rate-limits
- zxcvbn-ts Getting Started - https://zxcvbn-ts.github.io/zxcvbn/guide/getting-started/
- zxcvbn-ts Framework Examples - https://zxcvbn-ts.github.io/zxcvbn/guide/framework-examples/
- Headless UI Switch - https://headlessui.com/react/switch
- Next.js useSearchParams - https://nextjs.org/docs/app/api-reference/functions/use-search-params
- Next.js Intercepting Routes - https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes

### Secondary (MEDIUM confidence)
- [Designing a User Settings Database Table](https://basila.medium.com/designing-a-user-settings-database-table-e8084fcd1f67) - Key-value pattern for user preferences
- [Implementing Reset Password with Next.js](https://www.smashingmagazine.com/2022/08/implementing-reset-password-feature-nextjs-dynamic-routes/) - Email enumeration protection
- [Next.js password reset security](https://medium.com/@sanyamm/complete-guide-password-reset-and-authentication-in-next-js-with-auth-js-nextauth-v5-fcf540b2a8fb) - Common security mistakes
- [zxcvbn-ts GitHub](https://github.com/zxcvbn-ts/zxcvbn) - Modern TypeScript alternative to original zxcvbn
- [Password strength meter React libraries](https://www.npmjs.com/package/react-password-strength-bar) - Community implementations

### Tertiary (LOW confidence)
- Web search results for iOS toggle patterns - General UI patterns, not specific to implementation
- Web search results for tab navigation - Community patterns, prefer official Next.js docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs, versions checked in package.json
- Architecture: HIGH - Patterns from official Supabase and Next.js documentation
- Pitfalls: HIGH - Based on official security guides and documented gotchas
- Code examples: HIGH - All examples sourced from official documentation with URLs

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable authentication domain, but Supabase updates frequently)
