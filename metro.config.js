const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add TypeScript support
config.resolver.sourceExts.push('ts', 'tsx');

// Add support for path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@navigation': path.resolve(__dirname, 'src/navigation'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@context': path.resolve(__dirname, 'src/context'),
  '@types': path.resolve(__dirname, 'src/types'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@constants': path.resolve(__dirname, 'src/constants'),
  '@assets': path.resolve(__dirname, 'src/assets'),
};

// Enable package exports
config.resolver.unstable_enablePackageExports = true;

// Increase max workers for faster builds
config.maxWorkers = 4;

// Watchman configuration
config.watchFolders = [
  path.resolve(__dirname, 'src'),
];

// Custom transformer for better performance
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Block list for unnecessary files
config.resolver.blockList = [
  /node_modules\/.*\/__tests__\/.*/,
  /node_modules\/.*\/__mocks__\/.*/,
  /\.git\/.*/,
];

module.exports = config;