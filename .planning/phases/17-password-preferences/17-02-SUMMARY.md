---
phase: 17-password-preferences
plan: 02
completed: 2026-02-01
duration: ~6 min

subsystem: auth-password
tags: [password-reset, zxcvbn, server-actions, translations]

dependency-graph:
  requires:
    - 17-01 (password validation infrastructure, zxcvbn)
  provides:
    - Password reset Server Actions (requestPasswordReset, updatePassword)
    - Reset password landing page with form
    - Reusable PasswordStrengthMeter component (UI)
    - Password reset translations for all 5 languages
  affects:
    - 17-03 (settings page uses requestPasswordReset for password change)

tech-stack:
  added: []
  patterns:
    - "Always return success on password reset request (prevent email enumeration)"
    - "Global sign out after password change for security"
    - "zxcvbn-based visual password strength meter with feedback"

key-files:
  created:
    - src/lib/actions/password.ts
    - src/app/reset-password/page.tsx
    - src/app/reset-password/reset-form.tsx
    - src/components/ui/password-strength-meter.tsx
  modified:
    - src/lib/i18n/translations.ts

decisions:
  - id: prevent-email-enumeration
    choice: "Always return success on password reset request"
    reason: "Security best practice to prevent attackers from discovering valid emails"
  - id: global-signout
    choice: "Sign out all sessions after password change"
    reason: "Security - invalidate all existing sessions when password is changed"
  - id: reset-page-outside-auth-group
    choice: "Place reset-password page outside (auth) group"
    reason: "User arrives with valid session from reset link, auth group would redirect away"

metrics:
  tasks: 3/3
  commits: 3
---

# Phase 17 Plan 02: Password Reset Flow Summary

Password reset Server Actions and landing page with zxcvbn-based strength meter for secure password updates.

## What Was Built

### Server Actions (src/lib/actions/password.ts)

1. **requestPasswordReset(email)**
   - Validates email format with Zod
   - Calls Supabase `resetPasswordForEmail` with redirect URL
   - ALWAYS returns success (prevents email enumeration)

2. **updatePassword(newPassword)**
   - Validates with `passwordSchema` (min 8 chars, zxcvbn score >= 2)
   - Calls Supabase `updateUser` to set new password
   - Signs out globally (`scope: 'global'`) on success
   - Returns success or field-specific error

### Reset Password Page

- **page.tsx**: Server component handling error states (expired/invalid links)
- **reset-form.tsx**: Client form with:
  - Password and confirm password fields
  - Show/hide password toggle
  - Password strength meter integration
  - React Hook Form + Zod validation
  - Sonner toast for errors
  - Redirect to login with success message

### Password Strength Meter (UI)

- **src/components/ui/password-strength-meter.tsx**: Reusable component using zxcvbn
- Visual progress bar (20%-100% based on score 0-4)
- Color-coded: red (weak), yellow (fair), green (good+)
- Shows zxcvbn warnings and suggestions
- Auto-initializes zxcvbn on mount

### Translations

Added for all 5 languages (EN, KO, FR, ZH, VI):
- Password reset: resetTitle, newPassword, confirmPassword, updateButton, etc.
- Strength labels: weak, fair, good, strong, veryStrong
- Settings: changePassword, sendResetLink, noPasswordForOAuth

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| d590ef0 | feat | Add password reset Server Actions |
| 16384e5 | feat | Add password reset page with strength meter |
| 54aced7 | feat | Add password reset translations for all languages |

## Deviations from Plan

### Adjusted for Project Structure

**1. Reset page placed outside (auth) group**
- **Reason:** The (auth) layout redirects logged-in users to home, but reset password users arrive with a valid session from the reset link
- **Impact:** Page has its own minimal layout
- **Files:** `src/app/reset-password/` instead of `src/app/(auth)/reset-password/`

## Technical Decisions

### Security: Prevent Email Enumeration
- `requestPasswordReset` always returns `{ success: true }`
- Even if email doesn't exist, response is identical
- Prevents attackers from discovering valid user emails

### Security: Global Session Termination
- After password change: `supabase.auth.signOut({ scope: 'global' })`
- Terminates ALL active sessions across devices
- Forces re-authentication with new password

### Password Strength: zxcvbn Integration
- Uses same validation as signup (score >= 2 required)
- Real-time visual feedback with progress bar
- Shows zxcvbn suggestions for improvement

## Integration Points

### For Settings Page (Plan 03)
```typescript
import { requestPasswordReset } from '@/lib/actions/password'
// Call with user's email to send reset link
```

### Password Strength Meter Usage
```tsx
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter'

<PasswordStrengthMeter password={passwordValue} />
```

## Next Phase Readiness

Ready for:
- Plan 03: Settings page password change section (uses requestPasswordReset)
- Plan 04: Notification preferences toggles (independent)
