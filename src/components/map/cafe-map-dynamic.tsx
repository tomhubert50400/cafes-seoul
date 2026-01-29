'use client';

import dynamic from 'next/dynamic';
import { CafeMapSkeleton } from './cafe-map-skeleton';

export const CafeMapWrapperDynamic = dynamic(
  () => import('./cafe-map-wrapper').then((mod) => mod.CafeMapWrapper),
  { 
    ssr: false,
    loading: () => <CafeMapSkeleton />
  }
);
