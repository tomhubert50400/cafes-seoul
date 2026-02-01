'use client';

import { useState, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { MapFiltersPanel } from './map-filters';
import { CafeMap } from './cafe-map';
import { useMapFilters } from '@/hooks/use-map-filters';
import { useI18n } from '@/lib/i18n';
import type { CafeSummary } from '@/types/cafe';

interface MapWithFiltersProps {
  cafes: CafeSummary[];
  favoriteIds?: string[];
  isLoggedIn?: boolean;
  userId?: string;
}

export function MapWithFilters({
  cafes,
  favoriteIds,
  isLoggedIn,
  userId,
}: MapWithFiltersProps) {
  const { t } = useI18n();
  const { filters, updateFilter, clearFilters, activeFilterCount } = useMapFilters();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<CafeSummary | null>(null);

  const handleCafeSelect = useCallback((cafe: CafeSummary | null) => {
    setSelectedCafe(cafe);
  }, []);

  return (
    <div className="flex h-full">
      {/* Desktop Filter Sidebar */}
      <aside className="hidden md:block w-80 border-r bg-background overflow-y-auto shrink-0">
        <MapFiltersPanel
          filters={filters}
          onChange={(newFilters) => {
            Object.entries(newFilters).forEach(([key, value]) => {
              updateFilter(key as keyof typeof filters, value);
            });
          }}
          onClear={clearFilters}
          isLoggedIn={isLoggedIn}
          favoritesCount={favoriteIds?.length ?? 0}
        />
      </aside>

      {/* Mobile Filter Button & Sheet */}
      <div className="md:hidden absolute top-4 left-4 z-50">
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
          <SheetContent side="left" className="w-[300px] sm:w-80 p-0">
            <SheetTitle className="sr-only">{t('map.filters.title')}</SheetTitle>
            <MapFiltersPanel
              filters={filters}
              onChange={(newFilters) => {
                Object.entries(newFilters).forEach(([key, value]) => {
                  updateFilter(key as keyof typeof filters, value);
                });
              }}
              onClear={clearFilters}
              isLoggedIn={isLoggedIn}
              favoritesCount={favoriteIds?.length ?? 0}
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
          />
        </div>
      </main>
    </div>
  );
}
