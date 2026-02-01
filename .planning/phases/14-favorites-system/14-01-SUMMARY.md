---
phase: 14-favorites-system
plan: 01
subsystem: data-layer
tags: [supabase, database, server-actions, typescript]

dependency-graph:
  requires: [phase-13]
  provides: [user_favorites-table, favorites-types, favorites-actions]
  affects: [14-02, 14-03, 14-04]

tech-stack:
  added: []
  patterns: [check-then-act-toggle, rls-user-isolation]

key-files:
  created:
    - supabase/migrations/1401_user_favorites.sql
    - src/types/favorites.ts
    - src/lib/supabase/favorites.ts
    - src/lib/actions/favorites.ts
  modified: []

decisions:
  - id: FAV-001
    decision: Check-then-act pattern for toggle instead of upsert
    rationale: RLS policies prevent upsert with delete semantics
    alternatives: [upsert-with-on-conflict]
  - id: FAV-002
    decision: maybeSingle() for existence check
    rationale: Returns null instead of error when not found

metrics:
  duration: ~4 min
  completed: 2026-02-01
---

# Phase 14 Plan 01: Database and Data Layer Summary

User favorites foundation with database schema, types, and server actions.

## One-liner

Favorites table with RLS, TypeScript types, Supabase queries, and Server Actions for toggle/fetch operations.

## What was built

### Database Schema (Task 1)
- **user_favorites table** with id, user_id, cafe_id, created_at
- **Composite unique constraint** on (user_id, cafe_id) prevents duplicates
- **Indexes** for user lookups (idx_user_favorites_user_id) and cafe checks (idx_user_favorites_cafe_id)
- **RLS policies** for SELECT, INSERT, DELETE - users can only access their own favorites

### TypeScript Types (Task 2)
- **UserFavorite** - base favorite record
- **FavoriteWithCafe** - favorite with joined cafe data including image
- **FavoriteCafe, FavoriteCafeWithImage** - cafe info types for favorites display
- **ToggleFavoriteResult** - standardized result type for toggle operation

### Supabase Queries (Task 2)
- **toggleFavorite()** - check-then-act pattern for add/remove
- **getUserFavorites()** - fetch all with cafe data and primary image
- **isCafeFavorited()** - quick boolean check
- **getUserFavoriteIds()** - batch check for cafe lists

### Server Actions (Task 3)
- **toggleFavoriteAction()** - authenticated toggle with path revalidation
- **getFavoritesAction()** - get user's favorites with cafe data
- **checkFavoriteAction()** - check single cafe favorite status
- **getFavoriteIdsAction()** - get IDs for batch checking

## Key patterns

### Check-then-act Toggle Pattern
```typescript
// Check if exists
const { data: existing } = await supabase
  .from('user_favorites')
  .select('id')
  .eq('user_id', userId)
  .eq('cafe_id', cafeId)
  .maybeSingle();

if (existing) {
  // Delete
} else {
  // Insert
}
```

### Path Revalidation
Revalidates all affected routes after toggle:
- `/profile/favorites`
- `/cafes`
- `/cafes/[slug]`
- `/map`

## Deviations from Plan

### Migration History Repair
**Found during:** Task 1
**Issue:** Previous migrations (0702-0902) were not tracked in remote migration history
**Fix:** Marked as applied using `supabase migration repair --status applied`
**Impact:** None - migrations were already applied, just not tracked

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| FAV-001 | Check-then-act pattern | RLS policies don't support upsert with delete in single operation |
| FAV-002 | maybeSingle() for check | Cleaner than single() which throws on not found |

## Files Created

| File | Purpose |
|------|---------|
| supabase/migrations/1401_user_favorites.sql | Database table with RLS |
| src/types/favorites.ts | TypeScript type definitions |
| src/lib/supabase/favorites.ts | Database query functions |
| src/lib/actions/favorites.ts | Server Actions for UI |

## Next Phase Readiness

Ready for 14-02 (Favorite Button Component):
- Toggle action available: `toggleFavoriteAction(cafeId)`
- Check action available: `checkFavoriteAction(cafeId)`
- Batch check available: `getFavoriteIdsAction()`

All foundational data layer in place for UI implementation.
