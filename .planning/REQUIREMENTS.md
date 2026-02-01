# Requirements: Cafes Seoul v1.3

**Defined:** 2026-02-01
**Core Value:** Filtrage multi-criteres avec notes 1-5 sur chaque dimension du cafe

## v1.3 Requirements

Requirements for Profile Enhancement milestone.

### My Reviews Tab

- [x] **REV-01**: User can view list of cafes they've rated with their scores
- [x] **REV-02**: User can see rating date and cafe details in review list
- [x] **REV-03**: User can navigate to cafe detail from review list
- [x] **REV-04**: User can filter/sort reviews by date or score
- [x] **REV-05**: User can see aggregated stats (average rating given, total count)

### Favorites System

- [x] **FAV-01**: User can toggle favorite via heart icon on cafe cards
- [x] **FAV-02**: User can toggle favorite via heart icon on cafe detail page
- [x] **FAV-03**: User can view favorites list in profile tab
- [x] **FAV-04**: User can remove cafes from favorites
- [x] **FAV-05**: User can view favorited cafes on a map

### Settings

- [x] **SET-01**: User can edit display name
- [x] **SET-02**: User can upload/change avatar (stored in Supabase Storage)
- [x] **SET-03**: User can edit bio
- [x] **SET-04**: User can reset password via email link
- [x] **SET-05**: User can toggle notification preferences for submission emails
- [x] **SET-06**: User can delete their account and associated data

### Text Reviews

- [x] **TXT-01**: User can add optional text review when rating a cafe
- [ ] **TXT-02**: User can add optional title to their review
- [x] **TXT-03**: User can edit their review text and title
- [x] **TXT-04**: Text reviews display on cafe detail page
- [x] **TXT-05**: Users can mark reviews as helpful (vote)
- [x] **TXT-06**: Review helpful count displays on cafe page

### Email Notifications

- [ ] **NOTIF-01**: User receives email when cafe submission is approved
- [ ] **NOTIF-02**: User receives email when cafe submission is rejected
- [ ] **NOTIF-03**: User receives email when photo submission is approved
- [ ] **NOTIF-04**: User receives email when photo submission is rejected

## Future Requirements

Deferred to later milestones.

### Favorites Enhancements
- **FAV-06**: User can create multiple collections/lists
- **FAV-07**: User can add notes to favorites

### Settings Enhancements
- **SET-07**: User can set language preference (override browser)
- **SET-08**: User can export their data

### Notification Enhancements
- **NOTIF-05**: User receives weekly digest email
- **NOTIF-06**: User receives notification for activity on submitted cafes

### Text Reviews Enhancements
- **TXT-07**: User can attach photo to review

## Out of Scope

Explicitly excluded for v1.3.

| Feature | Reason |
|---------|--------|
| Real-time in-app notifications | Adds WebSocket complexity without core value |
| Social following | Not aligned with cafe discovery focus |
| Review comments/replies | Adds moderation complexity |
| Gamification/badges | Evaluate after user adoption |
| Naver OAuth | Deferred from v1.2, requires custom implementation |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REV-01 | Phase 13 | Complete |
| REV-02 | Phase 13 | Complete |
| REV-03 | Phase 13 | Complete |
| REV-04 | Phase 13 | Complete |
| REV-05 | Phase 13 | Complete |
| FAV-01 | Phase 14 | Complete |
| FAV-02 | Phase 14 | Complete |
| FAV-03 | Phase 14 | Complete |
| FAV-04 | Phase 14 | Complete |
| FAV-05 | Phase 14 | Complete |
| SET-01 | Phase 15 | Complete |
| SET-02 | Phase 15 | Complete |
| SET-03 | Phase 15 | Complete |
| SET-04 | Phase 17 | Complete |
| SET-05 | Phase 17 | Complete |
| SET-06 | Phase 15 | Complete |
| TXT-01 | Phase 16 | Complete |
| TXT-02 | Future | Deferred |
| TXT-03 | Phase 16 | Complete |
| TXT-04 | Phase 16 | Complete |
| TXT-05 | Phase 16 | Complete |
| TXT-06 | Phase 16 | Complete |
| NOTIF-01 | Phase 18 | Pending |
| NOTIF-02 | Phase 18 | Pending |
| NOTIF-03 | Phase 18 | Pending |
| NOTIF-04 | Phase 18 | Pending |

**Coverage:**
- v1.3 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-02-01*
*Traceability updated: 2026-02-01 (roadmap created)*
