# Project Research Summary

**Project:** Cafes Seoul - Profile Enhancement (v1.3)
**Domain:** Profile features, favorites, reviews, settings, email notifications
**Researched:** 2026-02-01
**Confidence:** HIGH

## Executive Summary

Profile enhancement features for cafe discovery apps are well-established patterns with clear implementations. The Cafes Seoul codebase already has foundational infrastructure: existing `cafe_ratings` table (10-dimension ratings), `favorites` table with `list_name` and `notes` fields, `profiles` table with display name and preferences, and complete Supabase Auth with OAuth. The v1.3 milestone is primarily an integration task leveraging existing schema rather than greenfield development.

The recommended approach is phased delivery starting with core profile tabs (My Reviews, Favorites list, Settings page), then extending with text reviews and password reset, and finally adding email notifications via Supabase Edge Functions with Resend. Minimal new dependencies are required: Resend for email (Edge Function only), optionally browser-image-compression for avatar optimization. All other features use existing patterns from the photos and ratings systems.

Key risks center on email notification infrastructure (first time implementing Edge Functions in this project) and avatar storage policies (new bucket with RLS). Password reset uses native Supabase Auth methods so risk is low. The favorites and reviews features are pure database queries with existing patterns.

## Key Findings

### Recommended Stack

**Stack additions are minimal.** The existing Next.js 16 + Supabase stack handles all profile features natively.

**Core technologies (existing, validated):**
- `@supabase/supabase-js@2.93.1`: Password reset via `resetPasswordForEmail()` and `updateUser()` - no new auth libraries needed
- `@supabase/ssr@0.8.0`: Server-side session management already configured
- `react-hook-form` + `zod`: Form handling for profile editing and review submission
- Supabase Storage: Avatar uploads using existing photo patterns

**New additions:**
- `resend@6.9.1` (Edge Functions only): Email notifications for submission status changes - 3,000 free emails/month sufficient for this use case
- `browser-image-compression@2.0.2` (optional): Client-side avatar compression before upload to reduce bandwidth

**Explicitly avoid:**
- NextAuth/Auth.js - Supabase Auth already handles password reset
- Nodemailer - Resend is simpler for Edge Functions
- sharp - Native binary complexity; use browser-image-compression instead

### Expected Features

**Must have (table stakes):**
- My Reviews tab with list of user's ratings and cafe info
- Heart icon toggle on cafe cards and detail page
- Favorites list in profile with click-through to cafes
- Settings page with profile editing (display name, bio)
- Email notifications on submission approval/rejection

**Should have (competitive):**
- Optional text review field added to ratings
- Password reset via email link (self-service)
- Notification preferences toggle
- Sort favorites by date added or rating
- Avatar upload with image preview

**Defer (v2+):**
- Collections (named favorites lists) - schema supports it but adds UI complexity
- Favorites on map view - requires geolocation integration
- Delete account with cascading deletes - needs careful GDPR planning
- In-app notification center - high complexity (WebSocket infrastructure)
- Share collection via public link - privacy and URL generation complexity

### Architecture Approach

The profile enhancement follows a tab-based layout pattern already established in `/profile`. Each tab is a separate route segment (`/profile/reviews`, `/profile/favorites`, `/profile/settings`) using Next.js App Router conventions. Data fetching happens in Server Components with `getUser()` validation, while interactive forms use Client Components with Server Actions.

**Major components:**
1. **Profile Tab Layout** - Existing layout with tab navigation; add new tab routes
2. **Reviews List Component** - Displays `cafe_ratings` with optional text review; adapts existing ratings display pattern
3. **Favorites Component** - Heart toggle button (reusable), favorites list with cafe cards
4. **Settings Form** - Profile editing form with Supabase profile update; password reset trigger
5. **Email Edge Function** - Supabase Edge Function triggered by database webhook on `cafe_submissions` status change

**Data flow:**
```
Profile Page (Server Component)
    -> getUser() validation
    -> Fetch from profiles/ratings/favorites tables
    -> Pass to Client Components for interactivity

Heart Toggle (Client Component)
    -> Optimistic UI update
    -> Server Action inserts/deletes from favorites
    -> TanStack Query cache invalidation

Settings Form (Client Component)
    -> react-hook-form + zod validation
    -> Server Action updates profiles table
    -> Password reset triggers Supabase email flow

Submission Status Change (Database)
    -> Database Webhook triggers Edge Function
    -> Edge Function calls Resend API
    -> Email sent to user
```

### Critical Pitfalls

1. **Using `getSession()` instead of `getUser()` in Server Components** - Always use `getUser()` for auth validation as it cryptographically verifies the JWT. `getSession()` only reads cookies without verification, enabling potential auth bypass.

2. **Avatar storage without proper RLS policies** - Create dedicated `avatars` bucket with policies restricting users to their own files. Path pattern: `avatars/{userId}/avatar.{ext}`. Without RLS, any user could overwrite another's avatar.

3. **Password reset email redirect URL not whitelisted** - Add all redirect URLs to Supabase Dashboard before testing. Include `http://localhost:3000/auth/reset-password` for development and production URL. Missing entries cause silent failures.

4. **Email rate limiting during development** - Supabase limits to 2 emails/hour with built-in provider. Configure custom SMTP (Resend) early to avoid blocking QA testing of password reset and notifications.

