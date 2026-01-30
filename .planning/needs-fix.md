# Known Issues & Technical Debt

This document tracks known bugs, limitations, and technical debt that need to be addressed.

Last updated: 2026-01-30

---

## 🔴 HIGH PRIORITY (Blockers)

### 1. Database: Apply migration 0802 to rename coffee→drinks
**Status:** Needs deployment
**Phase:** 8 - Ratings System

**Problem:**
The migration file `supabase/migrations/0802_rename_coffee_to_drinks.sql` contains the fix for renaming `coffee` to `drinks`, but needs to be applied to the production database.

**Solution:**
Run the migration in Supabase SQL Editor. The migration file already contains:
1. Column rename from `coffee` to `drinks` in `cafe_ratings` table
2. Column rename from `rating_coffee` to `rating_drinks` in `cafes` table
3. Updated `update_cafe_rating_aggregates` function
4. Updated `calculate_dimension_average` function
5. Automatic refresh of all cafe aggregates

**To apply:** Open Supabase SQL Editor and run the contents of `supabase/migrations/0802_rename_coffee_to_drinks.sql`

**Related Files:**
- `supabase/migrations/0802_rename_coffee_to_drinks.sql`

---

## 🟡 MEDIUM PRIORITY

### 4. Console Violation Warnings (Performance)
**Status:** Non-blocking
**Component:** `src/components/ui/sheet.tsx`

**Symptoms:**
```
[Violation] 'message' handler took 758ms
[Violation] Forced reflow while executing JavaScript took 81ms
```

**Impact:** No functional impact, clutters console

**Fix:** Monitor in production; if persists, add `will-change: transform` to animated elements

---

### 5. Hydration Errors in Header (Pre-existing)
**Status:** Pre-existing, not related to recent changes
**Component:** `src/components/header.tsx` (UserMenu)

**Issue:** Radix UI DropdownMenu generates different IDs on server vs client.

**Fix Options:**
- Add `suppressHydrationWarning` to Header
- Or make UserMenu client-only with no SSR

---

## 🟢 LOW PRIORITY

### 6. Cafe Images Not Loaded on Map
**Status:** Intentionally omitted
**Component:** `src/app/map/page.tsx`

**Issue:** Map cafes query doesn't fetch images (uses separate `cafe_images` table).

**Fix Options:**
- Add `primary_image_url` column to cafes table (denormalize)
- Create database view joining cafes with primary image
- Fetch images in separate query and merge client-side

---

## ✅ RESOLVED

### Map: Info Window Navigation (Fixed 2026-01-30)
**Component:** `src/components/map/map-with-filters.tsx`, `src/components/map/cafe-map.tsx`
**Fix:** Replaced Kakao Maps popup overlay with sidebar/bottom sheet pattern:
- Desktop: Right sidebar shows selected cafe details
- Mobile: Bottom sheet drawer shows selected cafe details
- Created `CafeDetailPanel` component with working navigation via Next.js Link
- "View Details" button now navigates correctly to cafe page

### TypeScript: coffee→drinks rename errors (Fixed 2026-01-30)
**Component:** Rating types and validation
**Fix:** All TypeScript files already use `drinks` instead of `coffee`. Build compiles successfully.

### Map Filters: Mismatched property names (Fixed 2026-01-30)
**Component:** `src/types/map.ts`, `src/lib/utils/filter-cafes.ts`, `src/components/map/map-filters.tsx`
**Fix:** Renamed filter properties to match `RatingBreakdown` type:
- `ambianceMin` → `lightingMin`
- `noiseMin` → `quietnessMin`
- `valueMin` → `priceValueMin`
- `temperatureMin` → `comfortMin`

Updated translations in all 5 languages (EN, KO, FR, ZH, VI).

### Filter Drawer Accessibility
**Component:** `src/components/map/map-with-filters.tsx`
**Fix:** Added `SheetTitle` with `sr-only` class for screen readers.

---

## Database Schema Improvements (Future)

### Add Computed primary_image_url to Cafes Table
```sql
ALTER TABLE cafes ADD COLUMN primary_image_url TEXT;

CREATE OR REPLACE FUNCTION update_cafe_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE cafes SET primary_image_url = NEW.storage_path WHERE id = NEW.cafe_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Future Enhancements

### Info Window → Sidebar Redesign
Replace Kakao Map popup with app sidebar for better UX and no overlay limitations.

### Map Performance Optimization
Server-side filtering when cafe count exceeds 100-200.

### Enhanced Mobile Experience
- Bottom sheet for cafe details (swipeable)
- Floating action button for filters
- Full-screen map in landscape mode

---

## Kakao Maps SDK Notes

### Limitations Learned
1. **CustomOverlayMap events:** All click events intercepted
2. **SSR:** Must use `ssr: false` with dynamic imports
3. **Script loading:** Requires API key before component renders
4. **Mobile:** Needs `dvh` units for viewport height

### Workarounds That Worked
- `window.location.href` for navigation (when events fire)
- `100dvh` for mobile viewport height
- `setTimeout(fn, 0)` to escape React event batching
- `stopPropagation()` on close button

### Workarounds That Failed
- React synthetic events in CustomOverlayMap
- Next.js Link components in overlays
- CSS z-index alone

---

## Quick Reference: Map Components

| Component | Purpose | Known Issues |
|-----------|---------|--------------|
| `CafeMap` | Main interactive map | None |
| `CafeMarker` | Individual cafe marker | None |
| `CafeInfoWindow` | Popup on marker click | Navigation doesn't work |
| `MapWithFilters` | Layout with sidebar | None |
| `MapFilters` | Filter UI sidebar | None |
| `CafeStaticMap` | Static map on cafe pages | None |
| `MapProvider` | Script loader | None |

---

*Document maintained alongside project development.*
