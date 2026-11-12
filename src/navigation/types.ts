// =============================================================================
// COMMUNITY EVENTS APP - NAVIGATION TYPES
// =============================================================================

// Root stack navigator params
export type RootStackParamList = {
  // Auth flow
  '(auth)': undefined;
  'auth/login': undefined;
  'auth/register': undefined;
  'auth/forgot-password': undefined;
  'auth/verify-email': { email: string };

  // Main app flow
  '(app)': undefined;
  '(tabs)': undefined;

  // Event screens
  'events': undefined;
  'events/[id]': { id: string };
  'events/create': undefined;
  'events/edit': { id: string };

  // Other main tabs
  'map': undefined;
  'search': { query?: string } | undefined;
  'categories': { categoryId?: string } | undefined;
  'saved': undefined;
  'notifications': undefined;

  // Profile
  'profile': { userId?: string } | undefined;
  'profile/edit': undefined;
  'profile/followers': { userId: string };
  'profile/following': { userId: string };

  // Settings
  'settings': undefined;
  'settings/account': undefined;
  'settings/notifications': undefined;
  'settings/privacy': undefined;
  'settings/appearance': undefined;
  'settings/blocked-users': undefined;
  'settings/help': undefined;
  'settings/about': undefined;

  // Friends
  'friends': undefined;
  'friends/requests': undefined;
  'friends/suggestions': undefined;

  // Modals
  'modal': undefined;
  'modal/event-details': { eventId: string };
  'modal/rsvp': { eventId: string };
  'modal/share': { eventId: string; title: string };
  'modal/report': { targetType: string; targetId: string };
  'modal/filter': { onApply: (filters: any) => void };
  'modal/calendar-sync': { eventId: string };
  'modal/image-picker': { onSelect: (uri: string) => void; multiple?: boolean };
  'modal/location-picker': { onSelect: (location: any) => void };

  // Onboarding
  'onboarding': undefined;
  'onboarding/welcome': undefined;
  'onboarding/permissions': undefined;
  'onboarding/interests': undefined;
  'onboarding/complete': undefined;
};

// Tab navigator params
export type TabParamList = {
  home: undefined;
  map: undefined;
  search: undefined;
  saved: undefined;
  profile: undefined;
};

// Auth stack params
export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  'forgot-password': undefined;
  'verify-email': { email: string };
};

// Event stack params
export type EventStackParamList = {
  list: undefined;
  detail: { id: string };
  create: undefined;
  edit: { id: string };
};

// Profile stack params
export type ProfileStackParamList = {
  main: { userId?: string } | undefined;
  edit: undefined;
  followers: { userId: string };
  following: { userId: string };
};

// Settings stack params
export type SettingsStackParamList = {
  main: undefined;
  account: undefined;
  notifications: undefined;
  privacy: undefined;
  appearance: undefined;
  'blocked-users': undefined;
  help: undefined;
  about: undefined;
};

// Modal params
export type ModalParamList = {
  'event-details': { eventId: string };
  rsvp: { eventId: string };
  share: { eventId: string; title: string };
  report: { targetType: string; targetId: string };
  filter: { onApply: (filters: any) => void };
  'calendar-sync': { eventId: string };
  'image-picker': { onSelect: (uri: string) => void; multiple?: boolean };
  'location-picker': { onSelect: (location: any) => void };
};

// Navigation prop types for screens
export type ScreenNavigationProp<ParamList extends Record<string, any>, RouteName extends keyof ParamList> = {
  navigate: (routeName: RouteName, params: ParamList[RouteName]) => void;
  goBack: () => void;
  reset: (state: any) => void;
  setParams: (params: Partial<ParamList[RouteName]>) => void;
  dispatch: (action: any) => void;
  addListener: (type: string, listener: any) => () => void;
  removeListener: (type: string, listener: any) => void;
  canGoBack: () => boolean;
  getParent: () => any;
  getState: () => any;
  setOptions: (options: any) => void;
  replace: (routeName: RouteName, params: ParamList[RouteName]) => void;
  pop: (count?: number) => void;
  popToTop: () => void;
  push: (routeName: RouteName, params: ParamList[RouteName]) => void;
};

