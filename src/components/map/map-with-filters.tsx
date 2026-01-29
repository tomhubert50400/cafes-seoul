'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MapFiltersPanel } from './map-filters';
import { CafeMap } from './cafe-map';
import { useMapFilters } from '@/hooks/use-map-filters';
import type { CafeSummary } from '@/types/cafe';

interface MapWithFiltersProps {
  cafes: CafeSummary[];
}

export function MapWithFilters({ cafes }: MapWithFiltersProps) {
  const { filters, updateFilter, clearFilters, activeFilterCount } = useMapFilters();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Desktop Filter Sidebar */}
      <aside className="hidden md:block w-80 border-r bg-background overflow-y-auto">
        <MapFiltersPanel
          filters={filters}
          onChange={(newFilters) => {
            Object.entries(newFilters).forEach(([key, value]) => {
              updateFilter(key as keyof typeof filters, value);
            });
          }}
          onClear={clearFilters}
        />
      </aside>

      {/* Mobile Filter Button & Sheet */}
      <div className="md:hidden absolute top-4 left-4 z-10">
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm" className="shadow-md">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <MapFiltersPanel
              filters={filters}
              onChange={(newFilters) => {
                Object.entries(newFilters).forEach(([key, value]) => {
                  updateFilter(key as keyof typeof filters, value);
                });
              }}
              onClear={clearFilters}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Map Area */}
      <main className="flex-1 relative">
        <CafeMap cafes={cafes} filters={filters} />
      </main>
    </div>
  );
}
