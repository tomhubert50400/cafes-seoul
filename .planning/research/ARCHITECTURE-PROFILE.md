# Architecture Research: Profile Enhancement

## Summary

Profile enhancement features integrate cleanly with the existing Next.js 16 App Router + Supabase architecture. The database already has foundational tables (`profiles`, `favorites`, `reviews`) with RLS policies in place. Key integration work involves: (1) extending `cafe_ratings` with optional review text, (2) wiring up the unused `favorites` table, (3) building profile editing UI/actions, (4) implementing password reset with Supabase Auth's built-in flow, and (5) adding notification preferences table with email integration. The existing Server Actions pattern and cookie-based auth from `@supabase/ssr` provide a consistent integration model.

## Database Changes

### Existing Tables (Already Created)

The initial schema already includes several tables that are defined but not fully utilized:

| Table | Status | Usage |
|-------|--------|-------|
| `profiles` | EXISTS | Has `avatar_url`, `bio`, `display_name`, `preferred_language` - needs UI |
| `favorites` | EXISTS | Complete schema with `list_name`, `notes` - needs Server Actions |
| `reviews` | EXISTS | Full review schema - but app uses `cafe_ratings` instead |
| `cafe_ratings` | EXISTS | 10-dimension ratings - NO text review field currently |

### New Tables Required

#### `notification_preferences`

```sql
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    -- Primary key = user_id (one row per user)
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Email notification toggles
    email_new_reply BOOLEAN DEFAULT TRUE,        -- Someone replies to your review
    email_rating_helpful BOOLEAN DEFAULT TRUE,   -- Your rating marked helpful
    email_cafe_updates BOOLEAN DEFAULT FALSE,    -- Updates to cafes you've reviewed
    email_weekly_digest BOOLEAN DEFAULT FALSE,   -- Weekly summary email
    email_marketing BOOLEAN DEFAULT FALSE,       -- Marketing/promotional emails

    -- Push notification toggles (future)
    push_enabled BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only access their own preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Modified Tables

#### `cafe_ratings` - Add Review Text

```sql
-- Add optional text review column to existing cafe_ratings table
ALTER TABLE public.cafe_ratings
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS review_title VARCHAR(200);

-- Index for searching reviews
CREATE INDEX IF NOT EXISTS idx_cafe_ratings_review_text
ON public.cafe_ratings USING gin(to_tsvector('english', review_text))
WHERE review_text IS NOT NULL;

COMMENT ON COLUMN public.cafe_ratings.review_text IS 'Optional text review accompanying the rating';
COMMENT ON COLUMN public.cafe_ratings.review_title IS 'Optional title for the review';
```

**Rationale:** Adding `review_text` to `cafe_ratings` rather than using the separate `reviews` table keeps the one-rating-per-cafe constraint intact and simplifies the data model. Users rate AND review in one submission.

#### `profiles` - Already Has Required Columns

The `profiles` table already has all needed columns:
- `avatar_url TEXT` - Present
- `bio TEXT` - Present
- `display_name VARCHAR(100)` - Present
- `preferred_language VARCHAR(10)` - Present
- `username VARCHAR(50)` - Present

No schema changes needed - just needs Server Actions and UI.

### Favorites Table Analysis

The `favorites` table is already complete with RLS policies:

```sql
-- Already exists from 00001_initial_schema.sql
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE,
    list_name VARCHAR(100) DEFAULT 'default',  -- Supports multiple lists
    notes TEXT,                                  -- Personal notes about the cafe
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cafe_id, list_name)
);
```

RLS policies already exist:
- `"Users can view own favorites"` - SELECT only own
- `"Authenticated users can create favorites"` - INSERT with user_id check
- `"Users can delete own favorites"` - DELETE only own

## New Components

### Server Actions

| Action | File | Purpose |
|--------|------|---------|
| `updateProfile` | `src/lib/actions/profile.ts` | Update display_name, bio, username, preferred_language |
| `uploadAvatar` | `src/lib/actions/profile.ts` | Upload avatar to Supabase Storage, update profiles.avatar_url |
| `addFavorite` | `src/lib/actions/favorites.ts` | Add cafe to favorites with optional notes |
| `removeFavorite` | `src/lib/actions/favorites.ts` | Remove cafe from favorites |
| `getFavorites` | `src/lib/actions/favorites.ts` | Get user's favorites with cafe details |
| `toggleFavorite` | `src/lib/actions/favorites.ts` | Toggle favorite status (for quick UI action) |
| `requestPasswordReset` | `src/app/actions/auth.ts` | Wraps `supabase.auth.resetPasswordForEmail()` |
| `updatePassword` | `src/app/actions/auth.ts` | Wraps `supabase.auth.updateUser({ password })` |
| `updateNotificationPreferences` | `src/lib/actions/notifications.ts` | Update email preferences |
| `getNotificationPreferences` | `src/lib/actions/notifications.ts` | Get current preferences (with defaults) |

### UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProfileEditForm` | `src/components/profile/profile-edit-form.tsx` | Form for editing profile info |
| `AvatarUpload` | `src/components/profile/avatar-upload.tsx` | Avatar upload with preview and crop |
| `FavoriteButton` | `src/components/favorites/favorite-button.tsx` | Heart icon toggle on cafe cards/detail |
| `FavoritesList` | `src/components/favorites/favorites-list.tsx` | List of user's favorite cafes |
| `ReviewTextInput` | `src/components/ratings/review-text-input.tsx` | Text area for review within rating form |
| `PasswordResetForm` | `src/components/auth/password-reset-form.tsx` | Request password reset email |
| `UpdatePasswordForm` | `src/components/auth/update-password-form.tsx` | Set new password after reset link |
| `NotificationSettings` | `src/components/settings/notification-settings.tsx` | Toggle switches for email preferences |
| `SettingsLayout` | `src/components/settings/settings-layout.tsx` | Tabbed settings page structure |

