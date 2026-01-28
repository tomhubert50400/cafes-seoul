# Requirements: Cafes Seoul

**Defined:** 2026-01-27
**Core Value:** Filtrage multi-critères avec notes 1-5 sur chaque dimension du café

## v1 Requirements

Requirements for authentication milestone. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can verify email via link and activate account
- [x] **AUTH-04**: User can log in with email and password
- [x] **AUTH-05**: User can log in with Google OAuth
- [x] **AUTH-06**: User can log in with Kakao OAuth
- [x] **AUTH-07**: User can log out from any page
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
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 3 | Complete |
| AUTH-06 | Phase 3 | Complete |
| AUTH-07 | Phase 2 | Complete |
| AUTH-08 | Phase 4 | Pending |
| AUTH-09 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

**Phase breakdown:**
- Phase 1 (Auth Foundation): 0 direct requirements (enables all phases)
- Phase 2 (Email/Password Auth): 5 requirements (AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-07)
- Phase 3 (OAuth Integration): 2 requirements (AUTH-05, AUTH-06)
- Phase 4 (Protected Routes): 2 requirements (AUTH-08, AUTH-09)
- Phase 5 (UX Polish): 0 new requirements (polish existing)

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-28 after Phase 3 verification*
