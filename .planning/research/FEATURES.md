# Features Research: Profile Enhancement (v1.3)

**Domain:** Cafe discovery app with user contributions
**Researched:** 2026-02-01
**Confidence:** HIGH (patterns well-established across Yelp, Google Maps, specialty coffee apps)

## Summary

Profile enhancement features in cafe/restaurant discovery apps follow well-established patterns. Users expect to see their contribution history (reviews, ratings), save favorites with organization capabilities, and control their notification preferences. The key differentiator in this space is providing meaningful organization tools (collections/lists) rather than a flat favorites list. The existing Cafes Seoul architecture already has database schema for favorites (with list_name support) and ratings, making this an integration task rather than a greenfield build.

**Key insight from existing codebase:** The `cafe_ratings` table stores 10-dimension ratings but has no text review field. The legacy `reviews` table exists but is separate from the rating system used in production. This means "My Reviews" is really "My Ratings" unless text reviews are added to `cafe_ratings`.

---

## My Reviews Tab

The My Reviews tab displays a user's rating and review history. Since Cafes Seoul uses a 10-dimension rating system (v1.1), this tab shows rated cafes with the user's scores.

### Table Stakes

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| List of user's ratings with cafe info | Core purpose of the tab | Low | Existing `cafe_ratings` table, `getUserRatings()` function |
| Click through to cafe detail | Users need to revisit rated cafes | Low | Existing cafe routes |
| Display overall star rating | Quick visual summary | Low | `overall` field in ratings |
| Sort by date (newest first) | Standard chronological view | Low | `created_at` field exists |
| Pagination/infinite scroll | Handle users with many ratings | Low | Standard pattern |
| Empty state with CTA | Guide new users to rate | Low | Standard pattern |

### Differentiators

| Feature | Value Proposition | Complexity | Depends On |
|---------|-------------------|------------|------------|
| Optional text review with rating | Users can add context beyond stars | Medium | Schema change: add `review_text` to `cafe_ratings` |
| Show dimension breakdown on hover/expand | Users see their detailed scoring | Low | Data already in `cafe_ratings` |
| Filter by rating level (5-star, 4-star, etc.) | Find favorites quickly | Low | Frontend filter |
| Sort by cafe name (alphabetical) | Alternative organization | Low | Frontend sort |
| Edit rating inline (modal) | Convenience for updates | Medium | Existing `RatingForm` component |
| Delete rating with confirmation | Remove unwanted ratings | Low | Existing `deleteRating()` function |

### Dependencies on Existing Features

- **cafe_ratings table** (v1.1): Contains all rating data with 10 dimensions
- **getUserRatings() function**: Already fetches ratings with cafe info (name, slug)
- **RatingForm component**: Can be reused for edit modal
- **Dashboard RatingsList**: Similar component exists, can be adapted

---

## Favorites System

Favorites (bookmarks) allow users to save cafes for later. The schema already supports this with a `favorites` table including `list_name` for collections.

### Table Stakes

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| Heart icon on cafe cards | Universal "save" affordance | Low | New component, update cafe cards |
| Heart icon on cafe detail page | Save from any context | Low | New component |
| Toggle favorite on/off | Add and remove easily | Low | `favorites` table RLS policies needed |
| Favorites list in profile | View all saved cafes | Low | Query `favorites` with cafe join |
| Show cafe card info (name, rating, photo) | Quick reference | Low | Existing cafe card pattern |
| Empty state with CTA | Guide users to browse | Low | Standard pattern |

### Differentiators

| Feature | Value Proposition | Complexity | Depends On |
|---------|-------------------|------------|------------|
| Collections (named lists) | Organize by purpose ("Work cafes", "Date spots") | Medium | `list_name` field already in schema |
| Notes on favorites | Personal annotations | Low | `notes` field already in schema |
| Favorites on map view | Spatial visualization | Medium | Existing map infrastructure |
| Sort by distance (current location) | Find nearby saved cafes | Medium | Geolocation API |
| Sort by rating | Find best saved cafes | Low | Join with cafes table |
| Sort by date added | Chronological view | Low | `created_at` field |
| Share collection (public link) | Social discovery | High | New public routes, privacy settings |

### Dependencies on Existing Features

- **favorites table** (initial schema): Already exists with `list_name` and `notes` support
- **Cafe cards**: Need to add heart icon overlay
- **Cafe detail page**: Need to add favorite button
- **RLS policies**: May need update for favorites CRUD

---

## Settings Page

Settings provides profile editing and account management. The profile layout already has a Settings tab route defined.

### Table Stakes

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| Edit display name | Basic personalization | Low | `profiles.display_name` column |
| Edit bio | Self-description | Low | `profiles.bio` column |
| Change language preference | Match i18n system | Low | `profiles.preferred_language` column |
| Sign out | Basic auth flow | Low | Existing signout function |
| Account info display (email, member since) | Transparency | Low | Data from `auth.users` |

### Differentiators

| Feature | Value Proposition | Complexity | Depends On |
|---------|-------------------|------------|------------|
| Avatar upload | Visual identity | Medium | Supabase Storage bucket, RLS policies |
| Password reset (email link) | Self-service recovery | Medium | Supabase Auth `resetPasswordForEmail()` |
| Notification preferences | User control | Low | New table or profile columns |
| Delete account | GDPR/privacy compliance | Medium | Cascading deletes, confirmation flow |
| Username change (with uniqueness check) | Identity updates | Medium | `profiles.username` unique constraint |
| Connected accounts list (OAuth) | Transparency about linked logins | Low | Query `auth.identities` |

### Dependencies on Existing Features

- **profiles table**: Already has display_name, bio, preferred_language, avatar_url
- **Supabase Auth**: Provides password reset, user metadata
- **i18n system**: 5 languages supported (en, ko, fr, zh, vi)

