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
import type { MapFilters, FilterPreset } from '@/types/map';

interface RouletteFilterSheetProps {
  filters: MapFilters;
  activeFilterCount: number;
  onUpdateFilter: <K extends keyof MapFilters>(key: K, value: MapFilters[K]) => void;
  onClearFilters: () => void;
  applyPreset?: (presetId: string) => void;
  matchedPresetId?: string | null;
  presets?: FilterPreset[];
  isLoggedIn?: boolean;
}

export function RouletteFilterSheet({
  filters,
  activeFilterCount,
  onUpdateFilter,
  onClearFilters,
  applyPreset,
  matchedPresetId,
  presets,
  isLoggedIn,
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
          onChange={handleChange}
          onClear={onClearFilters}
          isLoggedIn={false}
          applyPreset={applyPreset}
          matchedPresetId={matchedPresetId}
          presets={presets}
          className="min-[319px]:pl-8 min-[340px]:pl-4"
        />
      </SheetContent>
    </Sheet>
  );
}
