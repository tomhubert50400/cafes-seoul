import type { MapFilters, FilterPreset } from '@/types/map';
import type { UserVibe } from '@/types/vibes';

/**
 * Predefined filter presets for common cafe vibe scenarios.
 *
 * Dimension mappings (from RESEARCH.md):
 * - "aesthetic" -> lightingMin (no dedicated aesthetic filter)
 * - "max_noise: 2" -> quietnessMin: 4 (inverse scale)
 * - "power_outlets" -> hasPowerOutlets: true
 * - Service dimension omitted (no filter exists)
 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'work_study',
    labelKey: 'map.presets.workStudy',
    icon: 'Laptop',
    filters: {
      wifiMin: 4,
      quietnessMin: 4,
      comfortMin: 4,
      hasPowerOutlets: true,
      isLaptopFriendly: true,
    },
  },
  {
    id: 'aesthetic_date',
    labelKey: 'map.presets.aestheticDate',
    icon: 'Heart',
    filters: {
      lightingMin: 5,
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
  wifiMin: null,
  foodMin: null,
  drinksMin: null,
  lightingMin: null,
  outletsMin: null,
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
 * Merges the 3 built-in presets with user vibes.
 * - Default overrides replace the matching built-in preset
 * - Custom vibes are appended after the defaults
 */
export function mergePresetsWithUserVibes(
  userVibes: UserVibe[]
): FilterPreset[] {
  // Build a map of default overrides
  const overrides = new Map<string, UserVibe>();
  const customVibes: UserVibe[] = [];

  for (const vibe of userVibes) {
    if (vibe.defaultPresetId) {
      overrides.set(vibe.defaultPresetId, vibe);
    } else {
      customVibes.push(vibe);
    }
  }

  // Map built-in presets, applying overrides
  const merged: FilterPreset[] = FILTER_PRESETS.map((preset) => {
    const override = overrides.get(preset.id);
    if (override) {
      return {
        id: preset.id,
        labelKey: override.name,
        icon: override.icon,
        filters: override.filters,
        isUserVibe: true,
        isDefaultOverride: true,
        userVibeId: override.id,
      };
    }
    return preset;
  });

  // Append custom vibes
  for (const vibe of customVibes) {
    merged.push({
      id: `custom_${vibe.id}`,
      labelKey: vibe.name,
      icon: vibe.icon,
      filters: vibe.filters,
      isUserVibe: true,
      isDefaultOverride: false,
      userVibeId: vibe.id,
    });
  }

  return merged;
}
