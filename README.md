# Community Events App

A React Native + Expo + TypeScript mobile app with Firebase backend for discovering and sharing community events.

## 🚀 Tech Stack

- **Framework**: React Native 0.74 + Expo 51
- **Language**: TypeScript 5.4
- **Navigation**: React Navigation 6 (Stack, Tabs, Drawer)
- **State Management**: Zustand + React Context
- **Backend**: Firebase (Auth, Firestore, Storage, Functions, Messaging)
- **Maps**: React Native Maps + Google Places Autocomplete
- **Calendar**: Expo Calendar
- **Location**: Expo Location
- **Notifications**: Expo Notifications + FCM
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
- Firebase CLI (`npm install -g firebase-tools`)
- iOS Simulator (macOS) / Android Studio

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

4. **Set up Firebase**
   ```bash
   firebase login
   firebase use <your-project-id>
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

- **Firebase**: API keys, project ID, etc. (from Firebase Console)
- **Google Maps/Places**: API keys (from Google Cloud Console)
- **Apple**: Team ID, APNS keys (for iOS pushes)
- **Expo**: Project ID, Owner (from expo.dev)
- **Optional**: Sentry, Analytics keys

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Storage
5. Set up Cloud Functions (Node.js 20)
6. Configure FCM for push notifications
7. Add iOS/Android apps in project settings
8. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

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
- 📴 **Offline Support**: Cached data with sync

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