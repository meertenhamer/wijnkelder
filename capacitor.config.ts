import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.wijnkelder.app',
  appName: 'Wijnkelder',
  webDir: 'dist',
  // De iOS-app laadt de online versie, zodat inloggen via Cloudflare Access werkt
  server: {
    url: 'https://wijn.meertenhamer.nl',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
