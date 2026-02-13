'use client';

import { isNativePlatform } from './platform';

export async function configureStatusBar() {
  if (!isNativePlatform()) return;

  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {
    // setBackgroundColor not supported on iOS, ignore
  });
}
