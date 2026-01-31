# Requirements: Cafes Seoul — Milestone v1.1

**Defined:** 2026-01-30
**Milestone:** v1.1 User Contributions
**Core Value:** Filtrage multi-critères avec notes 1-5 sur chaque dimension du café

## v1.1 Requirements

### Cafe Submissions

- [ ] **SUBMIT-01**: User can submit a new cafe with name and address (required)
- [ ] **SUBMIT-02**: User can optionally provide phone number
- [ ] **SUBMIT-03**: System shows potential duplicates before allowing submission
- [ ] **SUBMIT-04**: Submission is pending admin approval before appearing on site
- [ ] **SUBMIT-05**: User can edit submission while pending
- [ ] **SUBMIT-06**: User can delete submission while pending
- [ ] **SUBMIT-07**: User receives notification when submission is approved/rejected
- [ ] **SUBMIT-08**: Rate limit: 3 cafe submissions per user per day

### Cafe Ratings

- [ ] **RATE-01**: User must provide overall rating (1-5) when rating a cafe
- [ ] **RATE-02**: User can optionally rate on 9 additional dimensions (0-5, 0 = not rated)
  - Comfort: Seating, Space (size), Temperature
  - Atmosphere: Quietness, Lighting
  - Useful: Power outlets, Wi-Fi, Price/value
  - Menu: Coffee, Food, Options
- [ ] **RATE-03**: User can indicate if cafe is pet friendly (boolean)
- [ ] **RATE-04**: Ratings of 0 do not impact the average calculation
- [ ] **RATE-05**: User can update their ratings anytime (overwrite previous)
- [ ] **RATE-06**: Cafe cards show average rating as ★★★★☆ (X reviews)
- [ ] **RATE-07**: Rate button appears on cafe list cards, map info windows, and detail page
- [ ] **RATE-08**: No rate limit (unlimited ratings)

### Photos

- [ ] **PHOTO-01**: User can upload photos to any approved cafe
- [ ] **PHOTO-02**: Limit: 3 photos per user per cafe
- [ ] **PHOTO-03**: Rate limit: 10 photo uploads per user per day
- [ ] **PHOTO-04**: Photos require separate admin approval from cafe approval
- [ ] **PHOTO-05**: Approved photos are visible on cafe detail page gallery
- [ ] **PHOTO-06**: Photos display in order of most upvoted
- [ ] **PHOTO-07**: User cannot delete photos after approval (admin only)

### Photo Voting

- [ ] **VOTE-01**: User can upvote photos with heart button
- [ ] **VOTE-02**: One upvote per user per photo
- [ ] **VOTE-03**: Photos sorted by upvote count (highest first)

### Admin Panel

- [ ] **ADMIN-01**: Admin can view list of pending cafe submissions
- [ ] **ADMIN-02**: Admin can approve cafe submissions
- [ ] **ADMIN-03**: Admin can reject cafe submissions with reason
- [ ] **ADMIN-04**: Admin can edit submission details before approving
- [ ] **ADMIN-05**: Admin can view list of pending photos
- [ ] **ADMIN-06**: Admin can approve/reject photos
- [ ] **ADMIN-07**: Role-based access control (user/pro/admin)

### User Dashboard

- [ ] **DASH-01**: User can view their submitted cafes (pending/approved counts)
- [ ] **DASH-02**: User can view their ratings given
- [ ] **DASH-03**: User can view their uploaded photos
- [ ] **DASH-04**: Dashboard shows contribution statistics

### Roles System

- [ ] **ROLE-01**: Users have `user` role by default
- [ ] **ROLE-02**: `pro` role exists (reserved for future cafe owner features)
- [ ] **ROLE-03**: `admin` role has full moderation access
- [ ] **ROLE-04**: Only users with `admin` role can access admin panel

## v2 Requirements (Deferred)

### Pro Features (Cafe Owners)

