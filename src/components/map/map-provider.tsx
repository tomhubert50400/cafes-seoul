'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface MapProviderProps {
  children: React.ReactNode;
}

/**
 * Waits for the Kakao Maps SDK (preloaded via Script tag in layout.tsx)
 * and calls kakao.maps.load() to initialize it.
 * Avoids re-injecting the script like useKakaoLoader does.
 */
function usePreloadedKakaoSDK(): { loading: boolean; error: string | null } {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Already fully initialized
    if (window.kakao?.maps?.Map) {
      setLoading(false);
      return;
    }

    // SDK script loaded but not yet initialized (autoload=false)
    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(() => setLoading(false));
      return;
    }

    // Script hasn't loaded yet — poll for it (preloaded from layout.tsx)
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.kakao?.maps?.load) {
        clearInterval(interval);
        window.kakao.maps.load(() => setLoading(false));
      } else if (attempts > 100) {
        // ~10 seconds timeout
        clearInterval(interval);
        setError('Kakao Maps SDK failed to load');
        setLoading(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return { loading, error };
}

export function MapProvider({ children }: MapProviderProps) {
  const { loading, error } = usePreloadedKakaoSDK();

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
