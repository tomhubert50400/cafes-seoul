'use client';

import { isNativePlatform } from './platform';

/**
 * Opens an OAuth URL using the Capacitor Browser plugin on native,
 * or standard redirect on web.
 */
export async function openOAuthUrl(url: string): Promise<void> {
  if (isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url, presentationStyle: 'popover' });
  } else {
    window.location.href = url;
  }
}
