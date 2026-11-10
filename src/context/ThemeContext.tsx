// =============================================================================
// COMMUNITY EVENTS APP - THEME CONTEXT
// =============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useColorScheme, ColorSchemeName, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from './AppContext';

const THEME_KEY = '@community_events_theme';

// -----------------------------------------------------------------------------
// COLOR PALETTE
// -----------------------------------------------------------------------------
export const Colors = {
  light: {
    // Primary
    primary: '#4285F4',
    primaryLight: '#E8F0FE',
    primaryDark: '#1A73E8',
    primaryText: '#FFFFFF',

    // Secondary
    secondary: '#34A853',
    secondaryLight: '#E6F4EA',
    secondaryDark: '#1E8E3E',
    secondaryText: '#FFFFFF',

    // Accent
    accent: '#EA4335',
    accentLight: '#FCE8E6',
    accentDark: '#D93025',
    accentText: '#FFFFFF',

    // Warning
    warning: '#FBBC04',
    warningLight: '#FEF7E0',
    warningDark: '#F9A825',
    warningText: '#000000',

    // Background
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundTertiary: '#F1F3F4',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F9FA',

    // Text
    textPrimary: '#202124',
    textSecondary: '#5F6368',
    textTertiary: '#80868B',
    textInverse: '#FFFFFF',
    textDisabled: '#9AA0A6',

    // Border
    border: '#DADCE0',
    borderLight: '#E8EAED',
    borderDark: '#BDC1C6',

    // Status
    success: '#34A853',
    error: '#EA4335',
    info: '#4285F4',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
  },
  dark: {
    // Primary
    primary: '#8AB4F8',
    primaryLight: '#1A73E8',
    primaryDark: '#4285F4',
    primaryText: '#000000',

    // Secondary
    secondary: '#81C995',
    secondaryLight: '#1E8E3E',
    secondaryDark: '#34A853',
    secondaryText: '#000000',

    // Accent
    accent: '#F28B82',
    accentLight: '#D93025',
    accentDark: '#EA4335',
    accentText: '#000000',

    // Warning
    warning: '#FDD663',
    warningLight: '#F9A825',
    warningDark: '#FBBC04',
    warningText: '#000000',

    // Background
    background: '#202124',
    backgroundSecondary: '#292A2D',
    backgroundTertiary: '#303134',
    surface: '#292A2D',
    surfaceSecondary: '#303134',

    // Text
    textPrimary: '#E8EAED',
    textSecondary: '#9AA0A6',
    textTertiary: '#80868B',
    textInverse: '#202124',
    textDisabled: '#5F6368',

    // Border
    border: '#3C4043',
    borderLight: '#5F6368',
    borderDark: '#292A2D',

    // Status
    success: '#81C995',
    error: '#F28B82',
    info: '#8AB4F8',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ColorPalette = typeof Colors.light;

// -----------------------------------------------------------------------------
// SPACING
// -----------------------------------------------------------------------------
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type SpacingKey = keyof typeof Spacing;

// -----------------------------------------------------------------------------
// TYPOGRAPHY
// -----------------------------------------------------------------------------
export const Typography = {
  // Font families
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'monospace',
  },

  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  weights: {
    regular: '400',
    medium: '500',
    bold: '700',
  },

  // Presets
  presets: {
    displayLarge: { fontSize: 40, lineHeight: 48, fontWeight: '700' as const },
    displayMedium: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
    displaySmall: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
    headlineLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
    headlineMedium: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
    headlineSmall: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
    titleLarge: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
    titleMedium: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
    titleSmall: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
    labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
    labelSmall: { fontSize: 10, lineHeight: 14, fontWeight: '500' as const },
  },
} as const;

// -----------------------------------------------------------------------------
// BORDER RADIUS
// -----------------------------------------------------------------------------
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// -----------------------------------------------------------------------------
// SHADOWS
// -----------------------------------------------------------------------------
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// -----------------------------------------------------------------------------
// THEME CONTEXT
// -----------------------------------------------------------------------------
interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  colors: ColorPalette;
  spacing: typeof Spacing;
  typography: typeof Typography;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// -----------------------------------------------------------------------------
// THEME PROVIDER
// -----------------------------------------------------------------------------
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings } = useApp();
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('light');

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved) {
          setColorSchemeState(saved as ColorScheme);
        } else if (settings.theme !== 'system') {
          setColorSchemeState(settings.theme as ColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, [settings.theme]);

  // Update theme when system preference changes (if set to system)
  useEffect(() => {
    if (settings.theme === 'system') {
      setColorSchemeState((systemColorScheme || 'light') as ColorScheme);
    }
  }, [systemColorScheme, settings.theme]);

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    try {
      await AsyncStorage.setItem(THEME_KEY, scheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, []);

  const effectiveColorScheme = settings.theme === 'system'
    ? (systemColorScheme || 'light')
    : settings.theme;

  const value: ThemeContextType = {
    colorScheme: effectiveColorScheme as ColorScheme,
    setColorScheme,
    colors: Colors[effectiveColorScheme as ColorScheme],
    spacing: Spacing,
    typography: Typography,
    borderRadius: BorderRadius,
    shadows: Shadows,
    isDark: effectiveColorScheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// -----------------------------------------------------------------------------
// THEMED STYLE HELPER
// -----------------------------------------------------------------------------
export const useThemedStyles = <T extends Record<string, any>>(
  stylesFn: (colors: ColorPalette, spacing: typeof Spacing, typography: typeof Typography) => T
): T => {
  const { colors, spacing, typography } = useTheme();
  return stylesFn(colors, spacing, typography);
};

export default ThemeProvider;