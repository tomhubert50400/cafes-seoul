# Cafes Seoul

## What This Is

Une application web pour découvrir des cafés à Seoul avec des critères de filtrage avancés (places assises, boissons, nourriture, température, terrasse, esthétique, etc.) que Kakao Map et Naver Map n'offrent pas. Les utilisateurs peuvent parcourir et filtrer les cafés sans compte, mais doivent se connecter pour contribuer.

## Current State

**Latest Release:** v1.1 User Contributions (2026-01-31)
**Codebase:** 23,257 lines TypeScript (Next.js 16 + Supabase)

**Shipped in v1.1:**
- Cafe submission with fuzzy duplicate detection and admin approval workflow
- 10-dimension rating system with automatic average aggregation
- Photo uploads with voting, masonry gallery, and moderation queue
- Admin panel for moderating submissions and photos
- User contribution dashboard with stats and action controls
- Full i18n across 5 languages (KO, EN, FR, ZH, VI)

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

### Active (Next Milestone)

- [ ] User notification on submission approval/rejection (SUBMIT-07 deferred from v1.1)
- [ ] Password reset via email link
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

## Constraints

- **Stack**: Next.js 16 + Supabase (déjà en place, pas de changement)
- **Auth Provider**: Supabase Auth (déjà dans le projet)
- **OAuth**: Doit supporter Google, Kakao, Naver (marchés coréen et international)
- **UX**: Pages login/signup doivent supporter i18n existant (ko/en)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase Auth plutôt que NextAuth | Déjà intégré, moins de config | — Pending |
| 4 méthodes de connexion (email + 3 OAuth) | Couvrir users coréens (Kakao/Naver) et internationaux (Google/Email) | — Pending |
| Pas de reset password en v1 | Scope minimal, OAuth couvre la plupart des cas | — Pending |

---
*Last updated: 2026-01-31 after v1.1 milestone shipped*
