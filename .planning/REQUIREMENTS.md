# Requirements: Cafes Seoul

**Defined:** 2026-01-27
**Core Value:** Filtrage multi-critères avec notes 1-5 sur chaque dimension du café

## v1 Requirements

Requirements for authentication milestone. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can verify email via link and activate account
- [ ] **AUTH-04**: User can log in with email and password
- [ ] **AUTH-05**: User can log in with Google OAuth
- [ ] **AUTH-06**: User can log in with Kakao OAuth
- [ ] **AUTH-07**: User can log out from any page
- [ ] **AUTH-08**: User session persists across browser refresh (cookie-based)
- [ ] **AUTH-09**: User sees appropriate UI state (logged in vs logged out)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication Enhancements

- **AUTH-10**: User can reset password via email link
- **AUTH-11**: User can log in with Naver OAuth
- **AUTH-12**: User can enable 2FA (TOTP)
- **AUTH-13**: User can log in via magic link (passwordless)

### User Contributions

- **CONTRIB-01**: User can propose adding a new café
- **CONTRIB-02**: User can rate café criteria (1-5 scale)
- **CONTRIB-03**: User can upload photos to a café
- **CONTRIB-04**: User can edit their submitted content

### Administration

- **ADMIN-01**: Admin can review pending café submissions
- **ADMIN-02**: Admin can approve/reject café submissions
- **ADMIN-03**: Admin can moderate user-uploaded photos
- **ADMIN-04**: Admin can manage user accounts

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Naver OAuth | Not natively supported by Supabase, deferred to v2 |
| Password reset | Minimal v1 scope, OAuth covers most recovery cases |
| 2FA | Complexity not needed for café discovery app |
| Social login linking | Can add later if users request account merging |
| Admin panel | v2, after core auth is validated |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| AUTH-05 | TBD | Pending |
| AUTH-06 | TBD | Pending |
| AUTH-07 | TBD | Pending |
| AUTH-08 | TBD | Pending |
| AUTH-09 | TBD | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 0
- Unmapped: 9 ⚠️

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-27 after initial definition*
