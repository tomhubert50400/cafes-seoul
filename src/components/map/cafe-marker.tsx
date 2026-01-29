'use client';

import { MapMarker } from 'react-kakao-maps-sdk';
import { memo } from 'react';
import type { CafeSummary } from '@/types/cafe';

interface CafeMarkerProps {
  cafe: CafeSummary;
  isSelected?: boolean;
  onClick: () => void;
}

function CafeMarkerComponent({ cafe, isSelected, onClick }: CafeMarkerProps) {
  return (
    <MapMarker
      position={{ lat: cafe.latitude, lng: cafe.longitude }}
      onClick={onClick}
    />
  );
}

export const CafeMarker = memo(CafeMarkerComponent);
