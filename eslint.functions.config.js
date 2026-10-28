// ESLint for the Cloud Functions package (functions/), run by the CI "firebase" job after
// `npm ci --prefix functions` so imports of firebase-admin / firebase-functions resolve:
//   npx eslint -c eslint.functions.config.js functions/src
// Same Expo base rules and banned imports as the app, with Node.js globals.
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  globalIgnores(['functions/lib/**', 'functions/node_modules/**']),
  expoConfig,
  {
    files: ['functions/src/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'axios', message: 'Use fetch with timeouts (functions/src/providers).' }] },
      ],
    },
  },
]);
