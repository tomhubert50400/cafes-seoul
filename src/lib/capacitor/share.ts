'use client';

import { isNativePlatform } from './platform';

export async function shareUrl(options: {
  title: string;
  url: string;
  text?: string;
}): Promise<boolean> {
  // On native, use the Capacitor Share plugin for the native share sheet
  if (isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: options.title,
        url: options.url,
        dialogTitle: options.title,
      });
      return true;
    } catch {
      // User cancelled or error
      return false;
    }
  }

  // On web, try navigator.share first, then clipboard fallback
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: options.title, url: options.url });
      return true;
    } catch {
      return false;
    }
  }

  // Clipboard fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(options.url);
    return false; // Return false to signal "copied" instead of "shared"
  }

  return false;
}
