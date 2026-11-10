module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react-native' }],
      '@babel/preset-typescript',
    ],
    plugins: [
      // React Native Reanimated (must be first)
      'react-native-reanimated/plugin',

      // Module resolver for path aliases
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@context': './src/context',
            '@types': './src/types',
            '@utils': './src/utils',
            '@constants': './src/constants',
            '@assets': './src/assets',
          },
        },
      ],

      // Inline requires for performance
      'react-native-reanimated/plugin',

      // Remove console.log in production
      ...(process.env.NODE_ENV === 'production'
        ? [
            ['transform-remove-console', { exclude: ['error', 'warn', 'info'] }],
          ]
        : []),

      // Optimize imports
      [
        'babel-plugin-transform-imports',
        {
          '@expo/vector-icons': {
            transform: '@expo/vector-icons/${member}',
            preventFullImport: true,
          },
          'date-fns': {
            transform: 'date-fns/${member}',
            preventFullImport: true,
          },
          'lodash': {
            transform: 'lodash/${member}',
            preventFullImport: true,
          },
        },
      ],
    ],
    env: {
      development: {
        plugins: [
          'react-native-reanimated/plugin',
        ],
      },
      production: {
        plugins: [
          'react-native-reanimated/plugin',
          ['transform-remove-console', { exclude: ['error', 'warn', 'info'] }],
        ],
      },
      test: {
        presets: ['jest-expo'],
        plugins: [
          'react-native-reanimated/plugin',
          '@babel/preset-typescript',
        ],
      },
    },
  };
};