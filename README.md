# Community Events App

A React Native + Expo + TypeScript mobile app with **dual backend support** (Firebase or Supabase) for discovering and sharing community events.

## 🚀 Tech Stack

- **Framework**: React Native 0.74 + Expo 51
- **Language**: TypeScript 5.4
- **Navigation**: React Navigation 6 (Stack, Tabs, Drawer)
- **State Management**: Zustand + React Context
- **Backend**: **Firebase** (Auth, Firestore, Storage, Functions, Messaging) **or** **Supabase** (Auth, Postgres, Storage, Realtime, Edge Functions)
- **Maps**: React Native Maps + Google Places Autocomplete
- **Calendar**: Expo Calendar
- **Location**: Expo Location
- **Notifications**: Expo Notifications + FCM (Firebase) / Supabase Realtime (Supabase)
- **UI**: React Native Paper + Custom Components
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: EAS Build + Submit

## 📁 Project Structure

```
community-events-app/
├── .vscode/              # VS Code configuration
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base components (Button, Input, Card, etc.)
│   │   ├── forms/        # Form components (Select, Checkbox, etc.)
│   │   ├── events/       # Event-specific components
│   │   ├── map/          # Map components
│   │   ├── profile/      # Profile components
│   │   └── common/       # Common components
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── events/       # Event screens
│   │   ├── map/          # Map screen
│   │   ├── search/       # Search screen
│   │   ├── saved/        # Saved events
│   │   ├── profile/      # Profile screens
│   │   ├── settings/     # Settings screens
│   │   ├── friends/      # Friends screens
│   │   ├── modals/       # Modal screens
│   │   └── onboarding/   # Onboarding screens
│   ├── navigation/       # Navigation configuration
│   ├── services/         # Services (Firebase, API, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React Context providers
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── constants/        # App constants
│   └── assets/           # Static assets
├── functions/            # Firebase Cloud Functions
│   ├── src/
│   │   ├── events/       # Event triggers
│   │   ├── auth/         # Auth triggers
│   │   ├── moderation/   # Content moderation
│   │   ├── calendar/     # Calendar sync
│   │   ├── storage/      # Image processing
│   │   ├── analytics/    # Analytics aggregation
│   │   └── notifications/# Notification functions
│   └── package.json
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── storage.rules         # Storage security rules
├── app.config.ts         # Expo configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies
├── eas.json              # EAS Build configuration
└── .env.example          # Environment variables template
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- Firebase CLI (`npm install -g firebase-tools`) — **required for Firebase backend**
- Supabase CLI (`npm install -g supabase`) — **required for Supabase backend**
- iOS Simulator (macOS) / Android Studio

### Backend Selection

This app supports **two backend providers**. Choose one during setup:

| Provider | Description | Best For |
|----------|-------------|----------|
| **Firebase** (default) | Google's BaaS with Auth, Firestore, Storage, Functions, FCM | Teams already using Google Cloud, need for real-time sync, offline support, mature ecosystem |
| **Supabase** | Open-source Firebase alternative with Postgres, Auth, Storage, Realtime, Edge Functions | Teams preferring SQL/Postgres, need for complex queries, open-source preference, self-hosting option |

**Set the backend provider** via environment variable:
```bash
# For Firebase (default)
EXPO_PUBLIC_BACKEND_PROVIDER=firebase

# For Supabase
EXPO_PUBLIC_BACKEND_PROVIDER=supabase
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd community-events-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up your chosen backend**
   
   **For Firebase:**
   ```bash
   firebase login
   firebase use <your-project-id>
   ```
   
   **For Supabase:**
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

5. **Start development server**
   ```bash
   npm start
   ```

### Running on Devices

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in:

**Required for all backends:**
- **Backend Provider**: `EXPO_PUBLIC_BACKEND_PROVIDER` (firebase or supabase)
- **Google Maps/Places**: API keys (from Google Cloud Console)
- **Apple**: Team ID, APNS keys (for iOS pushes)
- **Expo**: Project ID, Owner (from expo.dev)
- **Optional**: Sentry, Analytics keys

**Firebase Backend (`EXPO_PUBLIC_BACKEND_PROVIDER=firebase`):**
- **Firebase**: API keys, project ID, etc. (from Firebase Console)

**Supabase Backend (`EXPO_PUBLIC_BACKEND_PROVIDER=supabase`):**
- **Supabase**: URL and anon key (from Supabase Dashboard > Settings > API)

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Storage
5. Set up Cloud Functions (Node.js 20)
6. Configure FCM for push notifications
7. Add iOS/Android apps in project settings
8. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable Authentication (Email/Password)
3. Run database migrations (in `supabase/migrations/`) to create tables
4. Enable Storage buckets (event-images, profile-images)
5. Set up Edge Functions for server-side logic (optional)
6. Configure Realtime for live updates
7. Add iOS/Android apps in project settings
8. Get URL and anon key from Settings > API

