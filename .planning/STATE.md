# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Filtrage multi-criteres avec notes 1-5 sur chaque dimension du cafe
**Current focus:** v1.4 Style & Responsive

## Current Position

Phase: 19 of 19 (Style and Mobile Responsive Check)
Plan: 03 of 05 - Complete
Status: In progress
Last activity: 2026-02-07 - Completed 19-03-PLAN.md (Profile Pages Responsive)

Progress: v1.0 [6] v1.1 [5] v1.2 [1] v1.3 [6] v1.4 [3] = 19 phases (76 plans shipped)
Phase 19: ███░░ (3/5 plans)

## Performance Metrics

**Milestone v1.0:**
- Plans completed: 20
- Phases: 1-6 (6 phases)
- Timeline: 3 days

**Milestone v1.1:**
- Plans completed: 24
- Phases: 7-11 (5 phases)
- Timeline: 2 days

**Milestone v1.2:**
- Plans completed: 4
- Phase: 12 (1 phase)
- Timeline: 1 day

**Milestone v1.3:**
- Plans completed: 25
- Phases: 13-18 (6 phases)
- Timeline: 2 days
- Requirements: 25/26 shipped (96.2%)

## Accumulated Context

### Key Patterns (carry forward)

**Authentication:**
- Supabase Auth with Next.js 16 App Router
- `@supabase/ssr` for cookie-based sessions
- Server Actions for auth mutations
- `getUser()` not `getSession()` in server code
- Client components: use onAuthStateChange subscription to track auth state

**UI/UX:**
- Sonner for toast notifications (2s duration)
- react-hook-form + Zod for validation
- Tailwind animate-pulse for loading states
- i18n via next-intl (KO, EN, FR, ZH, VI)
- Unified tab state: When multiple tab groups should sync, use shared controlled state
- Nested layouts: child pages return content only, parent layout provides Header
- Optimistic UI: useTransition + useState + error revert for toggles
- Viewport: Next.js viewport export (device-width, max-scale 5 for WCAG)
- Touch targets: min-h-[44px] for AAA compliance (WCAG)
- Input height: h-11 (44px) for consistent touch targets
- Responsive: overflow-x-hidden on body to prevent horizontal scroll
- Mobile stacking: flex-col sm:flex-row for vertical layout on mobile
- Responsive widths: w-full sm:w-auto for buttons, w-full min-w-[Xpx] sm:w-[Xpx] for selects
- Text sizing: text-2xl md:text-3xl for responsive headings
- Text overflow: break-words on user content, addresses, URLs
- Mobile panels: max-h-[80vh] to prevent viewport overflow
- Mobile tabs: overflow-x-auto flex-nowrap sm:flex-wrap for horizontal scroll

**Database:**
- pg_trgm for fuzzy text search
- Rate limit reset at midnight KST
- Upsert pattern with ON CONFLICT
- Database triggers for aggregation
- AFTER triggers for notification queueing (don't block main operations)
- Partial indexes for efficient queue queries (WHERE sent_at IS NULL)

**Email (Phase 18):**
- Table-based HTML layouts for email client compatibility
- Translation objects for localized email content (5 languages)
- HMAC-signed tokens for secure unsubscribe links
- Opt-out model: notifications enabled by default
- Service role in Edge Functions for full database access
- Service role client in Next.js for unauthenticated operations (unsubscribe)

### Decisions Log

See PROJECT.md Key Decisions table for full history.

Recent (Phase 19):
- Use maximumScale: 5 for viewport (WCAG compliance - must allow zoom)
- Use 44px touch targets (AAA) instead of 24px (AA) for better mobile UX
- Exclude supabase/functions from Next.js TypeScript build (Deno runtime incompatibility)
- Use flex-col sm:flex-row pattern for mobile stacking instead of hiding elements
- Combine w-full with min-w on selects to prevent collapse while allowing mobile full-width
- Set explicit h-12 w-12 on icon-only buttons for 44px touch targets
- Input component uses h-11 (44px) globally for consistent touch targets across all forms
- Profile/settings tabs use overflow-x-auto for graceful mobile horizontal scroll
- Buttons use w-full sm:w-auto pattern for mobile-first responsive width

### Roadmap Evolution

- Phase 19 added: Style and mobile responsive check (v1.4)

### Pending Todos

None

### Blockers/Concerns

None

## Session Continuity

Last session: 2026-02-07
Stopped at: Completed 19-03-PLAN.md (Profile Pages Responsive)
Resume file: None
Next action: Continue with 19-04-PLAN.md (Cafe Detail and Listing Pages Responsive)

---
*State initialized: 2026-01-27*
*v1.0 MVP shipped: 2026-01-29*
*v1.1 User Contributions shipped: 2026-01-31*
*v1.2 Polish & Bug Fixes shipped: 2026-02-01*
*v1.3 Profile Enhancement shipped: 2026-02-01*
