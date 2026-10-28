import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * IntelliShop app configuration.
 *
 * APP_ENV is set per EAS build profile in eas.json (development / staging / production) and
 * selects the bundle identifier and display name, so the three environments can be installed
 * side by side and never share a Firebase project by accident.
 *
 * Only public configuration belongs here. Private provider credentials live in Google Cloud
 * Secret Manager and are read by Cloud Functions (docs/SECURITY_CLOUD_SECRETS_IMPLEMENTATION.md).
 */

type AppEnv = 'development' | 'staging' | 'production';

const VARIANTS: Record<AppEnv, { name: string; bundleIdentifier: string; androidPackage: string }> = {
  development: {
    name: 'IntelliShop Dev',
    bundleIdentifier: 'com.huerlem.intellishop.dev',
    androidPackage: 'com.huerlem.intellishop.dev',
  },
  staging: {
    name: 'IntelliShop Staging',
    bundleIdentifier: 'com.huerlem.intellishop.staging',
    androidPackage: 'com.huerlem.intellishop.staging',
  },
  production: {
    name: 'IntelliShop',
    bundleIdentifier: 'com.huerlem.intellishop',
    androidPackage: 'com.huerlem.intellishop',
  },
};

function resolveAppEnv(value: string | undefined): AppEnv {
  const env = value ?? 'development';
  if (env === 'development' || env === 'staging' || env === 'production') {
    return env;
  }
  throw new Error(`Unknown APP_ENV "${env}". Expected development, staging or production.`);
}

const APP_ENV = resolveAppEnv(process.env.APP_ENV);
const variant = VARIANTS[APP_ENV];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant.name,
  // Must match the EAS project below. Taken from the owner's local V1 app.config.js
  // (the GitHub copy's app.json used "intellishop-new", which was not the linked project).
  slug: 'intellishop',
  scheme: 'intellishop',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    // iPhone only for V2.0: the approved Figma designs and QA cover iPhone viewports.
    supportsTablet: false,
    bundleIdentifier: variant.bundleIdentifier,
    infoPlist: {
      // The app only uses standard HTTPS (exempt encryption).
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: variant.androidPackage,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F8FAFC',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'IntelliShop uses your photo library only when you choose a new profile picture.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
  ],
  extra: {
    appEnv: APP_ENV,
    eas: {
      // Public identifier of the existing EAS project (not a secret). Owner to confirm it is
      // the EAS project to keep using (docs/OWNER_ACTIONS_BEFORE_M2.md).
      projectId: 'ad1df46f-81bc-491f-b80f-5a7c81e0eae2',
    },
  },
});