### New Pages

| Route | File | Purpose |
|-------|------|---------|
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Password reset request form |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | New password entry after email link |
| `/profile/edit` | `src/app/profile/edit/page.tsx` | Profile editing page |

## Integration Points

### Existing Component Changes

| Component | Change Required |
|-----------|-----------------|
| `CafeCard` | Add `FavoriteButton` overlay in corner |
| `CafeDetailContent` | Add `FavoriteButton` in header, integrate into actions |
| `RatingForm` | Add `ReviewTextInput` section after star ratings |
| `LoginForm` | Add "Forgot password?" link below password field |
| `Header` | Already has user menu - no changes needed |
| `ProfileLayout` | Tab navigation already exists - wire up active states |

### Auth Flow Integration

Password reset uses Supabase Auth's built-in flow:

```
User Request Flow:
1. User clicks "Forgot password?" on login page
2. User enters email on /forgot-password
3. Server Action calls supabase.auth.resetPasswordForEmail()
4. Supabase sends email with reset link
5. User clicks link -> redirects to /reset-password
6. Page detects PASSWORD_RECOVERY event via onAuthStateChange
7. User enters new password
8. Server Action calls supabase.auth.updateUser({ password })
9. Redirect to /login with success message
```

Key integration: The `redirectTo` parameter must be configured in Supabase Dashboard under Authentication > URL Configuration.

### Favorites Data Flow

```
Add Favorite Flow:
1. User clicks heart icon on CafeCard or CafeDetailContent
2. FavoriteButton calls toggleFavorite Server Action
3. Server Action checks auth, then:
   - If favorite exists: DELETE from favorites
   - If not exists: INSERT into favorites
4. revalidatePath for cafe page and /profile/favorites
5. Optimistic UI update on button

Display Flow:
1. /profile/favorites page calls getFavorites Server Action
2. Query joins favorites -> cafes for cafe info
3. FavoritesList renders cafe cards with remove buttons
```

### Profile Edit Data Flow

```
Profile Update Flow:
1. User navigates to /profile/edit
2. Page fetches current profile from profiles table
3. User modifies form fields
4. Submit calls updateProfile Server Action
5. Server Action validates with Zod, updates profiles table
6. revalidatePath('/profile')

Avatar Upload Flow:
1. User selects image via AvatarUpload component
2. Client-side: crop/resize to 256x256
3. Submit calls uploadAvatar Server Action
4. Server Action:
   a. Validates file (size, type)
   b. Uploads to Supabase Storage: avatars/{user_id}/{timestamp}.jpg
   c. Deletes old avatar if exists
   d. Updates profiles.avatar_url
5. revalidatePath('/profile')
```

### Review Text Integration

Modify existing rating flow:

```
Extended Rating Flow:
1. User opens rating modal (existing)
2. After star ratings, new "Add a review (optional)" section
3. Title input (200 chars) + text area (2000 chars)
4. Submit calls modified submitRating Server Action
5. Server Action:
   - Existing rating upsert logic
   - Add review_title and review_text to upsert
6. Display reviews on cafe page below ratings section
```

### Notification Preferences

```
Preferences Flow:
1. User navigates to /profile/settings
2. Settings page has "Notifications" tab
3. Load preferences (create defaults if not exists)
4. Toggle switches call updateNotificationPreferences
5. Debounced updates on each toggle change

Email Integration (Future):
- Supabase Edge Functions for sending emails
- Or: Resend/SendGrid integration via API routes
- Triggered by database webhooks or scheduled jobs
```

## Suggested Build Order

### Phase 1: Profile Editing
**Why first:** Foundation for user identity, no dependencies

