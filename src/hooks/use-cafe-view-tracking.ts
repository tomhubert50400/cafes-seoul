'use client';

import { useEffect, useRef } from 'react';
import { useAnalytics } from './use-analytics';

export function useCafeViewTracking(
  cafeId: string,
  slug: string,
  source: 'map' | 'list' | 'roulette' | 'similar' | 'direct' = 'direct'
) {
  const { track } = useAnalytics();
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();

    track('cafe_view', { cafe_id: cafeId, slug, source });

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      if (scrollPercent > maxScrollRef.current) {
        maxScrollRef.current = scrollPercent;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      track('cafe_view_duration', {
        cafe_id: cafeId,
        duration_seconds: duration,
        scroll_depth_percent: maxScrollRef.current,
      });
    };
  }, [cafeId, slug, source, track]);
}
