# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Filtrage multi-criteres avec notes 1-5 sur chaque dimension du cafe
**Current focus:** Phase 18 - Email Notifications

## Current Position

Phase: 18 of 18 (Email Notifications)
Plan: 2 of 4 in current phase
Status: In progress
Last activity: 2026-02-01 - Completed 18-02-PLAN.md

Progress: v1.0 [6 phases] v1.1 [5 phases] v1.2 [1 phase] v1.3 [5/6 phases] Phase 18 [2/4 plans]

## Performance Metrics

**Milestone v1.0:**
- Plans completed: 20
- Average duration: ~6 min/plan

**Milestone v1.1:**
- Plans completed: 24
- Phases: 7-11 (5 phases)
- Average: ~5 min/plan
- Timeline: 2 days

**Milestone v1.2:**
- Plans completed: 4
- Phase: 12 (1 phase)
- Average: ~6 min/plan
- Timeline: 1 day

**Milestone v1.3:**
- Plans completed: 19
- Phases: 13-18 (6 phases)
- Status: In progress (Phase 17 complete, Phase 18 in progress - 2/4 plans complete)
- Average: ~2.5 min/plan (Phase 18-01: 2min, 18-02: 2min)

## Accumulated Context

### Key Patterns (carry forward)

**Authentication:**
- Supabase Auth with Next.js 16 App Router
- `@supabase/ssr` for cookie-based sessions
- Server Actions for auth mutations
- `getUser()` not `getSession()` in server code
- Client components: use onAuthStateChange subscription to track auth state

**UI/UX:**
- Sonner for toast notifications
- react-hook-form + Zod for validation
- Tailwind animate-pulse for loading states
- i18n via next-intl (KO, EN, FR, ZH, VI)
- Unified tab state: When multiple tab groups should sync, use shared controlled state
- Nested layouts: child pages return content only, parent layout provides Header

