'use client';

import dynamic from 'next/dynamic';

export const CafeMapWrapperDynamic = dynamic(
  () => import('./cafe-map-wrapper').then((mod) => mod.CafeMapWrapper),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/20">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
);