---

## Notifications

Email notifications for submission status changes (approval/rejection). The app has cafe submissions and photo submissions that go through moderation.

### Table Stakes

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| Email on cafe submission approved | Confirmation of success | Medium | Supabase Edge Function or webhook |
| Email on cafe submission rejected (with reason) | Actionable feedback | Medium | Same infrastructure as above |
| Email on photo approved | Photo contribution confirmed | Medium | Same infrastructure |
| Email on photo rejected (with reason) | Actionable feedback | Medium | Same infrastructure |
| Unsubscribe link in email | Legal requirement, user control | Low | Token-based or profile setting |

### Differentiators

| Feature | Value Proposition | Complexity | Depends On |
|---------|-------------------|------------|------------|
| Notification preferences by type | Granular control (submissions vs photos) | Low | New preference columns or table |
| In-app notification center | Real-time updates without email | High | New infrastructure (WebSocket or polling) |
| Push notifications (PWA) | Instant mobile alerts | High | Service Worker, VAPID keys |
| Weekly digest of activity | Summary without spam | Medium | Cron job for batch emails |
| Email templates with branding | Professional appearance | Low | Custom SMTP with branded templates |

### Implementation Options (ranked by effort)

1. **Supabase Database Webhooks** (Low effort): Trigger HTTP endpoint on status change, send email via Resend/SendGrid
2. **Supabase Edge Functions** (Medium effort): More control, can include complex logic
3. **Database triggers + Edge Functions** (Medium effort): Trigger inserts to queue table, Edge Function processes queue

### Dependencies on Existing Features

- **cafe_submissions table**: Has `status` column (pending/approved/declined)
- **photos table**: Has `status` column (pending/approved/rejected)
- **Custom SMTP**: Required for production (Supabase default is 2 emails/day)
- **profiles.email**: Need to join with auth.users for email address

---

## Anti-Features

Features to explicitly NOT build. These add complexity without core value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time in-app notifications | High complexity (WebSocket infrastructure), low value for moderation-based app | Email notifications are sufficient for async approval flow |
| Social follow system | Adds social network complexity, distracts from cafe discovery | Keep focus on cafes, not people |
| Review comments/replies | Creates moderation burden, adds conversational complexity | Ratings + optional text review are sufficient |
| Review editing after 24 hours | Complicates data integrity, enables review manipulation | Allow updates within 24h window only |
| Public user activity feed | Privacy concerns, "stalking" behavior | Keep reviews public but don't aggregate user activity |
| Gamification badges | Adds complexity, needs careful design to avoid gaming | Simple contribution counts are sufficient |
| Dark patterns for notifications | Opt-out buried, aggressive defaults | Default to minimal notifications, easy controls |
| Review photos separate from cafe photos | Duplicates photo infrastructure | Use existing photo system with optional review association |

---

## Feature Dependencies Map

```
                 +-----------------+
                 | Profile Layout  |
                 | (already exists)|
                 +--------+--------+
                          |
          +---------------+---------------+
          |               |               |
     +----v----+    +-----v-----+   +-----v-----+
     |   My    |    | Favorites |   | Settings  |
     | Reviews |    |   Tab     |   |   Tab     |
     +----+----+    +-----+-----+   +-----+-----+
          |               |               |
          |               |               |
          v               v               v
   cafe_ratings      favorites       profiles
   (exists)          (exists)        (exists)
                                          |
                                          v
                                    +-----+-----+
                                    | Supabase  |
                                    | Storage   |
                                    | (avatar)  |
                                    +-----------+

                          +
                          |
               +----------v----------+
               | Email Notifications |
               +----------+----------+
                          |
          +---------------+---------------+
          |               |               |
   +------v------+ +------v------+ +------v------+
   | Submissions | |   Photos    | | Preferences |
   | Status Hook | | Status Hook | |   Table     |
   +-------------+ +-------------+ +-------------+
```

---

## MVP Recommendation

For v1.3 MVP, prioritize table stakes that leverage existing schema:

### Must Have (Week 1-2)

1. **My Reviews tab** with rating list, click-through, pagination
2. **Favorites toggle** (heart icon) on cafe cards and detail page
3. **Favorites list** in profile with basic sorting
4. **Settings: Profile edit** (display name, bio, language)

### Should Have (Week 2-3)

5. **Settings: Password reset** via email link
6. **Text review field** added to ratings (optional)
7. **Notification preferences** toggle in settings
8. **Email on submission approved/rejected**

### Nice to Have (Week 3+)

9. **Favorites collections** (named lists)
10. **Avatar upload** to Supabase Storage
11. **Delete account** with confirmation
12. **Favorites on map**

---

## Sources

- [Farm and City Coffee App](https://mariandthecity.com/best-apps-to-find-cafes/) - Profile and reviews patterns
- [Roasters App](https://www.roasters.app/) - Coffee shop logging and journey tracking
- [Yelp Collections Feature](https://smartphones.gadgethacks.com/how-to/use-yelp-collections-find-new-places-keep-your-bookmarked-locations-more-organized-0194859/) - Bookmarks organization pattern
- [Smashing Magazine: Reviews and Ratings UX](https://smart-interface-design-patterns.com/articles/reviews-and-ratings-ux/) - Rating patterns and optional reviews
- [Supabase Sending Emails](https://supabase.com/docs/guides/functions/examples/send-emails) - Edge Function email pattern
- [Supabase Email Notifications Guide](https://bootstrapped.app/guide/how-to-implement-email-notifications-in-supabase) - Database webhook approach
- [Notification UX Best Practices](https://userpilot.com/blog/notification-ux/) - User control and personalization
- [Material Design Settings Pattern](https://m1.material.io/patterns/settings.html) - Settings page organization

---
*Researched: 2026-02-01*
