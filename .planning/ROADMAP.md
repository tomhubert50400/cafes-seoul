# Roadmap: Cafes Seoul

## Milestones

- v1.0 MVP - Phases 1-6 (shipped 2026-01-29)
- v1.1 User Contributions - Phases 7-11 (shipped 2026-01-31)
- v1.2 Polish & Bug Fixes - Phase 12 (shipped 2026-02-01)
- **v1.3 Profile Enhancement** - Phases 13-18 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-6) - SHIPPED 2026-01-29</summary>

See .planning/MILESTONES.md for details.

</details>

<details>
<summary>v1.1 User Contributions (Phases 7-11) - SHIPPED 2026-01-31</summary>

See .planning/MILESTONES.md for details.

</details>

<details>
<summary>v1.2 Polish & Bug Fixes (Phase 12) - SHIPPED 2026-02-01</summary>

See .planning/MILESTONES.md for details.

</details>

### v1.3 Profile Enhancement (In Progress)

**Milestone Goal:** Enhance user profile with reviews, favorites, and comprehensive settings

- [x] **Phase 13: Profile Foundation** - My Reviews tab with user's rating history
- [x] **Phase 14: Favorites System** - Heart icons on cafe cards/detail, favorites list
- [x] **Phase 15: Settings & Profile** - Profile editing, avatar upload, account management
- [x] **Phase 16: Text Reviews** - Optional text reviews with ratings
- [x] **Phase 17: Password & Preferences** - Password reset, notification preferences
- [ ] **Phase 18: Email Notifications** - Edge Function for submission status emails

## Phase Details

### Phase 13: Profile Foundation
**Goal**: User can view their complete rating history with cafe details
**Depends on**: Phase 12 (existing profile layout, ratings system)
**Requirements**: REV-01, REV-02, REV-03, REV-04, REV-05
**Success Criteria** (what must be TRUE):
  1. User can see all cafes they've rated in a dedicated "My Reviews" tab
  2. Each rating entry shows cafe name, date rated, and user's scores
  3. User can click any cafe in the list to navigate to its detail page
  4. User can sort reviews by date (newest/oldest) or by rating score
  5. User can see their review stats (total count, average rating given)
**Plans**: 3 plans

Plans:
- [x] 13-01-PLAN.md - Data layer: extend ratings query for images, add translations
- [x] 13-02-PLAN.md - UI components: ReviewCard with expand, empty states
- [x] 13-03-PLAN.md - Integration: MyReviewsList, stats footer, page assembly

### Phase 14: Favorites System
**Goal**: User can save and manage favorite cafes across the application
**Depends on**: Phase 13 (profile tabs infrastructure)
**Requirements**: FAV-01, FAV-02, FAV-03, FAV-04, FAV-05
**Success Criteria** (what must be TRUE):
  1. User can toggle heart icon on any cafe card to add/remove favorite
  2. User can toggle heart icon on cafe detail page to add/remove favorite
  3. User can view all favorited cafes in a Favorites profile tab
  4. User can remove cafes from favorites (heart unfills)
  5. User can view their favorited cafes on an interactive map
**Plans**: 4 plans

Plans:
- [x] 14-01-PLAN.md - Database schema, Supabase queries, Server Actions
- [x] 14-02-PLAN.md - FavoriteButton component, CafeCard integration
- [x] 14-03-PLAN.md - Favorites profile page, cafe detail integration
- [x] 14-04-PLAN.md - Map favorites filter and colored pins

### Phase 15: Settings & Profile
**Goal**: User can manage their profile information and account
**Depends on**: Phase 13 (profile tabs infrastructure)
**Requirements**: SET-01, SET-02, SET-03, SET-06
**Success Criteria** (what must be TRUE):
  1. User can edit their display name and see it reflected across the app
  2. User can upload or change their avatar image (stored in Supabase)
  3. User can write and edit a personal bio
  4. User can delete their account and all associated data
**Plans**: 5 plans

Plans:
- [x] 15-01-PLAN.md - Database schema, avatars bucket, validation schemas
- [x] 15-02-PLAN.md - Avatar components: display with initials, upload with crop
- [x] 15-03-PLAN.md - Profile form, Server Actions, settings page
- [x] 15-04-PLAN.md - Account deletion with grace period
- [x] 15-05-PLAN.md - Public profiles and privacy toggle

### Phase 16: Text Reviews
**Goal**: User can enhance ratings with optional text commentary
**Depends on**: Phase 13 (My Reviews tab displays reviews)
**Requirements**: TXT-01, TXT-03, TXT-04, TXT-05, TXT-06
**Success Criteria** (what must be TRUE):
  1. User can add optional text when rating a cafe
  2. User can edit their review text after submission
  3. Text reviews display on cafe detail page with author info
  4. Users can mark other reviews as helpful
  5. Review helpful count is visible on cafe page
**Plans**: 5 plans

Plans:
- [x] 16-01-PLAN.md - Database schema, types, validation for review text and votes
- [x] 16-02-PLAN.md - Supabase queries and Server Actions for reviews
- [x] 16-03-PLAN.md - Cafe page review display with helpful voting
- [x] 16-04-PLAN.md - My Reviews inline editing with delete confirmation
- [x] 16-05-PLAN.md - Rating form review text integration and verification

### Phase 17: Password & Preferences
**Goal**: User can manage security and notification settings
**Depends on**: Phase 15 (Settings tab exists)
**Requirements**: SET-04, SET-05
**Success Criteria** (what must be TRUE):
  1. User can request password reset email from settings
  2. User can set new password via emailed link
  3. User can toggle email notification preferences for submissions
**Plans**: 4 plans

Plans:
- [x] 17-01-PLAN.md - Database schema, zxcvbn setup, password validation
- [x] 17-02-PLAN.md - Password reset Server Actions and landing page
- [x] 17-03-PLAN.md - Settings sub-tabs and Security section
- [x] 17-04-PLAN.md - Notification preferences UI and login forgot password

### Phase 18: Email Notifications
**Goal**: User receives email updates on submission status changes
**Depends on**: Phase 17 (notification preferences exist)
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04
**Success Criteria** (what must be TRUE):
  1. User receives email when cafe submission is approved
  2. User receives email when cafe submission is rejected
  3. User receives email when photo submission is approved
  4. User receives email when photo submission is rejected
**Plans**: TBD

Plans:
- [ ] 18-01: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 13. Profile Foundation | v1.3 | 3/3 | Complete | 2026-02-01 |
| 14. Favorites System | v1.3 | 4/4 | Complete | 2026-02-01 |
| 15. Settings & Profile | v1.3 | 5/5 | Complete | 2026-02-01 |
| 16. Text Reviews | v1.3 | 5/5 | Complete | 2026-02-01 |
| 17. Password & Preferences | v1.3 | 4/4 | Complete | 2026-02-01 |
| 18. Email Notifications | v1.3 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-01*
*v1.3 requirements: 26 total, 26 mapped*
