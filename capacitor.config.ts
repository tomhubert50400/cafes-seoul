import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cafesseoul.app',
  appName: 'Cafes Seoul',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://cafes-seoul.com',
    androidScheme: 'https',
    allowNavigation: [
      '*.supabase.co',
      'accounts.google.com',
      '*.kakao.com',
      'kauth.kakao.com',
    ],
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
