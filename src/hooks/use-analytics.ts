'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/actions/analytics';
import { hasAnalyticsConsent, hasLocationConsent, getConsentChoices } from '@/components/cookie-consent';
import type { EventType, DeviceType, TrackEventPayload } from '@/types/analytics';

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr';
  let id = sessionStorage.getItem('analytics_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', id);
  }
  return id;
}

function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  return navigator.language;
}

let cachedLocation: { latitude: number; longitude: number; district?: string } | null = null;
let locationPromise: Promise<typeof cachedLocation> | null = null;

function getLocation(): Promise<typeof cachedLocation> {
  if (cachedLocation) return Promise.resolve(cachedLocation);
  if (locationPromise) return locationPromise;
  if (!hasLocationConsent()) return Promise.resolve(null);
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);

  locationPromise = new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedLocation = {
          latitude: Math.round(pos.coords.latitude * 1000) / 1000,
          longitude: Math.round(pos.coords.longitude * 1000) / 1000,
        };
        // Try Kakao reverse geocoding for district
        try {
          if (typeof window !== 'undefined' && (window as any).kakao?.maps?.services) {
            const geocoder = new (window as any).kakao.maps.services.Geocoder();
            geocoder.coord2RegionCode(
              pos.coords.longitude,
              pos.coords.latitude,
              (result: Array<{ region_2depth_name: string }>, status: string) => {
                if (status === (window as any).kakao.maps.services.Status.OK && result?.[0]) {
                  cachedLocation!.district = result[0].region_2depth_name;
                }
                resolve(cachedLocation);
              }
            );
            return; // Don't resolve yet, wait for geocoder callback
          }
        } catch {
          // Kakao SDK not ready
        }
        resolve(cachedLocation);
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: 300000 }
    );
  });

  return locationPromise;
}

export function useAnalytics() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const sessionMetaRef = useRef<{ browserLanguage: string; deviceType: DeviceType } | null>(null);

  useEffect(() => {
    if (!sessionMetaRef.current) {
      sessionMetaRef.current = {
        browserLanguage: getBrowserLanguage(),
        deviceType: getDeviceType(),
      };
    }
  }, []);

  const track = useCallback(
    async (eventType: EventType, eventData?: Record<string, unknown>) => {
      if (!hasAnalyticsConsent()) return;

      const location = await getLocation();
      const meta = sessionMetaRef.current;

      const payload: TrackEventPayload = {
        eventType,
        eventData,
        pagePath: pathname,
        referrerPage: prevPathRef.current ?? undefined,
        sessionId: getSessionId(),
        browserLanguage: meta?.browserLanguage,
        deviceType: meta?.deviceType,
        latitude: location?.latitude,
        longitude: location?.longitude,
        district: location?.district,
      };

      trackEvent(payload).catch(() => {});
    },
    [pathname]
  );

  useEffect(() => {
    if (pathname && pathname !== prevPathRef.current) {
      track('page_view', { path: pathname, referrer: prevPathRef.current });
      prevPathRef.current = pathname;
    }
  }, [pathname, track]);

  const checkConsent = useCallback(
    (type: 'analytics' | 'location'): boolean => {
      const choices = getConsentChoices();
      if (!choices) return false;
      return type === 'analytics' ? choices.analytics : choices.location;
    },
    []
  );

  return { track, checkConsent };
}
