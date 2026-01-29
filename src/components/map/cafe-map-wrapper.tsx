'use client';

import { MapProvider } from './map-provider';
import { MapWithFilters } from './map-with-filters';
import type { CafeSummary } from '@/types/cafe';

interface CafeMapWrapperProps {
  cafes: CafeSummary[];
}

export function CafeMapWrapper({ cafes }: CafeMapWrapperProps) {
  return (
    <MapProvider>
      <MapWithFilters cafes={cafes} />
    </MapProvider>
  );
}
