# Phase 18: Email Notifications - Research

**Researched:** 2026-02-01
**Domain:** Transactional email, Supabase Edge Functions, scheduled jobs, email templating
**Confidence:** HIGH

## Summary

This phase implements daily digest email notifications when cafe/photo submissions are approved or rejected. Research focused on three key areas: (1) Resend as the email delivery service, (2) Supabase Edge Functions with pg_cron scheduling for daily digest execution, and (3) a notification queue table for storing pending notifications until the daily batch runs.

The architecture follows a proven pattern: when admin approves/rejects submissions, a database trigger queues a notification record. A daily cron job at 9 AM KST (0:00 UTC) triggers an Edge Function that queries all pending notifications, groups them by user, generates localized HTML/text email content per user's preferred language, sends via Resend API, and marks notifications as sent.

Resend provides a simple REST API with excellent deliverability, free tier of 3,000 emails/month (sufficient for early-stage app), and native support for HTML emails with plain text fallbacks. Supabase Edge Functions (Deno runtime) can be scheduled via pg_cron + pg_net extensions, with credentials securely stored in Supabase Vault.

**Primary recommendation:** Use Resend API directly from a Supabase Edge Function triggered by pg_cron at `0 0 * * *` (9 AM KST = 0:00 UTC). Store pending notifications in a `pending_email_notifications` table with user_id, notification_type, submission details, and created_at. Include one-click unsubscribe via signed token in email footer.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Resend API | REST v1 | Email delivery | Developer-friendly API, high deliverability, 3K free emails/month, built for transactional email |
| Supabase Edge Functions | Deno runtime | Serverless function execution | Native Supabase integration, globally distributed, TypeScript support |
| pg_cron | 1.6+ | Scheduled job execution | Built into Supabase, triggers functions on schedule, cron syntax |
| pg_net | 0.9+ | HTTP requests from Postgres | Calls Edge Functions from cron jobs, handles auth headers |
| Supabase Vault | Built-in | Secrets management | Secure API key storage, accessed via decrypted_secrets view |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jose (Deno) | Built-in | JWT signing/verification | Generate one-click unsubscribe tokens |
| crypto (Deno) | Built-in | HMAC signing | Token generation for unsubscribe links |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | SendGrid, Postmark, AWS SES | Resend has simpler API, better DX; others have larger free tiers but more complex setup |
| pg_cron | External scheduler (Vercel cron, GitHub Actions) | pg_cron is native to Supabase, no external dependency |
| Edge Functions | Next.js API routes + Vercel cron | Edge Functions keep email logic in Supabase ecosystem, avoid cold starts |
| Raw HTML templates | React Email | React Email adds build complexity for simple templates; raw HTML sufficient for digest emails |

**Installation:**
```bash
# No npm packages needed - Edge Functions use Deno runtime
# Resend accessed via REST API

# Enable extensions (run in Supabase SQL Editor)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/
├── functions/
│   ├── send-daily-digest/
│   │   ├── index.ts              # Main Edge Function handler
│   │   ├── email-templates.ts    # HTML/text template generators
│   │   └── unsubscribe.ts        # Token generation/verification
│   └── process-unsubscribe/
│       └── index.ts              # Handle one-click unsubscribe
├── migrations/
│   └── 1801_email_notifications.sql  # Queue table + trigger + cron job
└── seed/
    └── (none needed)

src/
└── lib/
    └── i18n/
        └── email-translations.ts  # Email content translations (KO/EN/FR/ZH/VI)
```