**Database:**
- pg_trgm for fuzzy text search
- Rate limit reset at midnight KST
- Upsert pattern with ON CONFLICT
- Database triggers for aggregation
- AFTER triggers for notification queueing (don't block main operations)
- Partial indexes for efficient queue queries (WHERE sent_at IS NULL)

**Email (Phase 18):**
- Table-based HTML layouts for email client compatibility
- Translation objects for localized email content (5 languages)
- HMAC-signed tokens for secure unsubscribe links
- Opt-out model: notifications enabled by default
- Service role in Edge Functions for full database access

**Ratings (Phase 13):**
- WithImage type suffix for types including image URLs
- getDimensionLabel utility for localized dimension labels in src/lib/utils/ratings.ts
- getStorageUrl transform for consistent image URL generation

**Components (Phase 13):**
- Expand/collapse cards use max-height transition for smooth animation
- Empty states distinguish no-data vs filtered-empty for better UX guidance

**Favorites (Phase 14):**
- useOptimistic + useTransition + useState pattern for optimistic toggle
- justToggled state prevents animation on initial render
- Event propagation: preventDefault + stopPropagation for buttons inside Link
- Fetch favorite IDs in parallel with main data using Promise.all
- Auth-gated filter controls: visible but disabled with tooltip for logged-out users
- Colored markers: Pass isFavorited prop to marker for red/blue styling

### Decisions Log

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 13-01 | Dimension labels in utility file | Programmatic access for components, not just translations |
| 13-01 | Flat translation key pattern | Consistency with existing reviews.* keys |
| 13-02 | Header click expands card, View button in expanded content | Avoids competing click targets |
| 13-02 | Dual-state empty component | Differentiates no-reviews vs filtered-to-zero for better UX |
| 14-01 | Check-then-act pattern for toggle | RLS policies don't support upsert with delete in single operation |
| 14-01 | maybeSingle() for existence check | Returns null instead of error when not found |
| 14-02 | Track justToggled state separately | Prevents bounce animation on initial render |
| 14-02 | Fetch favorites in parallel with cafes | Promise.all improves performance |
| 14-02 | userId presence for conditional render | Simpler than separate isLoggedIn check |
| 14-03 | Transform FavoriteWithCafe to CafeSummary | Reuse CafeCard for consistent display |
| 14-03 | Heart button next to cafe name | Prominent placement, follows common patterns |
| 14-04 | Disabled toggle for logged-out users | Better feature discoverability than hiding |
| 14-04 | Red pins for favorites, blue for regular | Red matches heart color, blue is standard |
| 15-01 | Snake_case Profile types separate from User types | Database-aligned types for settings operations |
| 15-01 | Partial index on scheduled_deletion_at | Efficient cleanup queries without index bloat |
| 15-02 | Deterministic color from userId hash | Same user always sees same avatar color |
| 15-02 | 256px JPEG at 90% quality for cropped avatar | Balance of quality and file size |
| 15-03 | Dual sync display_name to profiles and auth.users | JWT consistency for display name |
| 15-03 | FormProvider pattern for UnsavedChangesWarning | Access form isDirty state from separate component |
| 15-03 | Character counter visible only when typing | Cleaner UI, less visual noise |
| 15-04 | Reactivation in layout vs middleware | Profile layout for simplicity - covers all profile pages |
| 15-04 | Sign out after scheduling deletion | Forces re-auth to cancel, adds friction against accidental reactivation |
| 15-05 | ID-based public profile route (/user/[id]) | More stable than username which could change |
| 15-05 | Optimistic privacy toggle | Better UX with instant feedback, revert on error |
| 15-05 | Viewer-based profile access pattern | Different data returned based on viewer ownership |
| 16-01 | Extend cafe_ratings vs separate reviews table | Maintains one-review-per-user-per-cafe constraint, simpler queries |
| 16-01 | IS DISTINCT FROM in trigger | Handles NULL transitions correctly for review_edited_at |
| 16-01 | Public SELECT on helpful_votes | Vote counts visible to all, only write ops restricted |
| 16-02 | getRatingById helper for multi-check actions | Single fetch for ownership, text existence, and cafeId |
| 16-02 | Explicit vote deletion on text removal | Prevents orphaned votes, safer than relying on triggers |
| 16-03 | Reuse AvatarDisplay from profile module | Consistent avatar handling with color hash fallback |
| 16-03 | Separate textReviews prop from reviews | Backward compat with legacy reviews table |
| 16-03 | Reviews tab shows text reviews with count badge | Text reviews are primary system |
| 16-04 | Character counter visible only when typing | Follows 15-03 pattern for cleaner UI |
| 16-04 | Extend UserRating type with review fields | Simpler than new type, data already in table |
| 16-05 | Collapsible review text section in rating form | Reduces form clutter while keeping feature discoverable |
| 16-05 | Fetch profiles separately from ratings | Avoids FK constraint errors when profile row missing |
| 16-05 | Username fallback for review author display | Handles null display_name gracefully |
| 17-01 | Password min score 2 (Good) | Balance security and UX per RESEARCH.md recommendation |
| 17-01 | Key-value notification preferences | Flexible schema, easier migrations than columns per type |
| 17-02 | Always return success on password reset | Prevent email enumeration attacks |
| 17-02 | Global sign out after password change | Security - invalidate all existing sessions |
| 17-02 | Reset page outside (auth) group | User arrives with valid session from reset link |
| 17-04 | Optimistic UI for preference toggles | Immediate feedback improves perceived performance and UX |
| 17-04 | Error revert pattern for toggles | If toggle fails, state automatically reverts to prevent sync issues |
| 17-04 | Forgot password on login page | Improves discoverability vs. separate page; already familiar context |
| 17-04 | Toast feedback 2s duration | Follows project pattern from 16-03 (CONTEXT.md specified 2s) |
| 17-04 | Parallel data fetching in settings | Profile, language, preferences fetched simultaneously for performance |
| 17-03 | URL query params for tab persistence | Browser navigation expectations; ?tab=security |
| 17-03 | Security tab groups password+delete | Logical security-related grouping |
| 17-03 | OAuth users see info message | Clear UX for unavailable password management |
| 18-01 | AFTER triggers prevent blocking admin actions | Queue failure shouldn't prevent status updates (Pitfall 5) |
| 18-01 | Service-role-only RLS on notification queue | Only Edge Functions need access, not public users |
| 18-01 | Partial index on unsent notifications | Daily digest queries only WHERE sent_at IS NULL |
| 18-01 | Exception handling in triggers | RAISE WARNING + RETURN NEW instead of failing |
| 18-02 | Table-based HTML email layout | Email clients don't support modern CSS (flexbox, grid) |
| 18-02 | Opt-out notification model | Enabled by default if no preference exists, reduces friction |
| 18-02 | Mark all as sent after processing | Prevents duplicate emails on retry (Pitfall 3) |
| 18-02 | HMAC-signed unsubscribe tokens | Web Crypto API for tamper-proof 30-day tokens

### Pending Todos

None

### Blockers/Concerns

None

## Session Continuity

Last session: 2026-02-01
Stopped at: Completed 18-02-PLAN.md
Resume file: None
Next action: Execute 18-03 (Cron Job Scheduling) or 18-04 (Unsubscribe API Route)

---
*State initialized: 2026-01-27*
*v1.0 MVP shipped: 2026-01-29*
*v1.1 User Contributions shipped: 2026-01-31*
*v1.2 Polish & Bug Fixes shipped: 2026-02-01*
*v1.3 roadmap created: 2026-02-01*
*Phase 13 completed: 2026-02-01*
*Phase 14 completed: 2026-02-01*
*Phase 15 completed: 2026-02-01*
*Phase 16 completed: 2026-02-01*
*Phase 17 completed: 2026-02-01*
*Phase 18 started: 2026-02-01 (18-01 complete)*
