---
phase: 18-email-notifications
plan: 03
subsystem: email
tags: [unsubscribe, rfc-8058, email-deliverability, service-role, hmac]

# Dependency graph
requires:
  - phase: 18-01
    provides: Notification preferences table and Edge Function token generation
provides:
  - One-click unsubscribe flow (GET/POST API route)
  - Token verification utility for Next.js (Node.js crypto)
  - Service role client for unauthenticated operations
  - Success/error pages for unsubscribe flow
affects: [18-02, email-templates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Service role client for RLS bypass
    - HMAC token verification in Next.js route handlers
    - URL-safe base64 encoding/decoding

key-files:
  created:
    - src/lib/email/unsubscribe.ts
    - src/app/api/unsubscribe/route.ts
    - src/app/unsubscribe-success/page.tsx
    - src/app/unsubscribe-error/page.tsx
  modified:
    - src/lib/supabase/server.ts

key-decisions:
  - "Service role client for unsubscribe: User not logged in, needs to bypass RLS"
  - "Node.js crypto for HMAC: Next.js route handler uses Node.js runtime, not Edge"
  - "Both GET and POST handlers: RFC 8058 compliance for one-click unsubscribe"
  - "Disable all notification types: Unsubscribe from all, not individual types"

patterns-established:
  - "Service role pattern: createServiceRoleClient() for admin/elevated operations"
  - "Token verification: URL-safe base64 → decode → verify signature → check expiry"
  - "Unauthenticated redirects: error?reason=missing|invalid for user feedback"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 18 Plan 03: Unsubscribe Flow Summary

**One-click unsubscribe with HMAC token verification, service role client for RLS bypass, and RFC 8058-compliant GET/POST handlers**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-01T13:33:18Z
- **Completed:** 2026-02-01T13:35:27Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- One-click unsubscribe works without login (token-based authentication)
- Service role client bypasses RLS for unauthenticated preference updates
- RFC 8058-compliant (both GET for link clicks and POST for one-click header)
- Success/error pages provide clear feedback and re-subscription path

## Task Commits

Each task was committed atomically:

1. **Task 1: Create token verification utility for Next.js** - `455ad7f` (feat)
2. **Task 2: Create unsubscribe API route** - `bfe3a28` (feat)
3. **Task 3: Create success and error pages** - `bdbf75b` (feat)

## Files Created/Modified
- `src/lib/email/unsubscribe.ts` - HMAC token verification using Node.js crypto
- `src/lib/supabase/server.ts` - Added createServiceRoleClient() for RLS bypass
- `src/app/api/unsubscribe/route.ts` - GET/POST handlers for unsubscribe with token validation
- `src/app/unsubscribe-success/page.tsx` - Confirmation page with settings link
- `src/app/unsubscribe-error/page.tsx` - Error page with reason-specific messages

## Decisions Made

**1. Service role client for unsubscribe operations**
- **Rationale:** User is not logged in when clicking unsubscribe link. RLS policies require auth.uid(), which is null for unauthenticated requests. Service role client bypasses RLS to update preferences.
- **Pattern:** createServiceRoleClient() returns Supabase client with service_role key
- **Security:** Only used in server-side API routes, never exposed to client

**2. Node.js crypto instead of Web Crypto API**
- **Rationale:** Next.js API routes run in Node.js runtime (not Edge runtime like Edge Functions). Node.js crypto module is the standard for server-side cryptography.
- **Compatibility:** Matches Edge Function's HMAC signature scheme but uses Node.js APIs

**3. Disable all notification types on unsubscribe**
- **Rationale:** Unsubscribe link is generic (not per-notification-type). Simpler UX and higher compliance with email deliverability requirements.
- **Implementation:** Loop through all 4 notification types, upsert with enabled=false

**4. Both GET and POST handlers**
- **Rationale:** RFC 8058 specifies List-Unsubscribe-Post header for one-click unsubscribe. GET is for traditional link clicks. Supporting both ensures maximum compatibility.
- **Implementation:** Shared handleUnsubscribe() function called by both handlers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation was straightforward.

## User Setup Required

**Environment variable needed:**

Add to `.env.local`:
```bash
UNSUBSCRIBE_SECRET=your-secret-key-here
```

**Note:** This should match the UNSUBSCRIBE_SECRET in the Edge Function environment (18-02). Use the same secret for token generation and verification.

**Verification:**
1. Generate unsubscribe token in Edge Function (18-02)
2. Visit `/api/unsubscribe?token=<generated-token>`
3. Should redirect to `/unsubscribe-success`
4. Check `user_notification_preferences` table - all types should be `enabled=false`

## Next Phase Readiness

**Ready for:**
- Email template integration (add unsubscribe link to footer)
- Daily digest Edge Function (18-02) can reference this route
- User can re-subscribe via settings page (Phase 17 already built)

**Blockers:**
- None

**Notes:**
- Success page links to `/profile/settings?tab=notifications` (Phase 17)
- Error page links to `/login` for manual preference management
- Token expiry handled gracefully (redirects to error page)

---
*Phase: 18-email-notifications*
*Completed: 2026-02-01*
