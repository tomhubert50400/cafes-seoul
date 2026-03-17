'use client';

import { useCallback, useRef } from 'react';
import { useAnalytics } from './use-analytics';

export function useMapTracking() {
  const { track } = useAnalytics();
  const viewportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackMarkerClick = useCallback(
    (cafeId: string, zoomLevel: number) => {
      track('marker_click', { cafe_id: cafeId, zoom_level: zoomLevel });
    },
    [track]
  );

  const trackViewport = useCallback(
    (centerLat: number, centerLng: number, zoom: number, visibleCafesCount: number) => {
      if (viewportTimeoutRef.current) clearTimeout(viewportTimeoutRef.current);
      viewportTimeoutRef.current = setTimeout(() => {
        track('map_viewport', {
          center_lat: centerLat,
          center_lng: centerLng,
          zoom,
          visible_cafes_count: visibleCafesCount,
        });
      }, 500);
    },
    [track]
  );

  return { trackMarkerClick, trackViewport };
}
