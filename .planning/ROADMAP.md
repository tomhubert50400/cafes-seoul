# Roadmap: Cafes Seoul — Milestone v1.1

## Overview

This milestone adds user contribution capabilities to the cafe discovery platform. Authenticated users can submit new cafes, rate existing ones on 10 dimensions, upload photos, and vote on photos. An admin panel enables moderation of all submissions.

## Phases

**Phase Numbering:**
- Integer phases (7, 8, 9, 10, 11): Milestone v1.1 work (continues from v1.0)
- Decimal phases (7.1, 7.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 7: Cafe Submissions** - Submit new cafes with duplicate detection and admin approval workflow
- [ ] **Phase 8: Ratings System** - 10-dimension rating UI with mandatory overall rating
- [ ] **Phase 9: Photos & Voting** - Photo uploads with moderation and upvoting system
- [ ] **Phase 10: Admin Panel** - Moderation interface for cafes and photos
- [ ] **Phase 11: User Dashboard** - Contributor statistics and contribution history

## Phase Details

### Phase 7: Cafe Submissions
**Goal**: Users can propose new cafes with validation and approval workflow
**Depends on**: Phase 6 (Map Feature) — uses auth system
**Requirements**: SUBMIT-01 through SUBMIT-08, ROLE-01 through ROLE-03
**Success Criteria** (what must be TRUE):
  1. User can submit cafe with name and address (SUBMIT-01)
  2. User can optionally add phone number (SUBMIT-02)
  3. System detects and warns about potential duplicates (SUBMIT-03)
  4. Submissions enter pending state awaiting admin approval (SUBMIT-04)
  5. User can edit submission while pending (SUBMIT-05)
  6. User can delete pending submission (SUBMIT-06)
  7. Rate limit enforced: 3 submissions per day per user (SUBMIT-08)
  8. User roles exist in database (user/pro/admin) (ROLE-01, ROLE-02, ROLE-03)
**Plans**: 4 plans

Plans:
- [x] 07-01-PLAN.md — Database schema: submissions table, roles enum, rate limiting setup
- [x] 07-02-PLAN.md — Submission form UI with duplicate detection and i18n
- [x] 07-03-PLAN.md — Server Actions for submit, edit, delete with rate limiting
- [x] 07-04-PLAN.md — Entry point (Add Cafe button) and submission status display
- [x] 07-05-PLAN.md — **GAP CLOSURE**: Edit submission page for pending submissions
- [x] 07-06-PLAN.md — **GAP CLOSURE**: pg_trgm RPC for fuzzy duplicate detection

### Phase 8: Ratings System
**Goal**: Users can rate cafes on 10 dimensions with mandatory overall rating
**Depends on**: Phase 7
**Requirements**: RATE-01 through RATE-08
**Success Criteria** (what must be TRUE):
  1. Rating form enforces overall rating 1-5 (RATE-01)
  2. 9 optional dimensions shown as sliders 0-5 (RATE-02)
  3. Pet friendly toggle included (RATE-03)
  4. Zero ratings excluded from average calculation (RATE-04)
  5. Users can update their ratings (overwrite) (RATE-05)
  6. Cafe cards show average with star count (RATE-06)
  7. Rate buttons on list cards, map info, detail page (RATE-07)
  8. No rate limit enforced (RATE-08)
**Plans**: 4 plans

Plans:
- [ ] 08-01-PLAN.md — Database schema: ratings table with 10 dimensions
- [ ] 08-02-PLAN.md — Rating form component with sliders and validation
- [ ] 08-03-PLAN.md — Rating display on cafe cards and detail pages
- [ ] 08-04-PLAN.md — Entry points integration (list, map, detail) with i18n

### Phase 9: Photos & Voting
**Goal**: Photo uploads with moderation queue and upvoting system
**Depends on**: Phase 8
**Requirements**: PHOTO-01 through PHOTO-07, VOTE-01 through VOTE-03
**Success Criteria** (what must be TRUE):
  1. User can upload photos to approved cafes (PHOTO-01)
  2. 3 photo limit per user per cafe enforced (PHOTO-02)
  3. 10 uploads per day rate limit enforced (PHOTO-03)
  4. Photos enter pending state for admin approval (PHOTO-04)
  5. Approved photos visible in gallery (PHOTO-05)
  6. Photos sorted by upvote count (PHOTO-06)
  7. Users cannot delete approved photos (PHOTO-07)
  8. Heart button upvotes photos (VOTE-01)
  9. One upvote per user per photo (VOTE-02)
  10. Display order reflects upvote count (VOTE-03)
**Plans**: 5 plans

Plans:
- [ ] 09-01-PLAN.md — Database schema: photos table, votes table
- [ ] 09-02-PLAN.md — Photo upload component with limits and validation
- [ ] 09-03-PLAN.md — Photo gallery with voting UI (heart button)
- [ ] 09-04-PLAN.md — Server Actions for upload, vote, rate limiting
- [ ] 09-05-PLAN.md — Integration on cafe detail page

### Phase 10: Admin Panel
**Goal**: Admin interface for moderating cafes and photos
**Depends on**: Phase 9
**Requirements**: ADMIN-01 through ADMIN-07, ROLE-04
**Success Criteria** (what must be TRUE):
  1. Admin can view pending cafe submissions list (ADMIN-01)
  2. Admin can approve cafes (ADMIN-02)
  3. Admin can reject with reason (ADMIN-03)
  4. Admin can edit before approving (ADMIN-04)
  5. Admin can view pending photos list (ADMIN-05)
  6. Admin can approve/reject photos (ADMIN-06)
  7. Only admin role can access panel (ADMIN-07, ROLE-04)
**Plans**: 4 plans

Plans:
- [ ] 10-01-PLAN.md — Admin route protection and layout
- [ ] 10-02-PLAN.md — Pending cafes list with approve/reject/edit actions
- [ ] 10-03-PLAN.md — Pending photos list with moderation actions
- [ ] 10-04-PLAN.md — Admin notifications and email alerts

### Phase 11: User Dashboard
**Goal**: Users can view their contributions and statistics
**Depends on**: Phase 10
**Requirements**: DASH-01 through DASH-04
**Success Criteria** (what must be TRUE):
  1. User sees their submitted cafes with status (DASH-01)
  2. User sees their ratings given (DASH-02)
  3. User sees their uploaded photos (DASH-03)
  4. Statistics displayed (counts, totals) (DASH-04)
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md — Dashboard layout and statistics aggregation
- [ ] 11-02-PLAN.md — Contribution lists (cafes, ratings, photos) with i18n

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Cafe Submissions | 6/6 | ● Complete | 2026-01-30 |
| 8. Ratings System | 0/4 | ○ Not Started | — |
| 9. Photos & Voting | 0/5 | ○ Not Started | — |
| 10. Admin Panel | 0/4 | ○ Not Started | — |
| 11. User Dashboard | 0/2 | ○ Not Started | — |

---
*Roadmap created: 2026-01-30*
*Milestone v1.1: User Contributions — Ready for execution*
