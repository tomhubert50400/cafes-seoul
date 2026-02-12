'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Search, X, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MapFiltersPanel } from '@/components/map/map-filters';
import { SEOUL_DISTRICTS, POPULAR_NEIGHBORHOODS } from '@/lib/constants/districts';
import { getLocalizedText } from '@/types/cafe';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useMapFilters } from '@/hooks/use-map-filters';
import { useAuth } from '@/lib/auth';
import type { MapFilters } from '@/types/map';
import type { UserVibe } from '@/types/vibes';
import type { MetroStation } from '@/types/metro';

const BOOLEAN_FILTER_MAP: Record<string, string> = {
  hasWifi: 'hasWifi',
  hasPowerOutlets: 'hasOutlets',
  isPetFriendly: 'isPetFriendly',
  isLaptopFriendly: 'isLaptopFriendly',
  hasParking: 'hasParking',
  openNow: 'openNow',
  showFavoritesOnly: 'favoritesOnly',
};

const RATING_FILTER_KEYS: (keyof MapFilters)[] = [
  'seatingMin', 'wifiMin', 'foodMin', 'drinksMin', 'lightingMin',
  'outletsMin', 'quietnessMin', 'priceValueMin', 'comfortMin',
];

interface SearchFiltersProps {
  className?: string;
}

