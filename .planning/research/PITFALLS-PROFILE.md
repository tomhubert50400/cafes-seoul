# Pitfalls Research: Profile Enhancement

**Domain:** Profile tabs, text reviews, favorites, settings, email notifications
**Researched:** 2026-02-01
**Existing System:** Next.js 16 + Supabase (Auth, Database, Storage)

## Summary

Adding profile enhancement features carries three primary risk categories: (1) **data isolation and RLS policy gaps** when extending existing tables, (2) **optimistic UI race conditions** on favorites/bookmarks toggling, and (3) **email notification infrastructure** requiring third-party SMTP since Supabase has a 2/hour limit. Text reviews introduce moderation concerns and XSS attack vectors that require explicit prevention. Avatar upload has known pitfalls around orphaned files and upsert behavior in Supabase Storage.

---

## Critical Pitfalls

### 1. RLS Policy Gaps When Adding User-Specific Tables

**Risk:** New tables (favorites, user_reviews, email_preferences) may be created without RLS enabled or with incomplete policies, exposing user data to unauthorized access.

**Warning Signs:**
- Table created but `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` not called
- Users can view/modify other users' favorites or settings
- SELECT policy exists but no INSERT/UPDATE/DELETE policies
- Using `user_metadata` in RLS policies (modifiable by end users)

**Prevention:**
```sql
-- ALWAYS enable RLS immediately after table creation
CREATE TABLE public.favorites (...);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create BOTH USING and WITH CHECK for UPDATE policies
CREATE POLICY "Users can update own favorites"
ON public.favorites FOR UPDATE
USING (auth.uid() = user_id)      -- Can select their own
WITH CHECK (auth.uid() = user_id); -- Can only update to their own
```

**Phase:** Phase 1 (Favorites System) - Apply RLS patterns from existing `cafe_submissions` migration as template

**Confidence:** HIGH - Based on [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) and [CVE-2025-48757](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) where 170+ apps were exposed.

---

### 2. Email Notification Rate Limits (Supabase Built-in)

**Risk:** Supabase's native email limits to 2 emails/hour (or 2/day on free tier), making submission approval/rejection notifications fail silently in production.

**Warning Signs:**
- Emails work during initial testing, then stop
- Users report not receiving approval/rejection notifications
- No error thrown - emails simply don't send
- "Email rate limit exceeded" in Supabase logs

**Prevention:**
1. **Use third-party SMTP from day one** - Configure Resend, Sendgrid, or Mailtrap
2. **Queue-based approach** - Store notifications in a table, process via Edge Function cron
3. **Batch notifications** - Aggregate multiple updates into single emails

```typescript
// Instead of sending immediately:
await sendApprovalEmail(user.email);

// Queue for batch processing:
await supabase.from('notification_queue').insert({
  user_id: user.id,
  type: 'submission_approved',
  payload: { submission_id, cafe_name },
  scheduled_at: new Date()
});
```

**Phase:** Phase 4 (Email Notifications) - Configure SMTP before implementing notification logic

