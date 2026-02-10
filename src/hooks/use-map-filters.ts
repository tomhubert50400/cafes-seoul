'use client';

import { useState, useCallback, useMemo } from 'react';
import type { MapFilters, FilterPreset } from '@/types/map';
import type { UserVibe } from '@/types/vibes';
import { hasActiveFilters, getActiveFilterCount } from '@/lib/utils/filter-cafes';
import {
  FILTER_PRESETS,
  getMatchedPreset,
  getMatchedPresetFromList,
  mergePresetsWithUserVibes,
} from '@/lib/filter-presets';

const DEFAULT_FILTERS: MapFilters = {
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
  openNow: false,
  showFavoritesOnly: false,
};

export function useMapFilters(userVibes?: UserVibe[]) {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);

  const allPresets = useMemo<FilterPreset[]>(() => {
    if (!userVibes || userVibes.length === 0) return FILTER_PRESETS;
    return mergePresetsWithUserVibes(userVibes);
  }, [userVibes]);

  const updateFilter = useCallback(<K extends keyof MapFilters>(
    key: K,
    value: MapFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const clearFilter = useCallback(<K extends keyof MapFilters>(
    key: K
  ) => {
    setFilters((prev) => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
  }, []);

  const hasActive = useMemo(() => hasActiveFilters(filters), [filters]);
  const activeCount = useMemo(() => getActiveFilterCount(filters), [filters]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = allPresets.find((p) => p.id === presetId);
    if (!preset) return;

    setFilters((prev) => {
      const currentMatch = getMatchedPresetFromList(prev, allPresets);
      if (currentMatch?.id === presetId) return DEFAULT_FILTERS;
      return { ...DEFAULT_FILTERS, ...preset.filters };
    });
  }, [allPresets]);

  const matchedPreset = useMemo(
    () => getMatchedPresetFromList(filters, allPresets),
    [filters, allPresets]
  );

  return {
    filters,
    updateFilter,
    clearFilters,
    clearFilter,
    applyPreset,
    matchedPreset,
    hasActiveFilters: hasActive,
    activeFilterCount: activeCount,
    allPresets,
  };
}
