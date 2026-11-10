# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure
- React Native + Expo + TypeScript setup
- Firebase integration (Auth, Firestore, Storage, Functions, Messaging)
- React Navigation 6 with Stack, Tabs, and Drawer
- Theme system with light/dark mode
- Custom UI components (Button, Input, Card, Avatar, etc.)
- Form components (Select, Checkbox, Switch, Textarea, DatePicker)
- Custom hooks for data fetching and state management
- Authentication context and screens
- App context for global state
- Events list and detail screens
- Map view with event markers
- Search functionality
- User profiles and settings
- Push notifications with FCM
- Image upload and processing
- Content moderation
- Calendar sync
- Analytics aggregation
- EAS Build configuration
- Comprehensive TypeScript types
- Jest testing setup
- ESLint + Prettier configuration

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## [1.0.0] - TBD

### Added
- Initial release

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | TBD | Initial release |

---

## Release Process

1. Update version in `package.json` and `app.config.ts`
2. Update this CHANGELOG.md
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions will build and deploy
6. Create GitHub Release with changelog

---

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Reverting a previous commit

### Examples

```
feat(events): add event recurrence support
fix(auth): resolve email verification redirect
docs(readme): update setup instructions
style(ui): standardize button border radius
refactor(hooks): simplify useEvents hook
perf(map): optimize marker clustering
test(events): add integration tests for RSVP
chore(deps): update expo to 51.0.0
ci(github): add e2e test workflow
build(eas): configure production profile
revert: revert "feat(events): add recurrence"
```