5. **Hydration mismatch on auth state** - Avoid reading auth state differently between server and client. Fetch user in Server Component and pass to Client Components, or use skeleton loading states until client mount completes.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Profile Foundation
**Rationale:** Establishes the profile tab infrastructure that all other features depend on. No new dependencies required.
**Delivers:** Working profile layout with My Reviews tab showing user's ratings
**Addresses:** My Reviews list, pagination, empty states, click-through to cafes
**Avoids:** No auth changes needed; uses existing middleware protection

### Phase 2: Favorites System
**Rationale:** High-visibility feature (heart icon) that touches multiple UI surfaces. Should come after profile foundation is solid.
**Delivers:** Heart toggle on all cafe cards and detail pages, favorites tab in profile
**Uses:** Existing `favorites` table schema, Lucide React icons, TanStack Query for optimistic updates
**Avoids:** Defer collections (named lists) to v2 despite schema support - reduces UI scope

### Phase 3: Settings & Profile Editing
**Rationale:** Lower user-facing visibility than reviews/favorites but enables account management. Depends on profile layout from Phase 1.
**Delivers:** Profile editing form, language preference, notification preferences
**Uses:** Existing profiles table, react-hook-form patterns from submission forms
**Implements:** Settings tab UI, profile update Server Actions

### Phase 4: Password Reset & Avatar
**Rationale:** Security-critical feature requiring email flow testing. Avatar upload reuses existing Storage patterns.
**Delivers:** Self-service password reset, avatar upload with preview
**Uses:** Supabase Auth `resetPasswordForEmail()`, Supabase Storage with new `avatars` bucket
**Avoids:** Email rate limiting - test with custom SMTP from start

### Phase 5: Text Reviews
**Rationale:** Extends existing ratings with optional text. Lower priority than core profile features.
**Delivers:** Text review field in rating form, display reviews on cafe pages
**Uses:** Schema migration to add `review_text` column to `cafe_ratings`
**Implements:** Extended rating form, review display component

### Phase 6: Email Notifications
**Rationale:** First Edge Function implementation - higher risk, should come last. Depends on notification preferences from Phase 3.
**Delivers:** Email on submission approved/rejected
**Uses:** Resend API via Supabase Edge Function, Database Webhook triggers
**Implements:** Edge Function infrastructure, email templates

### Phase Ordering Rationale

- **Foundation first:** Profile tabs provide the container for all other features. Building the skeleton first prevents rework.
- **Favorites early:** High-impact user-facing feature that adds value immediately. Heart icons are visible across the entire app.
- **Settings before auth features:** Notification preferences must exist before building email notifications.
- **Password reset before notifications:** Both use email, so password reset validates email infrastructure before more complex Edge Function work.
- **Edge Functions last:** First-time infrastructure in this project. Isolating to final phase reduces risk of blocking other features.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 6 (Email Notifications):** First Edge Function implementation in project. Need to verify Resend + Supabase Edge Function integration patterns, database webhook setup, and Deno runtime requirements.
- **Phase 4 (Avatar):** Storage bucket RLS policies need careful design. Research existing photo bucket policies and adapt for single-file-per-user pattern.

Phases with standard patterns (skip research-phase):
- **Phase 1 (My Reviews):** Standard database query + list display. Existing ratings components can be adapted.
- **Phase 2 (Favorites):** Common heart toggle pattern, existing table schema.
- **Phase 3 (Settings):** Standard form with profile update. No new concepts.
- **Phase 5 (Text Reviews):** Simple schema migration + textarea field.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Minimal additions; all packages verified via npm and official docs |
| Features | HIGH | Well-established patterns from Yelp, Google Maps, specialty coffee apps |
| Architecture | HIGH | Extends existing codebase patterns; profile layout already exists |
| Pitfalls | HIGH | Auth pitfalls from v1.0 research still apply; email pitfalls documented |

**Overall confidence:** HIGH

### Gaps to Address

- **Edge Function deployment:** First-time infrastructure. Document deployment process during Phase 6 implementation.
- **Email template i18n:** Need Korean and English versions of notification emails. Get translations reviewed before launch.
- **Avatar file size limits:** Decide on max file size and whether to use client-side compression. Consider Supabase Pro image transforms if budget allows.
- **Review moderation:** Text reviews may need moderation workflow. Defer to v2 or launch with admin review capability.

## Sources

### Primary (HIGH confidence)
- [Supabase resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) - Password reset API
- [Supabase Sending Emails with Edge Functions](https://supabase.com/docs/guides/functions/examples/send-emails) - Resend integration pattern
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control) - RLS for avatars bucket
- [Resend npm package v6.9.1](https://github.com/resend/resend-node/releases) - Latest verified version

### Secondary (MEDIUM confidence)
- [Farm and City Coffee App](https://mariandthecity.com/best-apps-to-find-cafes/) - Profile and reviews patterns
- [Yelp Collections Feature](https://smartphones.gadgethacks.com/how-to-use-yelp-collections-find-new-places-keep-your-bookmarked-locations-more-organized-0194859/) - Favorites organization pattern
- [Notification UX Best Practices](https://userpilot.com/blog/notification-ux/) - User control patterns

### Tertiary (LOW confidence)
- React Email templates - Optional, can use plain HTML initially

---
*Research completed: 2026-02-01*
*Ready for roadmap: yes*
