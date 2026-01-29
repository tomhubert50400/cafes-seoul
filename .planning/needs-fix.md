# Known Issues & Technical Debt

This document tracks known bugs, limitations, and technical debt that need to be addressed in future phases.

Last updated: 2026-01-29

---

## Phase 6: Map Feature

### 🔴 HIGH PRIORITY

#### 1. Info Window "View Details" Navigation Not Working
**Status:** Known limitation, workaround in place  
**Component:** `src/components/map/cafe-info-window.tsx`  
**Issue:** Kakao Maps `CustomOverlayMap` intercepts all click events, preventing navigation from the info window popup.  

**Symptoms:**
- Clicking "View Details →" in marker popup does nothing
- Console logs don't fire (event never reaches React handler)
- Anchor tags, buttons, and Link components all fail

**Root Cause:**
Kakao Maps JavaScript SDK captures all DOM events within overlays for its own internal handling. The `CustomOverlayMap` component from `react-kakao-maps-sdk` creates content inside Kakao's overlay system which intercepts clicks before they reach React's event handlers.

**Attempted Solutions (that failed):**
1. ✅ `e.stopPropagation()` - Events never fire
2. ✅ `e.preventDefault()` + `setTimeout()` - Events never fire  
3. ✅ Native `<a>` tag instead of Next.js Link - Kakao intercepts browser navigation
4. ✅ `window.location.href` in setTimeout - Events never fire
5. ✅ Wrapped entire card in `<a>` tag - Kakao prevents navigation
6. ✅ High z-index and pointer-events - Overlay system captures everything

**Current Workaround:**
- Info window displays cafe info (name, rating, address)
- Users can see cafe details but must navigate manually
- No "View Details" button shown (removed to avoid confusion)

**Recommended Fix (Future):**
Replace popup overlay with sidebar/bottom sheet pattern:
- **Desktop:** Show selected cafe details in right sidebar
- **Mobile:** Show selected cafe details in bottom sheet drawer
- This avoids Kakao's overlay system entirely
- Provides better UX with more space for cafe info
- Navigation can use standard Next.js routing

**Estimated Effort:** 2-3 hours
**Priority:** Medium (core filtering works, navigation is secondary)

---

### 🟡 MEDIUM PRIORITY

#### 2. Console Violation Warnings (Performance)
**Status:** Non-blocking warnings  
**Component:** `src/components/ui/sheet.tsx`  
**Issue:** Radix UI Dialog/Sher components generate console warnings about message handlers taking too long.

**Symptoms:**
```
[Violation] 'message' handler took 758ms
[Violation] Forced reflow while executing JavaScript took 81ms
[Violation] 'touchend' handler took 259ms
```

**Impact:** 
- No functional impact
- Clutters console during development
- May indicate performance issues on low-end devices

**Possible Causes:**
1. Sheet component opening/closing animations blocking main thread
2. Cafe list re-rendering when filters change (expected for <100 cafes)
3. Kakao Maps JavaScript SDK initialization

**Recommended Fix:**
- Monitor in production build (may not appear in prod)
- If persists, add `will-change: transform` to animated elements
- Consider virtualizing cafe list if >100 cafes

**Estimated Effort:** 1 hour (if fix needed)
**Priority:** Low (warnings only, no functional impact)

---

#### 3. Hydration Errors in Header (Pre-existing)
**Status:** Pre-existing issue, unrelated to Phase 6  
**Component:** `src/components/header.tsx` (UserMenu)  
**Issue:** Radix UI DropdownMenu generates different IDs on server vs client.

**Symptoms:**
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

**Impact:**
- No functional impact
- Console error in development
- Header dropdown still works correctly

**Note:** This issue existed before Phase 6 work. It affects the user menu dropdown in the header, not the map feature.

**Recommended Fix:**
- Add `suppressHydrationWarning` to Header component
- Or make UserMenu client-only with `use client` and no SSR

**Estimated Effort:** 15 minutes
**Priority:** Low (cosmetic issue only)

---

### 🟢 LOW PRIORITY

#### 4. Cafe Images Not Loaded on Map
**Status:** Intentionally omitted for quick fix  
**Component:** `src/app/map/page.tsx`  
**Issue:** Map cafes query doesn't fetch cafe images (primary_image_url column doesn't exist).

**Context:**
- Database stores images in separate `cafe_images` table
- API routes handle image fetching via separate query
- Map page uses direct Supabase query (not API route)
- Fixed by removing primary_image_url from query

**Impact:**
- Cafe cards on map don't show images
- Info windows show text only
- Aesthetic impact only

**Recommended Fix:**
- Option A: Add `primary_image_url` column to cafes table (denormalize)
- Option B: Create database view that joins cafes with primary image
- Option C: Fetch images in separate query and merge client-side

