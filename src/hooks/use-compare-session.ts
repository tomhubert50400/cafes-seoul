'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAnalytics } from './use-analytics';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export function useCompareSession() {
  const { track } = useAnalytics();
  const cafesViewedRef = useRef<string[]>([]);
  const selectedCafeRef = useRef<string | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const fireSession = useCallback(() => {
    if (firedRef.current || cafesViewedRef.current.length === 0) return;
    firedRef.current = true;
    track('cafe_compare_session', {
      cafes_viewed: cafesViewedRef.current,
      selected: selectedCafeRef.current,
    });
  }, [track]);

  const addCafeViewed = useCallback((cafeId: string) => {
    if (!cafesViewedRef.current.includes(cafeId)) {
      cafesViewedRef.current.push(cafeId);
    }
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(fireSession, INACTIVITY_TIMEOUT);
  }, [fireSession]);

  const setSelectedCafe = useCallback((cafeId: string) => {
    selectedCafeRef.current = cafeId;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => fireSession();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      fireSession();
    };
  }, [fireSession]);

  return { addCafeViewed, setSelectedCafe };
}
