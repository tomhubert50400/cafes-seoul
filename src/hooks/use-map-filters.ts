'use client';

import { useState, useCallback, useMemo } from 'react';
import type { MapFilters } from '@/types/map';
import { hasActiveFilters, getActiveFilterCount } from '@/lib/utils/filter-cafes';

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

  return {
    filters,
    updateFilter,
    clearFilters,
    clearFilter,
    hasActiveFilters: hasActive,
    activeFilterCount: activeCount,
  };
}