**Estimated Effort:** 30-60 minutes
**Priority:** Low (nice to have, not critical)

---

#### 5. Filter Drawer Needs SheetTitle for Accessibility
**Status:** Fixed in Phase 6  
**Component:** `src/components/map/map-with-filters.tsx`  
**Issue:** Mobile filter drawer doesn't have accessible title.

**Fix Applied:**
Added `SheetTitle` with `sr-only` class for screen readers.

**Verification:**
```tsx
<SheetContent side="left" className="w-[300px] sm:w-80 p-0">
  <SheetTitle className="sr-only">Filter cafes</SheetTitle>
  ...
</SheetContent>
```

**Status:** ✅ RESOLVED

---

## Database Schema Improvements

### 1. Add Computed primary_image_url to Cafes Table
**Current:**
```sql
-- Images stored separately
SELECT * FROM cafe_images WHERE cafe_id = ? AND is_primary = true;
```

**Proposed:**
```sql
ALTER TABLE cafes ADD COLUMN primary_image_url TEXT;

-- Create trigger to auto-update
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

**Benefit:** Simplifies queries, improves performance
**Priority:** Low

---

## Future Enhancements

### 1. Info Window → Sidebar Redesign
Replace Kakao Map popup with app sidebar:
- Better UX with more space for cafe details
- Full cafe info (hours, amenities, photos)
- Direct navigation to cafe page
- No Kakao overlay limitations

**Mockup:**
```
[Filter Sidebar] [Map Area] [Cafe Detail Sidebar - appears on marker click]
```

**Estimated Effort:** 3-4 hours
**Priority:** Medium

### 2. Map Performance Optimization
**Current:** Client-side filtering with useMemo  
**Proposed:** Server-side filtering for >100 cafes

**When needed:**
- When cafe count exceeds 100-200
- When filters cause noticeable lag
- When bundle size becomes concern

**Approach:**
- Add query parameters to /map page
- Server filters cafes before sending to client
- Maintain filter state in URL for shareability

**Estimated Effort:** 2-3 hours
**Priority:** Low (only when scale requires it)

### 3. Enhanced Mobile Experience
**Current:** Sheet drawer for filters  
**Proposed:** 
- Bottom sheet for cafe details (swipeable)
- Floating action button for filters
- Full-screen map in landscape mode
- Touch-optimized filter controls

**Estimated Effort:** 4-6 hours  
**Priority:** Low (current mobile works fine)

---

## Testing Checklist for Future Fixes

Before marking issues as resolved, verify:

### Info Window Navigation Fix
- [ ] Click marker → info window opens
- [ ] Click "View Details" → navigates to cafe page
- [ ] Works on desktop Chrome, Safari, Firefox
- [ ] Works on mobile Safari, Chrome Android
- [ ] No console errors
- [ ] Back button returns to map with state preserved

### Performance Fixes
- [ ] No violation warnings in console
- [ ] Map filters smoothly with 100+ cafes
- [ ] Mobile pinch-zoom works smoothly
- [ ] First load < 3 seconds

### Image Loading
- [ ] Cafe images appear on map markers
- [ ] Images lazy-load correctly
- [ ] Fallback when no image exists
- [ ] Responsive image sizes

---

## Notes

### Kakao Maps SDK Limitations Learned
1. **CustomOverlayMap events:** All click events intercepted, cannot use React event handlers
2. **SSR:** Must use `ssr: false` with dynamic imports
3. **Script loading:** Requires API key before any component renders
4. **Mobile:** Needs explicit viewport height units (dvh) to avoid browser chrome issues

### Workarounds That Worked
- ✅ Using `window.location.href` for navigation (when events fire)
- ✅ `100dvh` for mobile viewport height
- ✅ `setTimeout(fn, 0)` to escape React event batching
- ✅ `stopPropagation()` on close button to prevent map click
- ✅ `pointer-events-auto` and high z-index (sometimes)

### Workarounds That Failed
- ❌ React synthetic events in CustomOverlayMap
- ❌ Next.js Link components in overlays
- ❌ CSS z-index alone
- ❌ `useCallback` event handlers
- ❌ Various timing delays (10ms, 100ms, 1000ms)

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

## How to Use This Document

1. **Before starting work:** Check if issue is already documented
2. **When fixing issues:** Update status and add verification checklist
3. **When creating new phases:** Reference this for context
4. **When debugging:** Check "Workarounds That Worked/Failed" sections

**To update:**
```bash
git add .planning/needs-fix.md
git commit -m "docs: update known issues with [description]"
```

---

*Document maintained alongside project development. Update after each phase completion or when new issues are discovered.*
