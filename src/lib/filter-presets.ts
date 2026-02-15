import type { MapFilters, FilterPreset } from '@/types/map';
import type { UserVibe } from '@/types/vibes';

/**
 * Predefined filter presets for common cafe vibe scenarios.
 *
 * Dimension mappings (from RESEARCH.md):
 * - "max_noise: 2" -> quietnessMin: 4 (inverse scale)
 * - "power_outlets" -> hasPowerOutlets: true
 * - WiFi presence covered by hasWifi boolean
 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'work_study',
    labelKey: 'map.presets.workStudy',
    icon: 'Laptop',
    filters: {
      serviceMin: 4,
      quietnessMin: 4,
      comfortMin: 4,
      hasWifi: true,
      hasPowerOutlets: true,
      isLaptopFriendly: true,
    },
  },
  {
    id: 'aesthetic_date',
    labelKey: 'map.presets.aestheticDate',
    icon: 'Heart',
    filters: {
      aestheticMin: 5,
      drinksMin: 4,
      comfortMin: 4,
    },
  },
  {
    id: 'quick_stop',
    labelKey: 'map.presets.quickStop',
    icon: 'Zap',
    filters: {
      priceValueMin: 4,
      foodMin: 3,
    },
  },
];

/**
 * Default filter values (matches use-map-filters.ts DEFAULT_FILTERS).
 * Defined inline to avoid circular dependency.
 */
const DEFAULT_FILTER_VALUES: MapFilters = {
  seatingMin: null,
  serviceMin: null,
  foodMin: null,
  drinksMin: null,
  lightingMin: null,
  aestheticMin: null,
  quietnessMin: null,
  priceValueMin: null,
  comfortMin: null,
  hasWifi: false,
  hasPowerOutlets: false,
  isPetFriendly: false,
  isLaptopFriendly: false,
  hasParking: false,
  priceRange: [],
  cafeTypes: [],
  districts: [],
  openNow: false,
  showFavoritesOnly: false,
};

/**
 * Checks if currentFilters matches presetFilters exactly AND has no extra filters active.
 *
 * Returns true only when:
 * 1. All preset filter values match current filter values
 * 2. No additional filters are active beyond the preset
 *
 * "Extra filter active" means a filter key NOT in the preset has a non-default value.
 *
 * @param currentFilters - Current filter state
 * @param presetFilters - Preset's filter configuration
 * @returns true if current filters exactly match preset with no extras
 */
export function matchesPreset(
  currentFilters: MapFilters,
  presetFilters: Partial<MapFilters>
): boolean {
  // Step 1: Check all preset filters match
  for (const key in presetFilters) {
    const presetKey = key as keyof MapFilters;
    const presetValue = presetFilters[presetKey];
    const currentValue = currentFilters[presetKey];

    // Array comparison (priceRange, cafeTypes, districts)
    if (Array.isArray(presetValue)) {
      if (!Array.isArray(currentValue)) return false;
      if (presetValue.length !== currentValue.length) return false;
      if (!presetValue.every((v, i) => v === currentValue[i])) return false;
      continue;
    }

    // Primitive comparison (number, boolean)
    if (presetValue !== currentValue) return false;
  }

  // Step 2: Check no extra filters are active (beyond preset)
  // Explicitly check ALL MapFilters keys except showFavoritesOnly
  const allFilterKeys: (keyof MapFilters)[] = [
    'seatingMin',
    'wifiMin',
    'foodMin',
    'drinksMin',
    'lightingMin',
    'outletsMin',
    'quietnessMin',
    'priceValueMin',
    'comfortMin',
    'hasWifi',
    'hasPowerOutlets',
    'isPetFriendly',
    'isLaptopFriendly',
    'hasParking',
    'priceRange',
    'cafeTypes',
    'districts',
    'openNow',
  ];

  for (const key of allFilterKeys) {
    // Skip keys that are part of the preset
    if (key in presetFilters) continue;

    const currentValue = currentFilters[key];
    const defaultValue = DEFAULT_FILTER_VALUES[key];

    // Check if this extra filter is active (differs from default)
    if (Array.isArray(currentValue)) {
      // Arrays: active when length > 0
      if (currentValue.length > 0) return false;
    } else if (typeof currentValue === 'number') {
      // Numbers: active when not null and > 0
      if (currentValue !== null && currentValue > 0) return false;
    } else if (typeof currentValue === 'boolean') {
      // Booleans: active when true
      if (currentValue === true) return false;
    } else {
      // Null check for rating dimensions
      if (currentValue !== defaultValue) return false;
    }
  }

  return true;
}

/**
 * Returns the first matching preset, or null if no match.
 *
 * @param filters - Current filter state
 * @returns Matching FilterPreset or null
 */
export function getMatchedPreset(filters: MapFilters): FilterPreset | null {
  for (const preset of FILTER_PRESETS) {
    if (matchesPreset(filters, preset.filters)) {
      return preset;
    }
  }
  return null;
}

/**
 * Like getMatchedPreset but searches a dynamic preset list.
 */
export function getMatchedPresetFromList(
  filters: MapFilters,
  presets: FilterPreset[]
): FilterPreset | null {
  for (const preset of presets) {
    if (matchesPreset(filters, preset.filters)) {
      return preset;
    }
  }
  return null;
}

/**
 * Converts user vibes to FilterPreset[].
 * All vibes are treated equally - no distinction between seeded defaults and custom.
 * Falls back to FILTER_PRESETS if no user vibes exist.
 */
export function mergePresetsWithUserVibes(
  userVibes: UserVibe[]
): FilterPreset[] {
  if (userVibes.length === 0) return FILTER_PRESETS;

  return userVibes.map((vibe) => ({
    id: `vibe_${vibe.id}`,
    labelKey: vibe.name,
    icon: vibe.icon,
    filters: vibe.filters,
    isUserVibe: true,
    userVibeId: vibe.id,
  }));
}