### Google Maps Setup

1. Enable Maps SDK for iOS/Android in Google Cloud Console
2. Enable Places API
3. Create API keys with restrictions:
   - iOS: Bundle ID restriction
   - Android: Package name + SHA-1 restriction

## 📱 Features

### Core Features
- 🔐 **Authentication**: Email/password with email verification
- 📅 **Events**: Create, discover, RSVP, share events
- 🗺️ **Map View**: See events on interactive map
- 🔍 **Search**: Full-text search with filters
- 👤 **Profiles**: User profiles with privacy settings
- 🔔 **Notifications**: Push + in-app notifications
- 📎 **Save Events**: Bookmark events for later
- 👥 **Social**: Follow users, see friend activity
- 📅 **Calendar Sync**: Add events to device calendar

### Advanced Features
- 🎯 **Geolocation**: Nearby events with geohash indexing
- 🖼️ **Image Processing**: Automatic resize/optimization
- 🛡️ **Content Moderation**: Automated + manual review
- 📊 **Analytics**: Event tracking + daily aggregation
- 🌙 **Dark Mode**: System-aware theme switching
- 📴 **Offline Support**: Cached data with sync (Firebase only)

## 🏗️ Architecture: Dual Backend Support

This app uses a **service abstraction layer** that allows switching between Firebase and Supabase without changing application code.

### How It Works

```
src/services/
├── interfaces/index.ts      # TypeScript interfaces (contracts)
├── factory/index.ts         # Backend selection logic
├── firebase/                # Firebase implementation
│   ├── auth.ts
│   ├── database.ts
│   └── storage.ts
└── supabase/                # Supabase implementation
    ├── auth.ts
    ├── database.ts
    ├── storage.ts
    └── config.ts
```

### Key Design Decisions

1. **Interface-Based**: All backend operations are defined as TypeScript interfaces in `src/services/interfaces/index.ts`
2. **Factory Pattern**: `src/services/factory/index.ts` selects the backend at runtime based on `EXPO_PUBLIC_BACKEND_PROVIDER`
3. **Lazy Loading**: Adapters are dynamically imported to avoid bundling unused backend code
4. **Feature Parity**: Both adapters implement the same interface for Auth, Database, and Storage

### Switching Backends

```bash
# Development
EXPO_PUBLIC_BACKEND_PROVIDER=firebase npm start
EXPO_PUBLIC_BACKEND_PROVIDER=supabase npm start

# Production (set in EAS secrets or .env.production)
EXPO_PUBLIC_BACKEND_PROVIDER=supabase
```

### Backend Feature Comparison

| Feature | Firebase | Supabase |
|---------|----------|----------|
| Authentication | ✅ Email/Password, OAuth | ✅ Email/Password, OAuth |
| Database | ✅ Firestore (NoSQL) | ✅ PostgreSQL (SQL) |
| Real-time | ✅ Firestore listeners | ✅ Realtime subscriptions |
| Storage | ✅ Firebase Storage | ✅ Supabase Storage |
| Server Functions | ✅ Cloud Functions (Node.js) | ✅ Edge Functions (Deno) |
| Push Notifications | ✅ FCM | ✅ Via Edge Functions |
| Offline Support | ✅ Native | ⚠️ Limited |
| Complex Queries | ⚠️ Limited | ✅ Full SQL |
| Self-hosting | ❌ No | ✅ Yes |
| Cost at Scale | Higher | Lower |

### Migration Notes

- **Data Migration**: Firestore → Postgres requires schema transformation
- **Auth Users**: Can be exported from Firebase and imported to Supabase
- **Storage Files**: Need to be copied between buckets
- **Functions**: Cloud Functions → Edge Functions (different runtime)

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🔍 Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Auto-fix linting
npm run lint:fix

# Formatting
npm run format
```

## 🚀 Deployment

### EAS Build

```bash
# Development build
eas build --profile development

# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

### Submit to Stores

```bash
# iOS App Store
eas submit --platform ios --profile production

# Google Play Store
eas submit --platform android --profile production
```

### Firebase Functions

```bash
# Deploy functions
cd functions && npm run deploy

# Deploy Firestore rules
firebase deploy --only firestore:rules,firestore:indexes

# Deploy storage rules
firebase deploy --only storage
```

## 📦 Project Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run on web |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Run Jest tests |
| `npm run format` | Format with Prettier |
| `npm run build:android` | EAS Android build |
| `npm run build:ios` | EAS iOS build |

## 🔒 Security

- Firestore rules enforce data access control
- Storage rules protect file uploads
- API keys restricted by platform/bundle ID
- No secrets in source code (use `.env`)
- Authentication required for all writes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Documentation: [docs.communityevents.app](https://docs.communityevents.app)
- Issues: [GitHub Issues](https://github.com/your-org/community-events-app/issues)
- Email: support@communityevents.app