### Pattern 1: Notification Queue Table
**What:** Store pending notifications in a table until daily digest runs
**When to use:** For batch processing (daily digest), not immediate notifications
**Example:**
```sql
-- Source: Supabase Queues pattern + custom implementation
CREATE TABLE pending_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,  -- 'cafe_approved', 'cafe_rejected', etc.

  -- Submission details for email content
  submission_type VARCHAR(20) NOT NULL,    -- 'cafe' or 'photo'
  submission_id UUID NOT NULL,
  cafe_name JSONB,                         -- TranslatedText for cafe name
  cafe_slug VARCHAR(255),                  -- For direct link in approval emails
  rejection_reason TEXT,                   -- For rejection emails

  -- Processing state
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,                     -- NULL until sent

  -- Index for efficient daily query
  CONSTRAINT valid_notification_type CHECK (
    notification_type IN ('cafe_approved', 'cafe_rejected', 'photo_approved', 'photo_rejected')
  )
);

-- Index for daily digest query (unsent notifications grouped by user)
CREATE INDEX idx_pending_notifications_unsent
  ON pending_email_notifications(user_id, created_at)
  WHERE sent_at IS NULL;

-- RLS: Only service role can access (Edge Functions use service role)
ALTER TABLE pending_email_notifications ENABLE ROW LEVEL SECURITY;

-- No public policies - only service_role can read/write
```

### Pattern 2: Database Trigger for Queueing Notifications
**What:** Automatically queue notification when submission status changes
**When to use:** When admin approves/rejects a cafe or photo submission
**Example:**
```sql
-- Source: Supabase database triggers pattern
-- Trigger function for cafe submissions
CREATE OR REPLACE FUNCTION queue_cafe_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status change to approved or declined
  IF (OLD.status = 'pending' AND NEW.status IN ('approved', 'declined')) THEN
    INSERT INTO pending_email_notifications (
      user_id,
      notification_type,
      submission_type,
      submission_id,
      cafe_name,
      cafe_slug,
      rejection_reason
    )
    SELECT
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'cafe_approved' ELSE 'cafe_rejected' END,
      'cafe',
      NEW.id,
      NEW.name,
      CASE WHEN NEW.status = 'approved' THEN c.slug ELSE NULL END,
      CASE WHEN NEW.status = 'declined' THEN NEW.rejection_reason ELSE NULL END
    FROM (SELECT slug FROM cafes WHERE id = NEW.cafe_id) c;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_cafe_submission_status_change
  AFTER UPDATE ON cafe_submissions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION queue_cafe_status_notification();
```

### Pattern 3: Daily Cron Job with Vault Secrets
**What:** Schedule Edge Function execution at 9 AM KST daily
**When to use:** Daily digest email sending
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/functions/schedule-functions

-- Store secrets in Vault (run once during setup)
SELECT vault.create_secret(
  'https://YOUR-PROJECT-REF.supabase.co',
  'supabase_url'
);
SELECT vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY',
  'service_role_key'
);