- **PRO-01**: Cafe owners can claim their cafe profile
- **PRO-02**: Cafe owners can view basic stats (views, ratings)
- **PRO-03**: Cafe owners can subscribe for full analytics
- **PRO-04**: Cafe owners can edit their cafe information

### Authentication Enhancements

- **AUTH-10**: User can reset password via email link
- **AUTH-11**: User can log in with Naver OAuth
- **AUTH-12**: User can enable 2FA (TOTP)
- **AUTH-13**: User can log in via magic link (passwordless)

### Social Features

- **SOCL-01**: User can follow other users
- **SOCL-02**: User can see friends' ratings
- **SOCL-03**: Review comments/discussions

## Out of Scope

Explicitly excluded from v1.1.

| Feature | Reason |
|---------|--------|
| Password reset | Minimal scope, OAuth covers most cases |
| 2FA | Complexity not needed for cafe discovery |
| Edit/delete after approval | Prevent abuse, permanent content |
| Review comments | Adds complexity without core value |
| Gamification/rewards | Evaluate after user adoption |
| Mobile app | Web-first, mobile responsive only |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SUBMIT-01 | Phase 7 | Complete |
| SUBMIT-02 | Phase 7 | Complete |
| SUBMIT-03 | Phase 7 | Complete |
| SUBMIT-04 | Phase 7 | Complete |
| SUBMIT-05 | Phase 7 | Complete |
| SUBMIT-06 | Phase 7 | Complete |
| SUBMIT-07 | Phase 7 | Deferred |
| SUBMIT-08 | Phase 7 | Complete |
| RATE-01 | Phase 8 | Complete |
| RATE-02 | Phase 8 | Complete |
| RATE-03 | Phase 8 | Complete |
| RATE-04 | Phase 8 | Complete |
| RATE-05 | Phase 8 | Complete |
| RATE-06 | Phase 8 | Complete |
| RATE-07 | Phase 8 | Complete |
| RATE-08 | Phase 8 | Complete |
| PHOTO-01 | Phase 9 | Complete |
| PHOTO-02 | Phase 9 | Complete |
| PHOTO-03 | Phase 9 | Complete |
| PHOTO-04 | Phase 9 | Complete |
| PHOTO-05 | Phase 9 | Complete |
| PHOTO-06 | Phase 9 | Complete |
| PHOTO-07 | Phase 9 | Complete |
| VOTE-01 | Phase 9 | Complete |
| VOTE-02 | Phase 9 | Complete |
| VOTE-03 | Phase 9 | Complete |
| ADMIN-01 | Phase 10 | Complete |
| ADMIN-02 | Phase 10 | Complete |
| ADMIN-03 | Phase 10 | Complete |
| ADMIN-04 | Phase 10 | Complete |
| ADMIN-05 | Phase 10 | Complete |
| ADMIN-06 | Phase 10 | Complete |
| ADMIN-07 | Phase 10 | Complete |
| DASH-01 | Phase 11 | Complete |
| DASH-02 | Phase 11 | Complete |
| DASH-03 | Phase 11 | Complete |
| DASH-04 | Phase 11 | Complete |
| ROLE-01 | Phase 7 | Complete |
| ROLE-02 | Phase 7 | Complete |
| ROLE-03 | Phase 7 | Complete |
| ROLE-04 | Phase 10 | Complete |

**Coverage:**
- v1.1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

**Phase breakdown:**
- Phase 7 (Cafe Submissions): 12 requirements (SUBMIT + ROLE setup)
- Phase 8 (Ratings System): 8 requirements
- Phase 9 (Photos & Voting): 10 requirements
- Phase 10 (Admin Panel): 8 requirements (ADMIN + ROLE enforcement)
- Phase 11 (User Dashboard): 4 requirements

---
*Requirements defined: 2026-01-30*
*Milestone v1.1 complete: 2026-01-31 (36/37 requirements complete, 1 deferred)*
