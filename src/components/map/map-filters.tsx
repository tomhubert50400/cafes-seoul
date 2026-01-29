'use client';

import { Button } from '@/components/ui/button';
import { RatingSlider } from './rating-slider';
import { FeatureToggle } from './feature-toggle';
import { Wifi, Plug, Dog, Armchair, Car, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { MapFilters } from '@/types/map';

interface MapFiltersProps {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  onClear: () => void;
}

export function MapFiltersPanel({ filters, onChange, onClear }: MapFiltersProps) {
  const { t } = useI18n();

  const updateFilter = <K extends keyof MapFilters>(
    key: K,
    value: MapFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = 
    Object.values(filters).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'number') return value > 0;
      return value === true;
    });

  const activeCount = Object.values(filters).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return value > 0;
    return value === true;
  }).length;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('map.filters.title')}</h2>
          {activeCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {activeCount} {t('map.filters.active')}
            </p>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            {t('map.filters.clearAll')}
          </Button>
        )}
      </div>

      {/* Rating Filters */}
      <div className="space-y-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {t('map.filters.ratings')}
        </h3>

        <RatingSlider
          label={t('map.filters.seating')}
          value={filters.seatingMin ?? null}
          onChange={(value) => updateFilter('seatingMin', value)}
        />

        <RatingSlider
          label={t('map.filters.wifi')}
          value={filters.wifiMin ?? null}
          onChange={(value) => updateFilter('wifiMin', value)}
        />

        <RatingSlider
          label={t('map.filters.food')}
          value={filters.foodMin ?? null}
          onChange={(value) => updateFilter('foodMin', value)}
        />

        <RatingSlider
          label={t('map.filters.drinks')}
          value={filters.drinksMin ?? null}
          onChange={(value) => updateFilter('drinksMin', value)}
        />

        <RatingSlider
          label={t('map.filters.ambiance')}
          value={filters.ambianceMin ?? null}
          onChange={(value) => updateFilter('ambianceMin', value)}
        />

        <RatingSlider
          label={t('map.filters.outlets')}
          value={filters.outletsMin ?? null}
          onChange={(value) => updateFilter('outletsMin', value)}
        />

        <RatingSlider
          label={t('map.filters.noise')}
          value={filters.noiseMin ?? null}
          onChange={(value) => updateFilter('noiseMin', value)}
        />

        <RatingSlider
          label={t('map.filters.value')}
          value={filters.valueMin ?? null}
          onChange={(value) => updateFilter('valueMin', value)}
        />

        <RatingSlider
          label={t('map.filters.temperature')}
          value={filters.temperatureMin ?? null}
          onChange={(value) => updateFilter('temperatureMin', value)}
        />
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {t('map.filters.features')}
        </h3>

        <div className="space-y-3">
          <FeatureToggle
            icon={Wifi}
            label={t('map.filters.hasWifi')}
            checked={filters.hasWifi || false}
            onChange={(checked) => updateFilter('hasWifi', checked)}
          />

          <FeatureToggle
            icon={Plug}
            label={t('map.filters.hasPowerOutlets')}
            checked={filters.hasPowerOutlets || false}
            onChange={(checked) => updateFilter('hasPowerOutlets', checked)}
          />

          <FeatureToggle
            icon={Armchair}
            label={t('map.filters.isLaptopFriendly')}
            checked={filters.isLaptopFriendly || false}
            onChange={(checked) => updateFilter('isLaptopFriendly', checked)}
          />

          <FeatureToggle
            icon={Dog}
            label={t('map.filters.isPetFriendly')}
            checked={filters.isPetFriendly || false}
            onChange={(checked) => updateFilter('isPetFriendly', checked)}
          />

          <FeatureToggle
            icon={Car}
            label={t('map.filters.hasParking')}
            checked={filters.hasParking || false}
            onChange={(checked) => updateFilter('hasParking', checked)}
          />
        </div>
      </div>
    </div>
  );
}
