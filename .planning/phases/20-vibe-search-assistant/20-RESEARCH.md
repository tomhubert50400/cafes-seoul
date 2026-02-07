# Phase 20: Vibe Search Assistant - Research

**Researched:** 2026-02-07
**Domain:** Filter preset system with visual feedback UI
**Confidence:** HIGH

## Summary

Vibe Search Assistant is a smart filter preset system that applies predefined filter combinations to help users quickly find cafes matching common use cases. This phase requires three main technical components: (1) a preset definition system mapping semantic "vibes" to filter state, (2) a horizontal scrollable badge UI with accessibility compliance, and (3) a state-matching algorithm to provide visual feedback when current filters align with a known preset.

The standard approach uses React state management patterns with controlled components, Tailwind CSS scroll-snap utilities for horizontal scrolling, and deep equality comparison for preset matching. The codebase already uses React hooks (`useState`) for filter state without Zustand, so preset application should integrate directly with the existing `useMapFilters()` hook pattern.

Key challenges include: (1) mapping user's semantic preset dimensions to actual filter fields, (2) implementing accessible horizontal scroll with 44px touch targets, and (3) efficiently detecting when manually-adjusted filters match a preset without causing performance issues.

**Primary recommendation:** Extend the existing `useMapFilters()` hook with an `applyPreset()` function and create a `PresetBadges` component using Tailwind's `snap-x` scroll utilities. Use shallow field comparison (not deep object equality) for preset matching since filter values are primitives and arrays.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | State management via hooks | Project already uses useState pattern for filters |
| Tailwind CSS | 4.x | Styling + scroll-snap utilities | Built-in scroll snap, no additional libraries needed |
| class-variance-authority | 0.7.1 | Component variants | Already used for button variants, same pattern for badges |
| lucide-react | 0.563.0 | Icons for preset badges | Consistent with existing icon usage |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx / cn utility | 2.1.1 | Conditional classes | Combining preset active states with base styles |
| @radix-ui/react-slot | 1.2.4 | Composable components | If badges need asChild pattern like Button |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useState | Zustand | Zustand is installed but unused - introducing it just for presets adds complexity without benefit since filters are already local component state |
| Tailwind scroll-snap | Custom JS scroll | Tailwind's native utilities are performant, accessible, and zero-JS - no reason to hand-roll |
| Shallow comparison | react-fast-compare | Overkill for this use case - filter values are primitives/arrays, not nested objects |

**Installation:**
No new dependencies required. All necessary libraries already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/map/
│   ├── preset-badges.tsx           # Horizontal scrollable badge bar
│   ├── preset-badge.tsx            # Individual badge component (optional)
│   └── map-filters.tsx             # Updated to include presets above filters
├── hooks/
│   └── use-map-filters.ts          # Extended with applyPreset() and matchedPreset computed value
├── lib/
│   └── filter-presets.ts           # Preset definitions and matching logic
└── types/
    └── map.ts                      # FilterPreset type definition