1. Create `src/lib/actions/profile.ts` with updateProfile
2. Create `src/lib/validations/profile.ts` with Zod schemas
3. Create `ProfileEditForm` component
4. Create `/profile/edit` page
5. Add "Edit Profile" button to existing profile page
6. Test: Update display name, bio

### Phase 2: Avatar Upload
**Depends on:** Phase 1 profile infrastructure

1. Create Supabase Storage bucket: `avatars`
2. Configure bucket policies (public read, authenticated upload)
3. Create `uploadAvatar` Server Action
4. Create `AvatarUpload` component with crop
5. Integrate into profile edit form
6. Test: Upload, preview, save

### Phase 3: Favorites System
**Why third:** Independent feature, high user value

1. Create `src/lib/actions/favorites.ts` with CRUD actions
2. Create `FavoriteButton` component
3. Create `FavoritesList` component
4. Integrate `FavoriteButton` into `CafeCard`
5. Integrate `FavoriteButton` into `CafeDetailContent`
6. Implement `/profile/favorites` page (replace placeholder)
7. Test: Add/remove favorites, view list

### Phase 4: Text Reviews
**Depends on:** Existing rating system

1. Create migration: add `review_text`, `review_title` to `cafe_ratings`
2. Update `RatingInput` type to include review fields
3. Update `ratingFormSchema` validation
4. Create `ReviewTextInput` component
5. Integrate into `RatingForm`
6. Update `submitRating` Server Action
7. Create `ReviewDisplay` component for cafe detail
8. Test: Submit rating with review, display on cafe page

### Phase 5: Password Reset
**Why fifth:** Auth feature, isolated from other work

1. Add routes to ROUTES constant
2. Create `PasswordResetForm` component
3. Create `/forgot-password` page
4. Create `requestPasswordReset` Server Action
5. Create `UpdatePasswordForm` component
6. Create `/reset-password` page with auth state handling
7. Create `updatePassword` Server Action
8. Add "Forgot password?" link to login form
9. Configure redirect URL in Supabase Dashboard
10. Test: Full password reset flow

### Phase 6: Notification Preferences
**Why last:** Optional feature, requires email infrastructure

1. Create migration for `notification_preferences` table
2. Create `src/lib/actions/notifications.ts`
3. Create `NotificationSettings` component
4. Implement Settings page tabs structure
5. Wire up `/profile/settings` page (replace placeholder)
6. Test: Toggle preferences, verify persistence

### Phase 7: Email Sending (Optional/Future)
**Depends on:** Phase 6

1. Set up email provider (Resend recommended)
2. Create email templates
3. Implement Edge Function or API route for sending
4. Wire up database triggers or scheduled jobs
5. Test: Receive notification emails

## Technical Considerations

### Storage Configuration

For avatar uploads, configure Supabase Storage:

```sql
-- Storage bucket for avatars (run in Supabase Dashboard > Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Policy: Anyone can view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
```

### Password Reset URL Configuration

In Supabase Dashboard > Authentication > URL Configuration:
- Add `https://your-domain.com/reset-password` to Redirect URLs
- For local dev: Add `http://localhost:3000/reset-password`

### Existing Patterns to Follow

| Pattern | Example Location | Apply To |
|---------|------------------|----------|
| Server Actions | `src/lib/actions/ratings.ts` | All new actions |
| Zod Validation | `src/lib/validations/ratings.ts` | Profile, favorites |
| Supabase Client | `src/lib/supabase/server.ts` | All server-side queries |
| Type Transforms | `src/lib/supabase/transforms.ts` | New types (Favorite, NotificationPref) |
| i18n | `src/lib/i18n/translations.ts` | All new UI strings |
| Path Revalidation | `revalidatePath()` in actions | All mutations |

### RLS Policy Patterns

Follow existing patterns from `00002_rls_policies.sql`:

```sql
-- User owns resource pattern
USING (auth.uid() = user_id)

-- Authenticated can create pattern
WITH CHECK (auth.uid() = user_id)

-- Public read pattern
USING (true)
```

## Data Migration Notes

### Existing Data

- `profiles` table has data created by `handle_new_user()` trigger on signup
- Some profiles may have NULL values for `display_name`, `bio`, `avatar_url`
- `favorites` table is empty (feature not yet implemented)
- `cafe_ratings` exists with data - adding columns is non-breaking

### Migration Safety

All migrations are additive:
- Adding columns with NULL default: safe
- Adding new table: safe
- No existing column modifications
- No data transformations required

---
*Researched: 2026-02-01*

## Sources

- [Supabase Password Reset Documentation](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [Supabase Password-based Auth Guide](https://supabase.com/docs/guides/auth/passwords)
- Existing codebase analysis: `supabase/migrations/`, `src/lib/actions/`, `src/lib/supabase/`
