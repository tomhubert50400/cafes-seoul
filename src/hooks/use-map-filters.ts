'use client';

import { useState, useCallback, useMemo } from 'react';
import type { MapFilters, FilterPreset } from '@/types/map';
import { hasActiveFilters, getActiveFilterCount } from '@/lib/utils/filter-cafes';
import { FILTER_PRESETS, getMatchedPreset } from '@/lib/filter-presets';

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
  showFavoritesOnly: false,
};

export function useMapFilters() {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);

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
    const preset = FILTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    // Reset to defaults first, then apply preset filters (replace behavior)
    setFilters({ ...DEFAULT_FILTERS, ...preset.filters });
  }, []);

  const matchedPreset = useMemo(
    () => getMatchedPreset(filters),
    [filters]
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
  };
}
