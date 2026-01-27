# Cafes Seoul

## What This Is

Une application web pour découvrir des cafés à Seoul avec des critères de filtrage avancés (places assises, boissons, nourriture, température, terrasse, esthétique, etc.) que Kakao Map et Naver Map n'offrent pas. Les utilisateurs peuvent parcourir et filtrer les cafés sans compte, mais doivent se connecter pour contribuer.

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

### Active

- [ ] Créer un compte avec email et mot de passe
- [ ] Vérification email après inscription
- [ ] Se connecter avec email/mot de passe
- [ ] Se connecter avec Google OAuth
- [ ] Se connecter avec Kakao OAuth
- [ ] Se connecter avec Naver OAuth
- [ ] Se déconnecter
- [ ] Session persistante (rester connecté)

### Out of Scope

- Proposer l'ajout d'un café — v2, après auth
- Noter les critères d'un café (1-5) — v2, après auth
- Ajouter des photos à un café — v2, après auth
- Panel admin (validation cafés, modération) — v2, après auth
- Reset mot de passe — v2, peut être ajouté plus tard
- 2FA — complexité non nécessaire pour v1

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
*Last updated: 2026-01-27 after initialization*
