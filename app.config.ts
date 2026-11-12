import { ExpoConfig, ConfigContext } from 'expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDevelopment = process.env['NODE_ENV'] === 'development';
  const isPreview = process.env['APP_VARIANT'] === 'preview';
  const isProduction = process.env['APP_VARIANT'] === 'production';

  const bundleIdentifier = isProduction
    ? 'com.aroundtown.app'
    : isPreview
    ? 'com.aroundtown.app.preview'
    : 'com.aroundtown.app.dev';

  const packageName = isProduction
    ? 'com.aroundtown.app'
    : isPreview
    ? 'com.aroundtown.app.preview'
    : 'com.aroundtown.app.dev';

  const appName = isProduction
    ? 'AroundTown'
    : isPreview
    ? 'AroundTown (Preview)'
    : 'AroundTown (Dev)';

  return {
    ...config,
    name: appName,
    slug: 'aroundtown',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    updates: {
      fallbackToCacheTimeout: 0,
      url: isProduction ? undefined : `https://u.expo.dev/${process.env['EXPO_PROJECT_ID']}`
    },
    runtimeVersion: {
      policy: 'appVersion'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier,
      buildNumber: '1',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'This app needs access to your location to show nearby events and provide directions.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'This app needs access to your location to show nearby events and provide directions even when the app is in the background.',
        NSCalendarUsageDescription: 'This app needs access to your calendar to add events to your personal calendar.',
        NSCalendarsWriteOnlyUsageDescription: 'This app needs access to your calendar to add events to your personal calendar.',
        NSPhotoLibraryUsageDescription: 'This app needs access to your photo library to upload event images.',
        NSCameraUsageDescription: 'This app needs access to your camera to take photos for events.',
        NSFaceIDUsageDescription: 'This app uses Face ID for secure authentication.',
        UIBackgroundModes: ['location', 'fetch', 'remote-notification']
      },
      associatedDomains: ['applinks:aroundtown.app'],
      googleServicesFile: isProduction ? './GoogleService-Info.plist' : './GoogleService-Info-dev.plist',
      config: {
        googleMapsApiKey: process.env['EXPO_IOS_GOOGLE_MAPS_API_KEY']
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: packageName,
      versionCode: 1,
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'READ_CALENDAR',
        'WRITE_CALENDAR',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'POST_NOTIFICATIONS',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED'
      ],
      googleServicesFile: isProduction ? './google-services.json' : './google-services-dev.json',
      config: {
        googleMaps: {
          apiKey: process.env['EXPO_ANDROID_GOOGLE_MAPS_API_KEY']
        }
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'aroundtown.app'
            },
            {
              scheme: 'aroundtown',
              host: '*'
            }
          ],
          category: ['BROWSABLE', 'DEFAULT']
        }
      ]
    },
    web: {
      favicon: './src/assets/images/favicon.png',
      bundler: 'metro',
      output: 'static'
    },
    plugins: [
      'expo-font',
      'expo-secure-store',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
          locationWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
          isAndroidBackgroundLocationEnabled: true
        }
      ],
      [
        'expo-calendar',
        {
          calendarPermission: 'Allow $(PRODUCT_NAME) to access your calendar.',
          remindersPermission: 'Allow $(PRODUCT_NAME) to access your reminders.'
        }
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to access your photos.',
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera.'
        }
      ],
      [
        'expo-notifications',
        {
          icon: './src/assets/images/notification-icon.png',
          color: '#ffffff',
          defaultChannel: 'default',
          sounds: ['./src/assets/sounds/notification.wav']
        }
      ],
      [
        '@react-native-firebase/app',
        {
          appId: process.env['EXPO_FIREBASE_APP_ID'],
          apiKey: process.env['EXPO_FIREBASE_API_KEY'],
          projectId: process.env['EXPO_FIREBASE_PROJECT_ID']
        }
      ],
      [
        '@react-native-firebase/auth',
        {
          appleTeamId: process.env['APPLE_TEAM_ID']
        }
      ],
      [
        '@react-native-firebase/messaging',
        {
          ios: {
            apnsKeyId: process.env['APNS_KEY_ID'],
            apnsTeamId: process.env['APNS_TEAM_ID'],
            apnsAuthKey: process.env['APNS_AUTH_KEY']
          }
        }
      ],
            [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.4',
            useFrameworks: 'static'
          },
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
            buildToolsVersion: '35.0.0',
            kotlinVersion: '2.0.0',
            extraMavenRepos: ['https://maven.google.com'],
            extraProguardRules: '-keep class com.google.firebase.messaging.** { *; }'
          }
        }
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#ffffff',
          image: './src/assets/images/splash.png',
          dark: {
            backgroundColor: '#000000',
            image: './src/assets/images/splash-dark.png'
          }
        }
      ],
      [
        'expo-system-ui',
        {
          theme: 'light'
        }
      ]
    ],
    extra: {
      eas: {
        projectId: process.env['EXPO_PROJECT_ID']
      },
      // Backend provider: 'firebase' or 'supabase'
      backendProvider: process.env['EXPO_PUBLIC_BACKEND_PROVIDER'] || 'supabase',
      firebase: {
        apiKey: process.env['EXPO_FIREBASE_API_KEY'],
        authDomain: process.env['EXPO_FIREBASE_AUTH_DOMAIN'],
        projectId: process.env['EXPO_FIREBASE_PROJECT_ID'],
        storageBucket: process.env['EXPO_FIREBASE_STORAGE_BUCKET'],
        messagingSenderId: process.env['EXPO_FIREBASE_MESSAGING_SENDER_ID'],
        appId: process.env['EXPO_FIREBASE_APP_ID'],
        measurementId: process.env['EXPO_FIREBASE_MEASUREMENT_ID']
      },
      supabase: {
        url: process.env['EXPO_PUBLIC_SUPABASE_URL'],
        anonKey: process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY']
      },
      googleMaps: {
        iosApiKey: process.env['EXPO_IOS_GOOGLE_MAPS_API_KEY'],
        androidApiKey: process.env['EXPO_ANDROID_GOOGLE_MAPS_API_KEY']
      },
      googlePlaces: {
        iosApiKey: process.env['EXPO_IOS_GOOGLE_PLACES_API_KEY'],
        androidApiKey: process.env['EXPO_ANDROID_GOOGLE_PLACES_API_KEY']
      },
      sentry: {
        dsn: process.env['SENTRY_DSN'],
        org: process.env['SENTRY_ORG'],
        project: process.env['SENTRY_PROJECT']
      }
    },
    owner: process.env['EXPO_OWNER']
  };
};