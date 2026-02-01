# Project Milestones: Cafes Seoul

## v1.3 Profile Enhancement (Shipped: 2026-02-01)

**Delivered:** Enhanced user profile with reviews, favorites, settings, password reset, notification preferences, and email notifications for submission status changes

**Phases completed:** 13-18 (25 plans total)

**Key accomplishments:**
- My Reviews tab with sorting, filtering, and per-dimension stats
- Favorites system with heart toggles and map integration (red/blue pins)
- Profile settings with avatar upload (crop), bio editing, account deletion
- Public profiles at /user/[id] with privacy toggle
- Text reviews with optional text when rating, inline editing, helpful voting
- Password reset flow with strength meter (zxcvbn)
- Notification preferences with 4 toggle switches and auto-save
- Email notifications via Edge Function (daily digest at 9 AM KST)
- One-click unsubscribe with HMAC-signed tokens

**Stats:**
- 129 files modified
- +10,755 lines of TypeScript
- 6 phases, 25 plans
- 2 days (2026-02-01)

**Git range:** `feat(13-01)` → `feat(18-04)`

**What's next:** v1.4 or v2.0 — potential areas: Naver OAuth, review titles, favorites collections, data export, weekly digest emails

---

## v1.2 Polish & Bug Fixes (Shipped: 2026-02-01)

**Delivered:** Bug fixes for i18n, navigation, forms, layout, and auth issues identified after v1.1 release

**Phases completed:** 12 (4 plans total)

**Key accomplishments:**
- Fixed rating cancel button i18n key (shows translated text in all 5 languages)
- Added admin link with Shield icon to user dropdown for admin users
- Simplified cafe submission form (removed coordinates, unified language tabs)
- Fixed layout issues (dashboard header, single header on submissions, mobile overflow)
- Fixed photo upload auth detection using onAuthStateChange subscription

**Stats:**
- 22 files modified
- 23,200 lines of TypeScript (current total)
- 1 phase, 4 plans, 8 tasks
- 1 day from v1.1 to v1.2

**Git range:** `fix(12-01)` → `docs(12)`

**What's next:** v1.3 or v2.0 — potential areas: user notifications, password reset, Naver OAuth, pro features for cafe owners

---

## v1.1 User Contributions (Shipped: 2026-01-31)

**Delivered:** Full user contribution system with cafe submissions, 10-dimension ratings, photo uploads with voting, admin moderation, and contributor dashboard

**Phases completed:** 7-11 (24 plans total)

**Key accomplishments:**
- Cafe submission system with fuzzy duplicate detection (pg_trgm) and rate limiting
- 10-dimension rating system with automatic average aggregation via database triggers
- Photo upload & voting with Supabase Storage, masonry gallery, and optimistic UI
- Admin moderation panel for cafes and photos with role-based access
- User contribution dashboard with stats, paginated lists, and edit/delete actions
- Full i18n support for all features across 5 languages (KO, EN, FR, ZH, VI)

**Stats:**
- 163 files modified
- +27,101 lines of TypeScript
- 5 phases, 24 plans
- 2 days from v1.0 to v1.1

**Git range:** `feat(07-01)` → `feat(11-02)`

**What's next:** v1.2 or v2.0 — potential areas: user notifications, pro features for cafe owners, Naver OAuth, performance optimization

---

## v1.0 MVP (Shipped: 2026-01-29)

**Delivered:** Cafe discovery platform with multi-criteria filtering, interactive map, and authentication

**Phases completed:** 1-6 (20 plans total)

**Key accomplishments:**
- Cafe listing with pagination and 10+ filter criteria
- Cafe detail pages with photos, amenities, and ratings display
- Interactive Kakao Map with marker clustering and rating filters
- Authentication with email/password, Google, and Kakao OAuth
- User profiles with session persistence
- Multi-language support (KO, EN, FR, ZH, VI)

**Stats:**
- ~100 files created
- ~15,000 lines of TypeScript
- 6 phases, 20 plans
- 3 days from start to ship

**Git range:** `feat(01-01)` → `feat(06-05)`

**What's next:** User contributions (cafe submissions, ratings, photos)

---
