'use client';

import { MapProvider } from './map-provider';
import { MapWithFilters } from './map-with-filters';
import type { CafeSummary } from '@/types/cafe';

interface CafeMapWrapperProps {
  cafes: CafeSummary[];
  favoriteIds?: string[];
  isLoggedIn?: boolean;
  userId?: string;
}

export function CafeMapWrapper({
  cafes,
  favoriteIds,
  isLoggedIn,
  userId,
}: CafeMapWrapperProps) {
  return (
    <MapProvider>
      <MapWithFilters
        cafes={cafes}
        favoriteIds={favoriteIds}
        isLoggedIn={isLoggedIn}
        userId={userId}
      />
    </MapProvider>
  );
}
