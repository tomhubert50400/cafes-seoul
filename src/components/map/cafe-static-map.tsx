'use client';

import { StaticMap } from 'react-kakao-maps-sdk';
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
    <StaticMap
      center={center}
      style={{ width, height }}
      level={3}
      marker={{
        position: center,
        text: cafe.name.ko || cafe.name.en || '',
      }}
    />
  );
}