**Confidence:** HIGH - Based on [Supabase Email Docs](https://supabase.com/docs/guides/functions/examples/send-emails) and [Mailtrap Supabase Guide](https://mailtrap.io/blog/supabase-send-email/)

---

### 3. Avatar Upload - Orphaned Files Not Deleted

**Risk:** When users update their avatar, the old file is NOT automatically deleted from Supabase Storage, even with `upsert: true`. Storage fills with orphaned files.

**Warning Signs:**
- Storage bucket size grows unboundedly
- Multiple avatar files per user in storage
- `upsert: true` is used but old files persist
- Trying to delete old file manually returns "file not found"

**Prevention:**
```typescript
// Use CONSISTENT file path per user - replaces automatically
const avatarPath = `avatars/${user.id}/avatar.jpg`; // Always same path

// Upload with upsert
const { error } = await supabase.storage
  .from('avatars')
  .upload(avatarPath, file, {
    upsert: true, // Overwrites existing file at same path
    cacheControl: '3600'
  });

// DON'T use unique filenames like:
// `avatars/${user.id}/${crypto.randomUUID()}.jpg` // Creates orphans!
```

**Phase:** Phase 3 (Profile Settings) - Establish consistent path pattern before implementing upload

**Confidence:** HIGH - Based on [Supabase Issue #2443](https://github.com/supabase/supabase/issues/2443) and [Supabase Discussion #13741](https://github.com/orgs/supabase/discussions/13741)

---

### 4. Text Reviews - Stored XSS via Bio/Review Content

**Risk:** User-submitted text (bio, review content, notes) can contain malicious scripts that execute when displayed to other users.

**Warning Signs:**
- Raw HTML allowed in text fields
- User content rendered with `dangerouslySetInnerHTML`
- No sanitization before database storage
- User reports seeing unexpected alerts or redirects

**Prevention:**
```typescript
// 1. Server-side: Validate and sanitize on input
import DOMPurify from 'isomorphic-dompurify';

const sanitizedBio = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: [], // Strip ALL HTML for plain text fields
  ALLOWED_ATTR: []
});

// 2. Database: Use text columns with length limits
CREATE TABLE reviews (
  content TEXT CHECK (char_length(content) <= 2000),
  -- NOT: content TEXT (unlimited)
);

// 3. Client-side: Escape output by default (React does this)
<p>{review.content}</p> // Safe - React escapes

// NEVER do this:
<p dangerouslySetInnerHTML={{ __html: review.content }} />
```

**Phase:** Phase 2 (Text Reviews) - Add sanitization middleware before building review submission

**Confidence:** HIGH - Based on [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

## High-Risk Pitfalls

### 5. Favorites Toggle - Optimistic UI Race Conditions

**Risk:** Rapid clicking of favorite button causes race conditions where UI state becomes out of sync with database, or duplicate/orphaned records are created.

**Warning Signs:**
- User clicks favorite rapidly, heart icon flickers
- Console shows "duplicate key violation" errors
- Favorites count shows wrong number temporarily
- Network tab shows multiple in-flight requests for same action

**Prevention:**
```typescript
// Option 1: Debounce + disable during request
const [isPending, setIsPending] = useState(false);

const toggleFavorite = async () => {
  if (isPending) return; // Prevent double-click
  setIsPending(true);

  // Optimistic update
  setIsFavorited(!isFavorited);

  try {
    await supabase.from('favorites').upsert({
      user_id: userId,
      cafe_id: cafeId
    }, { onConflict: 'user_id,cafe_id' });
  } catch (error) {
    // Rollback on failure
    setIsFavorited(isFavorited);
    toast.error('Failed to update favorites');
  } finally {
    setIsPending(false);
  }
};

// Option 2: Use React Query mutations with proper cancellation
const { mutate, isPending } = useMutation({
  mutationFn: toggleFavorite,
  onMutate: async () => {
    await queryClient.cancelQueries({ queryKey: ['favorites'] });
    // ... optimistic update
  }
});
```

**Phase:** Phase 1 (Favorites System) - Include debouncing in initial implementation

**Confidence:** MEDIUM - Based on [TkDodo's Concurrent Optimistic Updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query) and [React useOptimistic limitations](https://www.columkelly.com/blog/use-optimistic)

---

### 6. Password Reset - PKCE Flow Session Conflict

**Risk:** Password reset flow incorrectly signs in the user before they complete password change, causing session conflicts and clearing URL fragments.

**Warning Signs:**
- `onAuthStateChange` fires `SIGNED_IN` before `PASSWORD_RECOVERY`
- URL hash with reset token is cleared immediately on page load
- User appears logged in before changing password
- Password reset page shows wrong user or logged-in state

**Prevention:**
```typescript
// Use verifyOtp instead of relying on automatic session
const handlePasswordReset = async (token: string) => {
  // 1. Verify the OTP token
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'recovery'
  });

  if (error) {
    return redirect('/login?error=invalid_token');
  }

  // 2. Only THEN allow password update
  // Show password change form
};

// In email template, use token_hash format:
// {{ .ConfirmationURL }}?token_hash={{ .TokenHash }}&type=recovery
```

**Phase:** Phase 3 (Profile Settings - Password Reset) - Follow token_hash pattern from start

**Confidence:** HIGH - Based on [Supabase Password Reset Discussion](https://github.com/orgs/supabase/discussions/30402) and [auth-js Issue #349](https://github.com/supabase/auth-js/issues/349)

---

### 7. Profile Tabs - URL State Not Synced

**Risk:** Profile tabs use local state instead of URL, breaking back/forward navigation, shareability, and causing hydration mismatches.

**Warning Signs:**
- Browser back button doesn't return to previous tab
- Sharing profile URL doesn't open the same tab
- Page refreshes reset to first tab
- Hydration mismatch errors on tab state

**Prevention:**
```typescript
// Use URL params for tab state (Next.js 16 pattern)
// profile/page.tsx
import { useSearchParams } from 'next/navigation';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';

  return (
    <Tabs value={activeTab}>
      <TabsList>
        <TabsTrigger value="overview" asChild>
          <Link href="/profile?tab=overview">Overview</Link>
        </TabsTrigger>
        <TabsTrigger value="reviews" asChild>
          <Link href="/profile?tab=reviews">Reviews</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

// OR: Use parallel routes for server-rendered tabs
// app/profile/@reviews/page.tsx
// app/profile/@favorites/page.tsx
```

**Phase:** Phase 1 (Profile Overview) - Existing implementation uses Links which is correct, verify URL sync

**Confidence:** MEDIUM - Based on [Ariakit Tab Next Router](https://ariakit.org/examples/tab-next-router) and existing profile layout review

---

### 8. Database Webhook Email Triggers - Silent Failures

**Risk:** Using database webhooks to trigger Edge Functions for email notifications can fail silently with no error logging.

**Warning Signs:**
- Webhook entries appear in `supabase_functions.hooks` table
- Edge Function never executes (no logs)
- Rows missing from `net.http_request_queue`
- Works in staging but not production

**Prevention:**
```sql
-- 1. Check pg_net is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 2. Add webhook with proper authentication
-- In Supabase Dashboard, add Authorization header with service role key

-- 3. For reliability, use queue table pattern instead
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  -- ... notification data
);

-- Then use scheduled Edge Function to process queue
```

```typescript
// Edge Function with retry logic
Deno.cron("process-email-queue", "*/5 * * * *", async () => {
  const { data: pending } = await supabase
    .from('email_queue')
    .select()
    .eq('status', 'pending')
    .lt('attempts', 3)
    .limit(10);

  for (const item of pending ?? []) {
    try {
      await sendEmail(item);
      await supabase.from('email_queue')
        .update({ status: 'sent' })
        .eq('id', item.id);
    } catch (error) {
      await supabase.from('email_queue')
        .update({
          attempts: item.attempts + 1,
          last_error: error.message
        })
        .eq('id', item.id);
    }
  }
});
```

**Phase:** Phase 4 (Email Notifications) - Prefer queue pattern over direct webhooks

**Confidence:** MEDIUM - Based on [Supabase Webhook Discussion #36747](https://github.com/orgs/supabase/discussions/36747) and [Trigger.dev Supabase Guide](https://trigger.dev/docs/guides/frameworks/supabase-edge-functions-database-webhooks)

---

## Medium-Risk Pitfalls

### 9. Text Review Moderation - No Rate Limiting

**Risk:** Without rate limiting, spam bots or malicious users can flood the review system with fake content.

**Warning Signs:**
- Sudden spike in reviews from single user
- Similar review text across multiple cafes
- Reviews submitted faster than humanly possible
- Storage/database costs spike unexpectedly

**Prevention:**
```sql
-- Add rate limiting table (similar to existing submission_rate_limits)
CREATE TABLE review_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  review_count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  last_review_at TIMESTAMPTZ
);

-- Limit: 5 reviews per day per user
CREATE OR REPLACE FUNCTION check_review_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  limit_reset TIMESTAMPTZ;
BEGIN
  SELECT review_count, reset_at INTO current_count, limit_reset
  FROM review_rate_limits WHERE user_id = p_user_id;

  IF limit_reset < NOW() THEN
    RETURN TRUE; -- Reset period passed
  END IF;

  RETURN current_count < 5;
END;
$$ LANGUAGE plpgsql;
```

**Phase:** Phase 2 (Text Reviews) - Add rate limiting before building submission UI

**Confidence:** MEDIUM - Pattern from existing `submission_rate_limits` table

---

### 10. Avatar Storage RLS - Missing User Folder Isolation

**Risk:** Users can read/overwrite other users' avatars if storage RLS policies don't properly isolate by user ID folder.

**Warning Signs:**
- Users can list other users' avatar files
- Uploading to wrong path succeeds
- Avatar URLs are guessable and accessible

**Prevention:**
```sql
-- Storage policies for avatars bucket
-- Folder structure: avatars/{user_id}/avatar.jpg

-- Allow users to read any avatar (public display)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Only allow upload to own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only allow update/delete of own files
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Phase:** Phase 3 (Profile Settings) - Configure storage policies before implementing upload

**Confidence:** HIGH - Based on [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

---

### 11. Reviews Table Conflict - Existing vs New Schema

**Risk:** The database already has a `reviews` table (from initial schema) with different structure than what text reviews need. Migration could break existing functionality.

**Warning Signs:**
- Existing `reviews` table has dimension ratings (rating_food, rating_drinks, etc.)
- New requirement: text content with overall rating only
- Confusion about whether to alter table or create new
- Triggers on `reviews` table may have unintended effects

**Prevention:**
```sql
-- Option 1: Add text content to existing reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS title VARCHAR(200);

-- Update trigger to handle text reviews
-- Keep existing dimension ratings as optional

-- Option 2: Create separate user_reviews for text-only
-- Keep reviews for dimension ratings
CREATE TABLE user_reviews (
  id UUID PRIMARY KEY,
  cafe_id UUID REFERENCES cafes(id),
  user_id UUID REFERENCES auth.users(id),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  content TEXT,
  -- ...
);
```

**Phase:** Phase 2 (Text Reviews) - Audit existing schema before designing migration

**Confidence:** HIGH - Based on codebase analysis showing existing `reviews` table

---

### 12. Email Notification Preferences - Default Opt-In Risk

**Risk:** Automatically opting users into all email notifications without explicit consent can violate GDPR/privacy regulations and increase spam complaints.

**Warning Signs:**
- Users receive emails they didn't request
- Spam complaints to email provider
- Unsubscribe rate higher than industry average
- GDPR compliance audit failures

**Prevention:**
```sql
-- Email preferences table with explicit opt-in
CREATE TABLE email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  submission_approved BOOLEAN DEFAULT false, -- Opt-in required
  submission_rejected BOOLEAN DEFAULT false,
  review_responses BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt user to set preferences after signup
-- Don't send any non-transactional emails until preferences set
```

```typescript
// Before sending notification, check preference
const { data: prefs } = await supabase
  .from('email_preferences')
  .select('submission_approved')
  .eq('user_id', userId)
  .single();

if (!prefs?.submission_approved) {
  return; // User hasn't opted in
}
```

**Phase:** Phase 4 (Email Notifications) - Design preference system before implementing notifications

**Confidence:** MEDIUM - Based on GDPR best practices

---

### 13. Bio Field - Missing Length Validation

**Risk:** Bio field without length limits can cause UI overflow issues and increase storage costs.

**Warning Signs:**
- User bio breaks layout on profile cards
- Extremely long bios slow page rendering
- Database storage growing faster than expected
- Truncation logic differs between views

**Prevention:**
```sql
-- Add constraint to profiles table
ALTER TABLE profiles
ADD CONSTRAINT bio_length_check
CHECK (char_length(bio) <= 500);

-- Or update existing column
ALTER TABLE profiles
ALTER COLUMN bio TYPE VARCHAR(500);
```

```typescript
// Client-side validation with react-hook-form
const bioSchema = z.string()
  .max(500, 'Bio must be 500 characters or less')
  .optional();

// Show character count
<textarea
  {...register('bio')}
  maxLength={500}
/>
<span>{watchBio?.length ?? 0}/500</span>
```

**Phase:** Phase 3 (Profile Settings) - Add constraints to schema migration

**Confidence:** HIGH - Based on existing schema showing `bio TEXT` with no limit

---

## Phase-Specific Warning Matrix

| Phase | Pitfalls to Address | Priority |
|-------|---------------------|----------|
| **Phase 1: Favorites** | #1 (RLS), #5 (Race conditions), #7 (URL state) | Critical |
| **Phase 2: Text Reviews** | #4 (XSS), #9 (Rate limiting), #11 (Schema conflict) | Critical |
| **Phase 3: Settings** | #3 (Avatar orphans), #6 (Password PKCE), #10 (Storage RLS), #13 (Bio length) | High |
| **Phase 4: Email Notifications** | #2 (Rate limits), #8 (Webhook failures), #12 (Opt-in) | Critical |

## Integration Risks with Existing System

### Ratings vs Reviews Conflict
The codebase has both `cafe_ratings` (10-dimension slider ratings) and `reviews` (text reviews with dimension ratings). Clarify:
- Are text reviews separate from ratings?
- Should reviews include ratings or reference them?
- How do aggregations work across both tables?

### Profile Layout Already Exists
The existing `profile/layout.tsx` uses Tabs with Links. New features must:
- Preserve existing tab navigation pattern
- Not break the current layout structure
- Add new tabs in consistent manner

### Existing Triggers on Reviews Table
Multiple triggers exist on `reviews` table that update:
- Cafe aggregate ratings
- User review counts
- Helpful vote counts

Adding text review functionality must not break these triggers.

---

## Sources

- [Supabase RLS Complete Guide](https://vibeappscanner.com/supabase-row-level-security)
- [Supabase Storage Troubleshooting](https://supabase.com/docs/guides/storage/troubleshooting)
- [Supabase Email Configuration](https://mailtrap.io/blog/supabase-send-email/)
- [TkDodo's Optimistic Updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Supabase Password Reset Flow](https://github.com/orgs/supabase/discussions/30402)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)

---

*Researched: 2026-02-01*
*Milestone: Profile Enhancement (v1.3)*
