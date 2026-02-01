# Cafes Seoul

## What This Is

Une application web pour découvrir des cafés à Seoul avec des critères de filtrage avancés (places assises, boissons, nourriture, température, terrasse, esthétique, etc.) que Kakao Map et Naver Map n'offrent pas. Les utilisateurs peuvent parcourir et filtrer les cafés sans compte, mais doivent se connecter pour contribuer.

## Current Milestone: v1.3 Profile Enhancement

**Goal:** Enhance user profile with reviews, favorites, and comprehensive settings

**Target features:**
- Profile tabs: My Reviews, Favorites, Settings
- Text reviews with ratings (optional text when rating a cafe)
- Favorites system with heart icon on cafe cards and detail pages
- Settings: profile editing (name, avatar, bio), password reset, notification preferences
- Email notifications for submission approval/rejection

## Current State

**Latest Release:** v1.2 Polish & Bug Fixes (2026-02-01)
**Codebase:** 23,200 lines TypeScript (Next.js 16 + Supabase)

**Shipped in v1.2:**
- Fixed rating cancel button i18n key (shows translated text in all 5 languages)
- Added admin link to user dropdown for admin users
- Simplified cafe submission form (address only, unified language tabs)
- Fixed layout bugs (dashboard header, single header on submissions, mobile overflow)
- Fixed photo upload auth detection using onAuthStateChange subscription

**Rate limits:** 3 cafe submissions/day, unlimited ratings, 10 photo uploads/day

## Core Value

Filtrage multi-critères avec notes 1-5 sur chaque dimension du café - permettant de trouver exactement le type de café recherché.

## Requirements

### Validated

- ✓ Parcourir la liste des cafés avec pagination — existing
- ✓ Voir les détails d'un café (infos, photos, reviews) — existing
- ✓ Rechercher des cafés par nom/adresse — existing
- ✓ Filtrer par critères (wifi, type, district, etc.) — existing
- ✓ Support multilingue (Korean/English) — existing
- ✓ Affichage des photos depuis Supabase Storage — existing
- ✓ Authentication (email/password, Google, Kakao OAuth) — v1.0
- ✓ Email verification and session persistence — v1.0
- ✓ User profiles and protected routes — v1.0
- ✓ Interactive map with rating filters — v1.0
- ✓ Cafe submission with duplicate detection and admin approval — v1.1
- ✓ 10-dimension rating system with automatic averages — v1.1
- ✓ Photo uploads with moderation and voting — v1.1
- ✓ Admin panel for cafes and photos — v1.1
- ✓ User dashboard with contribution stats — v1.1
- ✓ Role-based access (user/pro/admin) — v1.1
- ✓ Rating cancel button i18n fix — v1.2
- ✓ Admin link in profile dropdown — v1.2
- ✓ Simplified cafe submission form — v1.2
- ✓ Layout fixes (dashboard header, submissions header, mobile overflow) — v1.2
- ✓ Photo upload auth detection fix — v1.2

### Active (v1.3)

- [ ] Profile tabs: My Reviews, Favorites, Settings
- [ ] Text reviews with ratings (optional text when rating a cafe)
- [ ] Favorites system with heart icon on cafe cards and detail pages
- [ ] Settings: profile editing (name, avatar via Supabase Storage, bio)
- [ ] Password reset via email link
- [ ] Notification preferences (toggle email for submission status)
- [ ] Email notifications for submission approval/rejection

### Deferred (v1.4+)

- [ ] Naver OAuth login

### Out of Scope (deferred)

- 2FA — complexity not needed for cafe discovery
- Pro features for cafe owners — future milestone (v2.0+)
- Edit/delete after approval — approved content is permanent
- Review comments — adds complexity without core value
- Gamification/rewards — evaluate after user adoption

## Context

**Codebase existant:**
- Next.js 16 avec App Router et Server Components
- Supabase déjà intégré pour database et storage
- `@supabase/ssr` installé pour auth SSR
- Structure auth prévue: `src/app/(auth)/` existe mais vide
- Middleware Supabase existe: `src/lib/supabase/middleware.ts`

**OAuth Providers:**
- Google: Standard, bien documenté
- Kakao: Provider natif Supabase, nécessite config Kakao Developers
- Naver: Provider natif Supabase, nécessite config Naver Developers

**Key Patterns (from v1.2):**
- Client auth: use onAuthStateChange subscription, track userId in state
- Nested layouts: child pages return content only, parent layout provides Header
- Unified tab state: when multiple tab groups should sync, use shared controlled state

## Constraints

- **Stack**: Next.js 16 + Supabase (déjà en place, pas de changement)
- **Auth Provider**: Supabase Auth (déjà dans le projet)
- **OAuth**: Doit supporter Google, Kakao, Naver (marchés coréen et international)
- **UX**: Pages login/signup doivent supporter i18n existant (ko/en)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase Auth plutôt que NextAuth | Déjà intégré, moins de config | ✓ Good |
| 4 méthodes de connexion (email + 3 OAuth) | Couvrir users coréens (Kakao/Naver) et internationaux (Google/Email) | ✓ Good (Naver deferred) |
| Pas de reset password en v1 | Scope minimal, OAuth couvre la plupart des cas | ✓ Good |
| onAuthStateChange for client auth | Prevents race conditions with async getUser() in callbacks | ✓ Good (v1.2) |
| Unified tab state pattern | Keep related UI elements synchronized | ✓ Good (v1.2) |

---
*Last updated: 2026-02-01 after v1.3 milestone started*
