'use client';

import { useKakaoLoader } from 'react-kakao-maps-sdk';
import { Loader2 } from 'lucide-react';

interface MapProviderProps {
  children: React.ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAPS_API_KEY!,
    libraries: ['clusterer', 'services'],
  });

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-destructive/10">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load map</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please check your Kakao Maps API key
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
