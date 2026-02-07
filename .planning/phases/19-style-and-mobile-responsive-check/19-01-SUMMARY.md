---
phase: 19
plan: 01
subsystem: ui-global
completed: 2026-02-07
duration: 4min
tags: [responsive, mobile, viewport, accessibility, touch-targets, wcag]

requires:
  - phase-18: Email notification system (existing app structure)

provides:
  - Viewport metadata for proper mobile rendering
  - WCAG AAA compliant touch targets (44px) on all header elements
  - Responsive header with no overlap at 320px width
  - Mobile-friendly footer with proper text wrapping
  - Global horizontal scroll prevention

affects:
  - All pages (root layout changes)
  - All navigation interactions (header touch targets)

tech-stack:
  added: []
  patterns:
    - Next.js viewport export for mobile metadata
    - Tailwind min-h-[44px] for AAA touch targets
    - overflow-x-hidden for global scroll prevention
    - TypeScript exclude pattern for edge functions

key-files:
  created: []
  modified:
    - src/app/layout.tsx: Viewport export, overflow-x-hidden
    - src/components/header.tsx: Touch targets, mobile nav spacing
    - src/components/footer.tsx: Mobile text centering
    - src/components/language-switcher.tsx: Touch targets, dropdown safety
    - tsconfig.json: Exclude edge functions from Next.js build
    - supabase/functions/send-daily-digest/*.ts: Fixed import paths

decisions:
  - decision: Use maximumScale: 5 instead of 1 for viewport
    rationale: WCAG guidelines prohibit preventing zoom
    alternatives: maximumScale: 1 (rejected - accessibility violation)
  - decision: Use 44px minimum touch targets (AAA) instead of 24px (AA)
    rationale: Better user experience on mobile devices
    alternatives: 24px AA minimum (chose higher standard)
  - decision: Exclude supabase/functions from TypeScript build
    rationale: Edge functions use Deno runtime and esm.sh imports
    alternatives: Separate tsconfig for functions (overkill for current size)
---

# Phase 19 Plan 01: Global Layout and Header Responsive Fix Summary

**One-liner:** Added viewport metadata and WCAG AAA touch targets to root layout and global navigation.

## What Was Done

### Task 1: Add viewport metadata and fix root layout
- Added Next.js viewport export with mobile-friendly settings (device-width, initialScale 1, maximumScale 5)
- Added `overflow-x-hidden` to body element to prevent horizontal scroll globally
- Fixed edge function TypeScript import issues (removed .ts extensions)
- Excluded `supabase/functions` from Next.js TypeScript build to prevent Deno import conflicts

### Task 2: Fix header and footer responsive issues
- Header improvements:
  - Added `min-h-[44px]` to all interactive elements (logo, nav links, buttons, language switcher) for AAA compliance
  - Reduced nav gap from `gap-4` to `gap-2` on mobile to prevent overlap at 320px width
  - Added `whitespace-nowrap` to nav links to prevent text wrapping
  - Added proper vertical alignment with `flex items-center` on nav links
- Footer improvements:
  - Added responsive text alignment (`text-center` on mobile, `text-left` on desktop)
  - Added `break-words` for proper text wrapping on narrow screens
- Language switcher improvements:
  - Added `min-h-[44px]` to trigger button for proper touch target
  - Added `max-h-[80vh] overflow-y-auto` to dropdown to prevent overflow on mobile

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript build errors for edge functions**
- **Found during:** Task 1 build verification
- **Issue:** Next.js build was trying to type-check Supabase edge functions which use Deno runtime and esm.sh imports, causing compilation errors
- **Fix:**
  - Removed `.ts` extensions from edge function imports (email-templates.ts, index.ts)
  - Added `supabase/functions` to TypeScript exclude array in tsconfig.json
- **Files modified:** tsconfig.json, supabase/functions/send-daily-digest/email-templates.ts, supabase/functions/send-daily-digest/index.ts
- **Commit:** 7e8d02e (included in Task 1 commit)
- **Rationale:** Could not verify Task 1 completion without passing build. Edge functions are Deno runtime and shouldn't be type-checked by Next.js

## Testing & Verification

### Build Verification
- ✓ `npm run build` passes with no TypeScript errors
- ✓ Viewport export recognized in root layout
- ✓ All components compile successfully

### Expected Manual Verification (for human checkpoint)
1. Browser DevTools at 320px width: No header overlap, all elements visible and tappable
2. Browser DevTools at 375px width (iPhone): All header elements accessible
3. Footer renders as centered column on mobile, row on desktop
4. Language switcher opens within viewport bounds on mobile

## Technical Notes

### Viewport Configuration
The viewport export uses WCAG-compliant settings:
- `maximumScale: 5` allows users to zoom (required by WCAG)
- `userScalable: true` enables pinch-to-zoom
- Never use `maximumScale: 1` or `userScalable: false` - accessibility violations

### Touch Target Sizes
WCAG guidelines:
- **AA:** Minimum 24x24px touch targets
- **AAA:** Minimum 44x44px touch targets
This implementation uses AAA standard (44px) for better mobile UX.

### TypeScript Edge Function Handling
Edge functions (Supabase/Deno runtime) require special handling:
- Excluded from Next.js TypeScript compilation
- Use esm.sh imports (URL imports not supported by Next.js TS)
- Don't use `.ts` extensions in imports (Deno convention)

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Recommendations:**
- Plan 19-02 should audit individual page layouts for responsive issues
- Check for any page-specific horizontal overflow at 320px
- Verify all form inputs and interactive elements meet touch target minimums

## Commits

| Task | Commit  | Message |
|------|---------|---------|
| 1    | 7e8d02e | feat(19-01): add viewport metadata and fix root layout |
| 2    | ae1adfc | feat(19-01): fix header and footer responsive issues |

## Files Changed

**Task 1:**
- src/app/layout.tsx
- supabase/functions/send-daily-digest/email-templates.ts
- supabase/functions/send-daily-digest/index.ts
- tsconfig.json

**Task 2:**
- src/components/header.tsx
- src/components/footer.tsx
- src/components/language-switcher.tsx

---

*Execution: 4 minutes*
*Completed: 2026-02-07*