export function SearchFilters({ className }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [userVibes, setUserVibes] = useState<UserVibe[]>([]);
  const [selectedStation, setSelectedStation] = useState<MetroStation | null>(null);
  const {
    filters,
    updateFilter,
    clearFilters: clearMapFilters,
    applyPreset,
    matchedPreset,
    activeFilterCount,
    allPresets,
  } = useMapFilters(userVibes);

  useEffect(() => {
    import('@/lib/actions/vibes').then(({ getVibesAction }) => {
      getVibesAction().then((result) => {
        if (result.success && result.vibes) {
          setUserVibes(result.vibes);
        }
      });
    });
  }, []);

  // Sync URL params -> hook state on mount / URL change
  const isInitRef = useRef(false);
  useEffect(() => {
    const newFilters: Partial<MapFilters> = {};

    // Boolean filters
    for (const [filterKey, urlParam] of Object.entries(BOOLEAN_FILTER_MAP)) {
      const val = searchParams.get(urlParam) === 'true';
      if (val) newFilters[filterKey as keyof MapFilters] = true as never;
    }

    // Rating filters
    for (const key of RATING_FILTER_KEYS) {
      const val = searchParams.get(key as string);
      if (val) newFilters[key] = parseInt(val) as never;
    }

    // Apply all at once
    for (const [key, value] of Object.entries(newFilters)) {
      updateFilter(key as keyof MapFilters, value as MapFilters[keyof MapFilters]);
    }

    isInitRef.current = true;
  }, []); // Only on mount

  // Sync hook state -> URL params when filters change
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    if (!isInitRef.current) return;
    if (prevFiltersRef.current === filters) return;
    prevFiltersRef.current = filters;

    const params = new URLSearchParams(searchParams.toString());

    // Sync boolean filters
    for (const [filterKey, urlParam] of Object.entries(BOOLEAN_FILTER_MAP)) {
      const val = filters[filterKey as keyof MapFilters];
      if (val === true) {
        params.set(urlParam, 'true');
      } else {
        params.delete(urlParam);
      }
    }

    // Sync rating filters
    for (const key of RATING_FILTER_KEYS) {
      const val = filters[key] as number | null;
      if (val != null && val > 0) {
        params.set(key as string, String(val));
      } else {
        params.delete(key as string);
      }
    }

    params.delete('page');
    router.push(`?${params.toString()}`);
  }, [filters, router, searchParams]);

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete('page');
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    clearMapFilters();
    setLocationSearch('');
    router.push('?');
  }, [router, clearMapFilters]);

  const handleFilterChange = (newFilters: MapFilters) => {
    for (const key of Object.keys(newFilters) as (keyof MapFilters)[]) {
      if (JSON.stringify(newFilters[key]) !== JSON.stringify(filters[key])) {
        updateFilter(key, newFilters[key]);
      }
    }
  };

  // --- Location search state ---
  const [locationSearch, setLocationSearch] = useState('');
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const activeDistrict = searchParams.get('district') || null;
  const activeNeighborhood = searchParams.get('neighborhood') || null;
  const hasLocationFilter = !!activeDistrict || !!activeNeighborhood;

  // Resolve active location label for display
  const activeLocationLabel = useMemo(() => {
    if (activeNeighborhood) {
      const n = POPULAR_NEIGHBORHOODS.find((nb) => nb.slug === activeNeighborhood);
      return n ? getLocalizedText(n.name, language) : null;
    }
    if (activeDistrict) {
      const d = SEOUL_DISTRICTS.find((dt) => dt.slug === activeDistrict);
      return d ? getLocalizedText(d.name, language) : null;
    }
    return null;
  }, [activeDistrict, activeNeighborhood, language]);

  const matchingDistricts = useMemo(() => {
    if (!locationSearch.trim()) return [];
    const q = locationSearch.toLowerCase();
    return SEOUL_DISTRICTS.filter(
      (d) =>
        Object.values(d.name).some((v) => v.toLowerCase().includes(q)) ||
        d.slug.includes(q)
    );
  }, [locationSearch]);

  const matchingNeighborhoods = useMemo(() => {
    if (!locationSearch.trim()) return [];
    const q = locationSearch.toLowerCase();
    return POPULAR_NEIGHBORHOODS.filter(
      (n) =>
        Object.values(n.name).some((v) => v.toLowerCase().includes(q)) ||
        n.slug.includes(q)
    );
  }, [locationSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectLocation = useCallback(
    (type: 'district' | 'neighborhood', slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      if (type === 'neighborhood') {
        params.set('neighborhood', slug);
        params.delete('district');
      } else {
        params.set('district', slug);
        params.delete('neighborhood');
      }
      router.push(`?${params.toString()}`);
      setLocationSearch('');
      setLocationDropdownOpen(false);
    },
    [router, searchParams]
  );

  const clearLocation = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('district');
    params.delete('neighborhood');
    params.delete('page');
    router.push(`?${params.toString()}`);
    setLocationSearch('');
  }, [router, searchParams]);

  // Debounced search with proper timeout cleanup
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      updateParams('q', value || null);
    }, 500);
  }, [updateParams]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const hasActiveFilters =
    hasLocationFilter ||
    searchParams.get('cafeType') ||
    activeFilterCount > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          type="search"
          placeholder={t('filter.searchPlaceholder')}
          defaultValue={searchParams.get('q') || ''}
          onChange={handleSearchChange}
          className="flex-1"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Location search (district / neighborhood) */}
        <div ref={locationRef} className="relative w-full sm:w-auto sm:min-w-[220px]">
          {hasLocationFilter ? (
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm h-9 w-full sm:w-auto justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {activeLocationLabel}
              </span>
              <button
                onClick={clearLocation}
                className="ml-1 hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('roulette.searchDistrictOrArea')}
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    setLocationDropdownOpen(true);
                  }}
                  onFocus={() => setLocationDropdownOpen(true)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Dropdown */}
              {locationDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md max-h-[320px] overflow-y-auto">
                  {/* Search results */}
                  {locationSearch.trim() && (matchingNeighborhoods.length > 0 || matchingDistricts.length > 0) ? (
                    <div className="space-y-1">
                      {matchingNeighborhoods.map((n) => {
                        const parentDistrict = SEOUL_DISTRICTS.find((d) => d.id === n.districtId);
                        return (
                          <button
                            key={`n-${n.slug}`}
                            className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                            onClick={() => selectLocation('neighborhood', n.slug)}
                          >
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{getLocalizedText(n.name, language)}</span>
                            {parentDistrict && (
                              <span className="text-muted-foreground text-xs ml-auto">
                                {getLocalizedText(parentDistrict.name, language)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {matchingDistricts.map((d) => (
                        <button
                          key={`d-${d.slug}`}
                          className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                          onClick={() => selectLocation('district', d.slug)}
                        >
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{getLocalizedText(d.name, language)}</span>
                        </button>
                      ))}
                    </div>
                  ) : locationSearch.trim() ? (
                    <p className="text-sm text-muted-foreground px-2 py-1.5">{t('roulette.noResults')}</p>
                  ) : (
                    /* Popular areas */
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground px-2">{t('roulette.popularAreas')}</p>
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {(showAllAreas ? POPULAR_NEIGHBORHOODS : POPULAR_NEIGHBORHOODS.slice(0, 6)).map((n) => (
                          <Badge
                            key={n.slug}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent transition-colors py-1 px-2.5 text-xs"
                            onClick={() => selectLocation('neighborhood', n.slug)}
                          >
                            {getLocalizedText(n.name, language)}
                          </Badge>
                        ))}
                        <button
                          onClick={() => setShowAllAreas((prev) => !prev)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2"
                        >
                          {showAllAreas ? (
                            <>
                              {t('roulette.showLess')}
                              <ChevronUp className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              {t('roulette.showMore')}
                              <ChevronDown className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sort */}
        <Select
          value={searchParams.get('sortBy') || 'rating'}
          onValueChange={(value) => updateParams('sortBy', value)}
        >
          <SelectTrigger className="w-full min-w-[140px] sm:w-[140px]">
            <SelectValue placeholder={t('filter.sort')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">{t('sort.rating')}</SelectItem>
            <SelectItem value="reviews">{t('sort.reviews')}</SelectItem>
            <SelectItem value="newest">{t('sort.newest')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Adjust Filters Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 shrink-0 h-9">
              <SlidersHorizontal className="h-4 w-4" />
              <span>{t('roulette.adjustFilters')}</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[340px] sm:w-[400px] overflow-y-auto max-h-screen" aria-describedby={undefined}>
            <SheetTitle className="sr-only">{t('roulette.adjustFilters')}</SheetTitle>
            <MapFiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              onClear={clearAllFilters}
              isLoggedIn={!!user}
              applyPreset={applyPreset}
              matchedPresetId={matchedPreset?.id ?? null}
              presets={allPresets}
              className="min-[319px]:pl-8 min-[340px]:pl-4"
            />
          </SheetContent>
        </Sheet>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            {t('filter.clearAll')}
          </Button>
        )}
      </div>
    </div>
  );
}
