---
phase: 20
plan: 01
subsystem: map-filtering
tags: [presets, i18n, vibe-search, data-layer]
requires: [06-map-feature, 11-user-dashboard]
provides: [preset-definitions, preset-matching-logic, preset-translations]
affects: [20-02, 20-03]
tech-stack:
  added: []
  patterns: [preset-pattern, shallow-matching, extra-filter-detection]
decisions:
  - decision: Define DEFAULT_FILTER_VALUES inline to avoid circular dependency
    rationale: filter-presets.ts needs default values for matching but cannot import from use-map-filters.ts (circular)
    impact: Duplicate default definitions (acceptable for isolation)
  - decision: Skip showFavoritesOnly in extra-filter detection
    rationale: UI toggle unrelated to vibe filtering semantic
    impact: Users can combine presets with favorites filter
  - decision: Use shallow field comparison for preset matching
    rationale: MapFilters has flat structure, no nested objects
    impact: Fast matching, no deep comparison overhead
  - decision: Map aesthetic dimension to lightingMin filter
    rationale: No dedicated aesthetic filter exists, lighting is best proxy
    impact: Aesthetic presets focus on visual ambiance via lighting
key-files:
  created: [src/lib/filter-presets.ts]
  modified: [src/types/map.ts, src/lib/i18n/translations.ts]
metrics:
  duration: 3 minutes
  completed: 2026-02-07
---

# Phase 20 Plan 01: Preset Data Layer Summary

**One-liner:** FilterPreset type, 3 vibe presets (work/study, aesthetic/date, quick stop) with exact matching logic and i18n labels in 5 languages.

## What Was Built

Created the foundational data layer for vibe-based filter presets:

1. **Type definitions:**
   - `FilterPreset` interface in `src/types/map.ts` with id, labelKey, icon, filters fields
   - Supports partial MapFilters to define preset configurations

2. **Preset configurations:**
   - **work_study**: wifi≥4, quietness≥4, comfort≥4, power outlets, laptop friendly
   - **aesthetic_date**: lighting≥5, drinks≥4, comfort≥4
   - **quick_stop**: priceValue≥4, food≥3

3. **Matching logic:**
   - `matchesPreset()`: Shallow field comparison + extra-filter detection
   - Explicitly checks all MapFilters keys except `showFavoritesOnly`
   - Returns false when user modifies filters after preset selection
   - `getMatchedPreset()`: Finds first matching preset or null

4. **Internationalization:**
   - Added `map.presets.*` keys to all 5 languages (en, ko, fr, zh, vi)
   - Labels kept concise for pill badge display on mobile (375px)
   - Longest label: "Travail & Etude" (French, 16 chars)

## Dimension Mappings (from RESEARCH.md)

Research vibes mapped to filter dimensions:

| Research Dimension | MapFilters Key     | Notes                              |
| ------------------ | ------------------ | ---------------------------------- |
| aesthetic          | `lightingMin`      | No aesthetic filter exists         |
| max_noise: 2       | `quietnessMin: 4`  | Inverse scale (low noise = quiet)  |
| power_outlets      | `hasPowerOutlets`  | Boolean feature                    |
| laptop_friendly    | `isLaptopFriendly` | Added to work_study naturally      |
| service            | (omitted)          | No service filter exists           |

## Commits

- **4ae5fbb**: feat(20-01): create preset type and definitions with matching logic
  - Added FilterPreset interface to src/types/map.ts
  - Created src/lib/filter-presets.ts with FILTER_PRESETS, matchesPreset, getMatchedPreset
  - Avoided circular dependency with inline DEFAULT_FILTER_VALUES

- **883b074**: feat(20-01): add i18n translations for preset labels
  - Added map.presets.title, workStudy, aestheticDate, quickStop to all 5 languages
  - Labels concise enough for mobile pill badges

## Deviations from Plan

None - plan executed exactly as written.

## Key Technical Details

**Extra-filter detection algorithm:**

The matching logic explicitly enumerates all MapFilters keys to detect partial matches:

```typescript
const allFilterKeys = [
  'seatingMin', 'wifiMin', 'foodMin', 'drinksMin', 'lightingMin',
  'outletsMin', 'quietnessMin', 'priceValueMin', 'comfortMin',
  'hasWifi', 'hasPowerOutlets', 'isPetFriendly', 'isLaptopFriendly', 'hasParking',
  'priceRange', 'cafeTypes', 'districts'
];
```

For each key NOT in the preset:
- Arrays: active when `length > 0`
- Numbers: active when `!== null && > 0`
- Booleans: active when `=== true`

This prevents false positives where user adds filters beyond the preset.

**Circular dependency solution:**

`use-map-filters.ts` exports DEFAULT_FILTERS constant. `filter-presets.ts` needs these defaults for matching but cannot import (would create cycle). Solution: define DEFAULT_FILTER_VALUES inline in `filter-presets.ts`. Trade-off: duplication vs isolation.

## Verification Results

All verification passed:

- ✅ `npx tsc --noEmit` clean build
- ✅ `FILTER_PRESETS` exports 3 presets
- ✅ `matchesPreset` and `getMatchedPreset` exported
- ✅ `FilterPreset` interface exists in types/map.ts
- ✅ All 5 language blocks contain 4 map.presets.* keys
- ✅ No circular dependency warnings

## Next Phase Readiness

**Ready for 20-02 (Preset UI Component):**
- Preset definitions available via `FILTER_PRESETS` export
- `getMatchedPreset()` can identify when filters match a preset
- i18n keys ready for label rendering
- Icon strings ready for lucide-react resolution

**Ready for 20-03 (Preset Integration):**
- Type-safe preset application via `preset.filters`
- Matching logic enables visual feedback (active state)
- Extra-filter detection prevents false active states

No blockers for subsequent plans.
