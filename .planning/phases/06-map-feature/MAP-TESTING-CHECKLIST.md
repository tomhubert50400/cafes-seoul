# Map Feature Testing Checklist

## Desktop (Chrome, Safari, Firefox)
- [ ] Map loads and shows Kakao tiles
- [ ] All cafes appear as markers
- [ ] Zoom out → markers cluster
- [ ] Zoom in → clusters break into individual markers
- [ ] Click marker → info window opens
- [ ] Click "View Details" → navigates to cafe page
- [ ] Click X or map → info window closes
- [ ] Filter sidebar visible
- [ ] Adjust seating slider → markers filter instantly
- [ ] Check "Has WiFi" → only wifi cafes remain
- [ ] Multiple filters combine (AND logic)
- [ ] Clear all → all markers restored
- [ ] Active filter count displayed correctly

## Mobile (iOS Safari, Chrome Android)
- [ ] Map loads and fills screen
- [ ] Filter button visible in top-left
- [ ] Tap filter button → drawer opens smoothly
- [ ] Filters work in drawer
- [ ] Close drawer → filters applied
- [ ] Tap marker → info window opens
- [ ] Info window readable (not too small)
- [ ] Can close info window
- [ ] Pinch to zoom works
- [ ] Pan/drag map works

## Static Maps (Cafe Detail Pages)
- [ ] Static map shows on all cafe pages
- [ ] Map centered on correct location
- [ ] Marker visible
- [ ] Map not interactive (can't zoom/drag)
- [ ] Address displayed below map

## Error Handling
- [ ] Remove API key → error state shows
- [ ] Error has "Try again" button
- [ ] Slow network → loading state visible

## Accessibility
- [ ] Tab through filter controls
- [ ] Keyboard can select markers (if supported)
- [ ] Screen reader announces filter changes

## Performance
- [ ] Map loads within 3 seconds
- [ ] Filter updates within 100ms
- [ ] No lag when panning/zooming with 100+ cafes
- [ ] Smooth clustering animations

## All 9 Rating Dimensions
Test filtering for each dimension:
- [ ] Seating (rating_seating)
- [ ] WiFi (rating_wifi)
- [ ] Food (rating_food)
- [ ] Drinks (rating_drinks)
- [ ] Ambiance (rating_ambiance)
- [ ] Outlets (rating_outlets)
- [ ] Noise (rating_noise)
- [ ] Value (rating_value)
- [ ] Temperature (rating_temperature)

## All 5 Boolean Features
- [ ] Has WiFi (has_wifi)
- [ ] Power Outlets (has_power_outlets)
- [ ] Pet Friendly (is_pet_friendly)
- [ ] Laptop Friendly (is_laptop_friendly)
- [ ] Parking (has_parking)

## Loading States
- [ ] Skeleton visible while map script loads
- [ ] Loading spinner on initial page load
- [ ] No layout shift during loading

## Edge Cases
- [ ] Empty filters → all cafes shown
- [ ] Extreme filter values → no results message (if applicable)
- [ ] Rapid filter changes → no crashes
- [ ] Map resize (window resize) → adjusts correctly
