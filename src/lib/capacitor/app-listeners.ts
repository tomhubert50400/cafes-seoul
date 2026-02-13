'use client';

import { isNativePlatform } from './platform';

/**
 * Initialize Capacitor App plugin listeners for deep links and lifecycle.
 * Only runs on native platforms.
 */
export async function initAppListeners() {
  if (!isNativePlatform()) return;

  const { App } = await import('@capacitor/app');

  // Handle deep links / universal links (e.g. OAuth callbacks)
  App.addListener('appUrlOpen', ({ url }) => {
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname + parsedUrl.search;
      if (path.startsWith('/auth/callback')) {
        window.location.href = path;
      }
    } catch {
      // Invalid URL, ignore
    }
  });
}

/**
 * Register an appStateChange listener that calls a callback when the app
 * goes to background. Returns a cleanup function.
 */
export async function onAppBackground(callback: () => void): Promise<(() => void) | undefined> {
  if (!isNativePlatform()) return undefined;

  const { App } = await import('@capacitor/app');
  const listener = await App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) callback();
  });

  return () => listener.remove();
}
