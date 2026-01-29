# Phase 6: Map Feature - PLAN

## Goal
Implement a dual-map system with custom ratings filtering:
1. **Full Interactive Map** (`/map`) - Shows all cafes with clustering, supports filtering by ratings (seating, wifi, etc.)
2. **Static Map** (cafe profiles) - Non-interactive map focused on single cafe location

## Research Basis
- **Stack:** react-kakao-maps-sdk v1.2.0 with Kakao Maps JavaScript API
- **Filtering:** Client-side filtering for ratings (seating ≥ 4, wifi ≥ 3, etc.)
- **Data Requirement:** CafeSummary type needs `ratings` field added
- **Architecture:** MapProvider loads script once, filters applied client-side with useMemo

## Plans Overview

| Plan | Description | Estimated Time | Dependencies |
|------|-------------|----------------|--------------|
| 06-01 | Dependencies & Type Updates | 15 min | None |
| 06-02 | Map Infrastructure (Provider, Types) | 20 min | 06-01 |
| 06-03 | Filter System (UI, Utils, Hooks) | 30 min | 06-02 |
| 06-04 | Interactive Map Page | 45 min | 06-03 |
| 06-05 | Static Map Integration | 20 min | 06-02 |
| 06-06 | Polish & Testing | 20 min | All above |

**Total Estimated Time:** ~2.5 hours

---

## Plan 06-01: Dependencies & Type Updates

### Goal
Install required packages and update CafeSummary type to include ratings for filtering.

### Tasks

1. **Install react-kakao-maps-sdk**
   ```bash
   npm install react-kakao-maps-sdk
   npm install -D kakao.maps.d.ts
   ```

2. **Update tsconfig.json**
   - Add `"kakao.maps.d.ts"` to compilerOptions.types array

3. **Update CafeSummary type** (`src/types/cafe.ts`)
   - Add `ratings: RatingBreakdown` field to CafeSummary interface
   - CafeSummary should now match full Cafe ratings structure

4. **Add environment variable** (document only, user provides key)
   - Add to .env.example: `NEXT_PUBLIC_KAKAO_MAPS_API_KEY=your_kakao_javascript_key`

### Verification
- [ ] `npm list react-kakao-maps-sdk` shows v1.2.0
- [ ] TypeScript can resolve `kakao.maps` namespace
- [ ] CafeSummary interface includes ratings field
- [ ] Build passes without type errors

---

## Plan 06-02: Map Infrastructure

### Goal
Create the foundational components: MapProvider for script loading and map types.

### Tasks

1. **Create MapProvider component** (`src/components/map/map-provider.tsx`)
   - 'use client' directive
   - Use `useKakaoLoader` hook with appkey from env
   - Load libraries: ['clusterer', 'services']
   - Show loading spinner while script loads
   - Show error state if loading fails
   - Render children when ready

2. **Create map types** (`src/types/map.ts`)
   - `MapFilters` interface (seatingMin, wifiMin, etc.)
   - `MapBounds` interface (north, south, east, west)
   - `MapPosition` interface (lat, lng)
   - Re-export from index.ts if needed

3. **Create map utility** (`src/lib/utils/filter-cafes.ts`)
   - `filterCafes(cafes, filters)` - Filter cafes by ratings/features
   - `hasActiveFilters(filters)` - Check if any filter active
   - `getActiveFilterCount(filters)` - Count active filters
   - Handle all 9 rating dimensions + boolean features

4. **Create useMapFilters hook** (`src/hooks/use-map-filters.ts`)
   - State for all filter dimensions
   - `updateFilter(key, value)` function
   - `clearFilters()` function
   - `activeFilterCount` computed value

### Verification
- [ ] MapProvider loads Kakao script without errors
- [ ] Loading state shows spinner
- [ ] Error state displays if API key missing
- [ ] Filter utilities work with test data
- [ ] Hook manages filter state correctly

---

## Plan 06-03: Filter System

### Goal
Build the filter UI components that allow users to filter cafes by ratings.

### Tasks

