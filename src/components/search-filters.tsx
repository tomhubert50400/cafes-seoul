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
import { CAFE_TYPE_LABELS, type CafeType } from '@/types/cafe';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  className?: string;
}

const FEATURE_FILTERS = [
  { key: 'hasWifi', label: 'WiFi', labelKo: '와이파이' },
  { key: 'hasOutlets', label: 'Outlets', labelKo: '콘센트' },
  { key: 'isPetFriendly', label: 'Pet', labelKo: '반려동물' },
  { key: 'isLaptopFriendly', label: 'Laptop', labelKo: '노트북' },
  { key: 'hasParking', label: 'Parking', labelKo: '주차' },
  { key: 'hasOutdoorSeating', label: 'Outdoor', labelKo: '야외석' },
] as const;

const PRICE_RANGES = [
  { value: '1', label: '₩' },
  { value: '2', label: '₩₩' },
  { value: '3', label: '₩₩₩' },
  { value: '4', label: '₩₩₩₩' },
] as const;

const SORT_OPTIONS = [
  { value: 'rating', label: '평점순' },
  { value: 'reviews', label: '리뷰 많은순' },
  { value: 'newest', label: '최신순' },
] as const;

export function SearchFilters({ className }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      // Reset to page 1 when filters change
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
          placeholder="카페 이름, 주소로 검색..."
          defaultValue={searchParams.get('q') || ''}
          onChange={(e) => {
            const value = e.target.value;
            // Debounce search
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
            <SelectValue placeholder="지역" />
          </SelectTrigger>
          <SelectContent>
            {SEOUL_DISTRICTS.map((district) => (
              <SelectItem key={district.slug} value={district.slug}>
                {district.nameKo}
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
            <SelectValue placeholder="카페 유형" />
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
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            필터 초기화
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
              {feature.labelKo}
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
