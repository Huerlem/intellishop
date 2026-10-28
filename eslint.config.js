// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

/**
 * Packages that must never be imported by the mobile app:
 * - AI provider SDKs: inference runs only in Cloud Functions with keys in Secret Manager.
 * - axios: V1 used it for scraping and unlicensed price APIs; network access to third parties
 *   goes through authenticated backend functions.
 */
const BANNED_APP_IMPORTS = [
  { name: '@google/generative-ai', message: 'AI calls must go through the secure backend (docs/AI_ARCHITECTURE.md).' },
  { name: '@google/genai', message: 'AI calls must go through the secure backend (docs/AI_ARCHITECTURE.md).' },
  { name: 'openai', message: 'AI calls must go through the secure backend (docs/AI_ARCHITECTURE.md).' },
  { name: '@anthropic-ai/sdk', message: 'AI calls must go through the secure backend (docs/AI_ARCHITECTURE.md).' },
  { name: 'axios', message: 'Third-party data access must go through authenticated backend functions.' },
];

/**
 * React Compiler rules that eslint-plugin-react-hooks v7 enables as errors in its recommended preset.
 * The V1 JavaScript screens and components predate them (e.g. components declared inside
 * components) and are rebuilt to the Figma V2 specification in milestone M4. Until then these rules
 * are warnings for legacy .js/.jsx files only; all new TypeScript code keeps them as errors.
 * Tracked in docs/M1_REPORT.md (lint debt).
 */
const REACT_COMPILER_RULES = [
  'config',
  'set-state-in-effect',
  'error-boundaries',
  'gating',
  'globals',
  'immutability',
  'preserve-manual-memoization',
  'purity',
  'refs',
  'set-state-in-render',
  'static-components',
  'use-memo',
];

const LEGACY_JS_FILES = [
  'app/**/*.jsx',
  'src/**/*.jsx',
  'components/**/*.{js,jsx}',
  'context/**/*.jsx',
  'hooks/**/*.js',
  'errors/**/*.jsx',
];

module.exports = defineConfig([
  // functions/ is a separate npm package (own node_modules); it is linted in the CI "firebase" job
  // with eslint.functions.config.js after `npm ci --prefix functions`. legal-site/dist is generated.
  globalIgnores(['dist/*', 'docs/*', 'node_modules/*', '.expo/*', 'ios/*', 'android/*', 'functions/**', 'legal-site/dist/**']),
  expoConfig,
  {
    // Node.js scripts and configuration files.
    files: ['scripts/**/*.{js,mjs,cjs}', '*.config.js', '*.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: LEGACY_JS_FILES,
    rules: Object.fromEntries(REACT_COMPILER_RULES.map((rule) => [`react-hooks/${rule}`, 'warn'])),
  },
  {
    files: ['app/**/*', 'src/**/*', 'components/**/*', 'context/**/*', 'hooks/**/*', 'firebase/**/*', 'errors/**/*', 'utils/**/*', 'constants/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: BANNED_APP_IMPORTS,
          patterns: [
            {
              group: ['**/__tests__/fixtures/**'],
              message: 'Test fixtures must never be imported by app code.',
            },
          ],
        },
      ],
    },
  },
]);
