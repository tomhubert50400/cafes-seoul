---
phase: 10
plan: 01
subsystem: admin
tags: [admin, access-control, dashboard, moderation, i18n]
dependency-graph:
  requires: [07-cafe-submissions, 09-photos-voting]
  provides: [admin-layout, admin-dashboard, table-component, forbidden-page]
  affects: [10-02, 10-03]
tech-stack:
  added: []
  patterns: [role-based-access-control, forbidden-pattern, server-component-auth]
key-files:
  created:
    - src/app/admin/layout.tsx
    - src/app/admin/page.tsx
    - src/app/forbidden.tsx
    - src/components/admin/admin-nav.tsx
    - src/components/ui/table.tsx
  modified:
    - src/lib/i18n/translations.ts
decisions:
  - id: admin-role-check-pattern
    choice: Check role in layout, call forbidden() for non-admin
    rationale: Centralized protection for all /admin/* routes
  - id: forbidden-as-app-level
    choice: Place forbidden.tsx in src/app/ as custom error page
    rationale: Next.js 16 convention for custom 403 pages
  - id: admin-nav-client-component
    choice: AdminNav as client component with usePathname
    rationale: Active link highlighting requires client-side path tracking
metrics:
  duration: ~4min
  completed: 2026-01-31
---

# Phase 10 Plan 01: Admin Setup Summary

Admin layout with forbidden() role protection, dashboard with pending counts, and shadcn/ui Table component.

## What Was Built

### Task 1: shadcn/ui Table Component
- Added Table component via shadcn CLI
- Exports: Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption
- Ready for use in moderation lists (plans 10-02, 10-03)

### Task 2: Admin Layout with Protection
- **AdminLayout** (`src/app/admin/layout.tsx`):
  - Checks authentication, redirects to login if not logged in
  - Queries profiles table for user role
  - Calls `forbidden()` if role !== 'admin'
  - Renders sidebar with AdminNav + main content area

- **Forbidden Page** (`src/app/forbidden.tsx`):
  - Custom 403 error page with i18n support
  - ShieldX icon, translated message, link to home

- **AdminNav** (`src/components/admin/admin-nav.tsx`):
  - Client component with usePathname for active state
  - Links: Dashboard, Cafe Submissions, Photos
  - Lucide icons: LayoutDashboard, Coffee, Image

### Task 3: Admin Dashboard
- **Dashboard Page** (`src/app/admin/page.tsx`):
  - Server component fetching pending counts
  - Queries cafe_submissions WHERE status = 'pending'
  - Queries photos WHERE status = 'pending'
  - Cards with counts linking to moderation pages

- **i18n Translations**:
  - Added admin.* keys to all 5 languages
  - Keys: title, dashboard.subtitle, pendingSubmissions, pendingPhotos, viewAll, noPending
  - Nav keys: nav.dashboard, nav.submissions, nav.photos
  - Forbidden keys: forbidden.title, forbidden.message, forbidden.back

## Technical Notes

### Access Control Pattern
```typescript
// Check auth first
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login?redirect=/admin')

// Then check role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'admin') forbidden()
```

### Database Queries
- Both queries use `{ count: 'exact', head: true }` for efficiency
- Only fetches count, not actual records
- Handles null with `?? 0` fallback

## Commits

| Hash | Message |
|------|---------|
| 06eaa67 | feat(10-01): add shadcn/ui Table component |
| 995abd6 | feat(10-01): add admin layout with forbidden() protection |
| 1881326 | feat(10-01): add admin dashboard with pending counts and i18n |

## Deviations from Plan

None - plan executed exactly as written.

## Files Created/Modified

### Created
- `src/components/ui/table.tsx` - shadcn Table component
- `src/app/admin/layout.tsx` - Admin layout with role protection
- `src/app/admin/page.tsx` - Admin dashboard with counts
- `src/app/forbidden.tsx` - Custom 403 page
- `src/components/admin/admin-nav.tsx` - Admin sidebar navigation

### Modified
- `src/lib/i18n/translations.ts` - Added admin.* translations (5 languages)

## Requirements Addressed

| Requirement | Status | Notes |
|-------------|--------|-------|
| ADMIN-07 (forbidden for non-admin) | Partial | Layout protection implemented |
| ROLE-04 (role-based protection) | Partial | Admin role check in layout |
| ADMIN-01 (pending submissions count) | Partial | Dashboard shows count |
| ADMIN-05 (pending photos count) | Partial | Dashboard shows count |

## Next Phase Readiness

**Ready for 10-02 (Cafe Submissions Moderation)**:
- Admin layout and protection in place
- Table component available
- Pending count queries proven
- Navigation links to /admin/submissions ready

**No blockers identified.**
