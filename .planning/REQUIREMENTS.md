# Requirements: Cafes Seoul v1.3

**Defined:** 2026-02-01
**Core Value:** Filtrage multi-critères avec notes 1-5 sur chaque dimension du café

## v1.3 Requirements

Requirements for Profile Enhancement milestone.

### My Reviews Tab

- [ ] **REV-01**: User can view list of cafes they've rated with their scores
- [ ] **REV-02**: User can see rating date and cafe details in review list
- [ ] **REV-03**: User can navigate to cafe detail from review list
- [ ] **REV-04**: User can filter/sort reviews by date or score
- [ ] **REV-05**: User can see aggregated stats (average rating given, total count)

### Favorites System

- [ ] **FAV-01**: User can toggle favorite via heart icon on cafe cards
- [ ] **FAV-02**: User can toggle favorite via heart icon on cafe detail page
- [ ] **FAV-03**: User can view favorites list in profile tab
- [ ] **FAV-04**: User can remove cafes from favorites
- [ ] **FAV-05**: User can view favorited cafes on a map

### Settings

- [ ] **SET-01**: User can edit display name
- [ ] **SET-02**: User can upload/change avatar (stored in Supabase Storage)
- [ ] **SET-03**: User can edit bio
- [ ] **SET-04**: User can reset password via email link
- [ ] **SET-05**: User can toggle notification preferences for submission emails
- [ ] **SET-06**: User can delete their account and associated data

### Text Reviews

- [ ] **TXT-01**: User can add optional text review when rating a cafe
- [ ] **TXT-02**: User can add optional title to their review
- [ ] **TXT-03**: User can edit their review text and title
- [ ] **TXT-04**: Text reviews display on cafe detail page
- [ ] **TXT-05**: Users can mark reviews as helpful (vote)
- [ ] **TXT-06**: Review helpful count displays on cafe page

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
| REV-01 | TBD | Pending |
| REV-02 | TBD | Pending |
| REV-03 | TBD | Pending |
| REV-04 | TBD | Pending |
| REV-05 | TBD | Pending |
| FAV-01 | TBD | Pending |
| FAV-02 | TBD | Pending |
| FAV-03 | TBD | Pending |
| FAV-04 | TBD | Pending |
| FAV-05 | TBD | Pending |
| SET-01 | TBD | Pending |
| SET-02 | TBD | Pending |
| SET-03 | TBD | Pending |
| SET-04 | TBD | Pending |
| SET-05 | TBD | Pending |
| SET-06 | TBD | Pending |
| TXT-01 | TBD | Pending |
| TXT-02 | TBD | Pending |
| TXT-03 | TBD | Pending |
| TXT-04 | TBD | Pending |
| TXT-05 | TBD | Pending |
| TXT-06 | TBD | Pending |
| NOTIF-01 | TBD | Pending |
| NOTIF-02 | TBD | Pending |
| NOTIF-03 | TBD | Pending |
| NOTIF-04 | TBD | Pending |

**Coverage:**
- v1.3 requirements: 26 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 26

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after initial definition*