1. **Create MapFilters component** (`src/components/map/map-filters.tsx`)
   - Sidebar layout with filter sections
   - Slider for each rating dimension (1-5 scale)
   - Checkboxes for boolean features (wifi, parking, pet friendly, etc.)
   - "Clear all filters" button
   - Active filter count display
   - Use existing Slider, Checkbox, Label from shadcn

2. **Create RatingSlider component** (`src/components/map/rating-slider.tsx`)
   - Reusable slider for rating dimensions
   - Props: label, value, onChange, min=0, max=5
   - Display "Any" when value is 0/null
   - Show stars or numeric value

3. **Create FeatureToggle component** (`src/components/map/feature-toggle.tsx`)
   - Checkbox with icon and label
   - Props: icon, label, checked, onChange
   - Used for wifi, parking, pet friendly, etc.

4. **Add i18n translations**
   - Add filter labels to translations.ts
   - Support EN, KO, FR, ZH, VI
   - Keys: map.filters.seating, map.filters.wifi, etc.

### Verification
- [ ] Sliders update filter state correctly
- [ ] Checkboxes toggle boolean filters
- [ ] Clear all resets all filters
- [ ] Active count updates in real-time
- [ ] All text is translated

---

## Plan 06-04: Interactive Map Page

### Goal
Build the full /map page with interactive map, clustering, and filters.

### Tasks

1. **Create CafeMap component** (`src/components/map/cafe-map.tsx`)
   - Accept cafes and filters as props
   - Center on Seoul (37.5665, 126.9780)
   - Use useMemo to filter cafes based on active filters
   - Render MarkerClusterer with filtered cafes
   - Custom marker for each cafe
   - Handle marker click (show info window)
   - Support zoom levels 1-14

2. **Create CafeMarker component** (`src/components/map/cafe-marker.tsx`)
   - Custom styled marker
   - Show cafe name on hover/click
   - Different color for selected cafe
   - Optimized re-rendering with React.memo

3. **Create CafeInfoWindow component** (`src/components/map/cafe-info-window.tsx`)
   - Popup when marker clicked
   - Show cafe name, address, overall rating
   - "View Details" link to /cafes/[slug]
   - Close button
   - Custom styling with Tailwind

4. **Create MapWithFilters component** (`src/components/map/map-with-filters.tsx`)
   - Split layout: sidebar (filters) + main (map)
   - Responsive: sidebar collapsible on mobile
   - Pass filters to CafeMap
   - Handle mobile filter drawer

5. **Create /map page** (`src/app/map/page.tsx`)
   - Server component (async)
   - Fetch all cafes with ratings from Supabase
   - Use dynamic import with ssr: false for map
   - Pass cafes to client component
   - Include Header with user

6. **Create CafeMapWrapper** (`src/components/map/cafe-map-wrapper.tsx`)
   - Client component bridge
   - Wrap MapProvider around MapWithFilters
   - Handle hydration safely

### Verification
- [ ] Map renders with Kakao tiles
- [ ] All cafes appear as markers
- [ ] Clustering works (zoom out to test)
- [ ] Clicking marker shows info window
- [ ] Filters hide/show markers instantly
- [ ] Info window link navigates to cafe
- [ ] Mobile responsive layout works

---

## Plan 06-05: Static Map Integration

### Goal
Add non-interactive static maps to cafe profile pages.

### Tasks

1. **Create CafeStaticMap component** (`src/components/map/cafe-static-map.tsx`)
   - Use StaticMap from react-kakao-maps-sdk
   - Props: cafe, width, height
   - Center on cafe coordinates
   - Show marker at cafe location
   - Disable dragging and zooming
   - Level 3 (street level)

2. **Update cafe detail page** (`src/components/cafe-detail/cafe-detail-content.tsx`)
   - Replace placeholder map div (lines 271-275)
   - Import CafeStaticMap and MapProvider
   - Wrap MapProvider around CafeStaticMap
   - Set appropriate height (200px)
   - Ensure it renders in sidebar

3. **Update transformCafe function** (`src/lib/supabase/transforms.ts`)
   - Ensure ratings are included in CafeSummary transformation
   - Map database rating fields to CafeSummary.ratings

