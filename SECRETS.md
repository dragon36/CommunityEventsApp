# Secrets Management Guide

This document explains how to manage secrets and sensitive configuration for the Community Events App.

## 🔐 Secret Categories

### 1. Client-Side Secrets (Expo Public)
These are **safe to include in the app bundle** and are prefixed with `EXPO_PUBLIC_`:

- Firebase API keys (web API key, auth domain, project ID, etc.)
- Google Maps API keys (restricted by bundle ID/package name)
- Google Places API keys
- Analytics IDs (GA, Segment, etc.)

**Storage**: `.env` files (gitignored) or EAS Secrets

### 2. Server-Side Secrets (Firebase Functions)
These must **NEVER** be included in the client bundle:

- Firebase Admin SDK private key
- SMTP credentials
- Google OAuth client secret
- Stripe secret keys
- Sentry DSN (server)
- External API keys

**Storage**: Firebase Functions config or EAS Secrets

### 3. Build/Deploy Secrets
- Apple Developer certificates/provisioning profiles
- Google Play service account key
- EAS credentials
- Code signing certificates

## 📁 File Structure

```
.env                          # Local development (gitignored)
.env.development              # Development template
.env.example                  # Template for all environments
.env.production               # Production template (gitignored)
functions/.env                # Functions local (gitignored)
functions/.env.example        # Functions template
```

## 🛠️ Setting Up Secrets

### Local Development

1. Copy template files:
   ```bash
   cp .env.example .env
   cp functions/.env.example functions/.env
   ```

2. Fill in your values from Firebase Console, Google Cloud Console, etc.

3. For iOS/Android specific keys, create:
   - `google-services.json` (Android) in project root
   - `GoogleService-Info.plist` (iOS) in project root

### EAS Build Secrets

Set secrets in EAS for CI/CD builds:

```bash
# Client-side secrets
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-key"
eas secret:create --scope project --name EXPO_IOS_GOOGLE_MAPS_API_KEY --value "your-key"
eas secret:create --scope project --name EXPO_ANDROID_GOOGLE_MAPS_API_KEY --value "your-key"

# Server-side secrets (for functions)
eas secret:create --scope project --name FIREBASE_ADMIN_PRIVATE_KEY --value "$(cat service-account.json)"
eas secret:create --scope project --name SMTP_PASS --value "your-password"
```

### Firebase Functions Config

Set secrets for deployed functions:

```bash
firebase functions:config:set \
  smtp.host="smtp.gmail.com" \
  smtp.port="587" \
  smtp.user="your-email" \
  smtp.pass="your-password" \
  google.client_id="your-client-id" \
  google.client_secret="your-client-secret"
```

View current config:
```bash
firebase functions:config:get
```

## 🔒 Security Best Practices

### DO:
- ✅ Use `EXPO_PUBLIC_` prefix for client-safe variables
- ✅ Restrict API keys by bundle ID / package name / referrer
- ✅ Rotate keys periodically (every 90 days)
- ✅ Use separate Firebase projects for dev/staging/prod
- ✅ Enable App Check for Firebase services
- ✅ Use short-lived tokens where possible

### DON'T:
- ❌ Commit `.env` files to git
- ❌ Put server secrets in client bundle
- ❌ Share API keys in chat/email
- ❌ Use production keys in development
- ❌ Hardcode secrets in source code
- ❌ Use unrestricted API keys

## 🔄 Key Rotation

### Monthly:
- Rotate SMTP passwords
- Rotate external API keys

### Quarterly:
- Rotate Firebase Admin SDK keys
- Rotate Google OAuth credentials
- Review and revoke unused keys

### Annually:
- Rotate Apple Developer certificates
- Rotate Google Play service account
- Review all secret access

## 🚨 Incident Response

If a secret is compromised:

1. **Immediately** revoke/regenerate the compromised key
2. Update all environments (local, CI/CD, production)
3. Check audit logs for unauthorized access
4. Rotate related keys
5. Document incident and update procedures

## 📋 Checklist for New Environments

- [ ] Create new Firebase project
- [ ] Enable required Firebase services
- [ ] Create iOS/Android apps in Firebase
- [ ] Download config files
- [ ] Set up Google Cloud project
- [ ] Enable Maps/Places APIs
- [ ] Create restricted API keys
- [ ] Set up EAS project
- [ ] Configure EAS secrets
- [ ] Set up Firebase Functions config
- [ ] Configure Sentry project
- [ ] Set up monitoring/alerts
- [ ] Document all keys in password manager

## 🔗 Useful Links

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/)
- [Firebase Functions Config](https://firebase.google.com/docs/functions/config-env)
- [Google Cloud API Keys](https://cloud.google.com/docs/authentication/api-keys)
- [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates/list)
- [Google Play Console](https://play.google.com/console)