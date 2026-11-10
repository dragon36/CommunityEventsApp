// =============================================================================
// COMMUNITY EVENTS APP - JEST SETUP
// =============================================================================

import '@testing-library/jest-native/extend-expect';
import 'jest-expo';

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: { projectId: 'test-project-id' },
      firebase: {
        apiKey: 'test-api-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test-project.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef',
      },
    },
  },
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: true,
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 10 },
  }),
  watchPositionAsync: jest.fn(),
  Accuracy: { High: 'high' },
}));

jest.mock('expo-calendar', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCalendarsAsync: jest.fn().mockResolvedValue([]),
  createEventAsync: jest.fn().mockResolvedValue('event-id'),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ assets: [{ uri: 'test-uri' }] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ assets: [{ uri: 'test-uri' }] }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-system-ui', () => ({
  setTheme: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  parse: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/',
  cacheDirectory: '/mock/cache/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  moveAsync: jest.fn(),
  copyAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native/Libraries/Utilities/PlatformConstants', () => ({
  forceTouchAvailable: false,
  isTesting: true,
  reactNativeVersion: { major: 0, minor: 74, patch: 2 },
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn().mockReturnValue(() => {}),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
}));

// Mock @react-native-firebase modules
jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn().mockReturnValue([]),
  default: {
    initializeApp: jest.fn(),
    getApps: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
  onAuthStateChanged: jest.fn((auth, cb) => cb(null)),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  onSnapshot: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: {
    now: jest.fn(),
    fromDate: jest.fn(),
    fromMillis: jest.fn(),
  },
  GeoPoint: jest.fn(),
  FieldValue: {
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
    increment: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(),
  requestPermission: jest.fn().mockResolvedValue(true),
  getToken: jest.fn().mockResolvedValue('mock-token'),
  onMessage: jest.fn(),
  onTokenRefresh: jest.fn(),
}));

jest.mock('@react-native-firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  return {
    MapView: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref, testID: 'MapView' })),
    Marker: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref, testID: 'Marker' })),
    Callout: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref, testID: 'Callout' })),
    Polyline: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref, testID: 'Polyline' })),
    Circle: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref, testID: 'Circle' })),
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock @react-native-google-places-autocomplete
jest.mock('@react-native-google-places-autocomplete', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => React.createElement('View', { ...props, ref, testID: 'GooglePlacesAutocomplete' }));
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const View = React.forwardRef((props, ref) => React.createElement('View', { ...props, ref }));
  return {
    GestureHandlerRootView: View,
    PanGestureHandler: View,
    TapGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    NativeViewGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    Directions: {},
    State: {},
    gestureHandlerRootHOC: (component) => component,
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    default: {
      View: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref })),
      Text: React.forwardRef((props, ref) => React.createElement('Text', { ...props, ref })),
      Image: React.forwardRef((props, ref) => React.createElement('Image', { ...props, ref })),
      ScrollView: React.forwardRef((props, ref) => React.createElement('ScrollView', { ...props, ref })),
      FlatList: React.forwardRef((props, ref) => React.createElement('FlatList', { ...props, ref })),
      SectionList: React.forwardRef((props, ref) => React.createElement('SectionList', { ...props, ref })),
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((v) => v),
    withSpring: jest.fn((v) => v),
    withDelay: jest.fn((v) => v),
    interpolate: jest.fn(),
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    Easing: { linear: () => {}, in: () => {}, out: () => {}, inOut: () => {} },
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const createIconSet = () => React.forwardRef((props, ref) => React.createElement('Text', { ...props, ref }));
  return {
    Ionicons: createIconSet(),
    MaterialIcons: createIconSet(),
    MaterialCommunityIcons: createIconSet(),
    FontAwesome: createIconSet(),
    FontAwesome5: createIconSet(),
    Entypo: createIconSet(),
    Feather: createIconSet(),
    AntDesign: createIconSet(),
    EvilIcons: createIconSet(),
    Foundation: createIconSet(),
    Octicons: createIconSet(),
    Zocial: createIconSet(),
    SimpleLineIcons: createIconSet(),
  };
});

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const View = React.forwardRef((props, ref) => React.createElement('View', { ...props, ref }));
  return {
    BottomSheetModal: View,
    BottomSheetModalProvider: ({ children }) => children,
    BottomSheetView: View,
    BottomSheetFlatList: View,
    BottomSheetScrollView: View,
    useBottomSheetModal: () => ({
      present: jest.fn(),
      dismiss: jest.fn(),
      snapToIndex: jest.fn(),
    }),
    useBottomSheetInternal: () => ({}),
  };
});

// Mock zustand
jest.mock('zustand', () => ({
  create: jest.fn(() => () => ({})),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, fmt) => new Date(date).toISOString()),
  isToday: jest.fn(() => false),
  isTomorrow: jest.fn(() => false),
  addDays: jest.fn((date, days) => new Date(new Date(date).getTime() + days * 86400000)),
  startOfDay: jest.fn((date) => new Date(date).setHours(0, 0, 0, 0)),
  endOfDay: jest.fn((date) => new Date(date).setHours(23, 59, 59, 999)),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref })),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const React = require('react');
  const View = React.forwardRef((props, ref) => React.createElement('View', { ...props, ref }));
  const Text = React.forwardRef((props, ref) => React.createElement('Text', { ...props, ref }));
  return {
    Provider: ({ children }) => children,
    Button: View,
    TextInput: View,
    Card: View,
    Surface: View,
    Portal: View,
    Modal: View,
    Dialog: View,
    Snackbar: View,
    Avatar: View,
    IconButton: View,
    FAB: View,
    Chip: View,
    Divider: View,
    List: { Item: View, Accordion: View, Subheader: View },
    Menu: View,
    Text,
    Heading: Text,
    Title: Text,
    Subtitle: Text,
    Body: Text,
    Caption: Text,
    useTheme: () => ({
      colors: {
        primary: '#4285F4',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#202124',
        onSurface: '#202124',
        error: '#EA4335',
        notification: '#EA4335',
      },
      dark: false,
      roundness: 12,
    }),
  };
});

// Global test utilities
global.__DEV__ = true;

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0]?.includes?.('act(...)') ||
    args[0]?.includes?.('Warning:') ||
    args[0]?.includes?.('validateDOMNesting')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);