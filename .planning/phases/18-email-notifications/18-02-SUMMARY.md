---
phase: 18-email-notifications
plan: 02
subsystem: email
tags: [resend, edge-functions, deno, email-templates, i18n, hmac, web-crypto]

# Dependency graph
requires:
  - phase: 18-01
    provides: Notification queue table and database triggers
provides:
  - Supabase Edge Function for daily email digest delivery
  - Localized HTML/text email templates (5 languages)
  - HMAC-signed unsubscribe tokens
affects: [18-03, 18-04]

# Tech tracking
tech-stack:
  added:
    - Resend API (REST v1) for email delivery
    - Deno Web Crypto API for HMAC token signing
    - @supabase/supabase-js@2 in Edge Functions
  patterns:
    - Table-based HTML email layouts for client compatibility
    - Opt-out notification model (enabled by default)
    - Token-based one-click unsubscribe
    - Localized email content via translation objects

key-files:
  created:
    - supabase/functions/send-daily-digest/index.ts
    - supabase/functions/send-daily-digest/email-templates.ts
    - supabase/functions/send-daily-digest/unsubscribe.ts

key-decisions:
  - "Table-based HTML layout for email client compatibility"
  - "Opt-out notification model (enabled by default)"
  - "Mark all notifications as sent after processing (prevents duplicates)"
  - "Generate localized content based on user's preferred_language"
  - "HMAC-signed tokens with 30-day expiry for unsubscribe"

patterns-established:
  - "Email templates use translation objects for all 5 languages (EN, KO, FR, ZH, VI)"
  - "HTML emails include plain text fallback"
  - "Inline styles only for email compatibility"
  - "Service role client for Edge Functions with full database access"
  - "Log errors without retrying to prevent duplicate sends"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 18 Plan 02: Daily Digest Edge Function Summary

**Supabase Edge Function with Resend API for daily digest emails, localized HTML/text templates in 5 languages, and HMAC-signed unsubscribe tokens**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-01T09:45:46Z
- **Completed:** 2026-02-01T09:48:03Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Edge Function processes notification queue and groups by user
- Localized email templates supporting EN, KO, FR, ZH, VI
- Respects user notification preferences (opt-out model)
- Secure HMAC-signed tokens for one-click unsubscribe
- Table-based HTML layout with plain text fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create unsubscribe token utility** - `2f0a08c` (feat)
2. **Task 2: Create email templates with localization** - `80cdb45` (feat)
3. **Task 3: Create main Edge Function handler** - `7c00afd` (feat)

## Files Created/Modified

- `supabase/functions/send-daily-digest/index.ts` - Main Edge Function handler that queries pending notifications, groups by user, checks preferences, sends via Resend, and marks as sent
- `supabase/functions/send-daily-digest/email-templates.ts` - Localized HTML/text email generation for all 5 languages with table-based layout
- `supabase/functions/send-daily-digest/unsubscribe.ts` - HMAC-signed token generation/verification for secure one-click unsubscribe

## Decisions Made

**1. Table-based HTML email layout**
- Email clients don't support modern CSS (flexbox, grid)
- Table-based layouts ensure compatibility across Outlook, Gmail, Apple Mail
- Inline styles only for consistent rendering

**2. Opt-out notification model**
- Notifications enabled by default if no preference exists
- Reduces friction for new users
- Users can disable via settings or unsubscribe link

**3. Mark all notifications as sent after processing**
- Prevents duplicate emails on retry
- Includes notifications filtered by preferences
- Follows RESEARCH.md Pitfall 3 guidance

**4. Localized content based on preferred_language**
- Edge Function queries profiles table for language preference
- Falls back to English if language not set
- Translation object supports EN, KO, FR, ZH, VI

**5. HMAC-signed tokens with 30-day expiry**
- Web Crypto API for secure HMAC signing
- Base64URL encoding for URL-safe tokens
- Tamper-proof unsubscribe without login

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration.** See [18-USER-SETUP.md](./18-USER-SETUP.md) for:
- Resend API key environment variable
- Domain verification in Resend dashboard
- Edge Function deployment commands
- Cron job scheduling (deferred to plan 18-03)

## Next Phase Readiness

- Edge Function ready for deployment
- Email templates tested with all 5 languages
- Waiting for Resend API key configuration before testing
- Next: Plan 18-03 will schedule daily digest cron job
- Next: Plan 18-04 will implement unsubscribe API route

---
*Phase: 18-email-notifications*
*Completed: 2026-02-01*
