# Contributing Guide

Thank you for your interest in contributing to Community Events App! This document provides guidelines and best practices for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (use `.nvmrc`)
- npm 9+
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g eas-cli`
- Firebase CLI: `npm install -g firebase-tools`
- Git
- iOS Simulator (macOS) / Android Studio

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/community-events-app.git
   cd community-events-app
   ```

3. Install dependencies:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

4. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with your development values
   ```

5. Start development server:
   ```bash
   npm start
   ```

## 📋 Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `style/` | Code style/formatting |
| `refactor/` | Code refactoring |
| `perf/` | Performance improvements |
| `test/` | Tests |
| `chore/` | Maintenance |
| `ci/` | CI/CD changes |

Examples:
- `feat/events/add-recurring-events`
- `fix/auth/email-verification-redirect`
- `refactor/hooks/simplify-use-events`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(events): add recurring event support

Add support for daily, weekly, and monthly recurring events
with custom end dates and exceptions.

Closes #123
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```
4. Push your branch
5. Open a Pull Request against `main`
6. Fill out the PR template
7. Request review from maintainers
8. Address feedback
9. Merge after approval

### PR Requirements

- ✅ All CI checks pass
- ✅ No linting errors
- ✅ TypeScript compiles without errors
- ✅ Tests pass
- ✅ Descriptive PR title and description
- ✅ Linked to related issue(s)
- ✅ Screenshots for UI changes
- ✅ Updated documentation if needed

## 🎨 Code Style

### TypeScript

- Use strict mode (enabled in `tsconfig.json`)
- Prefer `type` over `interface` for unions/intersections
- Use `const` assertions for literal types
- Avoid `any` - use `unknown` or proper types
- Use path aliases (`@/components`, `@/hooks`, etc.)

### React/React Native

- Use functional components with hooks
- Prefer composition over inheritance
- Use `React.memo()` for performance
- Follow React Hooks rules
- Use proper accessibility props

### Styling

- Use theme tokens from `useTheme()`
- Avoid hardcoded colors/spacing
- Use StyleSheet.create() for styles
- Follow 8px spacing grid

### File Organization

```
src/
├── components/
│   ├── ui/           # Base components
│   ├── forms/        # Form components
│   ├── events/       # Event-specific
│   ├── map/          # Map components
│   └── common/       # Shared components
├── screens/          # Screen components
├── navigation/       # Navigation config
├── services/         # API services
├── hooks/            # Custom hooks
├── context/          # React contexts
├── types/            # TypeScript types
├── utils/            # Utilities
├── constants/        # Constants
└── assets/           # Static assets
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `EventCard.tsx` |
| Hooks | camelCase + use | `useEvents.ts` |
| Types/Interfaces | PascalCase | `Event.ts` |
| Constants | UPPER_SNAKE_CASE | `API_URL` |
| Functions | camelCase | `formatDate()` |
| Files | PascalCase (components) / camelCase (others) | `EventCard.tsx`, `api.ts` |

## 🧪 Testing

### Writing Tests

- Place tests next to source files: `Component.test.tsx`
- Use descriptive test names: `should render event title when provided`
- Test behavior, not implementation
- Mock external dependencies
- Aim for >50% coverage

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific file
npm test -- EventCard.test.tsx
```

## 📦 Dependencies

### Adding Dependencies

1. Check if functionality exists in current deps
2. Prefer well-maintained, popular packages
2. Check bundle size impact: `npx expo install <package>`
3. Add to appropriate `package.json` (app or functions)
4. Update lockfile: `npm install`

### Updating Dependencies

```bash
# Check outdated
npm outdated

# Update (patch/minor)
npm update

# Major updates manually
npm install package@latest
```

## 🔧 Tools Configuration

### VS Code

Recommended extensions (in `.vscode/extensions.json`):
- ESLint
- Prettier
- TypeScript
- React Native Tools
- Expo Tools
- Tailwind CSS (if used)

Settings (in `.vscode/settings.json`):
- Format on save
- ESLint auto-fix on save
- Organize imports on save

### Git Hooks

Husky pre-commit hook runs:
- `lint-staged` on staged files
- ESLint + Prettier
- TypeScript type check

## 🐛 Bug Reports

Use the GitHub issue template with:

1. **Clear title**: `[Bug] Brief description`
2. **Environment**: OS, device, Expo version
3. **Steps to reproduce**: Numbered list
4. **Expected behavior**: What should happen
5. **Actual behavior**: What happens
6. **Screenshots/Videos**: If applicable
7. **Logs**: Relevant error messages

## 💡 Feature Requests

Use the GitHub issue template with:

1. **Clear title**: `[Feature] Brief description`
2. **Problem**: What problem does this solve?
3. **Proposed solution**: How should it work?
4. **Alternatives**: Other approaches considered
5. **Mockups**: UI designs if applicable
6. **Priority**: Low/Medium/High/Critical

## 📝 Documentation

### Code Documentation

- JSDoc for public APIs
- TypeScript types are self-documenting
- Comment complex logic
- Update README for new features

### Architecture Decisions

Record significant decisions in `docs/adr/` (Architecture Decision Records):

```
docs/adr/
├── 001-use-zustand-for-state.md
├── 002-firebase-over-supabase.md
└── 003-expo-router-vs-react-navigation.md
```

## 🔒 Security

- Report security issues privately to security@communityevents.app
- Don't commit secrets
- Follow secure coding practices
- Keep dependencies updated

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Accept responsibility for mistakes

### Enforcement

Violations may result in:
- Warning
- Temporary ban
- Permanent ban

Report violations to conduct@communityevents.app

## 🙏 Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- README acknowledgments

Thank you for contributing! 🎉