'use client';

import { MapMarker } from 'react-kakao-maps-sdk';
import { memo, useMemo } from 'react';
import type { CafeSummary } from '@/types/cafe';

interface CafeMarkerProps {
  cafe: CafeSummary;
  isSelected?: boolean;
  isFavorited?: boolean;
  onClick: () => void;
}

// SVG marker icons as data URIs
const DEFAULT_MARKER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
  <path fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z"/>
  <circle fill="white" cx="14" cy="14" r="6"/>
</svg>
`)}`;

const FAVORITE_MARKER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
  <path fill="#ef4444" stroke="#b91c1c" stroke-width="1.5" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z"/>
  <path fill="white" d="M14 22l-5.5-5.5a4 4 0 1 1 5.5-5.5 4 4 0 1 1 5.5 5.5L14 22z"/>
</svg>
`)}`;

function CafeMarkerComponent({
  cafe,
  isSelected,
  isFavorited,
  onClick,
}: CafeMarkerProps) {
  const markerImage = useMemo(
    () => ({
      src: isFavorited ? FAVORITE_MARKER_SVG : DEFAULT_MARKER_SVG,
      size: { width: 28, height: 40 },
      options: {
        offset: { x: 14, y: 40 },
      },
    }),
    [isFavorited]
  );

  return (
    <MapMarker
      position={{ lat: cafe.latitude, lng: cafe.longitude }}
      onClick={() => {
        onClick();
      }}
      clickable={true}
      image={markerImage}
    />
  );
}

export const CafeMarker = memo(CafeMarkerComponent);
