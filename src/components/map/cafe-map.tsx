'use client';

import { useState, useMemo, useCallback } from 'react';
import { Map, MarkerClusterer } from 'react-kakao-maps-sdk';
import { CafeMarker } from './cafe-marker';
import { CafeInfoWindow } from './cafe-info-window';
import { filterCafes } from '@/lib/utils/filter-cafes';
import type { CafeSummary } from '@/types/cafe';
import type { MapFilters } from '@/types/map';

interface CafeMapProps {
  cafes: CafeSummary[];
  filters?: MapFilters;
}

export function CafeMap({ cafes, filters }: CafeMapProps) {
  const [selectedCafe, setSelectedCafe] = useState<CafeSummary | null>(null);

  // Filter cafes based on active filters
  const visibleCafes = useMemo(() => {
    if (!filters) return cafes;
    return filterCafes(cafes, filters);
  }, [cafes, filters]);

  const handleMarkerClick = useCallback((cafe: CafeSummary) => {
    setSelectedCafe(cafe);
  }, []);

  const handleCloseInfoWindow = useCallback(() => {
    setSelectedCafe(null);
  }, []);

  return (
    <div className="relative h-full w-full min-h-[400px] md:min-h-0">
      <Map
        center={{ lat: 37.5665, lng: 126.9780 }} // Seoul City Hall
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        level={7} // Initial zoom level
        onClick={handleCloseInfoWindow}
      >
        <MarkerClusterer
          averageCenter={true}
          minLevel={4}
          styles={[
            {
              width: '50px',
              height: '50px',
              background: 'rgba(59, 130, 246, 0.9)', // blue-500
              borderRadius: '50%',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '50px',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            },
          ]}
        >
          {visibleCafes.map((cafe) => (
            <CafeMarker
              key={cafe.id}
              cafe={cafe}
              isSelected={selectedCafe?.id === cafe.id}
              onClick={() => handleMarkerClick(cafe)}
            />
          ))}
        </MarkerClusterer>

        {selectedCafe && (
          <CafeInfoWindow
            cafe={selectedCafe}
            onClose={handleCloseInfoWindow}
          />
        )}
      </Map>
    </div>
  );
}
