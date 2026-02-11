'use client';

import { MapProvider } from './map-provider';
import { MapWithFilters } from './map-with-filters';
import type { CafeSummary } from '@/types/cafe';
import type { UserVibe } from '@/types/vibes';

interface CafeMapWrapperProps {
  cafes: CafeSummary[];
  favoriteIds?: string[];
  isLoggedIn?: boolean;
  userId?: string;
  userVibes?: UserVibe[];
}

export function CafeMapWrapper({
  cafes,
  favoriteIds,
  isLoggedIn,
  userId,
  userVibes,
}: CafeMapWrapperProps) {
  return (
    <MapProvider>
      <MapWithFilters
        cafes={cafes}
        favoriteIds={favoriteIds}
        isLoggedIn={isLoggedIn}
        userId={userId}
        userVibes={userVibes}
      />
    </MapProvider>
  );
}
