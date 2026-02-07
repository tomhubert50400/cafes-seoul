# Cafes Seoul

## What This Is

Une application web pour découvrir des cafés à Seoul avec des critères de filtrage avancés (places assises, boissons, nourriture, température, terrasse, esthétique, etc.) que Kakao Map et Naver Map n'offrent pas. Les utilisateurs peuvent parcourir et filtrer les cafés sans compte, mais doivent se connecter pour contribuer. Includes user profiles with reviews, favorites, settings, and email notifications.

## Current State

**Latest Release:** v1.4 Style & Responsive (2026-02-07)
**Codebase:** ~34,000 lines TypeScript (Next.js 16 + Supabase)

**Shipped in v1.4:**
- WCAG AAA touch targets (44px minimum) on all interactive elements
- Viewport metadata with proper mobile rendering (maximumScale: 5)
- Mobile-first responsive layouts across all 38 routes (320px+)
- Roulette spinner animation containment for narrow viewports
- Admin panel mobile card layout for complex data tables
- Global overflow prevention (overflow-x-hidden on body)

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
- ✓ My Reviews tab with sorting, filtering, and stats — v1.3
- ✓ Favorites system with heart toggle and map integration — v1.3
- ✓ Profile settings with avatar upload and account deletion — v1.3
- ✓ Public profiles with privacy toggle — v1.3
- ✓ Text reviews with helpful voting — v1.3
- ✓ Password reset via email link — v1.3
- ✓ Notification preferences with toggle switches — v1.3
- ✓ Email notifications for submission status changes — v1.3

### Deferred (v1.4+)

- [ ] Naver OAuth login
- [ ] Review titles (TXT-02)
- [ ] Favorites collections/lists
- [ ] Language preference override
- [ ] Data export
- [ ] Weekly digest email

### Out of Scope

- 2FA — complexity not needed for cafe discovery
- Pro features for cafe owners — future milestone (v2.0+)
- Edit/delete after approval — approved content is permanent
- Review comments/replies — adds moderation complexity
- Gamification/rewards — evaluate after user adoption
- Real-time in-app notifications — WebSocket complexity without core value
- Social following — not aligned with cafe discovery focus

## Context

**Codebase existant:**
- Next.js 16 avec App Router et Server Components
- Supabase déjà intégré pour database et storage
- `@supabase/ssr` installé pour auth SSR
- Edge Functions for email delivery (send-daily-digest)
- pg_cron for scheduled tasks

**OAuth Providers:**
- Google: Standard, bien documenté
- Kakao: Provider natif Supabase, nécessite config Kakao Developers
- Naver: Provider natif Supabase (deferred), nécessite config Naver Developers

**Key Patterns (from v1.4):**
- Client auth: use onAuthStateChange subscription, track userId in state
- Nested layouts: child pages return content only, parent layout provides Header
- Unified tab state: when multiple tab groups should sync, use shared controlled state
- Optimistic UI: useTransition + useState + error revert for toggles
- AFTER triggers: Queue notifications without blocking main operations
- Table-based HTML: Email client compatibility over modern CSS
- HMAC-signed tokens: Secure unsubscribe links with expiry
- Touch targets: min-h-[44px] for WCAG AAA on all interactive elements
- Mobile stacking: flex-col sm:flex-row, w-full sm:w-auto patterns
- Viewport: maximumScale 5, never disable zoom (WCAG)
- Overflow: overflow-x-hidden on body, overflow-hidden on animation containers

## Constraints

- **Stack**: Next.js 16 + Supabase (déjà en place, pas de changement)
- **Auth Provider**: Supabase Auth (déjà dans le projet)
- **OAuth**: Doit supporter Google, Kakao, Naver (marchés coréen et international)
- **UX**: Pages login/signup doivent supporter i18n existant (ko/en/fr/zh/vi)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase Auth plutôt que NextAuth | Déjà intégré, moins de config | ✓ Good |
| 4 méthodes de connexion (email + 3 OAuth) | Couvrir users coréens (Kakao/Naver) et internationaux (Google/Email) | ✓ Good (Naver deferred) |
| onAuthStateChange for client auth | Prevents race conditions with async getUser() in callbacks | ✓ Good (v1.2) |
| Unified tab state pattern | Keep related UI elements synchronized | ✓ Good (v1.2) |
| Extend cafe_ratings for text reviews | Maintains one-review-per-user-per-cafe, simpler queries | ✓ Good (v1.3) |
| ID-based public profile route | More stable than username which could change | ✓ Good (v1.3) |
| AFTER triggers for notifications | Don't block admin actions on queue failure | ✓ Good (v1.3) |
| Opt-out notification model | Enabled by default reduces friction | ✓ Good (v1.3) |
| Daily digest at 9 AM KST | Catches previous day activity at workday start | ✓ Good (v1.3) |
| 44px AAA touch targets (not 24px AA) | Better mobile UX, higher accessibility standard | ✓ Good (v1.4) |
| maximumScale: 5 viewport | WCAG requires allowing zoom; never disable | ✓ Good (v1.4) |
| flex-col sm:flex-row for mobile stacking | Show all content on mobile instead of hiding | ✓ Good (v1.4) |
| Input h-11 (44px) globally | Consistent touch targets across all forms | ✓ Good (v1.4) |
| Admin mobile card layout pattern | Complex tables unusable on mobile; cards solve it | ✓ Good (v1.4) |

---
*Last updated: 2026-02-07 after v1.4 milestone shipped*
