# Project Milestones: Cafes Seoul

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