// Route prop types
export type ScreenRouteProp<ParamList extends Record<string, any>, RouteName extends keyof ParamList> = {
  key: string;
  name: RouteName;
  params: ParamList[RouteName];
  path?: string;
};

// Combined navigation prop
export type NativeStackNavigationProp<ParamList extends Record<string, any>, RouteName extends keyof ParamList> =
  ScreenNavigationProp<ParamList, RouteName> & {
    // Additional stack-specific methods
  };

// Tab navigation prop
export type BottomTabNavigationProp<ParamList extends Record<string, any>, RouteName extends keyof ParamList> =
  ScreenNavigationProp<ParamList, RouteName> & {
    jumpTo: (routeName: RouteName, params?: ParamList[RouteName]) => void;
  };

// Drawer navigation prop
export type DrawerNavigationProp<ParamList extends Record<string, any>, RouteName extends keyof ParamList> =
  ScreenNavigationProp<ParamList, RouteName> & {
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
  };

// Navigation hook return types
export type UseNavigationResult<ParamList extends Record<string, any>> =
  ScreenNavigationProp<ParamList, keyof ParamList>;

export type UseRouteResult<ParamList extends Record<string, any>> =
  ScreenRouteProp<ParamList, keyof ParamList>;

// Navigation options
export interface ScreenOptions {
  headerShown?: boolean;
  headerTitle?: string;
  headerTitleAlign?: 'left' | 'center';
  headerStyle?: any;
  headerTintColor?: string;
  headerTitleStyle?: any;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  headerBackVisible?: boolean;
  headerBackTitle?: string;
  headerBackTitleVisible?: boolean;
  gestureEnabled?: boolean;
  animation?: 'slide_from_right' | 'fade' | 'none';
  presentation?: 'card' | 'modal' | 'transparentModal';
  contentStyle?: any;
  background?: string;
}

// Deep link configuration
export const DeepLinkConfig = {
  prefixes: ['communityevents://', 'https://communityevents.app'] as string[],
  config: {
    screens: {
      // Auth screens
      'auth/login': 'login',
      'auth/register': 'register',
      'auth/forgot-password': 'forgot-password',
      'auth/verify-email': 'verify-email',
      // Main app tabs
      home: 'events',
      map: 'map',
      search: 'search',
      saved: 'saved',
      profile: 'profile',
      // Event screens
      'events/[id]': 'events/:id',
      'events/create': 'events/create',
      'events/edit': 'events/edit/:id',
      // Profile screens
      'profile/edit': 'profile/edit',
      // Settings screens
      'settings': 'settings',
      'settings/account': 'settings/account',
      'settings/notifications': 'settings/notifications',
      'settings/privacy': 'settings/privacy',
      'settings/appearance': 'settings/appearance',
      // Friends screens
      'friends': 'friends',
      'friends/requests': 'friends/requests',
      // Modal screens
      'modal/event-details': 'events/:id',
      'modal/rsvp': 'events/:id/rsvp',
      'modal/share': 'events/:id/share',
    },
  },
} as const;

// Navigation action types
export type NavigationAction =
  | { type: 'NAVIGATE'; payload: { name: string; params?: any } }
  | { type: 'GO_BACK' }
  | { type: 'RESET'; payload: { routes: any[]; index: number } }
  | { type: 'SET_PARAMS'; payload: { params: any } }
  | { type: 'JUMP_TO'; payload: { name: string; params?: any } };

// Navigation state
export interface NavigationState {
  index: number;
  routes: NavigationRoute[];
  stale: boolean;
  type: string;
  key: string;
}

export interface NavigationRoute {
  key: string;
  name: string;
  params?: any;
  path?: string;
  state?: NavigationState;
}

// Event types for navigation listeners
export type NavigationEventMap = {
  focus: { data: undefined };
  blur: { data: undefined };
  beforeRemove: { data: { action: any } };
  state: { data: { state: NavigationState } };
  action: { data: { action: NavigationAction; state: NavigationState } };
};