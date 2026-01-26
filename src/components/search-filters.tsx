'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SEOUL_DISTRICTS } from '@/lib/constants/districts';
import { CAFE_TYPE_LABELS, type CafeType, getLocalizedText } from '@/types/cafe';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  className?: string;
}

const FEATURE_FILTERS = [
  { key: 'hasWifi', labelKey: 'filter.wifi' },
  { key: 'hasOutlets', labelKey: 'filter.outlets' },
  { key: 'isPetFriendly', labelKey: 'filter.pet' },
  { key: 'isLaptopFriendly', labelKey: 'filter.laptop' },
  { key: 'hasParking', labelKey: 'filter.parking' },
  { key: 'hasOutdoorSeating', labelKey: 'filter.outdoor' },
] as const;

const PRICE_RANGES = [
  { value: '1', label: '₩' },
  { value: '2', label: '₩₩' },
  { value: '3', label: '₩₩₩' },
  { value: '4', label: '₩₩₩₩' },
] as const;

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

  const toggleFeature = useCallback(
    (key: string) => {
      const current = searchParams.get(key);
      updateParams(key, current === 'true' ? null : 'true');
    },
    [searchParams, updateParams]
  );

  const clearFilters = useCallback(() => {
    router.push('?');
  }, [router]);

  const hasActiveFilters =
    searchParams.get('district') ||
    searchParams.get('cafeType') ||
    searchParams.get('priceRange') ||
    FEATURE_FILTERS.some((f) => searchParams.get(f.key) === 'true');

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
          <SelectTrigger className="w-[140px]">
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
          <SelectTrigger className="w-[140px]">
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
          <SelectTrigger className="w-[140px]">
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

      {/* Feature badges */}
      <div className="flex flex-wrap gap-2">
        {FEATURE_FILTERS.map((feature) => {
          const isActive = searchParams.get(feature.key) === 'true';
          return (
            <Badge
              key={feature.key}
              variant={isActive ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleFeature(feature.key)}
            >
              {t(feature.labelKey)}
            </Badge>
          );
        })}

        {/* Price range badges */}
        {PRICE_RANGES.map((price) => {
          const currentPrices = searchParams.get('priceRange')?.split(',') || [];
          const isActive = currentPrices.includes(price.value);
          return (
            <Badge
              key={price.value}
              variant={isActive ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                const newPrices = isActive
                  ? currentPrices.filter((p) => p !== price.value)
                  : [...currentPrices, price.value];
                updateParams('priceRange', newPrices.length > 0 ? newPrices.join(',') : null);
              }}
            >
              {price.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
