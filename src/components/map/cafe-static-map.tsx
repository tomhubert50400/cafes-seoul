'use client';

import { Map, MapMarker } from 'react-kakao-maps-sdk';
import type { Cafe } from '@/types/cafe';

interface CafeStaticMapProps {
  cafe: Cafe;
  width?: string;
  height?: string;
}

export function CafeStaticMap({ 
  cafe, 
  width = '100%', 
  height = '200px' 
}: CafeStaticMapProps) {
  const center = { lat: cafe.latitude, lng: cafe.longitude };
  
  return (
    <Map
      center={center}
      style={{ width, height }}
      level={3}
      draggable={true}
      zoomable={true}
    >
      <MapMarker
        position={center}
        title={cafe.name.ko || cafe.name.en || ''}
      />
    </Map>
  );
}
