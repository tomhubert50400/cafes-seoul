'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
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
import { SEOUL_DISTRICTS } from '@/lib/constants/districts';
import { CAFE_TYPE_LABELS, getLocalizedText } from '@/types/cafe';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useMapFilters } from '@/hooks/use-map-filters';
import type { MapFilters } from '@/types/map';
import type { UserVibe } from '@/types/vibes';

const BOOLEAN_FILTER_MAP: Record<string, string> = {
  hasWifi: 'hasWifi',
  hasPowerOutlets: 'hasOutlets',
  isPetFriendly: 'isPetFriendly',
  isLaptopFriendly: 'isLaptopFriendly',
  hasParking: 'hasParking',
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
  const [userVibes, setUserVibes] = useState<UserVibe[]>([]);
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
    router.push('?');
  }, [router, clearMapFilters]);

  const handleFilterChange = (newFilters: MapFilters) => {
    for (const key of Object.keys(newFilters) as (keyof MapFilters)[]) {
      if (JSON.stringify(newFilters[key]) !== JSON.stringify(filters[key])) {
        updateFilter(key, newFilters[key]);
      }
    }
  };

  const hasActiveFilters =
    searchParams.get('district') ||
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
          onChange={(e) => {
            const value = e.target.value;
            const timeout = setTimeout(() => {
              updateParams('q', value || null);
            }, 300);
            return () => clearTimeout(timeout);
          }}
          className="flex-1"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* District */}
        <Select
          value={searchParams.get('district') || ''}
          onValueChange={(value) => updateParams('district', value || null)}
        >
          <SelectTrigger className="w-full min-w-[140px] sm:w-[140px]">
            <SelectValue placeholder={t('filter.district')} />
          </SelectTrigger>
          <SelectContent>
            {SEOUL_DISTRICTS.map((district) => (
              <SelectItem key={district.slug} value={district.slug}>
                {getLocalizedText(district.name, language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
              isLoggedIn={false}
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
