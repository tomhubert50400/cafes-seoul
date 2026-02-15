'use client';

import { Button } from '@/components/ui/button';
import { RatingSlider } from './rating-slider';
import { FeatureToggle } from './feature-toggle';
import { PresetBadges } from './preset-badges';
import { Wifi, Plug, Dog, Armchair, Car, X, Heart, Clock, TrainFront } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { StationSelector } from '@/components/filters/station-selector';
import { WalkingTimeSelector } from '@/components/filters/walking-time-selector';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { MapFilters, FilterPreset } from '@/types/map';
import type { MetroStation, WalkingMinutes } from '@/types/metro';

interface MapFiltersProps {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  onClear: () => void;
  onClose?: () => void;
  isLoggedIn?: boolean;
  favoritesCount?: number;
  applyPreset?: (presetId: string) => void;
  matchedPresetId?: string | null;
  presets?: FilterPreset[];
  className?: string;
  selectedStation?: MetroStation | null;
  onStationSelect?: (station: MetroStation | null) => void;
  stations?: MetroStation[];
}

export function MapFiltersPanel({
  filters,
  onChange,
  onClear,
  onClose,
  isLoggedIn = false,
  favoritesCount = 0,
  applyPreset,
  matchedPresetId,
  presets,
  className,
  selectedStation,
  onStationSelect,
  stations = [],
}: MapFiltersProps) {
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
    <div className={cn("space-y-6 p-4", className)}>
      {/* Preset Badges */}
      {applyPreset && (
        <PresetBadges
          onPresetSelect={applyPreset}
          matchedPresetId={matchedPresetId}
          presets={presets}
        />
      )}

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

      {/* Open Now Toggle */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock
              className={`h-4 w-4 ${filters.openNow
                ? 'text-green-500'
                : 'text-muted-foreground'
                }`}
            />
            <span className="text-sm font-medium">
              {t('map.filters.openNow')}
            </span>
          </div>
          <Switch
            checked={filters.openNow || false}
            onCheckedChange={(checked) =>
              updateFilter('openNow', checked)
            }
            aria-label={t('map.filters.openNow')}
          />
        </div>
      </div>

      {/* Favorites Toggle */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div
          className={`flex items-center justify-between ${!isLoggedIn ? 'cursor-not-allowed opacity-60' : ''
            }`}
          title={!isLoggedIn ? t('map.filters.favoritesOnlyTooltip') : undefined}
        >
          <div className="flex items-center gap-2">
            <Heart
              className={`h-4 w-4 ${filters.showFavoritesOnly
                ? 'fill-red-500 text-red-500'
                : 'text-muted-foreground'
                }`}
            />
            <span className="text-sm font-medium">
              {t('map.filters.favoritesOnly')}
            </span>
            {favoritesCount > 0 && (
              <span className="text-xs text-muted-foreground mr-1">
                ({favoritesCount})
              </span>
            )}
          </div>
          <Switch
            checked={filters.showFavoritesOnly || false}
            onCheckedChange={(checked) =>
              updateFilter('showFavoritesOnly', checked)
            }
            disabled={!isLoggedIn}
            aria-label={t('map.filters.favoritesOnly')}
          />
        </div>
        {!isLoggedIn && (
          <p className="text-xs text-muted-foreground mt-2">
            {t('map.filters.favoritesOnlyTooltip')}
          </p>
        )}
      </div>

      {/* Metro Station Filter */}
      {onStationSelect && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <TrainFront className="h-3.5 w-3.5" />
            {t('metro.metroStation')}
          </h3>
          <StationSelector
            selectedStation={selectedStation ?? null}
            stations={stations}
            onSelect={(station) => {
              onStationSelect(station);
              if (station) {
                onChange({ ...filters, stationId: station.id, districts: [] });
              } else {
                onChange({ ...filters, stationId: null });
              }
            }}
          />
          {selectedStation && (
            <WalkingTimeSelector
              value={(filters.walkingMinutes ?? 10) as WalkingMinutes}
              onChange={(minutes) => onChange({ ...filters, walkingMinutes: minutes })}
            />
          )}
        </div>
      )}

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
          label={t('map.filters.service')}
          value={filters.serviceMin ?? null}
          onChange={(value) => updateFilter('serviceMin', value)}
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
          label={t('map.filters.lighting')}
          value={filters.lightingMin ?? null}
          onChange={(value) => updateFilter('lightingMin', value)}
        />

        <RatingSlider
          label={t('map.filters.outlets')}
          value={filters.outletsMin ?? null}
          onChange={(value) => updateFilter('outletsMin', value)}
        />

        <RatingSlider
          label={t('map.filters.quietness')}
          value={filters.quietnessMin ?? null}
          onChange={(value) => updateFilter('quietnessMin', value)}
        />

        <RatingSlider
          label={t('map.filters.priceValue')}
          value={filters.priceValueMin ?? null}
          onChange={(value) => updateFilter('priceValueMin', value)}
        />

        <RatingSlider
          label={t('map.filters.comfort')}
          value={filters.comfortMin ?? null}
          onChange={(value) => updateFilter('comfortMin', value)}
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
