'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SEOUL_DISTRICTS } from '@/lib/constants/districts';
import { CAFE_TYPE_LABELS, getLocalizedText } from '@/types/cafe';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { FILTER_PRESETS } from '@/lib/filter-presets';
import { PresetBadges } from '@/components/map/preset-badges';

const BOOLEAN_FILTER_MAP: Record<string, string> = {
  hasWifi: 'hasWifi',
  hasPowerOutlets: 'hasOutlets',
  isPetFriendly: 'isPetFriendly',
  isLaptopFriendly: 'isLaptopFriendly',
  hasParking: 'hasParking',
};

interface SearchFiltersProps {
  className?: string;
}

export function SearchFilters({ className }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useI18n();

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

  const clearFilters = useCallback(() => {
    router.push('?');
  }, [router]);

  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = FILTER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const params = new URLSearchParams();

    for (const [filterKey, urlParam] of Object.entries(BOOLEAN_FILTER_MAP)) {
      if (preset.filters[filterKey as keyof typeof preset.filters] === true) {
        params.set(urlParam, 'true');
      }
    }

    // Preserve current sort preference
    const currentSort = searchParams.get('sortBy');
    if (currentSort) params.set('sortBy', currentSort);

    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const matchedPresetId = useMemo(() => {
    const currentBooleans: Record<string, boolean> = {};
    for (const [filterKey, urlParam] of Object.entries(BOOLEAN_FILTER_MAP)) {
      currentBooleans[filterKey] = searchParams.get(urlParam) === 'true';
    }

    const hasExtraFilters = !!(
      searchParams.get('district') ||
      searchParams.get('cafeType') ||
      searchParams.get('q')
    );
    if (hasExtraFilters) return null;

    for (const preset of FILTER_PRESETS) {
      const presetBooleanKeys = Object.keys(BOOLEAN_FILTER_MAP).filter(
        key => preset.filters[key as keyof typeof preset.filters] === true
      );

      if (presetBooleanKeys.length === 0) continue;

      const presetBooleansMatch = presetBooleanKeys.every(
        key => currentBooleans[key] === true
      );

      const extraBooleansOff = Object.keys(BOOLEAN_FILTER_MAP)
        .filter(key => !presetBooleanKeys.includes(key))
        .every(key => currentBooleans[key] === false);

      if (presetBooleansMatch && extraBooleansOff) {
        return preset.id;
      }
    }

    return null;
  }, [searchParams]);

  const hasActiveFilters =
    searchParams.get('district') ||
    searchParams.get('cafeType');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preset Badges */}
      <PresetBadges
        onPresetSelect={handlePresetSelect}
        matchedPresetId={matchedPresetId}
      />

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

        {/* Cafe Type */}
        <Select
          value={searchParams.get('cafeType') || ''}
          onValueChange={(value) => updateParams('cafeType', value || null)}
        >
          <SelectTrigger className="w-full min-w-[140px] sm:w-[140px]">
            <SelectValue placeholder={t('filter.cafeType')} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CAFE_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label.ko}
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

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t('filter.clearAll')}
          </Button>
        )}
      </div>

    </div>
  );
}
