'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MapFiltersPanel } from '@/components/map/map-filters';
import { useI18n } from '@/lib/i18n';
import type { MapFilters } from '@/types/map';

interface RouletteFilterSheetProps {
  filters: MapFilters;
  activeFilterCount: number;
  onUpdateFilter: <K extends keyof MapFilters>(key: K, value: MapFilters[K]) => void;
  onClearFilters: () => void;
}

export function RouletteFilterSheet({
  filters,
  activeFilterCount,
  onUpdateFilter,
  onClearFilters,
}: RouletteFilterSheetProps) {
  const { t } = useI18n();

  const handleChange = (newFilters: MapFilters) => {
    // Find which key changed and call updateFilter for it
    for (const key of Object.keys(newFilters) as (keyof MapFilters)[]) {
      if (JSON.stringify(newFilters[key]) !== JSON.stringify(filters[key])) {
        onUpdateFilter(key, newFilters[key]);
      }
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shrink-0 min-h-[44px]">
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
          onChange={handleChange}
          onClear={onClearFilters}
          isLoggedIn={false}
        />
      </SheetContent>
    </Sheet>
  );
}
