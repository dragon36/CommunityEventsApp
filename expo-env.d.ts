// =============================================================================
// COMMUNITY EVENTS APP - EXPO ENVIRONMENT DECLARATIONS
// =============================================================================

/// <reference types="expo" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Expo / EAS
    EXPO_PROJECT_ID: string;
    EXPO_OWNER: string;
    NODE_ENV: 'development' | 'production' | 'test';
    APP_VARIANT: 'development' | 'preview' | 'production';

    // Firebase Client
    EXPO_PUBLIC_FIREBASE_API_KEY: string;
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    EXPO_PUBLIC_FIREBASE_APP_ID: string;
    EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string;

    // Google Maps
    EXPO_IOS_GOOGLE_MAPS_API_KEY: string;
    EXPO_ANDROID_GOOGLE_MAPS_API_KEY: string;

    // Google Places
    EXPO_IOS_GOOGLE_PLACES_API_KEY: string;
    EXPO_ANDROID_GOOGLE_PLACES_API_KEY: string;

    // Apple / iOS
    APPLE_TEAM_ID: string;
    APNS_KEY_ID: string;
    APNS_TEAM_ID: string;
    APNS_AUTH_KEY: string;

    // Sentry
    SENTRY_DSN: string;
    SENTRY_ORG: string;
    SENTRY_PROJECT: string;

    // Functions (server-side)
    FIREBASE_ADMIN_PROJECT_ID: string;
    FIREBASE_ADMIN_CLIENT_EMAIL: string;
    FIREBASE_ADMIN_PRIVATE_KEY: string;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER: string;
    SMTP_PASS: string;
    EMAIL_DOMAIN: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REDIRECT_URI: string;
    APP_NAME: string;
    APP_URL: string;
    SUPPORT_EMAIL: string;
  }
}