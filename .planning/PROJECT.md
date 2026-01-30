# Cafes Seoul

## What This Is

Une application web pour découvrir des cafés à Seoul avec des critères de filtrage avancés (places assises, boissons, nourriture, température, terrasse, esthétique, etc.) que Kakao Map et Naver Map n'offrent pas. Les utilisateurs peuvent parcourir et filtrer les cafés sans compte, mais doivent se connecter pour contribuer.

## Current Milestone: v1.1 User Contributions

**Goal:** Enable authenticated users to contribute content to the platform — submit new cafes, rate existing ones on 10 dimensions, and upload photos.

**Target features:**
- Submit new cafes (name, address, phone) with duplicate detection
- Rate cafes on 10 dimensions (mandatory overall rating + 9 optional)
- Upload photos to cafe profiles (up to 3 per user per cafe)
- Admin panel for approving/rejecting submissions and photos
- User dashboard showing contribution stats
- Photo voting system (heart/upvote)
- Role-based access (user/pro/admin) — pro reserved for future cafe owner features

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

### Active (v1.1 - User Contributions)

- [ ] Proposer un nouveau café (soumission avec validation admin)
- [ ] Noter un café sur 10 dimensions (note globale obligatoire)
- [ ] Télécharger des photos d'un café (max 3 par utilisateur)
- [ ] Voter pour les photos (système de likes)
- [ ] Tableau de bord utilisateur (contributions, statistiques)
- [ ] Panel admin (validation cafés et photos)
- [ ] Système de rôles (user/pro/admin)

### Out of Scope (deferred)

- Reset mot de passe — peut être ajouté plus tard
- 2FA — complexité non nécessaire
- Fonctionnalités "pro" pour les propriétaires de cafés — milestone future (v1.2+)
- Modification/Suppression après approbation — contenu approuvé est permanent
- Commentaires sur les avis — pas nécessaire pour v1.1
- Système de récompenses/gamification — à évaluer plus tard

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
*Last updated: 2026-01-30 after milestone v1.1 planning*
