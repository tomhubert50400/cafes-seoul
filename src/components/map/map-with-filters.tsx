'use client';

import { useState, useCallback, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { MapFiltersPanel } from './map-filters';
import { CafeMap } from './cafe-map';
import { useMapFilters } from '@/hooks/use-map-filters';
import { useI18n } from '@/lib/i18n';
import type { CafeSummary } from '@/types/cafe';
import type { UserVibe } from '@/types/vibes';
import { fetchStations } from '@/lib/supabase/stations';
import type { MetroStation } from '@/types/metro';

interface MapWithFiltersProps {
  cafes: CafeSummary[];
  favoriteIds?: string[];
  isLoggedIn?: boolean;
  userId?: string;
  userVibes?: UserVibe[];
}

export function MapWithFilters({
  cafes,
  favoriteIds,
  isLoggedIn,
  userId,
  userVibes = [],
}: MapWithFiltersProps) {
  const { t } = useI18n();
  const { filters, updateFilter, clearFilters, applyPreset, matchedPreset, activeFilterCount, allPresets } = useMapFilters(userVibes);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<CafeSummary | null>(null);
  const [selectedStation, setSelectedStation] = useState<MetroStation | null>(null);
  const [allStations, setAllStations] = useState<MetroStation[]>([]);

  useEffect(() => {
    fetchStations().then(setAllStations);
  }, []);

  const handleCafeSelect = useCallback((cafe: CafeSummary | null) => {
    setSelectedCafe(cafe);
  }, []);

  return (
    <div className="flex h-full">
      {/* Desktop Filter Sidebar */}
      <aside className="hidden md:block w-80 border-r bg-background overflow-y-auto scrollbar-hide shrink-0">
        <MapFiltersPanel
          filters={filters}
          onChange={(newFilters) => {
            Object.entries(newFilters).forEach(([key, value]) => {
              updateFilter(key as keyof typeof filters, value);
            });
          }}
          onClear={clearFilters}
          applyPreset={applyPreset}
          matchedPresetId={matchedPreset?.id ?? null}
          presets={allPresets}
          isLoggedIn={isLoggedIn}
          favoritesCount={favoriteIds?.length ?? 0}
          selectedStation={selectedStation}
          onStationSelect={setSelectedStation}
          stations={allStations}
        />
      </aside>

      {/* Mobile Filter Button & Sheet */}
      <div className="md:hidden absolute top-[max(1rem,env(safe-area-inset-top,1rem))] left-4 z-50">
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" size="default" className="shadow-md min-h-[44px] min-w-[44px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {t('map.filters.title')}
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-[419px]:w-full min-[420px]:w-80 p-0 overflow-y-auto">
            <SheetTitle className="sr-only">{t('map.filters.title')}</SheetTitle>
            <MapFiltersPanel
              filters={filters}
              onChange={(newFilters) => {
                Object.entries(newFilters).forEach(([key, value]) => {
                  updateFilter(key as keyof typeof filters, value);
                });
              }}
              onClear={clearFilters}
              onClose={() => setMobileFiltersOpen(false)}
              applyPreset={applyPreset}
              matchedPresetId={matchedPreset?.id ?? null}
              presets={allPresets}
              isLoggedIn={isLoggedIn}
              favoritesCount={favoriteIds?.length ?? 0}
              selectedStation={selectedStation}
              onStationSelect={setSelectedStation}
              stations={allStations}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Map Area */}
      <main className="flex-1 relative z-0 min-h-0">
        <div className="absolute inset-0 z-0">
          <CafeMap
            cafes={cafes}
            filters={filters}
            selectedCafe={selectedCafe}
            onCafeSelect={handleCafeSelect}
            favoriteIds={favoriteIds}
            userId={userId}
            selectedStation={selectedStation}
          />
        </div>
      </main>
    </div>
  );
}
