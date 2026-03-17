'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAnalytics } from './use-analytics';

const impressedCafeIds = new Set<string>();
const pendingImpressions: string[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

export function useImpressionTracking(
  context: 'list' | 'map' | 'roulette'
) {
  const { track } = useAnalytics();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const flush = useCallback(() => {
    if (pendingImpressions.length === 0) return;
    const batch = [...pendingImpressions];
    pendingImpressions.length = 0;
    track('cafe_impression', { cafe_ids: batch, context });
  }, [track, context]);

  const observe = useCallback(
    (element: HTMLElement | null, cafeId: string) => {
      if (!element || !observerRef.current) return;
      element.dataset.cafeId = cafeId;
      observerRef.current.observe(element);
    },
    []
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const cafeId = (entry.target as HTMLElement).dataset.cafeId;
          if (!cafeId || impressedCafeIds.has(cafeId)) continue;
          impressedCafeIds.add(cafeId);
          pendingImpressions.push(cafeId);

          if (flushTimeout) clearTimeout(flushTimeout);
          flushTimeout = setTimeout(flush, 1000);
        }
      },
      { threshold: 0.5 }
    );

    return () => {
      observerRef.current?.disconnect();
      flush();
    };
  }, [flush]);

  return { observe };
}
