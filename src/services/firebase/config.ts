import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get Firebase config from Expo Constants (set in app.config.ts extra)
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebase?.apiKey,
  authDomain: Constants.expoConfig?.extra?.firebase?.authDomain,
  projectId: Constants.expoConfig?.extra?.firebase?.projectId,
  storageBucket: Constants.expoConfig?.extra?.firebase?.storageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebase?.messagingSenderId,
  appId: Constants.expoConfig?.extra?.firebase?.appId,
  measurementId: Constants.expoConfig?.extra?.firebase?.measurementId,
};

// Validate config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    console.warn(`Firebase config missing: ${key}. Check your .env and app.config.ts`);
  }
}

// Initialize Firebase App
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app, 'us-central1'); // Adjust region as needed

// Connect to emulators in development
if (__DEV__ && process.env.EXPO_PUBLIC_USE_EMULATORS === 'true') {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(firestore, host, 8080);
    connectStorageEmulator(storage, host, 9199);
    connectFunctionsEmulator(functions, host, 5001);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
  }
}

// Export app for testing
export { app };

// Helper to get current user ID
export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid ?? null;
};

// Helper to check if user is admin (requires custom claims or Firestore lookup)
export const isAdminUser = async (uid?: string): Promise<boolean> => {
  const userId = uid ?? auth.currentUser?.uid;
  if (!userId) return false;

  // Option 1: Check custom claims (set via Cloud Function on user creation)
  const idTokenResult = await auth.currentUser?.getIdTokenResult();
  if (idTokenResult?.claims?.admin === true) {
    return true;
  }

  // Option 2: Fallback to Firestore lookup
  // This would be implemented in the admin service
  return false;
};

// Initialize Firebase App Check (optional, for production security)
// import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
// if (!__DEV__) {
//   initializeAppCheck(app, { provider: new ReCaptchaV3Provider('your-recaptcha-site-key'), isTokenAutoRefreshEnabled: true });
// }

export default app;