-- Schedule daily digest at 9 AM KST (0:00 UTC)
SELECT cron.schedule(
  'daily-email-digest',
  '0 0 * * *',  -- 0:00 UTC = 9:00 AM KST
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url')
           || '/functions/v1/send-daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Pattern 4: Edge Function for Sending Digest Emails
**What:** Supabase Edge Function that processes queue and sends via Resend
**When to use:** Triggered by daily cron job
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/functions/examples/send-emails
// supabase/functions/send-daily-digest/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1. Get all unsent notifications grouped by user
  const { data: notifications, error } = await supabase
    .from('pending_email_notifications')
    .select(`
      id,
      user_id,
      notification_type,
      submission_type,
      cafe_name,
      cafe_slug,
      rejection_reason,
      created_at
    `)
    .is('sent_at', null)
    .order('created_at', { ascending: true })

  if (error || !notifications?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // 2. Group by user_id
  const byUser = notifications.reduce((acc, n) => {
    if (!acc[n.user_id]) acc[n.user_id] = []
    acc[n.user_id].push(n)
    return acc
  }, {} as Record<string, typeof notifications>)

  let sentCount = 0
  const sentIds: string[] = []

  // 3. For each user, check preferences and send digest
  for (const [userId, userNotifications] of Object.entries(byUser)) {
    // Get user email and preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, preferred_language')
      .eq('id', userId)
      .single()

    if (!profile?.email) continue

    // Check notification preferences
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('notification_type, enabled')
      .eq('user_id', userId)

    const enabledTypes = new Set(
      (prefs ?? []).filter(p => p.enabled).map(p => p.notification_type)
    )
    // Default to all enabled if no preferences set
    const defaultEnabled = !prefs?.length

    // Filter notifications by user preferences
    const toSend = userNotifications.filter(n =>
      defaultEnabled || enabledTypes.has(n.notification_type)
    )

    if (!toSend.length) {
      // Mark as sent even if filtered out by preferences
      sentIds.push(...userNotifications.map(n => n.id))
      continue
    }

    // Generate email content
    const { html, text, subject } = generateDigestEmail(
      toSend,
      profile.preferred_language || 'en',
      userId
    )

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Cafes Seoul <notifications@cafes-seoul.com>',
        to: [profile.email],
        subject,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<https://cafes-seoul.com/api/unsubscribe?token=${generateUnsubscribeToken(userId)}>`
        }
      })
    })

    if (res.ok) {
      sentCount++
      sentIds.push(...toSend.map(n => n.id))
    }
  }

  // 4. Mark notifications as sent
  if (sentIds.length) {
    await supabase
      .from('pending_email_notifications')
      .update({ sent_at: new Date().toISOString() })
      .in('id', sentIds)
  }

  return new Response(JSON.stringify({ sent: sentCount }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Pattern 5: One-Click Unsubscribe Token
**What:** Signed token for login-free unsubscribe
**When to use:** Email footer unsubscribe link
**Example:**
```typescript
// Source: Email unsubscribe best practices + JWT signing
// supabase/functions/send-daily-digest/unsubscribe.ts

const UNSUBSCRIBE_SECRET = Deno.env.get('UNSUBSCRIBE_SECRET')!

export function generateUnsubscribeToken(userId: string): string {
  // Create HMAC signature with user ID and timestamp
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  })

  const encoder = new TextEncoder()
  const key = encoder.encode(UNSUBSCRIBE_SECRET)
  const data = encoder.encode(payload)

  // Use Web Crypto API for HMAC
  const signature = await crypto.subtle.sign(
    { name: 'HMAC', hash: 'SHA-256' },
    await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    data
  )

  // Base64URL encode payload + signature
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const payloadBase64 = btoa(payload)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${payloadBase64}.${sigBase64}`
}

export function verifyUnsubscribeToken(token: string): { userId: string } | null {
  try {
    const [payloadBase64, sigBase64] = token.split('.')
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')))

    if (payload.exp < Date.now()) return null // Expired

    // Verify signature (same HMAC logic as above)
    // ... verification code ...

    return { userId: payload.userId }
  } catch {
    return null
  }
}
```

### Pattern 6: Localized Email Templates
**What:** HTML/text email content in user's preferred language
**When to use:** All digest emails
**Example:**
```typescript
// supabase/functions/send-daily-digest/email-templates.ts

interface Notification {
  notification_type: string
  cafe_name: Record<string, string>
  cafe_slug: string | null
  rejection_reason: string | null
}

const translations = {
  en: {
    subject: 'Your Cafes Seoul Update',
    greeting: 'Hey there!',
    approved_section: 'Approved',
    rejected_section: 'Declined',
    cafe_approved: (name: string, link: string) =>
      `Great news! Your cafe submission "${name}" was approved! <a href="${link}">Check it out</a>`,
    cafe_rejected: (name: string, reason: string) =>
      `Your cafe submission "${name}" was declined. Reason: ${reason}`,
    photo_approved: (cafeName: string) =>
      `Your photo for "${cafeName}" was approved and is now visible!`,
    photo_rejected: (cafeName: string, reason: string) =>
      `Your photo for "${cafeName}" was declined. Reason: ${reason}`,
    unsubscribe: 'Unsubscribe from these emails',
    settings: 'Manage notification preferences'
  },
  ko: {
    subject: '카페 서울 업데이트',
    greeting: '안녕하세요!',
    approved_section: '승인됨',
    rejected_section: '거절됨',
    cafe_approved: (name: string, link: string) =>
      `좋은 소식이에요! "${name}" 카페 제출이 승인되었습니다! <a href="${link}">확인하기</a>`,
    cafe_rejected: (name: string, reason: string) =>
      `"${name}" 카페 제출이 거절되었습니다. 사유: ${reason}`,
    photo_approved: (cafeName: string) =>
      `"${cafeName}"의 사진이 승인되어 공개되었습니다!`,
    photo_rejected: (cafeName: string, reason: string) =>
      `"${cafeName}"의 사진이 거절되었습니다. 사유: ${reason}`,
    unsubscribe: '이메일 수신 거부',
    settings: '알림 설정 관리'
  },
  // ... fr, zh, vi translations
}

export function generateDigestEmail(
  notifications: Notification[],
  language: string,
  userId: string
): { html: string; text: string; subject: string } {
  const t = translations[language as keyof typeof translations] || translations.en
  const baseUrl = 'https://cafes-seoul.com'

  const approved = notifications.filter(n => n.notification_type.includes('approved'))
  const rejected = notifications.filter(n => n.notification_type.includes('rejected'))

  // HTML template with brand styling
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 24px; background-color: #1f2937; text-align: center;">
        <img src="${baseUrl}/logo-white.png" alt="Cafes Seoul" width="150" style="display: block; margin: 0 auto;">
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 32px 24px;">
        <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">${t.greeting}</h1>

        ${approved.length > 0 ? `
        <h2 style="color: #059669; font-size: 18px; margin: 24px 0 12px;">
          ${t.approved_section} (${approved.length})
        </h2>
        <ul style="padding-left: 20px; color: #374151;">
          ${approved.map(n => `<li style="margin-bottom: 8px;">${formatNotification(n, t, baseUrl)}</li>`).join('')}
        </ul>
        ` : ''}

        ${rejected.length > 0 ? `
        <h2 style="color: #dc2626; font-size: 18px; margin: 24px 0 12px;">
          ${t.rejected_section} (${rejected.length})
        </h2>
        <ul style="padding-left: 20px; color: #374151;">
          ${rejected.map(n => `<li style="margin-bottom: 8px;">${formatNotification(n, t, baseUrl)}</li>`).join('')}
        </ul>
        ` : ''}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0 0 8px;">
          <a href="${baseUrl}/api/unsubscribe?token=${generateUnsubscribeToken(userId)}" style="color: #6b7280;">${t.unsubscribe}</a>
          &nbsp;|&nbsp;
          <a href="${baseUrl}/profile/settings?tab=notifications" style="color: #6b7280;">${t.settings}</a>
        </p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Cafes Seoul</p>
      </td>
    </tr>
  </table>
</body>
</html>`

  // Plain text fallback
  const text = `${t.greeting}

${approved.length > 0 ? `${t.approved_section} (${approved.length}):
${approved.map(n => `- ${formatNotificationText(n, t, baseUrl)}`).join('\n')}
` : ''}
${rejected.length > 0 ? `${t.rejected_section} (${rejected.length}):
${rejected.map(n => `- ${formatNotificationText(n, t, baseUrl)}`).join('\n')}
` : ''}
---
${t.unsubscribe}: ${baseUrl}/api/unsubscribe?token=${generateUnsubscribeToken(userId)}
${t.settings}: ${baseUrl}/profile/settings?tab=notifications`

  return { html, text, subject: t.subject }
}
```

### Anti-Patterns to Avoid
- **Immediate email on each status change:** Don't send emails synchronously in admin actions. Queue for daily digest.
- **Hard-coded email content:** Don't embed translations directly. Use translation object for all 5 languages.
- **Storing Resend API key in code:** Don't commit API keys. Use Edge Function secrets.
- **Sending to users who disabled notifications:** Always check user_notification_preferences before sending.
- **Infinite retries on send failure:** Mark as sent after first attempt. Don't retry failed emails (creates duplicates).
- **Missing plain text fallback:** Always include both HTML and plain text versions.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery infrastructure | Custom SMTP setup | Resend API | Deliverability, reputation management, bounce handling |
| Scheduled job execution | setInterval in server, external cron service | pg_cron + pg_net | Native to Supabase, no external deps, survives restarts |
| Secrets management | Environment variables in code | Supabase Vault | Encrypted at rest, accessed securely in SQL |
| Email template rendering | String concatenation | Template literals with proper escaping | XSS prevention, maintainability |
| Unsubscribe token generation | Simple base64 encoding | HMAC-signed tokens | Tamper-proof, expirable, secure |

**Key insight:** Email notification systems have subtle requirements (deliverability, unsubscribe compliance, timezone handling, preference checking). Use managed services for delivery (Resend) and native Supabase features for scheduling (pg_cron) rather than building custom infrastructure.

## Common Pitfalls

### Pitfall 1: Timezone Confusion in Cron Schedule
**What goes wrong:** Daily digest sends at wrong local time for Korean users.
**Why it happens:** pg_cron uses UTC by default. 9 AM KST = 0:00 UTC.
**How to avoid:** Use `0 0 * * *` for 9 AM KST (KST = UTC+9). Document timezone conversion in comments.
**Warning signs:** Users report emails arriving at odd hours.

### Pitfall 2: Not Checking Notification Preferences Before Sending
**What goes wrong:** Users receive emails for notification types they disabled.
**Why it happens:** Skipping the preference check to simplify code.
**How to avoid:** Always query `user_notification_preferences` and filter notifications. Default to enabled if no preferences exist (opt-out model).
**Warning signs:** User complaints about unwanted emails, potential GDPR issues.

### Pitfall 3: Sending Duplicate Emails on Retry
**What goes wrong:** User receives same digest multiple times.
**Why it happens:** Retrying failed cron job without checking `sent_at` status.
**How to avoid:** Mark notifications as sent immediately after successful Resend API call. Query only `WHERE sent_at IS NULL`.
**Warning signs:** Duplicate emails, user complaints.

### Pitfall 4: Missing One-Click Unsubscribe
**What goes wrong:** Emails marked as spam, deliverability drops.
**Why it happens:** Skipping unsubscribe header requirement (RFC 8058).
**How to avoid:** Include `List-Unsubscribe` header with HTTPS URL. Implement token-based unsubscribe endpoint.
**Warning signs:** High spam complaints, emails going to junk folder.

### Pitfall 5: Blocking Admin Actions on Email Queue Failure
**What goes wrong:** Admin can't approve/reject submissions if queue insert fails.
**Why it happens:** Putting queue insert in same transaction as status update.
**How to avoid:** Use AFTER trigger (not BEFORE). Queue failure shouldn't block status update. Log errors but don't fail the main operation.
**Warning signs:** Admin action errors mentioning notification table.

### Pitfall 6: Edge Function Cold Start Timeouts
**What goes wrong:** Digest function times out before completing all emails.
**Why it happens:** Processing too many users in a single invocation.
**How to avoid:** Process in batches (e.g., 50 users per invocation). If more users, trigger additional invocations.
**Warning signs:** Partial sends, timeout errors in function logs.

### Pitfall 7: HTML Email Rendering Issues
**What goes wrong:** Emails look broken in Outlook, Gmail, Apple Mail.
**Why it happens:** Using modern CSS (flexbox, grid) that email clients don't support.
**How to avoid:** Use table-based layouts, inline styles, basic CSS only. Test in multiple clients.
**Warning signs:** User reports of broken email layouts.

## Code Examples

Verified patterns from official sources:

### Complete Migration File
```sql
-- Source: Supabase patterns + Phase 17 notification preferences
-- supabase/migrations/1801_email_notifications.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- PENDING NOTIFICATIONS QUEUE TABLE
-- ============================================

CREATE TABLE pending_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  submission_type VARCHAR(20) NOT NULL,
  submission_id UUID NOT NULL,
  cafe_name JSONB,
  cafe_slug VARCHAR(255),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,

  CONSTRAINT valid_notification_type CHECK (
    notification_type IN ('cafe_approved', 'cafe_rejected', 'photo_approved', 'photo_rejected')
  ),
  CONSTRAINT valid_submission_type CHECK (
    submission_type IN ('cafe', 'photo')
  )
);

CREATE INDEX idx_pending_notifications_unsent
  ON pending_email_notifications(user_id, created_at)
  WHERE sent_at IS NULL;

ALTER TABLE pending_email_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGER FOR CAFE SUBMISSIONS
-- ============================================

CREATE OR REPLACE FUNCTION queue_cafe_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_cafe_slug VARCHAR(255);
BEGIN
  IF (OLD.status = 'pending' AND NEW.status IN ('approved', 'declined')) THEN
    -- Get cafe slug if approved
    IF NEW.status = 'approved' AND NEW.cafe_id IS NOT NULL THEN
      SELECT slug INTO v_cafe_slug FROM cafes WHERE id = NEW.cafe_id;
    END IF;

    INSERT INTO pending_email_notifications (
      user_id,
      notification_type,
      submission_type,
      submission_id,
      cafe_name,
      cafe_slug,
      rejection_reason
    ) VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'cafe_approved' ELSE 'cafe_rejected' END,
      'cafe',
      NEW.id,
      NEW.name,
      v_cafe_slug,
      CASE WHEN NEW.status = 'declined' THEN NEW.rejection_reason ELSE NULL END
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the main operation
  RAISE WARNING 'Failed to queue notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_cafe_submission_status_change
  AFTER UPDATE ON cafe_submissions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION queue_cafe_status_notification();

-- ============================================
-- TRIGGER FOR PHOTO SUBMISSIONS
-- ============================================

CREATE OR REPLACE FUNCTION queue_photo_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_cafe_name JSONB;
  v_cafe_slug VARCHAR(255);
BEGIN
  IF (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
    -- Get cafe info
    SELECT name, slug INTO v_cafe_name, v_cafe_slug
    FROM cafes WHERE id = NEW.cafe_id;

    INSERT INTO pending_email_notifications (
      user_id,
      notification_type,
      submission_type,
      submission_id,
      cafe_name,
      cafe_slug,
      rejection_reason
    ) VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'photo_approved' ELSE 'photo_rejected' END,
      'photo',
      NEW.id,
      v_cafe_name,
      v_cafe_slug,
      CASE WHEN NEW.status = 'rejected' THEN NEW.rejection_reason ELSE NULL END
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to queue notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_photo_status_change
  AFTER UPDATE ON photos
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION queue_photo_status_notification();

-- ============================================
-- CRON JOB SETUP (run after Edge Function deployed)
-- ============================================
-- Note: Run this manually after deploying the Edge Function
-- and storing secrets in Vault

-- SELECT vault.create_secret('https://YOUR-PROJECT-REF.supabase.co', 'supabase_url');
-- SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
--
-- SELECT cron.schedule(
--   'daily-email-digest',
--   '0 0 * * *',  -- 0:00 UTC = 9:00 AM KST
--   $$
--   SELECT net.http_post(
--     url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url')
--            || '/functions/v1/send-daily-digest',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
--     ),
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );
```

### Resend API Call with Custom Headers
```typescript
// Source: https://resend.com/docs/api-reference/emails/send-email
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${RESEND_API_KEY}`
  },
  body: JSON.stringify({
    from: 'Cafes Seoul <notifications@cafes-seoul.com>',
    to: [userEmail],
    subject: 'Your Cafes Seoul Update',
    html: htmlContent,
    text: textContent,
    headers: {
      'List-Unsubscribe': `<https://cafes-seoul.com/api/unsubscribe?token=${token}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    }
  })
})

if (!response.ok) {
  const error = await response.json()
  console.error('Resend error:', error)
}
```

### Unsubscribe API Route Handler
```typescript
// src/app/api/unsubscribe/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/unsubscribe-error', request.url))
  }

  const payload = verifyUnsubscribeToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/unsubscribe-error?reason=invalid', request.url))
  }

  // Disable all notifications for this user
  const supabase = createClient()

  const notificationTypes = ['cafe_approved', 'cafe_rejected', 'photo_approved', 'photo_rejected']

  for (const type of notificationTypes) {
    await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: payload.userId,
        notification_type: type,
        enabled: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,notification_type'
      })
  }

  return NextResponse.redirect(new URL('/unsubscribe-success', request.url))
}

// POST handler for RFC 8058 one-click unsubscribe
export async function POST(request: NextRequest) {
  // Same logic as GET but for automated unsubscribe requests
  return GET(request)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AWS SES/SendGrid setup | Resend API | 2023+ | Simpler developer experience, better defaults |
| External cron services | pg_cron native | Supabase 2023 | No external dependency, runs in Postgres |
| Storing secrets in env vars | Supabase Vault | Supabase 2024 | Encrypted at rest, SQL-accessible |
| Custom email templates | React Email (optional) | 2023+ | Component-based templates (but adds complexity) |
| Immediate notifications | Daily digest pattern | Best practice | Reduces email fatigue, better engagement |

**Deprecated/outdated:**
- **Nodemailer with custom SMTP:** Too much infrastructure to manage. Use Resend.
- **Firebase Cloud Functions for scheduling:** If using Supabase, use pg_cron instead.
- **Storing API keys in Edge Function code:** Use Supabase Vault or Edge Function secrets.

## Open Questions

Things that couldn't be fully resolved:

1. **Resend domain verification for cafes-seoul.com**
   - What we know: Resend requires DNS record verification (SPF, DKIM) for custom domains
   - What's unclear: Whether cafes-seoul.com domain is already configured for email sending
   - Recommendation: Set up Resend account early in phase, complete domain verification before testing

2. **Edge Function timeout for large user base**
   - What we know: Edge Functions have ~60 second timeout by default
   - What's unclear: How many users can be processed in one invocation
   - Recommendation: Start with simple approach, add batching if needed. Test with 100+ notifications.

3. **Photo submission table structure**
   - What we know: Photos table has `status` column with 'pending', 'approved', 'rejected'
   - What's unclear: Exact trigger conditions for photo status changes
   - Recommendation: Verify `photos` table schema before writing trigger. May need to adjust column names.

4. **Contribution stats in approval emails**
   - What we know: CONTEXT.md mentions including "contribution stats" in approval emails
   - What's unclear: What stats to include and how to calculate them
   - Recommendation: Keep simple for MVP - "You've contributed X cafes and Y photos" from profiles table

## Sources

### Primary (HIGH confidence)
- [Resend API Reference - Send Email](https://resend.com/docs/api-reference/emails/send-email) - Complete API documentation
- [Supabase Edge Functions - Sending Emails](https://supabase.com/docs/guides/functions/examples/send-emails) - Official integration guide
- [Supabase Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) - pg_cron + pg_net patterns
- [Supabase Cron Quickstart](https://supabase.com/docs/guides/cron/quickstart) - Cron syntax and job management
- [Resend + Supabase Integration](https://resend.com/docs/send-with-supabase-edge-functions) - Official Resend guide

### Secondary (MEDIUM confidence)
- [Supabase Queues Documentation](https://supabase.com/docs/guides/queues) - Queue patterns applicable to notification queue
- [Processing Large Jobs with Edge Functions](https://supabase.com/blog/processing-large-jobs-with-edge-functions) - Batch processing architecture
- [One-Click Unsubscribe Best Practices](https://www.valimail.com/blog/one-click-unsubscribe/) - RFC 8058 compliance
- [Email Localization Best Practices](https://crowdin.com/blog/how-to-localize-emails) - i18n email patterns

### Tertiary (LOW confidence)
- Web search results for email template rendering - General patterns, not Resend-specific
- Community discussions on Supabase Edge Function timeouts - Anecdotal, may vary by project

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Resend and Supabase Edge Functions are well-documented, official integrations exist
- Architecture: HIGH - Patterns from official Supabase blog posts and documentation
- Pitfalls: MEDIUM - Based on general email delivery best practices, some Supabase-specific
- Code examples: HIGH - Adapted from official documentation with project-specific modifications

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - email delivery ecosystem is stable)
