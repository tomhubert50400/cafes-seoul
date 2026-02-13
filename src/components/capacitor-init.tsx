'use client';

import { useEffect } from 'react';

/**
 * Initializes Capacitor plugins on native platforms.
 * Renders nothing - only runs side effects in useEffect.
 * Safe to include on web (all imports are lazy and platform-gated).
 */
export function CapacitorInit() {
  useEffect(() => {
    async function init() {
      // Only run in Capacitor native environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).Capacitor?.isNativePlatform?.()) return;

      const [{ configureStatusBar }, { initAppListeners }] = await Promise.all([
        import('@/lib/capacitor/status-bar'),
        import('@/lib/capacitor/app-listeners'),
      ]);

      await Promise.all([
        configureStatusBar(),
        initAppListeners(),
      ]);
    }

    init();
  }, []);

  return null;
}