### Verification
- [ ] Static map renders on cafe detail page
- [ ] Map shows correct cafe location
- [ ] Marker is visible at center
- [ ] Map is not interactive (can't drag/zoom)
- [ ] Works for all cafe detail pages

---

## Plan 06-06: Polish & Testing

### Goal
Final polish, mobile optimization, and comprehensive testing.

### Tasks

1. **Mobile responsive improvements**
   - Filter sidebar becomes drawer on mobile (< md breakpoint)
   - Add floating filter button on mobile
   - Full-screen map on mobile
   - Swipe to open/close filters

2. **Loading states**
   - Map skeleton while script loads
   - Smooth transitions when filters change
   - Loading indicator when fetching cafes

3. **Error handling**
   - Graceful error if Kakao API fails
   - Fallback message if no cafes match filters
   - Retry button for failed script load

4. **Keyboard navigation**
   - Tab through filter controls
   - Enter to select cafe from marker
   - ESC to close info window

5. **Performance optimization**
   - Verify useMemo prevents unnecessary re-renders
   - Check marker clustering performance with many cafes
   - Lazy load map component

6. **Final testing checklist**
   - [ ] All 9 rating dimensions can be filtered
   - [ ] Boolean features work (wifi, parking, etc.)
   - [ ] Multiple filters combine correctly (AND logic)
   - [ ] Clear filters restores all markers
   - [ ] Clustering updates when filters change
   - [ ] Info window opens/closes correctly
   - [ ] Navigation to cafe detail works
   - [ ] Static map on detail page works
   - [ ] Mobile layout is usable
   - [ ] All translations present

### Verification
- [ ] Lighthouse performance score > 80
- [ ] No console errors
- [ ] All user flows tested
- [ ] Mobile testing complete

---

## Success Criteria

When Phase 6 is complete, the following must be TRUE:

1. ✅ User can navigate to `/map` and see all cafes on an interactive map
2. ✅ Map shows cafe markers clustered at zoomed-out levels
3. ✅ User can filter by any rating dimension (seating, wifi, etc.)
4. ✅ Cafes below filter threshold disappear from map immediately
5. ✅ Clicking a marker shows cafe info with link to detail page
6. ✅ Cafe detail pages show static map focused on that cafe
7. ✅ Filters work on mobile with responsive layout
8. ✅ All text is translated (EN, KO, FR, ZH, VI)
9. ✅ Map loads without errors, handles missing API key gracefully

---

## Integration Points

### With Existing Code
- **Header** - Already has link to `/map` route (ROUTES.MAP)
- **CafeSummary type** - Needs `ratings` field added
- **transformCafe** - Needs to include ratings in transformation
- **search-filters.tsx** - Share filter UI patterns if possible
- **i18n system** - Add map-related translation keys

### Data Requirements
- **Supabase query** - Must select `ratings` JSONB field
- **Cafe data** - All active cafes with lat/lng and ratings
- **No new tables** - Uses existing cafes table

### Environment Variables
```bash
NEXT_PUBLIC_KAKAO_MAPS_API_KEY=your_kakao_javascript_key
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Kakao API key not available | HIGH | Document setup process, provide fallback message |
| Cafe data missing ratings | HIGH | Update CafeSummary type, ensure data migration |
| Too many cafes (>1000) | MEDIUM | Implement server-side filtering later |
| Mobile performance issues | MEDIUM | Use clustering, lazy loading, optimize re-renders |
| i18n incomplete | LOW | Use existing translation system, add keys incrementally |

---

## Notes for Planner

1. **Order matters:** Must complete type updates before building components
2. **Testing:** Each plan should be verified before moving to next
3. **Mobile first:** Test on mobile viewport throughout implementation
4. **Kakao key:** User needs to provide API key from Kakao Developers Console
5. **Client-side only:** Map components must use 'use client' + dynamic import

---

## Post-Phase Considerations

Future enhancements (out of scope for this phase):
- Search by location/address (using Kakao geocoding)
- User location detection and "nearby" filter
- Save map view state (zoom, center, filters)
- Share map with specific filters applied
- Heatmap view for cafe density
- Directions to cafe (Kakao navigation)
