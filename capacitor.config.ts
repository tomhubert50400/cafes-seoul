import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cafesseoul.app',
  appName: 'Cafes Seoul',
  webDir: 'public',
  server: {
    // Remote URL: the WebView loads the deployed site
    // For local dev, temporarily change to your LAN IP (e.g. http://192.168.1.x:3000)
    url: 'https://cafesinseoul.com',
    androidScheme: 'https',
    allowNavigation: [
      'cafesinseoul.com',
      'www.cafesinseoul.com',
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