```

### Pattern 1: Preset Definition System
**What:** Centralized preset configurations mapping semantic names to filter state
**When to use:** Always - keeps presets DRY and type-safe
**Example:**
```typescript
// lib/filter-presets.ts
export interface FilterPreset {
  id: string;
  labelKey: string; // i18n key like 'map.presets.workStudy'
  icon?: LucideIcon;
  filters: Partial<MapFilters>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'work_study',
    labelKey: 'map.presets.workStudy',
    filters: {
      wifiMin: 4,
      quietnessMin: 4, // "max_noise: 2" maps to quietnessMin: 4 (inverse scale)
      comfortMin: 4,
      hasPowerOutlets: true,
    },
  },
  {
    id: 'aesthetic_date',
    labelKey: 'map.presets.aestheticDate',
    filters: {
      lightingMin: 5, // "aesthetic" maps to lighting (closest match)
      drinksMin: 4,
      // isPetFriendly: not set (means "any")
    },
  },
  {
    id: 'quick_stop',
    labelKey: 'map.presets.quickStop',
    filters: {
      priceValueMin: 4,
      // quietnessMin: not set (max_noise: 5 means "any noise level OK")
    },
  },
];
```

### Pattern 2: Extending useMapFilters Hook
**What:** Add preset application and matching to existing filter hook
**When to use:** This phase - keeps filter logic centralized
**Example:**
```typescript
// hooks/use-map-filters.ts
export function useMapFilters() {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);

  // Existing functions...

  const applyPreset = useCallback((presetId: string) => {
    const preset = FILTER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    // Merge preset filters with current state
    // Reset to defaults first to clear any conflicting filters
    setFilters(prev => ({
      ...DEFAULT_FILTERS,
      ...preset.filters,
    }));
  }, []);

  const matchedPreset = useMemo(() => {
    return FILTER_PRESETS.find(preset =>
      matchesPreset(filters, preset.filters)
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    clearFilter,
    applyPreset,       // NEW
    matchedPreset,     // NEW
    hasActiveFilters,
    activeFilterCount,
  };
}
```

### Pattern 3: Horizontal Scrollable Badge Bar
**What:** Accessible scroll container with snap points and 44px touch targets
**When to use:** This phase - for preset selection UI
**Example:**
```typescript
// components/map/preset-badges.tsx
export function PresetBadges({
  onPresetSelect,
  matchedPresetId
}: PresetBadgesProps) {
  return (
    <div className="w-full overflow-x-auto">
      {/* Outer wrapper for overflow */}
      <div className="flex gap-2 snap-x snap-mandatory overflow-x-auto pb-2 px-4">
        {FILTER_PRESETS.map((preset) => {
          const isActive = matchedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onPresetSelect(preset.id)}
              className={cn(
                // Base styles
                "flex items-center gap-2 shrink-0 snap-start",
                "min-h-[44px] px-4 py-2 rounded-full",
                "border-2 font-medium text-sm transition-all",
                // Active state
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/50"
              )}
            >
              {preset.icon && <preset.icon className="h-4 w-4" />}
              {t(preset.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### Pattern 4: Preset Matching Logic
**What:** Compare current filters against preset filters to detect matches
**When to use:** In useMemo to compute matchedPreset reactively
**Example:**
```typescript
// lib/filter-presets.ts
export function matchesPreset(
  currentFilters: MapFilters,
  presetFilters: Partial<MapFilters>
): boolean {
  // Check each preset filter field
  for (const [key, presetValue] of Object.entries(presetFilters)) {
    const currentValue = currentFilters[key as keyof MapFilters];

    // Handle arrays (priceRange, cafeTypes, districts)
    if (Array.isArray(presetValue)) {
      if (!Array.isArray(currentValue)) return false;
      if (presetValue.length !== currentValue.length) return false;
      if (!presetValue.every((v, i) => v === currentValue[i])) return false;
      continue;
    }

    // Handle primitives (numbers, booleans)
    if (currentValue !== presetValue) return false;
  }

  // All preset fields match - but also check no extra filters are active
  // that would make this NOT match the preset
  const presetKeys = new Set(Object.keys(presetFilters));
  for (const [key, value] of Object.entries(currentFilters)) {
    // Skip keys that are in the preset
    if (presetKeys.has(key)) continue;

    // Check if this filter is "active" but not in preset
    if (Array.isArray(value) && value.length > 0) return false;
    if (typeof value === 'number' && value > 0) return false;
    if (typeof value === 'boolean' && value === true) return false;
  }

  return true;
}
```

### Anti-Patterns to Avoid
- **Deep cloning on every preset application:** Use spread syntax, not JSON.parse(JSON.stringify())
- **Hardcoding labels in components:** Use i18n keys for all preset text
- **Full filter reset on preset selection:** Preserve non-conflicting filters if user has made selections
- **Imperative scroll management:** Let CSS scroll-snap handle it, don't use refs and scrollTo()

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal scroll with snap | Custom scroll logic with refs, scrollTo(), event listeners | Tailwind `snap-x snap-mandatory` + `snap-start` on children | CSS scroll-snap is native, performant, handles touch/mouse/keyboard automatically |
| Deep object comparison | Custom recursive comparison function | Shallow field-by-field comparison for this use case | Filter values are primitives/simple arrays - no nested objects to compare |
| Badge component variants | Inline conditional classes | class-variance-authority pattern (already used for Button) | Consistent with codebase patterns, type-safe variants |
| Preset to filter mapping | Switch statement in component | Centralized FILTER_PRESETS configuration | Single source of truth, easier to add/modify presets |

**Key insight:** This is a UI coordination problem, not a complex state management problem. Don't reach for heavy abstractions (Zustand, Redux) or custom implementations (scroll libraries, comparison utilities) when standard React patterns and Tailwind utilities solve it cleanly.

## Common Pitfalls

### Pitfall 1: Partial Preset Matches Causing Flickering UI
**What goes wrong:** User selects preset (badge highlights), then adjusts one slider. Badge stays highlighted even though filters no longer match the preset exactly.
**Why it happens:** Matching logic only checks if preset fields are set, not if OTHER fields are also active.
**How to avoid:** The matching function must check both: (1) all preset fields match current state, AND (2) no additional filters are active beyond what the preset defines.
**Warning signs:** Badge stays highlighted when user manually changes a filter value after selecting a preset.

### Pitfall 2: Semantic Dimension Mismatch
**What goes wrong:** User's preset spec uses dimensions that don't exist in the codebase (e.g., "aesthetic", "service", "noise").
**Why it happens:** Product requirements use user-facing terms, codebase uses technical field names.
**How to avoid:** Create explicit mapping documentation and validate mappings:
- `min_aesthetic: 5` → `lightingMin: 5` (closest match - ambiance isn't filterable)
- `max_noise: 2` → `quietnessMin: 4` (inverse scale: 0-5, where low noise = high quietness)
- `min_service: 3` → No mapping exists - omit from preset or use `comfortMin` as proxy
- `power_outlets: true` → `hasPowerOutlets: true` (exact match)
**Warning signs:** Presets don't produce expected filter behavior. Users report "work/study" preset doesn't filter correctly.

### Pitfall 3: 44px Touch Target Violations on Narrow Screens
**What goes wrong:** On mobile, cramming too many badges with icons + text causes them to shrink below 44px height.
**Why it happens:** `snap-start` children with `shrink-0` prevent wrapping, but content can still overflow.
**How to avoid:**
- Use `min-h-[44px]` not just `h-[44px]`
- Add adequate `px-4` horizontal padding
- Test with longest translated text (French tends to be longer than English)
- Consider icon-only badges on very narrow screens with `aria-label`
**Warning signs:** Badges appear squished on iPhone SE viewport (375px width).

### Pitfall 4: Translation Keys Not Added to All Languages
**What goes wrong:** Badge shows "map.presets.workStudy" instead of translated text in French/Korean/etc.
**Why it happens:** Presets are new feature - translations only added to English.
**How to avoid:** Add translation keys to ALL language files in translations.ts:
```typescript
'map.presets.workStudy': 'Work & Study',
'map.presets.aestheticDate': 'Date / Aesthetic',
'map.presets.quickStop': 'Quick Stop',
```
For all 5 languages: ko, en, fr, zh, vi.
**Warning signs:** Fallback to English text appearing on Korean/French site.

### Pitfall 5: Race Condition Between User Clicks and Matching Computation
**What goes wrong:** User rapidly clicks presets, but matchedPreset computation lags, causing wrong badge to highlight.
**Why it happens:** useMemo dependencies don't update synchronously with state changes.
**How to avoid:** React 19's automatic batching handles this - but ensure matchedPreset uses the SAME filters state that's passed to PresetBadges. Don't derive filters in the component separately.
**Warning signs:** Incorrect badge highlighted momentarily when clicking through presets quickly.

## Code Examples

### Preset Badge Component with Variants
```typescript
// components/map/preset-badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // Base styles - WCAG AAA touch target
  "flex items-center gap-2 shrink-0 snap-start min-h-[44px] px-4 py-2 rounded-full border-2 font-medium text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      active: {
        true: "border-primary bg-primary text-primary-foreground",
        false: "border-border bg-background hover:border-primary/50 hover:bg-accent",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

interface PresetBadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

export function PresetBadge({ label, icon: Icon, active, onClick }: PresetBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(badgeVariants({ active }))}
      aria-pressed={active}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}
```

### Horizontal Scroll Container with Snap Points
```typescript
// Tailwind classes for scroll container
<div className="w-full overflow-x-auto scrollbar-hide">
  <div className="flex gap-2 snap-x snap-mandatory pb-2 px-4 min-w-min">
    {/* snap-start on children */}
  </div>
</div>
```

### Adding Presets to MapFilters Component
```typescript
// components/map/map-filters.tsx
export function MapFiltersPanel({ ... }) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Preset Badges - ABOVE existing filters */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-4">
          {t('map.filters.presets')}
        </h3>
        <PresetBadges
          onPresetSelect={applyPreset}
          matchedPresetId={matchedPreset?.id}
        />
      </div>

      {/* Existing header, favorites toggle, rating sliders, etc. */}
      <div className="p-4">
        {/* ... existing filter UI ... */}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard-coded filter combinations | Preset configuration system | 2020+ | Easier to add/modify presets without code changes |
| Custom scroll libraries (react-scroll-horizontal) | Native CSS scroll-snap | 2021+ (CSS Scroll Snap Level 1) | Zero JS, better performance, native accessibility |
| Deep object equality with lodash | Shallow field comparison | Always for simple objects | No dependency needed, faster, sufficient for primitive values |
| Props drilling for filter state | Context or Zustand for global state | N/A for this app | Filters are page-scoped, not global - useState is correct choice |

**Deprecated/outdated:**
- **react-fast-compare for filter matching:** Overkill when filter values are primitives and simple arrays
- **Custom imperative scroll logic:** CSS scroll-snap handles touch, mouse, keyboard automatically
- **Introducing Zustand just for presets:** Adds complexity when filters are already local state with no cross-page sharing needs

## Open Questions

1. **Exact "aesthetic" dimension mapping**
   - What we know: User spec says `min_aesthetic: 5` but no `aesthetic` field exists in MapFilters
   - What's unclear: Should this map to `lightingMin` (current choice), or should we add a new `ambiance` filter dimension?
   - Recommendation: Use `lightingMin: 5` for MVP. RATING_DIMENSIONS in cafe.ts includes "ambiance" as a rating category, but it's not exposed as a filter. Could be future enhancement.

2. **"Service" dimension mapping**
   - What we know: `min_service: 3` in quick_stop preset, but no service filter exists
   - What's unclear: Is this a mistake in the spec, or should we add service as a filter?
   - Recommendation: Omit from preset for now. "Quick stop" focuses on value and low noise requirements - service quality may not be critical for that use case.

3. **Preset order and priority**
   - What we know: Three presets defined, but no specified display order
   - What's unclear: Should they be ordered by popularity, use case frequency, or user preference?
   - Recommendation: Display in order provided (work_study, aesthetic_date, quick_stop). Add analytics later to optimize order based on actual usage.

4. **Multi-preset selection behavior**
   - What we know: Each preset applies a filter combination
   - What's unclear: Should clicking a second preset replace ALL filters, or merge with existing?
   - Recommendation: Replace (reset to defaults + apply new preset). This matches user mental model of "modes" - selecting "work & study" mode should clear any previous "date" settings.

## Sources

### Primary (HIGH confidence)
- **Codebase files examined:**
  - `src/hooks/use-map-filters.ts` - Current filter state management pattern
  - `src/types/map.ts` - MapFilters type definition and available filter dimensions
  - `src/lib/utils/filter-cafes.ts` - Filter application logic
  - `src/components/map/map-filters.tsx` - Existing filter UI structure
  - `src/components/ui/button.tsx` - CVA variant pattern used in codebase
  - `package.json` - React 19.2.3, Tailwind 4.x, CVA 0.7.1 versions confirmed
- [Tailwind CSS Scroll Snap Type Documentation](https://tailwindcss.com/docs/scroll-snap-type) - Official snap-x, snap-mandatory classes
- [Flowbite Badge Components](https://flowbite.com/docs/components/badge/) - Pill badge sizing and interactive state patterns

### Secondary (MEDIUM confidence)
- [MDN: React Interactivity & Filtering](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_interactivity_filtering_conditional_rendering) - Filter state lifting patterns
- [Preline UI: Tailwind Tabs Accessibility](https://preline.co/docs/tabs.html) - ARIA attributes for interactive pill components
- [react-fast-compare on GitHub](https://github.com/FormidableLabs/react-fast-compare) - Deep equality library (NOT recommended for this use case)

### Tertiary (LOW confidence)
- WebSearch results for "React filter preset system UI patterns" - General architectural guidance
- WebSearch results for "horizontal scrollable pill badges accessibility" - Touch target and truncation warnings

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies needed
- Architecture: HIGH - Codebase files examined directly, patterns verified against existing code
- Pitfalls: MEDIUM - Dimension mapping issues identified from spec vs. codebase analysis, other pitfalls from general React/Tailwind experience

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable domain, React/Tailwind patterns don't change rapidly)
